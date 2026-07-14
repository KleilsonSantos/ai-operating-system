/**
 * @aios/pipeline — porta estável do núcleo (CLI / integradores).
 * Issue #9 · ADR-0003
 */
import { resolve } from 'node:path'
import { resolveIntent } from '@aios/intent'
import { loadPolicies, applyPolicies } from '@aios/policy'
import { gatherContext } from '@aios/context'
import { runWorkflow } from '@aios/orchestration'
import { evaluateQuality } from '@aios/quality-gate'
import {
  PIPELINE_CONTRACT_VERSION,
  type PipelineRequest,
  type PipelineResponse,
} from '@aios/shared'

export { PIPELINE_CONTRACT_VERSION }
export type { PipelineRequest, PipelineResponse }

/**
 * Executa o fluxo Fase 1: Intent → Policy → Context → Workflow → Quality Gate.
 * Integradores devem depender deste pacote (+ `@aios/shared`), não dos engines.
 */
export async function runPipeline(
  request: PipelineRequest,
): Promise<PipelineResponse> {
  const input = request.input?.trim() || 'Analise meu projeto.'
  const repoPath = resolve(request.repoPath ?? process.cwd())

  const intent = resolveIntent(input)
  const policyBundle = loadPolicies({
    cwd: repoPath,
    configPath: request.policiesPath,
  })
  const applied = applyPolicies(policyBundle.rules)
  const context = gatherContext({
    repoPath,
    scope: request.scope,
  })
  const workflow = await runWorkflow(intent, {
    policies: policyBundle.rules,
    context,
  })
  const verdict = evaluateQuality(workflow.results, {
    intent,
    context,
    skipped: workflow.skipped,
  })

  return {
    contractVersion: PIPELINE_CONTRACT_VERSION,
    intent,
    policies: {
      source: policyBundle.source,
      path: policyBundle.path,
      count: policyBundle.rules.length,
      mustIds: applied.mustIds,
    },
    context: {
      repoPath: context.repoPath,
      scope: context.scope,
      snippetCount: context.snippets.length,
      paths: context.snippets.map((s) => s.path),
      signals: context.signals,
    },
    workflow: {
      ran: [...workflow.ran],
      skipped: [...workflow.skipped],
    },
    results: workflow.results,
    verdict,
  }
}
