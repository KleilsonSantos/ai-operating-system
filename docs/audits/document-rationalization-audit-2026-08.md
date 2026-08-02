# Document Rationalization Audit — AIOS

| Field                 | Value                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Date**              | 2026-08-01                                                                                                          |
| **Issue**             | [#187](https://github.com/KleilsonSantos/ai-operating-system/issues/187)                                            |
| **Scope**             | Full repository: apps, engines, packages, docs, scripts, CI, configs                                                |
| **Lens**              | Staff / Principal — architecture, DX, governance, maintainability                                                   |
| **Method**            | Filesystem inventory + cross-reference of imports, workspace deps, relative links, package scripts                  |
| **Confidence legend** | **High** = verified path/import miss · **Medium** = strong pattern, confirm before delete · **Low** = judgment call |

> Product docs stay US English (ADR-0018). This audit is product documentation.

---

## Executive verdict

AIOS is a **coherent monorepo** (engines + plugins + apps) with clear SSOT routing (`FOUNDATION` → ADRs → policies → ROADMAP). It is **not** a documentation dump, and there are **no empty product directories** or tracked empty files of note.

The highest-value hygiene is **truth drift**, not folder surgery:

1. **Broken relative links** in ROADMAP / ADRs / package README (onboarding and navigation fail).
2. **Phase 5 ROADMAP still unchecked** while `v0.28.0` and `@aios/agent-registry` already shipped Registry + CLI/MCP list (pillars partially done).
3. **Dead / placeholder dependency graph** around `@aios/core` (declared on six engines, **zero** TypeScript imports).
4. **Unused `husky`** while hooks are `.githooks` via `core.hooksPath`.
5. **ADR-0018 gaps** on community surfaces (`SUPPORT.md`, issue templates still Portuguese).

Do **not** flatten `engines/*` into a Clean Architecture folder tree; the current package-per-engine layout matches ADR-0001 and monorepo practice. Prefer **link fixes + ROADMAP reconcile + dep prune** over structural rewrites.

---

## Architecture of directories (audit)

### What works

| Area                                                                                  | Assessment                                                             |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `engines/*`                                                                           | One package per engine/agent — clear ownership, turbo-friendly         |
| `packages/{shared,pipeline,core,agent-registry}`                                      | Shared contracts vs registry concern separation                        |
| `apps/{cli,console,mcp}`                                                              | Thin adapters over engines — agents-as-plugins honored                 |
| `docs/{FOUNDATION,VISION,adr,architecture,guides,prompts,policies,references,spikes}` | Layered product truth; PKB under `docs/prompts/` is intentional        |
| `.trae/rules/` + `AGENTS.md` bridge                                                   | Thin pointers; detailed rules not duplicated as a second product bible |
| `policies/` + `pnpm sync:cursor-rules`                                                | Policies beat long prompts                                             |

### What does **not** need Clean Architecture rename

Renaming into `domain/`, `application/`, `adapters/` would **increase** navigation cost without changing runtime boundaries. Engines already act as bounded contexts; apps are adapters. **Recommendation:** keep package layout; document ports in ADRs/overview only.

### Structural smells (keep vs change)

| Location                                             | Severity        | Problem                                                       | Impact                                                                                 | Recommendation                                                                                                                               |
| ---------------------------------------------------- | --------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core`                                      | **Alto**        | Stub (`createPipelineId` / `PipelineEvent`) with no consumers | False dependency gravity; confuses “where is the pipeline?” (`@aios/pipeline` is real) | Either wire events into orchestration **or** remove workspace deps and archive/merge stub into `pipeline`/`shared` (ADR if deleting package) |
| Dual `docs/VISION.md` vs `docs/prompts/VISION.md`    | **Médio**       | Same basename, different scope (product vs PKB)               | Search/onboarding collision                                                            | Rename PKB file to `docs/prompts/PKB-VISION.md` (or `EVOLUTION.md`) — **Medium** confidence, low risk                                        |
| `docs/architecture/system-guide.md` titled “Phase 1” | **Baixo**       | Narrative lag vs Phase 4–5 reality                            | Stale mental model                                                                     | Refresh intro + link Phase 5 registry; keep Phase 1 flow as historical core                                                                  |
| `docs/wiki/Home.md` + wiki scripts                   | **Informativo** | Manual GitHub Wiki chrome                                     | Fine if documented as optional                                                         | Keep; do not promote wiki as SSOT (already aligned with OpenWiki spike)                                                                      |
| Root file count (~25 tracked roots)                  | **Informativo** | Normal for OSS monorepo                                       | Acceptable                                                                             | No “move everything under `/config`” churn                                                                                                   |
| Local `engines/*/coverage`, `.pnpm-store`, `.turbo`  | **Baixo**       | Present on disk; gitignored                                   | Disk noise only                                                                        | Periodic `pnpm` clean / delete local coverage; no repo change                                                                                |

---

## Findings (evidence-based)

### F1 — Broken documentation links

**Severity:** Crítico (navigation)  
**Confidence:** High

| Source                                             | Broken link                                             | Resolves to                      | Correct target                                              |
| -------------------------------------------------- | ------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------- |
| `docs/ROADMAP.md` L57                              | `./.github/modernize/phase-5-agent-marketplace/plan.md` | `docs/.github/...` (missing)     | `../.github/modernize/phase-5-agent-marketplace/plan.md`    |
| `packages/agent-registry/README.md` L7             | `../.github/modernize/...`                              | `packages/.github/...` (missing) | `../../.github/modernize/phase-5-agent-marketplace/plan.md` |
| `docs/adr/0022-mcp-streamable-http.md` L41         | `./0003-pipeline-contract.md`                           | missing filename                 | `./0003-pipeline-integration-contract.md`                   |
| `docs/adr/0022-mcp-streamable-http.md` L41         | `./0011-resource-aware-runtime.md`                      | missing filename                 | `./0011-resource-aware-macos.md`                            |
| `docs/adr/0023-agent-registry-marketplace.md` L130 | `./architecture/overview.md`                            | `docs/adr/architecture/...`      | `../architecture/overview.md`                               |

**Impact:** Onboarding, PR reviewers, and agents following links hit 404s.  
**Recommendation:** Fix in one docs PR; optionally add a CI markdown link check later (should, not must — Resource-Aware).

---

### F2 — ROADMAP Phase 5 vs shipped `0.28.0`

**Severity:** Alto  
**Confidence:** High

Evidence:

- `package.json` / CHANGELOG / tag: **`0.28.0`** with Agent Registry, resolvers, `aios list-agents`, `aios_list_agents`.
- `docs/ROADMAP.md` Phase 5 checkboxes still **unchecked**; status text still “In progress … Target: v0.28.0 on 2026-08-20”.

Partial pillar reality:

| Pillar               | Shipped?          | Notes                                                                                                |
| -------------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| Agent Registry       | **Yes (MVP)**     | `@aios/agent-registry`, CLI, MCP                                                                     |
| Agent Packaging      | **Partial**       | `agent.yaml` schema exists; `npm create @aios/agent` / community template not evidenced as published |
| Agent Observability  | **No / deferred** | `recordAgentExecution` / Console catalog still aspirational in ADR-0023                              |
| Community Publishing | **No**            | Weekly GitHub scan / async registry service not in tree                                              |

**Impact:** Planning lie; agents and humans mis-prioritize “next”.  
**Recommendation:** Split Phase 5 into **5a shipped (check)** vs **5b remaining** with new target version (e.g. `0.29.x` / `0.30.0`); do not pretend Observability shipped with Registry.

---

### F3 — `@aios/core` unused at import level

**Severity:** Alto  
**Confidence:** High (imports); Medium (delete package)

Evidence:

- `packages/core/src/index.ts` exports only `createPipelineId` + `PipelineEvent`.
- Workspace dependency in: `intent`, `policy`, `context`, `decision`, `orchestration`, `quality-gate` `package.json` files.
- **No** `from '@aios/core'` in any `.ts`/`.tsx` under the repo (search 2026-08-01).
- Real pipeline lives in `@aios/pipeline` (ADR-0003 explicitly avoided putting `runPipeline` in core to prevent cycles).

**Impact:** Phantom layer; install/graph noise; wrong mental model.  
**Recommendation:**

1. Quick win: remove `"@aios/core": "workspace:*"` from engines that do not import it.
2. Follow-up: either implement event bus consumers **or** deprecate package and fold helpers into `@aios/shared` / `@aios/pipeline` with ADR note.

---

### F4 — Unused `husky` dependency

**Severity:** Médio  
**Confidence:** High

Evidence: `prepare` = `git config core.hooksPath .githooks`; hooks live in `.githooks/{commit-msg,pre-commit,pre-push}`; `husky` only appears in root `devDependencies`.

**Impact:** Extra install; false expectation of husky lifecycle.  
**Recommendation:** Remove `husky` from `package.json` (or document a migration — not both).

---

### F5 — Unused `eslint-plugin-prettier`

**Severity:** Baixo  
**Confidence:** High

Evidence: listed in `devDependencies`; `eslint.config.js` uses `eslint-config-prettier` only (disables conflicting rules). No `prettier/prettier` rule.

**Recommendation:** Remove `eslint-plugin-prettier`; keep Prettier via `format` scripts + lint-staged.

---

### F6 — Redundant `@typescript-eslint/*` packages

**Severity:** Baixo  
**Confidence:** Medium

Evidence: `typescript-eslint` umbrella + explicit `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser`. Config imports `typescript-eslint` only.

**Recommendation:** Prefer umbrella-only deps (verify peer resolution once); drop duplicates if lockfile stays clean.

---

### F7 — ADR-0018 gaps (community / support surfaces)

**Severity:** Médio  
**Confidence:** High

| Surface                       | Language today  | Policy expectation                                                          |
| ----------------------------- | --------------- | --------------------------------------------------------------------------- |
| `SUPPORT.md`                  | Portuguese      | US English (README-adjacent community doc)                                  |
| `.github/ISSUE_TEMPLATE/*.md` | Portuguese body | Prefer US English templates (labels/titles can stay short English prefixes) |

Chat with owner may stay PT; **product/community entry points** should match ADR-0018.

**Recommendation:** Translate in a dedicated `docs/*` / community PR; keep PKB `pt-BR` bodies as allowed by the guide.

---

### F8 — Dual VISION naming

**Severity:** Médio  
**Confidence:** Medium (rename value)

Both files are valid and non-conflicting in content. Collision is **discoverability**, not duplication of truth.

**Recommendation:** Rename PKB vision; update `docs/prompts/README.md` links.

---

### F9 — Docs / rules bridge duplication (intentional)

**Severity:** Informativo  
**Confidence:** High

`AGENTS.md`, `.cursor/rules/*`, `.trae/rules/*` are **bridges**, not a second FOUNDATION. Overlap is by design (`pnpm sync:cursor-rules`).

**Recommendation:** Do not merge into one mega-file; keep sync script as SSOT for policy text.

---

### F10 — Empty / orphan / assets / dead code sweep

| Category                          | Result                                                                      |
| --------------------------------- | --------------------------------------------------------------------------- |
| Empty dirs / 0-byte product files | **None** found (excluding ignored local stores)                             |
| Product image assets              | **None** in source tree; only local coverage report PNGs (gitignored)       |
| Wiki / bootstrap scripts          | Present; used manually — not dead                                           |
| Commented-out large dead blocks   | Not systematically proven; no mass delete recommended without knip/ts-prune |
| Orphan engines                    | All engines have `src/`; agents are thin plugins — keep                     |

**Dead-code tooling (suggested, not run in this audit):** optional one-shot `knip` or `ts-prune` on a feature branch — Resource-Aware: do not add permanent CI until noise is low.

---

## Configuration audit (summary)

| Config                                    | Status                                           |
| ----------------------------------------- | ------------------------------------------------ |
| `eslint.config.js` flat + prettier-config | Healthy                                          |
| `prettier.config.js` + lint-staged        | Healthy                                          |
| `turbo.json`                              | Healthy                                          |
| `pnpm-workspace.yaml` overrides           | Documented CVE pins — keep comments              |
| `.githooks` vs husky                      | Prefer githooks; drop husky (F4)                 |
| Sonar Free / main-only                    | Documented in quality-gates — align expectations |
| Dependabot                                | Present — OK                                     |
| No Docker Compose in root                 | Intentional for local Resource-Aware — OK        |

---

## Documentation map (proposed cleaner mental model)

Keep current trees; clarify roles in README/FOUNDATION only:

```text
docs/
  FOUNDATION.md          # product SSOT
  VISION.md              # product positioning
  ROADMAP.md             # delivery truth (must match SemVer)
  adr/                   # decisions
  architecture/          # how it fits
  guides/                # how to work
  policies/              # human-readable policy companions
  prompts/               # PKB (catalog; not policies)
  references/            # external legal/official only
  spikes/                # disposable exploration
  audits/                # rationalization / viability reports (this file)
  wiki/                  # optional GitHub Wiki seed (not SSOT)
```

**Avoid:** second “handbook” at repo root; moving ADRs into wiki; merging PKB into FOUNDATION.

---

## Cleanup plan

### Quick wins (low risk, high clarity)

1. Fix five broken links (F1) — **S**, risk low, impact high.
2. Remove `husky` (F4) — **S**, risk low.
3. Remove `eslint-plugin-prettier` (F5) — **S**, risk low.
4. Strip unused `@aios/core` deps from engines (F3 step 1) — **S**, risk low; run `pnpm typecheck` + tests.
5. Reconcile Phase 5 checkboxes + status paragraph (F2) — **S/M**, risk low (docs only).

### Structural improvements

1. Rename `docs/prompts/VISION.md` → disambiguated name (F8).
2. Refresh `system-guide.md` “Phase 1” framing.
3. Translate `SUPPORT.md` + issue templates (F7).

### Architectural improvements

1. Decide fate of `@aios/core` (implement or deprecate) — ADR touch if package removed — **M**, risk medium.
2. Phase 5b backlog: observability hook + Console catalog without inventing a second metrics stack (reuse provider/status patterns) — **L**.
3. Optional markdown link CI — **M**, weigh Resource-Aware cost.

### Documentation improvements

1. Add `docs/audits/README.md` one-liner index (audits are reports, not SSOT).
2. Cross-link this audit from ROADMAP “hygiene” or CONTRIBUTING only if useful — avoid doc sprawl.

### Performance / build / Resource-Aware

1. Prune unused deps → slightly smaller install graph.
2. Delete local `**/coverage` folders periodically (already ignored).
3. Do **not** add heavy static-analysis CI until knip baseline is quiet.

---

## Prioritized roadmap

| Pri    | Item                                             | Effort | Risk | Expected impact          |
| ------ | ------------------------------------------------ | ------ | ---- | ------------------------ |
| 1 Crit | Fix broken relative links (F1)                   | S      | Low  | Navigation / agent trust |
| 2 High | Reconcile Phase 5 ROADMAP vs 0.28.0 (F2)         | S–M    | Low  | Planning accuracy        |
| 2 High | Remove unused `@aios/core` workspace deps (F3.1) | S      | Low  | Graph honesty            |
| 2 High | Decide `@aios/core` keep/merge/delete (F3.2)     | M      | Med  | Architecture clarity     |
| 3 Med  | Drop `husky` (F4)                                | S      | Low  | DX honesty               |
| 3 Med  | ADR-0018: SUPPORT + issue templates (F7)         | S      | Low  | Policy compliance        |
| 3 Med  | Rename PKB VISION (F8)                           | S      | Low  | Discoverability          |
| 4 Low  | Drop `eslint-plugin-prettier` (F5)               | S      | Low  | Dep hygiene              |
| 4 Low  | Dedupe typescript-eslint packages (F6)           | S      | Low  | Lockfile simplicity      |
| 4 Low  | Refresh system-guide Phase framing               | S      | Low  | Onboarding               |
| 4 Low  | Optional knip pass + link checker                | M      | Med  | Dead-code confidence     |

---

## Explicit non-goals (YAGNI)

- Rewriting monorepo into `src/domain|application|infra`.
- Deleting `.trae` / Cursor bridges “to have one rules folder”.
- Merging Companion into this repo (ADR-0014).
- Treating GitHub Wiki as product SSOT.
- Mass-deleting engines without ROADMAP/ADR coverage.

---

## Method notes / limitations

- Import graph checked with ripgrep; not a full TypeScript program analysis.
- No `knip`/`depcheck` run in this pass — unused **transitive** deps may remain.
- Companion and portfolio repos are out of scope.
- Local untracked coverage under engines is noise, not a git hygiene failure.

---

## Next owner cue

Per `AGENTS.md` cadence: this document is the **audit deliverable**. Implementation of Quick Wins waits for **`ok` / `prossegue`**.
)
