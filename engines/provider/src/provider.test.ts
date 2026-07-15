import { afterEach, describe, expect, it, vi } from 'vitest'
import { OllamaProvider, getProvider, listProviderIds } from './index.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('listProviderIds / getProvider', () => {
  it('lista ollama e resolve por nome', () => {
    expect(listProviderIds()).toContain('ollama')
    const p = getProvider('ollama', { baseUrl: 'http://example.test' })
    expect(p.id).toBe('ollama')
  })

  it('rejeita provider desconhecido', () => {
    expect(() => getProvider('openai')).toThrow(/Unknown provider/)
  })
})

describe('OllamaProvider', () => {
  it('health ok quando /api/tags responde', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        models: [{ name: 'llama3.2:latest', size: 1 }],
      }),
    )
    const p = new OllamaProvider({
      baseUrl: 'http://127.0.0.1:11434',
      fetch: fetchMock as typeof fetch,
    })
    const h = await p.health()
    expect(h.ok).toBe(true)
    expect(h.models).toEqual(['llama3.2:latest'])
    expect(fetchMock).toHaveBeenCalled()
  })

  it('health falha com fetch error', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('ECONNREFUSED')
    })
    const p = new OllamaProvider({
      fetch: fetchMock as typeof fetch,
    })
    const h = await p.health()
    expect(h.ok).toBe(false)
    expect(h.error).toMatch(/ECONNREFUSED/)
  })

  it('chat envia stream:false e devolve message', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        stream: boolean
        model: string
        messages: unknown[]
      }
      expect(body.stream).toBe(false)
      expect(body.model).toBe('qwen2.5')
      expect(body.messages).toHaveLength(1)
      return Response.json({
        model: 'qwen2.5',
        message: { role: 'assistant', content: '2' },
        done: true,
      })
    })
    const p = new OllamaProvider({
      fetch: fetchMock as typeof fetch,
      defaultModel: 'llama3.2',
    })
    const out = await p.chat({
      model: 'qwen2.5',
      messages: [{ role: 'user', content: '1+1?' }],
    })
    expect(out.provider).toBe('ollama')
    expect(out.message.content).toBe('2')
  })
})
