/**
 * Safe actions do console — exercitam engines reais (#76 / ADR-0012).
 * Sem agentes plugins no UX.
 */
import { PIPELINE_CONTRACT_VERSION } from '@aios/shared';
import { listValidatedWorkspaces } from '@aios/workspace';
import { loadPolicies, applyPolicies } from '@aios/policy';
import { compilePrompt } from '@aios/prompt';
import { getProvider } from '@aios/provider';
import { remember, recall } from '@aios/memory';
import { auditDocumentation } from '@aios/documentation';
import { auditGovernance } from '@aios/governance';
import { getOperationalState } from '@aios/operational-state';
import { correlateVisibility } from '@aios/visibility';

export const SAFE_ACTIONS = [
  'contract',
  'validate_workspaces',
  'load_policies',
  'compile_brief',
  'provider_ping',
  'memory_recall',
  'memory_remember',
  'audit_docs',
  'governance_audit',
  'operational_state',
  'visibility',
] as const;

export type SafeActionId = (typeof SAFE_ACTIONS)[number];

export type SafeActionRequest = {
  action: string;
  input?: string;
  workspaceId?: string;
  /** Optional scope for Visibility Plane (ADR-0030 / #365). */
  scope?: string;
  /** Optional persisted PipelineRun id for Visibility / Decisions (#508 / ADR-0034). */
  runId?: string;
  /** Opt-in Prompt Engine skill pack ids (ADR-0026 / #487). Used by compile_brief. */
  skillIds?: string[];
  homePath: string;
};

export type SafeActionResponse = {
  ok: boolean;
  action: SafeActionId;
  latencyMs: number;
  result: unknown;
  error?: string;
};

function isSafeAction(id: string): id is SafeActionId {
  return (SAFE_ACTIONS as readonly string[]).includes(id);
}

/** Literal client copy — must not read `Error` (CWE-209 / CodeQL js/stack-trace-exposure). */
export const SAFE_ACTION_INTERNAL_ERROR = 'internal error';

/**
 * Stable client code when Memory rejects untrusted text (ADR-0033).
 * Fixed string only — do not echo `memory.content_rejected:<code>:<detail>` to HTTP clients.
 */
export const MEMORY_CONTENT_REJECTED_CLIENT_ERROR = 'memory.content_rejected';

function clientErrorForCaught(err: unknown): string {
  const msg = err instanceof Error ? err.message : '';
  if (msg.startsWith('memory.content_rejected:')) {
    return MEMORY_CONTENT_REJECTED_CLIENT_ERROR;
  }
  return SAFE_ACTION_INTERNAL_ERROR;
}

function logSafeActionFailure(action: SafeActionId, err: unknown): void {
  console.error(`[console] safe-action ${action} failed`, err);
}

export async function runSafeAction(request: SafeActionRequest): Promise<SafeActionResponse> {
  const started = Date.now();
  const homePath = request.homePath;
  const workspaceId = request.workspaceId || 'aios';

  if (!isSafeAction(request.action)) {
    return {
      ok: false,
      action: 'contract',
      latencyMs: Date.now() - started,
      result: null,
      error: `Unknown action. Allowed: ${SAFE_ACTIONS.join(', ')}`,
    };
  }

  const action = request.action;

  try {
    let result: unknown;

    switch (action) {
      case 'contract':
        result = { contractVersion: PIPELINE_CONTRACT_VERSION };
        break;

      case 'validate_workspaces': {
        const list = listValidatedWorkspaces({ cwd: homePath });
        result = {
          count: list.length,
          workspaces: list.map((w) => ({
            id: w.id,
            repoPath: w.repoPath,
            ok: w.validation.ok,
            signals: w.validation.signals,
          })),
        };
        break;
      }

      case 'load_policies': {
        const bundle = loadPolicies({ cwd: homePath });
        const applied = applyPolicies(bundle.rules);
        result = {
          source: bundle.source,
          path: bundle.path,
          count: bundle.rules.length,
          mustIds: applied.mustIds,
          constraints: applied.constraints.slice(0, 500),
        };
        break;
      }

      case 'compile_brief': {
        const input =
          request.input?.trim() || 'Mostre um brief curto para validar o Prompt Engine.';
        const skillIds = (request.skillIds ?? []).map((id) => id.trim()).filter(Boolean);
        const compiled = compilePrompt({
          input,
          workspaceId,
          ...(skillIds.length ? { skillIds } : {}),
          // prefer registry resolution via workspaceId
        });
        const brief =
          compiled.brief.length > 4000
            ? `${compiled.brief.slice(0, 4000)}\n…(truncado)`
            : compiled.brief;
        result = {
          intent: compiled.intent,
          workspaceId: compiled.workspaceId,
          repoPath: compiled.repoPath,
          stats: compiled.stats,
          skills: compiled.skills,
          brief,
        };
        break;
      }

      case 'provider_ping': {
        result = await getProvider('ollama').health();
        break;
      }

      case 'memory_recall': {
        result = recall(workspaceId, { homePath, limit: 5 });
        break;
      }

      case 'memory_remember': {
        const content = request.input?.trim() || `console-try-it @ ${new Date().toISOString()}`;
        const entry = remember(workspaceId, content, {
          homePath,
          tags: ['console', 'try-it'],
        });
        result = { ok: true, entry };
        break;
      }

      case 'audit_docs': {
        result = auditDocumentation({ repoPath: homePath });
        break;
      }

      case 'governance_audit': {
        result = auditGovernance({
          homePath,
          repoPath: homePath,
          includeDocumentation: true,
        });
        break;
      }

      case 'operational_state': {
        result = await getOperationalState({
          homePath,
          workspaceId,
        });
        break;
      }

      case 'visibility': {
        const scope = request.scope?.trim() || undefined;
        const runId = request.runId?.trim() || undefined;
        result = await correlateVisibility({
          homePath,
          repoPath: homePath,
          workspaceId,
          scope,
          runId,
        });
        break;
      }

      default: {
        const _exhaustive: never = action;
        throw new Error(`Unhandled action: ${_exhaustive}`);
      }
    }

    const latencyMs = Date.now() - started;
    const ok =
      action === 'provider_ping'
        ? Boolean((result as { ok?: boolean }).ok)
        : action === 'validate_workspaces'
          ? ((result as { workspaces: Array<{ ok: boolean }> }).workspaces.every((w) => w.ok) ??
            false)
          : action === 'audit_docs' || action === 'governance_audit'
            ? Boolean((result as { ok?: boolean }).ok)
            : action === 'operational_state'
              ? ((result as { health?: { errorCount?: number } }).health?.errorCount ?? 0) === 0
              : true;

    return { ok, action, latencyMs, result };
  } catch (err) {
    logSafeActionFailure(action, err);
    return {
      ok: false,
      action,
      latencyMs: Date.now() - started,
      result: null,
      error: clientErrorForCaught(err),
    };
  }
}
