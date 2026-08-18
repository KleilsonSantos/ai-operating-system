/**
 * Status Engine — health + needs attention for the console (#71).
 * Provider chat consumption: local JSONL metrics (#115 / ADR-0019).
 * Prometheus text export: #130 / ADR-0021 (ADR-0010 layer 2).
 * Spec: https://prometheus.io/docs/instrumenting/exposition_formats/
 */
import { existsSync, mkdirSync, appendFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  MCP_TOOL_CATALOG,
  MCP_TOOL_PRIVILEGE,
  PIPELINE_CONTRACT_VERSION,
  type AgentCatalogEntry,
  type AttentionItem,
  type ChatRequest,
  type ChatResponse,
  type ChatUsage,
  type GovernanceStatus,
} from '@aios/shared';

export { MCP_TOOL_CATALOG } from '@aios/shared';
import { listValidatedWorkspaces } from '@aios/workspace';
import { loadPolicies, applyPolicies } from '@aios/policy';
import { listMemoryWorkspaces } from '@aios/memory';
import { getProvider, listProviderIds } from '@aios/provider';
import { auditGovernance } from '@aios/governance';
import { AgentRegistry } from '@aios-platform/agent-registry';

export type GetGovernanceStatusOptions = {
  homePath?: string;
  providerId?: string;
  /** Skip live provider check (tests) */
  providerHealth?: GovernanceStatus['provider'];
};

export type ProviderChatMetricInput = {
  provider: string;
  model?: string;
  ok: boolean;
  latencyMs?: number;
  usage?: ChatUsage;
  error?: string;
  source?: string;
};

