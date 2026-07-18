# Prompt Knowledge Base (PKB)

Docs-as-Code catalog of **reusable prompt assets** for AIOS — Prompt Engineering, Context Engineering, and AI Engineering patterns used while building the product.

This is **not** a second product SSOT. Canonical product truth remains:

1. Code (`engines/` · `packages/` · `apps/`)
2. [`docs/FOUNDATION.md`](../FOUNDATION.md) · ADRs · [`ROADMAP.md`](../ROADMAP.md)
3. Policies (`policies/aios.policies.json`) — **policies > long prompts**

Related engines (do **not** duplicate here):

| Capability | Where |
| --- | --- |
| Governed brief builder (`compilePrompt`) | `@aios/prompt` · ADR-0008 |
| Session / project memory | `@aios/memory` · ADR-0006 |
| Heuristic knowledge graph | `@aios/knowledge` · ADR-0005 |
| External official references | [`docs/references/`](../references/) (#133) |

Long-term evolution: [`VISION.md`](./VISION.md).

## Layout

```text
docs/prompts/
  README.md                 # this file (rules + intake)
  VISION.md                 # long-term ladder (RAG / MCP / …)
  index.yaml                # machine-readable catalog
  by-domain/<domain>/<slug>.vN.md
  templates/                # thin skeletons for new assets
  archived/                 # retired versions (keep history)
```

Naming: `{slug}.v{n}.md` — descriptive English slug, SemVer-like integer `n`, stable `id` in frontmatter + `index.yaml`.

## Frontmatter (required)

| Field | Notes |
| --- | --- |
| `id` | Stable unique id, e.g. `prompt.documentation.readme-docs-architecture-audit` |
| `title` | Short English title |
| `domain` | Folder under `by-domain/` |
| `purpose` | One-line why |
| `tags` | Searchable keywords |
| `version` | Integer matching `.vN` |
| `status` | `active` · `draft` · `archived` |
| `language` | Body language (`pt-BR`, `en-US`, …) |
| `ai_ready` | Safe to feed agents as-is |
| `related_docs` | Paths under `docs/` or repo root |
| `related_prompts` | Other prompt `id`s |
| `created_at` / `updated_at` | ISO date |

## Intake rule (when a strong prompt appears)

1. Assess reuse potential — avoid one-off chat dumps.
2. Deduplicate / unify with an existing asset when possible.
3. Place under the best `by-domain/`.
4. Fill frontmatter + update `index.yaml`.
5. Prefer invoking engines/MCP (`compilePrompt`, audit, pipeline) over copying Policy Engine text into the prompt body.

## Explicit non-goals (MVP)

- Embeddings / vector DB / RAG runtime (needs a future ADR; not blocked by this tree)
- Replacing Memory Engine or Knowledge Graph
- Hosting pirate PDFs or a second curriculum dump
- Auto-persisting every chat message without human review

## Catalog (MVP)

See [`index.yaml`](./index.yaml). Initial domains: `documentation`, `knowledge`, `ai-engineering`.
