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
2. **In scope:** `docs/**` (including ADRs and architecture), root `README.md`, `AGENTS.md`, and CHANGELOG *prose* (Keep a Changelog section headers remain English by that standard).
3. **Code and identifiers** stay English (`ProviderId`, env vars, package names, HTTP paths) — unchanged.
4. **Chat with the product owner** may remain Portuguese; that is conversation UX, not product documentation.
5. **Migration:** new and edited docs must be US English; legacy Portuguese pages migrate incrementally (no big-bang rewrite required to accept this ADR).
6. **Policy:** `docs-language-en` in `policies/aios.policies.json` (must).

## Consequences

### Positive

- Aligns with widely cited developer style guides (credibility for OSS / international readers)
- One source language for agents and humans writing docs
- Enables optional PT localization later without rewriting the canon

### Trade-offs

- Founder and early docs are Portuguese — temporary bilingual repo until migration completes
- Chat (PT) vs docs (EN) is intentional; agents must not treat chat language as the docs canon

## References

1. [Google developer documentation style guide — Write for a global audience](https://developers.google.com/style/translation): “We write our developer documentation in US English…”
2. [Kubernetes documentation style guide](https://kubernetes.io/docs/contribute/style/style-guide/): English-language docs use U.S. English spelling and grammar
3. [Docker documentation STYLE.md](https://github.com/docker/docs/blob/main/STYLE.md): “Write in US English with US grammar”
4. [Keep a Changelog](https://keepachangelog.com/) — English section vocabulary (`Added`, `Changed`, …)
