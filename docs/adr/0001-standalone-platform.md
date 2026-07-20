# ADR-0001: AIOS as a standalone governance platform

- **Status:** Accepted
- **Date:** 2026-07-13
- **Deciders:** Kleilson dos Santos

## Context

There is demand for AI governance in the SDLC (agents, policies, context, quality gates). Packaging that only as loose prompts or as an annex to another repository does not scale: orchestration, decision, quality gate, and stable contracts are missing.

## Decision

Treat **`ai-operating-system` (AIOS)** as a **single, independent** product: a governance platform for AI applied to software development.

```text
User / integrators  →  AIOS (platform)  →  engines + plugins
```

## Consequences

### Positive

- Clear mission: AI governance in the SDLC
- Own evolution and releases
- Agents as plugins; policies as the source of truth
- Demonstrates platform architecture, not only prompts

### Trade-offs

- Larger scope than a prompt kit
- Requires ROADMAP discipline by phase (avoid building every engine at once)

## Rejected alternatives

| Option                                     | Reason                                                  |
| ------------------------------------------ | ------------------------------------------------------- |
| Prompts / `AGENTS.md` only, no runtime     | Does not cover orchestration, decision, or quality gate |
| Embed AIOS as a folder in another monorepo | Couples release cycles and confuses the product mission |

## References

- [`docs/FOUNDATION.md`](../FOUNDATION.md) — foundation
- [`docs/VISION.md`](../VISION.md)
- [`docs/ROADMAP.md`](../ROADMAP.md)
