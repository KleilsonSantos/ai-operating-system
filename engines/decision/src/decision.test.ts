import { describe, expect, it } from 'vitest'
import { agentsForIntent, shouldRunAgent } from '../src/index.ts'

describe('shouldRunAgent', () => {
  it('analyze.project agenda os quatro', () => {
    expect(agentsForIntent('analyze.project')).toEqual([
      'architecture',
      'appsec',
      'docs',
      'qa',
    ])
    expect(shouldRunAgent('docs', 'analyze.project')).toBe(true)
  })

  it('explain.code pula appsec e qa', () => {
    expect(shouldRunAgent('architecture', 'explain.code')).toBe(true)
    expect(shouldRunAgent('docs', 'explain.code')).toBe(true)
    expect(shouldRunAgent('appsec', 'explain.code')).toBe(false)
    expect(shouldRunAgent('qa', 'explain.code')).toBe(false)
  })

  it('review.change pula docs', () => {
    expect(shouldRunAgent('docs', 'review.change')).toBe(false)
    expect(shouldRunAgent('appsec', 'review.change')).toBe(true)
  })

  it('unknown não agenda ninguém', () => {
    expect(agentsForIntent('unknown')).toEqual([])
    expect(shouldRunAgent('architecture', 'unknown')).toBe(false)
  })

  it('implement.feature agenda os quatro', () => {
    expect(agentsForIntent('implement.feature')).toEqual([
      'architecture',
      'appsec',
      'docs',
      'qa',
    ])
  })

  it('fix.bug pula docs', () => {
    expect(shouldRunAgent('docs', 'fix.bug')).toBe(false)
    expect(shouldRunAgent('appsec', 'fix.bug')).toBe(true)
    expect(shouldRunAgent('qa', 'fix.bug')).toBe(true)
  })
})
