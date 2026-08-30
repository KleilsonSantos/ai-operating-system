import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readMonorepoVersion } from './version.ts';

describe('readMonorepoVersion', () => {
  it('matches root package.json version', () => {
    const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
    const expected = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version as string;
    assert.equal(readMonorepoVersion(), expected);
    assert.match(expected, /^\d+\.\d+\.\d+/);
  });
});
