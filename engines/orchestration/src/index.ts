/** Orchestration Engine — Coordena workflow e plugins a partir do intent. */
import type { Intent, AgentResult, PolicyRule } from '@aios/shared'
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
}

/**
 * Executa plugins elegíveis e injeta referências de policies (`must`)
 * em cada resultado — ponta de injeção Fase 1 (policies > prompts).
 */
export async function runWorkflow(
  intent: Intent,
  options: WorkflowOptions = {},
): Promise<AgentResult[]> {
  const rules = options.policies ?? loadPolicies().rules
  const applied = applyPolicies(rules)
  const policyRefs = applied.mustIds.map((id) => `policy:${id}`)

  const results: AgentResult[] = []
  for (const plugin of plugins) {
    if (!shouldRunAgent(plugin.id, intent.kind)) continue
    const result = await plugin.run(intent)
    results.push({
      ...result,
      references: [...result.references, ...policyRefs],
      findings:
        applied.constraints.length > 0
          ? [`policies.injected`, ...result.findings]
          : result.findings,
    })
  }
  return results
}
