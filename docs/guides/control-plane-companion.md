# Control plane (AIOS) · Companion (experience)

> Canonical: [ADR-0014](../adr/0014-control-plane-companion.md).

## In one sentence

**AIOS governs**; the **Companion converses and operates the experience** — without copying engines.

## Who does what

| Capability | AIOS | Companion |
| --- | --- | --- |
| Policies / quality / brief | ✅ | consumes |
| Memory / KG / docs audit | ✅ | consumes |
| Governance console | ✅ | optional deep-link |
| Voice / continuous dialogue | ❌ | ✅ |
| IDE/Docker/Git watchers | ❌ (MVP) | ✅ (when it exists) |
| Open IDE / start containers | ❌ (out of scope) | ✅ with Resource-Aware |

## Contracts

1. MCP `@aios/mcp` — `aios_*` tools
2. `@aios/pipeline` — `runPipeline` / `contractVersion`
3. CLI `aios` — smoke and automation

The Companion does **not** import `engines/*` internals as a stable public API; it uses the contracts above.

## Suggested delivery order

1. **In AIOS:** Operational State / light events — `@aios/operational-state` (`getOperationalState`, `aios_operational_state`) — [ADR-0015](../adr/0015-operational-state.md).
2. **Companion repo:** [`aios-companion`](https://github.com/KleilsonSantos/aios-companion) — Conversation Manager + CLI/MCP consumption (chat + provider) · tracking [#90](https://github.com/KleilsonSantos/ai-operating-system/issues/90).
3. **Capabilities** in the Companion — `companion caps` (git / github via on-demand CLI; no watchers; no duplicated engines) ✅
4. IDE/Docker watchers / voice — only with Resource-Aware and inspect-before-install.

## Companion contract (minimum)

| Tool / API | Use |
| --- | --- |
| `aios_operational_state` | Snapshot: focus, git, health, memory/governance |
| `aios_governance_status` | Detailed health + attention |
| `aios_memory_*` / `aios_governance_*` | Memory and decisions |
| `runPipeline` / `contractVersion` | Governed workflow |

Do not import `engines/*` as a public API.

## Anti-patterns

- A second Policy Engine in the companion
- Aggressive CPU/RAM polling “to look alive”
- An MCP gateway that merges hundreds of tools without scoping
