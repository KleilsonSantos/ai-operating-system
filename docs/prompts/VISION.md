# PKB — Long-term vision

The Prompt Knowledge Base starts as an **organized Docs-as-Code collection**. The tree and metadata are shaped so later stages can plug in without a wholesale rewrite.

## Evolution ladder

1. Organized Markdown catalog + `index.yaml` ← **MVP (#134)**
2. Automatic inventory (extend `aios_audit_docs` / `@aios/documentation` for `docs/prompts/**`) ← **shipped (#154)**
3. Textual / tag search over frontmatter + body ← **shipped (#158)**
4. Semantic search
5. Embeddings + vector store (separate ADR; Resource-Aware)
6. RAG over PKB (never replaces FOUNDATION / policies)
7. MCP tools that *reference* catalog entries (not a second policy engine)
8. Specialized agents that *compose* catalog templates
9. Recommendation / similarity / quality analytics
10. Optional link into long-horizon AIOS memory — **Memory Engine stays authoritative for session/project memory** (ADR-0006)

## Asset kinds (future taxonomy)

Prompt assets may grow into:

- Patterns · Templates · Workflows · Playbooks · Recipes · Strategies

MVP stores them as versioned Markdown with shared frontmatter. New kinds = new `tags` / optional `kind` field — not new engines by default.

## Design principles

- **KISS / YAGNI** for runtime — no vector DB until an ADR + Resource-Aware justification
- **Docs-as-Code** — reviewable in PRs like any other doc
- **DRY** — link ADRs / FOUNDATION; do not paste policies into every prompt
- **Clean boundaries** — PKB feeds agents; it does not become product SSOT

## Source of this vision

Consolidated from engineering chat prompts (formerly ad-hoc `prompt-library/prompt4.md` and related analyses). Product language for this folder: **US English** (ADR-0018); individual prompt bodies may remain `pt-BR` when that is the working language of the asset.
