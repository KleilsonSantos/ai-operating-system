# ADR-0012: Console safe actions — Try it (prove the runtime)

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** Kleilson dos Santos
- **Issue:** #76

## Context

The Health+Attention MVP (ADR-0010) shows state but does not prove value: the **see → act → see result** loop is missing. The user asked for a more interactive, palatable console — without becoming an IDE or calling agents in the UX.

## Decision

1. **Try it** column in `@aios/console` with **safe** actions that call existing engines.
2. Local API `POST /api/action` `{ action, input?, workspaceId? }` → `{ ok, latencyMs, result }`.
3. MVP actions:
   - `contract` — `PIPELINE_CONTRACT_VERSION`
   - `validate_workspaces` — `listValidatedWorkspaces`
   - `load_policies` — `loadPolicies` + mustIds
   - `compile_brief` — `compilePrompt` (brief truncated if too long)
   - `provider_ping` — `getProvider().health()` (Ollama optional)
   - `memory_recall` / `memory_remember` — `@aios/memory`
4. **Out of scope:** running agent plugins, Copilot-like chat, Grafana, new services (Resource-Aware / ADR-0011).
5. Agents remain plugins — they do not appear as “run agent” buttons.

## Consequences

### Positive

- Functional proof without mandatory Ollama (several actions do not depend on it)
- Reuses engines/MCP contract; zero new stack
- Aligns with policies > sermons (brief generated in place)

### Trade-offs

- Localhost-only API (no SaaS auth)
- Simple JSON/markdown output (not a rich editor)

## Rejected alternatives

| Option | Reason |
| --- | --- |
| Status refresh only | Does not prove engines |
| Agent buttons | Violates AGENTS.md / FOUNDATION |
| Proxy to Cursor Agent | Out of console scope |

## References

- [ADR-0010](./0010-governance-console.md)
- [ADR-0011](./0011-resource-aware-macos.md)
- [FOUNDATION](../FOUNDATION.md)
