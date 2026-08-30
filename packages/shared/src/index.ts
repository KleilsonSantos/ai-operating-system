/** Tipos compartilhados entre engines e apps (Fase 1). */

/** Capability / privilege for MCP `aios_*` tools. Never chosen by the model. */
export const PRIVILEGES = [
  'READ_ONLY',
  'SAFE_WRITE',
  'CONTROLLED_EXECUTION',
  'PRIVILEGED',
  'HUMAN_APPROVAL_REQUIRED',
] as const;

export type Privilege = (typeof PRIVILEGES)[number];

export const PRIVILEGE_RANK: Record<Privilege, number> = {
  READ_ONLY: 0,
  SAFE_WRITE: 1,
  CONTROLLED_EXECUTION: 2,
  PRIVILEGED: 3,
  HUMAN_APPROVAL_REQUIRED: 4,
};

/** Tools exposed by `@aios/mcp` (canonical MVP list). */
export const MCP_TOOL_CATALOG = [
  'aios_contract_version',
  'aios_compile_prompt',
  'aios_list_workspaces',
  'aios_workspace_upsert',
  'aios_workspace_remove',
  'aios_workspace_validate',
  'aios_run_across_workspaces',
  'aios_build_knowledge',
  'aios_memory_remember',
  'aios_memory_recall',
  'aios_memory_clear',
  'aios_load_policies',
  'aios_run_pipeline',
  'aios_provider_health',
  'aios_provider_models',
  'aios_provider_chat',
  'aios_list_agents',
  'aios_governance_status',
  'aios_audit_docs',
  'aios_search_pkb',
  'aios_governance_audit',
  'aios_governance_record',
  'aios_operational_state',
  'aios_visibility',
  'aios_export_obsidian',
] as const;

export type McpToolName = (typeof MCP_TOOL_CATALOG)[number];

export const MCP_TOOL_PRIVILEGE: Record<McpToolName, Privilege> = {
  aios_contract_version: 'READ_ONLY',
  aios_compile_prompt: 'READ_ONLY',
  aios_list_workspaces: 'READ_ONLY',
  aios_workspace_validate: 'READ_ONLY',
  aios_build_knowledge: 'READ_ONLY',
  aios_memory_recall: 'READ_ONLY',
  aios_load_policies: 'READ_ONLY',
  aios_provider_health: 'READ_ONLY',
  aios_provider_models: 'READ_ONLY',
  aios_list_agents: 'READ_ONLY',
  aios_governance_status: 'READ_ONLY',
  aios_audit_docs: 'READ_ONLY',
  aios_search_pkb: 'READ_ONLY',
  aios_governance_audit: 'READ_ONLY',
  aios_operational_state: 'READ_ONLY',
  aios_visibility: 'READ_ONLY',
  aios_export_obsidian: 'SAFE_WRITE',
  aios_memory_remember: 'SAFE_WRITE',
  aios_memory_clear: 'SAFE_WRITE',
  aios_workspace_upsert: 'SAFE_WRITE',
  aios_governance_record: 'SAFE_WRITE',
  aios_run_pipeline: 'CONTROLLED_EXECUTION',
  aios_run_across_workspaces: 'CONTROLLED_EXECUTION',
  aios_provider_chat: 'CONTROLLED_EXECUTION',
  aios_workspace_remove: 'PRIVILEGED',
};

export const DEFAULT_CALLER_PRIVILEGE: Privilege = 'CONTROLLED_EXECUTION';

/** Process env without depending on `@types/node` in every consumer. */
export type EnvMap = Record<string, string | undefined>;

function readEnv(env?: EnvMap): EnvMap {
  if (env) return env;
  const proc = (globalThis as { process?: { env?: EnvMap } }).process;
  return proc?.env ?? {};
}

export type CapabilityDecision = {
  allowed: boolean;
  tool: string;
  required: Privilege;
  caller: Privilege;
  reason?: string;
};

export function isPrivilege(value: string): value is Privilege {
  return (PRIVILEGES as readonly string[]).includes(value);
}

export function resolveCallerPrivilege(env?: EnvMap): Privilege {
  const raw = readEnv(env).AIOS_MCP_PRIVILEGE?.trim();
  if (raw && isPrivilege(raw)) return raw;
  return DEFAULT_CALLER_PRIVILEGE;
}

