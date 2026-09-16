# External lab workspace (AIOS ↔ cloud-event-lab)

AIOS **analyzes** an optional sibling lab; it does **not** embed cloud emulators, Floci, LocalStack, or Magnitude into the AIOS core ([ADR-0001](../adr/0001-standalone-platform.md)).

## Coupling (only this)

| Artifact                                                                   | Role                                                                                                     |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [`workspaces/aios.workspaces.json`](../../workspaces/aios.workspaces.json) | Registry id `cloud-event-lab` → path `../cloud-event-lab` (sibling clone; adjust if your layout differs) |
| [`skills/aios.skills.json`](../../skills/aios.skills.json)                 | Opt-in pack `multi-cloud-honesty` ([ADR-0026](../adr/0026-skill-packs-prompt-engine.md))                 |

Default remains **none**: `compilePrompt` / `runPipeline` do not load the catalog unless `skillIds` is set. Missing lab path fails **validation** only — registry load still succeeds.

When `workspaceId` points at an external repo, the skill catalog is still resolved from the **AIOS install** (`AIOS_SKILLS_PATH`, `AIOS_HOME`, or operator `cwd`) — packs are how the control plane behaves, not files inside the lab.

## Operator smoke

```bash
# Path must exist on this machine (sibling of the AIOS clone)
# MCP: aios_list_workspaces / aios_workspace_validate with id=cloud-event-lab

pnpm --filter @aios/cli dev -- \
  --compile-prompt --brief-only \
  --workspace=cloud-event-lab \
  --skill-ids=multi-cloud-honesty \
  "Audit emulator honesty vs AWS/Azure/GCP claims."
```

## Non-goals

- No Docker Compose / LocalStack / Floci inside `engines/` or `apps/`
- No Magnitude (or other browser-agent) as control-plane dependency
- No monorepo merge of AIOS + lab

Lab mission and Floci spike live in **cloud-event-lab** (e.g. inspirations/non-goals after that repo’s PR #60). AIOS owns governance brief + workspace resolve only.
