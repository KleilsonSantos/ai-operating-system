# AIOS External Pattern Integration Analysis

> **PASS 1 — AUDIT ONLY.** Not product SSOT. [`FOUNDATION.md`](../FOUNDATION.md) and ADRs win on conflict.  
> **Date:** 2026-09-13 · **Release baseline:** `v0.49.0`  
> **Mode:** inspect → inventory → gap → prioritize → propose. **No implementation in this pass.**  
> **Prior related audits (do not duplicate as SSOT):**  
> [`agent-runtime-evolution-analysis-2026-08.md`](./agent-runtime-evolution-analysis-2026-08.md) · [`AIOS-HARNESS-ARCHITECTURE-AUDIT.md`](./AIOS-HARNESS-ARCHITECTURE-AUDIT.md)

---

## 1. Executive Summary

AIOS is already a **governed control plane** for software-engineering AI (`runPipeline` + policies + plugins + quality gate + MCP + observability). It is **not** a generic multi-agent framework and must not become one (ADR-0001).

External repos (TradingAgents, agent-skills, LibreChat, Agentic Inbox, Fincept, Flowsint, HyperFrames, MoneyPrinterTurbo, VoxCPM) are **pattern references only**. Most “missing” themes already map to existing engines/contracts.

**Post-`v0.49.0` fact:** PipelineRun persistence + CLI replay + MCP `mcp.tool` audit shipped (#447 P0 items 1–2). That closes the old harness-audit claim _“AIOS does not persist PipelineRun yet.”_

**Highest-leverage remaining gaps (evidence-based):**

| Priority | Gap                                                                                                           | Strategy                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **P0**   | Deterministic **selection/eval harness** (intent → skill/route/agent expectations) — no `integrations/evals/` | **ADAPT** Quality Gate + Skill packs; CI golden fixtures      |
| **P0**   | **Security spike** (prompt injection / memory validation) — still open on #447                                | Spike → ADR or minimal fail-closed filter                     |
| **P1**   | **Decision ledger** as structured evidence (not CoT)                                                          | **ADAPT** `PipelineRun.steps` + metrics/governance JSONL      |
| **P1**   | Skill **triggers / verification / exit criteria**                                                             | **ADAPT** `SkillManifest` (ADR-0026) — no second skill system |
| **P2**   | Checkpoint/resume, HITL queue, richer Context Graph edges, workflow DAG UI                                    | **DEFER** until ACT/`HUMAN_APPROVAL` workflows justify them   |
| —        | LangGraph / CrewAI / video pipelines / core multimodal engines                                                | **REJECT** as core                                            |

**Smallest coherent next slice (proposal only — wait for `ok`):**  
Ship `integrations/evals/` with **5–10 deterministic golden tasks** asserting intent classification + optional skill-id expectations + route capability class, wired to CI — without a new engine, without LLM-as-judge, without a second skill framework.

---

## 2. Current Architecture

Canonical flow (implemented):

```text
CLI / MCP / Console
        ↓
  @aios/pipeline.runPipeline          ← ADR-0003, contractVersion "1"
        ↓
  Intent → Policy → Context → routeModel → Knowledge → Memory?
        ↓
  Orchestration (plugins) + opt-in Skills / Hooks
        ↓
  Quality Gate → PipelineResponse (+ PipelineRun)
        ↓
  Persist .aios/runs/ · metrics/governance JSONL · Visibility
```

North-star layers vs reality:

| Pillar       | AIOS mapping                                                |
| ------------ | ----------------------------------------------------------- |
| Governance   | Policy Engine, MCP privilege gate, governance audit         |
| Runtime      | Pipeline + PipelineRun store + provider resilience          |
| Intelligence | Intent, Context, KG, Memory, Skills, Model router           |
| Evidence     | Run store, metrics JSONL, visibility trail, Obsidian export |
| Quality      | Quality Gate (structural) + CI                              |

**Identity constraints:** provider-agnostic · agents-as-plugins · MCP-compatible · policy-driven · Resource-Aware · ACT honest (`capabilities.act: false` by default).

---

## 3. Existing Capabilities (inventory)

Evidence from code/docs at `v0.49.0`. Maturity: **none / stub / partial / shipped**.

| Capability                      | Exists? | Location                                                                       | Contract                | Tests                                       | Maturity                                   | Gap                                                                                                                                                                                            |
| ------------------------------- | ------- | ------------------------------------------------------------------------------ | ----------------------- | ------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Execution state (`PipelineRun`) | Yes     | `packages/shared` `PipelineRun` / `PipelineStep`; built in `packages/pipeline` | ADR-0024                | `pipeline.test.ts`                          | **shipped**                                | No run-level `ExecutionState` enum (PENDING/…); steps are ok/skip/fail/denied                                                                                                                  |
| Run persistence / replay        | Yes     | `engines/status/src/run-store.ts`; CLI `--list-runs` / `--replay`              | #447 / CHANGELOG 0.49.0 | `run-store.test.ts`, pipeline persist tests | **shipped** (replay **partial**)           | Replay is **read-back only** (prints stored JSON); does **not** re-execute `runPipeline` or resume mid-step                                                                                    |
| Checkpoint / resume             | No      | —                                                                              | —                       | —                                           | **none**                                   | Justified only when ACT/HITL mid-flight exists                                                                                                                                                 |
| Retry (provider)                | Yes     | `engines/provider/src/resilience.ts`                                           | #238                    | provider tests / health `circuit`           | **shipped**                                | Pipeline-level retry policy not first-class                                                                                                                                                    |
| Circuit breaker                 | Yes     | same                                                                           | #238                    | —                                           | **shipped**                                | —                                                                                                                                                                                              |
| Timeout                         | Partial | Provider `timeoutMs`; **no** pipeline global timeout                           | —                       | —                                           | **partial**                                | Pipeline wall-clock timeout absent                                                                                                                                                             |
| Cancellation                    | No      | —                                                                              | —                       | —                                           | **none**                                   | DEFER                                                                                                                                                                                          |
| Idempotency                     | No      | —                                                                              | —                       | —                                           | **none**                                   | DEFER until write ACT                                                                                                                                                                          |
| Decision ledger                 | Partial | `run.steps` + `.aios/governance/decisions.jsonl` + route on `run.model`        | ADR-0020 / 0024         | governance tests                            | **partial**                                | No typed `DecisionRecord` (route/skill/tool/approval)                                                                                                                                          |
| Skill packs                     | Yes     | `SkillManifest` in shared; `engines/prompt/src/skills.ts`                      | ADR-0026                | `skills.test.ts`, `prompt.test.ts`          | **shipped** (runtime enforcement **stub**) | No triggers/eval; `allowedTools` / `failurePolicy: retry` / prerequisites **not enforced** at MCP or pipeline — parsed into brief + recorded ids only; no in-repo `skills/` catalog by default |
| Skill evaluation                | No      | —                                                                              | —                       | —                                           | **none**                                   | P0 candidate                                                                                                                                                                                   |
| Capability / privilege model    | Yes     | `CallerPrivilege`, `authorizeMcpTool`                                          | ADR-0024                | MCP capability tests                        | **shipped**                                | `HUMAN_APPROVAL_REQUIRED` always denied (fail-closed stub)                                                                                                                                     |
| Model routing                   | Yes     | `routeModel`, `TaskProfile`, capability classes                                | ADR-0025 / 0031         | `router.test.ts`                            | **shipped**                                | No live health-aware fallback chain inside router; no unified “capability matrix” doc — closest matrix is `AGENT_MATRIX` (intent → agents) in `@aios/decision`                                 |
| Context budget                  | Yes     | shared + context gather                                                        | ADR-0025                | context tests                               | **shipped**                                | —                                                                                                                                                                                              |
| Context / Knowledge graph       | Yes     | `@aios/knowledge` heuristic                                                    | ADR-0005                | knowledge tests                             | **partial**                                | Edges: `contains` \| `depends_on` \| `documents` only; no enricher plugin bus                                                                                                                  |
| Memory                          | Yes     | `@aios/memory`                                                                 | ADR-0006                | memory journey tests                        | **shipped**                                | Content validation weak (security spike)                                                                                                                                                       |
| Evidence / Visibility           | Yes     | status metrics, visibility, Obsidian                                           | ADR-0019 / 0030         | visibility tests                            | **shipped**                                | Correlation improved via run store load                                                                                                                                                        |
| MCP tool audit                  | Yes     | `recordMcpToolAudit` / `kind: mcp.tool`                                        | #447                    | `run-store.test.ts`                         | **shipped**                                | Prometheus aggregation optional                                                                                                                                                                |
| Quality gate                    | Yes     | `@aios/quality-gate`                                                           | structural              | `quality.test.ts`                           | **partial**                                | Not golden/trajectory eval                                                                                                                                                                     |
| Hook bus                        | Yes     | shared hook ids + pipeline                                                     | ADR-0027                | pipeline hook tests                         | **shipped**                                | Default none                                                                                                                                                                                   |
| Agent registry                  | Yes     | `@aios-platform/agent-registry`                                                | ADR-0023                | —                                           | **partial**                                | Discovery ≠ dynamic runner load                                                                                                                                                                |
| Provider abstraction            | Yes     | `@aios/provider`                                                               | ADR-0009/16/17          | —                                           | **shipped**                                | Multimodal not in core (correct)                                                                                                                                                               |
| Human approval UX               | Stub    | privilege enum + MCP deny                                                      | ADR-0024                | gate tests                                  | **stub**                                   | No Console approval queue                                                                                                                                                                      |
| Workflow graph / DAG runtime    | No      | Steps are linear trail                                                         | —                       | —                                           | **none**                                   | Visual Console trail exists; not Fincept-style graph runtime                                                                                                                                   |
| AI eval harness                 | No      | no `integrations/evals/`                                                       | #447 open               | —                                           | **none**                                   | P0                                                                                                                                                                                             |
| OpenTelemetry                   | No      | —                                                                              | harness audit           | —                                           | **none**                                   | DEFER (ADR-0028 JSONL path preferred)                                                                                                                                                          |

### ACT honesty

`runPipeline` sets `capabilities.act: false` with explicit reason (`packages/pipeline/src/index.ts`). Implement/fix intents can fail the gate when ACT is required but unavailable (#377). **Do not invent checkpoint/resume as if writes were live.**

---

## 4. External Patterns (reference only)

| Source                     | Themes used                                                         | Themes ignored                                     |
| -------------------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| TradingAgents              | checkpoint/resume, decision logs, retry budget, structured evidence | Multi-agent trading domain, LangGraph-style graphs |
| agent-skills               | triggers, verification, exit criteria, eval cases                   | Separate skill marketplace / second skill runtime  |
| LibreChat                  | multi-provider, capability metadata, MCP                            | Chat-product UX as AIOS core                       |
| Agentic Inbox / Cloudflare | side-effect class, confirmation, tool visibility                    | Stateful agent product shell                       |
| Fincept Terminal           | execution graph, crash recovery UI                                  | Node-based workflow product in core                |
| Flowsint                   | entity graph, enrichers                                             | Parallel “investigation OS”                        |
| HyperFrames                | deterministic workflow contracts, regression                        | New workflow engine                                |
| MoneyPrinterTurbo          | stage I/O contracts                                                 | Video domain                                       |
| VoxCPM                     | multimodal / streaming metadata                                     | Voice/vision engines in core                       |

---

## 5. Adopt / Adapt / Reject / Defer Matrix

| Pattern                                     | Verdict                    | Rationale                                                     |
| ------------------------------------------- | -------------------------- | ------------------------------------------------------------- |
| PipelineRun store + replay                  | **ALREADY SHIPPED**        | `v0.49.0` / #447                                              |
| MCP tool audit JSONL                        | **ALREADY SHIPPED**        | `mcp.tool`                                                    |
| Provider retry + circuit                    | **ALREADY SHIPPED**        | #238                                                          |
| Capability-based model routing              | **ALREADY SHIPPED**        | ADR-0025/0031 — evolve only if health/cost metadata gaps bite |
| Skill packs as “how”                        | **ALREADY SHIPPED**        | ADR-0026                                                      |
| Skill triggers / verification / eval cases  | **ADAPT**                  | Extend `SkillManifest`; do **not** create SkillRegistry v2    |
| Golden selection evals (intent/skill/route) | **ADOPT** (thin)           | New `integrations/evals/` fixtures + CI; reuse engines        |
| Decision ledger records                     | **ADAPT**                  | Formalize metadata already implied by `run.steps` + route     |
| Checkpoint / resume runtime                 | **DEFER**                  | No ACT mid-flight; replay-of-record ≠ resume                  |
| Pipeline timeout / cancel                   | **DEFER**                  | Low leverage while analysis-only                              |
| HITL approval queue                         | **DEFER**                  | Privilege stub exists; Console queue is large                 |
| Context Graph enrichers / many edge kinds   | **DEFER** / slow **ADAPT** | Extend ADR-0005 edges only when a consumer needs them         |
| Fincept visual execution runtime            | **REJECT** as core         | Console trail + Visibility sufficient                         |
| LangGraph / CrewAI / AutoGen in core        | **REJECT**                 | ADR-0001                                                      |
| MoneyPrinter video architecture             | **REJECT**                 | Domain                                                        |
| VoxCPM multimodal core engines              | **DEFER** / plugin         | Capability metadata later if needed                           |
| OpenTelemetry adapter                       | **DEFER**                  | ADR-0028 JSONL path; P1 in harness audit                      |
| LLM-as-judge evals                          | **DEFER**                  | Resource-Aware; start deterministic                           |

---

## 6. Duplication Analysis

| Temptation               | Existing artifact                | Rule                               |
| ------------------------ | -------------------------------- | ---------------------------------- |
| New “Agent Runtime”      | `@aios/pipeline` + ADR-0024      | EXTEND run / hooks                 |
| New Skill framework      | ADR-0026 `SkillManifest`         | EXTEND fields + evals              |
| New Model Router         | `routeModel` / TaskProfile       | EXTEND bindings/metadata           |
| New Policy Engine        | `@aios/policy`                   | EXTEND policies JSON               |
| New Context Engine       | `@aios/context` + budget         | EXTEND gather/budget               |
| New Evidence system      | run store + metrics + visibility | EXTEND event kinds / trail         |
| New Quality Gate         | `@aios/quality-gate`             | EXTEND evaluators as plugins later |
| New Provider abstraction | `@aios/provider` + resilience    | EXTEND                             |
| New KG product           | `@aios/knowledge`                | EXTEND kinds/edges                 |
| New hook marketplace     | ADR-0027 central list            | Do not scatter                     |

**Regression risk today is higher from duplication than from missing features** — same conclusion as Aug 2026 runtime audit, still true after `v0.49.0`.

---

## 7. Architectural Gaps (ordered)

1. **No deterministic AI/selection eval harness** — structural QG ≠ golden tasks (#447 acceptance leftover).
2. **Security spike unfinished** — injection / memory validation (#447).
3. **Skill packs lack triggers/verification/eval cases** — selection is caller-supplied `skillIds`, not policy-tested.
4. **Decision metadata not a first-class Evidence type** — reconstructable but not query-uniform.
5. **HITL is deny-stub, not workflow** — correct fail-closed; UX deferred.
6. **Checkpoint/resume** — premature while `act: false`.
7. **Registry ≠ runtime** — known ADR-0023 tension; not solved by Fincept graphs.
8. **KG relationship vocabulary thin** — optional evolution, not a new “Context Graph” product.

---

## 8. Proposed Evolution (PASS 2 candidate)

### Goal

Make **capability selection testable and regressable** before deepening runtime resume/HITL.

```text
Intent  →  (optional Skill ids)  →  routeModel  →  agents
                ↑
         golden fixtures assert expectations
```

### Non-goals (this slice)

- Checkpoint/resume API
- New workflow DAG engine
- LLM judge
- Multimodal providers
- Second skill catalog product

### Target shape (evals)

```json
{
  "id": "appsec-deps-skill",
  "input": "Analyze Spring Boot dependencies for vulnerabilities",
  "expect": {
    "intentKind": "audit.security",
    "skillIds": { "selected": ["appsec-review"], "rejected": ["docs-only"] },
    "capabilityClass": "reasoning"
  }
}
```

Skill manifest **later** (separate thin ADR if fields change):

```text
SkillManifest += trigger.positive|negative, verification, exitCriteria, evaluation[]
```

Only after eval harness proves need — avoid schema churn without consumers.

---

## 9. Impacted Components

| Component                                        | Change type                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------------- |
| `integrations/evals/`                            | **New** fixtures + runner script (not an engine)                       |
| CI (`.github/workflows`)                         | Wire eval job or quality step                                          |
| `@aios/intent` / `@aios/pipeline` / `routeModel` | **Reuse** as SUT — no fork                                             |
| `@aios/prompt` skills                            | Optional later field extension                                         |
| CHANGELOG / glossario                            | Docs if user-facing                                                    |
| ADR                                              | Likely **ADR-00xx skill-eval harness** or amend 0026 if manifest grows |

---

## 10. API / Contract Changes

**P0 evals slice:** no change to `contractVersion` `"1"`. Runner calls existing APIs.

**If SkillManifest grows (P1):** additive optional fields only; default catalog remains empty; unknown ids still skip.

**DecisionRecord (P1):** prefer additive JSONL `kind: decision` or richer `PipelineStep.detail` — avoid parallel store.

---

## 11. Security Impact

- Evals must not embed secrets; fixtures use synthetic paths.
- Do not weaken MCP privilege gate for “easier tests.”
- Security spike remains separate: fail-closed sanitizer must not be bypassed by eval harness.
- Model never elevates privilege (`authorizeMcpTool` stays external).

---

## 12. Resource Impact

| Choice                    | Impact                                              |
| ------------------------- | --------------------------------------------------- |
| Deterministic evals in CI | Low CPU; no GPU; no new daemons                     |
| LLM-as-judge              | Higher cost/latency — **deferred**                  |
| Checkpoint DB             | Avoid — files under `.aios/` already Resource-Aware |
| Graph DB for KG           | **Rejected** — heuristic in-process                 |

---

## 13. Test Strategy

| Layer        | P0 evals                                                   | Later                 |
| ------------ | ---------------------------------------------------------- | --------------------- |
| Unit         | Fixture parser; expectation matchers                       | Skill trigger matcher |
| Integration  | `runPipeline` / `compilePrompt` / `routeModel` on fixtures | MCP deny + audit row  |
| Contract     | Expectations vs `PipelineResponse` fields                  | SkillManifest schema  |
| CI           | `pnpm evals` or script in quality job                      | Gate on drift         |
| Failure      | Missing intent / wrong skill assertion fails red           | —                     |
| Architecture | No new engine package without ADR                          | Duplication check     |

---

## 14. Migration Strategy

1. Add `integrations/evals/` + README (US English).
2. Seed ≥5 goldens from real intent kinds already tested.
3. CI non-blocking → blocking once stable.
4. Optionally extend SkillManifest behind ADR.
5. Close #447 eval checkbox when goldens run in CI; keep security spike separate if unfinished.

---

## 15. ADR Requirements

| Change                                    | ADR?                                                  |
| ----------------------------------------- | ----------------------------------------------------- |
| `integrations/evals/` runner only         | Optional short ADR or docs-only if no public contract |
| SkillManifest trigger/verification fields | **Yes** — amend ADR-0026 or new ADR                   |
| DecisionRecord persistence                | **Yes** if new public type / event kind               |
| Checkpoint/resume                         | **Yes** (when un-deferred)                            |
| HITL approval queue                       | **Yes**                                               |

---

## 16. Implementation Plan (after `ok` only)

1. Issue slice (Refs #447 or child issue).
2. `integrations/evals/` + selftest.
3. CI wire-up.
4. CHANGELOG `[Unreleased]`.
5. Local `check-semver-alignment.sh` before any promote with `feat:`.
6. **Stop** — do not bundle checkpoint/HITL/KG enrichers.

---

## 17. Risks

| Risk                                 | Mitigation                                     |
| ------------------------------------ | ---------------------------------------------- |
| Goldens couple to brittle heuristics | Assert stable contract fields only             |
| Schema inflation on skills           | Eval harness first; manifest fields second     |
| Premature resume API                 | Keep deferred until ACT                        |
| Doc drift vs harness audit           | This file supersedes stale “no persist” claims |

---

## 18. Success Criteria (PASS 2)

- [ ] `integrations/evals/` with ≥5 goldens in CI
- [ ] Existing tests green
- [ ] No duplicated Skill/Router/Pipeline engine
- [ ] Governance path unchanged (no Agent→Tool bypass)
- [ ] Resource-Aware preserved
- [ ] Docs/ADR reflect reality
- [ ] #447 eval acceptance progress measurable

---

## Scoring (prioritization model)

Scale 0–5. Prefer high value + reuse, low complexity/risk.

| Candidate               | Arch value | Alignment | Reuse | User value | Cost↓ | Risk↓ | Complexity↓ | Net             |
| ----------------------- | ---------- | --------- | ----- | ---------- | ----- | ----- | ----------- | --------------- |
| Golden selection evals  | 5          | 5         | 5     | 4          | 4     | 4     | 4           | **Best P0**     |
| Security spike          | 5          | 5         | 4     | 5          | 3     | 3     | 3           | **P0 parallel** |
| DecisionRecord thin     | 4          | 5         | 5     | 3          | 4     | 4     | 4           | P1              |
| SkillManifest triggers  | 4          | 5         | 5     | 4          | 3     | 3     | 3           | P1              |
| Checkpoint/resume       | 3          | 4         | 3     | 2          | 2     | 2     | 2           | Defer           |
| Context Graph enrichers | 3          | 4         | 4     | 2          | 2     | 3     | 2           | Defer           |
| HITL Console queue      | 4          | 5         | 3     | 4          | 1     | 2     | 1           | Defer           |
| OTel adapter            | 2          | 3         | 2     | 2          | 2     | 3     | 2           | Defer           |
| Multimodal core         | 1          | 2         | 1     | 1          | 1     | 1     | 1           | Reject/Defer    |
| LangGraph-in-core       | 0          | 0         | 0     | 1          | 0     | 0     | 0           | Reject          |

_(Cost/Risk/Complexity columns inverted in “↓” sense: higher score = cheaper/safer/simpler.)_

---

## Recommended Next Step

**PASS 2 authorization request:** implement the **deterministic eval harness** slice only (`integrations/evals/` + CI), aligned with #447, without SkillManifest schema expansion in the same PR unless fixtures prove it blocking.

Owner cue: reply **`ok`** to implement that slice; reply with a different priority if security spike should go first.

---

## Appendix A — Evidence anchors

| Claim                      | Anchor                                                          |
| -------------------------- | --------------------------------------------------------------- |
| PipelineRun type           | `packages/shared/src/index.ts`                                  |
| Persist/replay             | `engines/status/src/run-store.ts`, CLI args                     |
| MCP audit                  | `apps/mcp` + `recordMcpToolAudit`                               |
| Skills                     | ADR-0026, `engines/prompt/src/skills.ts`                        |
| Router                     | ADR-0025/0031, `routeModel`                                     |
| Intent→agent matrix        | `engines/decision` `AGENT_MATRIX`                               |
| Provider resilience        | `engines/provider/src/resilience.ts`                            |
| ACT false                  | `packages/pipeline` capabilities                                |
| KG edges                   | `KnowledgeEdgeKind` union                                       |
| No evals dir               | glob `integrations/evals/**` empty                              |
| ROADMAP execution contract | `docs/ROADMAP.md` — phases 1–hooks checked                      |
| Framework non-goals        | `docs/guides/agent-framework-boundaries.md`, ADR-0001/0024/0029 |

## Appendix B — Discovery inventory sources (PASS 1)

Parallel read-only inventories used to corroborate §3 (not separate SSOTs):

- Execution/runtime/resilience inventory (PipelineRun, hooks, QG, MCP caps, ADRs)
- Intelligence-layer inventory (skills, router, KG, memory, intent, registry, orchestration)
- Foundation/ROADMAP/ADR/#447 leftover summary

**Stale doc warning:** `AIOS-HARNESS-ARCHITECTURE-AUDIT.md` (2026-09-12) still claims missing run persistence / MCP audit — superseded by **v0.49.0**. Eval harness + security spike remain accurate open P0s.