export function privilegeForMcpTool(tool: string): Privilege {
  if (tool in MCP_TOOL_PRIVILEGE) {
    return MCP_TOOL_PRIVILEGE[tool as McpToolName];
  }
  return 'PRIVILEGED';
}

/**
 * Authorize an MCP tool. Privilege comes from env/operator — never from tool args.
 * `PRIVILEGED` also requires `AIOS_MCP_ALLOW_PRIVILEGED=1`.
 * `HUMAN_APPROVAL_REQUIRED` is always denied on the MCP surface in this phase.
 */
export function authorizeMcpTool(
  tool: string,
  options?: { env?: EnvMap; privilege?: Privilege }
): CapabilityDecision {
  const env = readEnv(options?.env);
  const caller = options?.privilege ?? resolveCallerPrivilege(env);
  const required = privilegeForMcpTool(tool);

  if (required === 'HUMAN_APPROVAL_REQUIRED') {
    return {
      allowed: false,
      tool,
      required,
      caller,
      reason: 'human-approval-required',
    };
  }

  if (PRIVILEGE_RANK[caller] < PRIVILEGE_RANK[required]) {
    return {
      allowed: false,
      tool,
      required,
      caller,
      reason: 'insufficient-privilege',
    };
  }

  if (required === 'PRIVILEGED' && env.AIOS_MCP_ALLOW_PRIVILEGED !== '1') {
    return {
      allowed: false,
      tool,
      required,
      caller,
      reason: 'privileged-not-enabled',
    };
  }

  return { allowed: true, tool, required, caller };
}

export function deniedMcpPayload(decision: CapabilityDecision): {
  error: 'policy.denied';
  tool: string;
  required: Privilege;
  caller: Privilege;
  reason?: string;
} {
  return {
    error: 'policy.denied',
    tool: decision.tool,
    required: decision.required,
    caller: decision.caller,
    reason: decision.reason,
  };
}

/** Intents canônicas do núcleo (#5 · v2 #63). */
export type IntentKind =
  | 'analyze.project'
  | 'explain.code'
  | 'review.change'
  | 'implement.feature'
  | 'fix.bug'
  | 'unknown';

export type Intent = {
  /** Texto original do usuário */
  raw: string;
  /** Classificação tipada */
  kind: IntentKind;
  /** 0..1 — confiança da classificação */
  confidence: number;
  /** Sinais que sustentaram a decisão (debug / audit) */
  signals: string[];
};

export type PolicyRule = {
  id: string;
  description: string;
  severity: 'must' | 'should' | 'may';
};

/** Vendor-agnostic model class — Policy picks a class, never a vendor (ADR-0025). */
export const MODEL_CAPABILITY_CLASSES = ['fast', 'coding', 'reasoning', 'arbitration'] as const;

export type ModelCapabilityClass = (typeof MODEL_CAPABILITY_CLASSES)[number];

export type RouteRisk = 'low' | 'medium' | 'high';

export type RouteCostBudget = 'low' | 'normal';

/** Task complexity for deterministic routing (ADR-0031 · master-architecture §8). */
export const TASK_COMPLEXITIES = ['SIMPLE', 'MEDIUM', 'COMPLEX', 'AGENTIC', 'CRITICAL'] as const;

export type TaskComplexity = (typeof TASK_COMPLEXITIES)[number];

/** Privacy tier — `sensitive` prefers local binding (ADR-0031 · master §19). */
export const TASK_PRIVACY_LEVELS = ['public', 'internal', 'sensitive'] as const;

export type TaskPrivacy = (typeof TASK_PRIVACY_LEVELS)[number];

export type TaskProfile = {
  complexity: TaskComplexity;
  privacy: TaskPrivacy;
  costBudget: RouteCostBudget;
  risk: RouteRisk;
};

export type RouteRequest = {
  intentKind: IntentKind;
  risk?: RouteRisk;
  privilege?: Privilege;
  costBudget?: RouteCostBudget;
  /** Force a class; binding to provider/model still comes from env. */
  capabilityClass?: ModelCapabilityClass;
  /** Optional complexity override (ADR-0031). */
  complexity?: TaskComplexity;
  /** Optional privacy override — `sensitive` forces local ollama (ADR-0031). */
  privacy?: TaskPrivacy;
};

