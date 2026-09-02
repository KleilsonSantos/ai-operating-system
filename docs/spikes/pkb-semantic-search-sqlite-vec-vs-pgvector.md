# Spike: PKB semantic search — sqlite-vec vs pgvector

- **Issue:** [#323](https://github.com/KleilsonSantos/ai-operating-system/issues/323)
- **Subject:** Local vector index for Prompt Knowledge Base (`docs/prompts/**`) only
- **Date:** 2026-08-30
- **ADR follow-up:** [ADR-0032](../adr/0032-pkb-local-vector-index-sqlite-vec.md) (**Accepted**, #326)
- **MCP follow-up:** [#327](https://github.com/KleilsonSantos/ai-operating-system/issues/327)
- **Boundaries:** [rag-boundaries.md](../guides/rag-boundaries.md) (#328)
- **Method:** Architecture + Resource-Aware comparison. **Did not** install Postgres, Docker Desktop, or sqlite-vec binaries in this spike (ADR-0011 / `inspect-before-install`).

## Problem

PKB search today is **textual / tag** (`aios_search_pkb`, #158). Evolution ladder steps 4–5 call for **semantic** search over the catalog — without turning RAG into a second SSOT ([pkb-evolution.md](../prompts/pkb-evolution.md)).

Gate (issue #323): **no vector store in core** until an ADR + volume evidence.

## Volume evidence (this monorepo, 2026-08-30)

| Signal                       | Approx. value                                     |
| ---------------------------- | ------------------------------------------------- |
| Active prompt Markdown files | ~12 under `by-domain/` (+ README / evolution / …) |
| `docs/prompts/` tree size    | ~164 KiB                                          |
| Body bytes (domain assets)   | ~125 KiB                                          |

**Inference:** catalog is **tiny**. Brute-force embed-all + in-memory cosine would work; a store is justified for **ops shape** (rebuildable index under `.aios/`, MCP tool surface) more than for scale. Re-evaluate if the catalog grows past ~1k assets or multi-GB bodies.

## Options compared

| Dimension              | **sqlite-vec** ([asg017/sqlite-vec](https://github.com/asg017/sqlite-vec))  | **pgvector** ([pgvector/pgvector](https://github.com/pgvector/pgvector)) |
| ---------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Process                | SQLite file + loadable extension — **no daemon**                            | Requires **PostgreSQL** server                                           |
| Fit with AIOS layout   | Aligns with `.aios/` local state (Memory ADR-0006 pattern)                  | New always-on service unless operator already runs Postgres              |
| Resource-Aware (macOS) | Low RAM/CPU idle; single file; no Docker by default                         | Postgres + extension = containers/RAM; conflicts ADR-0011 defaults       |
| Concurrency            | Single-writer friendly; fine for local CLI/MCP                              | Multi-client / multi-machine                                             |
| Ops                    | Rebuild index from Git PKB; delete file = reset                             | Migrations, backups, credentials, port conflicts                         |
| Node/TS ergonomics     | Extension loading / native bindings — spike ADR must pick a maintained path | Mature Node clients (`pg` + vector type)                                 |
| Scale ceiling          | Enough for PKB-sized corpora; not a warehouse                               | Better if AIOS becomes multi-tenant server later                         |
| Boundary risk          | Easy to keep scoped to PKB rows only                                        | Temptation to dump Memory/KG/policies into the same DB                   |

### Explicitly out of scope for this spike

- Cloud vector SaaS (Pinecone, etc.) — rejected by [rag-boundaries](../guides/rag-boundaries.md) / no-overengineering until proven
- Embedding **provider** choice (Ollama vs API) — orthogonal; prefer reuse of `@aios/provider` / ADR-0025 if embeddings land
- Replacing textual search — semantic is **additive**

## Recommendation

**Prefer sqlite-vec (or equivalent SQLite-local vector extension) for the first ADR (#326).**

| Why                                                                   | Trade-off                                                                                                                     |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Matches local-first, Resource-Aware, no new daemon                    | Native extension packaging on macOS/Node needs care in the ADR                                                                |
| Index as disposable cache under `AIOS_HOME/.aios/` — Git remains SSOT | Not ideal for shared team server without sync story                                                                           |
| Volume evidence does not justify Postgres                             | Revisit pgvector only if a **pre-existing** Postgres is already operator-owned and multi-user search is a product requirement |

**Do not** start Postgres/Docker only for PKB RAG.

## Proposed ADR sketch (#326) — non-binding

1. Optional package or engine module (e.g. under `@aios/documentation` or thin `@aios/pkb-index`) — **opt-in**, default off.
2. Index path: `{AIOS_HOME}/.aios/pkb-vectors.sqlite` (gitignore via `.aios/`).
3. Rows keyed by PKB `id` + `version`; content = frontmatter + body from `docs/prompts/**` only.
4. Rebuild command / MCP admin path; stale index = warn, not silent SSOT.
5. `aios_search_pkb` gains optional `mode: semantic` when index present; textual path remains default.
6. Fail closed if extension missing — fall back to textual search.

## Anti-patterns

- Installing Postgres “because RAG diagrams show it”
- Indexing FOUNDATION / policies / Memory JSON into the same vector table
- Making semantic search required for Console “green”
- Shipping #327 MCP before #326 ADR Accepted

## Decision for backlog

| Issue | Action after this spike                                                          |
| ----- | -------------------------------------------------------------------------------- |
| #323  | **Done** — recommendation = sqlite-vec-first                                     |
| #326  | **Done** — [ADR-0032](../adr/0032-pkb-local-vector-index-sqlite-vec.md) Accepted |
| #327  | Implement semantic `aios_search_pkb` after this ADR                              |
| #325  | Closed — npm publish catch-up (#325); see `docs/guides/publish-create-agent.md`  |

## References

- [ADR-0011 Resource-Aware](../adr/0011-resource-aware-macos.md)
- [ADR-0006 Memory](../adr/0006-memory-engine-session.md) (local `.aios/` precedent)
- [ADR-0005 Knowledge Graph](../adr/0005-knowledge-graph-heuristic.md) (no embeddings in KG)
- Phase C harness / agent-framework boundaries — vectors deferred until ADR
