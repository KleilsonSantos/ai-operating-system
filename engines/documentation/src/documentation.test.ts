import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { auditDocumentation } from './index.ts'

const temps: string[] = []

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('auditDocumentation', () => {
  it('reporta gaps num repo vazio', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-docs-'))
    temps.push(root)
    const audit = auditDocumentation({ repoPath: root })
    expect(audit.ok).toBe(false)
    expect(audit.missing.length).toBeGreaterThan(0)
    expect(audit.findings.some((f) => f.severity === 'error')).toBe(true)
  })

  it('ok parcial com docs mínimas', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-docs-ok-'))
    temps.push(root)
    writeFileSync(join(root, 'README.md'), '# x')
    writeFileSync(join(root, 'CHANGELOG.md'), '# c')
    writeFileSync(join(root, 'AGENTS.md'), '# a')
    mkdirSync(join(root, 'docs', 'architecture'), { recursive: true })
    mkdirSync(join(root, 'docs', 'adr'), { recursive: true })
    writeFileSync(join(root, 'docs', 'FOUNDATION.md'), '# f')
    writeFileSync(join(root, 'docs', 'VISION.md'), '# v')
    writeFileSync(join(root, 'docs', 'ROADMAP.md'), '# r')
    writeFileSync(join(root, 'docs', 'architecture', 'overview.md'), '# o')
    writeFileSync(join(root, 'docs', 'architecture', 'system-guide.md'), '# s')
    writeFileSync(
      join(root, 'docs', 'adr', '0001-standalone-platform.md'),
      '# adr',
    )
    writeFileSync(
      join(root, 'docs', 'adr', '0002-git-branching-strategy.md'),
      '# adr',
    )
    writeFileSync(
      join(root, 'docs', 'adr', '0003-pipeline-integration-contract.md'),
      '# adr',
    )
    mkdirSync(join(root, 'policies'))
    writeFileSync(join(root, 'policies', 'aios.policies.json'), '{"policies":[]}')
    mkdirSync(join(root, 'engines', 'documentation'), { recursive: true })
    mkdirSync(join(root, 'engines', 'governance'), { recursive: true })

    const audit = auditDocumentation({ repoPath: root })
    expect(audit.ok).toBe(true)
    expect(audit.missing).toHaveLength(0)
  })
})
