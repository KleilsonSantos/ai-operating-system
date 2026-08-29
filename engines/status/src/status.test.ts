import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import {
  chatWithMetrics,
  getGovernanceStatus,
  loadMetricsSnapshot,
  loadAgentAdoptionSeries,
  listAgentExecutions,
  recordAgentExecution,
  recordMetricEvent,
  recordProviderChatMetric,
} from './index.ts';

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('getGovernanceStatus', () => {
  it('builds attention for provider down and workspace ok', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-status-'));
    temps.push(root);
    writeFileSync(join(root, 'package.json'), '{"name":"aios"}');
    mkdirSync(join(root, 'workspaces'));
    writeFileSync(
      join(root, 'workspaces', 'aios.workspaces.json'),
      JSON.stringify({
        workspaces: [{ id: 'aios', path: '.', name: 'AIOS', default: true }],
      })
    );
    mkdirSync(join(root, 'policies'));
    writeFileSync(
      join(root, 'policies', 'aios.policies.json'),
      JSON.stringify({
        policies: [{ id: 'official-docs', description: 'docs', severity: 'must' }],
      })
    );

    const status = await getGovernanceStatus({
      homePath: root,
      providerHealth: {
        provider: 'ollama',
        ok: false,
        baseUrl: 'http://127.0.0.1:11434',
        error: 'ECONNREFUSED',
      },
    });

    expect(status.contractVersion).toBe('1');
    expect(status.workspaces[0]?.ok).toBe(true);
    expect(status.policies.mustIds).toContain('official-docs');
    expect(status.attention.some((a) => a.id === 'provider-down')).toBe(true);
    expect(status.attention.find((a) => a.id === 'provider-down')?.severity).toBe('warn');
    expect(status.attention.some((a) => a.id === 'metrics-stub')).toBe(true);
    expect(status.exposed.mcpTools.length).toBeGreaterThan(5);
    expect(status.exposed.mcpToolPrivileges?.aios_run_pipeline).toBe('CONTROLLED_EXECUTION');
    expect(status.exposed.mcpToolPrivileges?.aios_workspace_remove).toBe('PRIVILEGED');
  });

  it('recordMetricEvent alone does not clear metrics-stub without provider.chat', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-status-m-'));
    temps.push(root);
    writeFileSync(join(root, 'package.json'), '{"name":"x"}');
    recordMetricEvent({ kind: 'test', n: 1 }, { homePath: root });
    const status = await getGovernanceStatus({
      homePath: root,
      providerHealth: {
        provider: 'ollama',
        ok: true,
        baseUrl: 'http://127.0.0.1:11434',
        models: ['llama'],
      },
    });
    expect(status.metrics.available).toBe(true);
    expect(status.metrics.eventCount).toBe(1);
    expect(status.attention.some((a) => a.id === 'metrics-stub')).toBe(true);
    expect(status.metrics.providerChat).toBeUndefined();
  });

  it('recordProviderChatMetric summarizes tokens and clears stub', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-status-chat-'));
    temps.push(root);
    writeFileSync(join(root, 'package.json'), '{"name":"x"}');
    recordProviderChatMetric(
      {
        provider: 'openai',
        model: 'gpt-4o-mini',
        ok: true,
        latencyMs: 42,
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        source: 'test',
      },
      { homePath: root }
    );
    recordProviderChatMetric(
      {
        provider: 'openai',
        model: 'gpt-4o-mini',
        ok: false,
        error: 'boom',
        source: 'test',
      },
      { homePath: root }
    );
    const status = await getGovernanceStatus({
      homePath: root,
      providerHealth: {
        provider: 'ollama',
        ok: true,
        baseUrl: 'http://127.0.0.1:11434',
        models: ['llama'],
      },
    });
    expect(status.metrics.providerChat).toEqual({
      count: 2,
      errorCount: 1,
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
    });
    expect(status.attention.some((a) => a.id === 'metrics-stub')).toBe(false);
    expect(status.attention.some((a) => a.id === 'provider-chat-errors')).toBe(true);
  });

  it('aggregates agent.execution and exposes healthScore', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-status-ae-'));
    temps.push(root);
    writeFileSync(join(root, 'package.json'), '{"name":"aios"}');
    mkdirSync(join(root, 'workspaces'));
    writeFileSync(
      join(root, 'workspaces', 'aios.workspaces.json'),
      JSON.stringify({
        workspaces: [{ id: 'aios', path: '.', name: 'AIOS', default: true }],
      })
    );
    mkdirSync(join(root, 'policies'));
    writeFileSync(
      join(root, 'policies', 'aios.policies.json'),
      JSON.stringify({
        policies: [{ id: 'official-docs', description: 'docs', severity: 'must' }],
      })
    );
    recordAgentExecution(
      { agent: '@aios/agent-docs', outcome: 'success', durationMs: 5, source: 'test' },
      { homePath: root }
    );
    recordAgentExecution(
      { agent: '@aios/agent-docs', outcome: 'failure', durationMs: 3, source: 'test' },
      { homePath: root }
    );
    const status = await getGovernanceStatus({
      homePath: root,
      providerHealth: {
        provider: 'ollama',
        ok: true,
        baseUrl: 'http://127.0.0.1:11434',
        models: ['llama'],
      },
    });
    expect(status.metrics.agentExecution?.count).toBe(2);
    expect(status.metrics.agentExecution?.errorCount).toBe(1);
    expect(status.metrics.agentExecution?.byAgent[0]?.healthScore).toBeGreaterThan(0);
    expect(status.attention.some((a) => a.id === 'agent-execution-errors')).toBe(true);
    expect(status.agents.length).toBeGreaterThanOrEqual(4);
    const docs = status.agents.find((a) => a.name === '@aios/agent-docs');
    expect(docs?.source).toBe('builtin');
    expect(docs?.executions).toBe(2);
    expect(docs?.healthScore).toBeGreaterThan(0);
    expect(docs?.executions7d).toBe(2);
    expect(status.metrics.agentExecution?.byAgent[0]?.count7d).toBeGreaterThan(0);
  });

  it('counts executions7d only within the rolling 7-day window', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-status-7d-'));
    temps.push(root);
    writeFileSync(join(root, 'package.json'), '{"name":"aios"}');
    const now = Date.parse('2026-08-07T12:00:00.000Z');
    mkdirSync(join(root, '.aios', 'metrics'), { recursive: true });
    writeFileSync(
      join(root, '.aios', 'metrics', 'events.jsonl'),
      [
        JSON.stringify({
          kind: 'agent.execution',
          agent: '@aios/agent-docs',
          outcome: 'success',
          at: '2026-08-05T12:00:00.000Z',
        }),
        JSON.stringify({
          kind: 'agent.execution',
          agent: '@aios/agent-docs',
          outcome: 'success',
          at: '2026-07-01T12:00:00.000Z',
        }),
      ].join('\n') + '\n'
    );
    const snap = loadMetricsSnapshot({ homePath: root, nowMs: now });
    const row = snap.agentExecution?.byAgent.find((a) => a.agent === '@aios/agent-docs');
    expect(row?.count).toBe(2);
    expect(row?.count7d).toBe(1);
  });

  it('builds adoption series by UTC day for 7d and 30d windows', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-status-adopt-'));
    temps.push(root);
    const now = Date.parse('2026-08-07T12:00:00.000Z');
    mkdirSync(join(root, '.aios', 'metrics'), { recursive: true });
    writeFileSync(
      join(root, '.aios', 'metrics', 'events.jsonl'),
      [
        JSON.stringify({
          kind: 'agent.execution',
          agent: '@aios/agent-docs',
          outcome: 'success',
          at: '2026-08-07T10:00:00.000Z',
        }),
        JSON.stringify({
          kind: 'agent.execution',
          agent: '@aios/agent-docs',
          outcome: 'success',
          at: '2026-08-06T10:00:00.000Z',
        }),
        JSON.stringify({
          kind: 'agent.execution',
          agent: '@aios/agent-qa',
          outcome: 'success',
          at: '2026-07-15T10:00:00.000Z',
        }),
      ].join('\n') + '\n'
    );
    const snap = loadMetricsSnapshot({ homePath: root, nowMs: now });
    expect(snap.agentExecution?.adoption7d?.total.reduce((a, b) => a + b, 0)).toBe(2);
    expect(snap.agentExecution?.adoption30d?.total.reduce((a, b) => a + b, 0)).toBe(3);
    expect(
      snap.agentExecution?.adoption7d?.byAgent['@aios/agent-docs']?.reduce((a, b) => a + b, 0)
    ).toBe(2);
    const series = loadAgentAdoptionSeries({ homePath: root, days: 7, nowMs: now });
    expect(series.days).toBe(7);
    expect(series.buckets).toHaveLength(7);
  });

  it('includes Agent Catalog rows from the registry without executions', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-status-catalog-'));
    temps.push(root);
    writeFileSync(join(root, 'package.json'), '{"name":"aios"}');
    const status = await getGovernanceStatus({
      homePath: root,
      providerHealth: {
        provider: 'ollama',
        ok: true,
        baseUrl: 'http://127.0.0.1:11434',
        models: ['llama'],
      },
    });
    expect(status.agents.some((a) => a.name === '@aios/agent-architecture')).toBe(true);
    expect(status.agents.every((a) => typeof a.version === 'string')).toBe(true);
    expect(
      status.agents.find((a) => a.name === '@aios/agent-architecture')?.executions
    ).toBeUndefined();
  });

  it('chatWithMetrics records success via injectable provider fetch', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-status-cwm-'));
    temps.push(root);
    writeFileSync(join(root, 'package.json'), '{"name":"x"}');

    const fetchMock: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          model: 'gpt-4o-mini',
          choices: [{ message: { role: 'assistant', content: 'hi' } }],
          usage: {
            prompt_tokens: 3,
            completion_tokens: 1,
            total_tokens: 4,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    // chatWithMetrics uses getProvider — inject via env + custom getProvider path:
    // Use OpenAI with mock by calling getProvider through a wrapper — instead
    // call record after manual chat is enough; test chatWithMetrics with openai
    // by temporarily setting API key and mocking global fetch.
    const prevKey = process.env.AIOS_OPENAI_API_KEY;
    const prevFetch = globalThis.fetch;
    process.env.AIOS_OPENAI_API_KEY = 'test-key';
    globalThis.fetch = fetchMock;
    try {
      const out = await chatWithMetrics({
        providerId: 'openai',
        request: { messages: [{ role: 'user', content: 'ping' }] },
        homePath: root,
        source: 'test',
      });
      expect(out.message.content).toBe('hi');
      expect(out.usage?.totalTokens).toBe(4);
      const status = await getGovernanceStatus({
        homePath: root,
        providerHealth: {
          provider: 'openai',
          ok: true,
          baseUrl: 'https://api.openai.com/v1',
        },
      });
      expect(status.metrics.providerChat?.count).toBe(1);
      expect(status.metrics.providerChat?.totalTokens).toBe(4);
    } finally {
      if (prevKey === undefined) delete process.env.AIOS_OPENAI_API_KEY;
      else process.env.AIOS_OPENAI_API_KEY = prevKey;
      globalThis.fetch = prevFetch;
    }
  });
});

describe('listAgentExecutions', () => {
  it('returns capped agent.execution rows newest-last', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-status-list-'));
    temps.push(root);
    recordAgentExecution({ agent: 'a', outcome: 'success' }, { homePath: root });
    recordAgentExecution({ agent: 'b', outcome: 'failure' }, { homePath: root });
    const rows = listAgentExecutions({ homePath: root, limit: 10 });
    expect(rows.map((r) => r.agent)).toEqual(['a', 'b']);
    expect(rows.every((r) => r.kind === 'agent.execution')).toBe(true);
  });
});
