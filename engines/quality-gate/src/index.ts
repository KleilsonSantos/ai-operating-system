/**
 * Quality Gate — valida o pacote antes de considerar a resposta OK (#8).
 */
import type { AgentResult, ContextBundle, Intent, QualityVerdict } from '@aios/shared';
import { impliesActIntent } from '@aios/shared';
import { agentsForIntent } from '@aios/decision';

export type EvaluateQualityOptions = {
  intent: Intent;
  context?: ContextBundle;
  /** Agentes que o Decision pulou de propósito */
  skipped?: string[];
  /**
   * Whether a governed write/ACT executor is available (#377).
   * When the intent implies ACT and this is not `true`, the gate blocks
   * so implement/fix do not look like a successful code change.
   */
  actAvailable?: boolean;
};

/**
 * Bloqueia resposta inconsistente:
 * - intent `unknown` (pedido não reconhecido não é sucesso)
 * - algum agent `ok: false`
 * - intent conhecido sem nenhum agent rodando
 * - `analyze.project` sem snippets de contexto
 * - agents obrigatórios faltando no resultado
 * - falta rastro `policies.injected` quando houve agents
 * - ACT-implying intent without write executor (`actAvailable`)
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

  const { intent, context, actAvailable } = options;
  const expected = agentsForIntent(intent.kind);
  const ranIds = new Set(results.map((r) => r.agentId));
  const isUnknown = intent.kind === 'unknown';

  // Unrecognized work must not look like a successful run (#336).
  checks.knownIntent = !isUnknown;

  checks.agentsScheduled = isUnknown ? true : expected.every((id) => ranIds.has(id));

  checks.nonEmptyRun = isUnknown ? true : results.length > 0;

  checks.contextPresent =
    intent.kind !== 'analyze.project' ? true : Boolean(context && context.snippets.length > 0);

  checks.policiesInjected =
    results.length === 0 ? true : results.every((r) => r.findings.includes('policies.injected'));

  checks.hasDomainFindings =
    results.length === 0
      ? true
      : results.every((r) =>
          r.findings.some(
            (f) =>
              !f.startsWith('policies.') &&
              !f.startsWith('context.injected') &&
              !f.startsWith('act.')
          )
        );

  // Analysis-only runtime: ACT intents must not claim code-change success (#377).
  checks.actAvailable = impliesActIntent(intent.kind) ? actAvailable === true : true;

  const blockers = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  return { passed: blockers.length === 0, checks, blockers };
}
