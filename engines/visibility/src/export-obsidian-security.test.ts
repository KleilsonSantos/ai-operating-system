import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import {
  assertSafeObsidianOutDir,
  exportObsidian,
  resolveObsidianOutDir,
} from './export-obsidian.js';

const temps: string[] = [];
let prevCwd: string | undefined;

afterEach(() => {
  if (prevCwd !== undefined) {
    process.chdir(prevCwd);
    prevCwd = undefined;
  }
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function miniRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 'aios-obs-sec-'));
  temps.push(root);
  writeFileSync(join(root, 'package.json'), '{"name":"aios-obs-sec-fixture"}');
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

function withCwd<T>(dir: string, fn: () => T): T {
  prevCwd = process.cwd();
  process.chdir(dir);
  return fn();
}

describe('resolveObsidianOutDir', () => {
  it('anchors relative outDir to homePath, not process cwd', () => {
    const home = miniRepo();
    const other = mkdtempSync(join(tmpdir(), 'aios-obs-cwd-'));
    temps.push(other);
    withCwd(other, () => {
      expect(resolveObsidianOutDir(home, 'vault/out')).toBe(join(home, 'vault', 'out'));
      expect(resolveObsidianOutDir(home, 'docs/adr/evil')).toBe(join(home, 'docs', 'adr', 'evil'));
    });
  });

  it('preserves absolute outDir', () => {
    const home = miniRepo();
    const abs = join(home, 'abs-vault');
    expect(resolveObsidianOutDir(home, abs)).toBe(resolve(abs));
  });

  it('defaults to .aios/export/obsidian under home', () => {
    const home = miniRepo();
    expect(resolveObsidianOutDir(home)).toBe(join(home, '.aios', 'export', 'obsidian'));
  });
});

describe('assertSafeObsidianOutDir — adversarial paths', () => {
  it('rejects direct policies and docs/adr targets', () => {
    const home = miniRepo();
    const roots = { homePath: home, repoPath: home };
    expect(() => assertSafeObsidianOutDir(join(home, 'policies'), roots)).toThrow(/policies/);
    expect(() => assertSafeObsidianOutDir(join(home, 'docs', 'adr'), roots)).toThrow(/docs\/adr/);
  });

  it('rejects nested paths under forbidden roots', () => {
    const home = miniRepo();
    const roots = { homePath: home, repoPath: home };
    expect(() =>
      assertSafeObsidianOutDir(join(home, 'policies', 'nested', 'vault'), roots)
    ).toThrow(/policies/);
    expect(() => assertSafeObsidianOutDir(join(home, 'docs', 'adr', 'vault'), roots)).toThrow(
      /docs\/adr/
    );
  });

  it('rejects relative outDir that escapes homePath', () => {
    const home = miniRepo();
    expect(() => resolveObsidianOutDir(home, '../docs/adr/vault')).toThrow(/homePath/);
  });

  it('rejects in-home traversal into forbidden roots', () => {
    const home = miniRepo();
    const roots = { homePath: home, repoPath: home };
    const viaPolicies = resolveObsidianOutDir(home, 'safe/../policies/out');
    expect(() => assertSafeObsidianOutDir(viaPolicies, roots)).toThrow(/policies/);
  });

  it('rejects symlink that resolves into policies', () => {
    const home = miniRepo();
    const trap = join(home, 'export-trap');
    mkdirSync(trap);
    symlinkSync(join(home, 'policies'), join(trap, 'policies-link'), 'dir');
    const outDir = join(trap, 'policies-link', 'vault');
    expect(() => assertSafeObsidianOutDir(outDir, { homePath: home, repoPath: home })).toThrow(
      /policies/
    );
  });

  it('checks repoPath forbidden roots when repo differs from home', () => {
    const home = miniRepo();
    const repo = mkdtempSync(join(tmpdir(), 'aios-obs-repo-'));
    temps.push(repo);
    mkdirSync(join(repo, 'docs', 'adr'), { recursive: true });
    mkdirSync(join(repo, 'policies'));
    writeFileSync(join(repo, 'docs', 'adr', '0001.md'), '# ADR');
    writeFileSync(join(repo, 'policies', 'aios.policies.json'), '{}');
    expect(() =>
      assertSafeObsidianOutDir(join(repo, 'policies', 'vault'), {
        homePath: home,
        repoPath: repo,
      })
    ).toThrow(/policies/);
  });

  it('allows safe vault paths outside forbidden trees', () => {
    const home = miniRepo();
    const roots = { homePath: home, repoPath: home };
    expect(() => assertSafeObsidianOutDir(join(home, 'vault-out'), roots)).not.toThrow();
    expect(() =>
      assertSafeObsidianOutDir(join(home, '.aios', 'export', 'obsidian'), roots)
    ).not.toThrow();
  });
});

describe('exportObsidian — CLI/MCP path vectors', () => {
  it('rejects docs/adr relative to AIOS_HOME regardless of process cwd', () => {
    const home = miniRepo();
    const other = mkdtempSync(join(tmpdir(), 'aios-obs-cwd2-'));
    temps.push(other);
    withCwd(other, () => {
      expect(() =>
        exportObsidian({ homePath: home, repoPath: home, outDir: 'docs/adr/vault' })
      ).toThrow(/docs\/adr/);
    });
  });

  it('rejects policies via home-anchored traversal before writing files', () => {
    const home = miniRepo();
    expect(() =>
      exportObsidian({ homePath: home, repoPath: home, outDir: 'policies/export-vault' })
    ).toThrow(/policies/);
    expect(() =>
      exportObsidian({ homePath: home, repoPath: home, outDir: 'docs/adr/../adr' })
    ).toThrow(/docs\/adr/);
    expect(() =>
      exportObsidian({ homePath: home, repoPath: home, outDir: '../docs/adr/vault' })
    ).toThrow(/homePath/);
  });

  it('writes only under safe home-anchored outDir when cwd differs', () => {
    const home = miniRepo();
    const other = mkdtempSync(join(tmpdir(), 'aios-obs-cwd3-'));
    temps.push(other);
    withCwd(other, () => {
      const result = exportObsidian({
        homePath: home,
        repoPath: home,
        outDir: 'external-vault',
      });
      expect(result.outDir).toBe(join(home, 'external-vault'));
      expect(result.written).toContain('index.md');
    });
  });
});