export type ProviderChatTotals = {
  count: number;
  errorCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type ProviderChatByProvider = ProviderChatTotals & {
  provider: string;
};

export type AgentExecutionOutcome = 'success' | 'failure' | 'timeout' | 'partial';

export type AgentExecutionMetricInput = {
  agent: string;
  version?: string;
  outcome: AgentExecutionOutcome;
  durationMs?: number;
  source?: string;
};

export type AgentExecutionTotals = {
  count: number;
  errorCount: number;
};

export type AgentExecutionByAgent = AgentExecutionTotals & {
  agent: string;
  healthScore: number;
  /** Executions in the rolling 7-day window (by event `at`). */
  count7d: number;
  lastAt?: string;
};

export type DeliveryCiConclusion =
  'success' | 'failure' | 'skipped' | 'cancelled' | 'pending' | 'unknown' | string;

export type DeliveryCiMetricInput = {
  check: string;
  conclusion: DeliveryCiConclusion;
  baseBranch: string;
  pr?: number;
  runId?: number | string;
  commit?: string;
  url?: string;
  source?: string;
};

export type DeliveryCiByCheck = {
  check: string;
  conclusion: DeliveryCiConclusion;
  baseBranch: string;
  count: number;
  errorCount: number;
};

export type MetricsSnapshot = {
  path: string;
  eventCount: number;
  providerChat?: ProviderChatTotals;
  byProvider: ProviderChatByProvider[];
  agentExecution?: AgentExecutionTotals & {
    byAgent: AgentExecutionByAgent[];
  };
  deliveryCi?: {
    count: number;
    errorCount: number;
    byCheck: DeliveryCiByCheck[];
  };
};

/** Content-Type for classic Prometheus text exposition. */
export const PROMETHEUS_CONTENT_TYPE = 'text/plain; version=0.0.4; charset=utf-8';

function metricsPath(homePath: string): string {
  return join(homePath, '.aios', 'metrics', 'events.jsonl');
}

type ProviderChatSummary = NonNullable<GovernanceStatus['metrics']['providerChat']>;

function emptyTotals(): ProviderChatTotals {
  return {
    count: 0,
    errorCount: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };
}

function addUsage(into: ProviderChatTotals, usage: ChatUsage | undefined): void {
  if (usage?.promptTokens) into.promptTokens += usage.promptTokens;
  if (usage?.completionTokens) into.completionTokens += usage.completionTokens;
  if (usage?.totalTokens) {
    into.totalTokens += usage.totalTokens;
  } else if (usage?.promptTokens || usage?.completionTokens) {
    into.totalTokens += (usage.promptTokens || 0) + (usage.completionTokens || 0);
  }
}

/** Escape a label value for Prometheus text format. */
export function escapePromLabel(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
}

/**
 * Health-score 0–100 from success-rate (70%), recency (20%), adoption (10%).
 * ADR-0023 / Phase 5b (#217).
 */
export function computeAgentHealthScore(input: {
  successCount: number;
  totalCount: number;
  lastAt?: string;
  maxExecutionsSeen: number;
  nowMs?: number;
}): number {
  const total = Math.max(0, input.totalCount);
  if (total === 0) return 0;
  const successRate = Math.min(1, Math.max(0, input.successCount / total));
  const now = input.nowMs ?? Date.now();
  let recency = 0.5;
  if (input.lastAt) {
    const ageDays = Math.max(0, (now - Date.parse(input.lastAt)) / (24 * 60 * 60 * 1000));
    if (Number.isFinite(ageDays)) {
      if (ageDays <= 1) recency = 1;
      else if (ageDays <= 7) recency = 0.7;
      else if (ageDays <= 30) recency = 0.4;
      else recency = 0.15;
    }
  }
  const maxSeen = Math.max(1, input.maxExecutionsSeen);
  const adoption = Math.min(1, Math.log(total + 1) / Math.log(maxSeen + 1));
  const score = 0.7 * successRate + 0.2 * recency + 0.1 * adoption;
  return Math.round(Math.min(100, Math.max(0, score * 100)));
}

/**
 * Read `.aios/metrics/events.jsonl` once (Resource-Aware).
 */
export function loadMetricsSnapshot(
  options: { homePath?: string; nowMs?: number } = {}
): MetricsSnapshot {
  const home = resolve(options.homePath || process.env.AIOS_HOME || process.cwd());
  const path = metricsPath(home);
  if (!existsSync(path)) {
    return { path, eventCount: 0, byProvider: [] };
  }

  const nowMs = options.nowMs ?? Date.now();
  const window7dMs = 7 * 24 * 60 * 60 * 1000;

  let eventCount = 0;
  const total = emptyTotals();
  const per = new Map<string, ProviderChatTotals>();
  const agentTotal: AgentExecutionTotals = { count: 0, errorCount: 0 };
  type AgentBucket = {
    count: number;
    errorCount: number;
    successCount: number;
    count7d: number;
    lastAt?: string;
  };
  const perAgent = new Map<string, AgentBucket>();
  const deliveryTotal = { count: 0, errorCount: 0 };
  type DeliveryBucket = { count: number; errorCount: number };
  const perDelivery = new Map<string, DeliveryBucket>();

  const deliveryKey = (check: string, conclusion: string, baseBranch: string) =>
    `${check}\0${conclusion}\0${baseBranch}`;

  const isDeliveryFailure = (conclusion: string) =>
    conclusion === 'failure' || conclusion === 'cancelled' || conclusion === 'timed_out';

  try {
    const raw = readFileSync(path, 'utf8');
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      eventCount += 1;
      let ev: Record<string, unknown>;
      try {
        ev = JSON.parse(line) as Record<string, unknown>;
      } catch {
        continue;
      }
      if (ev.kind === 'provider.chat') {
        const provider =
          typeof ev.provider === 'string' && ev.provider.trim() ? ev.provider.trim() : 'unknown';
        let bucket = per.get(provider);
        if (!bucket) {
          bucket = emptyTotals();
          per.set(provider, bucket);
        }
        total.count += 1;
        bucket.count += 1;
        if (ev.ok === false) {
          total.errorCount += 1;
          bucket.errorCount += 1;
        }
        const usage = ev.usage as ChatUsage | undefined;
        addUsage(total, usage);
        addUsage(bucket, usage);
        continue;
      }
      if (ev.kind === 'agent.execution') {
        const agent = typeof ev.agent === 'string' && ev.agent.trim() ? ev.agent.trim() : 'unknown';
        let bucket = perAgent.get(agent);
        if (!bucket) {
          bucket = { count: 0, errorCount: 0, successCount: 0, count7d: 0 };
          perAgent.set(agent, bucket);
        }
        agentTotal.count += 1;
        bucket.count += 1;
        const outcome = typeof ev.outcome === 'string' ? ev.outcome : '';
        const ok = outcome === 'success' || (ev.ok === true && outcome !== 'failure');
        if (ok) {
          bucket.successCount += 1;
        } else {
          agentTotal.errorCount += 1;
          bucket.errorCount += 1;
        }
        const at = typeof ev.at === 'string' ? ev.at : undefined;
        if (at && (!bucket.lastAt || at > bucket.lastAt)) {
          bucket.lastAt = at;
        }
        const atMs = at ? Date.parse(at) : Number.NaN;
        if (Number.isFinite(atMs) && nowMs - atMs <= window7dMs && nowMs - atMs >= 0) {
          bucket.count7d += 1;
        }
        continue;
      }
      if (ev.kind === 'delivery.ci') {
        const check = typeof ev.check === 'string' && ev.check.trim() ? ev.check.trim() : 'unknown';
        const conclusion =
          typeof ev.conclusion === 'string' && ev.conclusion.trim()
            ? ev.conclusion.trim().toLowerCase()
            : 'unknown';
        const baseBranch =
          typeof ev.baseBranch === 'string' && ev.baseBranch.trim()
            ? ev.baseBranch.trim()
            : 'unknown';
        const key = deliveryKey(check, conclusion, baseBranch);
        let bucket = perDelivery.get(key);
        if (!bucket) {
          bucket = { count: 0, errorCount: 0 };
          perDelivery.set(key, bucket);
        }
        deliveryTotal.count += 1;
        bucket.count += 1;
        if (isDeliveryFailure(conclusion)) {
          deliveryTotal.errorCount += 1;
          bucket.errorCount += 1;
        }
      }
    }
  } catch {
    return { path, eventCount: 0, byProvider: [] };
  }

  const byProvider = [...per.entries()]
    .map(([provider, t]) => ({ provider, ...t }))
    .sort((a, b) => a.provider.localeCompare(b.provider));

  const maxExecutionsSeen = Math.max(1, ...[...perAgent.values()].map((b) => b.count), 1);
  const byAgent = [...perAgent.entries()]
    .map(([agent, b]) => ({
      agent,
      count: b.count,
      errorCount: b.errorCount,
      count7d: b.count7d,
      lastAt: b.lastAt,
      healthScore: computeAgentHealthScore({
        successCount: b.successCount,
        totalCount: b.count,
        lastAt: b.lastAt,
        maxExecutionsSeen,
        nowMs,
      }),
    }))
    .sort((a, b) => a.agent.localeCompare(b.agent));

  const byCheck = [...perDelivery.entries()]
    .map(([key, b]) => {
      const [check, conclusion, baseBranch] = key.split('\0');
      return {
        check: check || 'unknown',
        conclusion: conclusion || 'unknown',
        baseBranch: baseBranch || 'unknown',
        count: b.count,
        errorCount: b.errorCount,
      };
    })
    .sort((a, b) =>
      `${a.baseBranch}:${a.check}:${a.conclusion}`.localeCompare(
        `${b.baseBranch}:${b.check}:${b.conclusion}`
      )
    );

  return {
    path,
    eventCount,
    providerChat: total.count > 0 ? total : undefined,
    byProvider,
    agentExecution:
      agentTotal.count > 0
        ? {
            count: agentTotal.count,
            errorCount: agentTotal.errorCount,
            byAgent,
          }
        : undefined,
    deliveryCi:
      deliveryTotal.count > 0
        ? {
            count: deliveryTotal.count,
            errorCount: deliveryTotal.errorCount,
            byCheck,
          }
        : undefined,
  };
}

