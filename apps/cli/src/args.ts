import { PIPELINE_CONTRACT_VERSION } from '@aios/pipeline';

export type CliArgs = {
  input: string;
  scope?: string;
  repoPath?: string;
  workspaceId?: string;
  policiesPath?: string;
  compilePromptOnly: boolean;
  briefOnly: boolean;
  skillIds?: string[];
  hookIds?: string[];
  providerHealth: boolean;
  providerChat: boolean;
  governanceStatus: boolean;
  metricsPrometheus: boolean;
  auditDocs: boolean;
  searchPkb: boolean;
  searchPkbTags: string[];
  searchPkbDomain?: string;
  searchPkbLimit?: number;
  searchPkbSemantic: boolean;
  rebuildPkbVectors: boolean;
  governanceAudit: boolean;
  operationalState: boolean;
  visibility: boolean;
  visibilityRunId?: string;
  exportObsidian: boolean;
  exportOut?: string;
  exportFullGraph: boolean;
  listAgents: boolean;
  listAgentsTags: string[];
  listAgentsMaintainer?: string;
  listAgentsName?: string;
  listAgentsJson: boolean;
  listAgentsTree: boolean;
  listAgentsTreeRoot?: string;
  providerId: string;
  model?: string;
  help: boolean;
  printContractVersion: boolean;
  error?: string;
};

function parseCsvIds(raw: string | undefined): string[] | undefined {
  if (!raw?.trim()) return undefined;
  const ids = raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  return ids.length ? ids : undefined;
}

function emptyArgs(overrides: Partial<CliArgs> = {}): CliArgs {
  return {
    input: '',
    compilePromptOnly: false,
    briefOnly: false,
    providerHealth: false,
    providerChat: false,
    governanceStatus: false,
    metricsPrometheus: false,
    auditDocs: false,
    searchPkb: false,
    searchPkbTags: [],
    searchPkbSemantic: false,
    rebuildPkbVectors: false,
    governanceAudit: false,
    operationalState: false,
    visibility: false,
    exportObsidian: false,
    exportFullGraph: true,
    listAgents: false,
    listAgentsTags: [],
    listAgentsJson: false,
    listAgentsTree: false,
    providerId: 'ollama',
    help: false,
    printContractVersion: false,
    ...overrides,
  };
}

/** Usage text for `--help` / `-h` (stdout). */
export function formatHelp(): string {
  return `AIOS CLI — governance pipeline for software engineering.

Usage:
  aios [options] [input...]
  aios --help
  aios --contract-version

Common options:
  --repo <path>              Repository root (or AIOS_REPO)
  --workspace <id>           Workspace id (or AIOS_WORKSPACE)
  --scope <path>             Context scope (or AIOS_SCOPE)
  --policies <path>          Policies file (or AIOS_POLICIES_PATH)
  --compile-prompt           Compile governed brief only
  --brief-only               With --compile-prompt, print brief text
  --skill-ids <id,id>        Opt-in Prompt Engine skill packs
  --hook-ids <id,id>         Opt-in pipeline hooks
  --list-agents              List Agent Registry agents
  --agents-json | --json     With --list-agents, print machine-readable JSON
  --audit-docs               Documentation audit
  --search-pkb               Search Prompt Knowledge Base (query from remaining args)
  --semantic                 With --search-pkb, opt-in semantic mode (ADR-0032 / #327)
  --rebuild-pkb-vectors      Rebuild local .aios/pkb-vectors.sqlite cache (SAFE_WRITE consent)
  --governance-status        Governance / attention status
  --governance-audit         Governance audit
  --operational-state        Operational state snapshot
  --visibility               Visibility Plane snapshot (requires --scope, --workspace, and/or --run-id)
  --run-id <id>              Optional run id for --visibility / --export-obsidian
  --export-obsidian          Export KG (+ optional run note) to Obsidian Markdown (ADR-0030 / #366)
  --out <dir>                Destination for --export-obsidian (default: .aios/export/obsidian)
  --no-full-graph            With --export-obsidian + --scope, export only matched nodes
  --metrics-prometheus       Prometheus text metrics
  --provider-health          Provider health check
  --provider-chat            Provider chat (uses input)
  --provider <id>            Provider id (default: ollama)
  --model <name>             Model override
  --contract-version         Print pipeline contract version (${PIPELINE_CONTRACT_VERSION})
  -h, --help                 Show this help

Environment:
  AIOS_HOME                  Monorepo root (set to repo root when using pnpm --filter @aios/cli;
                             used for policies, memory, governance, metrics, visibility, PKB vectors)
  AIOS_REPO / AIOS_WORKSPACE / AIOS_SCOPE / AIOS_POLICIES_PATH
  AIOS_MCP_ALLOW_SAFE_WRITE  Set to 1 for --export-obsidian / --rebuild-pkb-vectors when must-policy mcp-safe-write-consent is loaded (#378 / #327)

Default input when none is given: "Analise meu projeto."
Unknown flags (tokens starting with -) exit with code 1.
`;
}

