# Documentation language

> **Canon:** US English for product documentation.  
> **ADR:** [ADR-0018](../adr/0018-documentation-language.md) · **Policy:** `docs-language-en`

## Rule

| Surface | Language |
| --- | --- |
| `docs/**`, ADRs, architecture guides | **US English** |
| `README.md`, `AGENTS.md` | **US English** |
| CHANGELOG section titles + new prose | **US English** ([Keep a Changelog](https://keepachangelog.com/)) |
| Code identifiers, APIs, env vars, package names | English (always) |
| Chat with the product owner | Portuguese OK (not product docs) |

**New and edited** product docs must be US English. Legacy Portuguese pages migrate when touched — no big-bang rewrite required.

## Why (concrete references)

1. **Google** — [Write for a global audience](https://developers.google.com/style/translation): developer documentation is written in **US English**, with localization as a separate step.
2. **Kubernetes** — [Documentation style guide](https://kubernetes.io/docs/contribute/style/style-guide/): English docs use **U.S. English** spelling and grammar.
3. **Docker** — [STYLE.md](https://github.com/docker/docs/blob/main/STYLE.md): “Write in **US English** with US grammar.”

These are the same references used in ADR-0018. Prefer them over inventing a house dialect.

## Writing notes

- Prefer clear, concise US English (short sentences; avoid idioms) — easier for global readers and future translation ([Google guidance](https://developers.google.com/style/translation)).
- Keep technical tokens exact: `anthropic`, `AIOS_ANTHROPIC_API_KEY`, `@aios/provider`.
- Do not mix Portuguese prose into new ADRs or guides.

## Related

- Foundation: [`FOUNDATION.md`](../FOUNDATION.md) (US English)
- Agent contract: [`AGENTS.md`](../../AGENTS.md)
- Policies: `policies/aios.policies.json` → `pnpm sync:cursor-rules`
