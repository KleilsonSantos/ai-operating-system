import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import type { PipelineRun } from '@aios/shared';
import { persistPipelineRun } from './run-store.ts';
import { attentionFromRunDecisions, skimDecisionFailures } from './decision-attention.ts';
import { getGovernanceStatus } from './index.ts';

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
  delete process.env.AIOS_DECISION_ATTENTION;
});

function runWithDecisions(runId: string, decisions: PipelineRun['decisions']): PipelineRun {
  return {
    runId,
    taskId: runId,
    intentKind: 'analyze.project',
    policyIds: [],
    agentIds: [],
    skillIds: ['demo'],
    hookIds: [],
    steps: [],
    decisions,
    artifacts: [],
  };
}

describe('attentionFromRunDecisions (#524)', () => {
  it('emits only failed and denied', () => {
    const items = attentionFromRunDecisions(
      runWithDecisions('r1', [
        {
          id: 'skill:demo',
          subject: 'skill',
          outcome: 'failed',
          value: 'demo',
          reason: 'exitCriteria failed',
        },
        {
          id: 'skill:other',
          subject: 'skill',
          outcome: 'skipped',
          value: 'other',
        },
        {
          id: 'gate:fail',
          subject: 'gate',
          outcome: 'denied',
          value: 'deny',
        },
      ]),
      '2026-09-23T12:00:00.000Z'
    );
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.severity).sort()).toEqual(['error', 'warn']);
    expect(items.every((i) => i.detail.includes('runId=r1'))).toBe(true);
  });
});

describe('skimDecisionFailures (#524)', () => {
  it('surfaces newest failure into Attention via getGovernanceStatus', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-dec-att-'));
    temps.push(root);
    persistPipelineRun(
      runWithDecisions('run-old', [
        {
          id: 'skill:demo',
          subject: 'skill',
          outcome: 'failed',
          value: 'demo',
          reason: 'old',
        },
      ]),
      { homePath: root, at: '2026-09-23T10:00:00.000Z' }
    );
    persistPipelineRun(
      runWithDecisions('run-new', [
        {
          id: 'skill:demo',
          subject: 'skill',
          outcome: 'failed',
          value: 'demo',
          reason: 'new-fail',
        },
      ]),
      { homePath: root, at: '2026-09-23T11:00:00.000Z' }
    );

    const skimmed = skimDecisionFailures({ homePath: root });
    expect(skimmed.some((a) => a.id.startsWith('decision-fail-'))).toBe(true);
    expect(skimmed.find((a) => a.detail.includes('runId=run-new'))).toBeTruthy();

    const status = await getGovernanceStatus({
      homePath: root,
      providerHealth: {
        provider: 'ollama',
        ok: true,
        baseUrl: 'http://127.0.0.1:11434',
        models: ['llama'],
      },
    });
    expect(status.attention.some((a) => a.id.startsWith('decision-fail-'))).toBe(true);
  });

  it('respects AIOS_DECISION_ATTENTION=0', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-dec-off-'));
    temps.push(root);
    persistPipelineRun(
      runWithDecisions('run-x', [
        {
          id: 'skill:demo',
          subject: 'skill',
          outcome: 'failed',
          value: 'demo',
        },
      ]),
      { homePath: root }
    );
    process.env.AIOS_DECISION_ATTENTION = '0';
    expect(skimDecisionFailures({ homePath: root })).toEqual([]);
  });
});
