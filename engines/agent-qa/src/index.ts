import type { AgentResult, Intent } from "@aios/shared"

/** QA Agent (plugin) — stub Fase 1 */
export async function runQaAgent(_intent: Intent): Promise<AgentResult> {
  return {
    agentId: "qa",
    ok: true,
    findings: [],
    references: [],
  }
}
