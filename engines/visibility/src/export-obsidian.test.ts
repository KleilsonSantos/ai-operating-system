import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { assertSafeObsidianOutDir, exportObsidian, noteBasename } from './export-obsidian.js';

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function miniRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 'aios-obs-'));
  temps.push(root);
  writeFileSync(join(root, 'package.json'), '{"name":"aios-obs-fixture"}');
  mkdirSync(join(root, 'policies'));
  writeFileSync(
    join(root, 'policies', 'aios.policies.json'),
    JSON.stringify({ policies: [{ id: 'official-docs', description: 'd', severity: 'must' }] })
  );
  mkdirSync(join(root, 'docs', 'adr'), { recursive: true });
  writeFileSync(join(root, 'docs', 'adr', '0001.md'), '# ADR');
  mkdirSync(join(root, 'engines', 'visibility'), { recursive: true });
  writeFileSync(join(root, 'engines', 'visibility', 'package.json'), '{"name":"@aios/visibility"}');
  return root;
}

describe('noteBasename', () => {
  it('sanitizes node ids', () => {
    expect(noteBasename('engine:engines/visibility')).toBe('engine-engines-visibility');
  });
});

describe('assertSafeObsidianOutDir', () => {
  it('rejects outDir inside policies or docs/adr', () => {
    const home = miniRepo();
    expect(() =>
      assertSafeObsidianOutDir(join(home, 'policies'), { homePath: home, repoPath: home })
    ).toThrow(/policies/);
    expect(() =>
      assertSafeObsidianOutDir(join(home, 'docs', 'adr', 'vault'), {
        homePath: home,
        repoPath: home,
      })
    ).toThrow(/docs\/adr/);
  });
});

describe('exportObsidian', () => {
  it('writes index + graph notes under .aios/export/obsidian by default', () => {
    const home = miniRepo();
    const result = exportObsidian({ homePath: home, repoPath: home });
    expect(result.outDir).toBe(join(home, '.aios', 'export', 'obsidian'));
    expect(result.nodeCount).toBeGreaterThan(0);
    expect(result.written).toContain('index.md');
    expect(result.written).toContain('README.md');
    expect(result.written.some((p) => p.startsWith('graph/'))).toBe(true);
    expect(existsSync(join(result.outDir, 'index.md'))).toBe(true);
    const index = readFileSync(join(result.outDir, 'index.md'), 'utf8');
    expect(index).toMatch(/aios_kind: export-index/);
    expect(index).toMatch(/\[\[graph\//);
    // canon untouched
    expect(readFileSync(join(home, 'docs', 'adr', '0001.md'), 'utf8')).toBe('# ADR');
  });

  it('writes optional run note and respects custom --out', () => {
    const home = miniRepo();
    const out = join(home, 'vault-out');
    const result = exportObsidian({
      homePath: home,
      repoPath: home,
      outDir: out,
      runId: 'run-demo-1',
      run: {
        runId: 'run-demo-1',
        taskId: 'task-1',
        intentKind: 'explain.code',
        policyIds: [],
        agentIds: [],
        skillIds: [],
        hookIds: [],
        steps: [
          {
            stepId: 's1',
            kind: 'policy',
            status: 'ok',
          },
        ],
        artifacts: [],
      },
    });
    expect(result.runNote).toBe('runs/run-demo-1');
    const runMd = readFileSync(join(out, 'runs', 'run-demo-1.md'), 'utf8');
    expect(runMd).toMatch(/aios_run_id: run-demo-1/);
    expect(runMd).toMatch(/s1/);
  });

  it('filters by scope when fullGraph is false', () => {
    const home = miniRepo();
    const result = exportObsidian({
      homePath: home,
      repoPath: home,
      outDir: join(home, 'scoped'),
      fullGraph: false,
      scope: 'engines/visibility',
    });
    expect(result.nodeCount).toBeGreaterThan(0);
    expect(result.nodeCount).toBeLessThan(20);
  });
});
