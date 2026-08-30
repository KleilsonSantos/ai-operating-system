/**
 * Unidirectional Obsidian vault export (ADR-0030 / #366).
 * Opt-in · on-demand · never mutates docs/adr/ or policies/.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import type { KnowledgeEdge, KnowledgeGraph, KnowledgeNode, PipelineRun } from '@aios/shared';
import { buildKnowledgeGraph } from '@aios/knowledge';

export type ExportObsidianOptions = {
  homePath?: string;
  /** Repo root for heuristic KG (defaults to homePath). */
  repoPath?: string;
  /**
   * Destination vault folder. Defaults to `<homePath>/.aios/export/obsidian`.
   * Must not land inside `docs/adr/` or `policies/`.
   */
  outDir?: string;
  /** Export every KG node (default true). When false + scope, filter to matched paths. */
  fullGraph?: boolean;
  scope?: string;
  runId?: string;
  /** Injected run body for a richer runs/<id>.md note. */
  run?: PipelineRun;
};

export type ExportObsidianResult = {
  outDir: string;
  written: string[];
  nodeCount: number;
  edgeCount: number;
  runNote?: string;
  generatedAt: string;
};

function resolveHome(homePath?: string): string {
  return resolve(homePath || process.env.AIOS_HOME || process.cwd());
}

/** Stable Obsidian note basename from aios node id. */
export function noteBasename(nodeId: string): string {
  return nodeId
    .replace(/[/\\:]+/g, '-')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

function yamlEscape(value: string): string {
  if (/[:#{}[\],&*?|>!%@`]/.test(value) || value.includes('\n') || value.includes('"')) {
    return JSON.stringify(value);
  }
  return value;
}

function isUnder(child: string, parent: string): boolean {
  const c = resolve(child);
  const p = resolve(parent);
  return c === p || c.startsWith(p + sep);
}

/**
 * Reject export roots that would overwrite canonical AIOS paths.
 */
export function assertSafeObsidianOutDir(
  outDir: string,
  roots: { homePath: string; repoPath: string }
): void {
  const resolved = resolve(outDir);
  const forbidden = [
    resolve(roots.homePath, 'docs', 'adr'),
    resolve(roots.homePath, 'policies'),
    resolve(roots.repoPath, 'docs', 'adr'),
    resolve(roots.repoPath, 'policies'),
  ];
  for (const f of forbidden) {
    if (isUnder(resolved, f)) {
      throw new Error(
        `exportObsidian: outDir must not overlap docs/adr/ or policies/ (got ${resolved})`
      );
    }
  }
}

function matchNodeIds(nodes: KnowledgeNode[], scope: string): Set<string> {
  const normalized = scope.replace(/\\/g, '/').replace(/^\.\//, '');
  const ids = new Set<string>();
  for (const n of nodes) {
    if (!n.path) continue;
    const p = n.path.replace(/\\/g, '/');
    if (p === normalized || p.startsWith(`${normalized}/`) || normalized.startsWith(`${p}/`)) {
      ids.add(n.id);
    }
  }
  return ids;
}

function filterGraph(graph: KnowledgeGraph, scope?: string, fullGraph = true): KnowledgeGraph {
  if (fullGraph || !scope) return graph;
  const keep = matchNodeIds(graph.nodes, scope);
  if (keep.size === 0) {
    return { ...graph, nodes: [], edges: [], signals: [...graph.signals, 'export:no-scope-match'] };
  }
  const nodes = graph.nodes.filter((n) => keep.has(n.id));
  const edges = graph.edges.filter((e) => keep.has(e.from) && keep.has(e.to));
  return { ...graph, nodes, edges };
}

function frontmatter(fields: Record<string, string | undefined>): string {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === '') continue;
    lines.push(`${k}: ${yamlEscape(v)}`);
  }
  lines.push('---', '');
  return lines.join('\n');
}

function nodeMarkdown(
  node: KnowledgeNode,
  edges: KnowledgeEdge[],
  basenameById: Map<string, string>,
  generatedAt: string
): string {
  const outgoing = edges.filter((e) => e.from === node.id);
  const incoming = edges.filter((e) => e.to === node.id);
  const linkLines: string[] = [];
  for (const e of outgoing) {
    const base = basenameById.get(e.to);
    if (base) linkLines.push(`- [[${base}]] (${e.kind})`);
  }
  for (const e of incoming) {
    const base = basenameById.get(e.from);
    if (base) linkLines.push(`- [[${base}]] ← ${e.kind}`);
  }

  return (
    frontmatter({
      aios_node_id: node.id,
      aios_kind: node.kind,
      aios_path: node.path,
      aios_exported_at: generatedAt,
    }) +
    `# ${node.label}\n\n` +
    (node.path ? `Path: \`${node.path}\`\n\n` : '') +
    (linkLines.length ? `## Links\n\n${linkLines.join('\n')}\n` : '## Links\n\n_(none)_\n')
  );
}

function indexMarkdown(
  nodes: KnowledgeNode[],
  basenameById: Map<string, string>,
  generatedAt: string,
  meta: { repoPath: string; runNote?: string; signals: string[] }
): string {
  const byKind = new Map<string, KnowledgeNode[]>();
  for (const n of nodes) {
    const list = byKind.get(n.kind) || [];
    list.push(n);
    byKind.set(n.kind, list);
  }
  const sections: string[] = [];
  for (const kind of [...byKind.keys()].sort()) {
    const items = (byKind.get(kind) || [])
      .map((n) => {
        const base = basenameById.get(n.id)!;
        return `- [[graph/${base}|${n.label}]] (\`${n.id}\`)`;
      })
      .join('\n');
    sections.push(`## ${kind}\n\n${items}`);
  }

  return (
    frontmatter({
      aios_kind: 'export-index',
      aios_exported_at: generatedAt,
      aios_repo: meta.repoPath,
    }) +
    `# AIOS Knowledge export\n\n` +
    `Generated: \`${generatedAt}\`\n\n` +
    `Repo: \`${meta.repoPath}\`\n\n` +
    (meta.runNote ? `Run note: [[${meta.runNote}]]\n\n` : '') +
    (meta.signals.length
      ? `Signals: ${meta.signals
          .slice(0, 8)
          .map((s) => `\`${s}\``)
          .join(', ')}\n\n`
      : '') +
    sections.join('\n\n') +
    '\n'
  );
}

function runMarkdown(input: { runId: string; run?: PipelineRun; generatedAt: string }): string {
  const { runId, run, generatedAt } = input;
  const steps =
    run?.steps
      .map(
        (s) => `- \`${s.stepId}\` · ${s.kind} · ${s.status}${s.agentId ? ` · ${s.agentId}` : ''}`
      )
      .join('\n') || '_(run body unavailable — PipelineRun not persisted)_';

  return (
    frontmatter({
      aios_run_id: runId,
      aios_kind: 'run',
      aios_exported_at: generatedAt,
      aios_run_lookup: run ? 'provided' : 'unavailable',
    }) +
    `# Run ${runId}\n\n` +
    (run ? `Intent: \`${run.intentKind}\` · task: \`${run.taskId}\`\n\n` : '') +
    `## Steps\n\n${steps}\n`
  );
}

