# ROADMAP

## Phase 0 — Bootstrap ✅ (`v0.1.0`)

- [x] Repository `ai-operating-system` (LICENSE, README, package)
- [x] Foundation (`docs/FOUNDATION.md`) + operational vision
- [x] ADR-0001 — standalone platform
- [x] Target architecture documented (engines + agents-as-plugins)
- [x] Phase 1 monorepo scaffold (engines + plugins + CLI)
- [x] Enterprise Git flow (`sandbox` → `main`, SemVer)
- [x] Community health (Issues, Project, Wiki map, CI/templates)

## Phase 1 — Core (`v0.1.0`+)

Validate AIOS architecture and flows.

- [x] Intent Engine (interpret the request) — #5
- [x] Policy Engine (fixed platform rules) — #6
- [x] Context Engine (repo + docs) — #7
- [x] Orchestration + Workflow (choose agents) — #8
- [x] Agent plugins: Architecture, AppSec, Docs, QA — #8
- [x] Decision Engine (does this agent need to run?) — #8
- [x] Quality Gate (before the response leaves) — #8
- [x] Minimal CLI / API to consume the core — #9

## Phase 2 — Multi-repository (`v0.y.0`)

- [x] Stable integration contracts — ADR-0003 / `@aios/pipeline` (#9); MCP Level 2 (#38)
- [x] Multi-repository onboarding — `@aios/workspace` + ADR-0004 (#43)
- [x] Basic Knowledge Graph (Project → packages/engines → docs…) — `#47` / ADR-0005
- [x] Heuristic KG depth — two-pass `workspace:*`, pnpm-workspace buckets, ADR/policy files (#295)
- [x] Memory Engine (session / project) — `#51` / ADR-0006

## Phase 3 — Full platform (`v1.0.0` aspirational)

- [x] Generic multi-repo — ops registry + `runAcrossWorkspaces` (#55 / ADR-0007)
- [x] Prompt Engine — governed brief / token economy (#59 / ADR-0008)
- [x] Intent Engine v2 — `implement.feature` · `fix.bug` (#63)
- [x] Multi-provider MVP — `@aios/provider` + Ollama (#67 / ADR-0009); OpenAI-compatible (#105 / ADR-0016); Anthropic Messages (#109 / ADR-0017); resilience retry + circuit breaker (#238)
- [x] Integrations / MCP orchestration — stdio MVP `@aios/mcp` (#38); Streamable HTTP opt-in (#137 / ADR-0022)
- [x] Governance UI — console Health + Attention + Try it + Consumption (`providerChat`, #118) (`@aios/console` / `@aios/status`, #71 / #76 / ADR-0010 / ADR-0012); provider.chat JSONL metrics (#115 / ADR-0019); Prometheus text export (`GET /metrics` / `--metrics-prometheus`, #130 / ADR-0021) — Grafana optional / user-owned
- [x] Documentation / Governance engines — heuristic MVP (#80 / ADR-0013); audit v2 signals (#121 / ADR-0020)

## Phase 4 — Mature control plane · Companion (experience)

Boundary: [ADR-0014](./adr/0014-control-plane-companion.md) · [guide](./guides/control-plane-companion.md).

- [x] Operational State MVP in AIOS (light unified state; no voice / no IDE control)
- [x] Companion repo (MCP/pipeline client) — Conversation Manager; voice later → [`aios-companion`](https://github.com/KleilsonSantos/aios-companion) (kickoff #90)
- [x] Resource-Aware event hooks (no aggressive polling) — `recordOperationalEvent` on-demand (#84 / ADR-0015)
- [x] Capability adapters (Git/GitHub/…) behind contracts — without duplicating AIOS engines → [`aios-companion`](https://github.com/KleilsonSantos/aios-companion) `companion caps`
- [x] Canonical product docs language: **US English** — ADR-0018 / [#112](https://github.com/KleilsonSantos/ai-operating-system/issues/112); FOUNDATION + VISION migrated (#124); ROADMAP migrated (#127)
- [x] Prompt Knowledge Base (PKB) catalog MVP — Docs-as-Code under `docs/prompts/` (#134); inventory via `aios_audit_docs` (#154); textual/tag search (#158); RAG/embeddings deferred
- [x] External references catalog — `docs/references/` legal/official only (#133)

## Phase 5 — Agent Marketplace & Reusability

Boundary: [ADR-0023](./adr/0023-agent-registry-marketplace.md) · [plan](../.github/modernize/phase-5-agent-marketplace/plan.md).

Agents become first-class, discoverable, reusable building blocks. Four pillars:

### Phase 5a — Registry MVP ✅ (`v0.28.0`)

- [x] Agent Registry (discovery + metadata) — `aios list-agents` / `aios_list_agents` MCP tool; local cache; multi-source resolver (npm, git, local)
- [x] Agent Packaging (schema MVP) — `agent.yaml` / JSON schema in `@aios-platform/agent-registry`; parse/validate/list/save

**Status:** Shipped in `v0.28.0` (2026-07-20).

### Phase 5b — Packaging depth, observability, community (next)

- [x] Agent Packaging (scaffolder MVP) — `@aios-platform/create-agent` + template + `docs/guides/writing-an-agent.md` (#211); npm publish readiness for `@aios-platform/create-agent` + `@aios-platform/agent-registry` (#233); multi-level dependency resolver (#309); separate `@aios/agent-template` package still open
- [x] Agent Observability (MVP) — `recordAgentExecution` + `kind: agent.execution` JSONL; health-score on list-agents / console chip (#217); Console Agent Catalog MVP (registry + health join, #247) + trending/top-used/unhealthy views + 7d runs; full adoption curves / Prometheus time-series still open
- [x] Community Publishing (MVP) — publish guide; `scripts/community-agents-ingest.mjs`; weekly GHA artifact; catalog + `community` source in `@aios-platform/agent-registry` (#220)
- [x] Community catalog auto-PR — GHA opens/updates PR → `sandbox` when agents list changes; skip `generatedAt`-only churn (#223); async HTTP registry service + productized abuse pipeline still open (deferred — Resource-Aware)
- [x] First community agent ingested — public [`aios-agent-smoke`](https://github.com/KleilsonSantos/aios-agent-smoke) (`topic:aios-agent`) in committed catalog (#230)

**Status:** Phase 5b MVP complete for scaffolder, observability, community ingest loop, and first live topic hit (`v0.29.0`). Public npm scope `@aios-platform` (#236); remaining depth: Console Agent Catalog adoption graphs / trending tables, multi-level dependency resolver, optional `@aios/agent-template` package. Console Agent Catalog MVP (registry list + health join) shipped via #247.  
**Target:** shipped as `v0.29.0` (do not backdate into 5a).

## Execution contract (incremental)

Thin runtime on the existing pipeline — not a second orchestrator. [ADR-0024](./adr/0024-execution-state-capability-registry.md) · #261.

- [x] Phase 1 foundation — `PipelineResponse.run` + MCP capability allowlist + registry-selected plugins (flag + fallback)
- [x] Phase 2 (thin) — model router by capability class + context budget (#276 / ADR-0025)
- [x] Skill packs — optional Prompt Engine manifests (#284 / ADR-0026)
- [x] Central hook bus — named lifecycle points on `runPipeline` (#288 / ADR-0027)

## Out of scope (on purpose)

- Replacing IDEs or Copilot as an editor — AIOS governs and orchestrates; it does not compete as autocomplete
- Merging “Jarvis” experience and the control plane into one release monolith
- Building every target engine in Phase 1
- Embedding AIOS as a folder inside another monorepo (ADR-0001)
