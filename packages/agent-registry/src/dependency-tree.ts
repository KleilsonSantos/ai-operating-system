import type { AgentEntry } from './index.js';

export type AgentDependencyIssue =
  | { kind: 'missing'; name: string }
  | { kind: 'cycle'; path: string[] }
  | { kind: 'max_depth'; name: string }
  | { kind: 'version_mismatch'; name: string; requested?: string; resolved: string };

export interface AgentDependencyTreeNode {
  name: string;
  version: string;
  source?: AgentEntry['source'];
  displayName?: string;
  engines?: string[];
  agentDependencies?: Array<{ name: string; version?: string }>;
  children: AgentDependencyTreeNode[];
  issues: AgentDependencyIssue[];
}

export interface ResolveDependencyTreeOptions {
  /** Maximum agent-to-agent depth (default 8). */
  maxDepth?: number;
}

export function buildAgentIndex(agents: AgentEntry[]): Map<string, AgentEntry> {
  return new Map(agents.map((agent) => [agent.manifest.name, agent]));
}

/**
 * Resolve a transitive agent dependency tree from a flat registry list.
 * Engine dependencies are listed on each node but not expanded as child agents.
 */
export function resolveDependencyTree(
  rootName: string,
  agents: AgentEntry[],
  options: ResolveDependencyTreeOptions = {}
): AgentDependencyTreeNode | null {
  const index = buildAgentIndex(agents);
  const root = index.get(rootName);
  if (!root) return null;

  const maxDepth = options.maxDepth ?? 8;
  return walkNode(root, index, [], maxDepth);
}

function walkNode(
  entry: AgentEntry,
  index: Map<string, AgentEntry>,
  path: string[],
  maxDepth: number
): AgentDependencyTreeNode {
  const name = entry.manifest.name;
  const agentDeps = entry.manifest.dependencies?.agents ?? [];
  const engines = entry.manifest.dependencies?.engines;
  const node: AgentDependencyTreeNode = {
    name,
    version: entry.manifest.version,
    source: entry.source,
    displayName: entry.manifest.displayName,
    engines: engines?.length ? [...engines] : undefined,
    agentDependencies: agentDeps.length ? agentDeps.map((d) => ({ ...d })) : undefined,
    children: [],
    issues: [],
  };

  if (path.includes(name)) {
    node.issues.push({ kind: 'cycle', path: [...path, name] });
    return node;
  }

  if (path.length >= maxDepth) {
    node.issues.push({ kind: 'max_depth', name });
    return node;
  }

  const nextPath = [...path, name];
  for (const dep of agentDeps) {
    const childEntry = index.get(dep.name);
    if (!childEntry) {
      node.children.push({
        name: dep.name,
        version: dep.version ?? 'unknown',
        children: [],
        issues: [{ kind: 'missing', name: dep.name }],
      });
      continue;
    }

    if (dep.version && dep.version !== childEntry.manifest.version) {
      node.issues.push({
        kind: 'version_mismatch',
        name: dep.name,
        requested: dep.version,
        resolved: childEntry.manifest.version,
      });
    }

    node.children.push(walkNode(childEntry, index, nextPath, maxDepth));
  }

  return node;
}

/** Collect issue strings for console / MCP consumers. */
export function formatDependencyIssues(node: AgentDependencyTreeNode): string[] {
  const lines: string[] = [];
  for (const issue of node.issues) {
    if (issue.kind === 'missing') lines.push(`missing dependency: ${issue.name}`);
    if (issue.kind === 'cycle') lines.push(`cycle: ${issue.path.join(' → ')}`);
    if (issue.kind === 'max_depth') lines.push(`max depth reached at: ${issue.name}`);
    if (issue.kind === 'version_mismatch') {
      lines.push(
        `version mismatch for ${issue.name}: requested ${issue.requested ?? '?'}, resolved ${issue.resolved}`
      );
    }
  }
  for (const child of node.children) {
    lines.push(...formatDependencyIssues(child));
  }
  return lines;
}

/** Pretty-print a dependency tree for CLI text output. */
export function formatDependencyTreeText(node: AgentDependencyTreeNode, indent = 0): string[] {
  const prefix = indent === 0 ? '' : `${'  '.repeat(indent - 1)}└─ `;
  const label = `${node.displayName || node.name} (${node.version})`;
  const engineHint =
    node.engines?.length && indent === 0 ? ` [engines: ${node.engines.join(', ')}]` : '';
  const lines = [`${prefix}${label}${engineHint}`];
  for (const child of node.children) {
    lines.push(...formatDependencyTreeText(child, indent + 1));
  }
  return lines;
}