export type RouteDecision = {
  providerId: ProviderId;
  modelId: string;
  capabilityClass: ModelCapabilityClass;
  reason: string;
  /** Deterministic task profile used for this decision (ADR-0031). */
  taskProfile: TaskProfile;
};

export type ContextBudgetTier = 'tight' | 'standard' | 'wide';

export type ContextBudget = {
  tier: ContextBudgetTier;
  maxSnippets: number;
  maxBytesPerFile: number;
  maxTotalBytes: number;
};

export function isModelCapabilityClass(value: string): value is ModelCapabilityClass {
  return (MODEL_CAPABILITY_CLASSES as readonly string[]).includes(value);
}

export function isTaskComplexity(value: string): value is TaskComplexity {
  return (TASK_COMPLEXITIES as readonly string[]).includes(value);
}

export function isTaskPrivacy(value: string): value is TaskPrivacy {
  return (TASK_PRIVACY_LEVELS as readonly string[]).includes(value);
}

/** Snippet recuperado do repositório (Context Engine — #7). */
export type ContextSnippetKind = 'doc' | 'code' | 'manifest';

export type ContextSnippet = {
  /** Caminho relativo à raiz do repo */
  path: string;
  kind: ContextSnippetKind;
  /** Conteúdo truncado */
  content: string;
  bytes: number;
};

export type ContextBundle = {
  /** Raiz resolvida do repositório */
  repoPath: string;
  /** Escopo relativo (`. ` = repo inteiro priorizado) */
  scope: string;
  snippets: ContextSnippet[];
  /** Sinais de coleta (audit / debug) */
  signals: string[];
  /** Named budget applied during gather (ADR-0025). */
  budget?: ContextBudget;
};

export type AgentResult = {
  agentId: string;
  ok: boolean;
  findings: string[];
  references: string[];
};

export type QualityVerdict = {
  passed: boolean;
  checks: Record<string, boolean>;
  blockers: string[];
};

/** Versão do contrato CLI/API estável (issue #9). */
export const PIPELINE_CONTRACT_VERSION = '1' as const;

export type PipelineContractVersion = typeof PIPELINE_CONTRACT_VERSION;

/** Entrada do registry multi-repo (Fase 2 · #43 · Fase 3 · #55). */
export type WorkspaceEntry = {
  /** Identificador estável (ex.: `aios`, `portfolio`) */
  id: string;
  /** Absoluto ou relativo à âncora do registry */
  path: string;
  /** Label humano opcional */
  name?: string;
  /** Se true, usado quando workspaceId omitido */
  default?: boolean;
  /** Tags livres (ex.: `frontend`, `java`) */
  tags?: string[];
};

export type WorkspaceRegistry = {
  workspaces: WorkspaceEntry[];
};

/** Knowledge Graph (Fase 2 · #47). */
export type KnowledgeNodeKind =
  | 'project'
  | 'module'
  | 'package'
  | 'engine'
  | 'doc'
  | 'policy'
  | 'workspace'
  | 'infra'
  | 'api'
  | 'database';

export type KnowledgeEdgeKind = 'contains' | 'depends_on' | 'documents';

export type KnowledgeNode = {
  id: string;
  kind: KnowledgeNodeKind;
  label: string;
  path?: string;
  meta?: Record<string, string>;
};

export type KnowledgeEdge = {
  from: string;
  to: string;
  kind: KnowledgeEdgeKind;
};

export type KnowledgeGraph = {
  repoPath?: string;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  signals: string[];
};

/** Memory Engine (Fase 2 · #51). */
export type MemoryEntry = {
  id: string;
  content: string;
  createdAt: string;
  tags?: string[];
};

export type MemoryStore = {
  workspaceId: string;
  updatedAt: string;
  entries: MemoryEntry[];
};

/** How, not who — optional pack for the Prompt Engine (ADR-0026). */
export const SKILL_FAILURE_POLICIES = ['fail', 'skip', 'retry'] as const;

export type SkillFailurePolicy = (typeof SKILL_FAILURE_POLICIES)[number];

