# External references catalog

Curated, versioned links to **official / legal** external documentation that humans and agents should prefer when researching (`official-docs` policy).

This is **not** product SSOT and **not** a curriculum dump.

| Layer | Role |
| --- | --- |
| Product SSOT | [`FOUNDATION.md`](../FOUNDATION.md) · ADRs · [`ROADMAP.md`](../ROADMAP.md) · code |
| Prompt assets | [`docs/prompts/`](../prompts/) (PKB · #134) |
| Runtime state | `.aios/memory`, Knowledge Graph — not catalogs |
| **This folder** | External **references** only (URLs + metadata) |

Design note: [`DESIGN.md`](./DESIGN.md).

## Rules

1. **Legal / official only** — publisher owns the content (standards bodies, vendors, RFCs, official free books).
2. **No piracy** — never link pirate PDF mirrors, scraped paywalled books, or unlicensed dumps.
3. **Prefer primary sources** — NIST, OWASP, CNCF, W3C/IETF, vendor docs, Google SRE (sre.google), etc.
4. **Thin entries** — `id`, `title`, `area`, `url`, `publisher`, `reviewedAt`, `status`, optional `notes`.
5. **Wiki** remains a link map only — do not duplicate FOUNDATION there.
6. **Review cadence** — quarterly (or when a URL breaks / a major edition ships). Update `reviewedAt` and `status`.

## Layout

```text
docs/references/
  README.md      # this file
  DESIGN.md      # SSOT vs catalog vs runtime
  catalog.yaml   # machine-readable index
```

## Intake

When adding a reference:

1. Confirm the URL is the official publisher page.
2. Pick the best `area` (see `catalog.yaml`).
3. Set `status: active` and today’s `reviewedAt` (ISO date).
4. One line `notes` if the entry needs context — avoid essays.

## Out of scope

- RAG / embeddings / vector DB
- Hosting PDFs in-repo
- Replacing Memory, KG, or Policy Engine
- Prompt templates → [`docs/prompts/`](../prompts/)
