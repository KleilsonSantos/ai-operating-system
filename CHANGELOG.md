# Changelog

Formato [Keep a Changelog](https://keepachangelog.com/) + Conventional Commits.

## [Unreleased]

## [0.42.0] - 2026-08-29

### Added

- 🔭 Visibility Plane MVP — `@aios/visibility` `correlateVisibility` + MCP `aios_visibility` + CLI `--visibility`; ADR-0030 Accepted (#351)
- 🧭 Interaction-quality policies — `anti-sycophancy`, `calibrated-claims`, `clarify-if-blocking`, `depth-on-demand` (+ Cursor sync) (#358)
- 📋 PKB: catalog `prompt.ai-engineering.aios-master-architecture` + `prompt.ai-engineering.aios-implementation-mission`

### Changed

- ⬆️ CI: CodeQL Action `v3` → `v4` (Node 24 runtime; v3 deprecation Dec 2026) (#360)

## [0.41.0] - 2026-08-28

### Added

- 🧭 TaskProfile on Model Router — complexity · privacy · cost; `sensitive` → local ollama (ADR-0031 / #353)
- 📋 Spike + proposed ADR-0030 — Visibility Plane correlation and optional Obsidian export (Phase 5c / #351 / #352)

## [0.40.1] - 2026-08-25

### Fixed

- 🐛 Quality gate fails `unknown` intent (blocker `knownIntent`) instead of a green empty run (#336)
- 🐛 CLI `--help` / `-h` and unknown flags no longer run the pipeline (#335)

### Changed

- ⬆️ Vitest 4.1.11 with matching `@vitest/coverage-v8` 4.1.11 (#348)
- 📋 PKB: catalog `prompt.ai-engineering.integral-e2e-evidence-audit` (#339)
- Dependabot patches: vite, js-yaml, eslint, turbo (#342–#345)

## [0.40.0] - 2026-08-18

### Added

- 📈 Console Agent Catalog adoption time-series — daily `agent.execution` buckets (7d / 30d) via `@aios/status` (#324)

### Fixed

- 🐛 Node 24 strip-types: rewrite provider parameter properties; run CLI/MCP/console API via `tsx` (#324)

## [0.39.0] - 2026-08-18

### Added

- 🌳 Agent Registry transitive dependency resolver — `resolveDependencyTree`, CLI `--agent-tree` / `--agent-tree-root`, MCP `aios_list_agents` `dependencyTree` (#309)
- 📡 Delivery CI observability — `delivery.ci` JSONL events, Prometheus `aios_delivery_ci_*`, GHA artifact ingest, `record-delivery-ci.mjs` (ADR-0028)
- 🧭 AI harness mapping — ADR-0029, architecture guide, agent framework boundaries (#321)

### Changed

- 🎨 lint-staged Prettier scope includes `.js`, `.cjs`, and `.mjs` (#314)

## [0.38.0] - 2026-08-16

### Added

- 🪪 Prompt Engine names Knowledge Graph neighbors in the brief when `scope` is set (#305)

## [0.37.0] - 2026-08-16

### Added

- 🗺️ Context Engine ranks Knowledge Graph neighbors for a scoped gather (workspace deps + matching ADRs) (#301)

### Changed

- ⬆️ `@aios/console`: Vite 7 → 8 (Rolldown) and `@vitejs/plugin-react` 4 → 6 (#267)

## [0.36.0] - 2026-08-16

### Added

- 🧠 Heuristic Knowledge Graph depth — two-pass `workspace:*` edges, `pnpm-workspace.yaml` buckets, ADR and policy file nodes (#295)

### Changed

- ✅ Unit tests for the 4 builtin agent plugins (`architecture`, `appsec`, `docs`, `qa`) (#292)

## [0.35.0] - 2026-08-15

### Added

- 🪝 Central pipeline hook bus — opt-in `record.lifecycle` records `before`/`after` policy, context, agent, gate as `run` steps (#288 / ADR-0027)

### Changed

- 🔧 Git attribution stays `Kleilson Santos <kdsdesign1@gmail.com>`; IDE co-author trailers fail commit-lint

## [0.34.0] - 2026-08-15

### Added

- 📦 Skill packs for the Prompt Engine — opt-in manifests (`id`, `purpose`, `allowedTools`, `failurePolicy`) injected into `compilePrompt`; `run.skillIds` + `skill` step on the pipeline (#284 / ADR-0026)

## [0.33.1] - 2026-08-15

### Fixed

- 🔒 Console safe-actions: log unexpected errors server-side; HTTP client gets a generic `internal error` (CWE-209 / CodeQL #10)

## [0.33.0] - 2026-08-15

### Added

- 🧭 Model router by capability class (`fast` / `coding` / `reasoning` / `arbitration`) — `routeModel` (`@aios/shared`, re-exported from `@aios/provider`) + `PipelineResponse.run.model` (#276 / ADR-0025)
- 📦 Context budget tiers (`tight` / `standard` / `wide`) + secret-path filter on `gatherContext`
- 📋 PKB: catalog `prompt.ai-engineering.agent-runtime-evolution` and `prompt.documentation.repository-structure-rationalization`; chat trigger `PKB intake` / `catalogar prompt` / `guardar prompt`

### Changed

- 📋 Repository hygiene: PKB vision → `docs/prompts/pkb-evolution.md`; Phase 5 modernize plan marked historical; `artifact-lifecycle` policy (#270)

## [0.32.0] - 2026-08-15

### Added

- 🔐 Execution state on `PipelineResponse.run` (Run / Step / evidence) — `contractVersion` stays `"1"` (#261 / ADR-0024)
- 🔒 MCP capability allowlist: privilege per `aios_*` tool; model cannot pick `PRIVILEGED` (`AIOS_MCP_PRIVILEGE`, `AIOS_MCP_ALLOW_PRIVILEGED`)
- 🔌 Registry-selected plugins behind `pluginSource: "registry"` / `AIOS_REGISTRY_PLUGINS=1`, fallback to the 4 builtin agents
- 📊 Agent Catalog trending: `executions7d` / `count7d`, console views All · Top-used · Unhealthy (health &lt; 70%) (#253)

### Changed

- 📋 README Latest release + MCP server version aligned to `v0.32.0` (#263 / #255)

### Fixed

- 🔒 Bump transitive `nanoid` pin to `3.3.18` (GHSA-2v37) so pre-push `pnpm audit` stays green

## [0.31.0] - 2026-08-07

### Added

- 📊 Console Agent Catalog MVP: `GovernanceStatus.agents` (registry + health/runs join); console catalog panel (#247)

### Fixed

- 🔒 Pin transitive `nanoid@3.3.17` (GHSA-2v37) so `pnpm audit` / pre-push stay green (#247)

## [0.30.0] - 2026-08-07

### Added

- 🔌 Provider resilience MVP: retry (transient) + circuit breaker via `getProvider` / `ResilientProvider`; `ProviderHealth.circuit` (#238)
- 📦 Publish-ready scaffolder / `npm create @aios-platform/agent` (#233 / #236)

### Changed

- 📦 Public npm scope `@aios-platform` (#236)
- 🔧 Workspace resolves agent-registry from `src/` (publishConfig → `dist/`); Sonar builds registry before coverage (#241)

### Fixed

- 🔍 Sonar/main coverage agent-registry resolve (#241)

## [0.29.0] - 2026-08-06

### Added

- 📦 Phase 5b packaging: `@aios/create-agent` scaffolder (`pnpm --filter @aios/create-agent dev -- --name …`) + Writing an Agent guide; fix `js-yaml` ESM import in `@aios/agent-registry` (#211)
- 🔒 Security hygiene: sanitize console JSON responses (no `Error.stack` leak); document Dependabot alerts vs security-update PRs (#214)
- 📊 Phase 5b observability MVP: `recordAgentExecution` (`kind: agent.execution`), health-score, CLI/MCP enrichment, console Agents chip (#217)
- 🌐 Phase 5b community publishing MVP: `docs/guides/publish-an-agent.md`, GitHub topic ingest script + weekly workflow artifact, `community` source stubs in `@aios/agent-registry` (#220)
- 🤖 Community catalog auto-PR: weekly/manual GHA refreshes catalog and opens PR → `sandbox` only when agents change (#223)
- 🔒 ShellCheck on `scripts/*.sh` + `.githooks/*` in CI; harden Actions `run:` against script injection via `env:` (#227)
- 🌐 First community agent ingest: public [`aios-agent-smoke`](https://github.com/KleilsonSantos/aios-agent-smoke) (`topic:aios-agent`) in committed catalog (#230)

### Fixed

- 🔒 Pin transitive CVEs (fast-uri, ip-address, postcss, hono) so `pnpm audit` / green unblock (#205)

### Changed

- 🔧 Dependabot version updates target `sandbox` (git flow); document security-update exception (#197)
- 📝 ADR-0018 community surfaces: SUPPORT.md + GitHub issue templates → US English; install script for Cursor sandbox allowlist (#194)
- 🔧 Cursor agent network: allowlist `api.github.com` via `.cursor/sandbox.json` so `gh` / `merge-pr.sh` work in-agent (#191)
- 📝 Document rationalization audit + Quick Wins (#187): fix broken doc links; Phase 5a/5b ROADMAP reconcile vs `v0.28.0`; drop unused `husky` / `eslint-plugin-prettier`; remove unused `@aios/core` workspace deps from engines

## [0.28.1] - 2026-07-21

### Fixed

- 🔧 Align `@aios/agent-registry` schema handling with Ajv compatibility and keep the `v0.28.0` fix stream mergeable (#172)
- 🔍 Scope SonarCloud validation to supported `main` pushes so PR checks stay aligned with the current plan limits (#172)

### Changed

- 🧭 Route project context gathering through `.trae/rules` before generic root summaries, including context-engine priority updates (#172)
- 🧪 Normalize merged LCOV paths so monorepo coverage reports map correctly during CI and release promotion (#172)

## [0.28.0] - 2026-07-20

### Added

- 📦 Phase 5: Agent Registry & Reusability (ADR-0023, plan, tasks) (#162)
- 📦 @aios/agent-registry package (T2, T3, T4): agent.yaml schema, core AgentRegistry with parse/validate/list/save (#165)
- 📦 @aios/agent-registry metadata resolvers (T5): npm, git, local with 1h caching (#166)
- 📦 CLI: `aios list-agents` command (T6) with filtering by tag, maintainer, name, and JSON output (#169)
- 📦 MCP: `aios_list_agents` tool (T7) with filtering by tag, maintainer, name (#169)
- 📦 Local registry persistence (T8): merge priority local > saved > built-in (#169)

## [0.27.0] - 2026-07-20

### Added

- 🔎 PKB textual / tag search — `searchPkb` · MCP `aios_search_pkb` · CLI `--search-pkb` (#158)

## [0.26.0] - 2026-07-20

### Added

- 📚 PKB inventory in `aios_audit_docs` / `@aios/documentation` — scaffold + `index.yaml` paths + orphan assets (#154)
- 📚 External references catalog — `docs/references/` (legal/official URLs only) · DESIGN + `catalog.yaml` (#133)
- 🧪 Spike note: OpenWiki vs AIOS knowledge/docs — enrich as external wiki, reject as second SSOT (`docs/spikes/openwiki-comparison.md`) (#148)

### Changed

- 📝 Owner cadence in `AGENTS.md` — `next` = proposal (briefing + analogy); `ok` = implement; `green` = promote (#154)
- 📝 Finish US English migration for AIOS product docs (ADRs, guides, READMEs, policies prose) — ADR-0018 / #142
- 📝 Companion MCP HTTP consumption path — ports, `AIOS_MCP_URL`, health/smoke in control-plane guide + `@aios/mcp` README (#145)
- 📝 `AGENTS.md` canonical context order (code → FOUNDATION/ADRs → policies → ROADMAP → PKB → optional external wikis) — OpenWiki spike follow-up (#151)

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
