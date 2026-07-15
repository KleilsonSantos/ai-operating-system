/**
 * Multi-provider MVP — abstração AIProvider + Ollama local (#67).
 * Auxiliar para tarefas baratas/locais — **não** substitui o LLM da IDE.
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

export type OllamaProviderOptions = {
  /** Default: AIOS_OLLAMA_URL ou http://127.0.0.1:11434 */
  baseUrl?: string
  /** Default: AIOS_OLLAMA_MODEL ou llama3.2 */
  defaultModel?: string
  /** Injectable for tests */
  fetch?: FetchLike
  /** Request timeout ms (default 30_000) */
  timeoutMs?: number
}

const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434'
const DEFAULT_MODEL = 'llama3.2'

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

export class OllamaProvider implements AIProvider {
  readonly id = 'ollama' as const
  readonly baseUrl: string
  readonly defaultModel: string
  private readonly fetchImpl: FetchLike
  private readonly timeoutMs: number

  constructor(opts: OllamaProviderOptions = {}) {
    this.baseUrl = stripTrailingSlash(
      opts.baseUrl || process.env.AIOS_OLLAMA_URL || DEFAULT_OLLAMA_URL,
    )
    this.defaultModel =
      opts.defaultModel || process.env.AIOS_OLLAMA_MODEL || DEFAULT_MODEL
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

const PROVIDERS: Record<string, (opts?: OllamaProviderOptions) => AIProvider> = {
  ollama: (opts) => new OllamaProvider(opts),
}

/** Router stub — seleção por nome; roteamento inteligente depois. */
export function getProvider(
  id: string = 'ollama',
  opts?: OllamaProviderOptions,
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
