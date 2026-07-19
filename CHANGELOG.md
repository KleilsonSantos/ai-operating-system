# Changelog

Formato [Keep a Changelog](https://keepachangelog.com/) + Conventional Commits.

## [Unreleased]

### Changed

- 📝 Finish US English migration for AIOS product docs (ADRs, guides, READMEs, policies prose) — ADR-0018 / #142
- 📝 Companion MCP HTTP consumption path — ports, `AIOS_MCP_URL`, health/smoke in control-plane guide + `@aios/mcp` README (#145)

### Added

- 📚 External references catalog — `docs/references/` (legal/official URLs only) · DESIGN + `catalog.yaml` (#133)

## [0.25.0] - 2026-07-18

### Added

- 🌐 MCP Streamable HTTP transport (opt-in) — `AIOS_MCP_HTTP=1` / `--http`, port `8791`, ADR-0022 (#137)

### Notes

- Stdio remains the default (Cursor unchanged). HTTP is stateless MVP on `127.0.0.1`.

## [0.24.1] - 2026-07-18

### Added

- 🧠 Prompt Knowledge Base (PKB) Docs-as-Code catalog under `docs/prompts/` — README, VISION, `index.yaml`, migrated assets (#134)

## [0.24.0] - 2026-07-18

### Added

- 📈 Prometheus text export from `.aios/metrics/events.jsonl` — `GET /metrics` · `aios --metrics-prometheus` · ADR-0021 (#130)

### Changed

- Governance Attention stub points at scrape/CLI; status note mentions `/metrics`
- ROADMAP Phase 3: Prometheus export done (Grafana optional / user-owned)

## [0.23.0] - 2026-07-17

### Added

- ⚖️ Governance audit v2 — core must coverage, fail verdicts, unknown policy refs · Attention merge · ADR-0020 (#121)

### Changed

- `recordDecision` normalizes kinds; operational state exposes `governance.ok` / `findingCount`
- 📝 `FOUNDATION.md` + `VISION.md` migrated to US English (ADR-0018 / #124)
- 📝 `ROADMAP.md` migrated to US English (#127)

## [0.22.0] - 2026-07-17

### Added

- 🖥️ Console Health **Consumption** surface — strip chip + `providerChat` totals (#118)

### Changed

- Console types include `metrics.providerChat` from governance status (ADR-0019)

## [0.21.0] - 2026-07-17

### Added

- 📊 Provider chat consumption metrics — `ChatResponse.usage`, `chatWithMetrics` / `recordProviderChatMetric`, governance `metrics.providerChat` · ADR-0019 (#115)

### Changed

- MCP `aios_provider_chat` and CLI `--provider-chat` record `.aios/metrics/events.jsonl` (`kind: provider.chat`)
- Canonical product docs language: **US English** — ADR-0018 / policy `docs-language-en` (#112)

## [0.20.0] - 2026-07-17

### Added

- 🟣 Anthropic Messages provider (`anthropic`) em `@aios/provider` — `AIOS_ANTHROPIC_API_KEY` / `AIOS_ANTHROPIC_BASE_URL` / `AIOS_ANTHROPIC_MODEL` · ADR-0017 (#109)

### Changed

- `ProviderId` inclui `anthropic`

## [0.19.0] - 2026-07-17

### Added

- ☁️ OpenAI-compatible cloud provider (`openai`) em `@aios/provider` — `AIOS_OPENAI_API_KEY` / `AIOS_OPENAI_BASE_URL` / `AIOS_OPENAI_MODEL` · ADR-0016 (#105)

### Changed

- `ProviderId` inclui `openai`; MCP/CLI listam via `listProviderIds()`

## [0.18.1] - 2026-07-17

### Fixed

- 🔇 MCP stdio: respeitar `AIOS_MCP_QUIET=1` (omite banner stderr; Companion #34 / #100)

### Changed

- 🔗 ROADMAP / guia: Companion kickoff + capability adapters ✅ (#90 / #96–#99)
- 🧹 Higiene GitHub: `.github/agents` + Wiki Home + scripts wiki (#92–#94)

## [0.18.0] - 2026-07-16

### Added

- 📡 Operational State MVP: `@aios/operational-state`, MCP `aios_operational_state`, CLI `--operational-state`, console Try it, ADR-0015 (#84)
- 🧭 ADR-0014 — AIOS control plane · Companion experiência (MCP/pipeline); Fase 4 no ROADMAP
- 🔀 Gate canónico de merge subject: `scripts/merge-pr.sh` + CI `merge-tip` (`check-merge-tip.sh`) — proíbe `Merge pull request…`

### Changed

- Policy `conventional-commits` + `AGENTS.md` / guias: merges obrigam `--subject` / `merge-pr.sh`

## [0.17.0] - 2026-07-15

### Added

- 📚 Documentation + Governance engines: `@aios/documentation` · `@aios/governance`, MCP/CLI/console Try it, ADR-0013 (#80)

## [0.16.0] - 2026-07-15

### Added

- 🕹️ Console **Try it**: safe actions (`POST /api/action`) — contract, workspaces, policies, brief, provider ping, memory · ADR-0012 (#76)
- 🔋 Política canónica Resource-Aware (macOS): `docs/policies/resource-aware-macos.md`, policies `resource-*`, ADR-0011

### Changed

- 📊 Console/status: provider Ollama inativo passa a **warn** (auxiliar opcional), não erro de produto

## [0.15.0] - 2026-07-15

### Added

- 📊 Console de governança: `@aios/status` + `@aios/console` (Health + Attention), MCP `aios_governance_status`, CLI `--governance-status`, ADR-0010 (#71)

## [0.14.0] - 2026-07-15

### Added

- 🔌 Multi-provider MVP: `@aios/provider` (Ollama), MCP `aios_provider_*`, CLI `--provider-health` / `--provider-chat`, ADR-0009 (#67)

## [0.13.0] - 2026-07-15

### Added

- 🎯 Intent Engine v2: kinds `implement.feature` · `fix.bug` + decision matrix (#63)

## [0.12.0] - 2026-07-15

### Added

- 📝 Prompt Engine: `@aios/prompt` (`compilePrompt`), MCP `aios_compile_prompt`, CLI `--compile-prompt`, ADR-0008 (#59)

## [0.11.0] - 2026-07-15

### Added

- 🌐 Multi-repo genérico: upsert/validate/remove workspaces, `runAcrossWorkspaces`, MCP tools, ADR-0007 (#55)

## [0.10.0] - 2026-07-14

### Added

- 🧩 Memory Engine: `@aios/memory` (`.aios/memory/`), MCP `aios_memory_*`, `PipelineResponse.memory`, ADR-0006 (#51)

## [0.9.0] - 2026-07-14

### Added

- 🧠 Knowledge Graph heurístico: `@aios/knowledge`, `PipelineResponse.knowledge`, MCP `aios_build_knowledge`, ADR-0005 (#47)

## [0.8.0] - 2026-07-14

### Added

- 🗂️ Multi-repo onboarding: `@aios/workspace`, `workspaces/aios.workspaces.json`, ADR-0004, MCP `aios_list_workspaces` (#43)

## [0.7.0] - 2026-07-14

### Added

- 🔌 MCP server `@aios/mcp` (stdio): `aios_run_pipeline`, `aios_load_policies`, `aios_contract_version` (#38)

## [0.6.0] - 2026-07-14

### Added

- 📦 Contrato CLI/API v1: `@aios/pipeline` (`runPipeline`) + ADR-0003 (#9)

## [0.5.0] - 2026-07-14

### Added

- ✨ Orchestration + Decision + plugins heurísticos + Quality Gate end-to-end (#8)

## [0.4.0] - 2026-07-14

### Added

- ✨ Context Engine: coleta heurística por path + bundle tipado e injeção no workflow (#7)
- 🔗 Ponte Cursor Chat ↔ policies: `pnpm sync:cursor-rules` gera `.cursor/rules` a partir de `policies/aios.policies.json`
- 📝 Guia [`docs/guides/cursor-chat-bridge.md`](./docs/guides/cursor-chat-bridge.md)

### Changed

- 🔒 Policies expandidas (Git flow, commits, sem APIs depreciadas, prompt curto)

## [0.3.0] - 2026-07-14

### Added

- ✨ Policy Engine: carga JSON + defaults, `applyPolicies` e injeção no workflow (#6)

## [0.2.0] - 2026-07-14

### Added

- ✨ Intent Engine: classificação heurística `analyze` / `explain` / `review` + testes Vitest (#5)

## [0.1.1] - 2026-07-14

### Added

- 🔒 Gate SemVer anti-drift (`scripts/check-semver-alignment.sh` + CI em PRs para `main`) — #15
- 🔧 Hook `pre-push` e docs de `core.hooksPath` obrigatório

### Changed

- 👷 GitHub Actions: checkout@v7, pnpm/action-setup@v6, setup-node@v6

## [0.1.0] - 2026-07-14

### Fixed

- 👷 CI: `pnpm-lock.yaml` + `@types/node` no CLI (setup-node cache/pnpm)

### Added

- 📝 `docs/FOUNDATION.md` — pedra base (tese integral de origem do produto)
- 🎉 Bootstrap do repositório AIOS (LICENSE, README, package)
- 📝 Visão de produto, ROADMAP e ADR-0001 (plataforma standalone)
- 📝 Arquitetura target (engines, plugins, policies, quality gate)
- 🔧 Scaffold monorepo Fase 1 (`engines/*`, plugins, `@aios/cli`)
- 📝 ADR-0002 + guias Git (sandbox, SemVer, kickoff)
- 👷 CI, templates de Issue/PR, Dependabot, SECURITY/SUPPORT/AGENTS
- 📋 Wiki Home (mapa de links) em `docs/wiki/Home.md`

### Changed

- 📝 Projeto posicionado como produto único (sem acoplagem a repositórios externos)
