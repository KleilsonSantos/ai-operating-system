/** Orchestration Engine — Coordena workflow e plugins a partir do intent. */
import type {
  Intent,
  AgentResult,
  PolicyRule,
  ContextBundle,
} from '@aios/shared'
import { applyPolicies, loadPolicies } from '@aios/policy'
import { shouldRunAgent } from '@aios/decision'
import { runArchitectureAgent } from '@aios/agent-architecture'
import { runAppsecAgent } from '@aios/agent-appsec'
import { runDocsAgent } from '@aios/agent-docs'
import { runQaAgent } from '@aios/agent-qa'

const plugins = [
  { id: 'architecture', run: runArchitectureAgent },
  { id: 'appsec', run: runAppsecAgent },
  { id: 'docs', run: runDocsAgent },
  { id: 'qa', run: runQaAgent },
] as const

export type WorkflowOptions = {
  /** Policies already loaded; se omitido, usa `loadPolicies()` */
  policies?: PolicyRule[]
  /** Bundle do Context Engine — injetado nos plugins (#7) */
  context?: ContextBundle
}

/**
 * Executa plugins elegíveis e injeta policies + referências de contexto.
 */
export async function runWorkflow(
  intent: Intent,
  options: WorkflowOptions = {},
): Promise<AgentResult[]> {
  const rules = options.policies ?? loadPolicies().rules
  const applied = applyPolicies(rules)
  const policyRefs = applied.mustIds.map((id) => `policy:${id}`)
  const ctx = options.context
  const contextRefs = (ctx?.snippets ?? []).map((s) => `context:${s.path}`)

  const results: AgentResult[] = []
  for (const plugin of plugins) {
    if (!shouldRunAgent(plugin.id, intent.kind)) continue
    const result = await plugin.run(intent, ctx)
    const findings = [...result.findings]
    if (applied.constraints.length > 0) findings.unshift('policies.injected')
    if (ctx && ctx.snippets.length > 0) {
      findings.unshift(`context.injected:${ctx.snippets.length}`)
    }
    results.push({
      ...result,
      references: [...result.references, ...policyRefs, ...contextRefs],
      findings,
    })
  }
  return results
}
