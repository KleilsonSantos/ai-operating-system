# Publish an Agent

> Phase 5b · [ADR-0023](../adr/0023-agent-registry-marketplace.md) · scaffold: [`@aios/create-agent`](../../packages/create-agent/) · companion guide: [Writing an Agent](./writing-an-agent.md)

This guide explains how to publish a **community** agent so AIOS can discover it via the GitHub topic `aios-agent`. Discovery is read-only catalog metadata — not automatic remote code execution.

## Prerequisites

1. A valid `agent.yaml` (or `.json`) at the package root (or under `.aios/`). See the [schema](../../packages/agent-registry/schema/agent.schema.json).
2. Scaffold optional: `pnpm --filter @aios/create-agent dev -- --name my-agent` (see Writing an Agent).
3. Public GitHub repository (private repos are not in the public topic search).

## Steps

1. **Develop and test** — unit-test `run()`, validate the manifest with `AgentRegistry.validate`.
2. **Tag the repo** — on GitHub → About → Topics → add **`aios-agent`**. Keep metadata tags in `agent.yaml` (`metadata.tags`) aligned when useful.
3. **Document** — README should state that the package is an AIOS agent plugin (agents are plugins; not primary UX).
4. **Wait for ingest** — the **Community agents ingest** workflow (weekly Monday 06:00 UTC, or `workflow_dispatch`) scans `topic:aios-agent`. When the agents list changes, it opens or updates a PR to `sandbox` refreshing `packages/agent-registry/data/community-catalog.json`. Maintainers review flags, then merge (git flow).
5. **Verify** — after that PR lands on `sandbox` / `main`:

   ```bash
   pnpm --filter @aios/cli exec aios --list-agents
   # look for source [community]
   ```

## Catalog & heuristics (MVP)

Ingest script: `node scripts/community-agents-ingest.mjs` (`pnpm community:ingest`).

| Flag              | Meaning                                                             |
| ----------------- | ------------------------------------------------------------------- |
| `stale`           | No push in ~12 months                                               |
| `suspicious`      | Archived, or description/name matches crude abuse heuristics        |
| `missingManifest` | No `agent.yaml` / `.aios/agent.yaml` (etc.) found on default branch |

Flagged entries still appear as **stubs** so operators can review them; they are not auto-trusted for execution.

The script **does not rewrite** the catalog when only `generatedAt` would change (stable fingerprint of the agents list), so empty weeks do not open no-op PRs. Use `--force` to rewrite anyway.

## First-agent verification gate

Reference smoke repo: [`KleilsonSantos/aios-agent-smoke`](https://github.com/KleilsonSantos/aios-agent-smoke) (`topic:aios-agent`, `agent.yaml` at repo root). The committed catalog at `packages/agent-registry/data/community-catalog.json` includes this entry as of `v0.29.0`.

To re-verify after new publishers appear:

1. Ensure the public repo has topic `aios-agent` + discoverable manifest.
2. Run **Community agents ingest** → `workflow_dispatch` (or `pnpm community:ingest`).
3. Review/merge the catalog PR → `sandbox`, then promote when ready.
4. Confirm `aios list-agents` shows `source: community`.

## Out of scope (this MVP)

- Always-on async HTTP registry service / n8n as product dependency
- Productized malware scanning / owner negotiation UX
- npm publish of `@aios/create-agent` as a public `npm create` package (tracked separately)

## Manual refresh

```bash
# Prefer a token to avoid unauthenticated rate limits
export GITHUB_TOKEN="$(gh auth token)"
pnpm community:ingest
# or: node scripts/community-agents-ingest.mjs
```

Or run the **Community agents ingest** workflow (`workflow_dispatch`) and review the PR / artifact.
