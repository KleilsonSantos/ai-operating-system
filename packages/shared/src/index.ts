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

/** Pedido do integrador → núcleo AIOS. */
export type PipelineRequest = {
  /** Texto livre do usuário (intent raw) */
  input: string
  /** Diretório do repositório alvo (default: process.cwd()) */
  repoPath?: string
  /** Escopo relativo para Context Engine */
  scope?: string
  /** JSON de policies (opcional; senão defaults / walk-up) */
  policiesPath?: string
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
  workflow: {
    ran: string[]
    skipped: string[]
  }
  results: AgentResult[]
  verdict: QualityVerdict
}