function promLine(name: string, value: number, labels?: Record<string, string>): string {
  if (!labels || Object.keys(labels).length === 0) {
    return `${name} ${value}`;
  }
  const parts = Object.entries(labels)
    .map(([k, v]) => `${k}="${escapePromLabel(v)}"`)
    .join(',');
  return `${name}{${parts}} ${value}`;
}

/**
 * Render Prometheus text exposition (0.0.4) from local metrics JSONL.
 */
export function renderPrometheusMetrics(options: { homePath?: string } = {}): string {
  const snap = loadMetricsSnapshot(options);
  const out: string[] = [];

  out.push('# HELP aios_contract_version Pipeline contract version gauge.');
  out.push('# TYPE aios_contract_version gauge');
  out.push(
    promLine('aios_contract_version', Number(PIPELINE_CONTRACT_VERSION) || 1, {
      component: 'aios',
    })
  );

  out.push('# HELP aios_metrics_events_total Lines present in .aios/metrics/events.jsonl.');
  out.push('# TYPE aios_metrics_events_total gauge');
  out.push(promLine('aios_metrics_events_total', snap.eventCount));

  out.push('# HELP aios_provider_chat_requests_total Provider chat attempts recorded in JSONL.');
  out.push('# TYPE aios_provider_chat_requests_total counter');
  if (snap.byProvider.length === 0) {
    out.push(promLine('aios_provider_chat_requests_total', 0));
  } else {
    for (const row of snap.byProvider) {
      out.push(
        promLine('aios_provider_chat_requests_total', row.count, {
          provider: row.provider,
        })
      );
    }
  }

  out.push('# HELP aios_provider_chat_errors_total Provider chat failures recorded in JSONL.');
  out.push('# TYPE aios_provider_chat_errors_total counter');
  if (snap.byProvider.length === 0) {
    out.push(promLine('aios_provider_chat_errors_total', 0));
  } else {
    for (const row of snap.byProvider) {
      out.push(
        promLine('aios_provider_chat_errors_total', row.errorCount, {
          provider: row.provider,
        })
      );
    }
  }

  out.push('# HELP aios_provider_chat_prompt_tokens_total Prompt tokens from provider.chat usage.');
  out.push('# TYPE aios_provider_chat_prompt_tokens_total counter');
  if (snap.byProvider.length === 0) {
    out.push(promLine('aios_provider_chat_prompt_tokens_total', 0));
  } else {
    for (const row of snap.byProvider) {
      out.push(
        promLine('aios_provider_chat_prompt_tokens_total', row.promptTokens, {
          provider: row.provider,
        })
      );
    }
  }

  out.push(
    '# HELP aios_provider_chat_completion_tokens_total Completion tokens from provider.chat usage.'
  );
  out.push('# TYPE aios_provider_chat_completion_tokens_total counter');
  if (snap.byProvider.length === 0) {
    out.push(promLine('aios_provider_chat_completion_tokens_total', 0));
  } else {
    for (const row of snap.byProvider) {
      out.push(
        promLine('aios_provider_chat_completion_tokens_total', row.completionTokens, {
          provider: row.provider,
        })
      );
    }
  }

  out.push('# HELP aios_provider_chat_tokens_total Total tokens from provider.chat usage.');
  out.push('# TYPE aios_provider_chat_tokens_total counter');
  if (snap.byProvider.length === 0) {
    out.push(promLine('aios_provider_chat_tokens_total', 0));
  } else {
    for (const row of snap.byProvider) {
      out.push(
        promLine('aios_provider_chat_tokens_total', row.totalTokens, {
          provider: row.provider,
        })
      );
    }
  }

  if (snap.agentExecution) {
    out.push('# HELP aios_agent_execution_total Agent plugin executions (JSONL agent.execution)');
    out.push('# TYPE aios_agent_execution_total counter');
    out.push(promLine('aios_agent_execution_total', snap.agentExecution.count));
    out.push('# HELP aios_agent_execution_errors_total Failed agent.execution outcomes');
    out.push('# TYPE aios_agent_execution_errors_total counter');
    out.push(promLine('aios_agent_execution_errors_total', snap.agentExecution.errorCount));
    for (const row of snap.agentExecution.byAgent) {
      out.push(promLine('aios_agent_execution_by_agent_total', row.count, { agent: row.agent }));
      out.push(promLine('aios_agent_health_score', row.healthScore, { agent: row.agent }));
    }
  }

  if (snap.deliveryCi) {
    out.push(
      '# HELP aios_delivery_ci_total GitHub check conclusions indexed as delivery.ci JSONL.'
    );
    out.push('# TYPE aios_delivery_ci_total counter');
    if (snap.deliveryCi.byCheck.length === 0) {
      out.push(promLine('aios_delivery_ci_total', 0));
    } else {
      for (const row of snap.deliveryCi.byCheck) {
        out.push(
          promLine('aios_delivery_ci_total', row.count, {
            check: row.check,
            conclusion: String(row.conclusion),
            base_branch: row.baseBranch,
          })
        );
      }
    }
    out.push(
      '# HELP aios_delivery_ci_errors_total delivery.ci rows with failure-like conclusions.'
    );
    out.push('# TYPE aios_delivery_ci_errors_total counter');
    out.push(promLine('aios_delivery_ci_errors_total', snap.deliveryCi.errorCount));
  }

  return `${out.join('\n')}\n`;
}

