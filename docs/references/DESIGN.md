# External references — design note (#133)

## Decision

Ship a **Docs-as-Code catalog** of external official URLs under `docs/references/`, separate from product SSOT and from runtime knowledge/memory.

| Concern | Where it lives |
| --- | --- |
| What AIOS *is* and how it behaves | `docs/FOUNDATION.md`, ADRs, ROADMAP, code |
| Reusable prompt assets | `docs/prompts/` (PKB) |
| Session / project facts | Memory Engine (ADR-0006) |
| Heuristic repo graph | Knowledge Graph (ADR-0005) |
| External standards & vendor docs | **`docs/references/catalog.yaml`** |

## Why not ADR-level runtime?

No new engine, MCP tool, or storage path in this vertical — only curated links + metadata. An ADR would over-specify a folder convention; this note + README are enough (YAGNI). Revisit if we add `aios_audit_docs` inventory or MCP exposure.

## Trade-offs

- **Pro:** Agents/humans get a reviewable, legal shortlist aligned with `official-docs`; no second SSOT.
- **Con:** Links rot — mitigated by quarterly `reviewedAt` and `status: deprecated|broken`.
- **Explicit non-goal:** embedding every IT syllabus or hosting books.

## Related

- Policy `official-docs` · ADR-0018 (US English product docs)
- PKB: #134 · `docs/prompts/`
- Parked previously on #133 until unparked 2026-07-18
