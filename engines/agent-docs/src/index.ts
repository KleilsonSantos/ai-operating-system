import type { AgentResult, Intent } from "@aios/shared"

/** Documentation Agent (plugin) — stub Fase 1 */
export async function runDocsAgent(_intent: Intent): Promise<AgentResult> {
  return {
    agentId: "docs",
    ok: true,
    findings: [],
    references: [],
  }
}
