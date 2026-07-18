import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import {
  escapePromLabel,
  loadMetricsSnapshot,
  renderPrometheusMetrics,
} from './prometheus.ts'
import { recordProviderChatMetric } from './index.ts'

const temps: string[] = []

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('prometheus metrics', () => {
  it('escapePromLabel escapes quotes and backslashes', () => {
    expect(escapePromLabel('a"b\\c')).toBe('a\\"b\\\\c')
  })

  it('renders empty snapshot with zero counters', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-prom-empty-'))
    temps.push(root)
    writeFileSync(join(root, 'package.json'), '{"name":"x"}')
    const text = renderPrometheusMetrics({ homePath: root })
    expect(text).toContain('# TYPE aios_provider_chat_requests_total counter')
    expect(text).toContain('aios_provider_chat_requests_total 0')
    expect(text).toContain('aios_metrics_events_total 0')
  })

  it('aggregates provider.chat by provider label', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-prom-'))
    temps.push(root)
    writeFileSync(join(root, 'package.json'), '{"name":"x"}')
    recordProviderChatMetric(
      {
        provider: 'ollama',
        ok: true,
        usage: { promptTokens: 2, completionTokens: 3, totalTokens: 5 },
      },
      { homePath: root },
    )
    recordProviderChatMetric(
      {
        provider: 'openai',
        ok: false,
        error: 'nope',
        usage: { promptTokens: 1, completionTokens: 0, totalTokens: 1 },
      },
      { homePath: root },
    )
    const snap = loadMetricsSnapshot({ homePath: root })
    expect(snap.eventCount).toBe(2)
    expect(snap.providerChat).toEqual({
      count: 2,
      errorCount: 1,
      promptTokens: 3,
      completionTokens: 3,
      totalTokens: 6,
    })
    const text = renderPrometheusMetrics({ homePath: root })
    expect(text).toContain(
      'aios_provider_chat_requests_total{provider="ollama"} 1',
    )
    expect(text).toContain(
      'aios_provider_chat_requests_total{provider="openai"} 1',
    )
    expect(text).toContain(
      'aios_provider_chat_errors_total{provider="openai"} 1',
    )
    expect(text).toContain(
      'aios_provider_chat_tokens_total{provider="ollama"} 5',
    )
  })
})
