# ADR-0009: Multi-provider MVP — AIProvider + Ollama

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** Kleilson dos Santos
- **Issue:** #67

## Context

Phase 3 calls for multi-provider support. The immediate goal is to **save tokens/API cost** with cheap/local tasks — not to replace the IDE LLM or build a VS Code extension. Local Ollama is the first concrete backend behind a stable abstraction.

## Decision

1. Engine **`@aios/provider`** with `AIProvider` interface (`health` · `models` · `chat`).
2. **`OllamaProvider`** implementation over HTTP (`AIOS_OLLAMA_URL`, default `http://127.0.0.1:11434`; model `AIOS_OLLAMA_MODEL`).
3. Router stub `getProvider(id)` — name-based selection only in this MVP.
4. MCP: `aios_provider_health` · `aios_provider_models` · `aios_provider_chat`.
5. CLI: `--provider-health` · `--provider-chat` · `--provider=` · `--model=`.
6. Heavy coding / review stays in Cursor Agent; Ollama = auxiliary.

## Consequences

### Positive

- Single plug point for Claude/OpenAI/Gemini later
- Cheap health checks without coupling to the `contractVersion` pipeline
- Aligns with “do not replace the IDE” (FOUNDATION / ADR-0001)

### Trade-offs

- Ollama only in the MVP; other providers are future stubs
- No streaming / embeddings / tool-calling in this vertical
- Depends on Ollama installed and running on the host

## Rejected alternatives

| Option                             | Reason                                                     |
| ---------------------------------- | ---------------------------------------------------------- |
| IDE extension → Ollama             | Out of scope; competes with the IDE                        |
| Wire Ollama into the Prompt Engine | Prompt Engine only builds a deterministic brief (ADR-0008) |
| OpenAI/Anthropic SDKs already      | Scope; after Ollama is validated                           |

## References

- [ROADMAP Phase 3](../ROADMAP.md)
- [ADR-0008](./0008-prompt-engine-brief.md)
- [Ollama API](https://docs.ollama.com/api)
