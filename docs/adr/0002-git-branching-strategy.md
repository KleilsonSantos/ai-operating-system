# ADR-0002: Branch strategy, sandbox, and SemVer versioning

- **Status:** Accepted
- **Date:** 2026-07-13
- **Deciders:** Kleilson dos Santos

## Context

AIOS adopts an enterprise Git flow from day one: an integration branch `sandbox`, semantic branches, and SemVer releases — for traceability and product discipline.

## Decision

```text
feature/* | fix/* | docs/* | chore/* | ci/* | ...
                    │
                    ▼
                 sandbox          ← integration + CI
                    │
              Pull Request
                    │
                    ▼
                  main            ← production / tagged releases
```

### Rules

1. No direct commits to `main` or `sandbox` (after this ADR).
2. Two PRs per delivery: `branch → sandbox` and `sandbox → main`.
3. Commits: Conventional Commits + Gitmoji.
4. Releases: annotated tags `vX.Y.Z` + GitHub Release + CHANGELOG.

Initial bootstrap on `main` through `v0.1.0` is the documented exception.

## References

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [`docs/guides/git-workflow.md`](../guides/git-workflow.md)
