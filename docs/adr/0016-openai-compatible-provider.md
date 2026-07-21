# ADR-0016: OpenAI-compatible cloud provider

- **Status:** Accepted
- **Date:** 2026-07-17
- **Deciders:** Kleilson dos Santos
- **Issue:** #105

## Context

ADR-0009 left cloud providers as a future stub. The Companion already exposes `aios_provider_*`; a remote backend behind the same contract is still missing, without installing Ollama just to “stay alive” (Resource-Aware).

## Decision

1. **`OpenAICompatibleProvider`** (`id: openai`) via `fetch` — Chat Completions + Models ([official API](https://developers.openai.com/api/docs/api-reference/chat)).
2. Env: `AIOS_OPENAI_API_KEY` (or `OPENAI_API_KEY`) · `AIOS_OPENAI_BASE_URL` (default `https://api.openai.com/v1`) · `AIOS_OPENAI_MODEL` (default `gpt-4o-mini`).
3. Without an API key → `health.ok=false` (no throw on health; chat fails explicitly).
4. Custom `baseUrl` covers OpenAI-compatible gateways (Groq, proxies, etc.) — **not** native Anthropic in this vertical.
5. No OpenAI SDK in the monorepo (minimal; trade-off: still no streaming/tool-calling).

## Consequences

### Positive

- Same MCP/CLI/Companion (`--provider openai`)
- Zero mandatory local install
- Compatible gateways reuse the same code

### Trade-offs

- Anthropic Messages API stays in another vertical (or a compatible gateway)
- On-demand cost/network — operator manages the key

## Rejected alternatives

| Option                   | Reason                                                  |
| ------------------------ | ------------------------------------------------------- |
| `openai` npm SDK         | Overkill for minimal health/models/chat; larger surface |
| Native Anthropic already | Second protocol; defer                                  |
| Make openai the default  | Ollama remains the local default; cloud is opt-in       |

## References

- [ADR-0009](./0009-multi-provider-ollama.md)
- [OpenAI Chat Completions](https://developers.openai.com/api/docs/api-reference/chat)
- [ROADMAP Phase 3](../ROADMAP.md)
