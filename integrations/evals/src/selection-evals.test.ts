import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { loadGoldenTasks, runGoldenTask, runSelectionEval } from './run-selection.ts';

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function miniRepo(): { repo: string; home: string } {
  const home = mkdtempSync(join(tmpdir(), 'aios-evals-'));
  temps.push(home);
  const repo = join(home, 'repo');
  mkdirSync(repo);
  mkdirSync(join(repo, '.git'));
  writeFileSync(join(repo, 'README.md'), '# Evals fixture\n');
  writeFileSync(
    join(repo, 'package.json'),
    JSON.stringify({ name: 'evals-fixture', private: true })
  );
  return { repo, home };
}

describe('selection eval harness (#447)', () => {
  it('loads at least 5 golden fixtures', () => {
    const tasks = loadGoldenTasks();
    expect(tasks.length).toBeGreaterThanOrEqual(5);
    expect(new Set(tasks.map((t) => t.id)).size).toBe(tasks.length);
  });

  it('passes all selection-mode goldens', () => {
    const tasks = loadGoldenTasks().filter((t) => t.mode !== 'pipeline');
    expect(tasks.length).toBeGreaterThanOrEqual(5);
    const failed = tasks.map(runSelectionEval).filter((r) => !r.ok);
    expect(failed).toEqual([]);
  });

  it('pipeline golden records skill ids and act=false', async () => {
    const task = loadGoldenTasks().find((t) => t.id === 'pipeline-skill-record');
    expect(task).toBeDefined();
    const { repo, home } = miniRepo();
    const result = await runGoldenTask(task!, { repoPath: repo, homePath: home });
    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('pipeline golden verifies skill exitCriteria DecisionRecord (#520)', async () => {
    const task = loadGoldenTasks().find((t) => t.id === 'pipeline-skill-verify');
    expect(task).toBeDefined();
    const { repo, home } = miniRepo();
    // Point AIOS_HOME at monorepo so multi-cloud-honesty catalog resolves
    const monorepoRoot = join(import.meta.dirname, '../../..');
    const result = await runGoldenTask(task!, { repoPath: repo, homePath: monorepoRoot });
    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
    void home;
  });
});
