/**
 * @aios/pipeline — porta estável do núcleo (CLI / integradores).
 * Issue #9 · ADR-0003 · workspace resolve #43
 */
import { resolve } from 'node:path'
import { resolveIntent } from '@aios/intent'
import { loadPolicies, applyPolicies } from '@aios/policy'
import { gatherContext } from '@aios/context'
import { runWorkflow } from '@aios/orchestration'
import { evaluateQuality } from '@aios/quality-gate'
import { resolveWorkspace } from '@aios/workspace'
import {
  PIPELINE_CONTRACT_VERSION,
  type PipelineRequest,
  type PipelineResponse,
} from '@aios/shared'

export { PIPELINE_CONTRACT_VERSION }
export type { PipelineRequest, PipelineResponse }

/**
 * Executa o fluxo núcleo: Intent → Policy → Context → Workflow → Quality Gate.
 * Integradores devem depender deste pacote (+ `@aios/shared`), não dos engines.
 */
export async function runPipeline(
  request: PipelineRequest,
): Promise<PipelineResponse> {
  const input = request.input?.trim() || 'Analise meu projeto.'

  let repoPath: string
  let workspaceMeta: PipelineResponse['workspace']

  if (request.repoPath) {
    repoPath = resolve(request.repoPath)
  } else {
    const ws = resolveWorkspace(request.workspaceId, {
      cwd: process.env.AIOS_HOME || process.cwd(),
      configPath: request.workspacesPath,
    })
    if (ws) {
      repoPath = ws.repoPath
      workspaceMeta = {
        id: ws.entry.id,
        name: ws.entry.name,
        registryPath: ws.registryPath,
      }
    } else {
      repoPath = resolve(process.cwd())
    }
  }

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
    ...(workspaceMeta ? { workspace: workspaceMeta } : {}),
    workflow: {
      ran: [...workflow.ran],
      skipped: [...workflow.skipped],
    },
    results: workflow.results,
    verdict,
  }
}
