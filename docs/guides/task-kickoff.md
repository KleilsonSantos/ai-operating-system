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

PR body for work branches → `sandbox` **must** include `Refs #<N>` (or `#<N>`). CI job `issue-link` fails otherwise (#435). On promote → `main`, prefer `Closes #<N>` ([GitHub linking docs](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue) — closing keywords only apply on the default branch).

Before push: typecheck/lint/tests for the area you touched, then local issue-link parity:

```bash
bash scripts/check-pr-delivery-gate.sh
```

Agent order (inspect → unit → delivery gate → optional `ok infra` → commit): [local-runtime-authorization.md](./local-runtime-authorization.md). Event map: [delivery-automation.md](./delivery-automation.md).

Work branches target `sandbox`. After that merge, promote `sandbox` to `main` with a second PR. Merge **only** via:

```bash
bash scripts/merge-pr.sh <N>
```

Subject: `merge: 🔀 PR #<n> — <branch>` (never GitHub’s default).

Details: [git-workflow.md](./git-workflow.md).

## Cursor agent + `gh` (network allowlist)

Cursor’s agent Shell seatbelt allowlists `github.com` (git) by default but **not** `api.github.com` (REST/GraphQL used by `gh`). A blocked API call is often misreported as “token in keyring is invalid” even when Terminal `gh auth status` is healthy.

This repo ships [`.cursor/sandbox.json`](../../.cursor/sandbox.json) allowing `api.github.com`, plus readonly `~/.nvm` and shared build cache so sandboxed Shell can resolve Node without disabling the sandbox (#491). In Cursor: **Settings → Agents → Auto Run → Auto-Run Network Access** → `sandbox.json + Defaults` (or Allow All).

Optional global allowlist for all workspaces: copy via `bash scripts/install-cursor-sandbox-allowlist.sh` (or merge the same keys into `~/.cursor/sandbox.json`).

### Agent Shell PATH (no login `.zshrc`)

Agent Shell is **not** a login shell, so interactive `nvm` / Homebrew PATH may be missing → `command not found: node`. This repo injects a minimal PATH via [`.cursor/hooks.json`](../../.cursor/hooks.json) → [`.cursor/hooks/inject-agent-path.sh`](../../.cursor/hooks/inject-agent-path.sh) (`preToolUse` matcher `Shell`). Restart the Agent chat after pulling so hooks reload.

**Ignore** chat stderr like `/usr/bin/base64: … Operation not permitted` or `dump_zsh_state: command not found` — Cursor harness noise, not AIOS or CI failure.

## Async CI babysit (ADR-0028)

Long CI runs should not block chat. Prefer:

1. Open PR → kickoff comment → **end turn** or continue other work.
2. When checks settle (or on notification), ingest locally:

   ```bash
   node scripts/record-delivery-ci.mjs --pr <N>
   ```

   Appends `kind: delivery.ci` rows to `.aios/metrics/events.jsonl`.

3. Inspect Prometheus text: `aios --metrics-prometheus` (or Console `GET /metrics`).
4. GitHub Actions also uploads `delivery-ci-events-<run_id>` artifacts from [`.github/workflows/delivery-observability.yml`](../../.github/workflows/delivery-observability.yml) — optional download; not committed.

Grafana is user-owned (ADR-0021). Example PromQL: `sum by (check, conclusion) (aios_delivery_ci_total)`.

Details: [delivery-observability.md](./delivery-observability.md) · [ADR-0028](../adr/0028-delivery-ci-observability.md).
