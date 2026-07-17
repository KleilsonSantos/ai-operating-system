import { describe, expect, it } from 'vitest'
import { formatConsumptionChip } from './ui/consumption.ts'

describe('formatConsumptionChip', () => {
  it('shows empty state when no provider.chat', () => {
    expect(
      formatConsumptionChip({
        available: false,
        note: 'none',
      }),
    ).toEqual({ tone: '', label: 'no chat events' })
  })

  it('summarizes providerChat totals', () => {
    expect(
      formatConsumptionChip({
        available: true,
        note: 'ok',
        eventCount: 2,
        providerChat: {
          count: 2,
          errorCount: 0,
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
      }),
    ).toEqual({ tone: 'ok', label: '2 chat · ~15 tok' })
  })

  it('marks errors as bad tone', () => {
    const out = formatConsumptionChip({
      available: true,
      note: 'x',
      providerChat: {
        count: 3,
        errorCount: 1,
        promptTokens: 1,
        completionTokens: 1,
        totalTokens: 2,
      },
    })
    expect(out.tone).toBe('bad')
    expect(out.label).toContain('1 err')
  })
})
