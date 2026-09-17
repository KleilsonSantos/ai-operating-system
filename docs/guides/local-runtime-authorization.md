# Local runtime authorization (MacBook resource gate)

Protects the owner's **shared MacBook** from agents or scripts starting heavy runtime services without explicit approval.

This guide and [`.cursor/rules/local-runtime-gate.mdc`](../../.cursor/rules/local-runtime-gate.mdc) **win** over long PKB prompts when they conflict. Product policies remain SSOT: [`resource-aware-macos.md`](../policies/resource-aware-macos.md), `policies/aios.policies.json` (`resource-first`, `inspect-before-install`, `reuse-before-create`, `ai-provider-reuse`).

## Canonical delivery order (mandatory)

Agents and contributors follow this sequence. **Do not skip or reorder steps.**

```text
1. INSPECT     read-only — code, docs, git, docker ps, lsof, provider/MCP already running?
       ↓
2. AUDIT       map architecture, gaps (classify OBSERVED / NOT VALIDATED)
       ↓
3. TASK GATE   owner: ok / prossegue — implement fixes if in scope
       ↓
4. UNIT PROOF  pnpm typecheck / lint / tests for the touched area (required)
       ↓
4b. DELIVERY   bash scripts/check-pr-delivery-gate.sh — issue-link parity before push (required when PR → sandbox)
       ↓
5. INFRA GATE  only if live Console / MCP HTTP / Ollama / Compose still needed — owner: ok infra
       ↓
6. LIVE PROOF  minimal services only → record status + evidence
       ↓
7. COMMIT READY report success, diff summary, suggested Conventional Commit + gitmoji messages
       ↓
8. COMMIT      only when owner explicitly asks to commit (never automatic)
       ↓
9. POST-PUSH   prefer async CI babysit (ADR-0028); never merge on red issue-link
```

**Rules:**

- **Step 5 never before step 4.** Do not request `ok infra` until unit proof for the scope passes.
- **Step 4b before every push** that will open or update a PR → `sandbox`. Draft text: `PR_TITLE` / `PR_BODY` / branch name with `Refs #N`.
- **Step 8 never before steps 4–6** for the declared scope. If live proof is not needed, mark steps 5–6 `N/A` with justification — still require step 4 (and 4b before push).
- If step 6 fails, return to step 3 (fix) and re-run 4 → 5 → 6; do not commit.

## Three gates (do not merge)

| Gate       | Owner says                                        | When                                           | Agent may                                            |
| ---------- | ------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| **Task**   | `ok` · `prossegue`                                | After inspect/audit plan accepted              | Implement, docs, run unit/typecheck for scope        |
| **Infra**  | `ok infra` · `autorizo infra` · `prossegue infra` | **After step 4 success**, if live proof needed | Start Console, MCP HTTP, Ollama, Compose (see below) |
| **Commit** | explicit commit request                           | **After steps 4–6 success** for scope          | `git add` + `git commit` (Conventional + gitmoji)    |

PKB catalog intake remains catalog-only until task gate. Infra gate is **never** a substitute for unit proof.

## Read-only (steps 1–2, no infra gate)

- Read repo, docs, ADRs, `package.json`, Compose files, configs
- `git status`, `git diff`, `git log`
- `pnpm typecheck` / `pnpm test` (or filtered packages) for step 4 — allowed under task gate without infra
- `docker ps`, `docker network ls`, `docker volume ls`, `docker images`
- `docker compose config` (render only — **do not** `up`)
- `lsof -nP -iTCP -sTCP:LISTEN`; check whether Ollama / Console (`:8787`) / MCP HTTP (`:8791`) already listen
- `curl` / MCP health only against **already running** services the owner started

Classify live Console/MCP/Ollama/Compose results as **NOT VALIDATED** until steps 5–6 complete.

## Requires infra gate (step 5+)

Ask the owner **only after step 4 passes**:

| Category          | Examples                                                                              |
| ----------------- | ------------------------------------------------------------------------------------- |
| Container runtime | `colima start`, `docker compose up`, `docker run`, `docker build`, `docker pull`      |
| AIOS processes    | `pnpm`/`tsx` Console API, MCP Streamable HTTP on `:8791`, background CLI daemons      |
| Local model       | Starting **new** Ollama process or pulling models when none is reusable               |
| Process control   | `kill` / `pkill` on service ports owned by this work                                  |
| Live HTTP proof   | Smoke / audit pack: `bash scripts/run-postman-audit-pack.sh` (± `--with-mcp`) or curl |

