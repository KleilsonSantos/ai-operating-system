/**
 * @aios/pipeline — porta estável do núcleo (CLI / integradores).
 * Issue #9 · ADR-0003 · workspace #43 · knowledge #47 · memory #51
 */
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { resolveIntent } from '@aios/intent';
import { loadPolicies, applyPolicies } from '@aios/policy';
import { gatherContext, resolveContextBudget } from '@aios/context';
import { runWorkflow } from '@aios/orchestration';
import { evaluateQuality } from '@aios/quality-gate';
import { resolveWorkspace, loadWorkspaces } from '@aios/workspace';
import { buildKnowledgeGraph, summarizeKnowledge } from '@aios/knowledge';
import { recall } from '@aios/memory';
import {
  PIPELINE_CONTRACT_VERSION,
  impliesActIntent,
  recordsLifecycleHooks,
  resolveCallerPrivilege,
  routeModel,
  selectPipelineHooks,
  type PipelineArtifact,
  type PipelineRequest,
  type PipelineResponse,
  type PipelineRun,
  type PipelineStep,
  type RouteDecision,
} from '@aios/shared';

export { PIPELINE_CONTRACT_VERSION };
export type { PipelineRequest, PipelineResponse };

export type RunAcrossResult = {
  contractVersion: typeof PIPELINE_CONTRACT_VERSION;
  input: string;
  results: Array<{
    workspaceId: string;
    repoPath: string;
    verdictPassed: boolean;
    intentKind: string;
    knowledgeNodes?: number;
    memoryCount?: number;
    error?: string;
  }>;
};

/**
 * Executa o pipeline em vários workspaces (multi-repo genérico · #55).
 */
export async function runAcrossWorkspaces(options: {
  input: string;
  /** Ids a incluir; default = todos do registry */
  workspaceIds?: string[];
  workspacesPath?: string;
  homePath?: string;
  scope?: string;
  policiesPath?: string;
}): Promise<RunAcrossResult> {
  const home = options.homePath || process.env.AIOS_HOME || process.cwd();
  const bundle = loadWorkspaces({
    cwd: home,
    configPath: options.workspacesPath,
  });
  const targets = options.workspaceIds?.length
    ? bundle.workspaces.filter((w) => options.workspaceIds!.includes(w.id))
    : bundle.workspaces;

  const results: RunAcrossResult['results'] = [];
  for (const w of targets) {
    try {
      const res = await runPipeline({
        input: options.input,
        workspaceId: w.id,
        workspacesPath: options.workspacesPath || bundle.path,
        scope: options.scope,
        policiesPath: options.policiesPath,
      });
      results.push({
        workspaceId: w.id,
        repoPath: res.context.repoPath,
        verdictPassed: res.verdict.passed,
        intentKind: res.intent.kind,
        knowledgeNodes: res.knowledge?.nodeCount,
        memoryCount: res.memory?.count,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        workspaceId: w.id,
        repoPath: '',
        verdictPassed: false,
        intentKind: 'unknown',
        error: message,
      });
    }
  }

  return {
    contractVersion: PIPELINE_CONTRACT_VERSION,
    input: options.input,
    results,
  };
}

/**
 * Executa o fluxo núcleo: Intent → Policy → Context → Workflow → Quality Gate.
 * Integradores devem depender deste pacote (+ `@aios/shared`), não dos engines.
 */
