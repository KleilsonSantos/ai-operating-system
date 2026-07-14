# ADR-0002: Estratégia de Branches, Sandbox e Versionamento SemVer

- **Status:** Aceito
- **Data:** 2026-07-13
- **Decisores:** Kleilson dos Santos

## Contexto

O AIOS adota desde o início o mesmo fluxo enterprise do portfólio: branch de integração `sandbox`, branches semânticas e releases SemVer — para rastreabilidade e disciplina de produto.

## Decisão

```text
feature/* | fix/* | docs/* | chore/* | ci/* | ...
                    │
                    ▼
                 sandbox          ← integração + CI
                    │
              Pull Request
                    │
                    ▼
                  main            ← produção / releases tagueadas
```

### Regras

1. Sem commit direto em `main` ou `sandbox` (após este ADR).
2. Dois PRs por entrega: `branch → sandbox` e `sandbox → main`.
3. Commits: Conventional Commits + Gitmoji.
4. Releases: tags anotadas `vX.Y.Z` + GitHub Release + CHANGELOG.

Bootstrap inicial em `main` até `v0.1.0` é a exceção documentada (igual ao padrão do portfólio).

## Referências

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [`docs/guides/git-workflow.md`](../guides/git-workflow.md)
