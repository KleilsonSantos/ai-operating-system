/**
 * Visibility Plane — correlate governance fragments (ADR-0030).
 * On-demand only (Resource-Aware). Obsidian export is opt-in (#366).
 */
import { resolve } from 'node:path';
import type {
  AgentExecutionRecord,
  PipelineRun,
  VisibilitySnapshot,
  VisibilityTrailItem,
} from '@aios/shared';
import { buildKnowledgeGraph, summarizeKnowledge } from '@aios/knowledge';
import { getOperationalState, type GetOperationalStateOptions } from '@aios/operational-state';
import { loadPolicies, applyPolicies } from '@aios/policy';
import { listAgentExecutions } from '@aios/status';

export {
  assertSafeObsidianOutDir,
  exportObsidian,
  noteBasename,
  resolveObsidianOutDir,
  type ExportObsidianOptions,
  type ExportObsidianResult,
} from './export-obsidian.js';

export type CorrelateVisibilityOptions = {
  homePath?: string;
  /** Repo root for heuristic KG (defaults to homePath). */
  repoPath?: string;
  runId?: string;
  scope?: string;
  workspaceId?: string;
  /** Inject a run — PipelineRun is not persisted yet (ADR-0024 response-only). */
  run?: PipelineRun;
  /** Cap agent.execution rows (default 50). */
  maxAgentExecutions?: number;
  /** Skip live provider health in operational subset (tests). */
  providerHealth?: GetOperationalStateOptions['providerHealth'];
};

function resolveHome(homePath?: string): string {
  return resolve(homePath || process.env.AIOS_HOME || process.cwd());
}

function matchNodeIds(nodes: { id: string; path?: string }[], scope: string): string[] {
  const normalized = scope.replace(/\\/g, '/').replace(/^\.\//, '');
  const ids: string[] = [];
  for (const n of nodes) {
    if (!n.path) continue;
    const p = n.path.replace(/\\/g, '/');
    if (p === normalized || p.startsWith(`${normalized}/`) || normalized.startsWith(`${p}/`)) {
      ids.push(n.id);
    }
  }
  return ids;
}

function buildTrail(input: {
  run?: PipelineRun;
  agentExecutions: AgentExecutionRecord[];
  policyRefs: string[];
}): VisibilityTrailItem[] {
  const trail: VisibilityTrailItem[] = [];
  for (const id of input.policyRefs.slice(0, 20)) {
    trail.push({ kind: 'policy', id, label: `policy:${id}` });
  }
  if (input.run) {
    for (const step of input.run.steps) {
      trail.push({
        kind: 'pipeline.step',
        id: step.stepId,
        label: step.agentId ? `step:${step.kind} · agent:${step.agentId}` : `step:${step.kind}`,
        status: step.status,
        at: undefined,
      });
    }
    for (const agentId of input.run.agentIds) {
      if (!trail.some((t) => t.kind === 'pipeline.step' && t.label.includes(`agent:${agentId}`))) {
        trail.push({
          kind: 'pipeline.step',
          id: `agent:${agentId}`,
          label: `agent:${agentId}`,
          status: 'selected',
        });
      }
    }
  }
  for (const ev of input.agentExecutions) {
    trail.push({
      kind: 'agent.execution',
      id: `${ev.agent}@${ev.at}`,
      label: `agent.execution:${ev.agent} · ${ev.outcome}`,
      at: ev.at,
      status: ev.outcome,
    });
  }
  return trail;
}

/**
 * Correlate run ↔ KG ↔ operational state ↔ agent JSONL into one snapshot.
 * Requires at least one of: runId, scope, workspaceId.
 */
export async function correlateVisibility(
  options: CorrelateVisibilityOptions
): Promise<VisibilitySnapshot> {
  const { runId, scope, workspaceId } = options;
  if (!runId && !scope && !workspaceId) {
    throw new Error('correlateVisibility: require at least one of runId, scope, workspaceId');
  }

  const homePath = resolveHome(options.homePath);
  const repoPath = resolve(options.repoPath || homePath);
  const generatedAt = new Date().toISOString();

  const run = options.run;
  const runLookup: VisibilitySnapshot['runLookup'] = run
    ? 'provided'
    : runId
      ? 'unavailable'
      : undefined;

  if (run && runId && run.runId !== runId) {
    throw new Error(`correlateVisibility: run.runId (${run.runId}) !== runId (${runId})`);
  }

  const graph = buildKnowledgeGraph({ repoPath });
  const summary = summarizeKnowledge(graph);
  const matchedNodeIds = scope ? matchNodeIds(graph.nodes, scope) : undefined;

  const operationalFull = await getOperationalState({
    homePath,
    workspaceId,
    providerHealth: options.providerHealth,
  });
  const operational: VisibilitySnapshot['operational'] = {
    focus: operationalFull.focus,
    governance: operationalFull.governance,
    boundaries: operationalFull.boundaries,
    summary: operationalFull.summary,
  };

  const agentExecutions = listAgentExecutions({
    homePath,
    limit: options.maxAgentExecutions ?? 50,
  });

  const policies = loadPolicies({ cwd: homePath });
  const applied = applyPolicies(policies.rules);
  const policyRefs = applied.mustIds;

  const trail = buildTrail({ run, agentExecutions, policyRefs });

  return {
    anchor: {
      ...(runId ? { runId } : {}),
      ...(scope ? { scope } : {}),
      ...(workspaceId ? { workspaceId } : {}),
    },
    generatedAt,
    ...(run ? { run } : {}),
    ...(runLookup ? { runLookup } : {}),
    knowledge: {
      ...summary,
      ...(matchedNodeIds && matchedNodeIds.length > 0 ? { matchedNodeIds } : {}),
    },
    operational,
    agentExecutions,
    policyRefs,
    trail,
  };
}
