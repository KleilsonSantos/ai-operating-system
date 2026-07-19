# Spike: OpenWiki vs AIOS (enrich or more-of-same?)

- **Issue:** [#148](https://github.com/KleilsonSantos/ai-operating-system/issues/148)
- **Subject:** [langchain-ai/openwiki](https://github.com/langchain-ai/openwiki) (npm `openwiki@0.2.0`)
- **Date:** 2026-07-18
- **Method:** Architecture comparison + live AIOS baselines. **Did not** install OpenWiki or run `--init` (Resource-Aware: no cloud LLM API keys in the spike environment; avoid DeepAgents cost and default telemetry).

## What OpenWiki is

A LangChain CLI that **writes and maintains agent-oriented wikis**:

| Mode | Output | Role |
| --- | --- | --- |
| **Code** | `openwiki/` in the repo | Synthesized codebase documentation for coding agents |
| **Personal** | `~/.openwiki/wiki` | “Brain” from connectors (git, Notion, Gmail, X, web search, HN, …) |

Also: updates `AGENTS.md` / `CLAUDE.md` with a pointer block; CI examples that `--update` from git diffs and open a PR; optional OKF (Open Knowledge Format) front matter; LangSmith tracing; telemetry on by default (opt-out via `OPENWIKI_TELEMETRY_DISABLED` / `DO_NOT_TRACK`).

Built on **DeepAgents** — not a thin docs generator.

## What AIOS already covers

| AIOS layer | Role | OpenWiki overlap |
| --- | --- | --- |
| `docs/FOUNDATION.md` · ADRs · policies | Canonical product SSOT | **None** — OpenWiki must not compete |
| Prompt Knowledge Base (`docs/prompts/`) | Governed prompt assets | Weak parallel (typed catalog vs free wiki) |
| `@aios/knowledge` | Heuristic Knowledge Graph (no embeddings) | Structural map vs narrative wiki |
| `@aios/documentation` · `aios_audit_docs` | Inventory / drift of canonical paths | Audit vs generation |
| `@aios/memory` · `@aios/prompt` | Session memory · governed brief | Not the same as personal brain |
| `@aios/mcp` · Companion | Control plane + experience client | OpenWiki is another agent/CLI host |

### Live baselines (this monorepo, 2026-07-18)

**`aios_build_knowledge`** (summary):

- 38 nodes · 109 edges
- Kinds: 1 project · 19 engines · 7 docs · 6 packages · 3 modules · 1 policy · 1 workspace

**`aios_audit_docs`:**

- `ok: true` · canonical paths **present** · `missing: []`
- Info: 22 ADRs; documentation engine present

Conclusion from baselines: AIOS already has a **structured** view of the repo and a **green** canonical-docs audit. OpenWiki would add a **prose wiki layer for agents**, not fill a missing inventory hole.

## Enrichment opportunities (steal patterns, not the product)

1. **AGENTS.md as pointer, not dump** — OpenWiki’s “don’t stuff the repo into AGENTS.md; point at an index” matches AIOS *policies > long prompts*. We can harden `AGENTS.md` to point at FOUNDATION + PKB index without adopting OpenWiki.
2. **Diff-scoped doc update + PR** — Useful **process** for aging docs; AIOS Documentation Engine / Companion could later propose patches under governance, without DeepAgents.
3. **OKF-style front matter** — Optional schema for generated *context pages* (if we ever emit them), kept **below** FOUNDATION/ADRs in authority.
4. **Optional Companion capability (later)** — `companion caps` / MCP tool: “if `openwiki/index.md` exists, list/summarize for context” — **consume**, never generate as SSOT inside AIOS.

## More-of-same / reject for core

| Risk | Why |
| --- | --- |
| Second SSOT | Agents trusting `openwiki/` over FOUNDATION/ADRs |
| Stack coupling | DeepAgents · LangSmith · provider sprawl · sqlite checkpoint |
| Resource-Aware | Global install, background CI LLM runs, personal connectors, macOS LaunchAgents |
| Mission drift | Personal brain (Gmail/X/Notion) ≠ SDLC governance (ADR-0001 / 0014) |
| Telemetry | Default-on reliability telemetry — conflict with inspect-before-install ethos unless explicitly opted in |

## Recommendation

| Option | Decision |
| --- | --- |
| Embed OpenWiki in AIOS core / monorepo | **Reject** |
| Adopt personal brain connectors in MVP | **Reject** |
| Steal AGENTS.md pointer + diff→PR process lessons | **Accept** (docs/process only) |
| Optional Companion “read `openwiki/` if present” capability | **Defer** — only if a workspace already generates it outside AIOS |
| Re-run spike with live `openwiki --init` | **Optional follow-up** when a provider key is intentional and telemetry is disabled |

**One-liner:** OpenWiki can **enrich agent context as an external wiki**, but for AIOS it is **more of the same (or worse)** if treated as a second control-plane brain. Keep generation outside; keep governance and SSOT inside AIOS.

## Follow-ups (not this PR)

1. Tighten root `AGENTS.md` with explicit “canonical order: code → FOUNDATION/ADRs → PKB → optional external wikis”.
2. If desired: Companion issue for read-only `openwiki/` probe (capability adapter).
3. Live `--init` comparison only with `OPENWIKI_TELEMETRY_DISABLED=1` and a deliberate provider budget.
