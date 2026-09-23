# Agent framework boundaries — AIOS vs market stacks

> Canonical: [ADR-0029](../adr/0029-ai-harness-mapping.md) · [ADR-0001](../adr/0001-standalone-platform.md) · [ADR-0014](../adr/0014-control-plane-companion.md).

## In one sentence

**AIOS is the SDLC governance harness**; LangGraph/CrewAI/LlamaIndex-style products are **optional patterns or external runtimes** — not replacements for `@aios/pipeline`.

## Boundary table

| Concern                   | AIOS (this repo)              | Companion (`aios-companion`) | External framework        |
| ------------------------- | ----------------------------- | ---------------------------- | ------------------------- |
| Policies & quality        | ✅ Policy Engine              | consumes                     | ❌ do not duplicate       |
| Pipeline / run steps      | ✅ `@aios/pipeline`           | consumes                     | ❌ not embedded           |
| Agents                    | ✅ plugins via Agent Registry | may invoke                   | Crew roles ≠ AIOS agents  |
| MCP tools                 | ✅ `aios_*` server            | host + bridge                | framework tool adapters   |
| Memory / KG               | ✅ engines                    | consumes                     | ❌ not second SSOT        |
| PKB prompts               | ✅ `docs/prompts/`            | may search/display           | RAG libs stay optional    |
| Voice / watchers          | ❌                            | ✅ when shipped              | n/a                       |
| n8n / Composio / CRM      | ❌                            | ✅ caps / integrations       | operator choice           |
| LangGraph / CrewAI graphs | ❌ core                       | ❌                           | reference only            |
| Vector DB default         | ❌ until ADR                  | optional client cache        | Pinecone etc. not default |

## LangGraph, CrewAI, LlamaIndex

These frameworks solve **general agent orchestration and RAG apps**. AIOS solves **governance for software engineering**:

- **Reuse ideas** — state machines, role delegation, retrieval pipelines — in ADRs and spikes.
- **Do not embed** as the primary orchestrator; that violates standalone mission ([ADR-0001](../adr/0001-standalone-platform.md)) and duplicates `runPipeline`.
- **LlamaIndex / vector stores** — evaluate only for **PKB semantic search** under Resource-Aware ADRs, scoped to `docs/prompts/**`, never FOUNDATION or policies.

## Claude ecosystem items (skills, memory tools, Studio)

| Item                                    | AIOS stance                                                                                                       |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Skills**                              | Shipped as Prompt Engine packs ([ADR-0026](../adr/0026-skill-packs-prompt-engine.md)) — catalog is operator-owned |
| **Persistent memory compression tools** | Pattern-only; implement in `@aios/memory` if spike wins — no AGPL fork                                            |
| **Obsidian / second brain**             | PKB is Git-native Markdown; Obsidian is an optional viewer                                                        |
| **Claude Studio / app builders**        | Out of scope — Companion or external                                                                              |
| **MCP**                                 | First-class integration surface ([MCP architecture](https://modelcontextprotocol.io/docs/learn/architecture))     |

## Market lookalikes (do not adopt as product surface)

Operator feeds often show **decision-only models**, **Claude Code plugin skill suites**, **third-party session memory**, **slash-command personas**, and **harness infographics**. Those patterns can inform vocabulary; they must **not** become engines, SSOTs, or primary UX in this repo.

| Market lookalike                             | Sounds like…                      | AIOS already has                                                                                                                                                                                                | Do **not**                                                                             |
| -------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Decision-only NN (choice / score / noul)     | “Typed decisions, not chat”       | Capability router ([ADR-0025](../adr/0025-model-router-context-budget.md) / [ADR-0031](../adr/0031-task-profile-model-router.md)) + `DecisionRecord` ledger ([ADR-0034](../adr/0034-decision-record-ledger.md)) | Add a neural decision product; treat the ledger as ML routing                          |
| Claude Code `/plugin` skill marketplaces     | “Skills for the agent”            | Opt-in Prompt Engine packs (`skillIds`, default none) — [ADR-0026](../adr/0026-skill-packs-prompt-engine.md)                                                                                                    | Port academic/research or IDE slash packs into core UX                                 |
| Persistent mem compression (e.g. AGPL tools) | “95% fewer tokens”                | `@aios/memory` FIFO + opt-in deterministic rollup ([ADR-0006](../adr/0006-memory-engine-session.md))                                                                                                            | Fork/import third-party memory as SSOT ([ADR-0029](../adr/0029-ai-harness-mapping.md)) |
| Slash personas (`/cto`, `/debug`, …)         | Modes / roles                     | Policies + skill packs (**how**) + agent plugins (**who**)                                                                                                                                                      | Primary UX as a prompt-command catalog (FOUNDATION: not a pile of prompts)             |
| Harness Engineering diagrams                 | Context → policy → tools → verify | Canonical map: [harness-mapping.md](../architecture/harness-mapping.md) ([ADR-0029](../adr/0029-ai-harness-mapping.md))                                                                                         | A 17th “Harness Engine” or embedded LangGraph/CrewAI                                   |
| Local-first Obsidian knowledge hosts         | Vault + grounded answers          | Unidirectional Obsidian **export** ([ADR-0030](../adr/0030-visibility-plane-obsidian-export.md)); vault is a **view**                                                                                           | Bidirectional sync; Obsidian as memory/policy SSOT                                     |
| Scraping “agent-skill” libraries             | Tooling for agents                | Agents as plugins; external jobs outside the TS monorepo                                                                                                                                                        | Scrapy/Scrapling inside `engines/`                                                     |
| Extreme VRAM streaming runtimes              | Big models on small GPUs          | Resource-Aware + optional local provider (Ollama) ([ADR-0011](../adr/0011-resource-aware-macos.md))                                                                                                             | Productize third-party weight-streaming as an AIOS engine                              |

**Rule of thumb:** reuse **ideas** in spikes/ADRs; ship only as **existing engine slices** or Companion clients — never a second orchestrator or second memory SSOT.

## Enterprise “5-layer stack” infographic

| Layer          | AIOS today                                                  |
| -------------- | ----------------------------------------------------------- |
| Interface      | CLI, MCP, Console (`@aios/console`)                         |
| Orchestration  | `@aios/pipeline`, hook bus, Agent Registry                  |
| LLM            | `@aios/provider` + capability router                        |
| Data           | Git docs, JSONL metrics, heuristic KG; vectors **deferred** |
| Infrastructure | pnpm monorepo, GHA CI, local-first (ADR-0011)               |

## Anti-patterns

- Installing Pinecone/Chroma “because the diagram shows it”
- Running n8n inside `engines/` for SDLC workflows
- Adding Scrapy to the TypeScript monorepo for reference crawling
- Treating PKB RAG as policy SSOT
- Shipping a decision-only neural net “because the ledger sounds like decisions”
- Cloning Claude Code `/plugin` skill suites or slash-command catalogs as primary UX
- Replacing `@aios/memory` with a third-party session-memory product as SSOT

## Related

- [Harness mapping](../architecture/harness-mapping.md)
- [Control plane vs Companion](./control-plane-companion.md)
- [PKB evolution](../prompts/pkb-evolution.md)
- [RAG boundaries — PKB vs Memory vs KG](./rag-boundaries.md) (#328)
