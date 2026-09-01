---
description: 'Keep the pt-BR owner glossary in sync whenever new AIOS engines, agents, policies, ADRs, or core concepts are added or renamed.'
applyTo: 'engines/**,packages/**,apps/**,policies/**,docs/adr/**,docs/architecture/**'
---

# AIOS glossary maintenance

There is an owner-facing, pt-BR, ADHD-friendly glossary of AIOS terminology at
[`owner/glossario-aios.md`](../../owner/glossario-aios.md). It lives under `owner/`
(explicitly non-SSOT, linked from the root `README.md`) as an intentional exception to
`docs-language-en` (ADR-0018) — see the note at the top of that file and
[`owner/README.md`](../../owner/README.md). Do not use it as a template for other product docs,
and do not recreate a second copy elsewhere (e.g. under `docs/guides/`) — reuse this one
per the `artifact-lifecycle` policy.

When you add, remove, or materially change one of the following, check whether the
glossary needs an update:

- A new engine under `engines/**` or a new package under `packages/**`/`apps/**`.
- A new agent/plugin registered in the decision engine (`AGENT_MATRIX`).
- A new `must`/`should` policy in `policies/aios.policies.json`.
- A new ADR under `docs/adr/**` that introduces a new concept or renames an existing one.
- A new architecture concept documented under `docs/architecture/**` (e.g. a new harness layer).

If an update is needed:

1. Add a short term block inside the matching "Etapa" section (keep the existing shape:
   **Analogia** / **O que é** / **Para que serve** / **Não é**).
2. Add one line to the "Etapa 10 — Índice A–Z" quick-reference index.
3. Do not rewrite the whole file for one term — append only the new block/line, per the
   file's own "Manutenção" note at the bottom.
4. Keep all glossary body content in pt-BR with a plain-language analogy — do not switch
   it to English or drop the analogy/"não é" columns.

If the change is purely internal refactoring with no new user-facing concept or term,
no glossary update is needed.
