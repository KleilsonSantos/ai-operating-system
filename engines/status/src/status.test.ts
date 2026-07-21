import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import {
  chatWithMetrics,
  getGovernanceStatus,
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
