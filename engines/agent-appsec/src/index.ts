import type { AgentResult, Intent } from "@aios/shared"

/** AppSec Agent (plugin) — stub Fase 1 */
export async function runAppsecAgent(_intent: Intent): Promise<AgentResult> {
  return {
    agentId: "appsec",
    ok: true,
    findings: [],
    references: [],
  }
}
