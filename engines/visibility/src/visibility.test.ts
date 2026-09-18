import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import type { PipelineRun } from '@aios/shared';
import { recordAgentExecution, persistPipelineRun } from '@aios/status';
import { correlateVisibility } from './index.ts';

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function miniHome(): string {
  const root = mkdtempSync(join(tmpdir(), 'aios-vis-'));
  temps.push(root);
  writeFileSync(join(root, 'package.json'), '{"name":"aios-vis-fixture"}');
  mkdirSync(join(root, 'policies'));
  writeFileSync(
    join(root, 'policies', 'aios.policies.json'),
    JSON.stringify({
      policies: [
        { id: 'official-docs', description: 'docs', severity: 'must' },
        { id: 'anti-sycophancy', description: 'push back', severity: 'must' },
      ],
    })
  );
  mkdirSync(join(root, 'engines', 'policy'), { recursive: true });
  writeFileSync(join(root, 'engines', 'policy', 'package.json'), '{"name":"@aios/policy"}');
  return root;
}

describe('correlateVisibility', () => {
  it('requires an anchor', async () => {
    await expect(correlateVisibility({})).rejects.toThrow(/runId, scope, workspaceId/);
  });

  it('correlates scope + agent JSONL + policies into trail', async () => {
    const home = miniHome();
    recordAgentExecution(
      { agent: 'architecture', outcome: 'success', durationMs: 12, source: 'test' },
      { homePath: home }
    );
    recordAgentExecution(
      { agent: 'qa', outcome: 'failure', durationMs: 3, source: 'test' },
      { homePath: home }
    );

    const snap = await correlateVisibility({
      homePath: home,
      repoPath: home,
      scope: 'engines/policy',
      providerHealth: {
        provider: 'ollama',
        ok: true,
        baseUrl: 'http://127.0.0.1:11434',
      },
    });

    expect(snap.anchor.scope).toBe('engines/policy');
    expect(snap.policyRefs).toContain('official-docs');
    expect(snap.policyRefs).toContain('anti-sycophancy');
    expect(snap.agentExecutions?.map((e) => e.agent)).toEqual(
      expect.arrayContaining(['architecture', 'qa'])
    );
    expect(
      snap.trail.some((t) => t.kind === 'agent.execution' && t.label.includes('architecture'))
    ).toBe(true);
    expect(snap.trail.some((t) => t.kind === 'policy')).toBe(true);
    expect(snap.knowledge.nodeCount).toBeGreaterThan(0);
    expect(snap.runLookup).toBeUndefined();
  });

  it('marks runLookup unavailable when runId alone', async () => {
    const home = miniHome();
    const snap = await correlateVisibility({
      homePath: home,
      repoPath: home,
      runId: 'run-missing',
      providerHealth: {
        provider: 'ollama',
        ok: true,
        baseUrl: 'http://127.0.0.1:11434',
      },
    });
    expect(snap.runLookup).toBe('unavailable');
    expect(snap.run).toBeUndefined();
  });

  it('loads PipelineRun from .aios/runs when runId is given (#447)', async () => {
    const home = miniHome();
    const run: PipelineRun = {
      runId: 'run-disk',
      taskId: 'run-disk',
      intentKind: 'analyze.project',
      policyIds: ['official-docs'],
      agentIds: ['architecture'],
      skillIds: [],
      hookIds: [],
      steps: [
        { stepId: 'classify-1', kind: 'classify', status: 'ok', detail: 'analyze.project' },
        { stepId: 'gate-1', kind: 'gate', status: 'ok' },
      ],
      decisions: [
        {
          id: 'intent:analyze.project',
          subject: 'intent',
          outcome: 'selected',
          value: 'analyze.project',
          stepId: 'classify-1',
        },
        {
          id: 'gate:pass',
          subject: 'gate',
          outcome: 'passed',
          value: 'pass',
          stepId: 'gate-1',
        },
      ],
      artifacts: [],
      verdict: { passed: true, reasons: [] },
    };
    persistPipelineRun(run, { homePath: home });

    const snap = await correlateVisibility({
      homePath: home,
      repoPath: home,
      runId: 'run-disk',
      providerHealth: {
        provider: 'ollama',
        ok: true,
        baseUrl: 'http://127.0.0.1:11434',
      },
    });
    expect(snap.runLookup).toBe('provided');
    expect(snap.run?.runId).toBe('run-disk');
    expect(snap.trail.some((t) => t.kind === 'pipeline.step')).toBe(true);
  });

  it('accepts injected PipelineRun and builds step trail', async () => {
    const home = miniHome();
    const run: PipelineRun = {
      runId: 'run-1',
      taskId: 'task-1',
      intentKind: 'analyze.project',
      policyIds: ['official-docs'],
      agentIds: ['architecture'],
      skillIds: [],
      hookIds: [],
      steps: [
        { stepId: 'classify-1', kind: 'classify', status: 'ok', detail: 'analyze.project' },
        {
          stepId: 'agent:architecture',
          kind: 'agent',
          status: 'ok',
          agentId: 'architecture',
        },
        { stepId: 'gate-1', kind: 'gate', status: 'ok' },
      ],
      decisions: [
        {
          id: 'intent:analyze.project',
          subject: 'intent',
          outcome: 'selected',
          value: 'analyze.project',
          stepId: 'classify-1',
        },
        {
          id: 'agent:architecture:ran',
          subject: 'agent',
          outcome: 'selected',
          value: 'architecture',
          stepId: 'agent:architecture',
        },
        {
          id: 'gate:pass',
          subject: 'gate',
          outcome: 'passed',
          value: 'pass',
          stepId: 'gate-1',
        },
      ],
      artifacts: [],
      verdict: { passed: true, reasons: [] },
    };

    const snap = await correlateVisibility({
      homePath: home,
      repoPath: home,
      runId: 'run-1',
      run,
      providerHealth: {
        provider: 'ollama',
        ok: true,
        baseUrl: 'http://127.0.0.1:11434',
      },
    });

    expect(snap.run?.runId).toBe('run-1');
    expect(snap.runLookup).toBe('provided');
    expect(snap.trail.filter((t) => t.kind === 'pipeline.step').length).toBeGreaterThanOrEqual(3);
    expect(snap.trail.some((t) => t.kind === 'decision' && t.label.includes('intent'))).toBe(true);
  });
});
