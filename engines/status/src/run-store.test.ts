import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import type { PipelineRun } from '@aios/shared';
import {
  listPipelineRuns,
  loadPipelineRun,
  persistPipelineRun,
  recordMcpToolAudit,
  shouldPersistPipelineRuns,
} from './index.ts';

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function sampleRun(runId = 'run-abc'): PipelineRun {
  return {
    runId,
    taskId: runId,
    intentKind: 'analyze.project',
    policyIds: ['official-docs'],
    agentIds: ['architecture'],
    skillIds: [],
    hookIds: [],
    steps: [{ stepId: 'classify-1', kind: 'classify', status: 'ok', detail: 'analyze.project' }],
    decisions: [
      {
        id: 'intent:analyze.project',
        subject: 'intent',
        outcome: 'selected',
        value: 'analyze.project',
        stepId: 'classify-1',
      },
    ],
    artifacts: [],
    verdict: { passed: true, reasons: [] },
  };
}

describe('run store (#447)', () => {
  it('shouldPersistPipelineRuns defaults on and respects opt-out', () => {
    expect(shouldPersistPipelineRuns({})).toBe(true);
    expect(shouldPersistPipelineRuns({ AIOS_PERSIST_RUNS: '0' })).toBe(false);
    expect(shouldPersistPipelineRuns({ AIOS_PERSIST_RUNS: 'false' })).toBe(false);
    expect(shouldPersistPipelineRuns({ AIOS_PERSIST_RUNS: '1' })).toBe(true);
  });

  it('persists, loads, and lists runs under .aios/runs/', () => {
    const home = mkdtempSync(join(tmpdir(), 'aios-runs-'));
    temps.push(home);
    const path = persistPipelineRun(sampleRun('run-1'), {
      homePath: home,
      at: '2026-09-13T12:00:00.000Z',
    });
    expect(path).toContain('.aios/runs/run-1.json');
    const raw = JSON.parse(readFileSync(path, 'utf8')) as { kind: string; run: PipelineRun };
    expect(raw.kind).toBe('pipeline.run');
    expect(raw.run.runId).toBe('run-1');

    persistPipelineRun(sampleRun('run-2'), {
      homePath: home,
      at: '2026-09-13T12:01:00.000Z',
    });
    const loaded = loadPipelineRun('run-1', { homePath: home });
    expect(loaded?.run.steps[0]?.kind).toBe('classify');
    expect(loaded?.run.decisions?.[0]?.subject).toBe('intent');
    expect(loadPipelineRun('../evil', { homePath: home })).toBeUndefined();

    const listed = listPipelineRuns({ homePath: home, limit: 10 });
    expect(listed.map((r) => r.runId)).toEqual(['run-1', 'run-2']);
    expect(listed[1]?.verdictPassed).toBe(true);
  });

  it('recordMcpToolAudit appends kind mcp.tool', () => {
    const home = mkdtempSync(join(tmpdir(), 'aios-mcp-audit-'));
    temps.push(home);
    recordMcpToolAudit(
      {
        tool: 'aios_contract_version',
        allowed: true,
        caller: 'READ',
        source: 'test',
      },
      { homePath: home }
    );
    recordMcpToolAudit(
      {
        tool: 'aios_workspace_remove',
        allowed: false,
        reason: 'privilege',
        source: 'test',
      },
      { homePath: home }
    );
    const lines = readFileSync(join(home, '.aios', 'metrics', 'events.jsonl'), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as { kind: string; allowed?: boolean; tool?: string });
    expect(lines).toHaveLength(2);
    expect(lines.every((e) => e.kind === 'mcp.tool')).toBe(true);
    expect(lines[0]?.tool).toBe('aios_contract_version');
    expect(lines[1]?.allowed).toBe(false);
  });
});