Never: `docker compose down -v`, `docker system prune`, stopping unrelated containers, installing a second Ollama while one already serves.

Reuse first: existing Ollama, existing MCP stdio session, already-up Console — per `ai-provider-reuse` / `reuse-before-create`.

## Pre-infra brief (required at step 5)

Include evidence that **step 4 passed**, then:

1. **Objective** — what live proof is still missing
2. **Services to start** — minimal set
3. **Ports** — vs `lsof` / existing listeners
4. **Coexistence** — reuse vs isolate
5. **Resource note** — CPU/RAM/battery on 16GB MacBook
6. **Destructive risk** — kills, volume writes
7. **Stop plan** — what stays running after session

Then ask for `ok infra` / `autorizo infra` / `prossegue infra`.

## Delivery gate (step 4b)

```bash
bash scripts/check-pr-delivery-gate.sh
# Draft PR text:
PR_BASE=sandbox PR_HEAD="$(git branch --show-current)" \
  PR_TITLE='docs: …' PR_BODY='Refs #448' \
  bash scripts/check-pr-delivery-gate.sh
```

Selftest (no network when verifying failure paths with fake refs): `bash scripts/check-pr-delivery-gate-selftest.sh`

## Commit-ready checklist (step 7)

- [ ] Audit scope executed and reported
- [ ] Unit/typecheck (and tests for touched packages) green
- [ ] If PR → `sandbox`: delivery gate OK (`Refs #N`)
- [ ] Live proof done or explicitly `N/A`
- [ ] CHANGELOG / docs updated when behavior or operator-facing flow changed
- [ ] No secrets in diff (`.env`, tokens, API keys)
- [ ] Suggested commit message(s) — `type: <gitmoji> …`

Wait for owner to say **commit** — do not commit on "ready to commit" alone.

## Post-push CI (step 9)

Prefer async ([ADR-0028](../adr/0028-delivery-ci-observability.md)):

1. Push / open PR with `Refs #N` → kickoff comment if needed → **end turn** or continue other work
2. When checks settle: `node scripts/record-delivery-ci.mjs --pr <N>`
3. On **FAIL**: `gh run view --log-failed`, fix locally, re-run delivery gate + unit proof, push again
4. **Never merge on red `issue-link`**; use `bash scripts/merge-pr.sh <n>` only when required checks are green

Blocking `gh pr checks --watch` only when the owner asks.

## Owner cadence (summary)

| Phrase                                            | Meaning                                                                    |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| `next`                                            | Proposal only — stop at step 2                                             |
| `ok` / `prossegue`                                | Steps 3–4 (implement + unit proof)                                         |
| `ok infra` / `autorizo infra` / `prossegue infra` | Steps 5–6 (after step 4 green)                                             |
| "commita" / "commit" / explicit ask               | Step 8                                                                     |
| Decline or silence on infra                       | Report live items as NOT VALIDATED; no commit unless owner accepts the gap |

## Cursor Agent Shell noise vs actionable failures

| Symptom                                                  | Action                                                                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `command not found: node` / `pnpm` / `gh` on Agent Shell | PATH/sandbox — project hook + `.cursor/sandbox.json` (#491); retry with elevated perms only if still missing |
| `base64` / `/dev/stdout: Operation not permitted`        | Ignore — Cursor harness under seatbelt                                                                       |
| `dump_zsh_state: command not found`                      | Ignore — Cursor shell teardown helper                                                                        |

Details: [`task-kickoff.md`](./task-kickoff.md) (Cursor agent sections).

## Related

- [`resource-aware-macos.md`](../policies/resource-aware-macos.md)
- [`delivery-automation.md`](./delivery-automation.md)
- [`task-kickoff.md`](./task-kickoff.md)
- [`git-workflow.md`](./git-workflow.md)
- [`.cursor/sandbox.json`](../../.cursor/sandbox.json) — `api.github.com` + readonly `~/.nvm` for Agent Shell (#491)
- [`.cursor/hooks.json`](../../.cursor/hooks.json) — Shell `preToolUse` PATH inject (#491)