export type SkillManifest = {
  id: string;
  purpose: string;
  allowedTools: string[];
  failurePolicy: SkillFailurePolicy;
  prerequisites?: string[];
  contextRequirements?: string[];
  validation?: string[];
};

/** Prompt Engine — brief governado (#59). */
export type CompilePromptRequest = {
  input: string;
  workspaceId?: string;
  repoPath?: string;
  policiesPath?: string;
  memoryLimit?: number;
  /** Opt-in skill pack ids. Default: none. */
  skillIds?: string[];
  /** Override `skills/aios.skills.json` */
  skillsPath?: string;
  /** Path relative to repo root — names KG neighbors in the brief (#305). */
  scope?: string;
};

export type CompiledPrompt = {
  input: string;
  intent: Intent;
  workspaceId?: string;
  repoPath: string;
  /** Texto pronto para o Agent (markdown curto) */
  brief: string;
  skills: SkillManifest[];
  stats: {
    mustPolicyCount: number;
    memoryCount: number;
    knowledgeNodes: number;
    briefChars: number;
    skillCount: number;
  };
};

/** Multi-provider MVP (#67) — LLM auxiliar (não substitui a IDE). */
export type ProviderId = 'ollama' | 'openai' | 'anthropic';

const ROUTE_PROVIDER_IDS: readonly ProviderId[] = ['ollama', 'openai', 'anthropic'];

const DEFAULT_ROUTE_BINDINGS: Record<
  ModelCapabilityClass,
  { providerId: ProviderId; modelId: string }
> = {
  fast: { providerId: 'ollama', modelId: 'llama3.2' },
  coding: { providerId: 'ollama', modelId: 'llama3.2' },
  reasoning: { providerId: 'ollama', modelId: 'llama3.2' },
  arbitration: { providerId: 'ollama', modelId: 'llama3.2' },
};

const ROUTE_ENV_KEYS: Record<ModelCapabilityClass, { provider: string; model: string }> = {
  fast: { provider: 'AIOS_ROUTE_FAST_PROVIDER', model: 'AIOS_ROUTE_FAST_MODEL' },
  coding: { provider: 'AIOS_ROUTE_CODING_PROVIDER', model: 'AIOS_ROUTE_CODING_MODEL' },
  reasoning: { provider: 'AIOS_ROUTE_REASONING_PROVIDER', model: 'AIOS_ROUTE_REASONING_MODEL' },
  arbitration: {
    provider: 'AIOS_ROUTE_ARBITRATION_PROVIDER',
    model: 'AIOS_ROUTE_ARBITRATION_MODEL',
  },
};

function isRouteProviderId(value: string): value is ProviderId {
  return (ROUTE_PROVIDER_IDS as readonly string[]).includes(value);
}

export function inferRouteRisk(req: Pick<RouteRequest, 'intentKind' | 'privilege'>): RouteRisk {
  if (req.privilege === 'PRIVILEGED' || req.privilege === 'HUMAN_APPROVAL_REQUIRED') {
    return 'high';
  }
  if (
    req.intentKind === 'implement.feature' ||
    req.intentKind === 'fix.bug' ||
    req.intentKind === 'review.change'
  ) {
    return 'medium';
  }
  return 'low';
}

/** Infer complexity from intent + risk (ADR-0031). Explicit `complexity` wins. */
export function inferTaskComplexity(
  req: Pick<RouteRequest, 'intentKind' | 'risk' | 'privilege' | 'complexity'>
): TaskComplexity {
  if (req.complexity) return req.complexity;
  const risk = req.risk ?? inferRouteRisk(req);
  if (risk === 'high') return 'CRITICAL';
  switch (req.intentKind) {
    case 'implement.feature':
    case 'fix.bug':
      return 'AGENTIC';
    case 'analyze.project':
    case 'review.change':
      return 'COMPLEX';
    case 'explain.code':
      return 'MEDIUM';
    default:
      return 'SIMPLE';
  }
}

/** Default privacy is `internal`; explicit override only (ADR-0031). */
export function inferTaskPrivacy(req: Pick<RouteRequest, 'privacy'>): TaskPrivacy {
  return req.privacy ?? 'internal';
}

