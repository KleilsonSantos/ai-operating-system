import type { AgentResult, ContextBundle, Intent } from '@aios/shared'

/** QA Agent (plugin) — stub Fase 1; recebe contexto tipado. */
export async function runQaAgent(
  _intent: Intent,
  context?: ContextBundle,
): Promise<AgentResult> {
  const findings: string[] = []
  if (context?.snippets.length) {
    findings.push(`context.snippets:${context.snippets.length}`)
  }
  return {
    agentId: 'qa',
    ok: true,
    findings,
    references: context?.snippets.slice(0, 3).map((s) => s.path) ?? [],
  }
}
