/**
 * Multi-provider — abstração AIProvider + Ollama local + OpenAI-compatible (#67 / #105).
 * Auxiliar para tarefas baratas — **não** substitui o LLM da IDE.
 */
import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ProviderHealth,
  ProviderId,
  ProviderModelInfo,
} from '@aios/shared'

export type { ChatMessage, ChatRequest, ChatResponse, ProviderHealth, ProviderId, ProviderModelInfo }

export type FetchLike = typeof fetch

export type AIProvider = {
  readonly id: string
  health(): Promise<ProviderHealth>
  models(): Promise<ProviderModelInfo[]>
  chat(request: ChatRequest): Promise<ChatResponse>
}

export type ProviderOptions = {
  /** Override base URL */
  baseUrl?: string
  /** Default chat model */
  defaultModel?: string
  /** API key (OpenAI-compatible); env fallback */
  apiKey?: string
  /** Injectable for tests */
  fetch?: FetchLike
  /** Request timeout ms (default 30_000) */
  timeoutMs?: number
}

/** @deprecated Prefer ProviderOptions — alias for Ollama. */
export type OllamaProviderOptions = ProviderOptions

const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434'
const DEFAULT_OLLAMA_MODEL = 'llama3.2'
const DEFAULT_OPENAI_URL = 'https://api.openai.com/v1'
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
const DEFAULT_ANTHROPIC_URL = 'https://api.anthropic.com'
const DEFAULT_ANTHROPIC_MODEL = 'claude-haiku-4-5'
const ANTHROPIC_VERSION = '2023-06-01'

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

export class OllamaProvider implements AIProvider {
  readonly id = 'ollama' as const
  readonly baseUrl: string
  readonly defaultModel: string
  private readonly fetchImpl: FetchLike
  private readonly timeoutMs: number

  constructor(opts: ProviderOptions = {}) {
    this.baseUrl = stripTrailingSlash(
      opts.baseUrl || process.env.AIOS_OLLAMA_URL || DEFAULT_OLLAMA_URL,
    )
    this.defaultModel =
      opts.defaultModel || process.env.AIOS_OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL
    this.fetchImpl = opts.fetch || fetch
    this.timeoutMs = opts.timeoutMs ?? 30_000
  }