/** Build the full task profile used by `routeModel` (ADR-0031). */
export function buildTaskProfile(req: RouteRequest): TaskProfile {
  const risk = req.risk ?? inferRouteRisk(req);
  return {
    complexity: inferTaskComplexity({ ...req, risk }),
    privacy: inferTaskPrivacy(req),
    costBudget: req.costBudget ?? 'normal',
    risk,
  };
}

export function resolveCapabilityClass(req: RouteRequest): ModelCapabilityClass {
  if (req.capabilityClass) return req.capabilityClass;
  if (req.costBudget === 'low') return 'fast';

  const profile = buildTaskProfile(req);
  if (profile.risk === 'high' || profile.complexity === 'CRITICAL') return 'arbitration';

  switch (profile.complexity) {
    case 'SIMPLE':
      return 'fast';
    case 'MEDIUM':
    case 'AGENTIC':
      return 'coding';
    case 'COMPLEX':
      return 'reasoning';
    default:
      return 'fast';
  }
}

function bindCapabilityClass(
  capabilityClass: ModelCapabilityClass,
  envMap: EnvMap
): { providerId: ProviderId; modelId: string; signals: string[] } {
  const defaults = DEFAULT_ROUTE_BINDINGS[capabilityClass];
  const keys = ROUTE_ENV_KEYS[capabilityClass];
  const rawProvider = envMap[keys.provider]?.trim().toLowerCase();
  const rawModel = envMap[keys.model]?.trim();
  const signals: string[] = [];

  let providerId = defaults.providerId;
  if (rawProvider) {
    if (isRouteProviderId(rawProvider)) {
      providerId = rawProvider;
      signals.push('env-provider');
    } else {
      signals.push('env-provider-invalid');
    }
  }

  let modelId = defaults.modelId;
  if (rawModel) {
    modelId = rawModel;
    signals.push('env-model');
  } else if (providerId === 'ollama' && envMap.AIOS_OLLAMA_MODEL?.trim()) {
    modelId = envMap.AIOS_OLLAMA_MODEL.trim();
  } else if (providerId === 'openai' && envMap.AIOS_OPENAI_MODEL?.trim()) {
    modelId = envMap.AIOS_OPENAI_MODEL.trim();
  } else if (providerId === 'anthropic' && envMap.AIOS_ANTHROPIC_MODEL?.trim()) {
    modelId = envMap.AIOS_ANTHROPIC_MODEL.trim();
  }

  return { providerId, modelId, signals };
}

/** Pure decision — no network, no chat (ADR-0025 / ADR-0031). */
export function routeModel(req: RouteRequest, env?: EnvMap): RouteDecision {
  const taskProfile = buildTaskProfile(req);
  const capabilityClass = resolveCapabilityClass(req);
  const envMap = readEnv(env);
  let bound = bindCapabilityClass(capabilityClass, envMap);

  // Privacy-aware: sensitive work stays on local ollama (master §19 / ADR-0031).
  if (taskProfile.privacy === 'sensitive' && bound.providerId !== 'ollama') {
    const localModel =
      envMap.AIOS_OLLAMA_MODEL?.trim() || DEFAULT_ROUTE_BINDINGS[capabilityClass].modelId;
    bound = {
      providerId: 'ollama',
      modelId: localModel,
      signals: [...bound.signals, 'privacy-local'],
    };
  }

  const parts = [
    `class:${capabilityClass}`,
    `intent:${req.intentKind}`,
    `complexity:${taskProfile.complexity}`,
    `privacy:${taskProfile.privacy}`,
    `risk:${taskProfile.risk}`,
  ];
  if (taskProfile.costBudget !== 'normal') parts.push(`cost:${taskProfile.costBudget}`);
  if (req.capabilityClass) parts.push('forced-class');
  parts.push(...bound.signals);

  return {
    providerId: bound.providerId,
    modelId: bound.modelId,
    capabilityClass,
    reason: parts.join(' '),
    taskProfile,
  };
}

export type ChatRole = 'system' | 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatRequest = {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
};

/** Normalized token usage from provider APIs (#115). */
export type ChatUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type ChatResponse = {
  provider: string;
  model: string;
  message: ChatMessage;
  usage?: ChatUsage;
  latencyMs?: number;
};