/** Append JSONL metric (Prometheus scrape via renderPrometheusMetrics — ADR-0021). */
export function recordMetricEvent(
  event: Record<string, unknown>,
  options: { homePath?: string } = {}
): string {
  const home = resolve(options.homePath || process.env.AIOS_HOME || process.cwd());
  const file = metricsPath(home);
  mkdirSync(join(home, '.aios', 'metrics'), { recursive: true });
  const line = JSON.stringify({
    ...event,
    at: event.at || new Date().toISOString(),
  });
  appendFileSync(file, `${line}\n`, 'utf8');
  return file;
}

/** Record a single provider chat attempt (`kind: provider.chat`). */
export function recordProviderChatMetric(
  input: ProviderChatMetricInput,
  options: { homePath?: string } = {}
): string {
  return recordMetricEvent(
    {
      kind: 'provider.chat',
      provider: input.provider,
      model: input.model || undefined,
      ok: input.ok,
      latencyMs: input.latencyMs,
      usage: input.usage,
      error: input.error,
      source: input.source,
    },
    options
  );
}

/** Record a single agent plugin run (`kind: agent.execution`) — Phase 5b / #217. */
export function recordAgentExecution(
  input: AgentExecutionMetricInput,
  options: { homePath?: string } = {}
): string {
  const ok = input.outcome === 'success';
  return recordMetricEvent(
    {
      kind: 'agent.execution',
      agent: input.agent,
      version: input.version || undefined,
      outcome: input.outcome,
      ok,
      durationMs: input.durationMs,
      source: input.source,
    },
    options
  );
}

