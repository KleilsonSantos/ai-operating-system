# Spike: Visibility Plane + Obsidian export

- **Issue:** [#351](https://github.com/KleilsonSantos/ai-operating-system/issues/351)
- **Subject:** Unified governance visibility and optional Obsidian vault export
- **Date:** 2026-08-25
- **ADR follow-up:** [ADR-0030](../adr/0030-visibility-plane-obsidian-export.md) (Proposed)
- **Method:** Architecture mapping against shipped engines — **no** Obsidian install, **no** Neo4j, **no** new orchestrator in this spike.

## Problem

AIOS already emits **fragments** of operational truth across engines:

| Source                    | What it exposes today                                                     |
| ------------------------- | ------------------------------------------------------------------------- |
| `@aios/knowledge`         | Heuristic KG — summary on pipeline; full graph via `aios_build_knowledge` |
| `@aios/pipeline`          | `PipelineResponse.run` / steps (ADR-0024)                                 |
| `@aios/operational-state` | On-demand snapshot + `events.jsonl` (ADR-0015)                            |
| `@aios/status`            | Agent execution JSONL, health, adoption buckets (Phase 5b)                |
| `@aios/console`           | Health, Attention, Agent Catalog — no topology / run trail                |
| `@aios/governance`        | Audit signals, decisions                                                  |

An operator answering **“what happened on this run, on this scope, and what did it touch?”** must mentally join four surfaces. That gap is the motivation for a **Visibility Plane** — not a 17th runtime engine.

Separately, humans who think in **linked notes** (Obsidian) have no first-party export from AIOS. Grafana/Prometheus already follow the pattern “metrics opt-in, user-owned” (ADR-0021). Obsidian fits the same **experience-plane** boundary (ADR-0014).

## Terminology (informal → product)

| Informal term           | AIOS meaning                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| “Quantum visibility”    | Multi-hop **correlation** from any anchor (`runId`, `scope`, `workspaceId`) across run, KG, policies, agents, events                                         |
| “Polymorphic algorithm” | **Pipeline spine** with shape driven by intent, capability, hooks, plugins — already shipped; formalize workflow templates, do not add a second orchestrator |
| “Obsidian”              | Optional **unidirectional export adapter** — human graph UI, not SSOT                                                                                        |

## What AIOS already covers

Live baseline (this monorepo, 2026-08-25):

- **`aios_build_knowledge`** — heuristic nodes/edges from layout + manifests (ADR-0005)
- **`PipelineResponse.run`** — always populated steps after ADR-0024
- **`getOperationalState`** — governance + git probe + focus workspace
- **Agent execution JSONL** — `kind: agent.execution` for catalog health (Phase 5b)

**Gap:** no single contract that **joins** these for navigation or export.

## Visibility Plane — hypothesis

Thin **correlation layer** (library slice or `@aios/visibility` package), not a workflow engine:

```text
                 correlate({ runId | scope | workspaceId })
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   PipelineRun           KnowledgeGraph      OperationalState
        │                     │                     │
        └────────── agent.execution JSONL ────────┘
                              │
                              ▼
                    VisibilitySnapshot (JSON)
```

### Proposed snapshot fields (additive)

| Field             | Source                                                   |
| ----------------- | -------------------------------------------------------- |
| `anchor`          | Request: `runId` and/or `scope` and/or `workspaceId`     |
| `run`             | `PipelineResponse.run` (if `runId` or latest in session) |
| `knowledge`       | KG summary + node ids matching `scope`                   |
| `operational`     | `getOperationalState` subset                             |
| `agentExecutions` | Filtered JSONL rows for run time window                  |
| `policies`        | Policy ids / must rules applied (reference, not copy)    |

### Delivery ladder

| Step | Ship                                                           | Notes                                    |
| ---- | -------------------------------------------------------------- | ---------------------------------------- |
| 1    | `correlateVisibility()` in package + unit tests                | Pure function; reads existing engines    |
| 2    | MCP `aios_visibility` (read-only, `OBSERVE` privilege)         | Mirrors `aios_operational_state` pattern |
| 3    | Console “Run trail” or “Topology” tab                          | Reuse snapshot; SVG/D3 — no graph DB     |
| 4    | Hook `after:gate` optional `recordOperationalEvent` enrichment | Link run id into events                  |

**Resource-Aware:** on-demand only; no filesystem watchers; cap JSONL scan (e.g. last N lines / time window).

## Polymorphic pipeline — clarify, don’t duplicate

The pipeline is already **polymorphic by configuration**:

| Axis       | Shipped                            | Next slice (optional)             |
| ---------- | ---------------------------------- | --------------------------------- |
| Intent     | `implement.feature`, `fix.bug`, …  | Intent workflow template registry |
| Capability | Model router ADR-0025              | Risk/cost routing (audit P1)      |
| Plugins    | Registry-selected runners ADR-0024 | More runners, same contract       |
| Context    | Budget tiers ADR-0025              | Per-intent gather strategies      |
| Hooks      | Central bus ADR-0027               | Default none                      |

Governance chain (unchanged):

```text
Policy → Capability → Skill → Agent → Tool → Execution → Evidence → Gate → Decision
```

**Reject:** engine named “polymorphic-algorithm”; LangGraph/CrewAI embed (ADR-0029).

## Obsidian export — hypothesis

**Role:** experience adapter — AIOS remains SSOT.

```text
AIOS (control plane)                 Obsidian (operator vault)
────────────────────                 ─────────────────────────
buildKnowledgeGraph()      ─export─►  vault/aios/graph/*.md + [[wikilinks]]
correlateVisibility()      ─export─►  vault/aios/runs/<runId>.md
ADRs / policies (paths)    ─index──►  frontmatter links only (no overwrite of canon)
```

### Export rules

1. **Unidirectional** — AIOS → vault; never ingest Obsidian as memory SSOT (ADR-0006).
2. **Opt-in** — CLI flag / MCP tool; no background sync daemon (ADR-0011).
3. **Overwrite policy** — generated under `.aios/export/obsidian/` or user `--out`; never mutate `docs/adr/` or `policies/`.
4. **Canvas optional** — JSON for pipeline flow (intent → agents → gate); second phase.

### Minimal MVP

- `aios export-obsidian --out ~/vault/aios` (CLI) or MCP `aios_export_obsidian`
- Input: `repoPath`, optional `runId`, optional `fullGraph`
- Output: folder tree of Markdown + YAML frontmatter (`aios_node_id`, `aios_kind`, `aios_path`)

**Defer:** Obsidian plugin in monorepo; bidirectional sync; embeddings because Obsidian has graph view.

## Comparison to adjacent ideas

| Idea                                                      | Relation                                                                                        |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| OpenWiki spike ([#148](../spikes/openwiki-comparison.md)) | External agent wiki — **reject as SSOT**; Obsidian export is **read-only mirror** of AIOS graph |
| Neo4j / graph DB                                          | Rejected ADR-0005 — heuristic in-process graph stays                                            |
| Grafana                                                   | Metrics only (ADR-0021); Visibility Plane is **governance correlation**, not time-series        |
| Companion                                                 | May invoke export; must not duplicate correlate logic (ADR-0014)                                |

## Recommendation

| Option                                 | Decision                                    |
| -------------------------------------- | ------------------------------------------- |
| Visibility Plane correlation API + MCP | **Accept** — Phase 5c slice                 |
| Console topology / run trail           | **Accept** — after snapshot contract stable |
| Obsidian unidirectional export         | **Accept** — opt-in adapter                 |
| Neo4j, embeddings, graph DB            | **Reject** for this slice                   |
| Obsidian as memory/policy SSOT         | **Reject**                                  |
| Second orchestrator for “polymorphism” | **Reject**                                  |

**One-liner:** Give operators **one correlated view** of governance runs and **optional** Obsidian export — without a new brain, graph database, or orchestrator.

## Follow-ups (implementation)

1. Accept [ADR-0030](../adr/0030-visibility-plane-obsidian-export.md) and open tracking issue.
2. Implement `correlateVisibility()` with tests against fixture JSONL + mock run.
3. MCP tool + CLI subcommand behind env/flag.
4. Console tab spike (wireframe only) if issue scoped separately.
5. Document in [`control-plane-companion.md`](../guides/control-plane-companion.md) — export stays out of core engines.