  private async request(
    path: string,
    init?: RequestInit,
  ): Promise<Response> {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs)
    try {
      return await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
      })
    } finally {
      clearTimeout(timer)
    }
  }

  async models(): Promise<ProviderModelInfo[]> {
    const res = await this.request('/api/tags', { method: 'GET' })
    if (!res.ok) {
      throw new Error(`Ollama /api/tags HTTP ${res.status}`)
    }
    const body = (await res.json()) as {
      models?: Array<{ name: string; size?: number; modified_at?: string }>
    }
    return (body.models || []).map((m) => ({
      name: m.name,
      size: m.size,
      modifiedAt: m.modified_at,
    }))
  }

  async health(): Promise<ProviderHealth> {
    const started = Date.now()
    try {
      const list = await this.models()
      return {
        provider: this.id,
        ok: true,
        baseUrl: this.baseUrl,
        models: list.map((m) => m.name),
        latencyMs: Date.now() - started,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        provider: this.id,
        ok: false,
        baseUrl: this.baseUrl,
        error: message,
        latencyMs: Date.now() - started,
      }
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model || this.defaultModel
    if (!request.messages?.length) {
      throw new Error('chat: messages required')
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
          request.temperature !== undefined
            ? { temperature: request.temperature }
            : undefined,
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Ollama /api/chat HTTP ${res.status}: ${text.slice(0, 200)}`)
    }
    const body = (await res.json()) as {
      model?: string
      message?: { role?: string; content?: string }
    }
    const content = body.message?.content ?? ''
    const role = (body.message?.role as ChatMessage['role']) || 'assistant'
    return {
      provider: this.id,
      model: body.model || model,
      message: { role, content },
    }
  }
}

/**
 * OpenAI Chat Completions + Models (HTTP) — também serve gateways compatíveis
 * (Groq, Azure OpenAI compat, etc.) via AIOS_OPENAI_BASE_URL (#105).
 * @see https://developers.openai.com/api/docs/api-reference/chat
 */
export class OpenAICompatibleProvider implements AIProvider {
  readonly id = 'openai' as const
  readonly baseUrl: string
  readonly defaultModel: string
  private readonly apiKey: string
  private readonly fetchImpl: FetchLike
  private readonly timeoutMs: number

  constructor(opts: ProviderOptions = {}) {
    this.baseUrl = stripTrailingSlash(
      opts.baseUrl ||
        process.env.AIOS_OPENAI_BASE_URL ||
        DEFAULT_OPENAI_URL,
    )
    this.defaultModel =
      opts.defaultModel ||
      process.env.AIOS_OPENAI_MODEL ||
      DEFAULT_OPENAI_MODEL
    this.apiKey =
      opts.apiKey !== undefined
        ? opts.apiKey
        : process.env.AIOS_OPENAI_API_KEY ||
          process.env.OPENAI_API_KEY ||
          ''
    this.fetchImpl = opts.fetch || fetch
    this.timeoutMs = opts.timeoutMs ?? 30_000
  }

  private async request(
    path: string,
    init?: RequestInit,
  ): Promise<Response> {
    if (!this.apiKey) {
      throw new Error(
        'OpenAI API key missing (AIOS_OPENAI_API_KEY or OPENAI_API_KEY)',
      )
    }
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs)
    try {
      return await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          ...(init?.headers || {}),
        },
      })
    } finally {
      clearTimeout(timer)
    }
  }

  async models(): Promise<ProviderModelInfo[]> {
    const res = await this.request('/models', { method: 'GET' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(
        `OpenAI /models HTTP ${res.status}: ${text.slice(0, 200)}`,
      )
    }
    const body = (await res.json()) as {
      data?: Array<{ id: string }>
    }
    return (body.data || []).map((m) => ({ name: m.id }))
  }

  async health(): Promise<ProviderHealth> {
    const started = Date.now()
    if (!this.apiKey) {
      return {
        provider: this.id,
        ok: false,
        baseUrl: this.baseUrl,
        error: 'API key missing (AIOS_OPENAI_API_KEY)',
        latencyMs: Date.now() - started,
      }
    }
    try {
      const list = await this.models()
      return {
        provider: this.id,
        ok: true,
        baseUrl: this.baseUrl,
        models: list.map((m) => m.name).slice(0, 40),
        latencyMs: Date.now() - started,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        provider: this.id,
        ok: false,
        baseUrl: this.baseUrl,
        error: message,
        latencyMs: Date.now() - started,
      }
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model || this.defaultModel
    if (!request.messages?.length) {
      throw new Error('chat: messages required')
    }
    const payload: Record<string, unknown> = {
      model,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }
    if (request.temperature !== undefined) {
      payload.temperature = request.temperature
    }
    const res = await this.request('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(
        `OpenAI /chat/completions HTTP ${res.status}: ${text.slice(0, 200)}`,
      )
    }
    const body = (await res.json()) as {
      model?: string
      choices?: Array<{ message?: { role?: string; content?: string | null } }>
    }
    const msg = body.choices?.[0]?.message
    const content = msg?.content ?? ''
    const role = (msg?.role as ChatMessage['role']) || 'assistant'
    return {
      provider: this.id,
      model: body.model || model,
      message: { role, content },
    }
  }
}

/**
 * Anthropic Messages API (HTTP) — nativo Claude (#109).
 * Headers: x-api-key + anthropic-version (não Bearer).
 * @see https://platform.claude.com/docs/en/api/overview
 */
export class AnthropicProvider implements AIProvider {
  readonly id = 'anthropic' as const
  readonly baseUrl: string
  readonly defaultModel: string
  private readonly apiKey: string
  private readonly fetchImpl: FetchLike
  private readonly timeoutMs: number
  private readonly maxTokens: number

  constructor(opts: ProviderOptions = {}) {
    this.baseUrl = stripTrailingSlash(
      opts.baseUrl ||
        process.env.AIOS_ANTHROPIC_BASE_URL ||
        DEFAULT_ANTHROPIC_URL,
    )
    this.defaultModel =
      opts.defaultModel ||
      process.env.AIOS_ANTHROPIC_MODEL ||
      DEFAULT_ANTHROPIC_MODEL
    this.apiKey =
      opts.apiKey !== undefined
        ? opts.apiKey
        : process.env.AIOS_ANTHROPIC_API_KEY ||
          process.env.ANTHROPIC_API_KEY ||
          ''
    this.fetchImpl = opts.fetch || fetch
    this.timeoutMs = opts.timeoutMs ?? 30_000
    this.maxTokens = 1024
  }

  private async request(
    path: string,
    init?: RequestInit,
  ): Promise<Response> {
    if (!this.apiKey) {
      throw new Error(
        'Anthropic API key missing (AIOS_ANTHROPIC_API_KEY or ANTHROPIC_API_KEY)',
      )
    }
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs)
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
      })
    } finally {
      clearTimeout(timer)
    }
  }

  async models(): Promise<ProviderModelInfo[]> {
    const res = await this.request('/v1/models', { method: 'GET' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(
        `Anthropic /v1/models HTTP ${res.status}: ${text.slice(0, 200)}`,
      )
    }
    const body = (await res.json()) as {
      data?: Array<{ id: string }>
    }
    return (body.data || []).map((m) => ({ name: m.id }))
  }

  async health(): Promise<ProviderHealth> {
    const started = Date.now()
    if (!this.apiKey) {
      return {
        provider: this.id,
        ok: false,
        baseUrl: this.baseUrl,
        error: 'API key missing (AIOS_ANTHROPIC_API_KEY)',
        latencyMs: Date.now() - started,
      }
    }
    try {
      const list = await this.models()
      return {
        provider: this.id,
        ok: true,
        baseUrl: this.baseUrl,
        models: list.map((m) => m.name).slice(0, 40),
        latencyMs: Date.now() - started,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        provider: this.id,
        ok: false,
        baseUrl: this.baseUrl,
        error: message,
        latencyMs: Date.now() - started,
      }
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model || this.defaultModel
    if (!request.messages?.length) {
      throw new Error('chat: messages required')
    }
    const systemParts = request.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
    const messages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
    if (!messages.length) {
      throw new Error('chat: at least one non-system message required')
    }
    const payload: Record<string, unknown> = {
      model,
      max_tokens: this.maxTokens,
      messages,
    }
    if (systemParts.length) {
      payload.system = systemParts.join('\n\n')
    }
    if (request.temperature !== undefined) {
      payload.temperature = request.temperature
    }
    const res = await this.request('/v1/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(
        `Anthropic /v1/messages HTTP ${res.status}: ${text.slice(0, 200)}`,
      )
    }
    const body = (await res.json()) as {
      model?: string
      content?: Array<{ type?: string; text?: string }>
    }
    const content = (body.content || [])
      .filter((b) => b.type === 'text' && b.text)
      .map((b) => b.text!)
      .join('\n')
    return {
      provider: this.id,
      model: body.model || model,
      message: { role: 'assistant', content },
    }
  }
}

const PROVIDERS: Record<string, (opts?: ProviderOptions) => AIProvider> = {
  ollama: (opts) => new OllamaProvider(opts),
  openai: (opts) => new OpenAICompatibleProvider(opts),
  anthropic: (opts) => new AnthropicProvider(opts),
}

/** Router stub — seleção por nome; roteamento inteligente depois. */
export function getProvider(
  id: string = 'ollama',
  opts?: ProviderOptions,
): AIProvider {
  const key = id.trim().toLowerCase() || 'ollama'
  const factory = PROVIDERS[key]
  if (!factory) {
    throw new Error(
      `Unknown provider "${id}". Available: ${listProviderIds().join(', ')}`,
    )
  }
  return factory(opts)
}

export function listProviderIds(): ProviderId[] {
  return Object.keys(PROVIDERS) as ProviderId[]
}
