import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import {
  auditDocumentation,
  parsePkbFrontmatter,
  parsePkbIndexPaths,
  searchPkb,
} from './index.ts'

const temps: string[] = []

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('parsePkbIndexPaths', () => {
  it('extracts path entries from index.yaml shape', () => {
    const yaml = `
version: 1
prompts:
  - id: a
    path: by-domain/a/x.v1.md
  - id: b
    path: by-domain/b/y.v1.md
`
    expect(parsePkbIndexPaths(yaml)).toEqual([
      'by-domain/a/x.v1.md',
      'by-domain/b/y.v1.md',
    ])
  })
})

describe('parsePkbFrontmatter', () => {
  it('reads scalar fields and tag list', () => {
    const raw = `---
id: prompt.demo.x
title: Demo prompt
domain: documentation
purpose: Test search
tags:
  - documentation
  - readme
status: active
language: en
---
# Body here
`
    const { meta, body } = parsePkbFrontmatter(raw)
    expect(meta.id).toBe('prompt.demo.x')
    expect(meta.domain).toBe('documentation')
    expect(meta.tags).toEqual(['documentation', 'readme'])
    expect(body).toContain('Body here')
  })
})

describe('searchPkb', () => {
  function seedRepo(): string {
    const root = mkdtempSync(join(tmpdir(), 'aios-pkb-search-'))
    temps.push(root)
    mkdirSync(join(root, 'docs', 'prompts', 'by-domain', 'documentation'), {
      recursive: true,
    })
    mkdirSync(join(root, 'docs', 'prompts', 'by-domain', 'knowledge'), {
      recursive: true,
    })
    writeFileSync(
      join(
        root,
        'docs',
        'prompts',
        'by-domain',
        'documentation',
        'readme-audit.v1.md',
      ),
      `---
id: prompt.documentation.readme
title: README audit
domain: documentation
purpose: Audit README structure
tags:
  - documentation
  - readme
status: active
---
# README audit body
`,
    )
    writeFileSync(
      join(
        root,
        'docs',
        'prompts',
        'by-domain',
        'knowledge',
        'kb-evolution.v1.md',
      ),
      `---
id: prompt.knowledge.kb
title: Knowledge base evolution
domain: knowledge
purpose: Evolve project KB
tags:
  - knowledge
  - architecture
status: active
---
# Knowledge body with RAG mention
`,
    )
    return root
  }

  it('returns empty without filters', () => {
    const root = seedRepo()
    const out = searchPkb({ repoPath: root })
    expect(out.count).toBe(0)
  })

  it('filters by domain', () => {
    const root = seedRepo()
    const out = searchPkb({ repoPath: root, domain: 'documentation' })
    expect(out.count).toBe(1)
    expect(out.hits[0]?.id).toBe('prompt.documentation.readme')
  })

  it('filters by tags (all required)', () => {
    const root = seedRepo()
    const out = searchPkb({
      repoPath: root,
      tags: ['documentation', 'readme'],
    })
    expect(out.count).toBe(1)
    expect(out.hits[0]?.path).toContain('readme-audit')
  })

  it('matches free-text query in body', () => {
    const root = seedRepo()
    const out = searchPkb({ repoPath: root, query: 'RAG' })
    expect(out.count).toBe(1)
    expect(out.hits[0]?.matches).toContain('body')
  })
})

describe('auditDocumentation', () => {
  it('reporta gaps num repo vazio', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-docs-'))
    temps.push(root)
    const audit = auditDocumentation({ repoPath: root })
    expect(audit.ok).toBe(false)
    expect(audit.missing.length).toBeGreaterThan(0)
    expect(audit.findings.some((f) => f.severity === 'error')).toBe(true)
    expect(audit.findings.some((f) => f.id.startsWith('pkb-missing-'))).toBe(
      true,
    )
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
    mkdirSync(join(root, 'docs', 'prompts', 'by-domain', 'demo'), {
      recursive: true,
    })
    writeFileSync(join(root, 'docs', 'prompts', 'README.md'), '# pkb')
    writeFileSync(join(root, 'docs', 'prompts', 'VISION.md'), '# vision')
    writeFileSync(
      join(root, 'docs', 'prompts', 'index.yaml'),
      `version: 1\nprompts:\n  - id: demo\n    path: by-domain/demo/asset.v1.md\n`,
    )
    writeFileSync(
      join(root, 'docs', 'prompts', 'by-domain', 'demo', 'asset.v1.md'),
      '# asset',
    )
    writeFileSync(
      join(root, 'docs', 'prompts', 'by-domain', 'demo', 'orphan.v1.md'),
      '# orphan',
    )

    const audit = auditDocumentation({ repoPath: root })
    expect(audit.ok).toBe(true)
    expect(audit.missing).toHaveLength(0)
    expect(audit.findings.some((f) => f.id === 'pkb-index-count')).toBe(true)
    expect(audit.findings.some((f) => f.id === 'pkb-orphan-assets')).toBe(true)
  })

  it('warns when index path is missing on disk', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-docs-pkb-'))
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
    mkdirSync(join(root, 'docs', 'prompts'), { recursive: true })
    writeFileSync(join(root, 'docs', 'prompts', 'README.md'), '# pkb')
    writeFileSync(join(root, 'docs', 'prompts', 'VISION.md'), '# vision')
    writeFileSync(
      join(root, 'docs', 'prompts', 'index.yaml'),
      `version: 1\nprompts:\n  - id: ghost\n    path: by-domain/ghost/missing.v1.md\n`,
    )

    const audit = auditDocumentation({ repoPath: root })
    expect(audit.ok).toBe(true)
    expect(
      audit.findings.some((f) => f.id.includes('pkb-index-missing')),
    ).toBe(true)
  })
})