export type ProviderModelInfo = {
  name: string;
  size?: number;
  modifiedAt?: string;
};

export type ProviderHealth = {
  provider: string;
  ok: boolean;
  baseUrl: string;
  models?: string[];
  error?: string;
  latencyMs?: number;
  /** Circuit breaker state when resilience is enabled (#238). */
  circuit?: 'closed' | 'open' | 'half-open';
};

/** Console de governança — status + attention (#71). */
export type AttentionSeverity = 'error' | 'warn' | 'info';

export type AttentionItem = {
  id: string;
  severity: AttentionSeverity;
  title: string;
  detail: string;
};

/** Registry agent row joined with optional execution metrics (console catalog / #247). */
export type AgentCatalogEntry = {
  name: string;
  version: string;
  displayName?: string;
  source: 'builtin' | 'local' | 'npm' | 'git' | 'community';
  healthScore?: number;
  executions?: number;
  /** Executions with `at` in the last 7 days (#253). */
  executions7d?: number;
};

/** Daily agent.execution buckets for adoption curves (#324). */
export type AgentAdoptionSeries = {
  days: number;
  /** UTC day labels `YYYY-MM-DD`, oldest first. */
  buckets: string[];
  /** Total runs per bucket day. */
  total: number[];
  /** Per-agent runs per bucket (agents with at least one run in window). */
  byAgent: Record<string, number[]>;
};

