import { runPipeline, PIPELINE_CONTRACT_VERSION } from '@aios/pipeline';
import { compilePrompt } from '@aios/prompt';
import { getProvider } from '@aios/provider';
import {
  getGovernanceStatus,
  chatWithMetrics,
  renderPrometheusMetrics,
  loadMetricsSnapshot,
} from '@aios/status';
import { auditDocumentation, searchPkb } from '@aios/documentation';
import { auditGovernance } from '@aios/governance';
import { getOperationalState } from '@aios/operational-state';
import { correlateVisibility } from '@aios/visibility';
import { resolveWorkspace } from '@aios/workspace';
import { AgentRegistry, formatDependencyTreeText } from '@aios-platform/agent-registry';
import { formatHelp, parseArgs } from './args.ts';

function resolveRepo(args: { repoPath?: string; workspaceId?: string }): string {
  if (args.repoPath) return args.repoPath;
  const ws = resolveWorkspace(args.workspaceId, {
    cwd: process.env.AIOS_HOME || process.cwd(),
  });
  if (ws) return ws.repoPath;
  return process.cwd();
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    process.stdout.write(formatHelp());
    return;
  }

  if (args.error) {
    console.error(args.error);
    process.exitCode = 1;
    return;
  }

  if (args.printContractVersion) {
    console.log(PIPELINE_CONTRACT_VERSION);
    return;
  }

  if (args.auditDocs) {
    const audit = auditDocumentation({ repoPath: resolveRepo(args) });
    console.log(JSON.stringify(audit, null, 2));
    if (!audit.ok) process.exitCode = 1;
    return;
  }

  if (args.searchPkb) {
    const result = searchPkb({
      repoPath: resolveRepo(args),
      query: args.input.trim() || undefined,
      tags: args.searchPkbTags,
      domain: args.searchPkbDomain,
      limit: args.searchPkbLimit,
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (args.listAgents) {
    const registry = new AgentRegistry();
    const agents = await registry.listAgentsFiltered({
      tags: args.listAgentsTags.length ? args.listAgentsTags : undefined,
      maintainer: args.listAgentsMaintainer,
      name: args.listAgentsName,
    });
    const snap = loadMetricsSnapshot({ homePath: process.env.AIOS_HOME || process.cwd() });
    const healthByAgent = new Map(
      (snap.agentExecution?.byAgent ?? []).map((row) => [row.agent, row])
    );
    const treeTargets = args.listAgentsTreeRoot
      ? agents.filter((a) => a.manifest.name === args.listAgentsTreeRoot)
      : agents;
    const enriched = await Promise.all(
      agents.map(async (agent) => {
        const metrics = healthByAgent.get(agent.manifest.name);
        const row: Record<string, unknown> = {
          ...agent,
          healthScore: metrics?.healthScore,
          executionCount: metrics?.count,
        };
        if (args.listAgentsTree) {
          const includeTree =
            !args.listAgentsTreeRoot || agent.manifest.name === args.listAgentsTreeRoot;
          row.dependencyTree = includeTree
            ? await registry.resolveDependencyTreeForAgent(agent.manifest.name)
            : undefined;
        }
        return row;
      })
    );
    if (args.listAgentsJson) {
      console.log(JSON.stringify({ count: enriched.length, agents: enriched }, null, 2));
    } else if (args.listAgentsTree && args.listAgentsTreeRoot && treeTargets.length === 0) {
      console.error(`Agent not found: ${args.listAgentsTreeRoot}`);
      process.exitCode = 1;
    } else if (args.listAgentsTree) {
      for (const agent of treeTargets) {
        const tree = await registry.resolveDependencyTreeForAgent(agent.manifest.name);
        if (!tree) {
          console.error(`Agent not found: ${agent.manifest.name}`);
          process.exitCode = 1;
          continue;
        }
        console.log(`Dependency tree: ${agent.manifest.name}`);
        for (const line of formatDependencyTreeText(tree)) {
          console.log(line);
        }
        console.log();
      }
    } else {
      console.log('Agents disponíveis:');
      console.log();
      for (const agent of agents) {
        const metrics = healthByAgent.get(agent.manifest.name);
        const health =
          typeof metrics?.healthScore === 'number' ? ` health=${metrics.healthScore}%` : '';
        const runs = typeof metrics?.count === 'number' ? ` runs=${metrics.count}` : '';
        console.log(
          `  ${agent.manifest.displayName || agent.manifest.name} (${agent.manifest.version}) [${agent.source}]${health}${runs}`
        );
        if (agent.manifest.description) {
          console.log(`    ${agent.manifest.description}`);
        }
        const tags = (agent.manifest.metadata?.tags as string[]) || [];
        if (tags.length) {
          console.log(`    Tags: ${tags.join(', ')}`);
        }
        console.log();
      }
    }
    return;
  }

  if (args.governanceAudit) {
    const home = process.env.AIOS_HOME || process.cwd();
    const audit = auditGovernance({
      homePath: home,
      repoPath: resolveRepo(args),
    });
    console.log(JSON.stringify(audit, null, 2));
    if (!audit.ok) process.exitCode = 1;
    return;
  }

  if (args.metricsPrometheus) {
    const text = renderPrometheusMetrics({
      homePath: process.env.AIOS_HOME || process.cwd(),
    });
    process.stdout.write(text);
    return;
  }

  if (args.governanceStatus) {
    const status = await getGovernanceStatus({
      homePath: process.env.AIOS_HOME || process.cwd(),
      providerId: args.providerId,
    });
    console.log(JSON.stringify(status, null, 2));
    if (status.attention.some((a) => a.severity === 'error')) {
      process.exitCode = 1;
    }
    return;
  }

  if (args.operationalState) {
    const state = await getOperationalState({
      homePath: process.env.AIOS_HOME || process.cwd(),
      workspaceId: args.workspaceId,
      providerId: args.providerId,
    });
    console.log(JSON.stringify(state, null, 2));
    if (state.health.errorCount > 0) process.exitCode = 1;
    return;
  }

  if (args.visibility) {
    const snap = await correlateVisibility({
      homePath: process.env.AIOS_HOME || process.cwd(),
      repoPath: args.repoPath,
      workspaceId: args.workspaceId,
      scope: args.scope,
      runId: args.visibilityRunId,
    });
    console.log(JSON.stringify(snap, null, 2));
    return;
  }

  if (args.providerHealth) {
    const health = await getProvider(args.providerId).health();
    console.log(JSON.stringify(health, null, 2));
    if (!health.ok) process.exitCode = 1;
    return;
  }

  if (args.providerChat) {
    const out = await chatWithMetrics({
      providerId: args.providerId,
      request: {
        model: args.model,
        messages: [{ role: 'user', content: args.input }],
      },
      source: 'cli',
    });
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  if (args.compilePromptOnly) {
    const compiled = compilePrompt({
      input: args.input,
      repoPath: args.repoPath,
      workspaceId: args.workspaceId,
      policiesPath: args.policiesPath,
      skillIds: args.skillIds,
      scope: args.scope,
    });
    if (args.briefOnly) {
      console.log(compiled.brief);
    } else {
      console.log(JSON.stringify(compiled, null, 2));
    }
    return;
  }

  const response = await runPipeline({
    input: args.input,
    repoPath: args.repoPath,
    workspaceId: args.workspaceId,
    scope: args.scope,
    policiesPath: args.policiesPath,
    skillIds: args.skillIds,
    hookIds: args.hookIds,
  });

  console.log(JSON.stringify(response, null, 2));

  if (!response.verdict.passed) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
