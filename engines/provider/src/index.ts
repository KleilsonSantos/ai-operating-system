/**
 * Multi-provider — abstração AIProvider + Ollama local + OpenAI-compatible (#67 / #105).
 * Free-tier aliases: openrouter / groq / gemini (#534 / ADR-0035).
 * Auxiliar para tarefas baratas — **não** substitui o LLM da IDE.
 * Resilience: retry + circuit breaker (#238).
 */
import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ChatUsage,
  ProviderHealth,
  ProviderId,
  ProviderModelInfo,
  RouteBinding,
  RouteDecision,
} from '@aios/shared';
import { isProviderId } from '@aios/shared';
import {
  CircuitBreaker,
  isTransientError,
  resolveResilience,
  withRetry,
  type ResilienceOptions,
  type CircuitState,
} from './resilience.js';

export type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ChatUsage,
  ProviderHealth,
  ProviderId,
  ProviderModelInfo,
  RouteBinding,
  RouteDecision,
};

export type { CircuitState, ResilienceOptions } from './resilience.js';
export { CircuitBreaker, isTransientError, resolveResilience, withRetry } from './resilience.js';
export {
  buildTaskProfile,
  inferRouteRisk,
  inferTaskComplexity,
  inferTaskPrivacy,
  parseRouteFallbackChain,
  resolveCapabilityClass,
  routeModel,
} from './router.js';

export type FetchLike = typeof fetch;

export type AIProvider = {
  readonly id: string;
  health(): Promise<ProviderHealth>;
  models(): Promise<ProviderModelInfo[]>;
  chat(request: ChatRequest): Promise<ChatResponse>;
};

export type ProviderOptions = {
  /** Override base URL */
  baseUrl?: string;
  /** Default chat model */
  defaultModel?: string;
  /** API key (OpenAI-compatible); env fallback */
  apiKey?: string;
  /** Injectable for tests */
  fetch?: FetchLike;
  /** Request timeout ms (default 30_000) */
  timeoutMs?: number;
  /**
   * Provider id reported on health/chat (OpenAI-compatible aliases).
   * Default `openai`.
   */
  id?: string;
} & ResilienceOptions;

/** @deprecated Prefer ProviderOptions — alias for Ollama. */
export type OllamaProviderOptions = ProviderOptions;

const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434';
const DEFAULT_OLLAMA_MODEL = 'llama3.2';
const DEFAULT_ANTHROPIC_URL = 'https://api.anthropic.com';
const DEFAULT_ANTHROPIC_MODEL = 'claude-haiku-4-5';
const ANTHROPIC_VERSION = '2023-06-01';

/** OpenAI Chat Completions gateways used as thin aliases (ADR-0016 / ADR-0035). */
export type OpenAICompatAliasId = 'openai' | 'openrouter' | 'groq' | 'gemini';

type OpenAICompatDefaults = {
  baseUrl: string;
  model: string;
  apiKeyEnvs: readonly string[];
  baseUrlEnv: string;
  modelEnv: string;
};

const OPENAI_COMPAT_DEFAULTS: Record<OpenAICompatAliasId, OpenAICompatDefaults> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    apiKeyEnvs: ['AIOS_OPENAI_API_KEY', 'OPENAI_API_KEY'],
    baseUrlEnv: 'AIOS_OPENAI_BASE_URL',
    modelEnv: 'AIOS_OPENAI_MODEL',
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openrouter/free',
    apiKeyEnvs: ['AIOS_OPENROUTER_API_KEY', 'OPENROUTER_API_KEY'],
    baseUrlEnv: 'AIOS_OPENROUTER_BASE_URL',
    modelEnv: 'AIOS_OPENROUTER_MODEL',
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'openai/gpt-oss-20b',
    apiKeyEnvs: ['AIOS_GROQ_API_KEY', 'GROQ_API_KEY'],
    baseUrlEnv: 'AIOS_GROQ_BASE_URL',
    modelEnv: 'AIOS_GROQ_MODEL',
  },
  gemini: {
    // Official OpenAI-compatible surface:
    // https://ai.google.dev/gemini-api/docs/openai
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.5-flash',
    apiKeyEnvs: ['AIOS_GEMINI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY'],
    baseUrlEnv: 'AIOS_GEMINI_BASE_URL',
    modelEnv: 'AIOS_GEMINI_MODEL',
  },
};