export type GovernanceStatus = {
  generatedAt: string;
  contractVersion: PipelineContractVersion;
  homePath: string;
  workspaces: Array<{
    id: string;
    name?: string;
    repoPath: string;
    ok: boolean;
    signals: string[];
  }>;
  policies: {
    source: string;
    path?: string;
    count: number;
    mustIds: string[];
  };
  provider: ProviderHealth;
  memory: {
    workspaceIds: string[];
  };
  exposed: {
    mcpTools: string[];
    /** Privilege required per MCP tool (ADR-0024). */
    mcpToolPrivileges?: Record<string, Privilege>;
    providers: string[];
  };
  /** Agent Registry catalog with optional health/execution join (#247 / ADR-0023). */
  agents: AgentCatalogEntry[];
  attention: AttentionItem[];
  metrics: {
    available: boolean;
    note: string;
    eventCount?: number;
    path?: string;
    /** Aggregated `provider.chat` JSONL events (#115). */
    providerChat?: {
      count: number;
      errorCount: number;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    /** Aggregated `agent.execution` JSONL events (#217 / ADR-0023). */
    agentExecution?: {
      count: number;
      errorCount: number;
      byAgent: Array<{
        agent: string;
        count: number;
        errorCount: number;
        healthScore: number;
        count7d?: number;
        lastAt?: string;
      }>;
      /** Daily run counts for the last N UTC days (#324). */
      adoption7d?: AgentAdoptionSeries;
      adoption30d?: AgentAdoptionSeries;
    };
  };
};

/** Documentation Engine — drift heurístico (#80). */
export type DocFindingSeverity = 'error' | 'warn' | 'info';

export type DocFinding = {
  id: string;
  severity: DocFindingSeverity;
  title: string;
  detail: string;
  path?: string;
};

export type DocumentationAudit = {
  generatedAt: string;
  repoPath: string;
  present: string[];
  missing: string[];
  findings: DocFinding[];
  ok: boolean;
};

/** Governance Engine — auditoria leve (#80). */
export type GovernanceDecision = {
  id: string;
  at: string;
  kind: string;
  summary: string;
  policyIds?: string[];
  verdict?: 'pass' | 'fail' | 'info';
  source?: string;
};

export type GovernanceAudit = {
  generatedAt: string;
  homePath: string;
  repoPath: string;
  policies: {
    mustIds: string[];
    count: number;
    /** Platform core must ids missing from the loaded set (#121). */
    missingCoreMustIds?: string[];
  };
  decisions: {
    path: string;
    count: number;
    recent: GovernanceDecision[];
    failCount?: number;
    unknownPolicyIds?: string[];
  };
  documentation?: {
    ok: boolean;
    findingCount: number;
  };
  findings: AttentionItem[];
  ok: boolean;
};

/** Operational State — estado unificado leve do control plane (#84 / ADR-0015). */
export type OperationalGitSnapshot = {
  available: boolean;
  branch?: string;
  head?: string;
  dirty?: boolean;
  error?: string;
};

export type OperationalState = {
  generatedAt: string;
  contractVersion: PipelineContractVersion;
  homePath: string;
  /** Sempre on-demand no MVP — sem watchers / polling. */
  mode: 'on-demand';
  summary: string;
  git: OperationalGitSnapshot;
  focus?: {
    workspaceId: string;
    name?: string;
    repoPath: string;
    ok: boolean;
  };
  health: {
    attention: AttentionItem[];
    errorCount: number;
    warnCount: number;
    providerOk: boolean;
    workspaceCount: number;
    policiesMust: number;
  };
  memory: {
    workspaceIds: string[];
  };
  governance: {
    decisionCount: number;
    path: string;
    /** Present when a quick governance audit ran (#121). */
    ok?: boolean;
    findingCount?: number;
  };
  /** Fronteiras explícitas (Companion / ADR-0014). */
  boundaries: {
    voice: false;
    ideControl: false;
    dockerControl: false;
  };
};

/** Pedido do integrador → núcleo AIOS. */
export type PipelineRequest = {
  /** Texto livre do usuário (intent raw) */
  input: string;
  /** Diretório do repositório alvo (default: process.cwd()) */
  repoPath?: string;
  /**
   * Id no registry `workspaces/aios.workspaces.json`.
   * Se definido, resolve `repoPath` (exceto se `repoPath` explícito vencer).
   */
  workspaceId?: string;
  /** Escopo relativo para Context Engine */
  scope?: string;
  /** JSON de policies (opcional; senão defaults / walk-up) */
  policiesPath?: string;
  /** Override do arquivo de workspaces */
  workspacesPath?: string;
  /**
   * Se true, anexa recall de memória ao response
   * (default: true quando workspaceId presente).
   */
  includeMemory?: boolean;
  /** Limite de entradas de memória no response */
  memoryLimit?: number;
  /**
   * Plugin selection source (ADR-0024).
   * Default: builtin 4. `registry` intersects Agent Registry with known runners.
   */
  pluginSource?: 'builtin' | 'registry';
  /** Optional risk hint for model routing + context budget (ADR-0025). */
  risk?: RouteRisk;
  /** Optional cost hint — `low` forces class `fast` and a tight context budget. */
  costBudget?: RouteCostBudget;
  /** Optional privilege hint for routing (default: caller MCP privilege). */
  privilege?: Privilege;
  /** Optional task complexity override (ADR-0031). */
  complexity?: TaskComplexity;
  /** Optional privacy override — `sensitive` forces local ollama (ADR-0031). */
  privacy?: TaskPrivacy;
  /** Opt-in skill pack ids recorded on `run.skillIds` (ADR-0026). Default: none. */
  skillIds?: string[];
  /** Opt-in hook ids recorded on `run.hookIds` (ADR-0027). Default: none. */
  hookIds?: string[];
};

/** Central lifecycle points — intercepts attach here (ADR-0027). Default: none. */
export const PIPELINE_HOOK_POINTS = [
  'before.policy',
  'after.policy',
  'before.context',
  'after.context',
  'before.agent',
  'after.agent',
  'before.gate',
  'after.gate',
] as const;

export type PipelineHookPoint = (typeof PIPELINE_HOOK_POINTS)[number];

export const BUILTIN_PIPELINE_HOOKS = ['record.lifecycle'] as const;

export type BuiltinPipelineHookId = (typeof BUILTIN_PIPELINE_HOOKS)[number];

export function selectPipelineHooks(requestedIds?: string[]): {
  selected: BuiltinPipelineHookId[];
  skippedIds: string[];
} {
  if (!requestedIds?.length) {
    return { selected: [], skippedIds: [] };
  }
  const known = new Set<string>(BUILTIN_PIPELINE_HOOKS);
  const selected: BuiltinPipelineHookId[] = [];
  const skippedIds: string[] = [];
  const seen = new Set<string>();
  for (const raw of requestedIds) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (known.has(id)) selected.push(id as BuiltinPipelineHookId);
    else skippedIds.push(id);
  }
  return { selected, skippedIds };
}

