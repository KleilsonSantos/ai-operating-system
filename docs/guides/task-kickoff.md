# Task Kickoff (Canonical Flow)

```text
Issue (GitHub) → Project In Progress → semantic branch from sandbox → PR → sandbox → promotion PR → main
```

```bash
git checkout sandbox && git pull origin sandbox
git checkout -b <type>/<slug>
gh issue comment <N> --repo KleilsonSantos/ai-operating-system \
  --body "🚀 Kickoff: branch \`<type>/<slug>\` created from \`sandbox\`."
```

Before push: typecheck/lint/tests for the area you touched.

Work branches target `sandbox`. After that merge, promote `sandbox` to `main` with a second PR. Merge **only** via:

```bash
bash scripts/merge-pr.sh <N>
```

Subject: `merge: 🔀 PR #<n> — <branch>` (never GitHub’s default).

Details: [git-workflow.md](./git-workflow.md).
