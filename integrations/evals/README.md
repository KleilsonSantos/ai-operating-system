# Selection eval harness

Deterministic goldens for **Intent → agent matrix → capability class** (harness P0 / #447).

This is **not** a new engine and **not** an LLM-as-judge suite. It reuses:

- `@aios/intent` — `resolveIntent`
- `@aios/decision` — `AGENT_MATRIX` / `agentsForIntent`
- `@aios/shared` — `routeModel`
- `@aios/pipeline` — optional contract check (`skillIds` recorded, `act: false`)

## Run

```bash
pnpm evals
# or
pnpm --filter @aios/evals test
```

## Fixtures

JSON files under `fixtures/`. Schema:

```json
{
  "id": "unique-id",
  "input": "user utterance",
  "mode": "selection",
  "request": { "skillIds": [], "costBudget": "low" },
  "expect": {
    "intentKind": "analyze.project",
    "capabilityClass": "reasoning",
    "agents": { "include": ["architecture"], "exclude": ["docs"] },
    "skillIds": { "selected": ["governed-brief"], "rejected": ["docs-only"] },
    "act": false
  }
}
```

- Default `mode` is `selection` (no repo I/O).
- `mode: "pipeline"` runs `runPipeline` once (Resource-Aware: keep few).
- Skill **auto-trigger** is out of scope (ADR-0026: explicit `skillIds` only). Pipeline goldens assert **recording**, not selection.

## CI

Root `pnpm evals` runs in the `quality` job.
