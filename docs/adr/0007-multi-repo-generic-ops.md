# ADR-0007: Generic multi-repo (ops over the registry)

- **Status:** Accepted
- **Date:** 2026-07-14
- **Deciders:** Kleilson dos Santos
- **Issue:** #55

## Context

Phase 2 delivered registry + resolve (ADR-0004). Phase 3 calls for **generic multi-repo**: any registered workspace must be operable by the same core (registry CRUD, health-check, batch pipeline) — without assuming the AIOS monorepo.

## Decision

1. Extend `@aios/workspace`: `upsertWorkspace` · `removeWorkspace` · `validateWorkspace` · `listValidatedWorkspaces`.
2. `WorkspaceEntry.tags?` for light classification.
3. `@aios/pipeline.runAcrossWorkspaces({ input, workspaceIds? })` → per-workspace summaries.
4. MCP: `aios_workspace_upsert` · `aios_workspace_remove` · `aios_workspace_validate` · `aios_run_across_workspaces`.
5. Validation “ok” = path exists + is a directory + (`.git` **or** `package.json` **or** monorepo/docs marker).
6. `contractVersion` stays `"1"`.

## Consequences

### Positive

- Onboarding a second repo = upsert + validate
- Same Governance / KG / Memory per `workspaceId`

### Trade-offs

- No remote clone / auth in this slice
- Batch is sequential (simplicity)

## Rejected alternatives

| Option                             | Reason                               |
| ---------------------------------- | ------------------------------------ |
| Automatic discovery `~/Projects/*` | Noise (already rejected in ADR-0004) |
| Mandatory parallel orchestration   | Premature complexity                 |

## References

- [ADR-0004](./0004-multi-repo-workspace-registry.md)
- [ROADMAP Phase 3](../ROADMAP.md)
