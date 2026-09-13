# ADR-0033: Untrusted content hygiene (context + memory)

- **Status:** Accepted
- **Date:** 2026-09-13
- **Deciders:** Kleilson dos Santos
- **Issue:** [#447](https://github.com/KleilsonSantos/ai-operating-system/issues/447)
- **Spike:** [content-hygiene-prompt-injection](../spikes/content-hygiene-prompt-injection.md)

## Context

ADR-0025 added secret-**path** denial in `gatherContext`. Memory (`remember`) only truncated length. Hostile instruction text in allowed files, or injection-like memory notes, could still reach the prompt or durable store. Issue #447 required a security-spike outcome: implement minimal fail-closed hygiene **or** explicit deferral with risk.

## Decision

1. **Shared heuristics (same `@aios/shared` module).** `scanUntrustedText` / `firstContentHygieneHit` / `assertMemoryContentAllowed` live in `packages/shared/src/index.ts` (no extra file — MCP strip-types). Covers injection cues, secret-material patterns, and ASCII control characters. Not a new engine.
2. **Context.** After read+truncate, if hygiene hits, **skip** the snippet and emit `content-denied:<rel>:<code>:<detail>`. Path deny-list (`denied:`) remains unchanged.
3. **Memory.** `remember()` calls `assertMemoryContentAllowed` after trim; reject with `memory.content_rejected:<code>:<detail>` (fail closed).
4. **Default on.** Opt-out only via `AIOS_CONTENT_HYGIENE=0|false|off|no` (debug). Production posture is fail-closed.
5. **Scope boundary.** This ADR does **not** add LLM-as-judge, output sanitization, MCP argument scanning, or a dedicated security product surface.

## Consequences

### Positive

- Closes the #447 security-spike checkbox with a concrete control plane behavior
- Reuses one helper across Context and Memory (no duplication)
- Signals remain auditable (`content-denied:` / thrown error codes)

### Trade-offs

- Heuristics false-positive on docs that _discuss_ injection phrases
- Sophisticated attacks can evade pattern lists — expand via evals/ADR amend, not LangGraph-in-core
- Opt-out env can weaken posture if mis-set in shared machines

## Rejected alternatives

| Option                | Reason                                                     |
| --------------------- | ---------------------------------------------------------- |
| Defer with docs only  | Leaves acceptance open without a control                   |
| New security engine   | Violates no-overengineering / agents-as-plugins boundaries |
| LLM judge per snippet | Latency, cost, and non-determinism vs Resource-Aware       |

## References

- [ADR-0025](./0025-model-router-context-budget.md) — path deny + budget
- [ADR-0006](./0006-memory-engine-session.md) — memory store
- [ADR-0029](./0029-ai-harness-mapping.md) — harness mapping
