# AI harness mapping

> Canonical decision: [ADR-0029](../adr/0029-ai-harness-mapping.md).

## What “harness” means here

An **AI harness** is the structure around a model that defines how an agent thinks, uses tools, remembers context, and passes verification — **beyond** a one-shot prompt. AIOS implements that structure as **governance engines**, not as a chat wrapper.

```text
User request
     │
     ▼
┌──────────────────────────────────────────────┐
│  AIOS harness (control plane)                │
│  policies · brief · skills · context · KG    │
│  memory · MCP caps · hooks · quality gate    │
└──────────────────────────────────────────────┘
     │
     ▼
 Model (capability class → provider binding)
     │
     ▼
 Verified response / recorded run steps
```

## Layer map

| #   | Harness layer   | AIOS component                   | Primary ADR / doc    |
| --- | --------------- | -------------------------------- | -------------------- |
| 1   | User input      | CLI, `@aios/pipeline`, MCP tools | ADR-0003             |
| 2   | System rules    | Policy Engine → brief injection  | Policies + ADR-0008  |
| 3   | Skills / how    | Prompt Engine skill packs        | ADR-0026             |
| 4   | Tools           | MCP `@aios/mcp`, Agent Registry  | ADR-0023, ADR-0024   |
| 5   | Context         | Context Engine + repo scope      | ROADMAP Phase 1      |
| 6   | Knowledge graph | Heuristic KG                     | ADR-0005             |
| 7   | Memory          | Session/project JSON store       | ADR-0006             |
| 8   | Hooks           | Central pipeline hook list       | ADR-0027             |
| 9   | Model           | Capability router                | ADR-0025, ADR-0009   |
| 10  | Verification    | Quality Gate + governance audit  | ADR-0020             |
| 11  | Observability   | JSONL metrics + Prometheus       | ADR-0019, ADR-0028   |
| 12  | Prompt catalog  | PKB (`docs/prompts/`)            | PKB evolution ladder |

## Request flow (simplified)

```text
aios_run_pipeline
  ├─ before/after hooks (opt-in)
  ├─ policy compile → brief
  ├─ skill packs (opt-in)
  ├─ context gather + KG neighbors
  ├─ memory read (workspace scope)
  ├─ agent plugins (registry + deps)
  ├─ provider route (fast|coding|reasoning|…)
  └─ quality gate → response + run steps
```

## What is intentionally deferred

| Capability                           | Why deferred                                  | Next gate             |
| ------------------------------------ | --------------------------------------------- | --------------------- |
| Vector DB / embeddings               | Resource-Aware; Git SSOT sufficient today     | PKB spike + ADR       |
| Memory compression                   | FIFO works; summarize-before-evict is a slice | Memory spike          |
| External web ingestion (e.g. Scrapy) | Wrong stack in core monorepo                  | Optional external job |
| n8n / Composio / CRM                 | Experience & integrations                     | Companion repo        |

See [`pkb-evolution.md`](../prompts/pkb-evolution.md) for the PKB ladder and [`agent-framework-boundaries.md`](../guides/agent-framework-boundaries.md) for AIOS vs third-party agent frameworks.

## Related reading

- [Architecture overview](./overview.md)
- [Control plane vs Companion](../guides/control-plane-companion.md)
- [FOUNDATION](../FOUNDATION.md)
