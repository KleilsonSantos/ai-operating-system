# ADR-0030: Visibility Plane and Obsidian export adapter

- **Status:** Accepted
- **Date:** 2026-08-25
- **Accepted:** 2026-08-29
- **Deciders:** Kleilson dos Santos
- **Issue:** [#351](https://github.com/KleilsonSantos/ai-operating-system/issues/351)
- **Spike:** [`docs/spikes/visibility-plane-obsidian-export.md`](../spikes/visibility-plane-obsidian-export.md)

## Context

AIOS ships governance data across multiple engines: heuristic Knowledge Graph ([ADR-0005](./0005-knowledge-graph-heuristic.md)), pipeline run/steps ([ADR-0024](./0024-execution-state-capability-registry.md)), operational state ([ADR-0015](./0015-operational-state.md)), agent execution JSONL (Phase 5b), and Console health views ([ADR-0010](./0010-governance-console.md)). None of these **correlate** into one navigable snapshot.

Operators need to answer: _what ran, on what scope, which graph nodes and policies were involved, and what evidence was recorded?_ — without opening four tools.

Some operators also use **Obsidian** (or similar linked-note tools) for human exploration. AIOS should support an **optional, unidirectional export** — the same pattern as optional Grafana for metrics ([ADR-0021](./0021-prometheus-metrics-export.md)) and experience features in the Companion ([ADR-0014](./0014-control-plane-companion.md)).

Informal terms (“quantum visibility”, “polymorphic algorithm”) map to **correlation** and **existing pipeline polymorphism** — not new product vocabulary.

## Decision

1. **Visibility Plane (correlation slice).** Add a thin correlation API (package slice, e.g. `@aios/visibility` or `@aios/status` extension) that builds a **`VisibilitySnapshot`** from existing engines — no new workflow runtime.
   - Anchors: `runId`, `scope`, and/or `workspaceId` (at least one required).
   - Inputs: `PipelineRun`, KG summary/nodes for scope, `OperationalState` subset, filtered agent-execution JSONL, policy references.
   - Mode: **on-demand** only ([ADR-0011](./0011-resource-aware-macos.md)); capped JSONL scan.
2. **MCP + CLI surface.** Read-only tool `aios_visibility` (privilege ≤ `OBSERVE`) and CLI flag/subcommand mirroring `aios_operational_state` / `aios_build_knowledge`.
3. **Console (Phase 5c).** Optional “Run trail” or “Topology” view consuming `VisibilitySnapshot` — SVG/client graph; **no** external graph database.
4. **Obsidian export adapter (opt-in).** Unidirectional export to a user-specified vault directory:
   - Markdown + YAML frontmatter + `[[wikilinks]]` from KG nodes/edges.
   - Optional per-run note when `runId` is provided.
   - Output under user `--out` or `.aios/export/obsidian/` — **never** overwrite canonical `docs/adr/` or `policies/`.
5. **Pipeline polymorphism stays in the spine.** Intent, capability router, hooks, and plugins ([ADR-0025](./0025-model-router-context-budget.md), [ADR-0027](./0027-pipeline-hook-bus.md), [ADR-0024](./0024-execution-state-capability-registry.md)) already provide behavioral variation. Future **intent workflow templates** extend `@aios/intent` — not a separate “polymorphic engine”.
6. **SSOT boundaries unchanged.** Memory ([ADR-0006](./0006-memory-engine-session.md)), policies, FOUNDATION/ADRs remain authoritative. Obsidian vault is a **view**, not ingestion source.

### VisibilitySnapshot (sketch)

```typescript
type VisibilitySnapshot = {
  anchor: { runId?: string; scope?: string; workspaceId?: string };
  generatedAt: string;
  run?: PipelineRun;
  runLookup?: 'provided' | 'unavailable';
  knowledge: KnowledgeGraphSummary & { matchedNodeIds?: string[] };
  operational?: Pick<OperationalState, 'focus' | 'governance' | 'boundaries' | 'summary'>;
  agentExecutions?: AgentExecutionRecord[];
  policyRefs?: string[];
  trail: VisibilityTrailItem[];
};
```

Shipped MVP (`@aios/visibility`): `correlateVisibility`, MCP `aios_visibility`, CLI `--visibility`. Console Run trail and Obsidian export remain follow-ups.

Exact shape is additive; `contractVersion` on pipeline responses stays `"1"` unless a breaking change is justified elsewhere.

## Consequences

### Positive

- Single contract for “what happened” across governance layers
- Console and Companion can share one snapshot
- Obsidian users get a first-party export without Obsidian in the monorepo runtime
- Aligns with harness mapping ([ADR-0029](./0029-ai-harness-mapping.md)) — fills the “inputs & outputs / observability of governance” gap without a 16th engine

### Trade-offs

- Correlation is **heuristic** — KG remains shallow (ADR-0005); no semantic join until a future PKB/RAG ADR
- JSONL time-window scans are approximate under high volume — caps required
- Obsidian Canvas export is optional second phase

## Rejected alternatives

| Option                                                     | Reason                                      |
| ---------------------------------------------------------- | ------------------------------------------- |
| Neo4j / embedded graph DB                                  | Rejected ADR-0005; Resource-Aware           |
| Obsidian as memory or policy SSOT                          | Violates ADR-0006 / policy engine authority |
| New “quantum-visibility” or “polymorphic-algorithm” engine | Redundant with pipeline + correlation slice |
| Bidirectional Obsidian sync                                | Drift risk; Companion scope creep           |
| Background vault watcher / daemon                          | ADR-0011 Resource-Aware                     |
| Embeddings in MVP for graph export                         | Deferred PKB ladder; spike scope            |

## References

- [Spike: Visibility Plane + Obsidian export](../spikes/visibility-plane-obsidian-export.md)
- [ADR-0005](./0005-knowledge-graph-heuristic.md) — heuristic KG
- [ADR-0014](./0014-control-plane-companion.md) — control plane vs experience
- [ADR-0015](./0015-operational-state.md) — operational snapshot
- [ADR-0024](./0024-execution-state-capability-registry.md) — run/steps
- [ADR-0029](./0029-ai-harness-mapping.md) — harness layers
- [Agent runtime evolution audit](../audits/agent-runtime-evolution-analysis-2026-08.md)
- [ROADMAP Phase 5c](../ROADMAP.md)
