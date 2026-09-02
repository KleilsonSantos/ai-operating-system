import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import {
  remember,
  recall,
  clearMemory,
  listMemoryWorkspaces,
  applyFifoRetention,
} from './index.ts';
import type { MemoryEntry } from '@aios/shared';

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function entry(id: string, content: string): MemoryEntry {
  return { id, content, createdAt: `2026-01-01T00:00:0${id}.000Z` };
}

describe('applyFifoRetention', () => {
  it('hard-drops oldest when compress is off', () => {
    const entries = [entry('1', 'a'), entry('2', 'b'), entry('3', 'c'), entry('4', 'd')];
    const out = applyFifoRetention(entries, 3, false);
    expect(out.map((e) => e.id)).toEqual(['2', '3', '4']);
  });

  it('appends rollup when compress is on', () => {
    const entries = [entry('1', 'first'), entry('2', 'b'), entry('3', 'c'), entry('4', 'd')];
    const out = applyFifoRetention(entries, 3, true);
    expect(out).toHaveLength(3);
    expect(out.map((e) => e.id)).toEqual(['3', '4', expect.any(String)]);
    expect(out[2]!.tags).toContain('memory.rollup');
    expect(out[2]!.content).toContain('first');
  });
});

describe('memory', () => {
  it('remember + recall + clear', () => {
    const home = mkdtempSync(join(tmpdir(), 'aios-mem-'));
    temps.push(home);
    const opts = { homePath: home };
    const a = remember('aios', 'Prefer sandbox PRs', {
      ...opts,
      tags: ['git'],
    });
    remember('aios', 'MCP uses absolute node path', opts);
    const r = recall('aios', { ...opts, limit: 5 });
    expect(r.entries).toHaveLength(2);
    expect(r.entries[0]!.content).toContain('MCP');
    expect(a.id).toBeTruthy();
    const tagged = recall('aios', { ...opts, tag: 'git' });
    expect(tagged.entries).toHaveLength(1);
    expect(listMemoryWorkspaces(opts)).toContain('aios');
    expect(clearMemory('aios', opts)).toBe(true);
    expect(recall('aios', opts).entries).toHaveLength(0);
  });

  it('default FIFO drops oldest without rollup', () => {
    const home = mkdtempSync(join(tmpdir(), 'aios-mem-'));
    temps.push(home);
    const opts = { homePath: home, maxEntries: 3, compressOnEvict: false };
    remember('ws', 'one', opts);
    remember('ws', 'two', opts);
    remember('ws', 'three', opts);
    remember('ws', 'four', opts);
    const all = recall('ws', { ...opts, limit: 10 });
    expect(all.entries.map((e) => e.content)).toEqual(['four', 'three', 'two']);
    expect(recall('ws', { ...opts, tag: 'memory.rollup' }).entries).toHaveLength(0);
  });

  it('compressOnEvict keeps rollup summary of evicted row', () => {
    const home = mkdtempSync(join(tmpdir(), 'aios-mem-'));
    temps.push(home);
    const opts = { homePath: home, maxEntries: 3, compressOnEvict: true };
    remember('ws', 'one', opts);
    remember('ws', 'two', opts);
    remember('ws', 'three', opts);
    remember('ws', 'four', opts);
    const rollups = recall('ws', { ...opts, tag: 'memory.rollup', limit: 5 });
    expect(rollups.entries).toHaveLength(1);
    expect(rollups.entries[0]!.content).toContain('one');
    const all = recall('ws', { ...opts, limit: 10 });
    expect(all.entries).toHaveLength(3);
  });
});
