/**
 * Decision Engine — decide quais plugins participam do workflow (#8).
 * Fase 1: matriz estática por IntentKind (sem LLM).
 */
import type { IntentKind } from '@aios/shared'

export type AgentId = 'architecture' | 'appsec' | 'docs' | 'qa'

/** Matriz intent → agentes. `unknown` não agenda ninguém. */
export const AGENT_MATRIX: Record<IntentKind, readonly AgentId[]> = {
  'analyze.project': ['architecture', 'appsec', 'docs', 'qa'],
  'explain.code': ['architecture', 'docs'],
  'review.change': ['architecture', 'appsec', 'qa'],
  unknown: [],
}

export function agentsForIntent(kind: IntentKind): readonly AgentId[] {
  return AGENT_MATRIX[kind] ?? []
}

/**
 * Retorna true se o agente deve rodar para este intent.
 */
export function shouldRunAgent(agentId: string, intentKind: string): boolean {
  const kind = intentKind as IntentKind
  const list = agentsForIntent(kind)
  return list.includes(agentId as AgentId)
}
