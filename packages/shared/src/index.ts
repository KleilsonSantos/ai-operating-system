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