/** Record a GitHub CI check conclusion (`kind: delivery.ci`) — ADR-0028. */
export function recordDeliveryCiMetric(
  input: DeliveryCiMetricInput,
  options: { homePath?: string } = {}
): string {
  return recordMetricEvent(
    {
      kind: 'delivery.ci',
      check: input.check,
      conclusion: String(input.conclusion).toLowerCase(),
      baseBranch: input.baseBranch,
      pr: input.pr,
      runId: input.runId,
      commit: input.commit,
      url: input.url,
      source: input.source || 'local',
    },
    options
  );
}

/**
 * Chat via AIProvider and append a consumption event (MCP/CLI entrypoint).
 */
export async function chatWithMetrics(options: {
  providerId?: string;
  baseUrl?: string;
  request: ChatRequest;
  homePath?: string;
  source?: string;
}): Promise<ChatResponse> {
  const providerId = options.providerId || 'ollama';
  const started = Date.now();
  const p = getProvider(providerId, { baseUrl: options.baseUrl });
  try {
    const out = await p.chat(options.request);
    const latencyMs = out.latencyMs ?? Date.now() - started;
    recordProviderChatMetric(
      {
        provider: out.provider,
        model: out.model,
        ok: true,
        latencyMs,
        usage: out.usage,
        source: options.source,
      },
      { homePath: options.homePath }
    );
    return { ...out, latencyMs };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    recordProviderChatMetric(
      {
        provider: providerId,
        model: options.request.model,
        ok: false,
        latencyMs: Date.now() - started,
        error: message.slice(0, 200),
        source: options.source,
      },
      { homePath: options.homePath }
    );
    throw err;
  }
}

