# RAG boundaries — PKB vs Memory vs Knowledge Graph

> Issue [#328](https://github.com/KleilsonSantos/ai-operating-system/issues/328) · ADRs [0005](../adr/0005-knowledge-graph-heuristic.md) · [0006](../adr/0006-memory-engine-session.md) · PKB [`pkb-evolution.md`](../prompts/pkb-evolution.md)

## In one sentence

**Three different stores, three jobs** — vector/RAG (when it lands) attaches only to the Prompt Knowledge Base catalog, never as a second SSOT for product truth, session memory, or the heuristic graph.

## Boundary table

| Store      | Engine / path                          | What it is                                                           | What it is **not**                   | Search today                                                                                                                                                                                                               |
| ---------- | -------------------------------------- | -------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PKB**    | `docs/prompts/**` + `index.yaml`       | Versioned reusable **prompt assets** (Docs-as-Code)                  | Product SSOT; policies; FOUNDATION   | Textual / tags (`aios_search_pkb`)                                                                                                                                                                                         |
| **Memory** | `@aios/memory` · `.aios/memory/*.json` | Session / project **preferences & decisions** keyed by `workspaceId` | Prompt library; repo structure graph | Substring / tag; hard FIFO (default 50); opt-in deterministic rollup on eviction (`AIOS_MEMORY_COMPRESS=1`) — [ADR-0006](../adr/0006-memory-engine-session.md) / spike [#322](../spikes/memory-compression-before-fifo.md) |

| **Knowledge Graph (KG)** | `@aios/knowledge` | Deterministic **heuristic** Project → module/doc/policy relationships | Embedding index; chat transcript store | Structure / neighbors in context |

Canonical product truth remains: **code → FOUNDATION / ADRs / ROADMAP → policies** (policies beat long prompts). See [`docs/prompts/README.md`](../prompts/README.md).

## Where RAG may attach (future)

| Allowed                                                           | Forbidden                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| Semantic search over **PKB** Markdown + frontmatter (#327 ladder) | Indexing `policies/` or FOUNDATION as “RAG replaces Policy Engine” |
| Optional local vector store behind an **ADR** (Resource-Aware)    | Default cloud vector DB in core (ADR-0011 / no-overengineering)    |
| MCP tool that **references** catalog `id`s                        | Second policy / memory engine inside a RAG library                 |
| Companion or IDE as a **consumer** of PKB search                  | Duplicating Memory or KG inside LlamaIndex/Pinecone as SSOT        |

Evolution ladder (unchanged): [`pkb-evolution.md`](../prompts/pkb-evolution.md) steps 4–7 · spike **sqlite-vec-first** ([#323](https://github.com/KleilsonSantos/ai-operating-system/issues/323) · [spike](../spikes/pkb-semantic-search-sqlite-vec-vs-pgvector.md)) → [ADR-0032](../adr/0032-pkb-local-vector-index-sqlite-vec.md) Accepted (#326) → MCP [#327](https://github.com/KleilsonSantos/ai-operating-system/issues/327).

## Operator mental model

```text
User intent
    │
    ├─► Policy Engine          (must/should — not RAG)
    ├─► Context + KG neighbors (structure — ADR-0005 / #301)
    ├─► Memory recall          (workspace notes — ADR-0006)
    └─► PKB (optional)         (prompt patterns — Docs-as-Code;
                                future: semantic search only here)
```

## Anti-patterns

- “Add Chroma/Pinecone because the architecture diagram shows a vector layer”
- Embedding session memory into the same collection as PKB prompts
- Treating KG node text as a substitute for governed briefs (`compilePrompt`)
- Shipping RAG before [#323](https://github.com/KleilsonSantos/ai-operating-system/issues/323) / [#326](https://github.com/KleilsonSantos/ai-operating-system/issues/326) close the store choice

## Related

- [Agent framework boundaries](./agent-framework-boundaries.md) (AIOS vs LangGraph/LlamaIndex)
- [ADR-0029 harness mapping](../adr/0029-ai-harness-mapping.md)
- [ADR-0030 Visibility / Obsidian](../adr/0030-visibility-plane-obsidian-export.md) — export is a **view**, not a fourth SSOT
- [ADR-0032 PKB local vector index](../adr/0032-pkb-local-vector-index-sqlite-vec.md) — optional sqlite-vec cache for prompts only
