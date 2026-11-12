/**
 * Path scope for model-controlled MCP tool arguments.
 * The privilege model gates *which tool* may run, not *where* it reads or writes. Path-like
 * arguments are therefore confined to the AIOS home, registered workspaces, and operator roots.
 */
import { realpathSync } from 'node:fs';
import { basename, delimiter, dirname, isAbsolute, join, resolve, sep } from 'node:path';

type EnvMap = Record<string, string | undefined>;

/** Top-level tool arguments that name a filesystem location. */
export const MCP_PATH_ARG_KEYS = [
  'repoPath',
  'homePath',
  'workspacesPath',
  'policiesPath',
  'outDir',
  'path',
] as const;

export type McpPathScopeDecision = { ok: true } | { ok: false; arg: string };

function isUnder(child: string, parent: string): boolean {
  return child === parent || child.startsWith(parent.endsWith(sep) ? parent : parent + sep);
}

/** Canonical path; follows symlinks through the nearest existing ancestor (ENOENT-safe). */
export function canonicalPath(path: string): string {
  try {
    return realpathSync.native(path);
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === 'ENOENT' || code === 'ENOTDIR') {
      const parent = dirname(path);
      if (parent === path) return resolve(path);
      return join(canonicalPath(parent), basename(path));
    }
    return resolve(path);
  }
}

export function isPathInScope(path: string, roots: readonly string[]): boolean {
  const target = canonicalPath(resolve(path));
  return roots.some((root) => isUnder(target, canonicalPath(resolve(root))));
}

/** Roots from `AIOS_MCP_ALLOWED_ROOTS` (path-delimiter separated, empty by default). */
export function rootsFromEnv(env: EnvMap = process.env): string[] {
  return (env.AIOS_MCP_ALLOWED_ROOTS || '')
    .split(delimiter)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => resolve(p));
}

export function isMcpPathScopeEnabled(env: EnvMap = process.env): boolean {
  const v = (env.AIOS_MCP_PATH_SCOPE || 'enforce').trim().toLowerCase();
  return v !== 'off' && v !== '0' && v !== 'false' && v !== 'no';
}

/**
 * Check every path-like top-level argument against `roots`.
 * Relative values resolve against `cwd`, except `outDir`, which anchors to `home`
 * (same rule as the Obsidian export). Non-string and empty values are ignored.
 */
export function checkMcpPathArgs(
  args: unknown,
  options: { roots: readonly string[]; home: string; cwd: string }
): McpPathScopeDecision {
  if (!args || typeof args !== 'object' || Array.isArray(args)) return { ok: true };
  const bag = args as Record<string, unknown>;
  for (const key of MCP_PATH_ARG_KEYS) {
    const value = bag[key];
    if (typeof value !== 'string' || !value.trim()) continue;
    const raw = value.trim();
    const anchored = isAbsolute(raw)
      ? raw
      : resolve(key === 'outDir' ? options.home : options.cwd, raw);
    if (!isPathInScope(anchored, options.roots)) return { ok: false, arg: key };
  }
  return { ok: true };
}

export function deniedPathResult(arg: string): {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
} {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          error: 'path.out_of_scope',
          arg,
          hint: 'Path must be under AIOS_HOME, a registered workspace, or AIOS_MCP_ALLOWED_ROOTS',
        }),
      },
    ],
    isError: true,
  };
}
