# Releases e Tags

SemVer `vMAJOR.MINOR.PATCH` com **tags anotadas**.

## Histórico

| Tag | Descrição |
| --- | --- |
| `v0.1.0` | Bootstrap + FOUNDATION + scaffold Fase 1 + Git enterprise + CI |

## Criar release

```bash
git checkout main && git pull origin main
# CHANGELOG [X.Y.Z] + package.json version alinhados
git tag -a vX.Y.Z -m "vX.Y.Z — resumo"
git push origin vX.Y.Z
gh release create vX.Y.Z --title "vX.Y.Z — título" --notes "Ver CHANGELOG [X.Y.Z]."
```

Guia geral: [git-workflow.md](./git-workflow.md).