export async function runPipeline(request: PipelineRequest): Promise<PipelineResponse> {
  const input = request.input?.trim() || 'Analise meu projeto.';

  let repoPath: string;
  let workspaceMeta: PipelineResponse['workspace'];
  let memoryWorkspaceId: string | undefined;

  if (request.repoPath) {
    repoPath = resolve(request.repoPath);
  } else {
    const ws = resolveWorkspace(request.workspaceId, {
      cwd: process.env.AIOS_HOME || process.cwd(),
      configPath: request.workspacesPath,
    });
    if (ws) {
      repoPath = ws.repoPath;
      workspaceMeta = {
        id: ws.entry.id,
        name: ws.entry.name,
        registryPath: ws.registryPath,
      };
      memoryWorkspaceId = ws.entry.id;
    } else {
      repoPath = resolve(process.cwd());
    }
  }

  if (request.workspaceId) {
    memoryWorkspaceId = request.workspaceId;
  }

  const intent = resolveIntent(input);
  const policyBundle = loadPolicies({
    cwd: repoPath,
    configPath: request.policiesPath,
  });
  const applied = applyPolicies(policyBundle.rules);
  const privilege = request.privilege ?? resolveCallerPrivilege();
  const budget = resolveContextBudget({
    intentKind: intent.kind,
    risk: request.risk,
    costBudget: request.costBudget,
  });
  const route = routeModel({
    intentKind: intent.kind,
    risk: request.risk,
    privilege,
    costBudget: request.costBudget,
    complexity: request.complexity,
    privacy: request.privacy,
  });
  const context = gatherContext({
    repoPath,
    scope: request.scope,
    budget,
  });
  const knowledge = summarizeKnowledge(buildKnowledgeGraph({ repoPath }));

  const wantMemory =
    request.includeMemory === true ||
    (request.includeMemory !== false && Boolean(memoryWorkspaceId));

  let memoryMeta: PipelineResponse['memory'];
  if (wantMemory && memoryWorkspaceId) {
    const mem = recall(memoryWorkspaceId, {
      homePath: process.env.AIOS_HOME || process.cwd(),
      limit: request.memoryLimit ?? 5,
    });
    memoryMeta = {
      workspaceId: mem.workspaceId,
      count: mem.entries.length,
      entries: mem.entries,
      path: mem.path,
    };
  }

  const homePath = process.env.AIOS_HOME || process.cwd();
  const workflow = await runWorkflow(intent, {
    policies: policyBundle.rules,
    context,
    homePath,
    pluginSource: request.pluginSource,
  });

  // Default runPipeline is analysis-only (heuristic plugins; no repo writes) — #377 / ADR-0024.
  const capabilities: PipelineResponse['capabilities'] = {
    act: false,
    reason: 'Default runPipeline is analysis-only; no governed write/ACT executor',
  };
  const results =
    impliesActIntent(intent.kind) && !capabilities.act
      ? workflow.results.map((r, i) =>
          i === 0 ? { ...r, findings: ['act.unavailable', ...r.findings] } : r
        )
      : workflow.results;

  const verdict = evaluateQuality(results, {
    intent,
    context,
    skipped: workflow.skipped,
    actAvailable: capabilities.act,
  });

  const usedBytes = context.snippets.reduce((sum, s) => sum + s.bytes, 0);
  const run = buildPipelineRun({
    intentKind: intent.kind,
    workspaceId: workspaceMeta?.id ?? memoryWorkspaceId,
    policyIds: applied.mustIds,
    ran: workflow.ran,
    skipped: workflow.skipped,
    results,
    contextPaths: context.snippets.map((s) => ({
      id: s.path,
      kind: s.kind,
      ref: s.path,
    })),
    memoryAttached: Boolean(memoryMeta),
    verdictPassed: verdict.passed,
    verdictReasons: verdict.blockers,
    route,
    skillIds: (request.skillIds ?? []).map((id) => id.trim()).filter(Boolean),
    hookIds: selectPipelineHooks(request.hookIds).selected,
  });

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
      budget: {
        tier: budget.tier,
        maxSnippets: budget.maxSnippets,
        maxTotalBytes: budget.maxTotalBytes,
        usedBytes,
      },
    },
    ...(workspaceMeta ? { workspace: workspaceMeta } : {}),
    knowledge,
    ...(memoryMeta ? { memory: memoryMeta } : {}),
    workflow: {
      ran: [...workflow.ran],
      skipped: [...workflow.skipped],
    },
    results,
    verdict,
    capabilities,
    run,
  };
}

