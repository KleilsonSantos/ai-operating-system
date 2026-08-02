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

## Cursor agent + `gh` (network allowlist)

Cursor’s agent Shell seatbelt allowlists `github.com` (git) by default but **not** `api.github.com` (REST/GraphQL used by `gh`). A blocked API call is often misreported as “token in keyring is invalid” even when Terminal `gh auth status` is healthy.

This repo ships [`.cursor/sandbox.json`](../../.cursor/sandbox.json) allowing `api.github.com`. In Cursor: **Settings → Agents → Auto Run → Auto-Run Network Access** → `sandbox.json + Defaults` (or Allow All).

Optional global allowlist for all workspaces: `~/.cursor/sandbox.json` with the same `networkPolicy.allow` entry.
