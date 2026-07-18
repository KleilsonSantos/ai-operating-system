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

| Branch | Role |
| --- | --- |
| `main` | Production / releases |
| `sandbox` | Continuous integration |

## Canonical kickoff

1. Issue → Project **In Progress**
2. `git checkout sandbox && git pull`
3. `git checkout -b feature/<slug>`
4. Comment on the issue with the branch name
5. Commits: `type: <gitmoji> description`
6. Local QA → PR → `sandbox` → PR → `main` → tag if releaseable

Author: `Kleilson Santos <kdsddesign1@gmail.com>` — no `Co-authored-by: Cursor` / IDE trailers.

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

## Related

- [task-kickoff.md](./task-kickoff.md)
- [releases.md](./releases.md)
- [ADR-0002](../adr/0002-git-branching-strategy.md)
