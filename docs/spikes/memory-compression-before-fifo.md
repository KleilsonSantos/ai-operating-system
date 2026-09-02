# Spike: Memory compression before FIFO eviction

- **Issue:** [#322](https://github.com/KleilsonSantos/ai-operating-system/issues/322)
- **Subject:** Whether `@aios/memory` should summarize/compress old entries before FIFO drop
- **Date:** 2026-08-30
- **Gates:** [ADR-0006](../adr/0006-memory-engine-session.md) · [ADR-0011](../adr/0011-resource-aware-macos.md) / [resource-aware-macos](../policies/resource-aware-macos.md) · no AGPL / no third-party memory fork
- **Boundaries:** [rag-boundaries.md](../guides/rag-boundaries.md) (Memory ≠ PKB RAG ≠ KG)
- **Method:** Architecture + Resource-Aware comparison against current code. **Did not** add LLM calls, new daemons, or external memory libraries in this spike.

## Problem

`remember()` appends to `{AIOS_HOME}/.aios/memory/{workspaceId}.json`. On write, `writeStore` keeps only the newest `maxEntries` (default **50**) via:

```ts
entries = entries.slice(entries.length - maxEntries);
```

Oldest rows are **deleted with no archive and no summary**. Issue #322 asks whether to **compress** those tails first (pattern only — not a Mem0/LangChain memory port).

## Current contract (fact)

| Signal                       | Value                                                                |
| ---------------------------- | -------------------------------------------------------------------- |
| Store shape                  | JSON array of `{ id, content, createdAt, tags? }`                    |
| Cap                          | `maxEntries` default 50                                              |
| Per-entry content            | Truncated to **4000** chars on write                                 |
| Search                       | Substring / tag (`recall`) — **no embeddings** (ADR-0006)            |
| Sync                         | Local machine only; `.aios/` gitignored                              |
| Eviction                     | Hard FIFO drop on overflow                                           |
| Theoretical max file (worst) | ≈ 50 × 4 KiB content ≈ **200 KiB** body + JSON overhead — still tiny |

**Inference:** the store is already Resource-Aware-sized. Pain is **loss of durable preferences/decisions**, not disk or query latency. Compression is a **retention** question, not a scale question.

## Options compared

| Dimension      | **A. Status quo (hard FIFO)** | **B. Deterministic rollup (no LLM)**                                                    | **C. LLM summarize on eviction**                                   | **D. Dual-tier hot + cold archive**     | **E. Third-party memory lib**         |
| -------------- | ----------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------- | ------------------------------------- |
| Behavior       | Drop oldest                   | Merge oldest _K_ into one `memory.rollup` entry (bullets / truncated join) before slice | Call provider to summarize dropped batch                           | Hot FIFO + append-only cold file        | Mem0 / custom agent memory frameworks |
| CPU / I/O      | Minimal                       | Cheap string ops on write path                                                          | Provider latency + tokens + local/Ollama load                      | Extra file + dual recall                | New dependency surface                |
| Resource-Aware | Best                          | Good                                                                                    | Weak unless rare + opt-in                                          | Acceptable if cold is optional          | Usually overkill                      |
| Correctness    | Silent loss                   | Lossy but **predictable**; tags/`createdAt` of rollup need a rule                       | Better prose; **hallucination / drift** risk on prefs              | No loss if cold kept                    | Varies; often AGPL / cloud-shaped     |
| ADR-0006 fit   | Exact today                   | Additive; needs small schema/tag convention                                             | Conflicts “simple local” unless strictly opt-in + offline-tolerant | Stretch; second store path              | Rejected for MVP gate                 |
| Ops            | None                          | Opt-in flag / env; default off                                                          | Needs provider health; fails open → fall back to FIFO              | Rebuild/clear semantics for two files   | License + maintenance risk            |
| Boundary risk  | None                          | Low if rollup stays in Memory JSON only                                                 | Temptation to embed Memory into PKB RAG                            | Low if cold stays under `.aios/memory/` | High (second SSOT)                    |

### Explicitly out of scope for this spike

- Vectorizing Memory into the PKB sqlite index ([rag-boundaries](../guides/rag-boundaries.md))
- Multi-machine sync / Postgres for Memory
- Raising `maxEntries` alone as a “solution” (delays loss; does not preserve semantics)
- Forking or wrapping AGPL memory products

## Recommendation

**Prefer A for default. Prototype B only as an opt-in follow-up if operators report useful prefs being dropped. Do not ship C or E in core. Defer D until B is proven insufficient.**

| Why                                                                                    | Trade-off                                                               |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Volume evidence does not justify always-on compression                                 | Silent FIFO loss remains until opt-in lands                             |
| Deterministic rollup preserves **some** history without provider cost or AGPL          | Rollups are lossy and can pollute `recall` substring noise if unbounded |
| LLM-on-evict couples local JSON durability to model availability and burns battery/CPU | Better narrative summaries — wrong layer for a session preference log   |
| Keeps Memory job clear vs PKB semantic search (#327)                                   | Product still needs discipline: write short, tagged prefs intentionally |

**Anti-patterns**

- Summarizing Memory with a cloud API on every `remember` overflow “for quality”
- Installing a memory framework because competitor demos show one
- Treating rollup text as FOUNDATION / policy SSOT
- Auto-promoting cold archive into pipeline context without `includeMemory` controls

## Proposed follow-up (non-binding) — only if implementing B

1. **Opt-in** via `MemoryOptions.compressOnEvict?: boolean` or `AIOS_MEMORY_COMPRESS=1` (default **off**).
2. When `entries.length > maxEntries`, take the oldest `overflow` rows (or fixed `K`, e.g. 10), build one entry:
   - `tags: ['memory.rollup']` (+ preserve union of source tags, capped)
   - `content`: deterministic bullet list of `createdAt + truncated content` under a hard byte budget (e.g. ≤ 4000)
   - `id`: new id; optional `rolledFrom: string[]` later if schema extends (YAGNI — put ids in content header first)
3. Replace those rows with the single rollup, then apply FIFO slice to `maxEntries`.
4. `recall` unchanged; callers may filter `tag=memory.rollup`.
5. **No ADR** until shipping B — then amend ADR-0006 with one bullet (opt-in rollup). Status quo needs no ADR change.
6. Tests: overflow with compress on/off; content budget; default remains hard drop.

## Decision for backlog

| Issue | Action after this spike                                                                     |
| ----- | ------------------------------------------------------------------------------------------- |
| #322  | **Done** — recommendation = keep FIFO default; optional deterministic rollup only if needed |
| —     | **Do not** open an ADR now                                                                  |
| —     | **Optional later:** feature issue “opt-in Memory FIFO rollup” if product asks for it        |
| #325  | Closed — npm `@aios-platform/*` catch-up (0.48.1 → 0.48.3, Sep 2026)                        |

## References

- Implementation: [`engines/memory/src/index.ts`](../../engines/memory/src/index.ts) (`writeStore` FIFO)
- Types: `MemoryEntry` / `MemoryStore` in `@aios/shared`
- Related shipped: PKB semantic path is **not** a substitute for Memory retention (#327 / ADR-0032)
