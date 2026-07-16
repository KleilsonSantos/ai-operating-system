import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { auditGovernance, listDecisions, recordDecision } from './index.ts'

const temps: string[] = []

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('governance', () => {
  it('record + list decisions', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-gov-'))
    temps.push(root)
    const entry = recordDecision(
      { kind: 'policy', summary: 'aceitou resource-first', verdict: 'pass' },
      { homePath: root },
    )
    expect(entry.id).toBeTruthy()
    const listed = listDecisions({ homePath: root, limit: 5 })
    expect(listed.decisions).toHaveLength(1)
    expect(listed.decisions[0]?.summary).toMatch(/resource-first/)
  })

  it('auditGovernance sem docs errors em fixture mínimo', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-gov-a-'))
    temps.push(root)
    writeFileSync(join(root, 'README.md'), '#')
    writeFileSync(join(root, 'CHANGELOG.md'), '#')
    writeFileSync(join(root, 'AGENTS.md'), '#')
    mkdirSync(join(root, 'docs', 'architecture'), { recursive: true })
    mkdirSync(join(root, 'docs', 'adr'), { recursive: true })
    writeFileSync(join(root, 'docs', 'FOUNDATION.md'), '#')
    writeFileSync(join(root, 'docs', 'VISION.md'), '#')
    writeFileSync(join(root, 'docs', 'ROADMAP.md'), '#')
    writeFileSync(join(root, 'docs', 'architecture', 'overview.md'), '#')
    writeFileSync(join(root, 'docs', 'architecture', 'system-guide.md'), '#')
    for (const a of [
      '0001-standalone-platform.md',
      '0002-git-branching-strategy.md',
      '0003-pipeline-integration-contract.md',
    ]) {
      writeFileSync(join(root, 'docs', 'adr', a), '#')
    }
    mkdirSync(join(root, 'policies'))
    writeFileSync(
      join(root, 'policies', 'aios.policies.json'),
      JSON.stringify({
        policies: [{ id: 'resource-first', description: 'r', severity: 'must' }],
      }),
    )
    mkdirSync(join(root, 'engines', 'documentation'), { recursive: true })
    mkdirSync(join(root, 'engines', 'governance'), { recursive: true })

    const audit = auditGovernance({
      homePath: root,
      repoPath: root,
      includeDocumentation: true,
    })
    expect(audit.policies.mustIds).toContain('resource-first')
    expect(audit.documentation?.ok).toBe(true)
    expect(audit.ok).toBe(true)
  })
})
