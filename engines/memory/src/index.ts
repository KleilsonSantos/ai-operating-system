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
} from 'node:fs'
import { join, resolve } from 'node:path'
import type { MemoryEntry, MemoryStore } from '@aios/shared'

export type MemoryOptions = {
  /** Diretório do store (default: `{home}/.aios/memory`) */
  storeDir?: string
  /** AIOS home / repo root para path default */
  homePath?: string
  /** Cap de entradas por workspace (default 50, FIFO drop) */
  maxEntries?: number
}

function defaultStoreDir(homePath?: string): string {
  const home = resolve(homePath || process.env.AIOS_HOME || process.cwd())
  return join(home, '.aios', 'memory')
}

function sanitizeId(id: string): string {
  const s = id.trim().replace(/[^a-zA-Z0-9._-]+/g, '_')
  if (!s) throw new Error('workspaceId / memory key required')
  return s
}

function storePath(storeDir: string, workspaceId: string): string {
  return join(storeDir, `${sanitizeId(workspaceId)}.json`)
}

function emptyStore(workspaceId: string): MemoryStore {
  return { workspaceId, updatedAt: new Date().toISOString(), entries: [] }
}

function readStore(file: string, workspaceId: string): MemoryStore {
  if (!existsSync(file)) return emptyStore(workspaceId)
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as MemoryStore
    if (!raw || !Array.isArray(raw.entries)) return emptyStore(workspaceId)
    return {
      workspaceId: raw.workspaceId || workspaceId,
      updatedAt: raw.updatedAt || new Date().toISOString(),
      entries: raw.entries,
    }
  } catch {
    return emptyStore(workspaceId)
  }
}

function writeStore(file: string, store: MemoryStore, maxEntries: number): void {
  mkdirSync(resolve(file, '..'), { recursive: true })
  let entries = store.entries
  if (entries.length > maxEntries) {
    entries = entries.slice(entries.length - maxEntries)
  }
  const next: MemoryStore = {
    workspaceId: store.workspaceId,
    updatedAt: new Date().toISOString(),
    entries,
  }
  writeFileSync(file, JSON.stringify(next, null, 2) + '\n', 'utf8')
}

export function resolveStoreDir(options: MemoryOptions = {}): string {
  return resolve(options.storeDir || defaultStoreDir(options.homePath))
}

/**
 * Persiste uma nota / fato de sessão para o workspace.
 */
export function remember(
  workspaceId: string,
  content: string,
  options: MemoryOptions & { tags?: string[] } = {},
): MemoryEntry {
  const text = content.trim()
  if (!text) throw new Error('memory content required')
  const dir = resolveStoreDir(options)
  const max = options.maxEntries ?? 50
  const file = storePath(dir, workspaceId)
  const store = readStore(file, sanitizeId(workspaceId))
  const entry: MemoryEntry = {
    id: `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    content: text.slice(0, 4000),
    createdAt: new Date().toISOString(),
  }
  if (options.tags?.length) {
    entry.tags = options.tags.map((t) => t.trim()).filter(Boolean).slice(0, 8)
  }
  store.entries.push(entry)
  writeStore(file, store, max)
  return entry
}

export type RecallOptions = MemoryOptions & {
  /** Limite de entradas retornadas (mais recentes primeiro) */
  limit?: number
  /** Filtro substring (case-insensitive) */
  query?: string
  tag?: string
}

/**
 * Lê memórias do workspace (mais recentes primeiro).
 */
export function recall(
  workspaceId: string,
  options: RecallOptions = {},
): MemoryStore & { path: string } {
  const dir = resolveStoreDir(options)
  const file = storePath(dir, workspaceId)
  const store = readStore(file, sanitizeId(workspaceId))
  let entries = [...store.entries].reverse()
  if (options.query) {
    const q = options.query.toLowerCase()
    entries = entries.filter((e) => e.content.toLowerCase().includes(q))
  }
  if (options.tag) {
    const t = options.tag.toLowerCase()
    entries = entries.filter((e) =>
      e.tags?.some((x) => x.toLowerCase() === t),
    )
  }
  const limit = options.limit ?? 10
  entries = entries.slice(0, limit)
  return {
    workspaceId: store.workspaceId,
    updatedAt: store.updatedAt,
    entries,
    path: file,
  }
}

/** Remove o arquivo de memória do workspace. */
export function clearMemory(
  workspaceId: string,
  options: MemoryOptions = {},
): boolean {
  const file = storePath(resolveStoreDir(options), workspaceId)
  if (!existsSync(file)) return false
  unlinkSync(file)
  return true
}

/** Lista workspaces que têm arquivo de memória. */
export function listMemoryWorkspaces(
  options: MemoryOptions = {},
): string[] {
  const dir = resolveStoreDir(options)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
}
