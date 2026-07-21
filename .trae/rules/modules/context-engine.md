---
description: Use for context-engine changes, context retrieval heuristics, and repository-document prioritization
globs:
  - engines/context/**/*.ts
  - engines/context/**/*.md
alwaysApply: false
---

# Context Engine Notes

When working on the context engine, read these sources together:

- [`engines/context/src/`](../../../engines/context/src/)
- [`../../../.trae/rules/project-map.md`](../../../.trae/rules/project-map.md)
- [`../../../docs/FOUNDATION.md`](../../../docs/FOUNDATION.md)
- [`../../../docs/guides/git-workflow.md`](../../../docs/guides/git-workflow.md)
- [`../../../policies/aios.policies.json`](../../../policies/aios.policies.json)

## Prioritization Guidance

- Prefer code and scoped documentation over generic root-level summaries.
- Treat [`../../../AGENTS.md`](../../../AGENTS.md) as a compatibility bridge, not the dominant context source.
- Keep `.trae/rules/` visible to the context engine so project rules can be gathered alongside product docs.
- Preserve root anchors such as `README.md`, `docs/FOUNDATION.md`, and `package.json` when gathering scoped context.
