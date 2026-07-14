/** Tipos compartilhados entre engines e apps (Fase 1). */

/** Intents canônicas do núcleo (issue #5). */
export type IntentKind =
  | 'analyze.project'
  | 'explain.code'
  | 'review.change'
  | 'unknown'

export type Intent = {
  /** Texto original do usuário */
  raw: string
  /** Classificação tipada */
  kind: IntentKind
  /** 0..1 — confiança da classificação */
  confidence: number
  /** Sinais que sustentaram a decisão (debug / audit) */
  signals: string[]
}

export type PolicyRule = {
  id: string
  description: string
  severity: 'must' | 'should' | 'may'
}

/** Snippet recuperado do repositório (Context Engine — #7). */
export type ContextSnippetKind = 'doc' | 'code' | 'manifest'

export type ContextSnippet = {
  /** Caminho relativo à raiz do repo */
  path: string
  kind: ContextSnippetKind
  /** Conteúdo truncado */
  content: string
  bytes: number
}

export type ContextBundle = {
  /** Raiz resolvida do repositório */
  repoPath: string
  /** Escopo relativo (`. ` = repo inteiro priorizado) */
  scope: string
  snippets: ContextSnippet[]
  /** Sinais de coleta (audit / debug) */
  signals: string[]
}

export type AgentResult = {
  agentId: string
  ok: boolean
  findings: string[]
  references: string[]
}

export type QualityVerdict = {
  passed: boolean
  checks: Record<string, boolean>
  blockers: string[]
}

/** Versão do contrato CLI/API estável (issue #9). */
export const PIPELINE_CONTRACT_VERSION = '1' as const

export type PipelineContractVersion = typeof PIPELINE_CONTRACT_VERSION

/** Entrada do registry multi-repo (Fase 2 · #43). */
export type WorkspaceEntry = {
  /** Identificador estável (ex.: `aios`, `portfolio`) */
  id: string
  /** Absoluto ou relativo à âncora do registry */
  path: string
  /** Label humano opcional */
  name?: string
  /** Se true, usado quando workspaceId omitido */
  default?: boolean
}

export type WorkspaceRegistry = {
  workspaces: WorkspaceEntry[]
}

/** Knowledge Graph (Fase 2 · #47). */
export type KnowledgeNodeKind =
  | 'project'
  | 'module'
  | 'package'
  | 'engine'
  | 'doc'
  | 'policy'
  | 'workspace'
  | 'infra'
  | 'api'
  | 'database'

export type KnowledgeEdgeKind = 'contains' | 'depends_on' | 'documents'

export type KnowledgeNode = {
  id: string
  kind: KnowledgeNodeKind
  label: string
  path?: string
  meta?: Record<string, string>
}

export type KnowledgeEdge = {
  from: string
  to: string
  kind: KnowledgeEdgeKind
}

export type KnowledgeGraph = {
  repoPath?: string
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  signals: string[]
}

/** Memory Engine (Fase 2 · #51). */
export type MemoryEntry = {
  id: string
  content: string
  createdAt: string
  tags?: string[]
}

export type MemoryStore = {
  workspaceId: string
  updatedAt: string
  entries: MemoryEntry[]
}

/** Pedido do integrador → núcleo AIOS. */
export type PipelineRequest = {
  /** Texto livre do usuário (intent raw) */
  input: string
  /** Diretório do repositório alvo (default: process.cwd()) */
  repoPath?: string
  /**
   * Id no registry `workspaces/aios.workspaces.json`.
   * Se definido, resolve `repoPath` (exceto se `repoPath` explícito vencer).
   */
  workspaceId?: string
  /** Escopo relativo para Context Engine */
  scope?: string
  /** JSON de policies (opcional; senão defaults / walk-up) */
  policiesPath?: string
  /** Override do arquivo de workspaces */
  workspacesPath?: string
  /**
   * Se true, anexa recall de memória ao response
   * (default: true quando workspaceId presente).
   */
  includeMemory?: boolean
  /** Limite de entradas de memória no response */
  memoryLimit?: number
}

/** Resposta estável do núcleo (stdout JSON do CLI = este shape). */
export type PipelineResponse = {
  contractVersion: PipelineContractVersion
  intent: Intent
  policies: {
    source: string
    path?: string
    count: number
    mustIds: string[]
  }
  context: {
    repoPath: string
    scope: string
    snippetCount: number
    paths: string[]
    signals: string[]
  }
  /** Presente quando um workspace do registry foi usado */
  workspace?: {
    id: string
    name?: string
    registryPath?: string
  }
  /** Resumo do Knowledge Graph heurístico (#47) */
  knowledge?: {
    nodeCount: number
    edgeCount: number
    kinds: Record<string, number>
    signals: string[]
  }
  /** Recall de memória de sessão/projeto (#51) */
  memory?: {
    workspaceId: string
    count: number
    entries: MemoryEntry[]
    path?: string
  }
  workflow: {
    ran: string[]
    skipped: string[]
  }
  results: AgentResult[]
  verdict: QualityVerdict
}