function buildAttention(parts: {
  workspaces: GovernanceStatus['workspaces'];
  policies: GovernanceStatus['policies'];
  provider: GovernanceStatus['provider'];
  memoryIds: string[];
  providerChat?: ProviderChatSummary;
  agentExecution?: NonNullable<GovernanceStatus['metrics']['agentExecution']>;
  eventCount: number;
  governanceFindings?: AttentionItem[];
}): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (!parts.provider.ok) {
    items.push({
      id: 'provider-down',
      severity: 'warn',
      title: `Provider ${parts.provider.provider} inactive (optional)`,
      detail:
        parts.provider.error ||
        `No response at ${parts.provider.baseUrl}. Optional local helper — do not install only to turn the console green (resource-aware). IDE/MCP AIOS still work.`,
    });
  }

  if (parts.workspaces.length === 0) {
    items.push({
      id: 'no-workspaces',
      severity: 'warn',
      title: 'No workspaces registered',
      detail: 'Add entries in workspaces/aios.workspaces.json.',
    });
  }

  for (const w of parts.workspaces) {
    if (!w.ok) {
      items.push({
        id: `workspace-bad-${w.id}`,
        severity: 'error',
        title: `Workspace \`${w.id}\` invalid`,
        detail: w.signals.join('; ') || w.repoPath,
      });
    }
  }

  if (parts.policies.mustIds.length === 0) {
    items.push({
      id: 'no-must-policies',
      severity: 'warn',
      title: 'No must policies',
      detail: 'Load policies/aios.policies.json or platform defaults.',
    });
  }

  const registered = new Set(parts.workspaces.map((w) => w.id));
  const withMemory = parts.memoryIds.filter((id) => registered.has(id));
  if (parts.workspaces.length > 0 && withMemory.length === 0) {
    items.push({
      id: 'no-memory',
      severity: 'info',
      title: 'Empty memory on workspaces',
      detail: 'Nothing in .aios/memory — normal on a fresh environment.',
    });
  }

  if (!parts.providerChat) {
    items.push({
      id: 'metrics-stub',
      severity: 'info',
      title: 'No provider.chat consumption events yet',
      detail:
        'Run aios_provider_chat or CLI --provider-chat to append .aios/metrics/events.jsonl. Scrape console GET /metrics or `aios --metrics-prometheus` (ADR-0021).',
    });
  } else if (parts.providerChat.errorCount > 0) {
    items.push({
      id: 'provider-chat-errors',
      severity: 'warn',
      title: `Provider chat errors (${parts.providerChat.errorCount}/${parts.providerChat.count})`,
      detail: `See ${parts.eventCount} metric event(s) in .aios/metrics/events.jsonl.`,
    });
  }

  if (parts.agentExecution && parts.agentExecution.errorCount > 0) {
    items.push({
      id: 'agent-execution-errors',
      severity: 'warn',
      title: `Agent execution failures (${parts.agentExecution.errorCount}/${parts.agentExecution.count})`,
      detail: 'See kind: agent.execution rows in .aios/metrics/events.jsonl (Phase 5b).',
    });
  }

  // Governance v2 signals (#121) — skip duplicates already covered above
  const skipGov = new Set(['gov-no-must', 'gov-no-decisions']);
  for (const f of parts.governanceFindings || []) {
    if (skipGov.has(f.id)) continue;
    if (f.severity === 'info' && f.id === 'gov-unknown-kind') continue;
    items.push(f);
  }

  const rank = { error: 0, warn: 1, info: 2 } as const;
  return items.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

