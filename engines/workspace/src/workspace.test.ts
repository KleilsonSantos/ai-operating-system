import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import {
  loadWorkspaces,
  resolveWorkspace,
  resolveWorkspacePath,
} from './index.ts'

const temps: string[] = []

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function fixtureHome(): string {
  const root = mkdtempSync(join(tmpdir(), 'aios-ws-'))
  temps.push(root)
  mkdirSync(join(root, 'workspaces'))
  mkdirSync(join(root, 'project-a'))
  writeFileSync(join(root, 'project-a', 'README.md'), '# A\n')
  writeFileSync(
    join(root, 'workspaces', 'aios.workspaces.json'),
    JSON.stringify({
      workspaces: [
        {
          id: 'alpha',
          name: 'Project A',
          path: 'project-a',
          default: true,
        },
        {
          id: 'beta',
          path: join(root, 'project-a'),
        },
      ],
    }),
  )
  return root
}

describe('loadWorkspaces', () => {
  it('carrega registry em workspaces/', () => {
    const home = fixtureHome()
    const bundle = loadWorkspaces({ cwd: home })
    expect(bundle.source).toBe('file')
    expect(bundle.workspaces).toHaveLength(2)
    expect(bundle.workspaces[0]!.id).toBe('alpha')
  })

  it('vazio sem arquivo', () => {
    const root = mkdtempSync(join(tmpdir(), 'aios-ws-empty-'))
    temps.push(root)
    const bundle = loadWorkspaces({ cwd: root })
    expect(bundle.source).toBe('empty')
    expect(bundle.workspaces).toEqual([])
  })
})

describe('resolveWorkspace', () => {
  it('resolve id e path relativo vs raíz do monorepo', () => {
    const home = fixtureHome()
    const resolved = resolveWorkspace('alpha', { cwd: home })
    expect(resolved?.entry.id).toBe('alpha')
    expect(resolved?.repoPath).toBe(join(home, 'project-a'))
  })

  it('usa default quando id omitido', () => {
    const home = fixtureHome()
    const resolved = resolveWorkspace(undefined, { cwd: home })
    expect(resolved?.entry.id).toBe('alpha')
  })

  it('falha com id desconhecido', () => {
    const home = fixtureHome()
    expect(() => resolveWorkspace('nope', { cwd: home })).toThrow(
      /workspace not found/,
    )
  })
})

describe('resolveWorkspacePath', () => {
  it('mantém absoluto', () => {
    const abs = join(tmpdir(), 'x')
    expect(resolveWorkspacePath({ id: 'x', path: abs })).toBe(abs)
  })
})
