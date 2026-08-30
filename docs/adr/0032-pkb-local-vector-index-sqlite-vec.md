# ADR-0032: Optional local vector index for PKB (sqlite-vec)

- **Status:** Accepted
- **Date:** 2026-08-30
- **Deciders:** Kleilson dos Santos
- **Issue:** [#326](https://github.com/KleilsonSantos/ai-operating-system/issues/326)
- **Spike:** [pkb-semantic-search-sqlite-vec-vs-pgvector](../spikes/pkb-semantic-search-sqlite-vec-vs-pgvector.md) (#323)

## Context

PKB search is textual/tag only (`aios_search_pkb`, #158). The evolution ladder ([pkb-evolution.md](../prompts/pkb-evolution.md)) and [rag-boundaries](../guides/rag-boundaries.md) allow **semantic** retrieval over `docs/prompts/**` only — never as a second SSOT for FOUNDATION, policies, Memory, or the heuristic KG.

Spike #323 compared **sqlite-vec** vs **pgvector** under Resource-Aware (ADR-0011). Catalog volume today is tiny (~164 KiB). Standing up Postgres solely for PKB RAG violates `resource-first` / `reuse-before-create`.

## Decision

1. **Store choice.** The first optional PKB vector index uses a **SQLite + sqlite-vec** (or equivalent maintained SQLite vector extension) file — **no Postgres daemon** by default.
2. **Scope.** Index rows come **only** from `docs/prompts/**` (frontmatter + body), keyed by PKB `id` + `version`. Forbidden: policies, FOUNDATION, ADRs-as-SSOT, Memory JSON, KG dumps.
3. **Location.** `{AIOS_HOME}/.aios/pkb-vectors.sqlite` (local machine state; already covered by `.aios/` gitignore patterns). Git PKB remains SSOT; the file is a **rebuildable cache**.
4. **Default off.** Semantic mode is **opt-in**. Missing extension, missing file, or rebuild failure → **fall back to textual search** (warn, do not fail the product “green”).
5. **API shape (implementation #327).** Extend `aios_search_pkb` (and CLI equivalent if any) with an optional semantic mode when the index is present. Prefer a thin module under `@aios/documentation` (or a small dedicated package) — **not** a new runtime engine and **not** embedding LlamaIndex/Pinecone into core.
6. **Embeddings.** Provider choice reuses `@aios/provider` / capability routing (ADR-0025 / ADR-0031) when chat/embed is needed; operators may use local Ollama. This ADR does **not** require a cloud embedding API.
7. **pgvector.** Deferred until there is a product need for multi-user remote search **and** an operator-owned Postgres already in use — do not install Postgres “for the diagram.”

## Consequences

### Positive

- Aligns with local-first Memory layout (ADR-0006) and ADR-0011
- Clear boundary: vectors attach to PKB only ([rag-boundaries](../guides/rag-boundaries.md))
- Keeps textual search as the reliable default

### Trade-offs

- Native sqlite-vec packaging on Node/macOS needs care in #327 (extension load path)
- Single-writer SQLite is enough for local CLI/MCP, not a shared team server
- Tiny corpus could use in-memory vectors; SQLite still preferred for disposable on-disk cache and rebuild UX

## Rejected alternatives

| Option                         | Reason                                               |
| ------------------------------ | ---------------------------------------------------- |
| pgvector / Postgres by default | Heavy daemon; Resource-Aware; scale not justified    |
| Cloud vector SaaS in core      | Overengineering; second SSOT risk                    |
| Index Memory / KG / policies   | Violates rag-boundaries / policies > prompts         |
| Semantic required for health   | Forces installs; Console must stay warn-not-fail     |
| New “RAG engine” package now   | YAGNI — extend documentation/PKB search first (#327) |

## Implementation notes (non-normative for #327)

- Rebuild: scan `docs/prompts/by-domain/**/*.md` + `index.yaml` consistency checks
- Stale index: compare content hash / `updated_at` → warn + rebuild hint
- Capability: read-only search; rebuild/write may require SAFE_WRITE consent if exposed via MCP

## References

- [Spike #323](../spikes/pkb-semantic-search-sqlite-vec-vs-pgvector.md)
- [RAG boundaries](../guides/rag-boundaries.md) (#328)
- [ADR-0006 Memory](./0006-memory-engine-session.md) · [ADR-0011 Resource-Aware](./0011-resource-aware-macos.md)
- [ADR-0005 Knowledge Graph](./0005-knowledge-graph-heuristic.md) (heuristic, no embeddings)
- Follow-up: [#327](https://github.com/KleilsonSantos/ai-operating-system/issues/327) MCP/CLI semantic search
