/**
 * Journey: Memory create → recall across a “session” boundary (disk re-read).
 * Closes audit P2 gap (#412 §17 / §29) for remember/recall evidence.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { clearMemory, listMemoryWorkspaces, recall, remember } from './index.ts';

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('memory journey — remember → recall', () => {
  it('persists across separate option objects (disk session boundary)', () => {
    const home = mkdtempSync(join(tmpdir(), 'aios-mem-journey-'));
    temps.push(home);

    const writeSession = { homePath: home };
    const saved = remember('proj-a', 'Prefer PRs into sandbox before main', {
      ...writeSession,
      tags: ['git', 'flow'],
    });
    remember('proj-a', 'Ollama is the default local provider', {
      ...writeSession,
      tags: ['provider'],
    });

    // New “session”: only homePath — must re-read `.aios/memory/proj-a.json`
    const readSession = { homePath: home };
    const storePath = join(home, '.aios', 'memory', 'proj-a.json');
    expect(existsSync(storePath)).toBe(true);
    const onDisk = JSON.parse(readFileSync(storePath, 'utf8')) as {
      entries: { id: string; content: string }[];
    };
    expect(onDisk.entries.some((e) => e.id === saved.id)).toBe(true);

    const all = recall('proj-a', { ...readSession, limit: 10 });
    expect(all.entries).toHaveLength(2);
    expect(all.entries[0]!.content).toContain('Ollama');
    expect(all.entries[1]!.content).toContain('sandbox');
    expect(all.path).toBe(storePath);

    const byQuery = recall('proj-a', { ...readSession, query: 'sandbox' });
    expect(byQuery.entries).toHaveLength(1);
    expect(byQuery.entries[0]!.tags).toContain('git');

    const byTag = recall('proj-a', { ...readSession, tag: 'provider' });
    expect(byTag.entries).toHaveLength(1);
    expect(byTag.entries[0]!.content).toContain('Ollama');
  });

  it('isolates workspaces on the same home', () => {
    const home = mkdtempSync(join(tmpdir(), 'aios-mem-iso-'));
    temps.push(home);
    const opts = { homePath: home };
    remember('alpha', 'alpha-only note', opts);
    remember('beta', 'beta-only note', opts);

    expect(recall('alpha', opts).entries.map((e) => e.content)).toEqual(['alpha-only note']);
    expect(recall('beta', opts).entries.map((e) => e.content)).toEqual(['beta-only note']);
    expect(listMemoryWorkspaces(opts).sort()).toEqual(['alpha', 'beta']);

    expect(clearMemory('alpha', opts)).toBe(true);
    expect(recall('alpha', opts).entries).toHaveLength(0);
    expect(recall('beta', opts).entries).toHaveLength(1);
  });

  it('AIOS_MEMORY_COMPRESS=1 rollup survives a fresh recall session', () => {
    const home = mkdtempSync(join(tmpdir(), 'aios-mem-env-'));
    temps.push(home);
    const prev = process.env.AIOS_MEMORY_COMPRESS;
    process.env.AIOS_MEMORY_COMPRESS = '1';
    try {
      const writeOpts = { homePath: home, maxEntries: 3 };
      remember('ws', 'evict-me', writeOpts);
      remember('ws', 'keep-a', writeOpts);
      remember('ws', 'keep-b', writeOpts);
      remember('ws', 'keep-c', writeOpts);

      const readOpts = { homePath: home };
      const rollups = recall('ws', { ...readOpts, tag: 'memory.rollup', limit: 5 });
      expect(rollups.entries).toHaveLength(1);
      expect(rollups.entries[0]!.content).toContain('evict-me');
      expect(recall('ws', { ...readOpts, limit: 10 }).entries).toHaveLength(3);
    } finally {
      if (prev === undefined) delete process.env.AIOS_MEMORY_COMPRESS;
      else process.env.AIOS_MEMORY_COMPRESS = prev;
    }
  });
});
