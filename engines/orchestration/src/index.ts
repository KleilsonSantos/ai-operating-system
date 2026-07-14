/** Orchestration Engine — Coordena workflow e plugins a partir do intent. */
import type { Intent, AgentResult } from "@aios/shared"
import { shouldRunAgent } from "@aios/decision"
import { runArchitectureAgent } from "@aios/agent-architecture"
import { runAppsecAgent } from "@aios/agent-appsec"
import { runDocsAgent } from "@aios/agent-docs"
import { runQaAgent } from "@aios/agent-qa"

const plugins = [
  { id: "architecture", run: runArchitectureAgent },
  { id: "appsec", run: runAppsecAgent },
  { id: "docs", run: runDocsAgent },
  { id: "qa", run: runQaAgent },
] as const

export async function runWorkflow(intent: Intent): Promise<AgentResult[]> {
  const results: AgentResult[] = []
  for (const plugin of plugins) {
    if (!shouldRunAgent(plugin.id, intent.kind)) continue
    results.push(await plugin.run(intent))
  }
  return results
}
