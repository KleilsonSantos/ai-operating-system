# Kickoff de Tarefa (Fluxo Canônico)

```text
Issue (GitHub) → Project In Progress → feature/* from sandbox → PR → sandbox → PR → main
```

```bash
git checkout sandbox && git pull origin sandbox
git checkout -b feature/<slug>
gh issue comment <N> --repo KleilsonSantos/ai-operating-system \
  --body "🚀 Kickoff: branch \`feature/<slug>\` criada a partir de \`sandbox\`."
```

Antes do push: typecheck/lint/testes da área tocada.

PR sempre para `sandbox`. Merge **só** via:

```bash
bash scripts/merge-pr.sh <N>
```

Subject: `merge: 🔀 PR #<n> — <branch>` (nunca o default do GitHub).

Detalhes: [git-workflow.md](./git-workflow.md).
