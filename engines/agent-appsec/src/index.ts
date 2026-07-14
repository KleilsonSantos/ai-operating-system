import type { AgentResult, ContextBundle, Intent } from '@aios/shared'

const RISK =
  /\b(password|secret|api[_-]?key|private[_-]?key|eval\s*\(|dangerouslySetInnerHTML)\b/i

/** AppSec Agent — heurística Fase 1 (padrões de risco no contexto). */
export async function runAppsecAgent(
  intent: Intent,
  context?: ContextBundle,
): Promise<AgentResult> {
  const findings: string[] = [`intent:${intent.kind}`]
  const refs: string[] = []

  for (const s of context?.snippets ?? []) {
    if (RISK.test(s.content) || RISK.test(s.path)) {
      findings.push(`risk:pattern-in:${s.path}`)
      refs.push(s.path)
    }
  }

  if (refs.length === 0) {
    findings.push('scan:no-obvious-secret-patterns')
  }
  if (intent.kind === 'review.change') {
    findings.push('focus:review-auth-and-inputs')
  }
  if (context?.snippets.length) {
    findings.push(`context.snippets:${context.snippets.length}`)
  }

  return {
    agentId: 'appsec',
    ok: true,
    findings,
    references: refs.slice(0, 3),
  }
}
