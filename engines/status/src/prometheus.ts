/**
 * Prometheus text exposition from local JSONL metrics (#130 / ADR-0021).
 * Classic exposition format 0.0.4 — scrape on demand; no Grafana install.
 * Spec: https://prometheus.io/docs/instrumenting/exposition_formats/
 */
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { PIPELINE_CONTRACT_VERSION, type ChatUsage } from '@aios/shared'

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

function metricsPath(homePath: string): string {
  return join(homePath, '.aios', 'metrics', 'events.jsonl')
}

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

function line(
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
    line('aios_contract_version', Number(PIPELINE_CONTRACT_VERSION) || 1, {
      component: 'aios',
    }),
  )

  out.push(
    '# HELP aios_metrics_events_total Lines present in .aios/metrics/events.jsonl.',
  )
  out.push('# TYPE aios_metrics_events_total gauge')
  out.push(line('aios_metrics_events_total', snap.eventCount))

  out.push(
    '# HELP aios_provider_chat_requests_total Provider chat attempts recorded in JSONL.',
  )
  out.push('# TYPE aios_provider_chat_requests_total counter')
  if (snap.byProvider.length === 0) {
    out.push(line('aios_provider_chat_requests_total', 0))
  } else {
    for (const row of snap.byProvider) {
      out.push(
        line('aios_provider_chat_requests_total', row.count, {
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
    out.push(line('aios_provider_chat_errors_total', 0))
  } else {
    for (const row of snap.byProvider) {
      out.push(
        line('aios_provider_chat_errors_total', row.errorCount, {
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
    out.push(line('aios_provider_chat_prompt_tokens_total', 0))
  } else {
    for (const row of snap.byProvider) {
      out.push(
        line('aios_provider_chat_prompt_tokens_total', row.promptTokens, {
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
    out.push(line('aios_provider_chat_completion_tokens_total', 0))
  } else {
    for (const row of snap.byProvider) {
      out.push(
        line('aios_provider_chat_completion_tokens_total', row.completionTokens, {
          provider: row.provider,
        }),
      )
    }
  }

  out.push(
    '# HELP aios_provider_chat_tokens_total Total tokens from provider.chat usage.',
  )
  out.push('# TYPE aios_provider_chat_tokens_total counter')
  if (snap.byProvider.length === 0) {
    out.push(line('aios_provider_chat_tokens_total', 0))
  } else {
    for (const row of snap.byProvider) {
      out.push(
        line('aios_provider_chat_tokens_total', row.totalTokens, {
          provider: row.provider,
        }),
      )
    }
  }

  return `${out.join('\n')}\n`
}

/** Content-Type for classic Prometheus text exposition. */
export const PROMETHEUS_CONTENT_TYPE =
  'text/plain; version=0.0.4; charset=utf-8'
