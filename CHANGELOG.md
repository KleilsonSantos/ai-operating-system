# Changelog

Formato [Keep a Changelog](https://keepachangelog.com/) + Conventional Commits.

## [Unreleased]

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
