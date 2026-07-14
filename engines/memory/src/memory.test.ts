import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import {
  remember,
  recall,
  clearMemory,
  listMemoryWorkspaces,
} from './index.ts'

const temps: string[] = []

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('memory', () => {
  it('remember + recall + clear', () => {
    const home = mkdtempSync(join(tmpdir(), 'aios-mem-'))
    temps.push(home)
    const opts = { homePath: home }
    const a = remember('aios', 'Prefer sandbox PRs', {
      ...opts,
      tags: ['git'],
    })
    remember('aios', 'MCP uses absolute node path', opts)
    const r = recall('aios', { ...opts, limit: 5 })
    expect(r.entries).toHaveLength(2)
    expect(r.entries[0]!.content).toContain('MCP')
    expect(a.id).toBeTruthy()
    const tagged = recall('aios', { ...opts, tag: 'git' })
    expect(tagged.entries).toHaveLength(1)
    expect(listMemoryWorkspaces(opts)).toContain('aios')
    expect(clearMemory('aios', opts)).toBe(true)
    expect(recall('aios', opts).entries).toHaveLength(0)
  })
})
