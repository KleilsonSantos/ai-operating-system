import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { runPipeline, runAcrossWorkspaces, PIPELINE_CONTRACT_VERSION } from '../src/index.ts';

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function fixtureRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 'aios-pipe-'));
  temps.push(root);
  mkdirSync(join(root, '.git'));
  writeFileSync(join(root, 'README.md'), '# Pipe fixture\n');
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({ name: 'pipe-fixture', private: true })
  );
  return root;
}

describe('runPipeline', () => {
  it('responde contrato v1 para analyze', async () => {
    const repo = fixtureRepo();
    const res = await runPipeline({
      input: 'Analise meu projeto.',
      repoPath: repo,
    });
    expect(res.contractVersion).toBe(PIPELINE_CONTRACT_VERSION);
    expect(res.intent.kind).toBe('analyze.project');
    expect(res.workflow.ran.length).toBeGreaterThan(0);
    expect(res.verdict.checks).toBeDefined();
    expect(res.context.snippetCount).toBeGreaterThan(0);
    expect(res.knowledge?.nodeCount).toBeGreaterThan(0);
    expect(res.run?.runId).toBeTruthy();
    expect(res.run?.taskId).toBe(res.run?.runId);
    expect(res.run?.intentKind).toBe('analyze.project');
    expect(res.run?.agentIds).toEqual(res.workflow.ran);
    expect(res.run?.skillIds).toEqual([]);
    expect(res.run?.hookIds).toEqual([]);
    expect(res.run?.steps.some((s) => s.kind === 'hook' && s.status === 'skip')).toBe(true);
    expect(res.run?.steps.some((s) => s.kind === 'classify' && s.status === 'ok')).toBe(true);
    expect(res.run?.steps.some((s) => s.kind === 'gate')).toBe(true);
    expect(res.run?.verdict?.passed).toBe(res.verdict.passed);
    expect(res.run?.model?.capabilityClass).toBe('reasoning');
    expect(res.run?.model?.providerId).toBe('ollama');
    expect(res.run?.model?.complexity).toBe('COMPLEX');
    expect(res.run?.model?.privacy).toBe('internal');
    expect(res.run?.steps.some((s) => s.kind === 'route' && s.status === 'ok')).toBe(true);
    expect(res.context.budget?.tier).toBe('standard');
    expect(res.run?.steps.some((s) => s.kind === 'skill' && s.status === 'skip')).toBe(true);
  });

  it('records requested skill ids on run without loading a catalog', async () => {
    const repo = fixtureRepo();
    const res = await runPipeline({
      input: 'Analise meu projeto.',
      repoPath: repo,
      skillIds: ['governed-brief'],
    });
    expect(res.run?.skillIds).toEqual(['governed-brief']);
    expect(
      res.run?.steps.some(
        (s) => s.kind === 'skill' && s.status === 'ok' && s.detail === 'governed-brief'
      )
    ).toBe(true);
  });

  it('record.lifecycle emits a hook step per lifecycle point', async () => {
    const repo = fixtureRepo();
    const res = await runPipeline({
      input: 'Analise meu projeto.',
      repoPath: repo,
      hookIds: ['record.lifecycle'],
    });
    expect(res.run?.hookIds).toEqual(['record.lifecycle']);
    const hooks = res.run?.steps.filter((s) => s.kind === 'hook') ?? [];
    expect(hooks).toHaveLength(8);
    expect(hooks.every((s) => s.status === 'ok')).toBe(true);
    expect(hooks.map((s) => s.detail)).toEqual([
      'before.policy',
      'after.policy',
      'before.context',
      'after.context',
      'before.agent',
      'after.agent',
      'before.gate',
      'after.gate',
    ]);
  });

  it('skips unknown hook ids', async () => {
    const repo = fixtureRepo();
    const res = await runPipeline({
      input: 'Analise meu projeto.',
      repoPath: repo,
      hookIds: ['nope'],
    });
    expect(res.run?.hookIds).toEqual([]);
    expect(res.run?.steps.some((s) => s.kind === 'hook' && s.status === 'skip')).toBe(true);
  });

  it('costBudget=low força class fast e budget tight', async () => {
    const repo = fixtureRepo();
    const res = await runPipeline({
      input: 'Analise meu projeto.',
      repoPath: repo,
      costBudget: 'low',
    });
    expect(res.run?.model?.capabilityClass).toBe('fast');
    expect(res.context.budget?.tier).toBe('tight');
  });

  it('unknown não agenda plugins e falha o quality gate', async () => {
    const repo = fixtureRepo();
    const res = await runPipeline({ input: 'olá', repoPath: repo });
    expect(res.intent.kind).toBe('unknown');
    expect(res.workflow.ran).toEqual([]);
    expect(res.verdict.passed).toBe(false);
    expect(res.verdict.blockers).toContain('knownIntent');
    expect(res.capabilities?.act).toBe(false);
    expect(res.run?.agentIds).toEqual([]);
    expect(res.run?.steps.filter((s) => s.kind === 'agent').every((s) => s.status === 'skip')).toBe(
      true
    );
    expect(res.run?.model?.capabilityClass).toBe('fast');
    expect(res.context.budget?.tier).toBe('tight');
  });

  it('implement.feature is honest about missing ACT (#377)', async () => {
    const repo = fixtureRepo();
    const res = await runPipeline({
      input: 'Implement the recommended improvement.',
      repoPath: repo,
    });
    expect(res.intent.kind).toBe('implement.feature');
    expect(res.capabilities?.act).toBe(false);
    expect(res.capabilities?.reason).toMatch(/analysis-only/i);
    expect(res.results[0]?.findings).toContain('act.unavailable');
    expect(res.verdict.passed).toBe(false);
    expect(res.verdict.blockers).toContain('actAvailable');
    expect(res.verdict.checks.actAvailable).toBe(false);
  });

  it('analyze keeps capabilities.act=false without blocking', async () => {
    const repo = fixtureRepo();
    const res = await runPipeline({
      input: 'Analise meu projeto.',
      repoPath: repo,
    });
    expect(res.intent.kind).toBe('analyze.project');
    expect(res.capabilities?.act).toBe(false);
    expect(res.verdict.passed).toBe(true);
    expect(res.verdict.blockers).not.toContain('actAvailable');
  });

  it('runAcrossWorkspaces resume N workspaces', async () => {
    const home = mkdtempSync(join(tmpdir(), 'aios-pipe-across-'));
    temps.push(home);
    const target = join(home, 'target');
    mkdirSync(target);
    mkdirSync(join(target, '.git'));
    writeFileSync(join(target, 'README.md'), '# Target\n');
    writeFileSync(
      join(target, 'package.json'),
      JSON.stringify({ name: 'ws-target', private: true })
    );
    mkdirSync(join(home, 'workspaces'));
    writeFileSync(
      join(home, 'workspaces', 'aios.workspaces.json'),
      JSON.stringify({
        workspaces: [{ id: 'target', path: 'target', default: true }],
      })
    );
    const res = await runAcrossWorkspaces({
      input: 'Analise meu projeto.',
      homePath: home,
      workspaceIds: ['target'],
    });
    expect(res.results).toHaveLength(1);
    expect(res.results[0]!.workspaceId).toBe('target');
    expect(res.results[0]!.verdictPassed).toBe(true);
  });

  it('resolve workspaceId do registry', async () => {
    const home = mkdtempSync(join(tmpdir(), 'aios-pipe-ws-'));
    temps.push(home);
    const target = join(home, 'target');
    mkdirSync(target);
    mkdirSync(join(target, '.git'));
    writeFileSync(join(target, 'README.md'), '# Target\n');
    writeFileSync(
      join(target, 'package.json'),
      JSON.stringify({ name: 'ws-target', private: true })
    );
    mkdirSync(join(home, 'workspaces'));
    writeFileSync(
      join(home, 'workspaces', 'aios.workspaces.json'),
      JSON.stringify({
        workspaces: [{ id: 'target', path: 'target', default: true }],
      })
    );
    const { remember } = await import('@aios/memory');
    remember('target', 'use feature branches from sandbox', {
      homePath: home,
      tags: ['git'],
    });
    const prev = process.env.AIOS_HOME;
    process.env.AIOS_HOME = home;
    try {
      const res = await runPipeline({
        input: 'Analise meu projeto.',
        workspaceId: 'target',
      });
      expect(res.workspace?.id).toBe('target');
      expect(res.context.repoPath).toBe(target);
      expect(res.verdict.passed).toBe(true);
      expect(res.memory?.count).toBe(1);
      expect(res.memory?.entries[0]?.content).toContain('sandbox');
    } finally {
      if (prev === undefined) delete process.env.AIOS_HOME;
      else process.env.AIOS_HOME = prev;
    }
  });
});
