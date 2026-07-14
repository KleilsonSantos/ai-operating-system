/**
 * Knowledge Engine — grafo heurístico do repositório (Fase 2 · #47).
 * Sem embeddings / LLM: filesystem + manifests + nomes canônicos.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import type {
  KnowledgeEdge,
  KnowledgeEdgeKind,
  KnowledgeGraph,
  KnowledgeNode,
  KnowledgeNodeKind,
} from '@aios/shared'

export type BuildKnowledgeOptions = {
  repoPath: string
  /** Cap de nós (default 80) */
  maxNodes?: number
  /** Cap de arestas (default 120) */
  maxEdges?: number
}

const IGNORE = new Set([
  'node_modules',
  '.git',
  'dist',
  '.turbo',
  'coverage',
  '.next',
  'build',
  '.cache',
])

function nodeId(kind: KnowledgeNodeKind, key: string): string {
  return `${kind}:${key}`
}

function addNode(
  map: Map<string, KnowledgeNode>,
  kind: KnowledgeNodeKind,
  key: string,
  label: string,
  path?: string,
  meta?: Record<string, string>,
): KnowledgeNode | undefined {
  const id = nodeId(kind, key)
  if (map.has(id)) return map.get(id)
  const n: KnowledgeNode = { id, kind, label }
  if (path) n.path = path
  if (meta) n.meta = meta
  map.set(id, n)
  return n
}

function addEdge(
  edges: KnowledgeEdge[],
  seen: Set<string>,
  from: string,
  to: string,
  kind: KnowledgeEdgeKind,
): void {
  const key = `${from}->${to}:${kind}`
  if (seen.has(key) || from === to) return
  seen.add(key)
  edges.push({ from, to, kind })
}

function listDirs(abs: string): string[] {
  if (!existsSync(abs)) return []
  return readdirSync(abs).filter((name) => {
    if (IGNORE.has(name) || name.startsWith('.')) return false
    try {
      return statSync(join(abs, name)).isDirectory()
    } catch {
      return false
    }
  })
}

function readJson(path: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
  } catch {
    return undefined
  }
}

function packageName(pkgPath: string, fallback: string): string {
  const j = readJson(pkgPath)
  if (j && typeof j.name === 'string' && j.name.trim()) return j.name.trim()
  return fallback
}

/**
 * Constrói Knowledge Graph básico a partir do layout do repo.
 */
