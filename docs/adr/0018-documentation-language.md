# ADR-0018: Canonical documentation language (US English)

- **Status:** Accepted
- **Date:** 2026-07-17
- **Deciders:** Kleilson dos Santos
- **Issue:** #112

## Context

Product docs started as hybrid Portuguese prose with English technical identifiers. Recent ADRs and release notes drifted toward denser English without an explicit rule, which hurts consistency and contributor expectations for a public GitHub product.

Industry developer-documentation practice is clear: **write the source documentation in US English**, then localize if needed.

## Decision

1. **Canonical language** for AIOS product documentation is **US English**.
2. **In scope:** `docs/**` (including ADRs and architecture), root `README.md`, `AGENTS.md`, and CHANGELOG _prose_ (Keep a Changelog section headers remain English by that standard).
3. **Code and identifiers** stay English (`ProviderId`, env vars, package names, HTTP paths) — unchanged.
4. **Chat with the product owner** may remain Portuguese; that is conversation UX, not product documentation.
5. **Migration:** AIOS product documentation migration to US English completed under [#142](https://github.com/KleilsonSantos/ai-operating-system/issues/142). New docs must stay US English. Optional PT localization may be added later without changing the canon.
6. **Policy:** `docs-language-en` in `policies/aios.policies.json` (must).

## Consequences

### Positive

- Aligns with widely cited developer style guides (credibility for OSS / international readers)
- One source language for agents and humans writing docs
- Enables optional PT localization later without rewriting the canon

### Trade-offs

- Owner chat may remain Portuguese (intentional; not product docs)
- PKB prompt bodies may keep `language: pt-BR` when that is the working language of the asset
- Companion repo docs may still need a follow-up migration

## References

1. [Google developer documentation style guide — Write for a global audience](https://developers.google.com/style/translation): “We write our developer documentation in US English…”
2. [Kubernetes documentation style guide](https://kubernetes.io/docs/contribute/style/style-guide/): English-language docs use U.S. English spelling and grammar
3. [Docker documentation STYLE.md](https://github.com/docker/docs/blob/main/STYLE.md): “Write in US English with US grammar”
4. [Keep a Changelog](https://keepachangelog.com/) — English section vocabulary (`Added`, `Changed`, …)
