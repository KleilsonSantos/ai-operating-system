/**
 * Status Engine — health + needs attention for the console (#71).
 * Provider chat consumption: local JSONL metrics (#115 / ADR-0019).
 * Prometheus text export: #130 / ADR-0021 (ADR-0010 layer 2).
 */
import { mkdirSync, appendFileSync } from 'node:fs'
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
import { loadMetricsSnapshot } from './prometheus.ts'

export {
  escapePromLabel,
  loadMetricsSnapshot,
  renderPrometheusMetrics,
  PROMETHEUS_CONTENT_TYPE,
  type MetricsSnapshot,
  type ProviderChatByProvider,
  type ProviderChatTotals,
} from './prometheus.ts'

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

function metricsPath(homePath: string): string {
  return join(homePath, '.aios', 'metrics', 'events.jsonl')
}

type ProviderChatSummary = NonNullable<
  GovernanceStatus['metrics']['providerChat']
>

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