/**
 * Parse CLI argv (without node/tsx binary path).
 * Does not run the pipeline; callers handle help / errors / modes.
 */
export function parseArgs(argv: string[]): CliArgs {
  let scope: string | undefined;
  let repoPath: string | undefined;
  let workspaceId: string | undefined;
  let policiesPath: string | undefined;
  let compilePromptOnly = false;
  let briefOnly = false;
  let skillIds: string[] | undefined;
  let hookIds: string[] | undefined;
  let providerHealth = false;
  let providerChat = false;
  let governanceStatus = false;
  let metricsPrometheus = false;
  let auditDocs = false;
  let searchPkbFlag = false;
  const searchPkbTags: string[] = [];
  let searchPkbDomain: string | undefined;
  let searchPkbLimit: number | undefined;
  let searchPkbSemantic = false;
  let rebuildPkbVectors = false;
  let governanceAudit = false;
  let operationalState = false;
  let visibility = false;
  let visibilityRunId: string | undefined;
  let exportObsidian = false;
  let exportOut: string | undefined;
  let exportFullGraph = true;
  let listAgentsFlag = false;
  const listAgentsTags: string[] = [];
  let listAgentsMaintainer: string | undefined;
  let listAgentsName: string | undefined;
  let listAgentsJson = false;
  let listAgentsTree = false;
  let listAgentsTreeRoot: string | undefined;
  let providerId = 'ollama';
  let model: string | undefined;
  const parts: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;

    if (a === '--help' || a === '-h') {
      return emptyArgs({ help: true });
    }

    if (a === '--') {
      // pnpm (`pnpm … -- --help`) injects a lone `--`; ignore and keep parsing flags.
      continue;
    }

    if (a === '--contract-version') {
      return emptyArgs({ printContractVersion: true });
    }

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
    if (a === '--skill-ids') {
      skillIds = parseCsvIds(argv[++i]);
      continue;
    }
    if (a.startsWith('--skill-ids=')) {
      skillIds = parseCsvIds(a.slice('--skill-ids='.length));
      continue;
    }
    if (a === '--hook-ids') {
      hookIds = parseCsvIds(argv[++i]);
      continue;
    }
    if (a.startsWith('--hook-ids=')) {
      hookIds = parseCsvIds(a.slice('--hook-ids='.length));
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
    if (a === '--semantic') {
      searchPkbSemantic = true;
      continue;
    }
    if (a === '--rebuild-pkb-vectors') {
      rebuildPkbVectors = true;
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
    if (a === '--visibility') {
      visibility = true;
      continue;
    }
    if (a === '--run-id') {
      visibilityRunId = argv[++i];
      continue;
    }
    if (a.startsWith('--run-id=')) {
      visibilityRunId = a.slice('--run-id='.length);
      continue;
    }
    if (a === '--export-obsidian') {
      exportObsidian = true;
      continue;
    }
    if (a === '--out') {
      exportOut = argv[++i];
      continue;
    }
    if (a.startsWith('--out=')) {
      exportOut = a.slice('--out='.length);
      continue;
    }
    if (a === '--no-full-graph') {
      exportFullGraph = false;
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
    if (a === '--agents-json' || a === '--json') {
      listAgentsJson = true;
      continue;
    }
    if (a === '--agent-tree') {
      listAgentsTree = true;
      continue;
    }
    if (a === '--agent-tree-root') {
      listAgentsTree = true;
      listAgentsTreeRoot = argv[++i];
      continue;
    }
    if (a.startsWith('--agent-tree-root=')) {
      listAgentsTree = true;
      listAgentsTreeRoot = a.slice('--agent-tree-root='.length);
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

    if (a.startsWith('-')) {
      return emptyArgs({
        error: `Unknown option: ${a}\n\n${formatHelp()}`,
      });
    }

    parts.push(a);
  }

  return {
    input:
      parts.join(' ').trim() || (searchPkbFlag || rebuildPkbVectors ? '' : 'Analise meu projeto.'),
    scope: scope || process.env.AIOS_SCOPE,
    repoPath: repoPath || process.env.AIOS_REPO,
    workspaceId: workspaceId || process.env.AIOS_WORKSPACE,
    policiesPath: policiesPath || process.env.AIOS_POLICIES_PATH,
    compilePromptOnly,
    briefOnly,
    skillIds,
    hookIds,
    providerHealth,
    providerChat,
    governanceStatus,
    metricsPrometheus,
    auditDocs,
    searchPkb: searchPkbFlag,
    searchPkbTags,
    searchPkbDomain,
    searchPkbLimit,
    searchPkbSemantic,
    rebuildPkbVectors,
    governanceAudit,
    operationalState,
    visibility,
    visibilityRunId,
    exportObsidian,
    exportOut,
    exportFullGraph,
    listAgents: listAgentsFlag,
    listAgentsTags,
    listAgentsMaintainer,
    listAgentsName,
    listAgentsJson,
    listAgentsTree,
    listAgentsTreeRoot,
    providerId,
    model,
    help: false,
    printContractVersion: false,
  };
}
