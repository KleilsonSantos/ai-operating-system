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

## Related

- [Harness mapping](../architecture/harness-mapping.md)
- [Control plane vs Companion](./control-plane-companion.md)
- [PKB evolution](../prompts/pkb-evolution.md)
- [RAG boundaries — PKB vs Memory vs KG](./rag-boundaries.md) (#328)