function isOpenAICompatAliasId(value: string): value is OpenAICompatAliasId {
  return value in OPENAI_COMPAT_DEFAULTS;
}

function resolveApiKey(envs: readonly string[], explicit?: string): string {
  if (explicit !== undefined) return explicit;
  for (const key of envs) {
    const v = process.env[key];
    if (v?.trim()) return v.trim();
  }
  return '';
}

function stripTrailingSlash(url: string): string {
  let normalized = url;
  while (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

export class OllamaProvider implements AIProvider {
  readonly id = 'ollama' as const;
  readonly baseUrl: string;
  readonly defaultModel: string;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;

  constructor(opts: ProviderOptions = {}) {
    this.baseUrl = stripTrailingSlash(
      opts.baseUrl || process.env.AIOS_OLLAMA_URL || DEFAULT_OLLAMA_URL
    );
    this.defaultModel = opts.defaultModel || process.env.AIOS_OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;
    this.fetchImpl = opts.fetch || fetch;
    this.timeoutMs = opts.timeoutMs ?? 30_000;
  }

  private async request(path: string, init?: RequestInit): Promise<Response> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      return await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async models(): Promise<ProviderModelInfo[]> {
    const res = await this.request('/api/tags', { method: 'GET' });
    if (!res.ok) {
      throw new Error(`Ollama /api/tags HTTP ${res.status}`);
    }
    const body = (await res.json()) as {
      models?: Array<{ name: string; size?: number; modified_at?: string }>;
    };
    return (body.models || []).map((m) => ({
      name: m.name,
      size: m.size,
      modifiedAt: m.modified_at,
    }));
  }

  async health(): Promise<ProviderHealth> {
    const started = Date.now();
    try {
      const list = await this.models();
      return {
        provider: this.id,
        ok: true,
        baseUrl: this.baseUrl,
        models: list.map((m) => m.name),
        latencyMs: Date.now() - started,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        provider: this.id,
        ok: false,
        baseUrl: this.baseUrl,
        error: message,
        latencyMs: Date.now() - started,
      };
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const started = Date.now();
    const model = request.model || this.defaultModel;
    if (!request.messages?.length) {
      throw new Error('chat: messages required');
    }
    const res = await this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        model,
        messages: request.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        stream: false,
        options:
          request.temperature !== undefined ? { temperature: request.temperature } : undefined,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Ollama /api/chat HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    const body = (await res.json()) as {
      model?: string;
      message?: { role?: string; content?: string };
      prompt_eval_count?: number;
      eval_count?: number;
    };
    const content = body.message?.content ?? '';
    const role = (body.message?.role as ChatMessage['role']) || 'assistant';
    const promptTokens = body.prompt_eval_count;
    const completionTokens = body.eval_count;
    const usage: ChatUsage | undefined =
      promptTokens !== undefined || completionTokens !== undefined
        ? {
            promptTokens,
            completionTokens,
            totalTokens:
              promptTokens !== undefined && completionTokens !== undefined
                ? promptTokens + completionTokens
                : undefined,
          }
        : undefined;
    return {
      provider: this.id,
      model: body.model || model,
      message: { role, content },
      usage,
      latencyMs: Date.now() - started,
    };
  }
}

/**
 * OpenAI Chat Completions + Models (HTTP) — também serve gateways compatíveis
 * (Groq, OpenRouter, Gemini OpenAI-compat, Azure, etc.) (#105 / #534).
 * @see https://developers.openai.com/api/docs/api-reference/chat
 * @see https://ai.google.dev/gemini-api/docs/openai
 */
export class OpenAICompatibleProvider implements AIProvider {
  readonly id: string;
  readonly baseUrl: string;
  readonly defaultModel: string;
  private readonly apiKey: string;
  private readonly apiKeyHint: string;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;

  constructor(opts: ProviderOptions = {}) {
    const rawId = (opts.id || 'openai').trim().toLowerCase();
    const alias: OpenAICompatAliasId = isOpenAICompatAliasId(rawId) ? rawId : 'openai';
    const defaults = OPENAI_COMPAT_DEFAULTS[alias];
    this.id = rawId || alias;
    this.baseUrl = stripTrailingSlash(
      opts.baseUrl || process.env[defaults.baseUrlEnv] || defaults.baseUrl
    );
    this.defaultModel = opts.defaultModel || process.env[defaults.modelEnv] || defaults.model;
    this.apiKey = resolveApiKey(defaults.apiKeyEnvs, opts.apiKey);
    this.apiKeyHint = defaults.apiKeyEnvs[0];
    this.fetchImpl = opts.fetch || fetch;
    this.timeoutMs = opts.timeoutMs ?? 30_000;
  }

  private async request(path: string, init?: RequestInit): Promise<Response> {
    if (!this.apiKey) {
      throw new Error(`API key missing (${this.apiKeyHint}) for provider ${this.id}`);
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      return await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          ...(init?.headers || {}),
        },
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async models(): Promise<ProviderModelInfo[]> {
    const res = await this.request('/models', { method: 'GET' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${this.id} /models HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    const body = (await res.json()) as {
      data?: Array<{ id: string }>;
    };
    return (body.data || []).map((m) => ({ name: m.id }));
  }

  async health(): Promise<ProviderHealth> {
    const started = Date.now();
    if (!this.apiKey) {
      return {
        provider: this.id,
        ok: false,
        baseUrl: this.baseUrl,
        error: `API key missing (${this.apiKeyHint})`,
        latencyMs: Date.now() - started,
      };
    }
    try {
      const list = await this.models();
      return {
        provider: this.id,
        ok: true,
        baseUrl: this.baseUrl,
        models: list.map((m) => m.name).slice(0, 40),
        latencyMs: Date.now() - started,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        provider: this.id,
        ok: false,
        baseUrl: this.baseUrl,
        error: message,
        latencyMs: Date.now() - started,
      };
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const started = Date.now();
    const model = request.model || this.defaultModel;
    if (!request.messages?.length) {
      throw new Error('chat: messages required');
    }
    const payload: Record<string, unknown> = {
      model,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };
    if (request.temperature !== undefined) {
      payload.temperature = request.temperature;
    }
    const res = await this.request('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${this.id} /chat/completions HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    // Official: usage.prompt_tokens / completion_tokens / total_tokens
    // https://developers.openai.com/api/reference/resources/chat
    const body = (await res.json()) as {
      model?: string;
      choices?: Array<{ message?: { role?: string; content?: string | null } }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };
    const msg = body.choices?.[0]?.message;
    const content = msg?.content ?? '';
    const role = (msg?.role as ChatMessage['role']) || 'assistant';
    const usage: ChatUsage | undefined = body.usage
      ? {
          promptTokens: body.usage.prompt_tokens,
          completionTokens: body.usage.completion_tokens,
          totalTokens: body.usage.total_tokens,
        }
      : undefined;
    return {
      provider: this.id,
      model: body.model || model,
      message: { role, content },
      usage,
      latencyMs: Date.now() - started,
    };
  }
}

/**
 * Anthropic Messages API (HTTP) — nativo Claude (#109).
 * Headers: x-api-key + anthropic-version (não Bearer).
 * @see https://platform.claude.com/docs/en/api/overview
 */
export class AnthropicProvider implements AIProvider {
  readonly id = 'anthropic' as const;
  readonly baseUrl: string;
  readonly defaultModel: string;
  private readonly apiKey: string;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;
  private readonly maxTokens: number;

  constructor(opts: ProviderOptions = {}) {
    this.baseUrl = stripTrailingSlash(
      opts.baseUrl || process.env.AIOS_ANTHROPIC_BASE_URL || DEFAULT_ANTHROPIC_URL
    );
    this.defaultModel =
      opts.defaultModel || process.env.AIOS_ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL;
    this.apiKey =
      opts.apiKey !== undefined
        ? opts.apiKey
        : process.env.AIOS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || '';
    this.fetchImpl = opts.fetch || fetch;
    this.timeoutMs = opts.timeoutMs ?? 30_000;
    this.maxTokens = 1024;
  }

  private async request(path: string, init?: RequestInit): Promise<Response> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key missing (AIOS_ANTHROPIC_API_KEY or ANTHROPIC_API_KEY)');
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      return await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
          ...(init?.headers || {}),
        },
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async models(): Promise<ProviderModelInfo[]> {
    const res = await this.request('/v1/models', { method: 'GET' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Anthropic /v1/models HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    const body = (await res.json()) as {
      data?: Array<{ id: string }>;
    };
    return (body.data || []).map((m) => ({ name: m.id }));
  }

  async health(): Promise<ProviderHealth> {
    const started = Date.now();
    if (!this.apiKey) {
      return {
        provider: this.id,
        ok: false,
        baseUrl: this.baseUrl,
        error: 'API key missing (AIOS_ANTHROPIC_API_KEY)',
        latencyMs: Date.now() - started,
      };
    }
    try {
      const list = await this.models();
      return {
        provider: this.id,
        ok: true,
        baseUrl: this.baseUrl,
        models: list.map((m) => m.name).slice(0, 40),
        latencyMs: Date.now() - started,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        provider: this.id,
        ok: false,
        baseUrl: this.baseUrl,
        error: message,
        latencyMs: Date.now() - started,
      };
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const started = Date.now();
    const model = request.model || this.defaultModel;
    if (!request.messages?.length) {
      throw new Error('chat: messages required');
    }
    const systemParts = request.messages.filter((m) => m.role === 'system').map((m) => m.content);
    const messages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
    if (!messages.length) {
      throw new Error('chat: at least one non-system message required');
    }
    const payload: Record<string, unknown> = {
      model,
      max_tokens: this.maxTokens,
      messages,
    };
    if (systemParts.length) {
      payload.system = systemParts.join('\n\n');
    }
    if (request.temperature !== undefined) {
      payload.temperature = request.temperature;
    }
    const res = await this.request('/v1/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Anthropic /v1/messages HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    // Official Messages usage: input_tokens / output_tokens
    // https://docs.anthropic.com/en/api/messages
    const body = (await res.json()) as {
      model?: string;
      content?: Array<{ type?: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const content = (body.content || [])
      .filter((b) => b.type === 'text' && b.text)
      .map((b) => b.text!)
      .join('\n');
    const promptTokens = body.usage?.input_tokens;
    const completionTokens = body.usage?.output_tokens;
    const usage: ChatUsage | undefined =
      promptTokens !== undefined || completionTokens !== undefined
        ? {
            promptTokens,
            completionTokens,
            totalTokens:
              promptTokens !== undefined && completionTokens !== undefined
                ? promptTokens + completionTokens
                : undefined,
          }
        : undefined;
    return {
      provider: this.id,
      model: body.model || model,
      message: { role: 'assistant', content },
      usage,
      latencyMs: Date.now() - started,
    };
  }
}

const PROVIDERS: Record<string, (opts?: ProviderOptions) => AIProvider> = {
  ollama: (opts) => new OllamaProvider(opts),
  openai: (opts) => new OpenAICompatibleProvider({ ...opts, id: 'openai' }),
  anthropic: (opts) => new AnthropicProvider(opts),
  openrouter: (opts) => new OpenAICompatibleProvider({ ...opts, id: 'openrouter' }),
  groq: (opts) => new OpenAICompatibleProvider({ ...opts, id: 'groq' }),
  gemini: (opts) => new OpenAICompatibleProvider({ ...opts, id: 'gemini' }),
};

/** Ordered primary + fallbacks for chat failover (ADR-0035). */
export function resolveRouteChatChain(decision: RouteDecision): RouteBinding[] {
  return [{ providerId: decision.providerId, modelId: decision.modelId }, ...decision.fallbacks];
}

/**
 * Errors that justify hopping to the next route binding (quota / availability).
 * 5xx stays on the same provider (resilience retry); 429/503/408 and quota wording hop.
 */
export function isFailoverEligibleError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  if (msg.includes('messages required') || msg.includes('api key missing')) return false;
  if (msg.includes('circuit open')) return true;
  if (msg.includes('rate limit') || msg.includes('resource_exhausted') || /\bquota\b/.test(msg)) {
    return true;
  }
  const http = msg.match(/http\s+(\d{3})/i);
  if (http) {
    const code = Number(http[1]);
    return code === 429 || code === 503 || code === 408;
  }
  return false;
}

function envFlagTruthy(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

export type ChatRouteFailoverOptions = ProviderOptions & {
  /**
   * Opt-in failover across `decision.fallbacks`.
   * Also enabled when `AIOS_ROUTE_FAILOVER=1` (or true/yes/on).
   */
  failover?: boolean;
  /** Override process.env for failover flag / tests */
  env?: Record<string, string | undefined>;
};

/**
 * Chat using a RouteDecision chain. Without failover, only the primary binding runs.
 * With failover (opt-in), 429/quota/unavailable hops to the next binding (#534 / ADR-0035).
 */
export async function chatWithRouteFailover(
  decision: RouteDecision,
  request: ChatRequest,
  opts: ChatRouteFailoverOptions = {}
): Promise<ChatResponse> {
  const envMap = opts.env ?? process.env;
  const failover = opts.failover === true || envFlagTruthy(envMap.AIOS_ROUTE_FAILOVER);
  const chain = resolveRouteChatChain(decision);
  const targets = failover ? chain : chain.slice(0, 1);
  const errors: string[] = [];

  for (let i = 0; i < targets.length; i++) {
    const hop = targets[i]!;
    if (!isProviderId(hop.providerId)) {
      errors.push(`${hop.providerId}: invalid provider`);
      continue;
    }
    const providerOpts: ProviderOptions = {
      ...opts,
      // Do not force resilience off; aliases inherit caller opts.
    };
    const p = getProvider(hop.providerId, providerOpts);
    try {
      return await p.chat({
        ...request,
        model: request.model || hop.modelId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${hop.providerId}: ${message}`);
      const last = i === targets.length - 1;
      if (!failover || last || !isFailoverEligibleError(err)) {
        throw err;
      }
    }
  }

  throw new Error(`chatWithRouteFailover: no route succeeded (${errors.join(' | ')})`);
}

/**
 * Wraps an AIProvider with retry + circuit breaker for chat/models.
 * Health probes once (no retry storm) and reports circuit state.
 */
export class ResilientProvider implements AIProvider {
  readonly id: string;
  private readonly inner: AIProvider;
  private readonly circuit: CircuitBreaker;
  private readonly cfg: ReturnType<typeof resolveResilience>;
  private readonly sleep?: (ms: number) => Promise<void>;

  constructor(
    inner: AIProvider,
    opts: ResilienceOptions = {},
    hooks?: { sleep?: (ms: number) => Promise<void>; now?: () => number }
  ) {
    this.inner = inner;
    this.id = inner.id;
    this.cfg = resolveResilience(opts);
    this.circuit = new CircuitBreaker(
      this.cfg.circuitFailureThreshold,
      this.cfg.circuitCooldownMs,
      hooks?.now
    );
    this.sleep = hooks?.sleep;
  }

  getCircuitState(): CircuitState {
    return this.circuit.getState();
  }

  private async guarded<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.cfg.enabled) {
      return fn();
    }
    this.circuit.assertCanPass();
    const probing = this.circuit.getState() === 'half-open';
    try {
      const result = await withRetry(fn, {
        maxRetries: this.cfg.maxRetries,
        retryBackoffMs: this.cfg.retryBackoffMs,
        sleep: this.sleep,
      });
      this.circuit.recordSuccess();
      return result;
    } catch (err) {
      // Trip only on transient faults (or failed half-open probe) — not on 4xx client errors
      if (probing || isTransientError(err)) {
        this.circuit.recordFailure();
      }
      throw err;
    }
  }

  async models(): Promise<ProviderModelInfo[]> {
    return this.guarded(() => this.inner.models());
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.guarded(() => this.inner.chat(request));
  }

  async health(): Promise<ProviderHealth> {
    const h = await this.inner.health();
    if (!this.cfg.enabled) {
      return h;
    }
    return { ...h, circuit: this.circuit.getState() };
  }
}

/** Name lookup + resilience. Capability-class routing is `routeModel` (ADR-0025). */
export function getProvider(id: string = 'ollama', opts?: ProviderOptions): AIProvider {
  const key = id.trim().toLowerCase() || 'ollama';
  const factory = PROVIDERS[key];
  if (!factory) {
    throw new Error(`Unknown provider "${id}". Available: ${listProviderIds().join(', ')}`);
  }
  const inner = factory(opts);
  const cfg = resolveResilience(opts ?? {});
  if (!cfg.enabled) {
    return inner;
  }
  return new ResilientProvider(inner, opts ?? {});
}

export function listProviderIds(): ProviderId[] {
  return Object.keys(PROVIDERS) as ProviderId[];
}
