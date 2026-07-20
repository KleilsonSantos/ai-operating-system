import { runPipeline, PIPELINE_CONTRACT_VERSION } from '@aios/pipeline';
import { compilePrompt } from '@aios/prompt';
import { getProvider } from '@aios/provider';
import { getGovernanceStatus, chatWithMetrics, renderPrometheusMetrics } from '@aios/status';
import { auditDocumentation, searchPkb } from '@aios/documentation';
import { auditGovernance } from '@aios/governance';
import { getOperationalState } from '@aios/operational-state';
import { resolveWorkspace } from '@aios/workspace';
import { AgentRegistry } from '@aios/agent-registry';

function parseArgs(argv: string[]): {
  input: string;
  scope?: string;
  repoPath?: string;
  workspaceId?: string;
  policiesPath?: string;
  compilePromptOnly: boolean;
  briefOnly: boolean;
  providerHealth: boolean;
  providerChat: boolean;
  governanceStatus: boolean;
  metricsPrometheus: boolean;
  auditDocs: boolean;
  searchPkb: boolean;
  searchPkbTags: string[];
  searchPkbDomain?: string;
  searchPkbLimit?: number;
  governanceAudit: boolean;
  operationalState: boolean;
  listAgents: boolean;
  listAgentsTags: string[];
  listAgentsMaintainer?: string;
  listAgentsName?: string;
  listAgentsJson: boolean;
  providerId: string;
  model?: string;
} {
  let scope: string | undefined;
  let repoPath: string | undefined;
  let workspaceId: string | undefined;
  let policiesPath: string | undefined;
  let compilePromptOnly = false;
  let briefOnly = false;
  let providerHealth = false;
  let providerChat = false;
  let governanceStatus = false;
  let metricsPrometheus = false;
  let auditDocs = false;
  let searchPkbFlag = false;
  const searchPkbTags: string[] = [];
  let searchPkbDomain: string | undefined;
  let searchPkbLimit: number | undefined;
  let governanceAudit = false;
  let operationalState = false;
  let listAgentsFlag = false;
  const listAgentsTags: string[] = [];
  let listAgentsMaintainer: string | undefined;
  let listAgentsName: string | undefined;
  let listAgentsJson = false;
  let providerId = 'ollama';
  let model: string | undefined;
  const parts: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '--scope') {
      scope = argv[++i];
      continue;
    }
    if (a.startsWith('--scope=')) {
      scope = a.slice('--scope='.length);
      continue;
    }
    if (a === '--repo') {
      repoPath = argv[++i];
      continue;
    }
    if (a.startsWith('--repo=')) {
      repoPath = a.slice('--repo='.length);
      continue;
    }
    if (a === '--workspace') {
      workspaceId = argv[++i];
      continue;
    }
    if (a.startsWith('--workspace=')) {
      workspaceId = a.slice('--workspace='.length);
      continue;
    }
    if (a === '--policies') {
      policiesPath = argv[++i];
      continue;
    }
    if (a.startsWith('--policies=')) {
      policiesPath = a.slice('--policies='.length);
      continue;
    }
    if (a === '--compile-prompt') {
      compilePromptOnly = true;
      continue;
    }
    if (a === '--brief-only') {
      briefOnly = true;
      continue;
    }
    if (a === '--provider-health') {
      providerHealth = true;
      continue;
    }
    if (a === '--provider-chat') {
      providerChat = true;
      continue;
    }
    if (a === '--governance-status') {
      governanceStatus = true;
      continue;
    }
    if (a === '--metrics-prometheus' || a === '--prometheus') {
      metricsPrometheus = true;
      continue;
    }
    if (a === '--audit-docs') {
      auditDocs = true;
      continue;
    }
    if (a === '--search-pkb') {
      searchPkbFlag = true;
      continue;
    }
    if (a === '--tag') {
      const t = argv[++i];
      if (t) searchPkbTags.push(t);
      continue;
    }
    if (a.startsWith('--tag=')) {
      searchPkbTags.push(a.slice('--tag='.length));
      continue;
    }
    if (a === '--domain') {
      searchPkbDomain = argv[++i];
      continue;
    }
    if (a.startsWith('--domain=')) {
      searchPkbDomain = a.slice('--domain='.length);
      continue;
    }
    if (a === '--limit') {
      searchPkbLimit = Number(argv[++i]);
      continue;
    }
    if (a.startsWith('--limit=')) {
      searchPkbLimit = Number(a.slice('--limit='.length));
      continue;
    }
    if (a === '--governance-audit') {
      governanceAudit = true;
      continue;
    }
    if (a === '--operational-state') {
      operationalState = true;
      continue;
    }
    if (a === '--list-agents') {
      listAgentsFlag = true;
      continue;
    }
    if (a === '--agent-tag') {
      const t = argv[++i];
      if (t) listAgentsTags.push(t);
      continue;
    }
    if (a.startsWith('--agent-tag=')) {
      listAgentsTags.push(a.slice('--agent-tag='.length));
      continue;
    }
    if (a === '--agent-maintainer') {
      listAgentsMaintainer = argv[++i];
      continue;
    }
    if (a.startsWith('--agent-maintainer=')) {
      listAgentsMaintainer = a.slice('--agent-maintainer='.length);
      continue;
    }
    if (a === '--agent-name') {
      listAgentsName = argv[++i];
      continue;
    }
    if (a.startsWith('--agent-name=')) {
      listAgentsName = a.slice('--agent-name='.length);
      continue;
    }
    if (a === '--agents-json') {
      listAgentsJson = true;
      continue;
    }
    if (a === '--provider') {
      providerId = argv[++i] || 'ollama';
      continue;
    }
    if (a.startsWith('--provider=')) {
      providerId = a.slice('--provider='.length) || 'ollama';
      continue;
    }
    if (a === '--model') {
      model = argv[++i];
      continue;
    }
    if (a.startsWith('--model=')) {
      model = a.slice('--model='.length);
      continue;
    }
    if (a === '--contract-version') {
      console.log(PIPELINE_CONTRACT_VERSION);
      process.exit(0);
    }
    parts.push(a);
  }

  return {
    input: parts.join(' ').trim() || (searchPkbFlag ? '' : 'Analise meu projeto.'),
    scope: scope || process.env.AIOS_SCOPE,
    repoPath: repoPath || process.env.AIOS_REPO,
    workspaceId: workspaceId || process.env.AIOS_WORKSPACE,
    policiesPath: policiesPath || process.env.AIOS_POLICIES_PATH,
    compilePromptOnly,
    briefOnly,
    providerHealth,
    providerChat,
    governanceStatus,
    metricsPrometheus,
    auditDocs,
    searchPkb: searchPkbFlag,
    searchPkbTags,
    searchPkbDomain,
    searchPkbLimit,
    governanceAudit,
    operationalState,
    listAgents: listAgentsFlag,
    listAgentsTags,
    listAgentsMaintainer,
    listAgentsName,
    listAgentsJson,
    providerId,
    model,
  };
}

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
    if (args.listAgentsJson) {
      console.log(JSON.stringify({ count: agents.length, agents }, null, 2));
    } else {
      console.log('Agents disponíveis:');
      console.log();
      for (const agent of agents) {
        console.log(
          `  ${agent.manifest.displayName || agent.manifest.name} (${agent.manifest.version}) [${agent.source}]`
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
