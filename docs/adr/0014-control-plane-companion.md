# ADR-0014: AIOS as control plane · Companion as a separate experience

- **Status:** Accepted
- **Date:** 2026-07-16
- **Deciders:** Kleilson dos Santos

## Context

The “Jarvis Dev” vision (voice, live environment state, open IDE/Docker) is larger than AIOS’s current mission: **AI governance in the SDLC**. Mixing both in the same product/release causes:

- duplicated engines (memory/policy/knowledge);
- collision with “do not replace the IDE” (ROADMAP / FOUNDATION);
- Resource-Aware pressure (watchers + voice + containers on a 16GB Mac);
- coupled release cycles without need.

Relevant industry patterns: **control plane vs data/execution plane** (Hashicorp Well-Architected and equivalents); **MCP host ↔ multiple servers** ([official MCP architecture](https://modelcontextprotocol.io/docs/learn/architecture)); repo boundary aligned with coupling/release (hybrid monorepo/polyrepo practice).

## Decision

1. **AIOS (`ai-operating-system`)** remains the **control plane**: policies, intent, on-demand context, memory/KG, prompt brief, governance/docs audit, quality, MCP `aios_*`, governance console.
2. **Companion / cognitive experience** (voice, Conversation Manager, IDE/Docker/Git watchers, “Jarvis” UX) is a **client product** — it consumes AIOS via stable contracts (`@aios/pipeline`, `@aios/mcp`, CLI). It does **not** reimplement Policy/Memory/Knowledge/Prompt.
3. **Short term:** Operational State / light event evolutions that strengthen the control plane may live in the AIOS monorepo (`engines/` / `apps/`), without voice and without controlling the IDE.
4. **Medium term:** when the Companion experience has its own lifecycle (voice, watchers, desktop automation), create a **separate repository** (name TBD: e.g. `aios-companion`) that talks to AIOS — do **not** embed AIOS as a folder in another monorepo (reaffirms ADR-0001).
5. External integrations (GitHub, filesystem, etc.) prefer an **MCP mesh** on the Companion host or dedicated servers — AIOS does not need to absorb every tool.

```text
Companion (UX / events / voice)
        │  MCP + pipeline contract
        ▼
AIOS control plane (governance)
        │
        ▼
Capabilities / other MCP servers (IDE, Git, …)
```

## Consequences

### Positive

- Clear, stable AIOS mission (ADR-0001)
- Scalability: companion scales/releases independently
- Agility: AIOS keeps shipping governance without blocking UX
- Performance / Resource-Aware: fewer processes in the core
- Zero engine duplication

### Trade-offs

- Two artifacts to coordinate once the companion exists
- Requires contract discipline (`contractVersion`, versioned tools)

## Rejected alternatives

| Option                                          | Reason                                                      |
| ----------------------------------------------- | ----------------------------------------------------------- |
| Merge Jarvis + AIOS into one monolithic product | Confuses mission; violates IDE out-of-scope; Resource-Aware |
| Embed AIOS as a companion folder                | Rejected by ADR-0001                                        |
| Duplicate Memory/Policy in the companion        | Redundancy and truth drift                                  |
| Long Cursor prompts only, no platform           | Already rejected at AIOS genesis                            |

## References

- [ADR-0001](./0001-standalone-platform.md)
- [ADR-0011](./0011-resource-aware-macos.md)
- [FOUNDATION](../FOUNDATION.md)
- [MCP Architecture](https://modelcontextprotocol.io/docs/learn/architecture)
- Guide: [`docs/guides/control-plane-companion.md`](../guides/control-plane-companion.md)