function writeRelative(outDir: string, rel: string, body: string, written: string[]): void {
  const abs = join(outDir, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body, 'utf8');
  written.push(rel.replace(/\\/g, '/'));
}

/**
 * Export heuristic KG (+ optional run note) as Markdown + YAML frontmatter + wikilinks.
 */
export function exportObsidian(options: ExportObsidianOptions = {}): ExportObsidianResult {
  const homePath = resolveHome(options.homePath);
  const repoPath = resolve(options.repoPath || homePath);
  const outDir = resolve(options.outDir || join(homePath, '.aios', 'export', 'obsidian'));
  assertSafeObsidianOutDir(outDir, { homePath, repoPath });

  if (options.run && options.runId && options.run.runId !== options.runId) {
    throw new Error(
      `exportObsidian: run.runId (${options.run.runId}) !== runId (${options.runId})`
    );
  }

  const generatedAt = new Date().toISOString();
  const fullGraph = options.fullGraph !== false;
  const raw = buildKnowledgeGraph({ repoPath });
  const graph = filterGraph(raw, options.scope, fullGraph);

  const basenameById = new Map<string, string>();
  const used = new Set<string>();
  for (const n of graph.nodes) {
    const base = noteBasename(n.id) || 'node';
    let candidate = base;
    let i = 2;
    while (used.has(candidate)) {
      candidate = `${base}-${i++}`;
    }
    used.add(candidate);
    basenameById.set(n.id, candidate);
  }

  const written: string[] = [];
  for (const n of graph.nodes) {
    const base = basenameById.get(n.id)!;
    writeRelative(
      outDir,
      join('graph', `${base}.md`),
      nodeMarkdown(n, graph.edges, basenameById, generatedAt),
      written
    );
  }

  let runNote: string | undefined;
  if (options.runId) {
    const safeRun = noteBasename(options.runId) || 'run';
    const rel = join('runs', `${safeRun}.md`);
    writeRelative(
      outDir,
      rel,
      runMarkdown({ runId: options.runId, run: options.run, generatedAt }),
      written
    );
    runNote = rel.replace(/\\/g, '/').replace(/\.md$/, '');
  }

  writeRelative(
    outDir,
    'index.md',
    indexMarkdown(graph.nodes, basenameById, generatedAt, {
      repoPath,
      runNote,
      signals: graph.signals,
    }),
    written
  );

  // README pointer — vault is a view, not SSOT
  writeRelative(
    outDir,
    'README.md',
    [
      '# AIOS → Obsidian export',
      '',
      'Unidirectional view of the AIOS heuristic Knowledge Graph (ADR-0030).',
      'Do not treat this vault as memory or policy source of truth.',
      '',
      `Generated: ${generatedAt}`,
      `Source repo: \`${repoPath}\``,
      '',
      'Start at [[index]].',
      '',
    ].join('\n'),
    written
  );

  return {
    outDir,
    written: written.sort(),
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    ...(runNote ? { runNote } : {}),
    generatedAt,
  };
}

/** Relative path helper for tests / callers. */
export function relativeToOut(outDir: string, absFile: string): string {
  return relative(outDir, absFile).replace(/\\/g, '/');
}
