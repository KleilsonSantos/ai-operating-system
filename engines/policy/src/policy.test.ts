import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_POLICIES,
  applyPolicies,
  formatConstraints,
  loadPolicies,
  mergePolicies,
} from '../src/index.ts'
import type { PolicyRule } from '@aios/shared'

const temps: string[] = []

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'aios-policy-'))
  temps.push(dir)
  return dir
}

describe('loadPolicies', () => {
  it('retorna defaults sem arquivo', () => {
    const dir = tempDir()
    const bundle = loadPolicies({ cwd: dir })
    expect(bundle.source).toBe('defaults')
    expect(bundle.rules).toEqual(DEFAULT_POLICIES)
    expect(bundle.rules.map((r) => r.id)).toContain('official-docs')
  })

  it('carrega JSON em policies/aios.policies.json e faz merge', () => {
    const dir = tempDir()
    const policiesDir = join(dir, 'policies')
    mkdirSync(policiesDir)
    writeFileSync(
      join(policiesDir, 'aios.policies.json'),
      JSON.stringify({
        policies: [
          {
            id: 'official-docs',
            description: 'Consultar docs oficiais (override)',
            severity: 'must',
          },
          {
            id: 'no-hallucination',
            description: 'Não inventar APIs inexistentes',
            severity: 'should',
          },
        ],
      }),
    )

    const bundle = loadPolicies({ cwd: dir })
    expect(bundle.source).toBe('merged')
    expect(bundle.path).toContain('aios.policies.json')
    const official = bundle.rules.find((r) => r.id === 'official-docs')
    expect(official?.description).toContain('override')
    expect(bundle.rules.map((r) => r.id)).toContain('no-hallucination')
    expect(bundle.rules.map((r) => r.id)).toContain('trade-offs')
  })

  it('descobre policies/ subindo diretórios (monorepo)', () => {
    const root = tempDir()
    mkdirSync(join(root, 'policies'))
    writeFileSync(
      join(root, 'policies', 'aios.policies.json'),
      JSON.stringify([
        { id: 'from-root', description: 'via walk-up', severity: 'should' },
      ]),
    )
    const nested = join(root, 'apps', 'cli')
    mkdirSync(nested, { recursive: true })

    const bundle = loadPolicies({ cwd: nested, mergeDefaults: false })
    expect(bundle.source).toBe('file')
    expect(bundle.rules[0]?.id).toBe('from-root')
  })

  it('respeita configPath explícito sem merge', () => {
    const dir = tempDir()
    const file = join(dir, 'custom.json')
    const only: PolicyRule[] = [
      { id: 'custom', description: 'Only custom', severity: 'may' },
    ]
    writeFileSync(file, JSON.stringify(only))

    const bundle = loadPolicies({
      configPath: file,
      mergeDefaults: false,
    })
    expect(bundle.source).toBe('file')
    expect(bundle.rules).toEqual(only)
  })

  it('rejeita severity inválida', () => {
    const dir = tempDir()
    const file = join(dir, 'bad.json')
    writeFileSync(
      file,
      JSON.stringify([{ id: 'x', description: 'y', severity: 'nope' }]),
    )
    expect(() =>
      loadPolicies({ configPath: file, mergeDefaults: false }),
    ).toThrow(/severity/)
  })
})

describe('mergePolicies', () => {
  it('overlay substitui por id', () => {
    const base: PolicyRule[] = [
      { id: 'a', description: 'base', severity: 'must' },
      { id: 'b', description: 'keep', severity: 'should' },
    ]
    const overlay: PolicyRule[] = [
      { id: 'a', description: 'new', severity: 'may' },
    ]
    expect(mergePolicies(base, overlay)).toEqual([
      { id: 'b', description: 'keep', severity: 'should' },
      { id: 'a', description: 'new', severity: 'may' },
    ])
  })
})

describe('applyPolicies', () => {
  it('produz constraints e mustIds', () => {
    const applied = applyPolicies(DEFAULT_POLICIES)
    expect(applied.mustIds).toContain('trade-offs')
    expect(applied.constraints).toContain('AIOS policies')
    expect(applied.constraints).toContain('[must] trade-offs')
  })

  it('formatConstraints vazio', () => {
    expect(formatConstraints([])).toBe('')
  })
})
