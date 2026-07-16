# Releases e Tags

SemVer `vMAJOR.MINOR.PATCH` com **tags anotadas**.

## Política (issue #15)

| Camada | Regra |
| --- | --- |
| Todo commit | Mensagem Conventional Commits + Gitmoji (hook + CI) |
| Toda release | Bump `package.json` + seção CHANGELOG + tag anotada |
| Gate | `scripts/check-semver-alignment.sh` — falha se `main` tiver commits **releaseable** (`feat`/`fix`/…) após a última tag sem bump de versão |

Não bumpar SemVer a cada commit de feature branch. Agregar na release.

Exceções que **não** forçam bump sozinhas: `chore`, `docs`, `ci`, `test`, `style`, `build`, `merge`.

## Histórico

| Tag | Descrição |
| --- | --- |
| `v0.16.0` | Console Try it + Resource-Aware · ADR-0011 / ADR-0012 (#75/#76) |
| `v0.15.0` | Console de governança `@aios/console` + `@aios/status` + ADR-0010 (#71) |
| `v0.14.0` | Multi-provider MVP `@aios/provider` + Ollama + ADR-0009 (#67) |
| `v0.13.0` | Intent Engine v2 (`implement.feature` · `fix.bug`) (#63) |
| `v0.12.0` | Prompt Engine `@aios/prompt` + ADR-0008 (#59) |
| `v0.11.0` | Multi-repo genérico (ops + `runAcrossWorkspaces`) + ADR-0007 (#55) |
| `v0.10.0` | Memory Engine `@aios/memory` + ADR-0006 (#51) — Fase 2 completa |
| `v0.9.0` | Knowledge Graph `@aios/knowledge` + ADR-0005 (#47) |
| `v0.8.0` | Multi-repo onboarding `@aios/workspace` + ADR-0004 (#43) |
| `v0.7.0` | MCP server `@aios/mcp` (stdio) + Cursor bridge Nível 2 (#38) |
| `v0.6.0` | Contrato CLI/API `@aios/pipeline` + ADR-0003 (#9) |
| `v0.5.0` | Orchestration + Decision + plugins + Quality Gate (#8) |
| `v0.4.0` | Context Engine (#7) + ponte Cursor Chat (policies → Project Rules) |
| `v0.3.0` | Policy Engine — carga JSON + injeção no workflow (#6) |
| `v0.2.0` | Intent Engine — classificação heurística (#5) |
| `v0.1.1` | Gate SemVer anti-drift (#15) + bump GitHub Actions |
| `v0.1.0` | Bootstrap + FOUNDATION + scaffold Fase 1 + Git enterprise + CI |

## Criar release

```bash
git checkout main && git pull origin main
# CHANGELOG [X.Y.Z] + package.json version alinhados
git tag -a vX.Y.Z -m "vX.Y.Z — resumo"
git push origin vX.Y.Z
gh release create vX.Y.Z --title "vX.Y.Z — título" --notes "Ver CHANGELOG [X.Y.Z]."
```

Verificação local:

```bash
bash scripts/check-semver-alignment.sh
```

Guia geral: [git-workflow.md](./git-workflow.md).
