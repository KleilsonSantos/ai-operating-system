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

| #   | Harness layer   | AIOS component                         | Primary ADR / doc         |
| --- | --------------- | -------------------------------------- | ------------------------- |
| 1   | User input      | CLI, `@aios/pipeline`, MCP tools       | ADR-0003                  |
| 2   | System rules    | Policy Engine → brief injection        | Policies + ADR-0008       |
| 3   | Skills / how    | Prompt Engine skill packs              | ADR-0026                  |
| 4   | Tools           | MCP `@aios/mcp`, Agent Registry        | ADR-0023, ADR-0024        |
| 5   | Context         | Context Engine + repo scope + hygiene  | ROADMAP Phase 1, ADR-0033 |
| 6   | Knowledge graph | Heuristic KG                           | ADR-0005                  |
| 7   | Memory          | Session/project JSON + write hygiene   | ADR-0006, ADR-0033        |
| 8   | Hooks           | Central pipeline hook list             | ADR-0027                  |
| 9   | Model           | Capability router                      | ADR-0025, ADR-0009        |
| 10  | Verification    | Quality Gate + governance audit        | ADR-0020                  |
| 11  | Observability   | JSONL metrics + run store + Prometheus | ADR-0019, ADR-0028, #447  |
| 12  | Prompt catalog  | PKB (`docs/prompts/`)                  | PKB evolution ladder      |

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
  └─ quality gate → response + run steps + DecisionRecord ledger (ADR-0034)
  └─ read: MCP `aios_get_run_decisions` / CLI `--get-run-decisions` (#502)
```

## Shipped opt-in (not default pipeline context)

| Capability             | Shipped as                                    | Notes                                    |
| ---------------------- | --------------------------------------------- | ---------------------------------------- |
| PKB semantic search    | `aios_search_pkb` (`mode=semantic`), ADR-0032 | Local `.aios/pkb-vectors.sqlite`; opt-in |
| Memory rollup on evict | `AIOS_MEMORY_COMPRESS=1` (`v0.48.4`)          | FIFO still default                       |
| Content hygiene        | Default on (`AIOS_CONTENT_HYGIENE`); ADR-0033 | Context skip + memory reject             |

## What is intentionally deferred

| Capability                           | Why deferred                      | Next gate             |
| ------------------------------------ | --------------------------------- | --------------------- |
| Embeddings in Context Engine / KG    | Heuristic KG + denylist by design | ADR if product needs  |
| External web ingestion (e.g. Scrapy) | Wrong stack in core monorepo      | Optional external job |
| n8n / Composio / CRM                 | Experience & integrations         | Companion repo        |

See [`pkb-evolution.md`](../prompts/pkb-evolution.md) for the PKB ladder and [`agent-framework-boundaries.md`](../guides/agent-framework-boundaries.md) for AIOS vs third-party agent frameworks.

## Related reading

- [Architecture overview](./overview.md)
- [Control plane vs Companion](../guides/control-plane-companion.md)
- [FOUNDATION](../FOUNDATION.md)
- [AIOS glossary (pt-BR, owner orientation, non-SSOT)](../../owner/glossario-aios.md)
