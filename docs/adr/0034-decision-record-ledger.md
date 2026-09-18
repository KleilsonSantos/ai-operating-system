# ADR-0034: DecisionRecord ledger on PipelineRun

- **Status:** Accepted
- **Date:** 2026-09-17
- **Deciders:** Kleilson dos Santos
- **Issue:** [#497](https://github.com/KleilsonSantos/ai-operating-system/issues/497)

## Context

`PipelineRun.steps` already records execution (classify, route, skill, agents, gate), but the **why** of each choice is only free-form `detail` strings. Governance JSONL (`GovernanceDecision` / `recordDecision`) is for human ADR/policy notes — not runtime route/skill/agent selection. External pattern analysis called for a typed DecisionRecord without a parallel store.

## Decision

1. **Additive type on contract v1.** `DecisionRecord` (`subject`, `outcome`, `value`, optional `reason` / `stepId`) lives in `@aios/shared`. `PipelineRun.decisions` is always populated by `buildPipelineRun`.
2. **SSOT on the run.** No new engine and no metrics dual-write (`kind: decision`). Persist via the existing run store (`.aios/runs/`).
3. **Visibility surface.** Trail items may include `kind: 'decision'`; step labels may include `detail`. Obsidian run notes list Decisions when present.
4. **Not governance notes.** Do not overload `engines/governance` `recordDecision` or `KNOWN_DECISION_KINDS`.

## Consequences

### Positive

- Auditors can answer intent → route → skill → agent → gate from one persisted run
- Console Run trail can filter Decisions without a second backend

### Trade-offs

- Older on-disk runs may lack `decisions`; readers should treat missing as `[]`
- Skill auto-trigger remains out of scope (ADR-0026: explicit `skillIds` only)

## Rejected alternatives

| Option                                      | Reason                                             |
| ------------------------------------------- | -------------------------------------------------- |
| New metrics `kind: decision` only           | Duplicates run store for in-pipeline choices       |
| Reuse governance `decisions.jsonl`          | Wrong semantic domain (human control-plane notes)  |
| Expand SkillManifest triggers in same slice | Separate P1; must not invent a second skill system |
