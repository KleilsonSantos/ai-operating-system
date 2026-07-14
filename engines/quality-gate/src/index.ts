/** Quality Gate — Valida a resposta antes de enviar ao usuário. */
import type { AgentResult, QualityVerdict } from "@aios/shared"

export function evaluateQuality(results: AgentResult[]): QualityVerdict {
  const checks = {
    agentsOk: results.every((r) => r.ok),
    hasFindings: results.some((r) => r.findings.length > 0),
  }
  const blockers = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name)
  return { passed: blockers.length === 0, checks, blockers }
}
