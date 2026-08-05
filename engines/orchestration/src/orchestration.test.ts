import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { computeAgentHealthScore, loadMetricsSnapshot, recordAgentExecution } from '@aios/status';
import { runWorkflow } from './index.ts';

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
