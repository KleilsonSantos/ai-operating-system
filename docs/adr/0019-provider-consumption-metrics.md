# ADR-0019: Provider chat consumption metrics (JSONL)

- **Status:** Accepted
- **Date:** 2026-07-17
- **Deciders:** Kleilson dos Santos
- **Issue:** #115

## Context

[ADR-0010](./0010-governance-console.md) shipped Health + Attention without token instrumentation (“consumption still a stub”). ROADMAP deferred Grafana until useful series exist. Provider chat (`aios_provider_chat` / CLI) was the natural first emitter.

## Decision

1. Normalize usage on `ChatResponse.usage` (`promptTokens` / `completionTokens` / `totalTokens`) from:
   - OpenAI Chat Completions `usage.prompt_tokens` / `completion_tokens` / `total_tokens` ([API reference](https://developers.openai.com/api/reference/resources/chat))
   - Anthropic Messages `usage.input_tokens` / `output_tokens` ([Messages API](https://docs.anthropic.com/en/api/messages))
   - Ollama `prompt_eval_count` / `eval_count` when present
2. Append `kind: "provider.chat"` rows via `recordProviderChatMetric` / `chatWithMetrics` → `.aios/metrics/events.jsonl`.
3. Wire MCP + CLI through `chatWithMetrics` (success and failure).
4. `getGovernanceStatus().metrics.providerChat` aggregates counts/tokens; Attention shows stub until the first `provider.chat` event, and warns on chat errors.
5. Prometheus text export is **[ADR-0021](./0021-prometheus-metrics-export.md)** (console `GET /metrics` / CLI `--metrics-prometheus`). Grafana dashboards remain optional.

## Consequences

### Positive

- Real consumption signal in the existing console/governance surface
- Resource-Aware: local append-only JSONL, no new daemons
- Unblocks scrape-based ops without bundling Grafana

### Trade-offs

- Token totals depend on each provider returning usage (Ollama may omit)
- JSONL is not a time-series DB — fine for MVP volume

## References

- [ADR-0010](./0010-governance-console.md)
- OpenAI Chat Completions usage fields
- Anthropic Messages usage fields
