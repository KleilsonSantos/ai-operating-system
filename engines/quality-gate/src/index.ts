/**
 * Quality Gate — valida o pacote antes de considerar a resposta OK (#8).
 */
import type { AgentResult, ContextBundle, Intent, QualityVerdict } from '@aios/shared';
import { agentsForIntent } from '@aios/decision';

export type EvaluateQualityOptions = {
  intent: Intent;
  context?: ContextBundle;
  /** Agentes que o Decision pulou de propósito */
  skipped?: string[];
};

/**
 * Bloqueia resposta inconsistente:
 * - algum agent `ok: false`
 * - intent conhecido sem nenhum agent rodando
 * - `analyze.project` sem snippets de contexto
 * - agents obrigatórios faltando no resultado
 * - falta rastro `policies.injected` quando houve agents
 */
export function evaluateQuality(
  results: AgentResult[],
  options?: EvaluateQualityOptions
): QualityVerdict {
  const checks: Record<string, boolean> = {
    agentsOk: results.every((r) => r.ok),
  };

  if (!options) {
    checks.hasFindings = results.some((r) => r.findings.length > 0);
    const blockers = Object.entries(checks)
      .filter(([, ok]) => !ok)
      .map(([name]) => name);
    return { passed: blockers.length === 0, checks, blockers };
  }

  const { intent, context } = options;
  const expected = agentsForIntent(intent.kind);
  const ranIds = new Set(results.map((r) => r.agentId));

  checks.agentsScheduled =
    intent.kind === 'unknown' ? results.length === 0 : expected.every((id) => ranIds.has(id));

  checks.nonEmptyRun = intent.kind === 'unknown' ? true : results.length > 0;

  checks.contextPresent =
    intent.kind !== 'analyze.project' ? true : Boolean(context && context.snippets.length > 0);

  checks.policiesInjected =
    results.length === 0 ? true : results.every((r) => r.findings.includes('policies.injected'));

  checks.hasDomainFindings =
    results.length === 0
      ? true
      : results.every((r) =>
          r.findings.some((f) => !f.startsWith('policies.') && !f.startsWith('context.injected'))
        );

  const blockers = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  return { passed: blockers.length === 0, checks, blockers };
}
