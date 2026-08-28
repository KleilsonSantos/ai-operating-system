# ADR-0031: TaskProfile — complexity, privacy, and cost-aware routing

- **Status:** Accepted
- **Date:** 2026-08-28
- **Deciders:** Kleilson dos Santos
- **Supplements:** [ADR-0025](./0025-model-router-context-budget.md)

## Context

ADR-0025 shipped a vendor-agnostic capability-class router (`fast` | `coding` | `reasoning` | `arbitration`) with env binding and decision-only pipeline recording. The implementation-mission audit (2026-08-28) and master-architecture vision require a richer but still **deterministic** task profile: complexity, privacy, and cost — without ML, without calling `chat` from `runPipeline`, and without naming vendors in Policy.

## Decision

1. **`TaskProfile`** in `@aios/shared`: `{ complexity, privacy, costBudget, risk }` built by `buildTaskProfile(req)`.
2. **Complexity** (`SIMPLE` | `MEDIUM` | `COMPLEX` | `AGENTIC` | `CRITICAL`) — inferred from intent + risk/privilege; optional `RouteRequest.complexity` / `PipelineRequest.complexity` override.
3. **Privacy** (`public` | `internal` | `sensitive`) — default `internal`; optional override. When `privacy === 'sensitive'`, `routeModel` **forces local `ollama`** (signal `privacy-local`), ignoring cloud class bindings for that run.
4. **Capability class** continues to be selected from profile (complexity/risk/cost) then bound via `AIOS_ROUTE_*` env — Policy never names a vendor.
5. **Additive recording.** `RouteDecision.taskProfile` and `PipelineResponse.run.model.{complexity,privacy}` are populated. `contractVersion` stays `"1"`. Pipeline remains **decision-only** (no chat).

### Intent → complexity (default)

| Intent                              | Complexity | Class (typical) |
| ----------------------------------- | ---------- | --------------- |
| `unknown`                           | SIMPLE     | fast            |
| `explain.code`                      | MEDIUM     | coding          |
| `analyze.project` / `review.change` | COMPLEX    | reasoning       |
| `implement.feature` / `fix.bug`     | AGENTIC    | coding          |
| high risk / PRIVILEGED              | CRITICAL   | arbitration     |

`costBudget: 'low'` still forces class `fast` (ADR-0025).

## Consequences

### Positive

- Governance can answer _why_ a class/provider was chosen (complexity + privacy + cost in `reason`)
- Sensitive work stays local without hard-coding vendor names in Policy
- Aligns with master-architecture §7–11 / §19 without a second orchestrator

### Trade-offs

- Complexity tiers are heuristic, not measured tokens or LOC
- Privacy override only has three levels; no per-field redaction
- Forcing ollama on `sensitive` may surprise operators who bound coding→openai — intentional for privacy

## Rejected alternatives

| Option                              | Reason                                             |
| ----------------------------------- | -------------------------------------------------- |
| ML / historical performance scoring | Needs metrics maturity first; anti-overengineering |
| Call chat from `runPipeline`        | ADR-0025 / control-plane boundary                  |
| Put vendor ids in Policy            | ADR-0025                                           |
| New router engine package           | Keep pure functions in `@aios/shared`              |

## References

- [ADR-0025](./0025-model-router-context-budget.md)
- PKB: `prompt.ai-engineering.aios-master-architecture`, `prompt.ai-engineering.aios-implementation-mission`
- Audit run: CURRENT STATE report 2026-08-28 (chat)
