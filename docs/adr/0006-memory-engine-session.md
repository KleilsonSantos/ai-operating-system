# ADR-0006: Session/project Memory Engine (`@aios/memory`)

- **Status:** Accepted
- **Date:** 2026-07-14
- **Deciders:** Kleilson dos Santos
- **Issue:** #51

## Context

Phase 2 calls for a Memory Engine (session / project). Persistence must be simple, local, and aligned with `workspaceId` (ADR-0004) — no vector DB in this phase.

## Decision

1. Engine **`@aios/memory`**: `remember` · `recall` · `clearMemory` · `listMemoryWorkspaces`.
2. On-disk store: `{AIOS_HOME}/.aios/memory/{workspaceId}.json` (FIFO cap, default 50 entries).
3. `.aios/` in `.gitignore` (local machine state).
4. `PipelineResponse.memory` = short recall when `workspaceId` is present (disable with `includeMemory: false`).
5. MCP: `aios_memory_remember` · `aios_memory_recall` · `aios_memory_clear`.
6. `contractVersion` stays `"1"`.

## Consequences

### Positive

- Project preferences / decisions stay explicit across chats
- Same `workspaceId` key as the registry

### Trade-offs

- No multi-machine sync
- No embeddings (search = substring / tag)

## Rejected alternatives

| Option | Reason |
| --- | --- |
| RAM-only memory | Lost across MCP restarts |
| SQLite/Postgres already | Phase 3 scope |
| Vector store | Overengineering in this phase |

## References

- [ROADMAP Phase 2](../ROADMAP.md)
- [`engines/memory`](../../engines/memory/)
- [ADR-0004](./0004-multi-repo-workspace-registry.md) · [ADR-0005](./0005-knowledge-graph-heuristic.md)
