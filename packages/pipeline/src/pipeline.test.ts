import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { runPipeline, PIPELINE_CONTRACT_VERSION } from '../src/index.ts'

const temps: string[] = []

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function fixtureRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 'aios-pipe-'))
  temps.push(root)
  mkdirSync(join(root, '.git'))
  writeFileSync(join(root, 'README.md'), '# Pipe fixture\n')
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({ name: 'pipe-fixture', private: true }),
  )
  return root
}

describe('runPipeline', () => {
  it('responde contrato v1 para analyze', async () => {
    const repo = fixtureRepo()
    const res = await runPipeline({
      input: 'Analise meu projeto.',
      repoPath: repo,
    })
    expect(res.contractVersion).toBe(PIPELINE_CONTRACT_VERSION)
    expect(res.intent.kind).toBe('analyze.project')
    expect(res.workflow.ran.length).toBeGreaterThan(0)
    expect(res.verdict.checks).toBeDefined()
    expect(res.context.snippetCount).toBeGreaterThan(0)
  })

  it('unknown não agenda plugins', async () => {
    const repo = fixtureRepo()
    const res = await runPipeline({ input: 'olá', repoPath: repo })
    expect(res.intent.kind).toBe('unknown')
    expect(res.workflow.ran).toEqual([])
    expect(res.verdict.passed).toBe(true)
  })

  it('resolve workspaceId do registry', async () => {
    const home = mkdtempSync(join(tmpdir(), 'aios-pipe-ws-'))
    temps.push(home)
    const target = join(home, 'target')
    mkdirSync(target)
    mkdirSync(join(target, '.git'))
    writeFileSync(join(target, 'README.md'), '# Target\n')
    writeFileSync(
      join(target, 'package.json'),
      JSON.stringify({ name: 'ws-target', private: true }),
    )
    mkdirSync(join(home, 'workspaces'))
    writeFileSync(
      join(home, 'workspaces', 'aios.workspaces.json'),
      JSON.stringify({
        workspaces: [{ id: 'target', path: 'target', default: true }],
      }),
    )
    const prev = process.env.AIOS_HOME
    process.env.AIOS_HOME = home
    try {
      const res = await runPipeline({
        input: 'Analise meu projeto.',
        workspaceId: 'target',
      })
      expect(res.workspace?.id).toBe('target')
      expect(res.context.repoPath).toBe(target)
      expect(res.verdict.passed).toBe(true)
    } finally {
      if (prev === undefined) delete process.env.AIOS_HOME
      else process.env.AIOS_HOME = prev
    }
  })
})
