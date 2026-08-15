/** Orchestration Engine — Coordena workflow e plugins a partir do intent (#8). */
import type { Intent, AgentResult, PolicyRule, ContextBundle } from '@aios/shared';
import { applyPolicies, loadPolicies } from '@aios/policy';
import { shouldRunAgent, type AgentId } from '@aios/decision';
import { runArchitectureAgent } from '@aios/agent-architecture';
import { runAppsecAgent } from '@aios/agent-appsec';
import { runDocsAgent } from '@aios/agent-docs';
import { runQaAgent } from '@aios/agent-qa';
import { recordAgentExecution } from '@aios/status';
import { AgentRegistry } from '@aios-platform/agent-registry';
import { join } from 'node:path';

type PluginRunner = (intent: Intent, context?: ContextBundle) => Promise<AgentResult> | AgentResult;

type Plugin = { id: AgentId; run: PluginRunner };

const RUNNERS: Record<AgentId, PluginRunner> = {
  architecture: runArchitectureAgent,
  appsec: runAppsecAgent,
  docs: runDocsAgent,
  qa: runQaAgent,
};

const BUILTIN_PLUGINS: Plugin[] = [
  { id: 'architecture', run: RUNNERS.architecture },
  { id: 'appsec', run: RUNNERS.appsec },
  { id: 'docs', run: RUNNERS.docs },
  { id: 'qa', run: RUNNERS.qa },
];

const PACKAGE_TO_AGENT_ID: Record<string, AgentId> = {
  '@aios/agent-architecture': 'architecture',
  '@aios/agent-appsec': 'appsec',
  '@aios/agent-docs': 'docs',
  '@aios/agent-qa': 'qa',
};

export type PluginSource = 'builtin' | 'registry';

export type WorkflowOptions = {
  policies?: PolicyRule[];
  context?: ContextBundle;
  /** Home for `.aios/metrics/events.jsonl` (Phase 5b agent.execution). */
  homePath?: string;
  /** Default builtin. `registry` intersects Agent Registry with known runners. */
  pluginSource?: PluginSource;
  /** Override path to `.aios/agents.registry.json`. */
  registryPath?: string;
  /** Test / operator override: package names considered when source is registry. */
  registryAgentNames?: string[];
};

export type WorkflowResult = {
  results: AgentResult[];
  ran: AgentId[];
  skipped: AgentId[];
  pluginSource: PluginSource;
};

export function resolvePluginSource(
  explicit?: PluginSource,
  env: NodeJS.ProcessEnv = process.env
): PluginSource {
  if (explicit) return explicit;
  return env.AIOS_REGISTRY_PLUGINS === '1' ? 'registry' : 'builtin';
}

export function pluginsFromRegistryNames(names: string[]): Plugin[] {
  const selected: Plugin[] = [];
  const seen = new Set<AgentId>();
  for (const name of names) {
    const id = PACKAGE_TO_AGENT_ID[name];
    if (!id || seen.has(id)) continue;
    seen.add(id);
    selected.push({ id, run: RUNNERS[id] });
  }
  return selected;
}

export async function selectWorkflowPlugins(
  options: WorkflowOptions = {}
): Promise<{ plugins: Plugin[]; source: PluginSource; fallback: boolean }> {
  const source = resolvePluginSource(options.pluginSource);
  if (source !== 'registry') {
    return { plugins: BUILTIN_PLUGINS, source: 'builtin', fallback: false };
  }

  try {
    const names = options.registryAgentNames ?? (await listRegistryAgentNames(options));
    const selected = pluginsFromRegistryNames(names);
    if (selected.length === 0) {
      return { plugins: BUILTIN_PLUGINS, source: 'registry', fallback: true };
    }
    return { plugins: selected, source: 'registry', fallback: false };
  } catch {
    return { plugins: BUILTIN_PLUGINS, source: 'registry', fallback: true };
  }
}

async function listRegistryAgentNames(options: WorkflowOptions): Promise<string[]> {
  const homePath = options.homePath || process.cwd();
  const registry = new AgentRegistry({
    registryPath: options.registryPath || join(homePath, '.aios', 'agents.registry.json'),
  });
  const agents = await registry.listAgents({ includeCommunity: false });
  return agents.map((agent) => agent.manifest.name);
}

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
  const selected = await selectWorkflowPlugins(options);
  const plugins = selected.plugins;

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

  return { results, ran, skipped, pluginSource: selected.source };
}
