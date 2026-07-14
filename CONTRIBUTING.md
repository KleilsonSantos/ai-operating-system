# Contributing

Obrigado por considerar contribuir com o **AI Operating System**.

## Fluxo Git (obrigatório)

[`docs/guides/git-workflow.md`](./docs/guides/git-workflow.md) · [`docs/guides/task-kickoff.md`](./docs/guides/task-kickoff.md)

```mermaid
flowchart LR
  F["feature/*"] --> S["sandbox"]
  S --> M["main"]
  M --> T["tag vX.Y.Z"]
```

**Nunca** commit direto em `main` ou `sandbox`.

## Como contribuir

1. Issue → In Progress no Project
2. Branch a partir de `sandbox`
3. Commits: Conventional Commits + Gitmoji
4. Autoria: `Kleilson Santos <kdsddesign1@gmail.com>` — sem co-autoria de IDE
5. PR → `sandbox` → depois `sandbox` → `main`
6. Docs no mesmo PR se mudar build/uso/arquitetura

## Prefixos de branch

`feature/` · `fix/` · `docs/` · `chore/` · `ci/` · `refactor/` · `test/` · `build/` · `perf/`

## Código de conduta

[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