/** Join Agent Registry entries with local agent.execution metrics (CLI/MCP/console). */
export async function buildAgentCatalog(options: {
  homePath: string;
  agentExecution?: MetricsSnapshot['agentExecution'];
}): Promise<AgentCatalogEntry[]> {
  const registry = new AgentRegistry({
    registryPath: join(options.homePath, '.aios', 'agents.registry.json'),
  });
  const listed = await registry.listAgents();
  const healthByAgent = new Map(
    (options.agentExecution?.byAgent ?? []).map((row) => [row.agent, row])
  );
  return listed
    .map((entry) => {
      const metrics = healthByAgent.get(entry.manifest.name);
      const row: AgentCatalogEntry = {
        name: entry.manifest.name,
        version: entry.manifest.version,
        source: entry.source,
      };
      if (entry.manifest.displayName) row.displayName = entry.manifest.displayName;
      if (typeof metrics?.healthScore === 'number') row.healthScore = metrics.healthScore;
      if (typeof metrics?.count === 'number') row.executions = metrics.count;
      if (typeof metrics?.count7d === 'number' && metrics.count7d > 0) {
        row.executions7d = metrics.count7d;
      }
      return row;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getGovernanceStatus(
  options: GetGovernanceStatusOptions = {}
): Promise<GovernanceStatus> {
  const homePath = resolve(options.homePath || process.env.AIOS_HOME || process.cwd());

  const validated = listValidatedWorkspaces({ cwd: homePath });
  const workspaces = validated.map((w) => ({
    id: w.id,
    name: w.name,
    repoPath: w.repoPath,
    ok: w.validation.ok,
    signals: w.validation.signals,
  }));

  const bundle = loadPolicies({ cwd: homePath });
  const applied = applyPolicies(bundle.rules);
  const policies = {
    source: bundle.source,
    path: bundle.path,
    count: bundle.rules.length,
    mustIds: applied.mustIds,
  };

  const provider =
    options.providerHealth || (await getProvider(options.providerId || 'ollama').health());

  const memoryIds = listMemoryWorkspaces({ homePath });
  const metricsSnap = loadMetricsSnapshot({ homePath });
  const providerChat = metricsSnap.providerChat;
  const agentExecution = metricsSnap.agentExecution;
  const metricsAvailable =
    Boolean(providerChat) || Boolean(agentExecution) || metricsSnap.eventCount > 0;

  // Quick governance audit (no docs walk) — Resource-Aware (#121)
  const govAudit = auditGovernance({
    homePath,
    repoPath: homePath,
    includeDocumentation: false,
    decisionLimit: 20,
  });

  const attention = buildAttention({
    workspaces,
    policies,
    provider,
    memoryIds,
    providerChat,
    agentExecution,
    eventCount: metricsSnap.eventCount,
    governanceFindings: govAudit.findings,
  });

  let note: string;
  if (providerChat && agentExecution) {
    note = `provider.chat: ${providerChat.count}; agent.execution: ${agentExecution.count} (JSONL; scrape GET /metrics).`;
  } else if (providerChat) {
    note = `provider.chat: ${providerChat.count} call(s), ~${providerChat.totalTokens} tokens (JSONL; scrape GET /metrics).`;
  } else if (agentExecution) {
    note = `agent.execution: ${agentExecution.count} run(s) across ${agentExecution.byAgent.length} agent(s).`;
  } else if (metricsSnap.eventCount > 0) {
    note = 'Local JSONL events present; no provider.chat / agent.execution rows yet.';
  } else {
    note = 'No consumption events — use chatWithMetrics / aios_provider_chat (ADR-0019).';
  }

  const agents = await buildAgentCatalog({ homePath, agentExecution });

  return {
    generatedAt: new Date().toISOString(),
    contractVersion: PIPELINE_CONTRACT_VERSION,
    homePath,
    workspaces,
    policies,
    provider,
    memory: { workspaceIds: memoryIds },
    exposed: {
      mcpTools: [...MCP_TOOL_CATALOG],
      mcpToolPrivileges: { ...MCP_TOOL_PRIVILEGE },
      providers: listProviderIds(),
    },
    agents,
    attention,
    metrics: {
      available: metricsAvailable,
      note,
      eventCount: metricsSnap.eventCount,
      path: metricsSnap.path,
      providerChat,
      agentExecution,
    },
  };
}
