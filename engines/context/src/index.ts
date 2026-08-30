/**
 * Context Engine — recupera docs/código relevantes do repositório.
 * Path heuristic + Knowledge Graph neighbors for `scope` (no embeddings / LLM).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { buildKnowledgeGraph } from '@aios/knowledge';
import type {
  ContextBudget,
  ContextBundle,
  ContextSnippet,
  ContextSnippetKind,
  IntentKind,
  RouteCostBudget,
  RouteRisk,
} from '@aios/shared';

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
  /** Named budget (ADR-0025). Explicit max* fields still win. */
  budget?: ContextBudget;
  /** Deny secret-like paths (default true). */
  denySecrets?: boolean;
};

const TIGHT_BUDGET: ContextBudget = {
  tier: 'tight',
  maxSnippets: 6,
  maxBytesPerFile: 2_000,
  maxTotalBytes: 16_000,
};

const STANDARD_BUDGET: ContextBudget = {
  tier: 'standard',
  maxSnippets: 12,
  maxBytesPerFile: 4_000,
  maxTotalBytes: 40_000,
};

const WIDE_BUDGET: ContextBudget = {
  tier: 'wide',
  maxSnippets: 16,
  maxBytesPerFile: 4_000,
  maxTotalBytes: 48_000,
};

/** Policy-sized context window — never a full-repo dump. */
export function resolveContextBudget(input: {
  intentKind: IntentKind;
  risk?: RouteRisk;
  costBudget?: RouteCostBudget;
}): ContextBudget {
  if (input.costBudget === 'low' || input.intentKind === 'unknown' || input.risk === 'high') {
    return { ...TIGHT_BUDGET };
  }
  if (
    input.intentKind === 'implement.feature' ||
    input.intentKind === 'fix.bug' ||
    input.intentKind === 'review.change' ||
    input.intentKind === 'audit.security'
  ) {
    return { ...WIDE_BUDGET };
  }
  return { ...STANDARD_BUDGET };
}

/** Secret-like relative paths — fail closed, do not send to the model. */
export function isDeniedContextPath(relPath: string): boolean {
  const lower = relPath.toLowerCase().replace(/\\/g, '/');
  const base = lower.split('/').pop() ?? '';
  if (base === '.env' || base.startsWith('.env.')) return true;
  if (/\.(pem|key|p12|pfx)$/.test(base)) return true;
  if (base === 'credentials.json' || base === 'id_rsa' || base === 'id_ed25519') return true;
  if (lower === 'secrets' || lower.startsWith('secrets/') || lower.includes('/secrets/')) {
    return true;
  }
  return false;
}

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

const ALLOWED_HIDDEN_DIRS = new Set(['.github', '.trae']);

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
  let normalized = scope;
  while (normalized.startsWith('./')) {
    normalized = normalized.slice(2);
  }
  while (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
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
  if (kind === 'doc' && lower.startsWith('.trae/rules/')) return 95;
  if (kind === 'doc' && lower.startsWith('readme')) return 90;
  if (kind === 'doc' && lower.startsWith('docs/')) return 80;
  if (kind === 'doc' && lower === 'agents.md') return 45;
  if (kind === 'manifest' && lower === 'package.json') return 70;
  if (kind === 'manifest') return 60;
  if (kind === 'doc') return 50;
  if (kind === 'code' && lower.includes('/src/')) return 40;
  if (kind === 'code') return 30;
  return 10;
}

const MAX_KG_NEIGHBORS = 12;
const KG_SCORE_BOOST = 55;

function expandNeighborPath(root: string, graphPath: string): string[] {
  const rel = graphPath.replace(/\\/g, '/');
  const abs = join(root, rel);
  if (existsSync(abs)) {
    try {
      if (statSync(abs).isFile()) return [rel];
    } catch {
      return [];
    }
  }
  const out: string[] = [];
  for (const name of ['package.json', 'README.md'] as const) {
    const child = `${rel}/${name}`;
    if (existsSync(join(root, child))) out.push(child);
  }
  return out;
}

