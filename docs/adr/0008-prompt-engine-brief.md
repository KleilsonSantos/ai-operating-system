# ADR-0008: Prompt Engine — governed brief (`@aios/prompt`)

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** Kleilson dos Santos
- **Issue:** #59

## Context

The dominant cost in Cursor/Claude/Copilot today is **repeating** policies, preferences, and repo context on every chat. AIOS’s mission is governance — not replacing the IDE’s LLM. We need a compact artifact the Agent consumes instead of a long “sermon.”

## Decision

1. Engine **`@aios/prompt`** with `compilePrompt({ input, workspaceId?, repoPath? })`.
2. The brief includes: request · intent · repo/workspace · KG summary · must policies · constraints · memory · short instructions to the Agent.
3. **Does not** call an LLM — only builds deterministic text/structure.
4. MCP `aios_compile_prompt` · CLI `--compile-prompt` (`--brief-only` prints markdown only).
5. Pipeline `contractVersion` stays `"1"` (additive MCP tool).

## Consequences

### Positive

- Token savings: short user input + generated brief
- Aligns with policies > long prompts (FOUNDATION)
- Prepares multi-provider Router (the brief is model-independent)

### Trade-offs

- Brief is still heuristic (no LLM re-ranking)
- Memory only enters when `workspaceId` is present

## Rejected alternatives

| Option | Reason |
| --- | --- |
| IDE extension → Ollama first | Replaces the IDE; out of scope |
| Cursor Rules only, no MCP | Already exists; insufficient for live memory/KG |
| Generate brief with LLM | Cost + non-determinism in Phase 1 of this vertical |

## References

- [cursor-chat-bridge](../guides/cursor-chat-bridge.md)
- [ROADMAP Phase 3](../ROADMAP.md)
- [ADR-0006](./0006-memory-engine-session.md)
