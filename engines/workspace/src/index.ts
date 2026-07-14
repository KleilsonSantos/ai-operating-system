/**
 * Workspace Engine — onboarding multi-repositório (Fase 2 · #43).
 * Registry JSON + resolve(id) → repoPath absoluto.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import type { WorkspaceEntry, WorkspaceRegistry } from '@aios/shared'

export type LoadWorkspacesOptions = {
  /** Caminho explícito do JSON de workspaces */
  configPath?: string
  /**
   * Raiz a partir da qual procurar o registry
   * (default: process.cwd() / AIOS_HOME).
   */
  cwd?: string
}

export type WorkspaceBundle = {
  workspaces: WorkspaceEntry[]
  /** Arquivo carregado, se houver */
  path?: string
  source: 'file' | 'empty'
}

const REGISTRY_NAMES = [
  'workspaces/aios.workspaces.json',
  'aios.workspaces.json',
] as const

function walkUpFind(start: string): string | undefined {
  let dir = resolve(start)
  for (;;) {
    for (const name of REGISTRY_NAMES) {
      const candidate = join(dir, name)
      if (existsSync(candidate)) return candidate
    }
    const parent = dirname(dir)
    if (parent === dir) return undefined
    dir = parent
  }
}

function assertWorkspace(raw: unknown, index: number): WorkspaceEntry {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`workspace[${index}]: expected object`)
  }
  const w = raw as Record<string, unknown>
  if (typeof w.id !== 'string' || !w.id.trim()) {
    throw new Error(`workspace[${index}]: id required`)
  }
  if (typeof w.path !== 'string' || !w.path.trim()) {
    throw new Error(`workspace[${index}]: path required`)
  }
  const entry: WorkspaceEntry = {
    id: w.id.trim(),
    path: w.path.trim(),
  }
  if (typeof w.name === 'string' && w.name.trim()) {
    entry.name = w.name.trim()
  }
  if (typeof w.default === 'boolean') {
    entry.default = w.default
  }
  return entry
}

function parseRegistry(raw: unknown, filePath: string): WorkspaceEntry[] {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`${filePath}: root must be object`)
  }
  const root = raw as Record<string, unknown>
  if (!Array.isArray(root.workspaces)) {
    throw new Error(`${filePath}: workspaces[] required`)
  }
  return root.workspaces.map((item, i) => assertWorkspace(item, i))
}

/**
 * Carrega o registry. Sem arquivo → bundle vazio (não é erro).
 */
export function loadWorkspaces(
  options: LoadWorkspacesOptions = {},
): WorkspaceBundle {
  const cwd = resolve(
    options.cwd || process.env.AIOS_HOME || process.cwd(),
  )
  const configPath =
    options.configPath ||
    process.env.AIOS_WORKSPACES_PATH ||
    walkUpFind(cwd)

  if (!configPath || !existsSync(configPath)) {
    return { workspaces: [], source: 'empty' }
  }

  const abs = resolve(configPath)
  const parsed = JSON.parse(readFileSync(abs, 'utf8')) as unknown
  const workspaces = parseRegistry(parsed, abs)
  return { workspaces, path: abs, source: 'file' }
}

/**
 * Resolve path relativo ao diretório do arquivo de registry
 * (ou cwd se source empty).
 */
export function resolveWorkspacePath(
  entry: WorkspaceEntry,
  registryFile?: string,
): string {
  if (isAbsolute(entry.path)) return resolve(entry.path)
  const registryDir = registryFile ? dirname(registryFile) : process.cwd()
  // Registry em `workspaces/` → paths relativos à raiz do monorepo AIOS
  const anchor = /[/\\]workspaces$/.test(registryDir)
    ? dirname(registryDir)
    : registryDir
  return resolve(anchor, entry.path)
}

export type ResolveWorkspaceResult = {
  entry: WorkspaceEntry
  repoPath: string
  registryPath?: string
}

/**
 * Resolve workspace por id (ou default se id omitido e houver um marcado).
 */
export function resolveWorkspace(
  id: string | undefined,
  options: LoadWorkspacesOptions = {},
): ResolveWorkspaceResult | undefined {
  const bundle = loadWorkspaces(options)
  if (bundle.workspaces.length === 0) return undefined

  let entry: WorkspaceEntry | undefined
  if (id) {
    entry = bundle.workspaces.find((w) => w.id === id)
    if (!entry) {
      throw new Error(
        `workspace not found: "${id}" (known: ${bundle.workspaces
          .map((w) => w.id)
          .join(', ')})`,
      )
    }
  } else {
    entry = bundle.workspaces.find((w) => w.default)
    if (!entry) return undefined
  }

  return {
    entry,
    repoPath: resolveWorkspacePath(entry, bundle.path),
    registryPath: bundle.path,
  }
}

export type { WorkspaceEntry, WorkspaceRegistry }
