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
