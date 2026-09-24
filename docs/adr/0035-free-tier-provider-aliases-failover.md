# ADR-0035: Free-tier provider aliases + route failover

- **Status:** Accepted
- **Date:** 2026-09-24
- **Deciders:** Kleilson dos Santos
- **Issue:** #534
- **Supplements:** [ADR-0016](./0016-openai-compatible-provider.md), [ADR-0025](./0025-model-router-context-budget.md), [ADR-0031](./0031-task-profile-model-router.md)

## Context

Operators want to exercise cloud models without prepaid OpenAI credits. Free / low-cost OpenAI-compatible gateways (OpenRouter `:free`, Groq, Gemini OpenAI-compat) already fit behind `OpenAICompatibleProvider` (ADR-0016), but required remembering base URLs and offered no quota-aware hop. A full “free mesh” product would over-engineer; the gap is thin aliases + deterministic fallback metadata + opt-in chat failover.

## Decision

1. **Named aliases** on the existing OpenAI-compatible HTTP client: `openrouter`, `groq`, `gemini` — preset base URLs and env keys (`AIOS_<ALIAS>_API_KEY` / `_BASE_URL` / `_MODEL`). No new SDKs. `ProviderId` gains those three ids.
2. **Decision-only fallbacks.** `AIOS_ROUTE_FALLBACK` is a comma-separated list of `provider` or `provider:model`. `routeModel` fills `RouteDecision.fallbacks` without network. Primary is unchanged. Invalid tokens become signals (`fallback-invalid:…`).
3. **Privacy wins.** When `privacy === 'sensitive'`, cloud fallbacks are cleared (`fallback-cleared-privacy`) so the chain cannot leave local `ollama` (ADR-0031).
4. **Opt-in chat failover.** `chatWithRouteFailover(decision, request)` tries the primary, then `fallbacks`, only when `failover: true` or `AIOS_ROUTE_FAILOVER=1`. Eligible errors: HTTP 429 / 503 / 408, rate-limit / quota / `resource_exhausted` / open circuit. Pipeline stays decision-only (no chat from `runPipeline`).
5. **Operator doc** — [free-tier-providers.md](../guides/free-tier-providers.md): free ≠ production SLA; one legitimate key per provider; Gemini Free may use content to improve products.

## Consequences

### Positive

- Demonstrates heterogeneous provider governance without a second router product
- Reuses ADR-0016 transport and ADR-0025 class bindings
- Failover is explicit and off by default (Resource-Aware)

### Trade-offs

- Free-tier quotas change often — limits are not hard-coded as product truth
- Aliases are OpenAI-compat only; native Gemini/Anthropic protocols stay separate
- No live RPM/TPM accounting in this slice

## Rejected alternatives

| Option                        | Reason                                       |
| ----------------------------- | -------------------------------------------- |
| New provider engine / mesh UX | Overengineering; duplicates `@aios/provider` |
| Multi-account quota farming   | ToS risk; unprofessional                     |
| Always-on failover            | Surprises operators; burns secondary quotas  |
| Hugging Face / Cloudflare P0  | Weak free credits / different units          |

## References

- [OpenRouter free models](https://openrouter.ai/collections/free-models)
- [Groq rate limits](https://console.groq.com/docs/rate-limits)
- [Gemini OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai)
- Guide: [free-tier-providers.md](../guides/free-tier-providers.md)
