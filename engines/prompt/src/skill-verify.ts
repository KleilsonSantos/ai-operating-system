/**
 * Machine-checkable skill exit criteria (ADR-0026 amend / #520).
 * Free-text prerequisites/validation stay documentary; only `check:*` tokens gate.
 */
import type { DecisionOutcome, SkillFailurePolicy, SkillManifest } from '@aios/shared';

export type SkillVerifyContext = {
  workspaceId?: string;
  /** Absolute or resolved repo path when known. */
  repoPath?: string;
  /** True when context gather produced at least one snippet/path. */
  hasContextPaths?: boolean;
  /** Requested skill ids (explicit skillIds only — no auto-trigger). */
  skillIds: string[];
};

export type SkillVerificationResult = {
  id: string;
  /** DecisionOutcome for the DecisionRecord ledger. */
  outcome: DecisionOutcome;
  reason: string;
  failurePolicy: SkillFailurePolicy;
  /** Machine checks that failed (empty when passed / unknown pack). */
  failedChecks: string[];
};

const CHECK_PREFIX = 'check:';

/** Known deterministic checks — unknown `check:*` ids fail closed. */
const KNOWN_CHECKS = new Set(['workspaceId', 'repoPath', 'context']);

export function parseCheckToken(line: string): string | undefined {
  const trimmed = line.trim();
  if (!trimmed.startsWith(CHECK_PREFIX)) return undefined;
  const id = trimmed.slice(CHECK_PREFIX.length).trim();
  return id || undefined;
}

export function collectCheckTokens(manifest: SkillManifest): string[] {
  const lines = [...(manifest.prerequisites ?? []), ...(manifest.validation ?? [])];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const id = parseCheckToken(line);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function evaluateCheck(checkId: string, ctx: SkillVerifyContext): boolean {
  switch (checkId) {
    case 'workspaceId':
      return Boolean(ctx.workspaceId?.trim());
    case 'repoPath':
      return Boolean(ctx.repoPath?.trim());
    case 'context':
      return Boolean(ctx.hasContextPaths);
    default:
      return false;
  }
}

/**
 * Verify one resolved pack against optional `check:*` exit criteria.
 * Free-text lines are ignored for the gate (still appear in the brief).
 */
export function verifySkillPack(
  manifest: SkillManifest,
  ctx: SkillVerifyContext
): SkillVerificationResult {
  const checks = collectCheckTokens(manifest);
  const failedChecks: string[] = [];
  for (const checkId of checks) {
    if (!KNOWN_CHECKS.has(checkId)) {
      failedChecks.push(`unknown:${checkId}`);
      continue;
    }
    if (!evaluateCheck(checkId, ctx)) {
      failedChecks.push(checkId);
    }
  }

  if (failedChecks.length === 0) {
    return {
      id: manifest.id,
      outcome: 'passed',
      reason:
        checks.length > 0
          ? `exitCriteria ok (${checks.join(',')})`
          : 'catalog hit; no check: exitCriteria',
      failurePolicy: manifest.failurePolicy,
      failedChecks: [],
    };
  }

  const detail = failedChecks.join(',');
  if (manifest.failurePolicy === 'skip') {
    return {
      id: manifest.id,
      outcome: 'skipped',
      reason: `exitCriteria failed (${detail}); failurePolicy=skip`,
      failurePolicy: manifest.failurePolicy,
      failedChecks,
    };
  }
  if (manifest.failurePolicy === 'retry') {
    return {
      id: manifest.id,
      outcome: 'failed',
      reason: `exitCriteria failed (${detail}); failurePolicy=retry (declarative; no loop)`,
      failurePolicy: manifest.failurePolicy,
      failedChecks,
    };
  }
  return {
    id: manifest.id,
    outcome: 'failed',
    reason: `exitCriteria failed (${detail}); failurePolicy=fail`,
    failurePolicy: manifest.failurePolicy,
    failedChecks,
  };
}

export type SkillResolutionDecision = {
  id: string;
  outcome: DecisionOutcome;
  reason: string;
  /** When true, skill step should be `fail` (hard fail policy). */
  hardFail: boolean;
};

/** Resolve requested ids against a catalog and emit ledger-ready decisions. */
export function resolveSkillDecisions(
  requestedIds: string[],
  catalog: SkillManifest[],
  ctx: Omit<SkillVerifyContext, 'skillIds'> & { skillIds?: string[] }
): SkillResolutionDecision[] {
  if (requestedIds.length === 0) {
    return [
      {
        id: 'none',
        outcome: 'skipped',
        reason: 'no skillIds on request',
        hardFail: false,
      },
    ];
  }

  const byId = new Map(catalog.map((s) => [s.id, s]));
  const verifyCtx: SkillVerifyContext = {
    ...ctx,
    skillIds: requestedIds,
  };
  const decisions: SkillResolutionDecision[] = [];
  const seen = new Set<string>();

  for (const raw of requestedIds) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const manifest = byId.get(id);
    if (!manifest) {
      decisions.push({
        id,
        outcome: 'skipped',
        reason: 'unknown skill id (not in catalog)',
        hardFail: false,
      });
      continue;
    }
    const verified = verifySkillPack(manifest, verifyCtx);
    decisions.push({
      id: verified.id,
      outcome: verified.outcome,
      reason: verified.reason,
      hardFail: verified.outcome === 'failed' && verified.failurePolicy === 'fail',
    });
  }
  return decisions;
}
