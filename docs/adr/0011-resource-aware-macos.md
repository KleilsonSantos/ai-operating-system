# ADR-0011: Resource-Aware Development (macOS) as canonical policy

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** Kleilson dos Santos

## Context

The development MacBook (16GB, IDEs, browser, AIOS console) does not handle “install by default” well (Ollama + models, Docker Desktop, local K8s). Without an explicit policy, agents suggest heavy and duplicated stacks.

## Decision

1. Canonical document: [`docs/policies/resource-aware-macos.md`](../policies/resource-aware-macos.md).
2. Operational policies in `policies/aios.policies.json` (`resource-first`, `inspect-before-install`, `reuse-before-create`, `ai-provider-reuse`) — synced to Cursor via `pnpm sync:cursor-rules`.
3. Auxiliary Ollama provider remains **optional**; the console treats inactivity as **warn**, not a product failure.
4. Before installing local Ollama/Gemini/DeepSeek: inspect the environment; prefer reusing an already available API/MCP if it covers the case.

## Consequences

### Positive

- Less pressure to install heavy software just to “go green”
- Aligns agents to inspect before acting
- Compatible with token economy (FOUNDATION)

### Trade-offs

- Local auxiliary (Ollama) requires a conscious decision + RAM
- Cloud free tiers (Gemini) may be preferable to a local model on a 16GB Mac

## Rejected alternatives

| Option                     | Reason                                            |
| -------------------------- | ------------------------------------------------- |
| Long chat-only prompt      | Violates `short-user-prompt` / policies > sermons |
| Ollama required for health | Forces install and RAM without a governance need  |

## References

- [FOUNDATION](../FOUNDATION.md)
- [ADR-0009](./0009-multi-provider-ollama.md)
- [ADR-0010](./0010-governance-console.md)
