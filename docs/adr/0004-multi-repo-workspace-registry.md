# ADR-0004: Multi-repository registry (`@aios/workspace`)

- **Status:** Accepted
- **Date:** 2026-07-14
- **Deciders:** Kleilson dos Santos
- **Issue:** #43

## Context

Phase 2 calls for onboarding multiple repositories. The core already accepts `repoPath`, but integrators (MCP, CLI) need **stable ids** and a versionable registry file — without hardcoding absolute paths on every call.

## Decision

1. **Canonical file** `workspaces/aios.workspaces.json` (or `aios.workspaces.json` at the root / walk-up), shape:

```json
{
  "workspaces": [{ "id": "aios", "name": "AI Operating System", "path": ".", "default": true }]
}
```

2. **Engine** `@aios/workspace`: `loadWorkspaces` / `resolveWorkspace(id?)`.
3. **`PipelineRequest.workspaceId`** (optional). Priority: explicit `repoPath` > workspace resolve > `cwd`.
4. **MCP** `aios_list_workspaces` + `workspaceId` on `aios_run_pipeline` / `aios_load_policies`.
5. `contractVersion` stays `"1"` (additive optional field; does not break clients).

Relative paths in the registry under `workspaces/` resolve against the **AIOS monorepo root** (parent of `workspaces/`).

## Consequences

### Positive

- Onboarding: add an id + path in the JSON
- MCP/CLI share the same resolve
- Prepares Knowledge Graph / Memory per `workspaceId`

### Trade-offs

- One more engine in the monorepo
- Machine-absolute paths may still appear in the registry (documented as OK for a local clone)

## Rejected alternatives

| Option                                  | Reason                            |
| --------------------------------------- | --------------------------------- |
| Env `AIOS_REPO` only                    | No catalog / multi-target         |
| Automatic discover under `~/Projects/*` | Noise; no explicit intents        |
| Bump `contractVersion` to 2             | Unnecessary for an optional field |

## References

- [ROADMAP Phase 2](../ROADMAP.md)
- [`engines/workspace`](../../engines/workspace/)
- [ADR-0003](./0003-pipeline-integration-contract.md)
