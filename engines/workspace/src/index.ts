/**
 * Workspace Engine — multi-repo registry + ops genéricas (Fase 2·#43 · Fase 3·#55).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import type { WorkspaceEntry, WorkspaceRegistry } from '@aios/shared';

export type LoadWorkspacesOptions = {
  /** Caminho explícito do JSON de workspaces */
  configPath?: string;
  /**
   * Raiz a partir da qual procurar o registry
   * (default: process.cwd() / AIOS_HOME).
   */
  cwd?: string;
};

export type WorkspaceBundle = {
  workspaces: WorkspaceEntry[];
  /** Arquivo carregado, se houver */
  path?: string;
  source: 'file' | 'empty';
};

export type WorkspaceValidation = {
  id: string;
  repoPath: string;
  ok: boolean;
  checks: {
    pathExists: boolean;
    isDirectory: boolean;
    hasGit: boolean;
    hasPackageJson: boolean;
    hasWorkspaceMarker: boolean;
  };
  signals: string[];
};

const REGISTRY_NAMES = ['workspaces/aios.workspaces.json', 'aios.workspaces.json'] as const;

function walkUpFind(start: string): string | undefined {
  let dir = resolve(start);
  for (;;) {
    for (const name of REGISTRY_NAMES) {
      const candidate = join(dir, name);
      if (existsSync(candidate)) return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

function assertWorkspace(raw: unknown, index: number): WorkspaceEntry {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`workspace[${index}]: expected object`);
  }
  const w = raw as Record<string, unknown>;
  if (typeof w.id !== 'string' || !w.id.trim()) {
    throw new Error(`workspace[${index}]: id required`);
  }
  if (typeof w.path !== 'string' || !w.path.trim()) {
    throw new Error(`workspace[${index}]: path required`);
  }
  const entry: WorkspaceEntry = {
    id: w.id.trim(),
    path: w.path.trim(),
  };
  if (typeof w.name === 'string' && w.name.trim()) {
    entry.name = w.name.trim();
  }
  if (typeof w.default === 'boolean') {
    entry.default = w.default;
  }
  if (Array.isArray(w.tags)) {
    entry.tags = w.tags
      .filter((t): t is string => typeof t === 'string' && Boolean(t.trim()))
      .map((t) => t.trim())
      .slice(0, 16);
  }
  return entry;
}

function parseRegistry(raw: unknown, filePath: string): WorkspaceEntry[] {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`${filePath}: root must be object`);
  }
  const root = raw as Record<string, unknown>;
  if (!Array.isArray(root.workspaces)) {
    throw new Error(`${filePath}: workspaces[] required`);
  }
  return root.workspaces.map((item, i) => assertWorkspace(item, i));
}

/**
 * Carrega o registry. Sem arquivo → bundle vazio (não é erro).
 */
export function loadWorkspaces(options: LoadWorkspacesOptions = {}): WorkspaceBundle {
  const cwd = resolve(options.cwd || process.env.AIOS_HOME || process.cwd());
  const configPath = options.configPath || process.env.AIOS_WORKSPACES_PATH || walkUpFind(cwd);

  if (!configPath || !existsSync(configPath)) {
    return { workspaces: [], source: 'empty' };
  }

  const abs = resolve(configPath);
  const parsed = JSON.parse(readFileSync(abs, 'utf8')) as unknown;
  const workspaces = parseRegistry(parsed, abs);
  return { workspaces, path: abs, source: 'file' };
}

/**
 * Resolve path relativo ao diretório do arquivo de registry
 * (ou cwd se source empty).
 */
export function resolveWorkspacePath(entry: WorkspaceEntry, registryFile?: string): string {
  if (isAbsolute(entry.path)) return resolve(entry.path);
  const registryDir = registryFile ? dirname(registryFile) : process.cwd();
  const anchor = /[/\\]workspaces$/.test(registryDir) ? dirname(registryDir) : registryDir;
  return resolve(anchor, entry.path);
}

export type ResolveWorkspaceResult = {
  entry: WorkspaceEntry;
  repoPath: string;
  registryPath?: string;
};

/**
 * Resolve workspace por id (ou default se id omitido e houver um marcado).
 */
export function resolveWorkspace(
  id: string | undefined,
  options: LoadWorkspacesOptions = {}
): ResolveWorkspaceResult | undefined {
  const bundle = loadWorkspaces(options);
  if (bundle.workspaces.length === 0) return undefined;

  let entry: WorkspaceEntry | undefined;
  if (id) {
    entry = bundle.workspaces.find((w) => w.id === id);
    if (!entry) {
      throw new Error(
        `workspace not found: "${id}" (known: ${bundle.workspaces.map((w) => w.id).join(', ')})`
      );
    }
  } else {
    entry = bundle.workspaces.find((w) => w.default);
    if (!entry) return undefined;
  }

  return {
    entry,
    repoPath: resolveWorkspacePath(entry, bundle.path),
    registryPath: bundle.path,
  };
}

