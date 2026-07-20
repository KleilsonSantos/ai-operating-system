/**
 * Status Engine — health + needs attention for the console (#71).
 * Provider chat consumption: local JSONL metrics (#115 / ADR-0019).
 * Prometheus text export: #130 / ADR-0021 (ADR-0010 layer 2).
 * Spec: https://prometheus.io/docs/instrumenting/exposition_formats/
 */
import { existsSync, mkdirSync, appendFileSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  PIPELINE_CONTRACT_VERSION,
  type AttentionItem,
  type ChatRequest,
  type ChatResponse,
  type ChatUsage,
  type GovernanceStatus,
} from '@aios/shared'
import { listValidatedWorkspaces } from '@aios/workspace'
import { loadPolicies, applyPolicies } from '@aios/policy'
import { listMemoryWorkspaces } from '@aios/memory'
import { getProvider, listProviderIds } from '@aios/provider'
import { auditGovernance } from '@aios/governance'

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
  'aios_governance_status',
  'aios_audit_docs',
  'aios_search_pkb',
  'aios_governance_audit',
  'aios_governance_record',
  'aios_operational_state',
] as const

export type GetGovernanceStatusOptions = {
  homePath?: string
  providerId?: string
  /** Skip live provider check (tests) */
  providerHealth?: GovernanceStatus['provider']
}

export type ProviderChatMetricInput = {
  provider: string
  model?: string
  ok: boolean
  latencyMs?: number
  usage?: ChatUsage
  error?: string
  source?: string
}

export type ProviderChatTotals = {
  count: number
  errorCount: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export type ProviderChatByProvider = ProviderChatTotals & {
  provider: string
}

export type MetricsSnapshot = {
  path: string
  eventCount: number
  providerChat?: ProviderChatTotals
  byProvider: ProviderChatByProvider[]
}

/** Content-Type for classic Prometheus text exposition. */
export const PROMETHEUS_CONTENT_TYPE =
  'text/plain; version=0.0.4; charset=utf-8'

function metricsPath(homePath: string): string {
  return join(homePath, '.aios', 'metrics', 'events.jsonl')
}

type ProviderChatSummary = NonNullable<
  GovernanceStatus['metrics']['providerChat']
>

function emptyTotals(): ProviderChatTotals {
  return {
    count: 0,
    errorCount: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  }
}

function addUsage(into: ProviderChatTotals, usage: ChatUsage | undefined): void {
  if (usage?.promptTokens) into.promptTokens += usage.promptTokens
  if (usage?.completionTokens) into.completionTokens += usage.completionTokens
  if (usage?.totalTokens) {
    into.totalTokens += usage.totalTokens
  } else if (usage?.promptTokens || usage?.completionTokens) {
    into.totalTokens += (usage.promptTokens || 0) + (usage.completionTokens || 0)
  }
}

/** Escape a label value for Prometheus text format. */
export function escapePromLabel(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"')
}

/**
 * Read `.aios/metrics/events.jsonl` once (Resource-Aware).
 */
export function loadMetricsSnapshot(
  options: { homePath?: string } = {},
): MetricsSnapshot {
  const home = resolve(options.homePath || process.env.AIOS_HOME || process.cwd())
  const path = metricsPath(home)
  if (!existsSync(path)) {
    return { path, eventCount: 0, byProvider: [] }
  }

  let eventCount = 0
  const total = emptyTotals()
  const per = new Map<string, ProviderChatTotals>()

  try {
    const raw = readFileSync(path, 'utf8')
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue
      eventCount += 1
      let ev: Record<string, unknown>
      try {
        ev = JSON.parse(line) as Record<string, unknown>
      } catch {
        continue
      }
      if (ev.kind !== 'provider.chat') continue
      const provider =
        typeof ev.provider === 'string' && ev.provider.trim()
          ? ev.provider.trim()
          : 'unknown'
      let bucket = per.get(provider)
      if (!bucket) {
        bucket = emptyTotals()
        per.set(provider, bucket)
      }
      total.count += 1
      bucket.count += 1
      if (ev.ok === false) {
        total.errorCount += 1
        bucket.errorCount += 1
      }
      const usage = ev.usage as ChatUsage | undefined
      addUsage(total, usage)
      addUsage(bucket, usage)
    }
  } catch {
    return { path, eventCount: 0, byProvider: [] }
  }

  const byProvider = [...per.entries()]
    .map(([provider, t]) => ({ provider, ...t }))
    .sort((a, b) => a.provider.localeCompare(b.provider))

  return {
    path,
    eventCount,
    providerChat: total.count > 0 ? total : undefined,
    byProvider,
  }
}

