/** Intent Engine — Interpreta o pedido do usuário em Intent tipado. */
import type { Intent } from "@aios/shared"

export function resolveIntent(raw: string): Intent {
  return { raw, kind: "analyze.project", confidence: 0 }
}
