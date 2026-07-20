# ADR-0015: Operational State MVP (control plane)

- **Status:** Accepted
- **Date:** 2026-07-16
- **Deciders:** Kleilson dos Santos
- **Issue:** #84

## Context

The Companion (ADR-0014) needs a **stable operational state** on the control plane — without voice, without aggressive watchers, without controlling IDE/Docker. `@aios/status` covers Health/Attention; a unified snapshot is still missing (light git + focus workspace + memory/governance bridge) consumable by MCP/CLI/console.

## Decision

1. **`@aios/operational-state`**: `getOperationalState({ homePath, workspaceId? })` — aggregates `getGovernanceStatus`, `probeGit` (on-demand, short timeout), `listDecisions`, workspace focus; `mode: 'on-demand'`; explicit `boundaries` (`voice`/`ideControl`/`dockerControl` = false).
2. **Cheap event hook:** `recordOperationalEvent` → `.aios/state/events.jsonl` (append on-demand; no polling).
3. MCP: `aios_operational_state`. CLI: `--operational-state`. Console Try it: `operational_state`.
4. Distinct from Companion: this engine does **not** open the IDE, start Docker, or do voice.

## Consequences

### Positive

- Clear contract for the future Companion
- Reuses Status/Governance; zero new services
- Aligned with Resource-Aware (ADR-0011)

### Trade-offs

- Git via local `git` CLI (absent → `available: false`)
- Point-in-time snapshot — not continuous “live state” (that stays in Companion)

## Rejected alternatives

| Option                                       | Reason                                       |
| -------------------------------------------- | -------------------------------------------- |
| Git/IDE watchers in AIOS                     | Resource-Aware + outside mission (ADR-0014)  |
| Expand only `@aios/status` without an engine | Mixes health console with Companion contract |
| Embed voice in state                         | Companion scope                              |

## References

- [ADR-0014](./0014-control-plane-companion.md)
- [ADR-0010](./0010-governance-console.md)
- [ADR-0011](./0011-resource-aware-macos.md)
- Guide: [`docs/guides/control-plane-companion.md`](../guides/control-plane-companion.md)
