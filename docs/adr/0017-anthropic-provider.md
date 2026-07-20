# ADR-0017: Anthropic Messages provider

- **Status:** Accepted
- **Date:** 2026-07-17
- **Deciders:** Kleilson dos Santos
- **Issue:** #109

## Context

ADR-0016 covered OpenAI-compatible. Anthropic uses a distinct protocol (`x-api-key`, `anthropic-version`, Messages API with `max_tokens` and separate `system`) — it does not fit the OpenAI adapter.

## Decision

1. **`AnthropicProvider`** (`id: anthropic`) via `fetch` — `POST /v1/messages` · `GET /v1/models`.
2. Required headers: `x-api-key`, `anthropic-version: 2023-06-01`, `content-type: application/json`.
3. Env: `AIOS_ANTHROPIC_API_KEY` (or `ANTHROPIC_API_KEY`) · `AIOS_ANTHROPIC_BASE_URL` (default `https://api.anthropic.com`) · `AIOS_ANTHROPIC_MODEL` (default `claude-haiku-4-5` — cheap auxiliary).
4. AIOS contract system prompts → `system` field; only `user`/`assistant` in `messages`.
5. No Anthropic SDK in the monorepo (minimal; no streaming/tools in this vertical).

## Consequences

### Positive

- Native Claude on the same MCP/CLI/Companion
- Default Haiku aligns with Resource-Aware (cost)

### Trade-offs

- Two cloud protocols (OpenAI vs Anthropic) — acceptable vs forcing a single gateway
- Fixed `max_tokens` 1024 in the MVP (override later if needed)

## Rejected alternatives

| Option                         | Reason                                                 |
| ------------------------------ | ------------------------------------------------------ |
| Only via OpenAI-compat gateway | Loses native features; operator may not have a gateway |
| `@anthropic-ai/sdk` SDK        | Overkill for health/models/chat                        |

## References

- [ADR-0016](./0016-openai-compatible-provider.md)
- [Anthropic API overview](https://platform.claude.com/docs/en/api/overview)
- [ROADMAP Phase 3](../ROADMAP.md)
