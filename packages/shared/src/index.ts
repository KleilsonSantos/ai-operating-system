/** Tipos compartilhados entre engines e apps (Fase 1). */

/** Intents canônicas do núcleo (#5 · v2 #63). */
export type IntentKind =
  | 'analyze.project'
  | 'explain.code'
  | 'review.change'
  | 'implement.feature'
  | 'fix.bug'
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

/** Entrada do registry multi-repo (Fase 2 · #43 · Fase 3 · #55). */
export type WorkspaceEntry = {
  /** Identificador estável (ex.: `aios`, `portfolio`) */
  id: string
  /** Absoluto ou relativo à âncora do registry */
  path: string
  /** Label humano opcional */
  name?: string
  /** Se true, usado quando workspaceId omitido */
  default?: boolean
  /** Tags livres (ex.: `frontend`, `java`) */
  tags?: string[]
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

/** Prompt Engine — brief governado (#59). */
export type CompilePromptRequest = {
  input: string
  workspaceId?: string
  repoPath?: string
  policiesPath?: string
  memoryLimit?: number
}

export type CompiledPrompt = {
  input: string
  intent: Intent
  workspaceId?: string
  repoPath: string
  /** Texto pronto para o Agent (markdown curto) */
  brief: string
  stats: {
    mustPolicyCount: number
    memoryCount: number
    knowledgeNodes: number
    briefChars: number
  }
}

/** Multi-provider MVP (#67) — LLM auxiliar (não substitui a IDE). */
export type ProviderId = 'ollama'

export type ChatRole = 'system' | 'user' | 'assistant'

export type ChatMessage = {
  role: ChatRole
  content: string
}

export type ChatRequest = {
  model?: string
  messages: ChatMessage[]
  temperature?: number
}

export type ChatResponse = {
  provider: string
  model: string
  message: ChatMessage
}

export type ProviderModelInfo = {
  name: string
  size?: number
  modifiedAt?: string
}

export type ProviderHealth = {
  provider: string
  ok: boolean
  baseUrl: string
  models?: string[]
  error?: string
  latencyMs?: number
}

/** Console de governança — status + attention (#71). */
export type AttentionSeverity = 'error' | 'warn' | 'info'

export type AttentionItem = {
  id: string
  severity: AttentionSeverity
  title: string
  detail: string
}

export type GovernanceStatus = {
  generatedAt: string
  contractVersion: PipelineContractVersion
  homePath: string
  workspaces: Array<{
    id: string
    name?: string
    repoPath: string
    ok: boolean
    signals: string[]
  }>
  policies: {
    source: string
    path?: string
    count: number
    mustIds: string[]
  }
  provider: ProviderHealth
  memory: {
    workspaceIds: string[]
  }
  exposed: {
    mcpTools: string[]
    providers: string[]
  }
  attention: AttentionItem[]
  metrics: {
    available: boolean
    note: string
    eventCount?: number
    path?: string
  }
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
