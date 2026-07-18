# Task Kickoff (Canonical Flow)

```text
Issue (GitHub) → Project In Progress → feature/* from sandbox → PR → sandbox → PR → main
```

```bash
git checkout sandbox && git pull origin sandbox
git checkout -b feature/<slug>
gh issue comment <N> --repo KleilsonSantos/ai-operating-system \
  --body "🚀 Kickoff: branch \`feature/<slug>\` created from \`sandbox\`."
```

Before push: typecheck/lint/tests for the area you touched.

PR always targets `sandbox`. Merge **only** via:

```bash
bash scripts/merge-pr.sh <N>
```

Subject: `merge: 🔀 PR #<n> — <branch>` (never GitHub’s default).

Details: [git-workflow.md](./git-workflow.md).
