import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  OllamaProvider,
  OpenAICompatibleProvider,
  AnthropicProvider,
  getProvider,
  listProviderIds,
} from './index.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('listProviderIds / getProvider', () => {
  it('lista ollama, openai e anthropic', () => {
    expect(listProviderIds()).toContain('ollama');
    expect(listProviderIds()).toContain('openai');
    expect(listProviderIds()).toContain('anthropic');
    const p = getProvider('ollama', { baseUrl: 'http://example.test' });
    expect(p.id).toBe('ollama');
    expect(getProvider('openai').id).toBe('openai');
    expect(getProvider('anthropic').id).toBe('anthropic');
  });

  it('rejeita provider desconhecido', () => {
    expect(() => getProvider('cohere')).toThrow(/Unknown provider/);
  });
});

describe('OllamaProvider', () => {
  it('health ok quando /api/tags responde', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        models: [{ name: 'llama3.2:latest', size: 1 }],
      })
    );
    const p = new OllamaProvider({
      baseUrl: 'http://127.0.0.1:11434',
      fetch: fetchMock as typeof fetch,
    });
    const h = await p.health();
    expect(h.ok).toBe(true);
    expect(h.models).toEqual(['llama3.2:latest']);
    expect(fetchMock).toHaveBeenCalled();
  });

  it('health falha com fetch error', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    });
    const p = new OllamaProvider({
      fetch: fetchMock as typeof fetch,
    });
    const h = await p.health();
    expect(h.ok).toBe(false);
    expect(h.error).toMatch(/ECONNREFUSED/);
  });

  it('chat envia stream:false e devolve message', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        stream: boolean;
        model: string;
        messages: unknown[];
      };
      expect(body.stream).toBe(false);
      expect(body.model).toBe('qwen2.5');
      expect(body.messages).toHaveLength(1);
      return Response.json({
        model: 'qwen2.5',
        message: { role: 'assistant', content: '2' },
        done: true,
      });
    });
    const p = new OllamaProvider({
      fetch: fetchMock as typeof fetch,
      defaultModel: 'llama3.2',
    });
    const out = await p.chat({
      model: 'qwen2.5',
      messages: [{ role: 'user', content: '1+1?' }],
    });
    expect(out.provider).toBe('ollama');
    expect(out.message.content).toBe('2');
  });
});

describe('OpenAICompatibleProvider', () => {
  it('health DOWN sem API key (sem rede)', async () => {
    const p = new OpenAICompatibleProvider({
      apiKey: '',
      fetch: vi.fn() as unknown as typeof fetch,
    });
    const h = await p.health();
    expect(h.ok).toBe(false);
    expect(h.error).toMatch(/API key missing/);
  });

  it('health ok com /models', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(String(url)).toMatch(/\/models$/);
      expect(String((init?.headers as Record<string, string>)?.Authorization)).toMatch(
        /Bearer sk-test/
      );
      return Response.json({
        data: [{ id: 'gpt-4o-mini' }, { id: 'gpt-4o' }],
      });
    });
    const p = new OpenAICompatibleProvider({
      apiKey: 'sk-test',
      baseUrl: 'https://api.openai.com/v1',
      fetch: fetchMock as typeof fetch,
    });
    const h = await p.health();
    expect(h.ok).toBe(true);
    expect(h.models).toEqual(['gpt-4o-mini', 'gpt-4o']);
  });

  it('chat POST /chat/completions', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(String(url)).toMatch(/\/chat\/completions$/);
      const body = JSON.parse(String(init?.body)) as {
        model: string;
        messages: unknown[];
      };
      expect(body.model).toBe('gpt-4o-mini');
      expect(body.messages).toHaveLength(1);
      return Response.json({
        model: 'gpt-4o-mini',
        choices: [{ message: { role: 'assistant', content: 'hello' } }],
        usage: {
          prompt_tokens: 2,
          completion_tokens: 1,
          total_tokens: 3,
        },
      });
    });
    const p = new OpenAICompatibleProvider({
      apiKey: 'sk-test',
      fetch: fetchMock as typeof fetch,
    });
    const out = await p.chat({
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(out.provider).toBe('openai');
    expect(out.message.content).toBe('hello');
    expect(out.usage).toEqual({
      promptTokens: 2,
      completionTokens: 1,
      totalTokens: 3,
    });
    expect(out.latencyMs).toBeTypeOf('number');
  });
});

describe('AnthropicProvider', () => {
  it('health DOWN sem API key', async () => {
    const p = new AnthropicProvider({
      apiKey: '',
      fetch: vi.fn() as unknown as typeof fetch,
    });
    const h = await p.health();
    expect(h.ok).toBe(false);
    expect(h.error).toMatch(/API key missing/);
  });

  it('health ok com /v1/models', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(String(url)).toMatch(/\/v1\/models$/);
      const headers = init?.headers as Record<string, string>;
      expect(headers['x-api-key']).toBe('sk-ant-test');
      expect(headers['anthropic-version']).toBe('2023-06-01');
      return Response.json({
        data: [{ id: 'claude-haiku-4-5' }, { id: 'claude-sonnet-4-6' }],
      });
    });
    const p = new AnthropicProvider({
      apiKey: 'sk-ant-test',
      fetch: fetchMock as typeof fetch,
    });
    const h = await p.health();
    expect(h.ok).toBe(true);
    expect(h.models).toEqual(['claude-haiku-4-5', 'claude-sonnet-4-6']);
  });

  it('chat POST /v1/messages com system separado', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(String(url)).toMatch(/\/v1\/messages$/);
      const body = JSON.parse(String(init?.body)) as {
        model: string;
        max_tokens: number;
        system?: string;
        messages: Array<{ role: string; content: string }>;
      };
      expect(body.max_tokens).toBe(1024);
      expect(body.system).toBe('be brief');
      expect(body.messages).toEqual([{ role: 'user', content: 'hi' }]);
      return Response.json({
        model: 'claude-haiku-4-5',
        content: [{ type: 'text', text: 'hello' }],
        usage: { input_tokens: 8, output_tokens: 2 },
      });
    });
    const p = new AnthropicProvider({
      apiKey: 'sk-ant-test',
      fetch: fetchMock as typeof fetch,
    });
    const out = await p.chat({
      messages: [
        { role: 'system', content: 'be brief' },
        { role: 'user', content: 'hi' },
      ],
    });
    expect(out.provider).toBe('anthropic');
    expect(out.message.content).toBe('hello');
    expect(out.usage).toEqual({
      promptTokens: 8,
      completionTokens: 2,
      totalTokens: 10,
    });
  });
});
