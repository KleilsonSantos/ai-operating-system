/** Orchestration Engine — Coordena workflow e plugins a partir do intent (#8). */
import type { Intent, AgentResult, PolicyRule, ContextBundle } from '@aios/shared';
import { applyPolicies, loadPolicies } from '@aios/policy';
import { shouldRunAgent, type AgentId } from '@aios/decision';
import { runArchitectureAgent } from '@aios/agent-architecture';
import { runAppsecAgent } from '@aios/agent-appsec';
import { runDocsAgent } from '@aios/agent-docs';
import { runQaAgent } from '@aios/agent-qa';
import { recordAgentExecution } from '@aios/status';

const plugins = [
  { id: 'architecture' as const, run: runArchitectureAgent },
  { id: 'appsec' as const, run: runAppsecAgent },
  { id: 'docs' as const, run: runDocsAgent },
  { id: 'qa' as const, run: runQaAgent },
];

export type WorkflowOptions = {
  policies?: PolicyRule[];
  context?: ContextBundle;
  /** Home for `.aios/metrics/events.jsonl` (Phase 5b agent.execution). */
  homePath?: string;
};

export type WorkflowResult = {
  results: AgentResult[];
  ran: AgentId[];
  skipped: AgentId[];
};

/**
 * Agenda plugins via Decision, injeta policies + context refs.
 */
export async function runWorkflow(
  intent: Intent,
  options: WorkflowOptions = {}
): Promise<WorkflowResult> {
  const rules = options.policies ?? loadPolicies().rules;
  const applied = applyPolicies(rules);
  const policyRefs = applied.mustIds.map((id) => `policy:${id}`);
  const ctx = options.context;
  const contextRefs = (ctx?.snippets ?? []).map((s) => `context:${s.path}`);
  const homePath = options.homePath;

  const ran: AgentId[] = [];
  const skipped: AgentId[] = [];
  const results: AgentResult[] = [];

  for (const plugin of plugins) {
    if (!shouldRunAgent(plugin.id, intent.kind)) {
      skipped.push(plugin.id);
      continue;
    }

    const started = Date.now();
    try {
      const result = await plugin.run(intent, ctx);
      const findings = [...result.findings];
      if (applied.constraints.length > 0) findings.unshift('policies.injected');
      if (ctx && ctx.snippets.length > 0) {
        findings.unshift(`context.injected:${ctx.snippets.length}`);
      }
      const enriched: AgentResult = {
        ...result,
        references: [...result.references, ...policyRefs, ...contextRefs],
        findings,
      };
      results.push(enriched);
      ran.push(plugin.id);
      recordAgentExecution(
        {
          agent: `@aios/agent-${plugin.id}`,
          outcome: enriched.ok ? 'success' : 'failure',
          durationMs: Date.now() - started,
          source: 'orchestration',
        },
        { homePath }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        agentId: plugin.id,
        ok: false,
        findings: [`orchestration.error:${message.slice(0, 120)}`],
        references: [...policyRefs, ...contextRefs],
      });
      ran.push(plugin.id);
      recordAgentExecution(
        {
          agent: `@aios/agent-${plugin.id}`,
          outcome: 'failure',
          durationMs: Date.now() - started,
          source: 'orchestration',
        },
        { homePath }
      );
    }
  }

  return { results, ran, skipped };
}
