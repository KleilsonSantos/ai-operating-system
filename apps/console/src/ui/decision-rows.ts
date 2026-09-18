import type { DecisionRecord } from '@aios/shared';

/** Stable display row for Console Decisions section (#508 / ADR-0034). */
export type DecisionRow = {
  id: string;
  subject: string;
  outcome: string;
  value: string;
  reason?: string;
  stepId?: string;
};

export function decisionRowsFromRun(decisions: DecisionRecord[] | undefined | null): DecisionRow[] {
  if (!decisions?.length) return [];
  return decisions.map((d) => ({
    id: d.id,
    subject: d.subject,
    outcome: d.outcome,
    value: d.value,
    reason: d.reason,
    stepId: d.stepId,
  }));
}

export function formatDecisionLabel(row: DecisionRow): string {
  const base = `${row.subject} · ${row.outcome} · ${row.value}`;
  return row.reason ? `${base} · ${row.reason}` : base;
}