function defaultRegistryPath(cwd: string): string {
  return join(resolve(cwd), 'workspaces', 'aios.workspaces.json');
}

function writeRegistry(file: string, workspaces: WorkspaceEntry[]): void {
  mkdirSync(dirname(file), { recursive: true });
  const body: WorkspaceRegistry = { workspaces };
  writeFileSync(file, JSON.stringify(body, null, 2) + '\n', 'utf8');
}

export type UpsertWorkspaceInput = WorkspaceEntry & {
  /** Se true, demarque default nos demais */
  makeDefault?: boolean;
};

/**
 * Insere ou atualiza um workspace no registry (cria arquivo se necessário).
 */
export function upsertWorkspace(
  input: UpsertWorkspaceInput,
  options: LoadWorkspacesOptions = {}
): { path: string; entry: WorkspaceEntry; created: boolean } {
  const cwd = resolve(options.cwd || process.env.AIOS_HOME || process.cwd());
  const bundle = loadWorkspaces({ ...options, cwd });
  const file = options.configPath
    ? resolve(options.configPath)
    : bundle.path || defaultRegistryPath(cwd);

  const entry: WorkspaceEntry = {
    id: input.id.trim(),
    path: input.path.trim(),
  };
  if (input.name?.trim()) entry.name = input.name.trim();
  if (input.tags?.length) entry.tags = [...input.tags];
  if (input.default || input.makeDefault) entry.default = true;

  let list = [...bundle.workspaces];
  const idx = list.findIndex((w) => w.id === entry.id);
  const created = idx < 0;
  if (entry.default) {
    list = list.map((w) => {
      const { default: _d, ...rest } = w;
      void _d;
      return rest as WorkspaceEntry;
    });
  }
  if (idx >= 0) list[idx] = { ...list[idx], ...entry };
  else list.push(entry);

  writeRegistry(file, list);
  return { path: file, entry, created };
}

/**
 * Remove workspace do registry pelo id.
 */
export function removeWorkspace(
  id: string,
  options: LoadWorkspacesOptions = {}
): { path?: string; removed: boolean } {
  const bundle = loadWorkspaces(options);
  if (!bundle.path) return { removed: false };
  const next = bundle.workspaces.filter((w) => w.id !== id);
  if (next.length === bundle.workspaces.length) {
    return { path: bundle.path, removed: false };
  }
  writeRegistry(bundle.path, next);
  return { path: bundle.path, removed: true };
}

/**
 * Valida se o path do workspace parece um repositório utilizável.
 */
export function validateWorkspace(
  id: string,
  options: LoadWorkspacesOptions = {}
): WorkspaceValidation {
  const resolved = resolveWorkspace(id, options);
  if (!resolved) {
    throw new Error(`workspace not found: "${id}"`);
  }
  const repoPath = resolved.repoPath;
  const pathExists = existsSync(repoPath);
  let isDirectory = false;
  if (pathExists) {
    try {
      isDirectory = statSync(repoPath).isDirectory();
    } catch {
      isDirectory = false;
    }
  }
  const hasGit = pathExists && existsSync(join(repoPath, '.git'));
  const hasPackageJson = pathExists && existsSync(join(repoPath, 'package.json'));
  const hasWorkspaceMarker =
    pathExists &&
    (existsSync(join(repoPath, 'pnpm-workspace.yaml')) ||
      existsSync(join(repoPath, 'docs', 'FOUNDATION.md')));

  const signals: string[] = [];
  if (hasGit) signals.push('git');
  if (hasPackageJson) signals.push('package.json');
  if (hasWorkspaceMarker) signals.push('workspace-marker');

  const ok = pathExists && isDirectory && (hasGit || hasPackageJson || hasWorkspaceMarker);

  return {
    id: resolved.entry.id,
    repoPath,
    ok,
    checks: {
      pathExists,
      isDirectory,
      hasGit,
      hasPackageJson,
      hasWorkspaceMarker,
    },
    signals,
  };
}

/**
 * Lista workspaces com validação rápida (genérico / saúde do registry).
 */
export function listValidatedWorkspaces(
  options: LoadWorkspacesOptions = {}
): Array<WorkspaceEntry & { repoPath: string; validation: WorkspaceValidation }> {
  const bundle = loadWorkspaces(options);
  return bundle.workspaces.map((entry) => {
    const repoPath = resolveWorkspacePath(entry, bundle.path);
    const validation = validateWorkspace(entry.id, {
      ...options,
      configPath: bundle.path,
    });
    return { ...entry, repoPath, validation };
  });
}

export type { WorkspaceEntry, WorkspaceRegistry };
