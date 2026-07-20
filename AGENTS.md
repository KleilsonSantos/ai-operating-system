# AGENTS.md — AI Operating System

Contract for any AI agent working in this repository.

## Mission

Build **AIOS**: a governance platform for AI in the SDLC — one product, not a dump of prompts.

## Sources of truth (authority order)

Use this order when searching for context. **Do not** stuff the whole product into this file — it is a **pointer**.

1. **Code** under `engines/` · `packages/` · `apps/`
2. **Foundation & architecture** — `docs/FOUNDATION.md` (wins on conflict) · `docs/VISION.md` · `docs/architecture/` · ADRs under `docs/adr/`
3. **Policies** — `policies/aios.policies.json` (and synced Cursor rules) — **policies over long prompts**
4. **Delivery truth** — `docs/ROADMAP.md` · `CHANGELOG.md`
5. **Prompt Knowledge Base (PKB)** — `docs/prompts/` (`index.yaml` + assets) — reusable prompt patterns; **not** a second product SSOT ([PKB README](./docs/prompts/README.md))
6. **Optional external agent wikis** (e.g. generated `openwiki/`) — useful for narrative codebase context **only if present**; they **never** override items 1–3. See spike: [`docs/spikes/openwiki-comparison.md`](./docs/spikes/openwiki-comparison.md)

If a summary conflicts with `FOUNDATION.md`, the foundation wins until an ADR explicitly changes it.

**GitHub Wiki:** link map only (not canonical).

## Documentation language

Product docs (`docs/**`, ADRs, README, this file, CHANGELOG prose) are **US English** — [ADR-0018](./docs/adr/0018-documentation-language.md) · [guide](./docs/guides/documentation-language.md). Chat with the product owner may stay Portuguese.

## Rules

1. AIOS is a standalone product (ADR-0001).
2. Git flow: Issue → `feature/*` from `sandbox` → PR → `sandbox` → PR → `main`.
3. Commits: `type: <gitmoji> …` · author `Kleilson Santos <kdsddesign1@gmail.com>` · no IDE co-authorship.
   Merges: **always** `bash scripts/merge-pr.sh <n>` (or `gh pr merge <n> --merge --subject "merge: 🔀 PR #<n> — <branch>"`). Never leave the default `Merge pull request…`.
4. Agents are **plugins** — do not expose direct agent calls in the primary UX.
5. Policies over long prompts.
6. Do not implement every engine at once — follow the ROADMAP (Phase 1 = core).
7. Commit only when the human asks (except authorized bootstrap).
8. Do not treat generated agent wikis as canonical product truth (ADR-0001 / spike #148).

## Owner cadence (chat)

Product-owner cues in chat (Portuguese ok). **Do not** skip the briefing after a summary reset.

| Cue | Meaning |
| --- | --- |
| **`next`** | **Proposal only** — do **not** implement yet |
| **`ok`** / **`prossegue`** | Implement the accepted proposal (Issue → feature → PR → `sandbox`) |
| **`green`** | Promote: merge feature→`sandbox`→`main` (+ SemVer release when needed) |

### Before every `next` (mandatory briefing)

1. **Trajetória** — where we are (last shipped vertical + open parked items)
2. **O quê** — concrete next vertical (1 slice)
3. **Porquê agora** — why this beats alternatives
4. **Analogia** — one concrete metaphor (hospital / factory / command room…)
5. **Trade-off** — what we gain vs what we defer
6. Stop and wait for **`ok`**

Never treat `next` as silent authorization to code.

## Checklist

- [ ] Change aligned with the ROADMAP phase?
- [ ] Docs/ADR if architectural?
- [ ] CHANGELOG `[Unreleased]` if notable?
- [ ] New/edited product docs in US English?
- [ ] PR targeting `sandbox`?
- [ ] If responding to `next`: briefing above shipped before any code?
