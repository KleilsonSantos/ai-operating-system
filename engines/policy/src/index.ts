/** Policy Engine — Regras globais da plataforma (substituem prompts longos). */
import type { PolicyRule } from "@aios/shared"

export const defaultPolicies: PolicyRule[] = [
  { id: "official-docs", description: "Consultar documentação oficial", severity: "must" },
  { id: "trade-offs", description: "Indicar trade-offs", severity: "must" },
  { id: "no-overengineering", description: "Evitar overengineering", severity: "must" },
  { id: "justify-decisions", description: "Justificar decisões", severity: "must" },
  { id: "no-abandoned-libs", description: "Não usar biblioteca abandonada", severity: "must" },
]

export function loadPolicies(): PolicyRule[] {
  return defaultPolicies
}
