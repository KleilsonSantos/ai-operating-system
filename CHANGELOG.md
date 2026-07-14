# Changelog

Formato [Keep a Changelog](https://keepachangelog.com/) + Conventional Commits.

## [Unreleased]

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
