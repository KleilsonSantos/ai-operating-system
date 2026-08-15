import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { computeAgentHealthScore, loadMetricsSnapshot, recordAgentExecution } from '@aios/status';
import { pluginsFromRegistryNames, resolvePluginSource, runWorkflow } from './index.ts';

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('runWorkflow agent.execution metrics', () => {
  it('records agent.execution JSONL for ran plugins', async () => {
    const home = mkdtempSync(join(tmpdir(), 'aios-orch-'));
    temps.push(home);

    const out = await runWorkflow(
      {
        kind: 'analyze.project',
        raw: 'Analyze my project.',
        confidence: 1,
        signals: ['test'],
      },
      { homePath: home }
    );
    expect(out.ran.length).toBeGreaterThan(0);

    const file = join(home, '.aios', 'metrics', 'events.jsonl');
    const lines = readFileSync(file, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l) as { kind: string; agent: string; outcome: string });
    expect(lines.every((l) => l.kind === 'agent.execution')).toBe(true);
    expect(lines.length).toBe(out.ran.length);

    const snap = loadMetricsSnapshot({ homePath: home });
    expect(snap.agentExecution?.count).toBe(out.ran.length);
    expect(snap.agentExecution?.byAgent.length).toBeGreaterThan(0);
    expect(snap.agentExecution!.byAgent[0]!.healthScore).toBeGreaterThan(0);
  });
});

describe('computeAgentHealthScore', () => {
  it('scores perfect recent success near 100', () => {
    const score = computeAgentHealthScore({
      successCount: 10,
      totalCount: 10,
      lastAt: new Date().toISOString(),
      maxExecutionsSeen: 10,
    });
    expect(score).toBeGreaterThanOrEqual(90);
  });

  it('penalizes failures', () => {
    const score = computeAgentHealthScore({
      successCount: 1,
      totalCount: 10,
      lastAt: new Date().toISOString(),
      maxExecutionsSeen: 10,
    });
    expect(score).toBeLessThan(50);
  });
});

describe('registry-selected plugins', () => {
  it('defaults to builtin (env unset)', () => {
    expect(resolvePluginSource(undefined, {})).toBe('builtin');
    expect(resolvePluginSource(undefined, { AIOS_REGISTRY_PLUGINS: '1' })).toBe('registry');
    expect(resolvePluginSource('builtin', { AIOS_REGISTRY_PLUGINS: '1' })).toBe('builtin');
  });

  it('intersects registry names with known runners', () => {
    const plugins = pluginsFromRegistryNames([
      '@aios/agent-architecture',
      'community:someone/unknown',
      '@aios/agent-docs',
    ]);
    expect(plugins.map((p) => p.id)).toEqual(['architecture', 'docs']);
  });

  it('runs only registry-selected plugins when names are provided', async () => {
    const home = mkdtempSync(join(tmpdir(), 'aios-orch-reg-'));
    temps.push(home);
    const out = await runWorkflow(
      {
        kind: 'analyze.project',
        raw: 'Analyze my project.',
        confidence: 1,
        signals: ['test'],
      },
      {
        homePath: home,
        pluginSource: 'registry',
        registryAgentNames: ['@aios/agent-architecture'],
      }
    );
    expect(out.pluginSource).toBe('registry');
    expect(out.ran).toEqual(['architecture']);
    expect(out.skipped).toEqual([]);
  });

  it('falls back to builtin plugins when registry selection is empty', async () => {
    const home = mkdtempSync(join(tmpdir(), 'aios-orch-fb-'));
    temps.push(home);
    const out = await runWorkflow(
      {
        kind: 'analyze.project',
        raw: 'Analyze my project.',
        confidence: 1,
        signals: ['test'],
      },
      {
        homePath: home,
        pluginSource: 'registry',
        registryAgentNames: [],
      }
    );
    expect(out.ran.length).toBeGreaterThan(1);
    expect(out.ran).toContain('architecture');
    expect(out.ran).toContain('qa');
  });
});

describe('recordAgentExecution', () => {
  it('appends kind agent.execution', () => {
    const home = mkdtempSync(join(tmpdir(), 'aios-ae-'));
    temps.push(home);
    recordAgentExecution(
      { agent: '@aios/agent-docs', outcome: 'success', durationMs: 12, source: 'test' },
      { homePath: home }
    );
    const snap = loadMetricsSnapshot({ homePath: home });
    expect(snap.agentExecution?.count).toBe(1);
    expect(snap.agentExecution?.byAgent[0]?.agent).toBe('@aios/agent-docs');
  });
});
