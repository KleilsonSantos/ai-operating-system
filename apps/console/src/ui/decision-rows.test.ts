import { describe, expect, it } from 'vitest';
import { decisionRowsFromRun, formatDecisionLabel } from './decision-rows';

describe('decisionRowsFromRun (#508)', () => {
  it('returns empty for missing or empty ledger', () => {
    expect(decisionRowsFromRun(undefined)).toEqual([]);
    expect(decisionRowsFromRun([])).toEqual([]);
  });

  it('maps DecisionRecord fields for display', () => {
    const rows = decisionRowsFromRun([
      {
        id: 'd1',
        subject: 'route',
        outcome: 'selected',
        value: 'coding',
        reason: 'TaskProfile',
        stepId: 's-route',
      },
    ]);
    expect(rows).toEqual([
      {
        id: 'd1',
        subject: 'route',
        outcome: 'selected',
        value: 'coding',
        reason: 'TaskProfile',
        stepId: 's-route',
      },
    ]);
    expect(formatDecisionLabel(rows[0]!)).toBe('route · selected · coding · TaskProfile');
  });
});
