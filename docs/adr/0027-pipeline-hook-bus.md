# ADR-0027: Central pipeline hook bus

- **Status:** Accepted
- **Date:** 2026-08-15
- **Deciders:** Kleilson dos Santos
- **Issue:** #288

## Context

ADR-0024–0026 added execution state, capability-class routing, context budget, and skill packs on `runPipeline`. Policy, observability, and security intercepts would sprawl if each engine grew its own `if` at the same lifecycle points.

The product must stay a control plane. A hook is **where** an intercept may attach — not a new agent, not an MCP wrapper, not a marketplace.

## Decision

1. **Named points only.** Canonical points: `before|after` × `policy|context|agent|gate`. No `before.classify` in this slice (classify is already a `run` step).
2. **Default is none.** `run.hookIds` is empty and a single `hook` step is `skip` unless a known id is requested.
3. **Builtin `record.lifecycle`.** Opt-in via `PipelineRequest.hookIds` / CLI `--hook-ids` / MCP `hookIds`. It records one `hook` step per fired point (`status: ok`, `detail` = point). Unknown ids are skipped. `contractVersion` stays `"1"`.
4. **No new pipeline dependency.** The bus does not call `@aios/status` JSONL (orchestration already records `agent.execution`). Evidence for this slice is `PipelineResponse.run`.
5. **Not a marketplace.** No `hooks/` catalog directory. No operator-defined handlers in this slice.

## Consequences

### Positive

- One list of intercept points instead of scattered `if`s
- Default path stays zero extra I/O

### Trade-offs

- Steps are reconstructed at the end of `runPipeline` (same as other kinds) — hooks are not a live event bus
- `retry` / mutating intercepts are out of scope

## Rejected alternatives

| Option                          | Reason                                           |
| ------------------------------- | ------------------------------------------------ |
| Hook marketplace / JSON catalog | Overengineering for a central list               |
| Intercept MCP tools             | Privilege already gates tools (ADR-0024)         |
| Depend on `@aios/status`        | Extra lockfile / coupling for a record-only step |
| New agent for “hooks”           | Agents are plugins; hooks are intercepts         |

## References

- [ADR-0024](./0024-execution-state-capability-registry.md)
- [ADR-0026](./0026-skill-packs-prompt-engine.md)
- Audit: [`docs/audits/agent-runtime-evolution-analysis-2026-08.md`](../audits/agent-runtime-evolution-analysis-2026-08.md) ID 9