/**
 * Relative files linked to `scope` via the heuristic Knowledge Graph.
 * Empty when scope is the repo root (no single focus node).
 */
export function knowledgeNeighborRelPaths(repoPath: string, scope: string): string[] {
  const normalized = normalizeScope(scope);
  if (normalized === '.') return [];
  const graph = buildKnowledgeGraph({ repoPath });
  const focus =
    graph.nodes.find((n) => n.path === normalized) ??
    graph.nodes.find((n) => n.path && n.path.startsWith(`${normalized}/`));
  if (!focus) return [];

  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const neighborIds = new Set<string>();
  for (const edge of graph.edges) {
    if (edge.from !== focus.id) continue;
    if (edge.kind === 'depends_on' || edge.kind === 'documents' || edge.kind === 'contains') {
      neighborIds.add(edge.to);
    }
  }

  const token = normalized.split('/').pop() ?? '';
  const rels: string[] = [];
  for (const id of neighborIds) {
    const node = byId.get(id);
    if (!node?.path) continue;
    rels.push(...expandNeighborPath(repoPath, node.path));
  }
  if (token.length >= 3) {
    for (const node of graph.nodes) {
      if (node.kind !== 'doc' || !node.path?.startsWith('docs/adr/')) continue;
      if (!node.path.toLowerCase().includes(token.toLowerCase())) continue;
      rels.push(...expandNeighborPath(repoPath, node.path));
    }
  }

  return [...new Set(rels)].slice(0, MAX_KG_NEIGHBORS);
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
    if (entry.name.startsWith('.') && !ALLOWED_HIDDEN_DIRS.has(entry.name)) continue;
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

  const budget = options.budget ?? STANDARD_BUDGET;
  const maxSnippets = options.maxSnippets ?? budget.maxSnippets;
  const maxBytesPerFile = options.maxBytesPerFile ?? budget.maxBytesPerFile;
  const maxTotalBytes = options.maxTotalBytes ?? budget.maxTotalBytes;
  const denySecrets = options.denySecrets !== false;

  const repoPath = resolveRepoRoot(options.repoPath);
  const scope = normalizeScope(options.scope);
  const signals: string[] = [`repoRoot:${repoPath}`, `scope:${scope}`, `budget:${budget.tier}`];

  const scopeAbs = scope === '.' ? repoPath : resolve(repoPath, scope);

  if (!existsSync(scopeAbs)) {
    return {
      repoPath,
      scope,
      snippets: [],
      signals: [...signals, 'scope-missing'],
      budget,
    };
  }

  const files: string[] = [];
  listFiles(scopeAbs, repoPath, files);
  const kgNeighborSet = new Set<string>();

  // Se escopo é subpasta, também puxa manifests/docs da raiz (âncora do projeto)
  if (scope !== '.') {
    for (const name of ['README.md', 'package.json', 'docs/FOUNDATION.md']) {
      const abs = join(repoPath, name);
      if (existsSync(abs)) files.push(abs);
    }
    const traeRulesDir = join(repoPath, '.trae', 'rules');
    if (existsSync(traeRulesDir)) {
      listFiles(traeRulesDir, repoPath, files);
    }
    const neighborRels = knowledgeNeighborRelPaths(repoPath, scope);
    if (neighborRels.length > 0) {
      signals.push(`kg-neighbors:${neighborRels.length}`);
      for (const rel of neighborRels) {
        kgNeighborSet.add(rel);
        const abs = join(repoPath, rel);
        if (existsSync(abs)) files.push(abs);
      }
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
    if (denySecrets && isDeniedContextPath(rel)) {
      signals.push(`denied:${rel}`);
      continue;
    }
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
      score: priority(kind, rel) + (kgNeighborSet.has(rel) ? KG_SCORE_BOOST : 0),
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

  return { repoPath, scope, snippets, signals, budget };
}

/** @deprecated tipo movido para @aios/shared — re-export */
export type { ContextBundle, ContextSnippet };