function promLine(
  name: string,
  value: number,
  labels?: Record<string, string>,
): string {
  if (!labels || Object.keys(labels).length === 0) {
    return `${name} ${value}`
  }
  const parts = Object.entries(labels)
    .map(([k, v]) => `${k}="${escapePromLabel(v)}"`)
    .join(',')
  return `${name}{${parts}} ${value}`
}

/**
 * Render Prometheus text exposition (0.0.4) from local metrics JSONL.
 */
export function renderPrometheusMetrics(
  options: { homePath?: string } = {},
): string {
  const snap = loadMetricsSnapshot(options)
  const out: string[] = []

  out.push('# HELP aios_contract_version Pipeline contract version gauge.')
  out.push('# TYPE aios_contract_version gauge')
  out.push(
    promLine('aios_contract_version', Number(PIPELINE_CONTRACT_VERSION) || 1, {
      component: 'aios',
    }),
  )

  out.push(
    '# HELP aios_metrics_events_total Lines present in .aios/metrics/events.jsonl.',
  )
  out.push('# TYPE aios_metrics_events_total gauge')
  out.push(promLine('aios_metrics_events_total', snap.eventCount))

  out.push(
    '# HELP aios_provider_chat_requests_total Provider chat attempts recorded in JSONL.',
  )
  out.push('# TYPE aios_provider_chat_requests_total counter')
  if (snap.byProvider.length === 0) {
    out.push(promLine('aios_provider_chat_requests_total', 0))
  } else {
    for (const row of snap.byProvider) {
      out.push(
        promLine('aios_provider_chat_requests_total', row.count, {
          provider: row.provider,
        }),
      )
    }
  }

  out.push(
    '# HELP aios_provider_chat_errors_total Provider chat failures recorded in JSONL.',
  )
  out.push('# TYPE aios_provider_chat_errors_total counter')
  if (snap.byProvider.length === 0) {
    out.push(promLine('aios_provider_chat_errors_total', 0))
  } else {
    for (const row of snap.byProvider) {
      out.push(
        promLine('aios_provider_chat_errors_total', row.errorCount, {
          provider: row.provider,
        }),
      )
    }
  }

  out.push(
    '# HELP aios_provider_chat_prompt_tokens_total Prompt tokens from provider.chat usage.',
  )
  out.push('# TYPE aios_provider_chat_prompt_tokens_total counter')
  if (snap.byProvider.length === 0) {
    out.push(promLine('aios_provider_chat_prompt_tokens_total', 0))
  } else {
    for (const row of snap.byProvider) {
      out.push(
        promLine('aios_provider_chat_prompt_tokens_total', row.promptTokens, {
          provider: row.provider,
        }),
      )
    }
  }

  out.push(
    '# HELP aios_provider_chat_completion_tokens_total Completion tokens from provider.chat usage.',
  )
  out.push('# TYPE aios_provider_chat_completion_tokens_total counter')
  if (snap.byProvider.length === 0) {
    out.push(promLine('aios_provider_chat_completion_tokens_total', 0))
  } else {
    for (const row of snap.byProvider) {
      out.push(
        promLine(
          'aios_provider_chat_completion_tokens_total',
          row.completionTokens,
          { provider: row.provider },
        ),
      )
    }
  }

  out.push(
    '# HELP aios_provider_chat_tokens_total Total tokens from provider.chat usage.',
  )
  out.push('# TYPE aios_provider_chat_tokens_total counter')
  if (snap.byProvider.length === 0) {
    out.push(promLine('aios_provider_chat_tokens_total', 0))
  } else {
    for (const row of snap.byProvider) {
      out.push(
        promLine('aios_provider_chat_tokens_total', row.totalTokens, {
          provider: row.provider,
        }),
      )
    }
  }

  return `${out.join('\n')}\n`
}

