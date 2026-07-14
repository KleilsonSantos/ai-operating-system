import type { AgentResult, ContextBundle, Intent } from '@aios/shared'

/** QA Agent — heurística Fase 1 (sinais de teste no contexto). */
export async function runQaAgent(
  intent: Intent,
  context?: ContextBundle,
): Promise<AgentResult> {
  const paths = context?.snippets.map((s) => s.path) ?? []
  const findings: string[] = [`intent:${intent.kind}`]
  const tests = paths.filter(
    (p) => /\.(test|spec)\.[cm]?[jt]sx?$/i.test(p) || /\/__tests__\//i.test(p),
  )

  if (tests.length > 0) {
    findings.push(`tests:found:${tests.length}`)
  } else {
    findings.push('gap:no-test-files-in-context')
  }

  if (context?.snippets.length) {
    findings.push(`context.snippets:${context.snippets.length}`)
  }
  if (intent.kind === 'review.change') {
    findings.push('focus:regression-risk')
  }
  if (intent.kind === 'analyze.project') {
    findings.push('focus:coverage-baseline')
  }

  return {
    agentId: 'qa',
    ok: true,
    findings,
    references: tests.slice(0, 3),
  }
}
