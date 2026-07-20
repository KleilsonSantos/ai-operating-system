/**
 * Context Engine — recupera docs/código relevantes do repositório.
 * Fase 1: coleta heurística por path (sem embeddings / LLM).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import type { ContextBundle, ContextSnippet, ContextSnippetKind } from '@aios/shared';

export type GatherContextOptions = {
  /** Diretório de partida (cwd / path absoluto). Raiz sobe até .git / workspace. */
  repoPath: string;
  /**
   * Escopo relativo à raiz (ex.: `engines/policy`, `apps/cli`).
   * Default: `.` (prioriza docs/manifests da raiz + pouco código).
   */
  scope?: string;
  maxSnippets?: number;
  maxBytesPerFile?: number;
  maxTotalBytes?: number;
};

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.turbo',
  'coverage',
  '.next',
  'build',
  '.cache',
  'canvases',
]);

const DOC_NAMES = new Set([
  'readme.md',
  'readme',
  'foundation.md',
  'vision.md',
  'roadmap.md',
  'changelog.md',
  'contributing.md',
  'agents.md',
  'security.md',
  'support.md',
]);

const MANIFEST_NAMES = new Set([
  'package.json',
  'pnpm-workspace.yaml',
  'turbo.json',
  'tsconfig.json',
  'cargo.toml',
  'go.mod',
  'pyproject.toml',
]);

const CODE_EXT = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.py',
  '.go',
  '.rs',
  '.java',
]);

function resolveRepoRoot(start: string): string {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, '.git')) || existsSync(join(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return resolve(start);
    dir = parent;
  }
}

function normalizeScope(scope: string | undefined): string {
  if (!scope || scope === '.' || scope === './') return '.';
  return scope.replace(/^\.\/+/, '').replace(/\/+$/, '');
}

function kindFor(fileName: string, relPath: string): ContextSnippetKind | null {
  const base = fileName.toLowerCase();
  if (MANIFEST_NAMES.has(base)) return 'manifest';
  if (DOC_NAMES.has(base) || relPath.startsWith(`docs${sep}`) || relPath.startsWith('docs/')) {
    if (base.endsWith('.md') || base.endsWith('.mdx') || DOC_NAMES.has(base)) return 'doc';
  }
  const dot = base.lastIndexOf('.');
  const ext = dot >= 0 ? base.slice(dot) : '';
  if (CODE_EXT.has(ext) && !base.endsWith('.d.ts') && !base.includes('.test.')) {
    return 'code';
  }
  if (base.endsWith('.md') || base.endsWith('.mdx')) return 'doc';
  return null;
}

function priority(kind: ContextSnippetKind, relPath: string): number {
  const lower = relPath.toLowerCase();
  if (kind === 'doc' && lower.includes('foundation')) return 100;
  if (kind === 'doc' && lower.startsWith('readme')) return 90;
  if (kind === 'doc' && lower.startsWith('docs/')) return 80;
  if (kind === 'manifest' && lower === 'package.json') return 70;
  if (kind === 'manifest') return 60;
  if (kind === 'doc') return 50;
  if (kind === 'code' && lower.includes('/src/')) return 40;
  if (kind === 'code') return 30;
  return 10;
}

function listFiles(dir: string, root: string, out: string[]): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      listFiles(full, root, out);
      continue;
    }
    if (!entry.isFile()) continue;
    out.push(full);
  }
}

function truncate(content: string, maxBytes: number): string {
  if (Buffer.byteLength(content, 'utf8') <= maxBytes) return content;
  let cut = content.slice(0, maxBytes);
  // evita cortar no meio de surrogate / manter ASCII-ish
  while (Buffer.byteLength(cut, 'utf8') > maxBytes) {
    cut = cut.slice(0, -1);
  }
  return `${cut}\n…[truncated]`;
}

/**
 * Coleta snippets do repositório com escopo por path.
 * API antiga: `gatherContext(repoPath: string)` ainda funciona.
 */
export function gatherContext(repoPathOrOptions: string | GatherContextOptions): ContextBundle {
  const options: GatherContextOptions =
    typeof repoPathOrOptions === 'string' ? { repoPath: repoPathOrOptions } : repoPathOrOptions;

  const maxSnippets = options.maxSnippets ?? 12;
  const maxBytesPerFile = options.maxBytesPerFile ?? 4_000;
  const maxTotalBytes = options.maxTotalBytes ?? 40_000;

  const repoPath = resolveRepoRoot(options.repoPath);
  const scope = normalizeScope(options.scope);
  const signals: string[] = [`repoRoot:${repoPath}`, `scope:${scope}`];

  const scopeAbs = scope === '.' ? repoPath : resolve(repoPath, scope);

  if (!existsSync(scopeAbs)) {
    return {
      repoPath,
      scope,
      snippets: [],
      signals: [...signals, 'scope-missing'],
    };
  }

  const files: string[] = [];
  listFiles(scopeAbs, repoPath, files);

  // Se escopo é subpasta, também puxa manifests/docs da raiz (âncora do projeto)
  if (scope !== '.') {
    for (const name of ['README.md', 'package.json', 'docs/FOUNDATION.md']) {
      const abs = join(repoPath, name);
      if (existsSync(abs)) files.push(abs);
    }
  }

  type Candidate = {
    abs: string;
    rel: string;
    kind: ContextSnippetKind;
    score: number;
  };

  const candidates: Candidate[] = [];
  const seen = new Set<string>();

  for (const abs of files) {
    const rel = relative(repoPath, abs).split(sep).join('/');
    if (seen.has(rel)) continue;
    seen.add(rel);
    const base = abs.split(sep).pop() ?? '';
    const kind = kindFor(base, rel);
    if (!kind) continue;
    // sob escopo `.`, limitar código à raiz / src raso para não inundar
    if (scope === '.' && kind === 'code') {
      const depth = rel.split('/').length;
      if (depth > 3) continue;
    }
    candidates.push({
      abs,
      rel,
      kind,
      score: priority(kind, rel),
    });
  }

  candidates.sort((a, b) => b.score - a.score || a.rel.localeCompare(b.rel));

  const snippets: ContextSnippet[] = [];
  let total = 0;

  for (const c of candidates) {
    if (snippets.length >= maxSnippets) {
      signals.push('capped:maxSnippets');
      break;
    }
    let raw: string;
    try {
      const st = statSync(c.abs);
      if (!st.isFile() || st.size > 200_000) continue;
      raw = readFileSync(c.abs, 'utf8');
    } catch {
      continue;
    }
    const content = truncate(raw, maxBytesPerFile);
    const bytes = Buffer.byteLength(content, 'utf8');
    if (total + bytes > maxTotalBytes) {
      signals.push('capped:maxTotalBytes');
      break;
    }
    total += bytes;
    snippets.push({
      path: c.rel,
      kind: c.kind,
      content,
      bytes,
    });
  }

  signals.push(`snippets:${snippets.length}`, `bytes:${total}`);

  return { repoPath, scope, snippets, signals };
}

/** @deprecated tipo movido para @aios/shared — re-export */
export type { ContextBundle, ContextSnippet };
