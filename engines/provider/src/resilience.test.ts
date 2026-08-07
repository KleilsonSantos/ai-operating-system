import { describe, expect, it, vi } from 'vitest';
import {
  CircuitBreaker,
  isTransientError,
  withRetry,
  ResilientProvider,
  OllamaProvider,
  getProvider,
} from './index.ts';
import type { AIProvider, ChatResponse, ProviderHealth, ProviderModelInfo } from './index.ts';

describe('isTransientError', () => {
  it('detects network and HTTP 5xx / 429', () => {
    expect(isTransientError(new Error('ECONNREFUSED'))).toBe(true);
    expect(isTransientError(new Error('Ollama /api/chat HTTP 503: down'))).toBe(true);
    expect(isTransientError(new Error('OpenAI HTTP 429: rate'))).toBe(true);
    expect(isTransientError(new Error('chat: messages required'))).toBe(false);
    expect(isTransientError(new Error('HTTP 400: bad'))).toBe(false);
  });
});

describe('withRetry', () => {
  it('retries transient failures then succeeds', async () => {
    let n = 0;
    const sleep = vi.fn(async () => undefined);
    const result = await withRetry(
      async () => {
        n += 1;
        if (n < 3) throw new Error('ECONNRESET');
        return 'ok';
      },
      { maxRetries: 2, retryBackoffMs: 10, sleep }
    );
    expect(result).toBe('ok');
    expect(n).toBe(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-transient errors', async () => {
    let n = 0;
    await expect(
      withRetry(
        async () => {
          n += 1;
          throw new Error('HTTP 400: bad request');
        },
        { maxRetries: 3, retryBackoffMs: 1, sleep: async () => undefined }
      )
    ).rejects.toThrow(/400/);
    expect(n).toBe(1);
  });
});

describe('CircuitBreaker', () => {
  it('opens after threshold and blocks until cooldown', () => {
    let now = 1_000;
    const cb = new CircuitBreaker(2, 100, () => now);
    expect(cb.getState()).toBe('closed');
    cb.recordFailure();
    expect(cb.getState()).toBe('closed');
    cb.recordFailure();
    expect(cb.getState()).toBe('open');
    expect(() => cb.assertCanPass()).toThrow(/Circuit open/);
    now += 100;
    expect(cb.getState()).toBe('half-open');
    cb.assertCanPass();
    cb.recordSuccess();
    expect(cb.getState()).toBe('closed');
  });
});

function stubProvider(overrides: Partial<AIProvider> = {}): AIProvider {
  return {
    id: 'ollama',
    async health(): Promise<ProviderHealth> {
      return { provider: 'ollama', ok: true, baseUrl: 'http://x', circuit: undefined };
    },
    async models(): Promise<ProviderModelInfo[]> {
      return [{ name: 'm' }];
    },
    async chat(): Promise<ChatResponse> {
      return {
        provider: 'ollama',
        model: 'm',
        message: { role: 'assistant', content: 'hi' },
        latencyMs: 1,
      };
    },
    ...overrides,
  };
}

describe('ResilientProvider', () => {
  it('retries chat on transient errors', async () => {
    let n = 0;
    const inner = stubProvider({
      async chat() {
        n += 1;
        if (n === 1) throw new Error('fetch failed');
        return {
          provider: 'ollama',
          model: 'm',
          message: { role: 'assistant', content: 'hi' },
          latencyMs: 1,
        };
      },
    });
    const p = new ResilientProvider(
      inner,
      { maxRetries: 2, retryBackoffMs: 1 },
      { sleep: async () => undefined }
    );
    const out = await p.chat({ messages: [{ role: 'user', content: 'x' }] });
    expect(out.message.content).toBe('hi');
    expect(n).toBe(2);
  });

  it('opens circuit after repeated failures', async () => {
    const inner = stubProvider({
      async chat() {
        throw new Error('ECONNREFUSED');
      },
    });
    const p = new ResilientProvider(
      inner,
      { maxRetries: 0, circuitFailureThreshold: 2, circuitCooldownMs: 60_000 },
      { sleep: async () => undefined }
    );
    await expect(p.chat({ messages: [{ role: 'user', content: 'x' }] })).rejects.toThrow(
      /ECONNREFUSED/
    );
    await expect(p.chat({ messages: [{ role: 'user', content: 'x' }] })).rejects.toThrow(
      /ECONNREFUSED/
    );
    await expect(p.chat({ messages: [{ role: 'user', content: 'x' }] })).rejects.toThrow(
      /Circuit open/
    );
    expect(p.getCircuitState()).toBe('open');
  });

  it('health includes circuit state', async () => {
    const p = new ResilientProvider(stubProvider(), {});
    const h = await p.health();
    expect(h.circuit).toBe('closed');
  });
});

describe('getProvider resilience', () => {
  it('wraps by default', async () => {
    const fetchMock = vi.fn(async () => Response.json({ models: [{ name: 'llama3.2:latest' }] }));
    const p = getProvider('ollama', {
      baseUrl: 'http://example.test',
      fetch: fetchMock as typeof fetch,
    });
    expect(p).toBeInstanceOf(ResilientProvider);
    const h = await p.health();
    expect(h.circuit).toBe('closed');
  });

  it('can disable resilience', () => {
    const p = getProvider('ollama', {
      resilience: false,
      baseUrl: 'http://example.test',
      fetch: vi.fn() as unknown as typeof fetch,
    });
    expect(p).toBeInstanceOf(OllamaProvider);
  });
});
