# Releases and Tags

SemVer `vMAJOR.MINOR.PATCH` with **annotated tags**.

## Policy (issue #15)

| Layer | Rule |
| --- | --- |
| Every commit | Conventional Commits + Gitmoji message (hook + CI) |
| Every release | Bump `package.json` + CHANGELOG section + annotated tag |
| Gate | `scripts/check-semver-alignment.sh` — fails if `main` has **releaseable** commits (`feat`/`fix`/…) after the last tag without a version bump |

Do not bump SemVer on every feature-branch commit. Aggregate at release time.

Exceptions that **do not** force a bump on their own: `chore`, `docs`, `ci`, `test`, `style`, `build`, `merge`.

## History

| Tag | Description |
| --- | --- |
| `v0.18.1` | AIOS_MCP_QUIET + ROADMAP Companion/caps · GitHub hygiene |
| `v0.18.0` | Operational State MVP · ADR-0015 (#84) · merge-subject gate · ADR-0014 |
| `v0.17.0` | Documentation + Governance engines · ADR-0013 (#80) |
| `v0.16.0` | Console Try it + Resource-Aware · ADR-0011 / ADR-0012 (#75/#76) |
| `v0.15.0` | Governance console `@aios/console` + `@aios/status` + ADR-0010 (#71) |
| `v0.14.0` | Multi-provider MVP `@aios/provider` + Ollama + ADR-0009 (#67) |
| `v0.13.0` | Intent Engine v2 (`implement.feature` · `fix.bug`) (#63) |
| `v0.12.0` | Prompt Engine `@aios/prompt` + ADR-0008 (#59) |
| `v0.11.0` | Generic multi-repo (ops + `runAcrossWorkspaces`) + ADR-0007 (#55) |
| `v0.10.0` | Memory Engine `@aios/memory` + ADR-0006 (#51) — Phase 2 complete |
| `v0.9.0` | Knowledge Graph `@aios/knowledge` + ADR-0005 (#47) |
| `v0.8.0` | Multi-repo onboarding `@aios/workspace` + ADR-0004 (#43) |
| `v0.7.0` | MCP server `@aios/mcp` (stdio) + Cursor bridge Level 2 (#38) |
| `v0.6.0` | CLI/API contract `@aios/pipeline` + ADR-0003 (#9) |
| `v0.5.0` | Orchestration + Decision + plugins + Quality Gate (#8) |
| `v0.4.0` | Context Engine (#7) + Cursor Chat bridge (policies → Project Rules) |
| `v0.3.0` | Policy Engine — JSON load + workflow injection (#6) |
| `v0.2.0` | Intent Engine — heuristic classification (#5) |
| `v0.1.1` | SemVer anti-drift gate (#15) + GitHub Actions bump |
| `v0.1.0` | Bootstrap + FOUNDATION + Phase 1 scaffold + enterprise Git + CI |

## Create a release

```bash
git checkout main && git pull origin main
# CHANGELOG [X.Y.Z] + package.json version aligned
git tag -a vX.Y.Z -m "vX.Y.Z — summary"
git push origin vX.Y.Z
gh release create vX.Y.Z --title "vX.Y.Z — title" --notes "See CHANGELOG [X.Y.Z]."
```

Local check:

```bash
bash scripts/check-semver-alignment.sh
```

General guide: [git-workflow.md](./git-workflow.md).
