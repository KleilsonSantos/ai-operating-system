/**
 * @aios/pipeline — porta estável do núcleo (CLI / integradores).
 * Issue #9 · ADR-0003 · workspace #43 · knowledge #47 · memory #51
 */
import { resolve } from 'node:path'
import { resolveIntent } from '@aios/intent'
import { loadPolicies, applyPolicies } from '@aios/policy'
import { gatherContext } from '@aios/context'
import { runWorkflow } from '@aios/orchestration'
import { evaluateQuality } from '@aios/quality-gate'
import { resolveWorkspace, loadWorkspaces } from '@aios/workspace'
import { buildKnowledgeGraph, summarizeKnowledge } from '@aios/knowledge'
import { recall } from '@aios/memory'
import {
  PIPELINE_CONTRACT_VERSION,
  type PipelineRequest,
  type PipelineResponse,
} from '@aios/shared'

export { PIPELINE_CONTRACT_VERSION }
export type { PipelineRequest, PipelineResponse }

export type RunAcrossResult = {
  contractVersion: typeof PIPELINE_CONTRACT_VERSION
  input: string
  results: Array<{
    workspaceId: string
    repoPath: string
    verdictPassed: boolean
    intentKind: string
    knowledgeNodes?: number
    memoryCount?: number
    error?: string
  }>
}

/**
 * Executa o pipeline em vários workspaces (multi-repo genérico · #55).
 */
export async function runAcrossWorkspaces(options: {
  input: string
  /** Ids a incluir; default = todos do registry */
  workspaceIds?: string[]
  workspacesPath?: string
  homePath?: string
  scope?: string
  policiesPath?: string
}): Promise<RunAcrossResult> {
  const home = options.homePath || process.env.AIOS_HOME || process.cwd()
  const bundle = loadWorkspaces({
    cwd: home,
    configPath: options.workspacesPath,
  })
  const targets = options.workspaceIds?.length
    ? bundle.workspaces.filter((w) => options.workspaceIds!.includes(w.id))
    : bundle.workspaces

  const results: RunAcrossResult['results'] = []
  for (const w of targets) {
    try {
      const res = await runPipeline({
        input: options.input,
        workspaceId: w.id,
        workspacesPath: options.workspacesPath || bundle.path,
        scope: options.scope,
        policiesPath: options.policiesPath,
      })
      results.push({
        workspaceId: w.id,
        repoPath: res.context.repoPath,
        verdictPassed: res.verdict.passed,
        intentKind: res.intent.kind,
        knowledgeNodes: res.knowledge?.nodeCount,
        memoryCount: res.memory?.count,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      results.push({
        workspaceId: w.id,
        repoPath: '',
        verdictPassed: false,
        intentKind: 'unknown',
        error: message,
      })
    }
  }

  return {
    contractVersion: PIPELINE_CONTRACT_VERSION,
    input: options.input,
    results,
  }
}

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
  let memoryWorkspaceId: string | undefined

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
      memoryWorkspaceId = ws.entry.id
    } else {
      repoPath = resolve(process.cwd())
    }
  }

  if (request.workspaceId) {
    memoryWorkspaceId = request.workspaceId
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
  const knowledge = summarizeKnowledge(
    buildKnowledgeGraph({ repoPath }),
  )

  const wantMemory =
    request.includeMemory === true ||
    (request.includeMemory !== false && Boolean(memoryWorkspaceId))

  let memoryMeta: PipelineResponse['memory']
  if (wantMemory && memoryWorkspaceId) {
    const mem = recall(memoryWorkspaceId, {
      homePath: process.env.AIOS_HOME || process.cwd(),
      limit: request.memoryLimit ?? 5,
    })
    memoryMeta = {
      workspaceId: mem.workspaceId,
      count: mem.entries.length,
      entries: mem.entries,
      path: mem.path,
    }
  }

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
    knowledge,
    ...(memoryMeta ? { memory: memoryMeta } : {}),
    workflow: {
      ran: [...workflow.ran],
      skipped: [...workflow.skipped],
    },
    results: workflow.results,
    verdict,
  }
}
