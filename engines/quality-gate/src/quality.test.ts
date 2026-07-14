import { describe, expect, it } from 'vitest'
import { evaluateQuality } from '../src/index.ts'
import type { AgentResult, ContextBundle, Intent } from '@aios/shared'

const intentAnalyze: Intent = {
  raw: 'Analise',
  kind: 'analyze.project',
  confidence: 0.9,
  signals: [],
}

const ctx: ContextBundle = {
  repoPath: '/tmp',
  scope: '.',
  snippets: [
    { path: 'README.md', kind: 'doc', content: '# x', bytes: 3 },
  ],
  signals: [],
}

function okAgent(id: string, extra: string[] = []): AgentResult {
  return {
    agentId: id,
    ok: true,
    findings: ['policies.injected', `domain:${id}`, ...extra],
    references: [],
  }
}

describe('evaluateQuality', () => {
  it('passa analyze completo com contexto', () => {
    const results = [
      okAgent('architecture'),
      okAgent('appsec'),
      okAgent('docs'),
      okAgent('qa'),
    ]
    const v = evaluateQuality(results, { intent: intentAnalyze, context: ctx })
    expect(v.passed).toBe(true)
    expect(v.blockers).toEqual([])
  })

  it('bloqueia analyze sem contexto', () => {
    const results = [
      okAgent('architecture'),
      okAgent('appsec'),
      okAgent('docs'),
      okAgent('qa'),
    ]
    const v = evaluateQuality(results, {
      intent: intentAnalyze,
      context: { ...ctx, snippets: [] },
    })
    expect(v.passed).toBe(false)
    expect(v.blockers).toContain('contextPresent')
  })

  it('bloqueia agent faltando na matriz', () => {
    const results = [okAgent('architecture'), okAgent('docs')]
    const v = evaluateQuality(results, { intent: intentAnalyze, context: ctx })
    expect(v.passed).toBe(false)
    expect(v.blockers).toContain('agentsScheduled')
  })

  it('unknown com zero agents passa', () => {
    const v = evaluateQuality([], {
      intent: {
        raw: 'oi',
        kind: 'unknown',
        confidence: 0.1,
        signals: [],
      },
    })
    expect(v.passed).toBe(true)
  })

  it('bloqueia agent ok:false', () => {
    const results = [
      { ...okAgent('architecture'), ok: false },
      okAgent('appsec'),
      okAgent('docs'),
      okAgent('qa'),
    ]
    const v = evaluateQuality(results, { intent: intentAnalyze, context: ctx })
    expect(v.blockers).toContain('agentsOk')
  })
})