export function buildKnowledgeGraph(
  options: BuildKnowledgeOptions,
): KnowledgeGraph {
  const root = resolve(options.repoPath)
  const maxNodes = options.maxNodes ?? 80
  const maxEdges = options.maxEdges ?? 120
  const signals: string[] = [`repoRoot:${root}`]
  const nodes = new Map<string, KnowledgeNode>()
  const edges: KnowledgeEdge[] = []
  const seenEdges = new Set<string>()

  const projectLabel = packageName(join(root, 'package.json'), basename(root))
  const project = addNode(nodes, 'project', 'root', projectLabel, '.')
  if (!project) {
    return { nodes: [], edges: [], signals: [...signals, 'error:no-project'] }
  }

  // Docs canônicas
  const docCandidates = [
    'docs/FOUNDATION.md',
    'docs/VISION.md',
    'docs/ROADMAP.md',
    'docs/architecture/overview.md',
    'README.md',
    'AGENTS.md',
  ]
  for (const rel of docCandidates) {
    if (!existsSync(join(root, rel))) continue
    const n = addNode(nodes, 'doc', rel, basename(rel), rel)
    if (n) addEdge(edges, seenEdges, project.id, n.id, 'documents')
  }
  if (existsSync(join(root, 'docs', 'adr'))) {
    const adr = addNode(nodes, 'doc', 'docs/adr', 'ADRs', 'docs/adr')
    if (adr) addEdge(edges, seenEdges, project.id, adr.id, 'documents')
  }

  // Packages / engines / apps (monorepo)
  for (const bucket of ['packages', 'engines', 'apps'] as const) {
    const bucketAbs = join(root, bucket)
    const kids = listDirs(bucketAbs)
    if (kids.length === 0) continue
    const bucketNode = addNode(
      nodes,
      'module',
      bucket,
      bucket,
      bucket,
      { role: 'workspace-bucket' },
    )
    if (bucketNode) {
      addEdge(edges, seenEdges, project.id, bucketNode.id, 'contains')
    }
    for (const kid of kids) {
      if (nodes.size >= maxNodes) break
      const rel = `${bucket}/${kid}`
      const pkgFile = join(root, rel, 'package.json')
      const label = existsSync(pkgFile)
        ? packageName(pkgFile, kid)
        : kid
      const kind: KnowledgeNodeKind =
        bucket === 'engines' ? 'engine' : 'package'
      const n = addNode(nodes, kind, rel, label, rel)
      if (n && bucketNode) {
        addEdge(edges, seenEdges, bucketNode.id, n.id, 'contains')
        // depends_on workspace:* from package.json
        const pj = readJson(pkgFile)
        const deps = {
          ...(pj?.dependencies as Record<string, string> | undefined),
          ...(pj?.devDependencies as Record<string, string> | undefined),
        }
        for (const [depName, ver] of Object.entries(deps ?? {})) {
          if (typeof ver !== 'string' || !ver.startsWith('workspace:')) continue
          // find node by label match
          for (const other of nodes.values()) {
            if (other.label === depName && other.id !== n.id) {
              addEdge(edges, seenEdges, n.id, other.id, 'depends_on')
            }
          }
        }
      }
    }
  }

  // Policies
  if (existsSync(join(root, 'policies', 'aios.policies.json'))) {
    const pol = addNode(
      nodes,
      'policy',
      'policies/aios.policies.json',
      'aios.policies',
      'policies/aios.policies.json',
    )
    if (pol) addEdge(edges, seenEdges, project.id, pol.id, 'documents')
  }

  // Workspaces registry
  if (existsSync(join(root, 'workspaces', 'aios.workspaces.json'))) {
    const ws = addNode(
      nodes,
      'workspace',
      'workspaces/aios.workspaces.json',
      'workspaces registry',
      'workspaces/aios.workspaces.json',
    )
    if (ws) addEdge(edges, seenEdges, project.id, ws.id, 'contains')
  }

  // Infra hints
  const infraFiles: Array<{ file: string; kind: KnowledgeNodeKind; label: string }> =
    [
      { file: 'docker-compose.yml', kind: 'infra', label: 'docker-compose' },
      { file: 'docker-compose.yaml', kind: 'infra', label: 'docker-compose' },
      { file: 'Dockerfile', kind: 'infra', label: 'Dockerfile' },
      { file: 'compose.yaml', kind: 'infra', label: 'compose' },
    ]
  for (const item of infraFiles) {
    if (!existsSync(join(root, item.file))) continue
    const n = addNode(nodes, item.kind, item.file, item.label, item.file)
    if (n) addEdge(edges, seenEdges, project.id, n.id, 'contains')
    signals.push(`infra:${item.file}`)
  }

  // API / DB keywords in package.json dependencies (shallow)
  const rootPkg = readJson(join(root, 'package.json'))
  const allDeps = {
    ...(rootPkg?.dependencies as Record<string, string> | undefined),
    ...(rootPkg?.devDependencies as Record<string, string> | undefined),
  }
  const apiHints = ['express', 'fastify', 'hono', '@nestjs/core', 'koa']
  const dbHints = ['pg', 'postgres', 'mysql', 'mongodb', 'prisma', 'drizzle-orm']
  for (const name of Object.keys(allDeps ?? {})) {
    if (apiHints.some((h) => name === h || name.includes(h))) {
      const n = addNode(nodes, 'api', name, name, undefined, { via: 'dep' })
      if (n) addEdge(edges, seenEdges, project.id, n.id, 'depends_on')
      signals.push(`api-dep:${name}`)
    }
    if (dbHints.some((h) => name === h || name.includes(h))) {
      const n = addNode(nodes, 'database', name, name, undefined, { via: 'dep' })
      if (n) addEdge(edges, seenEdges, project.id, n.id, 'depends_on')
      signals.push(`db-dep:${name}`)
    }
  }

  let nodeList = [...nodes.values()]
  let edgeList = edges
  if (nodeList.length > maxNodes) {
    nodeList = nodeList.slice(0, maxNodes)
    signals.push('capped:maxNodes')
  }
  if (edgeList.length > maxEdges) {
    edgeList = edgeList.slice(0, maxEdges)
    signals.push('capped:maxEdges')
  }
  signals.push(`nodes:${nodeList.length}`, `edges:${edgeList.length}`)

  return {
    repoPath: root,
    nodes: nodeList,
    edges: edgeList,
    signals,
  }
}

/** Resumo compacto para PipelineResponse / MCP. */
export function summarizeKnowledge(graph: KnowledgeGraph): {
  nodeCount: number
  edgeCount: number
  kinds: Record<string, number>
  signals: string[]
} {
  const kinds: Record<string, number> = {}
  for (const n of graph.nodes) {
    kinds[n.kind] = (kinds[n.kind] ?? 0) + 1
  }
  return {
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    kinds,
    signals: graph.signals,
  }
}