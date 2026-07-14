import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { buildKnowledgeGraph, summarizeKnowledge } from './index.ts'

const temps: string[] = []

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function fixtureRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 'aios-kg-'))
  temps.push(root)
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({ name: 'kg-fixture', private: true }),
  )
  writeFileSync(join(root, 'README.md'), '# Fixture\n')
  mkdirSync(join(root, 'docs'))
  writeFileSync(join(root, 'docs', 'FOUNDATION.md'), '# F\n')
  mkdirSync(join(root, 'engines', 'policy'), { recursive: true })
  writeFileSync(
    join(root, 'engines', 'policy', 'package.json'),
    JSON.stringify({ name: '@aios/policy', private: true }),
  )
  mkdirSync(join(root, 'packages', 'shared'), { recursive: true })
  writeFileSync(
    join(root, 'packages', 'shared', 'package.json'),
    JSON.stringify({ name: '@aios/shared', private: true }),
  )
  writeFileSync(
    join(root, 'engines', 'policy', 'package.json'),
    JSON.stringify({
      name: '@aios/policy',
      private: true,
      dependencies: { '@aios/shared': 'workspace:*' },
    }),
  )
  return root
}

describe('buildKnowledgeGraph', () => {
  it('monta projeto + docs + engines/packages', () => {
    const repo = fixtureRepo()
    const g = buildKnowledgeGraph({ repoPath: repo })
    expect(g.nodes.some((n) => n.kind === 'project')).toBe(true)
    expect(g.nodes.some((n) => n.kind === 'doc')).toBe(true)
    expect(g.nodes.some((n) => n.kind === 'engine')).toBe(true)
    expect(g.edges.some((e) => e.kind === 'contains')).toBe(true)
    expect(g.edges.some((e) => e.kind === 'depends_on')).toBe(true)
    const sum = summarizeKnowledge(g)
    expect(sum.nodeCount).toBeGreaterThan(3)
    expect(sum.edgeCount).toBeGreaterThan(2)
  })
})