function stepId(kind: PipelineStep['kind']): string {
  return `${kind}-${randomUUID()}`;
}

function buildPipelineRun(input: {
  intentKind: string;
  workspaceId?: string;
  policyIds: string[];
  ran: string[];
  skipped: string[];
  results: PipelineResponse['results'];
  contextPaths: PipelineArtifact[];
  memoryAttached: boolean;
  verdictPassed: boolean;
  verdictReasons: string[];
  route: RouteDecision;
  skillIds: string[];
  hookIds: string[];
}): PipelineRun {
  const runId = randomUUID();
  const recordHooks = recordsLifecycleHooks(input.hookIds);
  const hook = (point: string): PipelineStep => ({
    stepId: stepId('hook'),
    kind: 'hook',
    status: 'ok',
    detail: point,
  });
  const steps: PipelineStep[] = [
    { stepId: stepId('classify'), kind: 'classify', status: 'ok', detail: input.intentKind },
    ...(recordHooks ? [hook('before.policy')] : []),
    {
      stepId: stepId('policy'),
      kind: 'policy',
      status: input.policyIds.length > 0 ? 'ok' : 'skip',
    },
    ...(recordHooks ? [hook('after.policy')] : []),
    ...(recordHooks ? [hook('before.context')] : []),
    {
      stepId: stepId('context'),
      kind: 'context',
      status: input.contextPaths.length > 0 ? 'ok' : 'skip',
    },
    ...(recordHooks ? [hook('after.context')] : []),
    {
      stepId: stepId('route'),
      kind: 'route',
      status: 'ok',
      detail: `${input.route.capabilityClass}:${input.route.providerId}/${input.route.modelId}`,
    },
    { stepId: stepId('knowledge'), kind: 'knowledge', status: 'ok' },
    {
      stepId: stepId('memory'),
      kind: 'memory',
      status: input.memoryAttached ? 'ok' : 'skip',
    },
    {
      stepId: stepId('skill'),
      kind: 'skill',
      status: input.skillIds.length > 0 ? 'ok' : 'skip',
      detail: input.skillIds.join(',') || undefined,
    },
    ...(recordHooks
      ? []
      : [
          {
            stepId: stepId('hook'),
            kind: 'hook' as const,
            status: 'skip' as const,
          },
        ]),
    ...(recordHooks ? [hook('before.agent')] : []),
  ];

  for (const agentId of input.ran) {
    const result = input.results.find((r) => r.agentId === agentId);
    steps.push({
      stepId: stepId('agent'),
      kind: 'agent',
      status: result && !result.ok ? 'fail' : 'ok',
      agentId,
    });
  }
  for (const agentId of input.skipped) {
    steps.push({
      stepId: stepId('agent'),
      kind: 'agent',
      status: 'skip',
      agentId,
    });
  }

  if (recordHooks) {
    steps.push(hook('after.agent'));
    steps.push(hook('before.gate'));
  }
  steps.push({
    stepId: stepId('gate'),
    kind: 'gate',
    status: input.verdictPassed ? 'ok' : 'fail',
  });
  if (recordHooks) {
    steps.push(hook('after.gate'));
  }

  return {
    runId,
    taskId: runId,
    intentKind: input.intentKind,
    ...(input.workspaceId ? { workspaceId: input.workspaceId } : {}),
    policyIds: [...input.policyIds],
    agentIds: [...input.ran],
    skillIds: [...input.skillIds],
    hookIds: [...input.hookIds],
    model: {
      providerId: input.route.providerId,
      modelId: input.route.modelId,
      capabilityClass: input.route.capabilityClass,
      complexity: input.route.taskProfile.complexity,
      privacy: input.route.taskProfile.privacy,
    },
    steps,
    artifacts: input.contextPaths.slice(0, 12),
    verdict: {
      passed: input.verdictPassed,
      reasons: [...input.verdictReasons],
    },
  };
}
