import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  rmSync,
} from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { gatherContext } from '../src/index.ts'

const temps: string[] = []

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'aios-ctx-'))
  temps.push(root)
  // marcar como "repo"
  mkdirSync(join(root, '.git'))
  writeFileSync(join(root, 'README.md'), '# Fixture\n\nHello context.')
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({ name: 'fixture', private: true }),
  )
  mkdirSync(join(root, 'docs'))
  writeFileSync(join(root, 'docs', 'FOUNDATION.md'), '# Pedra\n\nPolicy > prompts.')
  mkdirSync(join(root, 'engines', 'demo', 'src'), { recursive: true })
  writeFileSync(
    join(root, 'engines', 'demo', 'src', 'index.ts'),
    'export const demo = 1\n',
  )
  writeFileSync(
    join(root, 'engines', 'demo', 'README.md'),
    '# Demo engine\n',
  )
  return root
}

describe('gatherContext', () => {
  it('coleta docs e manifests na raiz', () => {
    const root = fixtureRoot()
    const bundle = gatherContext({ repoPath: root })
    expect(bundle.repoPath).toBe(root)
    expect(bundle.scope).toBe('.')
    expect(bundle.snippets.length).toBeGreaterThan(0)
    const paths = bundle.snippets.map((s) => s.path)
    expect(paths).toContain('README.md')
    expect(paths).toContain('docs/FOUNDATION.md')
    expect(paths).toContain('package.json')
    expect(bundle.signals.some((s) => s.startsWith('snippets:'))).toBe(true)
  })

  it('respeita escopo por path', () => {
    const root = fixtureRoot()
    const bundle = gatherContext({
      repoPath: root,
      scope: 'engines/demo',
    })
    expect(bundle.scope).toBe('engines/demo')
    const paths = bundle.snippets.map((s) => s.path)
    expect(paths.some((p) => p.startsWith('engines/demo/'))).toBe(true)
    expect(paths).toContain('engines/demo/src/index.ts')
    // âncora da raiz ainda entra
    expect(paths).toContain('README.md')
  })

  it('scope inexistente → snippets vazios + sinal', () => {
    const root = fixtureRoot()
    const bundle = gatherContext({
      repoPath: root,
      scope: 'does/not/exist',
    })
    expect(bundle.snippets).toEqual([])
    expect(bundle.signals).toContain('scope-missing')
  })

  it('API string compatível', () => {
    const root = fixtureRoot()
    const bundle = gatherContext(root)
    expect(bundle.snippets.length).toBeGreaterThan(0)
  })

  it('trunca arquivos grandes', () => {
    const root = fixtureRoot()
    writeFileSync(join(root, 'BIG.md'), 'x'.repeat(20_000))
    const bundle = gatherContext({
      repoPath: root,
      maxBytesPerFile: 100,
      maxSnippets: 20,
    })
    const big = bundle.snippets.find((s) => s.path === 'BIG.md')
    expect(big).toBeDefined()
    expect(big!.content).toContain('[truncated]')
    expect(big!.bytes).toBeLessThanOrEqual(120)
  })

  it('ignora node_modules', () => {
    const root = fixtureRoot()
    mkdirSync(join(root, 'node_modules', 'fake'), { recursive: true })
    writeFileSync(join(root, 'node_modules', 'fake', 'index.js'), 'secret')
    const bundle = gatherContext({ repoPath: root, maxSnippets: 50 })
    expect(bundle.snippets.every((s) => !s.path.includes('node_modules'))).toBe(
      true,
    )
  })
})
