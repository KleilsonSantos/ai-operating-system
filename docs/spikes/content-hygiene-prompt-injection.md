# Spike: Prompt-injection / content hygiene (#447)

- **Issue:** [#447](https://github.com/KleilsonSantos/ai-operating-system/issues/447)
- **Subject:** Minimal fail-closed hygiene for context assembly + memory writes
- **Date:** 2026-09-13
- **Gates:** [ADR-0006](../adr/0006-memory-engine-session.md) · [ADR-0025](../adr/0025-model-router-context-budget.md) · Resource-Aware
- **Method:** Inspect existing path deny-list + `remember()` validation; compare extend-vs-new-engine; ship heuristic MVP (not a full security product).

## Problem

Issue #447 acceptance includes a **security spike**: hostile / secret-looking text must not silently enter the model context or the durable memory store.

**Facts (pre-slice):**

| Surface        | Existing control                                      | Gap                                            |
| -------------- | ----------------------------------------------------- | ---------------------------------------------- |
| Context Engine | Path deny-list (`.env*`, keys, `secrets/`) — ADR-0025 | Content of otherwise-allowed files not scanned |
| Memory Engine  | Trim + 4000-char truncate                             | No injection / secret / control-char rejection |

## Options

| Option                                     | Behavior                                              | Resource / product fit                           |
| ------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------ |
| **A. Defer + ADR only**                    | Document residual risk; no code                       | Cheap; leaves #447 open                          |
| **B. Heuristic hygiene in `@aios/shared`** | Shared scanner; context skips + signal; memory throws | Small, reusable, fail-closed default             |
| **C. New security engine / LLM judge**     | Separate package or model call per snippet            | Overengineering for MVP; violates resource-first |

## Recommendation → implemented

**B.** Shared `scanUntrustedText` / `assertMemoryContentAllowed` in `@aios/shared` `index.ts` (default **on**; opt-out `AIOS_CONTENT_HYGIENE=0` for debug only). Same-module placement matches MCP strip-types constraint (ADR-0025).

- Context: skip snippet + `content-denied:<path>:<code>:<detail>` signal (alongside existing `denied:` path signals).
- Memory: throw `memory.content_rejected:<code>:<detail>` before persist.
- Not claimed: perfect prompt-injection defense, output filtering, or MCP tool-arg scanning.

## Outcome

| Decision      | Detail                                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Ship          | Heuristic MVP in `@aios/shared` wired to Context + Memory                                                                   |
| Contract      | [ADR-0033](../adr/0033-untrusted-content-hygiene.md)                                                                        |
| Residual risk | Heuristics can false-positive; sophisticated injection may evade — expand patterns or add evals later, not a new engine now |

## References

- External pattern audit: [`docs/audits/external-pattern-integration-analysis.md`](../audits/external-pattern-integration-analysis.md)
- Harness audit (prompt-injection still listed as gap historically): [`docs/audits/AIOS-HARNESS-ARCHITECTURE-AUDIT.md`](../audits/AIOS-HARNESS-ARCHITECTURE-AUDIT.md)