/** Append JSONL metric (Prometheus scrape via renderPrometheusMetrics — ADR-0021). */
export function recordMetricEvent(
  event: Record<string, unknown>,
  options: { homePath?: string } = {},
): string {
  const home = resolve(options.homePath || process.env.AIOS_HOME || process.cwd())
  const file = metricsPath(home)
  mkdirSync(join(home, '.aios', 'metrics'), { recursive: true })
  const line = JSON.stringify({
    ...event,
    at: event.at || new Date().toISOString(),
  })
  appendFileSync(file, `${line}\n`, 'utf8')
  return file
}

/** Record a single provider chat attempt (`kind: provider.chat`). */
export function recordProviderChatMetric(
  input: ProviderChatMetricInput,
  options: { homePath?: string } = {},
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
    options,
  )
}

/**
 * Chat via AIProvider and append a consumption event (MCP/CLI entrypoint).
 */
export async function chatWithMetrics(options: {
  providerId?: string
  baseUrl?: string
  request: ChatRequest
  homePath?: string
  source?: string
}): Promise<ChatResponse> {
  const providerId = options.providerId || 'ollama'
  const started = Date.now()
  const p = getProvider(providerId, { baseUrl: options.baseUrl })
  try {
    const out = await p.chat(options.request)
    const latencyMs = out.latencyMs ?? Date.now() - started
    recordProviderChatMetric(
      {
        provider: out.provider,
        model: out.model,
        ok: true,
        latencyMs,
        usage: out.usage,
        source: options.source,
      },
      { homePath: options.homePath },
    )
    return { ...out, latencyMs }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    recordProviderChatMetric(
      {
        provider: providerId,
        model: options.request.model,
        ok: false,
        latencyMs: Date.now() - started,
        error: message.slice(0, 200),
        source: options.source,
      },
      { homePath: options.homePath },
    )
    throw err
  }
}

