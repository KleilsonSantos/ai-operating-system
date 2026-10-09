import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import {
  checkMcpPathArgs,
  deniedPathResult,
  isMcpPathScopeEnabled,
  isPathInScope,
  rootsFromEnv,
} from './path-scope.ts';

let base: string;
let home: string;
let outside: string;

before(() => {
  base = realpathSync(mkdtempSync(join(tmpdir(), 'aios-path-scope-')));
  home = join(base, 'home');
  outside = join(base, 'outside');
  mkdirSync(join(home, 'repo'), { recursive: true });
  mkdirSync(outside, { recursive: true });
  symlinkSync(outside, join(home, 'escape'));
});

after(() => {
  rmSync(base, { recursive: true, force: true });
});

describe('isPathInScope', () => {
  it('accepts the root itself and existing or not-yet-created children', () => {
    assert.equal(isPathInScope(home, [home]), true);
    assert.equal(isPathInScope(join(home, 'repo'), [home]), true);
    assert.equal(isPathInScope(join(home, 'new', 'deep', 'file.json'), [home]), true);
  });

  it('rejects siblings, parents, and lookalike prefixes', () => {
    assert.equal(isPathInScope(outside, [home]), false);
    assert.equal(isPathInScope(base, [home]), false);
    assert.equal(isPathInScope(`${home}-evil`, [home]), false);
  });

  it('rejects traversal and symlink escapes', () => {
    assert.equal(isPathInScope(join(home, '..', 'outside'), [home]), false);
    assert.equal(isPathInScope(join(home, 'escape'), [home]), false);
    assert.equal(isPathInScope(join(home, 'escape', 'secret.txt'), [home]), false);
  });

  it('accepts any of several roots', () => {
    assert.equal(isPathInScope(outside, [home, outside]), true);
  });
});

describe('checkMcpPathArgs', () => {
  const opts = () => ({ roots: [home], home, cwd: home });

  it('allows calls without path arguments and ignores non-string values', () => {
    assert.deepEqual(checkMcpPathArgs({ input: 'x' }, opts()), { ok: true });
    assert.deepEqual(checkMcpPathArgs({ repoPath: 42, homePath: '  ' }, opts()), { ok: true });
    assert.deepEqual(checkMcpPathArgs(undefined, opts()), { ok: true });
    assert.deepEqual(checkMcpPathArgs(['repoPath'], opts()), { ok: true });
  });

  it('allows in-scope absolute and cwd-relative paths', () => {
    assert.deepEqual(checkMcpPathArgs({ repoPath: join(home, 'repo') }, opts()), { ok: true });
    assert.deepEqual(checkMcpPathArgs({ repoPath: 'repo' }, opts()), { ok: true });
  });

  it('denies each path-like key outside scope and names the argument', () => {
    for (const key of [
      'repoPath',
      'homePath',
      'workspacesPath',
      'policiesPath',
      'outDir',
      'path',
    ]) {
      assert.deepEqual(checkMcpPathArgs({ [key]: outside }, opts()), { ok: false, arg: key });
    }
  });

  it('denies relative traversal out of scope', () => {
    assert.deepEqual(checkMcpPathArgs({ repoPath: '../outside' }, opts()), {
      ok: false,
      arg: 'repoPath',
    });
  });

  it('anchors a relative outDir to home, not to cwd', () => {
    const roots = [join(home, 'exports')];
    assert.deepEqual(checkMcpPathArgs({ outDir: 'exports/vault' }, { roots, home, cwd: outside }), {
      ok: true,
    });
    assert.deepEqual(
      checkMcpPathArgs({ outDir: 'exports/vault' }, { roots, home: outside, cwd: home }),
      {
        ok: false,
        arg: 'outDir',
      }
    );
  });

  it('builds an isError payload that names the argument but not the path', () => {
    const out = deniedPathResult('repoPath');
    assert.equal(out.isError, true);
    const payload = JSON.parse(out.content[0]!.text) as { error: string; arg: string };
    assert.equal(payload.error, 'path.out_of_scope');
    assert.equal(payload.arg, 'repoPath');
  });
});

describe('env helpers', () => {
  it('parses AIOS_MCP_ALLOWED_ROOTS with the platform delimiter and drops blanks', () => {
    const sep = process.platform === 'win32' ? ';' : ':';
    const roots = rootsFromEnv({ AIOS_MCP_ALLOWED_ROOTS: `${home}${sep} ${outside} ${sep}` });
    assert.deepEqual(roots, [home, outside]);
    assert.deepEqual(rootsFromEnv({}), []);
  });

  it('is enforced by default and can be switched off explicitly', () => {
    assert.equal(isMcpPathScopeEnabled({}), true);
    assert.equal(isMcpPathScopeEnabled({ AIOS_MCP_PATH_SCOPE: 'enforce' }), true);
    for (const v of ['off', 'OFF', '0', 'false', 'no']) {
      assert.equal(isMcpPathScopeEnabled({ AIOS_MCP_PATH_SCOPE: v }), false, v);
    }
  });
});
