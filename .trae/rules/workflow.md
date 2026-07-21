---
description: Use for branch, PR, merge, release, CI, and promotion workflow tasks in this repository
alwaysApply: false
---

# Workflow and Delivery

For Git flow, PR routing, merge policy, release promotion, and CI decisions, use these sources together:

- [`docs/guides/git-workflow.md`](../../docs/guides/git-workflow.md)
- [`docs/guides/task-kickoff.md`](../../docs/guides/task-kickoff.md)
- [`docs/guides/releases.md`](../../docs/guides/releases.md)
- [`.github/pull_request_template.md`](../../.github/pull_request_template.md)
- [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)
- [`scripts/merge-pr.sh`](../../scripts/merge-pr.sh)
- [`scripts/check-merge-tip.sh`](../../scripts/check-merge-tip.sh)
- [`scripts/check-commit-messages.sh`](../../scripts/check-commit-messages.sh)

## Required Flow

- Work starts from an issue.
- Create a semantic branch from `sandbox`.
- Open the work PR to `sandbox`.
- Promote `sandbox` to `main` with a second PR.
- Merge with `bash scripts/merge-pr.sh <n>` or the equivalent `gh pr merge` command with the required custom subject.
- Do not commit unless the human explicitly asks.

## Owner Chat Cadence

- `next` means proposal only.
- `ok` / `prossegue` means implementation is authorized.
- `green` means promote the validated branch from `sandbox` to `main`.
