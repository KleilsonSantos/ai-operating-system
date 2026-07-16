# Guia de Fluxo Git — Branches, PRs e Releases

Fluxo oficial do repositório `ai-operating-system`.

## Visão geral

```text
feature/* | fix/* | docs/* | chore/* | ci/*
              │
              ▼  PR #1
           sandbox
              │
              ▼  PR #2
            main  →  tag anotada vX.Y.Z
```

## Branches permanentes

| Branch | Papel |
| --- | --- |
| `main` | Produção / releases |
| `sandbox` | Integração contínua |

## Kickoff canônico

1. Issue → Project **In Progress**
2. `git checkout sandbox && git pull`
3. `git checkout -b feature/<slug>`
4. Comentar na issue com a branch
5. Commits: `type: <gitmoji> descrição`
6. QA local → PR → `sandbox` → PR → `main` → tag se releaseable

Autoria: `Kleilson Santos <kdsddesign1@gmail.com>` — sem `Co-authored-by: Cursor` / trailers de IDE.

### Merges (obrigatório)

```bash
bash scripts/merge-pr.sh <n>
# equivalente:
gh pr merge <n> --merge --subject "merge: 🔀 PR #<n> — <branch>"
```

Proibido o subject default do GitHub (`Merge pull request #N from …`).  
CI: `scripts/check-commit-messages.sh` (PR) + `scripts/check-merge-tip.sh` (push em `sandbox`/`main`, tip).

## O que NÃO fazer

- Commit direto em `main` / `sandbox`
- PR `feature/*` direto para `main`
- Commits sem gitmoji
- `gh pr merge` sem `--subject` / `-t`

## Relacionados

- [task-kickoff.md](./task-kickoff.md)
- [releases.md](./releases.md)
- [ADR-0002](../adr/0002-git-branching-strategy.md)
