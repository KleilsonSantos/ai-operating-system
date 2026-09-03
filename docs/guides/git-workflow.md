# Git Workflow Guide — Branches, PRs, and Releases

Official flow for the `ai-operating-system` repository.

## Overview

```text
feature/* | fix/* | docs/* | chore/* | ci/*
              │
              ▼  PR #1
           sandbox
              │
              ▼  PR #2
            main  →  annotated tag vX.Y.Z
```

## Permanent branches

| Branch    | Role                   |
| --------- | ---------------------- |
| `main`    | Production / releases  |
| `sandbox` | Continuous integration |

## Canonical kickoff

1. Issue → Project **In Progress**
2. `git checkout sandbox && git pull`
3. `git checkout -b feature/<slug>`
4. Comment on the issue with the branch name
5. Commits: `type: <gitmoji> description`
6. Local QA → PR → `sandbox` (body must include `Refs #N` or `#N` — CI job `issue-link`, #435) → PR → `main` (prefer `Closes #N`; GitHub closing keywords only apply on the **default** branch) → tag if releaseable

Author and Committer: `Kleilson Santos <kdsdesign1@gmail.com>` — the same identity already used on `main`. **Never** `Co-authored-by: Cursor` / `cursoragent@cursor.com` / IDE trailers. PR bodies must not include “Made with Cursor”; attribution is the author, not the tool.

### Issue link enforcement (#435)

GitHub has **no** native branch-protection rule for “require linked issue”. AIOS enforces it with CI:

| PR target        | Required                            | Why                                                                                                                                                                                                       |
| ---------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sandbox`        | `Refs #N` / `#N` (issue must exist) | Work branch gate — `scripts/check-pr-issue-link.sh`                                                                                                                                                       |
| `main` (promote) | Prefer `Closes #N` / `Fixes #N`     | [Official closing keywords](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue) only auto-link/close when the PR targets the default branch |

Bypass (rare): label `ci:no-issue-required`. Dependabot is skipped.

**Owner action:** mark the `issue-link` status check as **required** on `sandbox` branch protection / ruleset.

### Merges (required)

```bash
bash scripts/merge-pr.sh <n>
# equivalent:
gh pr merge <n> --merge --subject "merge: 🔀 PR #<n> — <branch>"
```

The default GitHub subject (`Merge pull request #N from …`) is forbidden.  
CI: `scripts/check-commit-messages.sh` (PR) + `scripts/check-merge-tip.sh` (push to `sandbox`/`main`, tip).

## What NOT to do

- Commit directly on `main` / `sandbox`
- PR `feature/*` straight to `main`
- Commits without gitmoji
- `gh pr merge` without `--subject` / `-t`

## Dependabot

Configured in [`.github/dependabot.yml`](../../.github/dependabot.yml).

| Kind                            | Target branch           | Notes                                                                                                                                                                    |
| ------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Version updates** (scheduled) | `sandbox`               | Matches git flow; review → merge to sandbox → promote                                                                                                                    |
| **Security updates**            | `main` (default branch) | GitHub limitation when `target-branch` is set for version updates — **leave auto security-update PRs off**; use Dependabot **alerts** + `pnpm audit` / overrides instead |
| **Dependabot alerts**           | n/a (Security tab)      | Keep **enabled** so CVEs appear under Security → Dependabot; complements CI `pnpm audit`                                                                                 |

Do not leave large Dependabot queues open against `main` for routine bumps. Prefer closing stale version-update PRs after changing `target-branch` so Dependabot recreates them against `sandbox`.

Dependabot commit subjects use `chore(deps):` / `chore(deps-dev):` (no gitmoji). `scripts/check-commit-messages.sh` allows that form so promote PRs (`sandbox` → `main`) are not blocked by upstream Dependabot commits already merged into `sandbox`.

Repo security posture (alerts, CodeQL, secrets): [`SECURITY.md`](../../SECURITY.md).

## Related

- [task-kickoff.md](./task-kickoff.md)
- [releases.md](./releases.md)
- [ADR-0002](../adr/0002-git-branching-strategy.md)
