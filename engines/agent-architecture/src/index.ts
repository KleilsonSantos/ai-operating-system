import type { AgentResult, Intent } from "@aios/shared"

/** Architecture Agent (plugin) — stub Fase 1 */
export async function runArchitectureAgent(_intent: Intent): Promise<AgentResult> {
  return {
    agentId: "architecture",
    ok: true,
    findings: [],
    references: [],
  }
}
