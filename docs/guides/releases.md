# Releases and Tags

SemVer `vMAJOR.MINOR.PATCH` with **annotated tags**.

## Policy (issue #15)

| Layer         | Rule                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Every commit  | Conventional Commits + Gitmoji message (hook + CI)                                                                                           |
| Every release | Bump `package.json` + CHANGELOG section + annotated tag                                                                                      |
| Gate          | `scripts/check-semver-alignment.sh` — fails if `main` has **releaseable** commits (`feat`/`fix`/…) after the last tag without a version bump |

Do not bump SemVer on every feature-branch commit. Aggregate at release time.

Exceptions that **do not** force a bump on their own: `chore`, `docs`, `ci`, `test`, `style`, `build`, `merge`.

## History

| Tag       | Description                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------- |
| `v0.48.5` | Obsidian export safe outDir (home-anchored, traversal/symlink tests) — audit P2 (#412)               |
| `v0.48.4` | Memory FIFO rollup (#322) + npm publish guide + delivery observability concurrency                   |
| `v0.48.3` | Glossary-sync policy + Cursor scoped rule (#415); npm `@aios-platform/*` catch-up to 0.48.3          |
| `v0.48.2` | Owner pt-BR glossary + product-purpose audit (#412)                                                  |
| `v0.48.1` | Spike: Memory compression before FIFO (#322)                                                         |
| `v0.48.0` | PKB semantic search MCP/CLI (#327)                                                                   |
| `v0.47.3` | ADR-0032 optional PKB sqlite-vec index (#326)                                                        |
| `v0.47.2` | Spike: PKB semantic search sqlite-vec vs pgvector (#323)                                             |
| `v0.47.1` | Docs: RAG boundaries (#328) + npm publish catch-up guide (#325)                                      |
| `v0.47.0` | Must-policy MCP SAFE_WRITE consent (#378)                                                            |
| `v0.46.0` | Honest ACT UX (#377) + CLI `--list-agents --json` / `AIOS_HOME` (#379)                               |
| `v0.45.0` | Intent `audit.security` for AppSec journeys (#376)                                                   |
| `v0.44.0` | Obsidian unidirectional export (#366)                                                                |
| `v0.43.0` | Console Run trail + `visibility` safe action (#365)                                                  |
| `v0.42.1` | MCP SemVer sync + `@aios/core` Vitest (#337 / #338)                                                  |
| `v0.42.0` | Visibility Plane MVP (ADR-0030) + interaction-quality policies (#351 / #358) + CodeQL v4 (#360)      |
| `v0.41.0` | TaskProfile Model Router (ADR-0031) + Visibility Plane spike/ADR-0030 Proposed (#353 / #352)         |
| `v0.40.1` | CLI `--help` / unknown flags (#335) + quality gate `knownIntent` (#336) + Vitest 4 (#348)            |
| `v0.40.0` | Console adoption time-series (#324) + Node 24 CLI/MCP/console via tsx                                |
| `v0.39.0` | Agent dependency resolver (#309) + delivery CI observability (ADR-0028) + harness mapping (ADR-0029) |
| `v0.38.0` | Prompt Engine names KG neighbors in the brief (#305)                                                 |
| `v0.37.0` | Context Engine KG neighbors (#301) + Vite 8 console (#267)                                           |
| `v0.36.0` | Heuristic Knowledge Graph depth (#295) + builtin plugin unit tests (#292)                            |
| `v0.35.0` | Central pipeline hook bus (ADR-0027 / #288)                                                          |
| `v0.34.0` | Skill packs for the Prompt Engine (ADR-0026 / #284)                                                  |
| `v0.33.1` | Console safe-actions: generic client error (CWE-209 / #280)                                          |
| `v0.33.0` | Model router by capability class + context budget (ADR-0025 / #276)                                  |
| `v0.32.0` | Execution contract (ADR-0024) + Agent Catalog trending + nanoid 3.3.18 (#261 / #253 / #255)          |
| `v0.31.0` | Console Agent Catalog MVP + nanoid pin (#250 / #247)                                                 |
| `v0.30.0` | @aios-platform npm + provider resilience (#241)                                                      |
| `v0.29.0` | Phase 5b depth — scaffolder, observability, community ingest + first `aios-agent` smoke (#230)       |
| `v0.18.1` | AIOS_MCP_QUIET + ROADMAP Companion/caps · GitHub hygiene                                             |
| `v0.18.0` | Operational State MVP · ADR-0015 (#84) · merge-subject gate · ADR-0014                               |
| `v0.17.0` | Documentation + Governance engines · ADR-0013 (#80)                                                  |
| `v0.16.0` | Console Try it + Resource-Aware · ADR-0011 / ADR-0012 (#75/#76)                                      |
| `v0.15.0` | Governance console `@aios/console` + `@aios/status` + ADR-0010 (#71)                                 |
| `v0.14.0` | Multi-provider MVP `@aios/provider` + Ollama + ADR-0009 (#67)                                        |
| `v0.13.0` | Intent Engine v2 (`implement.feature` · `fix.bug`) (#63)                                             |
| `v0.12.0` | Prompt Engine `@aios/prompt` + ADR-0008 (#59)                                                        |
| `v0.11.0` | Generic multi-repo (ops + `runAcrossWorkspaces`) + ADR-0007 (#55)                                    |
| `v0.10.0` | Memory Engine `@aios/memory` + ADR-0006 (#51) — Phase 2 complete                                     |
| `v0.9.0`  | Knowledge Graph `@aios/knowledge` + ADR-0005 (#47)                                                   |
| `v0.8.0`  | Multi-repo onboarding `@aios/workspace` + ADR-0004 (#43)                                             |
| `v0.7.0`  | MCP server `@aios/mcp` (stdio) + Cursor bridge Level 2 (#38)                                         |
| `v0.6.0`  | CLI/API contract `@aios/pipeline` + ADR-0003 (#9)                                                    |
| `v0.5.0`  | Orchestration + Decision + plugins + Quality Gate (#8)                                               |
| `v0.4.0`  | Context Engine (#7) + Cursor Chat bridge (policies → Project Rules)                                  |
| `v0.3.0`  | Policy Engine — JSON load + workflow injection (#6)                                                  |
| `v0.2.0`  | Intent Engine — heuristic classification (#5)                                                        |
| `v0.1.1`  | SemVer anti-drift gate (#15) + GitHub Actions bump                                                   |
| `v0.1.0`  | Bootstrap + FOUNDATION + Phase 1 scaffold + enterprise Git + CI                                      |

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
