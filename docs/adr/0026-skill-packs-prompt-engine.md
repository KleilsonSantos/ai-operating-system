# ADR-0026: Skill packs for the Prompt Engine

- **Status:** Accepted
- **Date:** 2026-08-15
- **Deciders:** Kleilson dos Santos
- **Issue:** #284

## Context

ADR-0024 added execution state. ADR-0025 added capability-class routing and a named context budget. The remaining thin slice on the same spine is **how** a run should behave — not a new agent and not a hook bus.

Operator and IDE agents already consume `compilePrompt`. Repeating “allowed tools / on-fail” in chat wastes tokens and invents persona. A skill pack is a small, opt-in manifest the Prompt Engine can inject into the brief.

## Decision

1. **How, not who.** A skill pack is `{ id, purpose, allowedTools, failurePolicy }` plus optional `prerequisites` / `contextRequirements` / `validation`. `failurePolicy` is `fail` | `skip` | `retry`. It is not an agent, not a marketplace listing, and not a clone of `review.change` or docs-writer.
2. **Default is none.** `compilePrompt` and `runPipeline` do not read a catalog unless `skillIds` is requested. Unknown ids are skipped — they do not invent a pack. Catalog path: `skills/aios.skills.json` (walk-up from target `repoPath`, then `AIOS_HOME` / process `cwd`), `AIOS_SKILLS_PATH`, or `skillsPath`. Shipping a catalog file is optional; when present, packs stay opt-in. First in-repo example: `multi-cloud-honesty` (external lab analysis — see [external-lab-workspace.md](../guides/external-lab-workspace.md)).
3. **Prompt Engine consumes the pack.** Selected manifests appear in `CompiledPrompt.skills`, `stats.skillCount`, and an optional `## Skills` section of the brief.
4. **Pipeline records ids only.** `runPipeline` copies requested ids onto `PipelineResponse.run.skillIds` and emits a `skill` step (`ok` if any id, else `skip`). It does not depend on `@aios/prompt`. `contractVersion` stays `"1"`.
5. **MCP / CLI opt-in.** `aios_compile_prompt` and `aios_run_pipeline` accept optional `skillIds`. CLI `--skill-ids=a,b`.
6. **MCP tool gate (thin).** When a tool call includes `skillIds`, the MCP wrapper authorizes the **tool name** against the union of selected packs' `allowedTools` (after the privilege gate — skills never expand privilege). Unknown ids are skipped; if none resolve, the call is denied (`skill.denied` / `skill.none-resolved`). Default remains none when `skillIds` is omitted. Session-wide lockdown without per-call `skillIds` is out of scope.

## Consequences

### Positive

- Brief can name allowed tools and on-fail without a new runtime
- No file I/O on the default path
- Execution contract stays incremental

### Trade-offs

- Catalog is thin and operator-extensible; in-repo packs are honesty/how examples, not a marketplace
- MCP enforces `allowedTools` only when `skillIds` is present on the call — agents can still invoke other tools without skill ids (brief remains advisory for those paths)
- Pipeline records ids; it does not enforce `allowedTools` inside `runPipeline` steps
- `retry` is declarative only — no retry loop
- Presence of `skills/` does not change default-none — callers must still pass `skillIds`

## Rejected alternatives

| Option                               | Reason                                            |
| ------------------------------------ | ------------------------------------------------- |
| New agent per skill                  | Agents are plugins; skill is how, not who         |
| Hook bus / marketplace               | Out of scope for this slice                       |
| Always load `skills/`                | Violates default-none and artifact-lifecycle      |
| Depend on `@aios/prompt` in pipeline | Extra lockfile / coupling for a record-only field |

## References

- [ADR-0008](./0008-prompt-engine-brief.md)
- [ADR-0024](./0024-execution-state-capability-registry.md)
- [ADR-0025](./0025-model-router-context-budget.md)
- Audit: [`docs/audits/agent-runtime-evolution-analysis-2026-08.md`](../audits/agent-runtime-evolution-analysis-2026-08.md)