function buildAttention(parts: {
  workspaces: GovernanceStatus['workspaces']
  policies: GovernanceStatus['policies']
  provider: GovernanceStatus['provider']
  memoryIds: string[]
  providerChat?: ProviderChatSummary
  eventCount: number
  governanceFindings?: AttentionItem[]
}): AttentionItem[] {
  const items: AttentionItem[] = []

  if (!parts.provider.ok) {
    items.push({
      id: 'provider-down',
      severity: 'warn',
      title: `Provider ${parts.provider.provider} inactive (optional)`,
      detail:
        parts.provider.error ||
        `No response at ${parts.provider.baseUrl}. Optional local helper — do not install only to turn the console green (resource-aware). IDE/MCP AIOS still work.`,
    })
  }

  if (parts.workspaces.length === 0) {
    items.push({
      id: 'no-workspaces',
      severity: 'warn',
      title: 'No workspaces registered',
      detail: 'Add entries in workspaces/aios.workspaces.json.',
    })
  }

  for (const w of parts.workspaces) {
    if (!w.ok) {
      items.push({
        id: `workspace-bad-${w.id}`,
        severity: 'error',
        title: `Workspace \`${w.id}\` invalid`,
        detail: w.signals.join('; ') || w.repoPath,
      })
    }
  }

  if (parts.policies.mustIds.length === 0) {
    items.push({
      id: 'no-must-policies',
      severity: 'warn',
      title: 'No must policies',
      detail: 'Load policies/aios.policies.json or platform defaults.',
    })
  }

  const registered = new Set(parts.workspaces.map((w) => w.id))
  const withMemory = parts.memoryIds.filter((id) => registered.has(id))
  if (parts.workspaces.length > 0 && withMemory.length === 0) {
    items.push({
      id: 'no-memory',
      severity: 'info',
      title: 'Empty memory on workspaces',
      detail: 'Nothing in .aios/memory — normal on a fresh environment.',
    })
  }

  if (!parts.providerChat) {
    items.push({
      id: 'metrics-stub',
      severity: 'info',
      title: 'No provider.chat consumption events yet',
      detail:
        'Run aios_provider_chat or CLI --provider-chat to append .aios/metrics/events.jsonl. Scrape console GET /metrics or `aios --metrics-prometheus` (ADR-0021).',
    })
  } else if (parts.providerChat.errorCount > 0) {
    items.push({
      id: 'provider-chat-errors',
      severity: 'warn',
      title: `Provider chat errors (${parts.providerChat.errorCount}/${parts.providerChat.count})`,
      detail: `See ${parts.eventCount} metric event(s) in .aios/metrics/events.jsonl.`,
    })
  }

  // Governance v2 signals (#121) — skip duplicates already covered above
  const skipGov = new Set(['gov-no-must', 'gov-no-decisions'])
  for (const f of parts.governanceFindings || []) {
    if (skipGov.has(f.id)) continue
    if (f.severity === 'info' && f.id === 'gov-unknown-kind') continue
    items.push(f)
  }

  const rank = { error: 0, warn: 1, info: 2 } as const
  return items.sort((a, b) => rank[a.severity] - rank[b.severity])
}

export async function getGovernanceStatus(
  options: GetGovernanceStatusOptions = {},
): Promise<GovernanceStatus> {
  const homePath = resolve(
    options.homePath || process.env.AIOS_HOME || process.cwd(),
  )

  const validated = listValidatedWorkspaces({ cwd: homePath })
  const workspaces = validated.map((w) => ({
    id: w.id,
    name: w.name,
    repoPath: w.repoPath,
    ok: w.validation.ok,
    signals: w.validation.signals,
  }))

  const bundle = loadPolicies({ cwd: homePath })
  const applied = applyPolicies(bundle.rules)
  const policies = {
    source: bundle.source,
    path: bundle.path,
    count: bundle.rules.length,
    mustIds: applied.mustIds,
  }

  const provider =
    options.providerHealth ||
    (await getProvider(options.providerId || 'ollama').health())

  const memoryIds = listMemoryWorkspaces({ homePath })
  const metricsSnap = loadMetricsSnapshot({ homePath })
  const providerChat = metricsSnap.providerChat
  const metricsAvailable = Boolean(providerChat) || metricsSnap.eventCount > 0

  // Quick governance audit (no docs walk) — Resource-Aware (#121)
  const govAudit = auditGovernance({
    homePath,
    repoPath: homePath,
    includeDocumentation: false,
    decisionLimit: 20,
  })

  const attention = buildAttention({
    workspaces,
    policies,
    provider,
    memoryIds,
    providerChat,
    eventCount: metricsSnap.eventCount,
    governanceFindings: govAudit.findings,
  })

  let note: string
  if (providerChat) {
    note = `provider.chat: ${providerChat.count} call(s), ~${providerChat.totalTokens} tokens (JSONL; scrape GET /metrics).`
  } else if (metricsSnap.eventCount > 0) {
    note = 'Local JSONL events present; no provider.chat rows yet.'
  } else {
    note =
      'No consumption events — use chatWithMetrics / aios_provider_chat (ADR-0019).'
  }

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
      providers: listProviderIds(),
    },
    attention,
    metrics: {
      available: metricsAvailable,
      note,
      eventCount: metricsSnap.eventCount,
      path: metricsSnap.path,
      providerChat,
    },
  }
}
