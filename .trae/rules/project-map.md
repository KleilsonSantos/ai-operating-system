---
description: AIOS project map and source-of-truth order for this repository
alwaysApply: true
---

# AIOS Project Map

Use this rule as a short router, not as a replacement for the repository documentation.

## Start Here

1. Read the code under `engines/`, `packages/`, and `apps/` for the affected area.
2. Pull product and architecture truth from [`docs/FOUNDATION.md`](../../docs/FOUNDATION.md), [`docs/architecture/overview.md`](../../docs/architecture/overview.md), and the relevant ADRs under [`docs/adr/`](../../docs/adr/).
3. Pull permanent constraints from [`policies/aios.policies.json`](../../policies/aios.policies.json) and the synced bridge rules in [`../../.cursor/rules/`](../../.cursor/rules/).
4. Pull delivery workflow from [`docs/guides/git-workflow.md`](../../docs/guides/git-workflow.md), [`docs/guides/task-kickoff.md`](../../docs/guides/task-kickoff.md), [`docs/guides/releases.md`](../../docs/guides/releases.md), [`.github/pull_request_template.md`](../../.github/pull_request_template.md), and [`scripts/merge-pr.sh`](../../scripts/merge-pr.sh).

## Important Notes

- Treat [`../../AGENTS.md`](../../AGENTS.md) as a compatibility bridge for tools that auto-load it, not as the only operational source.
- If a summary conflicts with [`docs/FOUNDATION.md`](../../docs/FOUNDATION.md), the foundation wins until an ADR changes the decision.
- Product documentation stays in US English according to [`docs/guides/documentation-language.md`](../../docs/guides/documentation-language.md).
- Keep new permanent instructions in policies or scoped rules instead of growing one giant root file.
