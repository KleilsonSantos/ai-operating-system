# AGENTS.md — AIOS Compatibility Bridge

This file is a lightweight pointer for AI tools that auto-load `AGENTS.md`.

Do not treat it as the only operational source for this repository. Start from the
task-specific sources below and pull the detailed rules from `.trae/rules/`.

## Mission

Build **AIOS**: a governance platform for AI in the SDLC — one product, not a dump of prompts.

## Source Order

1. **Code** — `engines/`, `packages/`, `apps/`
2. **Foundation and architecture** — `docs/FOUNDATION.md`, `docs/VISION.md`, `docs/architecture/`, `docs/adr/`
3. **Policies and project rules** — `policies/aios.policies.json`, `.trae/rules/`, `.cursor/rules/`
4. **Delivery truth** — `docs/ROADMAP.md`, `CHANGELOG.md`, `.github/`, `scripts/`
5. **Prompt knowledge base** — `docs/prompts/`
6. **Optional generated wikis** — narrative help only; never override items 1–3

If a summary conflicts with `docs/FOUNDATION.md`, the foundation wins until an ADR changes it.

## Task Routing

- **Workflow, PR, merge, release, CI**: start with `.trae/rules/workflow.md`, `docs/guides/git-workflow.md`, `docs/guides/task-kickoff.md`, `docs/guides/releases.md`, `.github/pull_request_template.md`, and `scripts/merge-pr.sh`.
- **Architecture and product scope**: start with `.trae/rules/architecture.md`, `docs/FOUNDATION.md`, `docs/architecture/overview.md`, and the relevant ADRs.
- **Quality gates and repository automation**: start with `.trae/rules/quality-gates.md`, `.github/workflows/ci.yml`, `.githooks/`, `package.json`, `sonar-project.properties`, and `CONTRIBUTING.md`.
- **Context engine work**: start with `.trae/rules/modules/context-engine.md` and `engines/context/src/`.

## Hard Constraints

- AIOS is standalone; agents are plugins.
- Policies beat long prompts.
- Product docs stay in US English: `docs/**`, ADRs, README, this file, and CHANGELOG prose.
- Commit only when the human asks.

## Owner Cadence

`next` = proposal only.
`ok` / `prossegue` = implement the accepted slice.
`green` = promote `sandbox` to `main`.

Before every `next`, provide:

1. Trajectory
2. What
3. Why now
4. Analogy
5. Trade-off
6. Wait for `ok`
