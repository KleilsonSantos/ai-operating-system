# ADR-0005: Heuristic Knowledge Graph (`@aios/knowledge`)

- **Status:** Accepted
- **Date:** 2026-07-14
- **Deciders:** Kleilson dos Santos
- **Issue:** #47

## Context

Phase 2 calls for a basic Knowledge Graph (Project → … relationships). Embeddings / LLM would make the core slow, opaque, and provider-dependent — incompatible with the “engines first, short prompts” policy.

## Decision

1. Engine **`@aios/knowledge`** with deterministic `buildKnowledgeGraph({ repoPath })`.
2. Nodes: `project` · `module` · `package` · `engine` · `doc` · `policy` · `workspace` · `infra` · `api` · `database`.
3. Edges: `contains` · `depends_on` (workspace:*) · `documents`.
4. Sources: monorepo layout (`packages`/`engines`/`apps`), canonical docs, policies, docker/Compose, API/DB deps in `package.json`.
5. `PipelineResponse.knowledge` = **summary** (`nodeCount` / `edgeCount` / `kinds` / `signals`). Full graph via MCP `aios_build_knowledge` (`full: true`).
6. `contractVersion` stays `"1"` (additive field).

## Consequences

### Positive

- Auditable, offline, cheap
- Feeds future Context/Memory by `workspaceId` + nodes

### Trade-offs

- Shallow heuristic (no deep code typing)
- `depends_on` only via `workspace:*` + dep hints

## Rejected alternatives

| Option | Reason |
| --- | --- |
| Embeddings already in MVP | Phase 3 scope / cost |
| Neo4j / external store | Premature infra |
| Markdown docs only, no graph | Little value for orchestration |

## References

- [ROADMAP Phase 2](../ROADMAP.md)
- [`engines/knowledge`](../../engines/knowledge/)
- [ADR-0004](./0004-multi-repo-workspace-registry.md)
