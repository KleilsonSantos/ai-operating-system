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
})
