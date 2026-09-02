/**
 * Memory Engine — sessão / projeto em disco (Fase 2 · #51).
 * Store: `{storeDir}/{workspaceId}.json` (default `.aios/memory` sob AIOS_HOME / repo).
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  unlinkSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import type { MemoryEntry, MemoryStore } from '@aios/shared';

const ROLLUP_TAG = 'memory.rollup';
const CONTENT_MAX = 4000;
const ROLLUP_BATCH_MAX = 10;

export type MemoryOptions = {
  /** Diretório do store (default: `{home}/.aios/memory`) */
  storeDir?: string;
  /** AIOS home / repo root para path default */
  homePath?: string;
  /** Cap de entradas por workspace (default 50, FIFO drop) */
  maxEntries?: number;
  /**
   * Opt-in: merge oldest evicted rows into one `memory.rollup` entry before FIFO slice.
   * Env fallback: `AIOS_MEMORY_COMPRESS=1` (default off). Spike #322 / ADR-0006.
   */
  compressOnEvict?: boolean;
};

function defaultStoreDir(homePath?: string): string {
  const home = resolve(homePath || process.env.AIOS_HOME || process.cwd());
  return join(home, '.aios', 'memory');
}

function sanitizeId(id: string): string {
  const s = id.trim().replace(/[^a-zA-Z0-9._-]+/g, '_');
  if (!s) throw new Error('workspaceId / memory key required');
  return s;
}

function storePath(storeDir: string, workspaceId: string): string {
  return join(storeDir, `${sanitizeId(workspaceId)}.json`);
}

function emptyStore(workspaceId: string): MemoryStore {
  return { workspaceId, updatedAt: new Date().toISOString(), entries: [] };
}

function readStore(file: string, workspaceId: string): MemoryStore {
  if (!existsSync(file)) return emptyStore(workspaceId);
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as MemoryStore;
    if (!raw || !Array.isArray(raw.entries)) return emptyStore(workspaceId);
    return {
      workspaceId: raw.workspaceId || workspaceId,
      updatedAt: raw.updatedAt || new Date().toISOString(),
      entries: raw.entries,
    };
  } catch {
    return emptyStore(workspaceId);
  }
}

function newEntryId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function compressOnEvictEnabled(options: MemoryOptions): boolean {
  if (options.compressOnEvict !== undefined) return options.compressOnEvict;
  const v = process.env.AIOS_MEMORY_COMPRESS?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function mergeTags(entries: MemoryEntry[]): string[] {
  const set = new Set<string>([ROLLUP_TAG]);
  for (const e of entries) {
    for (const t of e.tags ?? []) {
      if (t && t !== ROLLUP_TAG) set.add(t);
      if (set.size >= 8) break;
    }
  }
  return [...set];
}

function buildRollupBody(entries: MemoryEntry[]): string {
  const lines = entries.map((e) => {
    const snippet = e.content.replace(/\s+/g, ' ').trim().slice(0, 200);
    return `- ${e.createdAt}: ${snippet}`;
  });
  let body = `[memory rollup — ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}]\n${lines.join('\n')}`;
  if (body.length > CONTENT_MAX) {
    body = body.slice(0, CONTENT_MAX - 1) + '…';
  }
  return body;
}

function buildRollupEntry(entries: MemoryEntry[]): MemoryEntry {
  return {
    id: newEntryId(),
    content: buildRollupBody(entries),
    createdAt: new Date().toISOString(),
    tags: mergeTags(entries),
  };
}

/** Apply FIFO cap; optional deterministic rollup of evicted tail (spike #322). */
export function applyFifoRetention(
  entries: MemoryEntry[],
  maxEntries: number,
  compressOnEvict: boolean
): MemoryEntry[] {
  if (entries.length <= maxEntries) return entries;
  if (!compressOnEvict) {
    return entries.slice(entries.length - maxEntries);
  }

  let next = [...entries];
  while (next.length > maxEntries) {
    const excess = next.length - maxEntries;
    const batchSize = Math.min(excess, ROLLUP_BATCH_MAX);
    const evicted = next.slice(0, batchSize);
    const rollup = buildRollupEntry(evicted);
    next = [...next.slice(batchSize), rollup];
    if (next.length > maxEntries) {
      next = next.slice(next.length - maxEntries);
    }
  }
  return next;
}

function writeStore(
  file: string,
  store: MemoryStore,
  maxEntries: number,
  compressOnEvict: boolean
): void {
  mkdirSync(resolve(file, '..'), { recursive: true });
  const entries = applyFifoRetention(store.entries, maxEntries, compressOnEvict);
  const next: MemoryStore = {
    workspaceId: store.workspaceId,
    updatedAt: new Date().toISOString(),
    entries,
  };
  writeFileSync(file, JSON.stringify(next, null, 2) + '\n', 'utf8');
}

export function resolveStoreDir(options: MemoryOptions = {}): string {
  return resolve(options.storeDir || defaultStoreDir(options.homePath));
}

/**
 * Persiste uma nota / fato de sessão para o workspace.
 */
export function remember(
  workspaceId: string,
  content: string,
  options: MemoryOptions & { tags?: string[] } = {}
): MemoryEntry {
  const text = content.trim();
  if (!text) throw new Error('memory content required');
  const dir = resolveStoreDir(options);
  const max = options.maxEntries ?? 50;
  const compress = compressOnEvictEnabled(options);
  const file = storePath(dir, workspaceId);
  const store = readStore(file, sanitizeId(workspaceId));
  const entry: MemoryEntry = {
    id: newEntryId(),
    content: text.slice(0, CONTENT_MAX),
    createdAt: new Date().toISOString(),
  };
  if (options.tags?.length) {
    entry.tags = options.tags
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);
  }
  store.entries.push(entry);
  writeStore(file, store, max, compress);
  return entry;
}

export type RecallOptions = MemoryOptions & {
  /** Limite de entradas retornadas (mais recentes primeiro) */
  limit?: number;
  /** Filtro substring (case-insensitive) */
  query?: string;
  tag?: string;
};

/**
 * Lê memórias do workspace (mais recentes primeiro).
 */
export function recall(
  workspaceId: string,
  options: RecallOptions = {}
): MemoryStore & { path: string } {
  const dir = resolveStoreDir(options);
  const file = storePath(dir, workspaceId);
  const store = readStore(file, sanitizeId(workspaceId));
  let entries = [...store.entries].reverse();
  if (options.query) {
    const q = options.query.toLowerCase();
    entries = entries.filter((e) => e.content.toLowerCase().includes(q));
  }
  if (options.tag) {
    const t = options.tag.toLowerCase();
    entries = entries.filter((e) => e.tags?.some((x) => x.toLowerCase() === t));
  }
  const limit = options.limit ?? 10;
  entries = entries.slice(0, limit);
  return {
    workspaceId: store.workspaceId,
    updatedAt: store.updatedAt,
    entries,
    path: file,
  };
}

/** Remove o arquivo de memória do workspace. */
export function clearMemory(workspaceId: string, options: MemoryOptions = {}): boolean {
  const file = storePath(resolveStoreDir(options), workspaceId);
  if (!existsSync(file)) return false;
  unlinkSync(file);
  return true;
}

/** Lista workspaces que têm arquivo de memória. */
export function listMemoryWorkspaces(options: MemoryOptions = {}): string[] {
  const dir = resolveStoreDir(options);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));
}
