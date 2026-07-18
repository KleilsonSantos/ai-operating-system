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
- [x] Memory Engine (session / project) — `#51` / ADR-0006

## Phase 3 — Full platform (`v1.0.0` aspirational)

- [x] Generic multi-repo — ops registry + `runAcrossWorkspaces` (#55 / ADR-0007)
- [x] Prompt Engine — governed brief / token economy (#59 / ADR-0008)
- [x] Intent Engine v2 — `implement.feature` · `fix.bug` (#63)
- [x] Multi-provider MVP — `@aios/provider` + Ollama (#67 / ADR-0009); OpenAI-compatible (#105 / ADR-0016); Anthropic Messages (#109 / ADR-0017)
- [x] Integrations / MCP orchestration — stdio MVP `@aios/mcp` (#38; future expansion)
- [x] Governance UI — console Health + Attention + Try it + Consumption (`providerChat`, #118) (`@aios/console` / `@aios/status`, #71 / #76 / ADR-0010 / ADR-0012); provider.chat JSONL metrics (#115 / ADR-0019); Prometheus text export (`GET /metrics` / `--metrics-prometheus`, #130 / ADR-0021) — Grafana optional / user-owned
- [x] Documentation / Governance engines — heuristic MVP (#80 / ADR-0013); audit v2 signals (#121 / ADR-0020)

## Phase 4 — Mature control plane · Companion (experience)

Boundary: [ADR-0014](./adr/0014-control-plane-companion.md) · [guide](./guides/control-plane-companion.md).

- [x] Operational State MVP in AIOS (light unified state; no voice / no IDE control)
- [x] Companion repo (MCP/pipeline client) — Conversation Manager; voice later → [`aios-companion`](https://github.com/KleilsonSantos/aios-companion) (kickoff #90)
- [x] Resource-Aware event hooks (no aggressive polling) — `recordOperationalEvent` on-demand (#84 / ADR-0015)
- [x] Capability adapters (Git/GitHub/…) behind contracts — without duplicating AIOS engines → [`aios-companion`](https://github.com/KleilsonSantos/aios-companion) `companion caps`
- [x] Canonical product docs language: **US English** — ADR-0018 / [#112](https://github.com/KleilsonSantos/ai-operating-system/issues/112); FOUNDATION + VISION migrated (#124); ROADMAP migrated (#127)

## Out of scope (on purpose)

- Replacing IDEs or Copilot as an editor — AIOS governs and orchestrates; it does not compete as autocomplete
- Merging “Jarvis” experience and the control plane into one release monolith
- Building every target engine in Phase 1
- Embedding AIOS as a folder inside another monorepo (ADR-0001)