export function recordsLifecycleHooks(selected: readonly string[]): boolean {
  return selected.includes('record.lifecycle');
}

export type PipelineStepKind =
  | 'classify'
  | 'policy'
  | 'context'
  | 'route'
  | 'skill'
  | 'knowledge'
  | 'memory'
  | 'agent'
  | 'hook'
  | 'gate';

export type PipelineStepStatus = 'ok' | 'skip' | 'fail' | 'denied';

export type PipelineStep = {
  stepId: string;
  kind: PipelineStepKind;
  status: PipelineStepStatus;
  agentId?: string;
  detail?: string;
};

export type PipelineArtifact = {
  id: string;
  kind: string;
  ref: string;
};

/** Execution state for one `runPipeline` invocation (ADR-0024). Additive on v1. */
export type PipelineRun = {
  runId: string;
  taskId: string;
  intentKind: string;
  workspaceId?: string;
  policyIds: string[];
  agentIds: string[];
  skillIds: string[];
  hookIds: string[];
  /** Capability-class route — no chat is invoked (ADR-0025 / ADR-0031). */
  model?: {
    providerId: string;
    modelId: string;
    capabilityClass: ModelCapabilityClass;
    complexity?: TaskComplexity;
    privacy?: TaskPrivacy;
  };
  steps: PipelineStep[];
  artifacts: PipelineArtifact[];
  verdict?: { passed: boolean; reasons: string[] };
};

/** One `agent.execution` JSONL row for Visibility Plane (ADR-0030). */
export type AgentExecutionRecord = {
  kind: 'agent.execution';
  at: string;
  agent: string;
  version?: string;
  outcome: string;
  durationMs?: number;
  source?: string;
  ok?: boolean;
};

/** Human-readable trail entry derived from run steps / agent JSONL. */
export type VisibilityTrailItem = {
  kind: 'pipeline.step' | 'agent.execution' | 'policy';
  id: string;
  label: string;
  at?: string;
  status?: string;
};

/** Correlated governance snapshot (ADR-0030) — on-demand only. */
export type VisibilitySnapshot = {
  anchor: { runId?: string; scope?: string; workspaceId?: string };
  generatedAt: string;
  /** Present when caller injects a run; AIOS does not persist PipelineRun yet. */
  run?: PipelineRun;
  runLookup?: 'provided' | 'unavailable';
  knowledge: {
    nodeCount: number;
    edgeCount: number;
    kinds: Record<string, number>;
    signals: string[];
    matchedNodeIds?: string[];
  };
  operational?: Pick<OperationalState, 'focus' | 'governance' | 'boundaries' | 'summary'>;
  agentExecutions?: AgentExecutionRecord[];
  policyRefs?: string[];
  /** Palatable execution labels for operators (chat / Console). */
  trail: VisibilityTrailItem[];
};

/** Resposta estável do núcleo (stdout JSON do CLI = este shape). */
export type PipelineResponse = {
  contractVersion: PipelineContractVersion;
  intent: Intent;
  policies: {
    source: string;
    path?: string;
    count: number;
    mustIds: string[];
  };
  context: {
    repoPath: string;
    scope: string;
    snippetCount: number;
    paths: string[];
    signals: string[];
    budget?: {
      tier: ContextBudgetTier;
      maxSnippets: number;
      maxTotalBytes: number;
      usedBytes: number;
    };
  };
  /** Presente quando um workspace do registry foi usado */
  workspace?: {
    id: string;
    name?: string;
    registryPath?: string;
  };
  /** Resumo do Knowledge Graph heurístico (#47) */
  knowledge?: {
    nodeCount: number;
    edgeCount: number;
    kinds: Record<string, number>;
    signals: string[];
  };
  /** Recall de memória de sessão/projeto (#51) */
  memory?: {
    workspaceId: string;
    count: number;
    entries: MemoryEntry[];
    path?: string;
  };
  workflow: {
    ran: string[];
    skipped: string[];
  };
  results: AgentResult[];
  verdict: QualityVerdict;
  /** Additive execution record — omitted only by older producers. */
  run?: PipelineRun;
};
