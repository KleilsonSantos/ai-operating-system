/**
 * Bounded skim of DecisionRecord failures for Attention (#524 / ADR-0034).
 * Resource-Aware: newest-first from index, small load cap, dedupe by subject+value.
 */
import type { AttentionItem, DecisionRecord, PipelineRun } from '@aios/shared';
import { listPipelineRuns, loadPipelineRun } from './run-store.js';

const FAIL_OUTCOMES = new Set(['failed', 'denied']);

export type SkimDecisionFailuresOptions = {
  homePath?: string;
  /** Max index rows to consider (default 20, hard max 50). */
  limit?: number;
  /** Max Attention items after dedupe (default 10). */
  maxItems?: number;
};

function isFailure(d: DecisionRecord): boolean {
  return FAIL_OUTCOMES.has(d.outcome);
}

function attentionId(d: DecisionRecord): string {
  const safe = `${d.subject}-${d.value}`.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80);
  return `decision-fail-${safe}`;
}

function severityFor(d: DecisionRecord): AttentionItem['severity'] {
  return d.outcome === 'denied' ? 'warn' : 'error';
}

/** Build Attention rows from a single run's decisions (pure; for tests). */
export function attentionFromRunDecisions(run: PipelineRun, at?: string): AttentionItem[] {
  const decisions = run.decisions ?? [];
  const items: AttentionItem[] = [];
  for (const d of decisions) {
    if (!isFailure(d)) continue;
    items.push({
      id: attentionId(d),
      severity: severityFor(d),
      title: `Decision ${d.outcome}: ${d.subject} · ${d.value}`,
      detail: [
        `runId=${run.runId}`,
        at ? `at=${at}` : undefined,
        d.reason ? `reason=${d.reason}` : undefined,
      ]
        .filter(Boolean)
        .join(' · '),
    });
  }
  return items;
}

/**
 * Skim recent persisted runs for failed/denied DecisionRecords.
 * Disable with AIOS_DECISION_ATTENTION=0|false|off|no.
 */
export function skimDecisionFailures(options: SkimDecisionFailuresOptions = {}): AttentionItem[] {
  const env = process.env.AIOS_DECISION_ATTENTION?.trim().toLowerCase();
  if (env === '0' || env === 'false' || env === 'off' || env === 'no') {
    return [];
  }

  const limit = Math.max(1, Math.min(options.limit ?? 20, 50));
  const maxItems = Math.max(1, Math.min(options.maxItems ?? 10, 25));
  const index = listPipelineRuns({ homePath: options.homePath, limit });
  // Newest last in index → iterate reverse for newest-first attention
  const newestFirst = [...index].reverse();
  const byId = new Map<string, AttentionItem>();

  for (const entry of newestFirst) {
    if (byId.size >= maxItems) break;
    const loaded = loadPipelineRun(entry.runId, { homePath: options.homePath });
    if (!loaded?.run) continue;
    for (const item of attentionFromRunDecisions(loaded.run, entry.at || loaded.at)) {
      if (byId.size >= maxItems && !byId.has(item.id)) continue;
      // Keep the newest occurrence (first wins while iterating newest-first)
      if (!byId.has(item.id)) {
        byId.set(item.id, item);
      }
    }
  }

  const rank = { error: 0, warn: 1, info: 2 } as const;
  return [...byId.values()].sort((a, b) => rank[a.severity] - rank[b.severity]);
}
