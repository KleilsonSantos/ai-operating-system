import { describe, expect, it } from 'vitest'
import { resolveIntent, INTENT_KINDS } from '../src/index.ts'

describe('resolveIntent', () => {
  it('classifica análise de projeto', () => {
    const intent = resolveIntent('Analise meu projeto.')
    expect(intent.kind).toBe('analyze.project')
    expect(intent.confidence).toBeGreaterThanOrEqual(0.35)
    expect(intent.signals.length).toBeGreaterThan(0)
  })

  it('classifica explain (pt)', () => {
    const intent = resolveIntent('Explique como funciona este módulo de auth')
    expect(intent.kind).toBe('explain.code')
    expect(intent.confidence).toBeGreaterThanOrEqual(0.35)
  })

  it('classifica review (en)', () => {
    const intent = resolveIntent('Please review this pull request diff')
    expect(intent.kind).toBe('review.change')
    expect(intent.confidence).toBeGreaterThanOrEqual(0.35)
  })

  it('classifica implement.feature (pt)', () => {
    const intent = resolveIntent('Crie um endpoint de health.')
    expect(intent.kind).toBe('implement.feature')
    expect(intent.confidence).toBeGreaterThanOrEqual(0.35)
  })

  it('classifica implement.feature (en)', () => {
    const intent = resolveIntent('Implement a React auth hook')
    expect(intent.kind).toBe('implement.feature')
  })

  it('classifica fix.bug (pt)', () => {
    const intent = resolveIntent('Corrigir o bug no login')
    expect(intent.kind).toBe('fix.bug')
    expect(intent.confidence).toBeGreaterThanOrEqual(0.35)
  })

  it('classifica fix.bug (en)', () => {
    const intent = resolveIntent('Fix the CI error in the pipeline')
    expect(intent.kind).toBe('fix.bug')
  })

  it('retorna unknown para input vazio', () => {
    const intent = resolveIntent('   ')
    expect(intent.kind).toBe('unknown')
    expect(intent.confidence).toBe(0)
    expect(intent.signals).toContain('empty-input')
  })

  it('retorna unknown sem sinais claros', () => {
    const intent = resolveIntent('olá, tudo bem?')
    expect(intent.kind).toBe('unknown')
  })

  it('preserva raw trimado', () => {
    const intent = resolveIntent('  Analise o projeto  ')
    expect(intent.raw).toBe('Analise o projeto')
  })

  it('exporta kinds canônicos', () => {
    expect(INTENT_KINDS).toContain('analyze.project')
    expect(INTENT_KINDS).toContain('explain.code')
    expect(INTENT_KINDS).toContain('review.change')
    expect(INTENT_KINDS).toContain('implement.feature')
    expect(INTENT_KINDS).toContain('fix.bug')
    expect(INTENT_KINDS).toContain('unknown')
  })
})
