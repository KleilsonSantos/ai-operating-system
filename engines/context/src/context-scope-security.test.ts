import { mkdirSync, mkdtempSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { gatherContext, validateContextScope } from '../src/index.ts';

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function miniRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 'aios-ctx-sec-'));
  temps.push(root);
  mkdirSync(join(root, '.git'));
  mkdirSync(join(root, 'engines', 'demo', 'src'), { recursive: true });
  writeFileSync(join(root, 'README.md'), '# Fixture');
  writeFileSync(join(root, 'package.json'), '{"name":"fixture","private":true}');
  writeFileSync(join(root, 'engines', 'demo', 'src', 'index.ts'), 'export const x = 1\n');
  return root;
}

describe('validateContextScope', () => {
  it('accepts repo root and in-repo relative scopes', () => {
    const root = miniRepo();
    expect(validateContextScope(root, '.')).toEqual({
      ok: true,
      scope: '.',
      scopeAbs: resolve(root),
    });
    expect(validateContextScope(root, 'engines/demo')).toEqual({
      ok: true,
      scope: 'engines/demo',
      scopeAbs: join(root, 'engines', 'demo'),
    });
  });

  it('rejects absolute scope paths', () => {
    const root = miniRepo();
    const result = validateContextScope(root, '/etc/passwd');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('scope-absolute');
  });

  it('rejects traversal that escapes repo root', () => {
    const root = miniRepo();
    for (const scope of ['../../etc', 'engines/../../..', '../README.md']) {
      const result = validateContextScope(root, scope);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('scope-escape');
    }
  });

  it('reports scope-missing for unknown in-repo paths', () => {
    const root = miniRepo();
    const result = validateContextScope(root, 'does/not/exist');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('scope-missing');
  });
});

describe('gatherContext — adversarial scope', () => {
  it('returns empty snippets + scope-escape for ../../ traversal', () => {
    const root = miniRepo();
    const bundle = gatherContext({ repoPath: root, scope: '../../etc' });
    expect(bundle.snippets).toEqual([]);
    expect(bundle.signals).toContain('scope-escape');
  });

  it('returns empty snippets + scope-absolute for absolute scope', () => {
    const root = miniRepo();
    const bundle = gatherContext({ repoPath: root, scope: '/tmp/evil-scope' });
    expect(bundle.snippets).toEqual([]);
    expect(bundle.signals).toContain('scope-absolute');
  });

  it('does not leak files outside repo via symlink under scope directory', () => {
    const root = miniRepo();
    const outside = mkdtempSync(join(tmpdir(), 'aios-ctx-out-'));
    temps.push(outside);
    writeFileSync(join(outside, 'LEAK.md'), '# Outside repo secret');
    mkdirSync(join(root, 'engines', 'trap'));
    symlinkSync(outside, join(root, 'engines', 'trap', 'outside'), 'dir');

    const bundle = gatherContext({
      repoPath: root,
      scope: 'engines/trap',
      maxSnippets: 50,
    });
    expect(bundle.snippets.every((s) => !s.content.includes('Outside repo secret'))).toBe(true);
    expect(bundle.snippets.every((s) => !s.path.includes('LEAK.md'))).toBe(true);
  });

  it('rejects scope when symlink target resolves outside repo', () => {
    const root = miniRepo();
    const outside = mkdtempSync(join(tmpdir(), 'aios-ctx-out2-'));
    temps.push(outside);
    mkdirSync(join(root, 'engines', 'trap'));
    symlinkSync(outside, join(root, 'engines', 'trap', 'outside'), 'dir');

    const bundle = gatherContext({
      repoPath: root,
      scope: 'engines/trap/outside',
      maxSnippets: 50,
    });
    expect(bundle.snippets).toEqual([]);
    expect(bundle.signals).toContain('scope-escape');
  });

  it('still gathers in-repo scope when cwd differs', () => {
    const root = miniRepo();
    const other = mkdtempSync(join(tmpdir(), 'aios-ctx-cwd-'));
    temps.push(other);
    const prev = process.cwd();
    try {
      process.chdir(other);
      const bundle = gatherContext({ repoPath: root, scope: 'engines/demo' });
      expect(bundle.snippets.some((s) => s.path === 'engines/demo/src/index.ts')).toBe(true);
    } finally {
      process.chdir(prev);
    }
  });
});
