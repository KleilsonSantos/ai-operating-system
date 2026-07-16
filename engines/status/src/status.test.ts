import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { getGovernanceStatus, recordMetricEvent } from './index.ts'

const temps: string[] = []

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('getGovernanceStatus', () => {
  it('monta attention para provider down e workspace ok', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-status-'))
    temps.push(root)
    writeFileSync(join(root, 'package.json'), '{"name":"aios"}')
    mkdirSync(join(root, 'workspaces'))
    writeFileSync(
      join(root, 'workspaces', 'aios.workspaces.json'),
      JSON.stringify({
        workspaces: [{ id: 'aios', path: '.', name: 'AIOS', default: true }],
      }),
    )
    mkdirSync(join(root, 'policies'))
    writeFileSync(
      join(root, 'policies', 'aios.policies.json'),
      JSON.stringify({
        policies: [
          { id: 'official-docs', description: 'docs', severity: 'must' },
        ],
      }),
    )

    const status = await getGovernanceStatus({
      homePath: root,
      providerHealth: {
        provider: 'ollama',
        ok: false,
        baseUrl: 'http://127.0.0.1:11434',
        error: 'ECONNREFUSED',
      },
    })

    expect(status.contractVersion).toBe('1')
    expect(status.workspaces[0]?.ok).toBe(true)
    expect(status.policies.mustIds).toContain('official-docs')
    expect(status.attention.some((a) => a.id === 'provider-down')).toBe(true)
    expect(status.attention.some((a) => a.id === 'metrics-stub')).toBe(true)
    expect(status.exposed.mcpTools.length).toBeGreaterThan(5)
  })

  it('recordMetricEvent remove stub de métricas vazias', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-status-m-'))
    temps.push(root)
    writeFileSync(join(root, 'package.json'), '{"name":"x"}')
    recordMetricEvent({ kind: 'test', n: 1 }, { homePath: root })
    const status = await getGovernanceStatus({
      homePath: root,
      providerHealth: {
        provider: 'ollama',
        ok: true,
        baseUrl: 'http://127.0.0.1:11434',
        models: ['llama'],
      },
    })
    expect(status.metrics.available).toBe(true)
    expect(status.metrics.eventCount).toBe(1)
    expect(status.attention.some((a) => a.id === 'metrics-stub')).toBe(false)
  })
})
