# ADR-0003: Integration contract via `@aios/pipeline`

- **Status:** Accepted
- **Date:** 2026-07-14
- **Deciders:** Kleilson dos Santos
- **Issue:** #9

## Context

Integrators (CLI, future HTTP/MCP, other products) need to consume the AIOS core without copying engines into other monorepos and without coupling to the internal workspace layout.

## Decision

1. **Typed contract** `PipelineRequest` / `PipelineResponse` in `@aios/shared`, version `contractVersion: "1"`.
2. **Integration runtime** `runPipeline()` in `@aios/pipeline` — the only supported entrypoint for the Phase 1 flow.
3. **`@aios/cli`** is a thin client: argv parse → `runPipeline` → JSON stdout; exit `1` if `!verdict.passed`.
4. HTTP/MCP can wrap the same `runPipeline` later; that does not change the v1 contract.

```text
Integrator  →  @aios/pipeline.runPipeline  →  engines (intent…quality-gate)
```

## Consequences

### Positive

- Clear boundary for the standalone product (ADR-0001)
- Smoke tests and docs aligned to a stable JSON shape
- Avoids “selling” internal engines as a public API

### Trade-offs

- One more workspace package (`@aios/pipeline`)
- Contract evolution requires a `contractVersion` bump (no silent breakage)

## Rejected alternatives

| Option | Reason |
| --- | --- |
| Integrator imports engines directly | Unstable API; monorepo coupling |
| Docs only, no `runPipeline` | No programmatic smoke / regression |
| Put `runPipeline` in `@aios/core` | Dependency cycle with engines that already depend on core |

## References

- [`docs/FOUNDATION.md`](../FOUNDATION.md)
- [`packages/pipeline/README.md`](../../packages/pipeline/README.md)
- [`docs/guides/cursor-chat-bridge.md`](../guides/cursor-chat-bridge.md) — Level 1 chat (Rules), complementary to the pipeline
