# Markdown lint policy

- **Issue:** [#498](https://github.com/KleilsonSantos/ai-operating-system/issues/498)
- **Tools:** [markdownlint](https://github.com/DavidAnson/markdownlint) · [markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2)

## Goal

Keep the IDE **Problems** panel and CI free of heading/table noise **without** disabling structure rules globally. Living product docs stay strict; intentional formats get **scoped** overrides.

## SSOT files

- `.markdownlint-cli2.jsonc` — CLI / `pnpm lint:md` / CI (`overrides[].filter` + required `combine`)
- `.markdownlint.json` — shared rule defaults (VS Code / Cursor)
- `.markdownlintignore` — ignore globs for the editor extension
- Nested `.markdownlint.json` — path-local overrides for IDE (`docs/prompts`, `docs/audits`, `.github/agents`)

## Living docs (strict)

Applies to `docs/**` (except prompts/audits/wiki), `owner/**`, `apps/**` READMEs, root `*.md`, ADRs, guides.

- **One H1** per file (MD025) — chapters use `##`, terms use `###`
- **No heading level skips** (MD001) — never `#` → `###`
- **MD024** duplicate headings: `siblings_only` (Keep a Changelog)
- **MD013** line length: off (tables and changelogs)
- **MD060** table pipe cosmetics: off (structure rules stay on)

## Scoped exceptions (documented)

- `docs/prompts/**` — PKB catalog often uses multiple H1 sections as runnable prompt bodies; do not rewrite
- `.github/agents/**` — frontmatter-first agent specs; body may not start with H1
- `.github/pull_request_template.md` / `ISSUE_TEMPLATE` — GitHub templates start with `## Summary`
- `docs/audits/**` — snapshot audits; status emphasis / wide tables are evidence, not living style guides
- `docs/wiki/**`, `.tmp/**` — generated / scratch; not product SSOT
- `CHANGELOG.md` — Keep a Changelog repeated section titles under version siblings

## Run

```bash
pnpm lint:md
```

## Editor

Install/enable the **markdownlint** extension ([DavidAnson/vscode-markdownlint](https://github.com/DavidAnson/vscode-markdownlint)). It uses the same `.markdownlint-cli2.jsonc` as the CLI (v0.40.2+).

After policy changes: **Developer: Reload Window**. If Problems still list a file from another folder in a multi-root workspace, that folder needs its own config.

### LICENSE → MD041 (official guidance)

`LICENSE` is legal text, not Markdown. VS Code may still classify it as Markdown, so markdownlint reports MD041 ([vscode-markdownlint#365](https://github.com/DavidAnson/vscode-markdownlint/issues/365), [#369](https://github.com/DavidAnson/vscode-markdownlint/issues/369)).

Do **not** rely on `markdownlint.lintWorkspaceGlobs` alone (editor diagnostics ignore it). Use:

1. `ignores: ["LICENSE", "LICENSE*"]` in `.markdownlint-cli2.jsonc` (cli2 README)
2. And/or `"files.associations": { "LICENSE*": "plaintext" }` in `.vscode/settings.json`

### Codecov → “Context access might be invalid”

Not markdownlint. The [GitHub Actions](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-github-actions) extension warns when it cannot resolve a secret ([vscode-github-actions#222](https://github.com/github/vscode-github-actions/issues/222)).

Official Codecov setup: [Adding the Codecov token](https://docs.codecov.com/docs/adding-the-codecov-token) — create repo secret `CODECOV_TOKEN`, then:

```yaml
env:
  CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}
```

Then: GitHub Actions side panel → signed in → refresh Secrets → **Developer: Reload Window**.

## Do not

- Turn off MD001/MD025 globally “to silence noise”
- Expect `markdownlint.ignore` (removed in vscode-markdownlint 0.56 — use cli2 `ignores`)
- Add a second conflicting markdownlint config under a package
- Put dates or `final`/`latest` in living doc filenames (artifact-lifecycle policy)
