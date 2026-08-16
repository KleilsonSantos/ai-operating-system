# ADR-0025: Model router by capability class + context budget

- **Status:** Accepted
- **Date:** 2026-08-15
- **Deciders:** Kleilson dos Santos
- **Issue:** #276

## Context

ADR-0024 added execution state, MCP privilege, and registry-selected plugins. Two gaps remained on the same spine:

1. `@aios/provider` still selected backends by **vendor name** (`getProvider('ollama')`)
2. Context gather had numeric caps but no **named budget** tied to intent/risk, and no secret-path filter

The product must stay a control plane. Routing must not lock Policy to OpenAI, Anthropic, or DeepSeek. Context must not dump the repo.

## Decision

1. **Capability-class router.** `routeModel` lives in `@aios/shared` (same module as privilege helpers; no extra file so MCP strip-types can load it) and is re-exported from `@aios/provider`. It maps intent + risk + cost + privilege to `fast` | `coding` | `reasoning` | `arbitration`. Policy never names a vendor. The operator binds class → provider/model with `AIOS_ROUTE_<CLASS>_PROVIDER` / `AIOS_ROUTE_<CLASS>_MODEL`. Unknown env providers fail closed to local `ollama`. Default binding for every class is `ollama` / `llama3.2` (or `AIOS_OLLAMA_MODEL`).
2. **Decision only.** `runPipeline` records `PipelineResponse.run.model` and a `route` step. It does **not** call `chat`. `contractVersion` stays `"1"`.
3. **Context budget.** `resolveContextBudget` picks `tight` | `standard` | `wide` from intent/risk/cost. `gatherContext` applies those caps, denies secret-like paths (`.env*`, `*.pem`/`*.key`, `credentials.json`, `secrets/`), and emits `denied:` / `budget:` signals.
4. **MCP opt-in.** `aios_provider_chat` may pass `capabilityClass` when `provider` is omitted. Explicit `provider` still wins.

## Consequences

### Positive

- Governance can answer which _class_ a run would use, without a network hop
- Operator remaps vendors without editing Policy
- Tight budget on `unknown` / `costBudget=low` / high risk limits leak and tokens

### Trade-offs

- Default local binding means cloud models stay unused until env is set
- Budget tiers are heuristic, not embeddings
- Skills / hooks stay out of this ADR

## Rejected alternatives

| Option                        | Reason                                         |
| ----------------------------- | ---------------------------------------------- |
| Vendor id in Policy           | Locks the product to one API                   |
| Call chat from `runPipeline`  | Pipeline is a control plane, not an agent loop |
| Full-repo context             | Violates resource-first and secret hygiene     |
| Skill packs in the same slice | Separate authorization                         |

## References

- [ADR-0009](./0009-multi-provider-ollama.md) — name lookup `getProvider` remains
- [ADR-0024](./0024-execution-state-capability-registry.md)
- Audit: [`docs/audits/agent-runtime-evolution-analysis-2026-08.md`](../audits/agent-runtime-evolution-analysis-2026-08.md) items 6–7
