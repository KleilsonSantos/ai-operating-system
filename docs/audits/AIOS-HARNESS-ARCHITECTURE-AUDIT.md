# AIOS Harness Architecture Audit

**Repository:** [KleilsonSantos/ai-operating-system](https://github.com/KleilsonSantos/ai-operating-system)  
**Date:** 2026-09-12  
**Auditor role:** Principal AI Engineer · Staff Software Architect · AI Safety / Agent Evaluation Engineer  
**Method:** Read-only source inspection — `engines/`, `packages/`, `apps/`, `policies/`, ADRs, tests, CI. No product code modified (prompt §39).

**Central question:** _Can AIOS control agent behavior deterministically enough for safe, observable, evaluable, reproducible, governed execution?_

**Answer:** **Partially.** Strong **governance control plane**; weak **evaluation, replay, agentic security, and LLM execution loop**.

---

## Executive Summary

AIOS is **not** a prompt collection or thin LLM wrapper. It ships a real synchronous pipeline (`Intent → Policy → Context → Orchestration → Quality Gate`), MCP privilege gates, model routing metadata, JSONL metrics, governance audit, and explicit harness documentation ([ADR-0029](../adr/0029-ai-harness-mapping.md), [`harness-mapping.md`](../architecture/harness-mapping.md)).

It is **not yet** a production-grade **Agent Harness**: no persisted `PipelineRun`, no AI evaluation suite (golden tasks, trajectory scoring, LLM-as-judge), no formal `AgentContract` runtime enforcement, no interactive HITL, no prompt-injection harness, and default pipeline agents are **heuristic plugins** — not LLM agentic loops.

| Dimension                      | Verdict                                                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Maturity**                   | **LEVEL 2 — Agent Runtime** (partial **LEVEL 3** on policy/context/MCP)                                                       |
| **Category**                   | **AI Governance Platform** + partial harness — not generic Agent Framework                                                    |
| **Name "AI Operating System"** | Justified for **SDLC governance**; not for autonomous multi-agent OS at scale                                                 |
| **Portfolio**                  | Demonstrates architecture, policy, MCP caps, ADR discipline; looks like "wrapper" if claiming full agent OS without Phase 0–2 |

---

## Current Architecture

### Repository layout (§4 — structural equivalents)

| Prompt path             | Status        | AIOS equivalent                                                       |
| ----------------------- | ------------- | --------------------------------------------------------------------- |
| `README`                | FOUND         | `README.md`                                                           |
| `docs/`                 | FOUND         | `docs/` (30+ ADRs, architecture, guides, prompts, audits)             |
| `src/`                  | **NOT_FOUND** | Code in `engines/`, `packages/`, `apps/`                              |
| `packages/`             | FOUND         | `pipeline`, `shared`, `agent-registry`, `core` (stub), `create-agent` |
| `apps/`                 | FOUND         | `cli`, `console`, `mcp`                                               |
| `agents/`               | **NOT_FOUND** | `engines/agent-{architecture,appsec,docs,qa}/`                        |
| `plugins/`              | **NOT_FOUND** | Agents as engine plugins via orchestration                            |
| `mcp/`                  | **NOT_FOUND** | `apps/mcp/`                                                           |
| `config/`               | **NOT_FOUND** | `policies/aios.policies.json`, `.aios/` runtime                       |
| `scripts/`              | FOUND         | `scripts/` (coverage, community ingest, merge-pr)                     |
| `tests/`                | **NOT_FOUND** | 42 co-located `*.test.ts` (Vitest)                                    |
| `e2e/`                  | **NOT_FOUND** | `integrations/postman/` (HTTP regression)                             |
| `integration/`          | **NOT_FOUND** | `integrations/` (plural)                                              |
| `.github/workflows/`    | FOUND         | `ci.yml`, `delivery-observability.yml`, `community-agents.yml`        |
| `package.json`          | FOUND         | pnpm workspaces + Turborepo, Node ≥22.13                              |
| `tsconfig*`             | FOUND         | Per-package                                                           |
| `eslint*` / `prettier*` | FOUND         | Root ESLint 10 + Prettier                                             |
| `vitest`                | FOUND         | `@vitest/coverage-v8`, `scripts/run-test-coverage.mjs`                |
| `Docker*`               | **NOT_FOUND** | —                                                                     |
| `Makefile`              | **NOT_FOUND** | npm/pnpm scripts                                                      |

### Architectural map (§5)

```text
┌─────────────────────────────────────────────────────────────┐
│ APPLICATIONS                                                │
│  apps/cli · apps/console · apps/mcp (stdio + opt HTTP)      │
└───────────────────────────┬─────────────────────────────────┘
                            │ @aios/pipeline (ADR-0003 SSOT)
┌───────────────────────────▼─────────────────────────────────┐
│ CORE SPINE                                                  │
│  intent → policy → context → routeModel → orchestration     │
│  → quality-gate → PipelineResponse (+ ephemeral PipelineRun)│
└───────────────────────────┬─────────────────────────────────┘
                            │
     ┌──────────────────────┼──────────────────────┐
     ▼                      ▼                      ▼
 engines/*            packages/shared         policies/
 (20+ slices)          MCP auth, router        aios.policies.json
     │                      │
     ▼                      ▼
 .aios/ runtime      @aios/provider (chat — MCP only, not pipeline)
 memory · metrics · governance · state · agents.registry.json
```

**Integration contract:** `@aios/pipeline` → `runPipeline()` — integrators must not depend on individual engines ([ADR-0003](../adr/0003-pipeline-integration-contract.md)).

**Explicit non-goals:** LangGraph/CrewAI in core ([ADR-0001](../adr/0001-standalone-platform.md)); unsandboxed community agent execution ([ADR-0024](../adr/0024-execution-state-capability-registry.md)).

---

## Harness Definition

Per [ADR-0029](../adr/0029-ai-harness-mapping.md), AIOS defines harness as: system instructions, tools, memory, policies, verification, and I/O shaping — **AIOS owns rules**; the model is a capability via `@aios/provider`.

This audit adds: a **production Agent Harness** requires **durable execution records, evaluators, replay, budgets on agentic loops, enforceable agent contracts, and trajectory audit** — mostly **PARTIAL or AUSENTE** today.

Industry stack investigated (prompt §2):

```text
Input/Intent · Context · Policy · Agent Lifecycle · Tool Permission · MCP Governance
Model Routing · Budget/Token · Timeout/Retry · State/Memory · Execution Tracing
Observability · Evaluation · Quality Gates · Security · Evidence · HITL · Regression
```

---

## Current Harness Capabilities

| Layer                | Status       | Evidence                                                                                      |
| -------------------- | ------------ | --------------------------------------------------------------------------------------------- |
| Input / intent       | PARCIAL      | `engines/intent/` — heuristic classification; comment "LLM entra depois"; no injection filter |
| Planning             | DOCUMENTADO  | Decision matrix static; no LLM planner in pipeline                                            |
| Orchestration        | IMPLEMENTADO | `engines/orchestration/` — 4 built-in runners                                                 |
| Agent execution      | PARCIAL      | Heuristic plugins; not LLM loops                                                              |
| Tool/MCP execution   | PARCIAL      | MCP gate strong; pipeline does not invoke tools                                               |
| Validation           | IMPLEMENTADO | Structural quality gate                                                                       |
| Evaluation (AI)      | AUSENTE      | No golden tasks, trajectory eval, LLM judge                                                   |
| Quality gate         | IMPLEMENTADO | `engines/quality-gate/`                                                                       |
| Evidence / telemetry | PARCIAL      | JSONL + Prometheus; no OTel, no MCP audit                                                     |
| Learning / feedback  | AUSENTE      | No closed-loop learning harness                                                               |

---

## Agent Runtime Analysis

### Pipeline flow (`packages/pipeline/src/index.ts`)

**IMPLEMENTADO** — ordered execution:

```text
trim input → resolveWorkspace/repoPath
→ resolveIntent(input)
→ loadPolicies + applyPolicies
→ resolveCallerPrivilege
→ resolveContextBudget(intent, risk, costBudget)
→ routeModel(...)                    // decision only — no chat
→ gatherContext + buildKnowledgeGraph + summarizeKnowledge
→ recall(memory) [optional]
→ runWorkflow(intent, {policies, context, pluginSource})
→ capabilities.act = false           // #377 / ADR-0024
→ evaluateQuality(results, {intent, context, actAvailable})
→ buildPipelineRun(steps) → PipelineResponse
```

Key constraint (L193–197):

```typescript
// Default runPipeline is analysis-only (heuristic plugins; no repo writes)
const capabilities = { act: false, reason: '...no governed write/ACT executor' };
```

No import from `@aios/provider` or `@aios/prompt` in pipeline — skill compile and chat are **outside** default spine.

### Agent lifecycle (§9)

| Stage     | Status       | Evidence                                                            |
| --------- | ------------ | ------------------------------------------------------------------- |
| REGISTER  | PARCIAL      | `AgentRegistry`, `agent.schema.json`, `.aios/agents.registry.json`  |
| DISCOVER  | IMPLEMENTADO | builtin, local, npm, git, community catalog                         |
| LOAD      | PARCIAL      | Registry lists agents; orchestration loads 4 hardcoded RUNNERS only |
| VALIDATE  | PARCIAL      | JSON schema for manifest; no runtime contract enforcement           |
| AUTHORIZE | PARCIAL      | MCP privilege ranks; agents have no per-agent auth                  |
| EXECUTE   | PARCIAL      | 4 heuristic plugins                                                 |
| OBSERVE   | IMPLEMENTADO | `recordAgentExecution` → JSONL                                      |
| EVALUATE  | AUSENTE      | No agent output scoring                                             |
| TERMINATE | AUSENTE      | No cancel/timeout on workflow                                       |

### RUNNERS vs registry

`engines/orchestration/src/index.ts` — hardcoded map:

```typescript
const RUNNERS = { architecture, appsec, docs, qa };
```

Registry mode (`AIOS_REGISTRY_PLUGINS=1`) **intersects** discovered package names with `PACKAGE_TO_AGENT_ID` — does **not** load or execute arbitrary community agents. Community catalog explicitly: _"Does not clone or execute remote agent code"_.

### Heuristic vs LLM agents

All four agents use regex/rules on paths and snippet content — not LLM reasoning. Intent engine: _"classificação heurística (regras). LLM entra depois."_

**Isolation:** Same Node process — **AUSENTE** sandbox per agent.

---

## Context Harness

**Status: IMPLEMENTADO** (heuristic + KG, no embeddings)

| Capability       | Evidence                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Context assembly | `engines/context/src/index.ts` — `gatherContext()`                                               |
| Budget tiers     | tight: 6 snippets / 16KB · standard: 12 / 40KB · wide: 16 / 48KB                                 |
| Budget selection | `unknown`/`high` risk/`low` cost → tight; implement/fix/review/audit → wide                      |
| Secret denylist  | `.env*`, `*.pem/key`, `credentials.json`, `secrets/`                                             |
| Scope validation | Fail-closed on absolute paths and `..` escape                                                    |
| KG neighbors     | `knowledgeNeighborRelPaths` — no embeddings ([`rag-boundaries.md`](../guides/rag-boundaries.md)) |
| Session memory   | `.aios/memory/{workspaceId}.json` FIFO via `engines/memory/`                                     |
| Traceability     | Snippet paths in `context.injected:N` findings                                                   |

**Gaps (§7):**

- Who decides context? **Context engine + budget resolver** — deterministic, auditable in response.
- Reproduce execution? **No** — context assembly is reproducible given same repo state, but `PipelineRun` not persisted.
- Memory poisoning controls: **AUSENTE** — `remember()` accepts arbitrary content.

---

## Policy Harness

**Status: IMPLEMENTADO (load/merge) · PARCIAL (enforcement)**

| Capability                 | Status       | Evidence                                                                     |
| -------------------------- | ------------ | ---------------------------------------------------------------------------- |
| Declarative JSON           | IMPLEMENTADO | `policies/aios.policies.json` (25 rules) + defaults                          |
| Walk-up discovery          | IMPLEMENTADO | `engines/policy/src/index.ts`                                                |
| Severity must/should/may   | IMPLEMENTADO |                                                                              |
| Brief injection            | PARCIAL      | `applyPolicies` → constraints string; orchestration tags `policies.injected` |
| Policy → Agent             | PARCIAL      | Advisory via brief; no per-agent deny                                        |
| Policy → Tool              | IMPLEMENTADO | `mcp-safe-write-consent` + `authorizeMcpTool()`                              |
| Policy → Model             | PARCIAL      | `model-route-by-capability` rule; router is code not policy DSL              |
| Policy → Environment       | PARCIAL      | Env flags for MCP consent                                                    |
| Policy → Workflow          | PARCIAL      | Quality gate checks `policies.injected` tag                                  |
| Versioned / testable       | PARCIAL      | Git + `engines/policy/src/policy.test.ts`; no policy regression suite        |
| Composable / deterministic | IMPLEMENTADO | JSON merge, stable ordering                                                  |

Machine-enforceable path today is primarily **MCP gate + quality gate structural checks**, not a general authorization engine.

---

## Tool/MCP Harness

**Status: IMPLEMENTADO (gate) · PARCIAL (full harness)**

### Per-tool checklist (§10)

| Attribute         | Status       | Evidence                                        |
| ----------------- | ------------ | ----------------------------------------------- |
| Identity          | IMPLEMENTADO | Fixed `MCP_TOOL_CATALOG` (23 tools)             |
| Schema            | IMPLEMENTADO | Zod at registration (`apps/mcp/src/index.ts`)   |
| Permissions       | IMPLEMENTADO | 5 privilege ranks, `authorizeMcpTool()`         |
| Risk level        | IMPLEMENTADO | Rank per tool in `packages/shared/src/index.ts` |
| Timeout / retry   | **AUSENTE**  | Per-tool limits not in MCP layer                |
| Input validation  | IMPLEMENTADO | Zod                                             |
| Output validation | **AUSENTE**  |                                                 |
| Audit             | **AUSENTE**  | Gate decisions not logged to JSONL              |
| Observability     | PARCIAL      | `provider.chat` + `agent.execution` only        |

**Privilege model:** `READ_ONLY` → `SAFE_WRITE` → `CONTROLLED_EXECUTION` → `PRIVILEGED` → `HUMAN_APPROVAL_REQUIRED`.

- `PRIVILEGED` requires `AIOS_MCP_ALLOW_PRIVILEGED=1`
- `HUMAN_APPROVAL_REQUIRED` **always denied** on MCP surface (fail-closed stub)
- Must-policy `mcp-safe-write-consent` gates destructive writes behind `AIOS_MCP_ALLOW_SAFE_WRITE=1`

**Answers (§10):**

- Agent can call any tool? **No** — fixed catalog + rank check.
- Contextual authorization? **Partial** — caller privilege + must-policy IDs.
- Sandbox / dry-run / replay? **AUSENTE**.

Live test: `apps/mcp/src/stdio-live.test.ts` — deny path for insufficient privilege.

---

## Model Harness

**Status: IMPLEMENTADO (routing decision) · AUSENTE (pipeline invocation)**

| Capability               | Status                 | Evidence                                               |
| ------------------------ | ---------------------- | ------------------------------------------------------ |
| Provider abstraction     | IMPLEMENTADO           | `engines/provider/` — Ollama, OpenAI, Anthropic        |
| Model registry           | PARCIAL                | Env-bound provider/model IDs                           |
| Capability classes       | IMPLEMENTADO           | fast / standard / reasoning via `routeModel()`         |
| Routing in pipeline      | IMPLEMENTADO           | Records `route` step in `PipelineRun`                  |
| Chat in pipeline         | **AUSENTE by design**  | ADR-0025, ADR-0031                                     |
| Fallback chains          | **AUSENTE**            |                                                        |
| Cost tracking            | PARCIAL                | Token counts in JSONL; no monetary governor            |
| Retry / circuit breaker  | IMPLEMENTADO           | `engines/provider/src/resilience.ts` (chat layer only) |
| Tool calling on provider | **AUSENTE**            | Chat-only in MCP `aios_provider_chat`                  |
| Streaming                | **AUSENTE** in harness |                                                        |

`routeModel` comment: _"Pure decision — no network, no chat (ADR-0025 / ADR-0031)."_

Task → Select Model → Execute → Evaluate → Fallback loop: **only Select Model** runs inside `runPipeline`; Execute/Evaluate are separate MCP surfaces.

---

## Execution Harness

**Status: PARCIAL (ephemeral trace) · AUSENTE (persistence)**

| Field                     | Present         | Evidence                                                            |
| ------------------------- | --------------- | ------------------------------------------------------------------- |
| run_id                    | Yes (ephemeral) | `buildPipelineRun` in pipeline                                      |
| correlation_id / trace_id | **AUSENTE**     |                                                                     |
| execution steps           | Yes             | `PipelineRun.steps`: classify, policy, context, route, agents, gate |
| cancellation / timeout    | **AUSENTE**     | Pipeline has no global timeout                                      |
| checkpoint / resume       | **AUSENTE**     |                                                                     |
| idempotency               | **AUSENTE**     |                                                                     |
| concurrency               | PARCIAL         | `runAcrossWorkspaces` fans out per workspace                        |

Canonical persistence statement (`packages/shared/src/index.ts` L1083):

> _"Present when caller injects a run; AIOS does not persist PipelineRun yet."_

**Answer §12:** Agent execution is **observable in response** but **not reproducible** without caller-side persistence.

---

## Evaluation Harness

**Critical distinction (§13):** Unit tests ≠ Agent evaluation.

### Deterministic tests — IMPLEMENTADO

- **42** `*.test.ts` files (Vitest)
- Pipeline contract: `packages/pipeline/src/pipeline.test.ts`
- Quality gate: `engines/quality-gate/src/quality.test.ts`
- MCP live: `apps/mcp/src/stdio-live.test.ts`
- Postman HTTP regression: `integrations/postman/`

### AI evaluations — AUSENTE

| Expected                           | Status                                 |
| ---------------------------------- | -------------------------------------- |
| Golden tasks                       | **AUSENTE** — no `integrations/evals/` |
| Expected tool calls                | **AUSENTE**                            |
| LLM-as-judge                       | **AUSENTE**                            |
| Trajectory scoring                 | **AUSENTE**                            |
| Regression baselines for AI output | **AUSENTE**                            |

`evaluateQuality()` (`engines/quality-gate/src/index.ts`) checks **structure only**:

- known intent, agents scheduled, context present, policies injected, domain findings, ACT availability
- **Not** output correctness, hallucination, safety, or tool selection quality

### Trajectory evaluation (§14)

**AUSENTE** — no recorded plan → tool call → reasoning chain in pipeline. JSONL captures `agent.execution` duration/outcome, not tool argument trajectories.

---

## Observability Harness

**Status: PARCIAL**

| Layer                 | Status       | Evidence                                                                         |
| --------------------- | ------------ | -------------------------------------------------------------------------------- |
| Structured JSONL      | IMPLEMENTADO | `.aios/metrics/events.jsonl` — `provider.chat`, `agent.execution`, `delivery.ci` |
| Prometheus            | IMPLEMENTADO | `engines/status/src/index.ts`; Console `GET /metrics`                            |
| Governance audit      | IMPLEMENTADO | `.aios/governance/decisions.jsonl`                                               |
| Operational state     | IMPLEMENTADO | `.aios/state/events.jsonl`                                                       |
| Visibility plane      | PARCIAL      | `correlateVisibility` — needs run injection                                      |
| OpenTelemetry         | **AUSENTE**  | No `@opentelemetry/*` in any `package.json`                                      |
| Distributed traces    | **AUSENTE**  | No span IDs across CLI → MCP → provider                                          |
| Per-MCP-tool metrics  | **AUSENTE**  |                                                                                  |
| Monetary cost metrics | **AUSENTE**  | Token counts only                                                                |

Logging is primarily stderr + JSONL append — not a unified trace model.

---

## Security Harness

**Status: PARCIAL**

### Implemented

| Control                 | Paths                                                   |
| ----------------------- | ------------------------------------------------------- |
| MCP least-privilege     | `packages/shared/src/index.ts`, `apps/mcp/src/index.ts` |
| Context secret denylist | `engines/context/src/index.ts`                          |
| Scope escape prevention | `context-scope-security.test.ts`                        |
| ACT blocking            | Quality gate `actAvailable` check                       |
| Supply chain            | `audit-ci --moderate`, CodeQL in CI                     |
| HTTP stack sanitization | `apps/console/src/json-response.ts`                     |

### Absent (OWASP LLM / agentic — no compliance claim)

| Risk                        | Status                           |
| --------------------------- | -------------------------------- |
| Prompt injection filter     | **AUSENTE**                      |
| Tool injection              | Partial — MCP catalog fixed      |
| Data exfiltration harness   | Partial — denylist only          |
| Excessive agency            | Mitigated — `act: false` default |
| Memory poisoning            | **AUSENTE**                      |
| Untrusted LLM output filter | **AUSENTE**                      |
| MCP tool audit trail        | **AUSENTE**                      |

---

## Human-in-the-Loop

**Status: PARCIAL (env consent) · AUSENTE (interactive workflow)**

| Mechanism                 | Status                                                                  |
| ------------------------- | ----------------------------------------------------------------------- |
| Risk tiers in MCP         | IMPLEMENTADO — privilege ranks                                          |
| `HUMAN_APPROVAL_REQUIRED` | EXPERIMENTAL — type exists, **always denied**                           |
| Env break-glass           | IMPLEMENTADO — `AIOS_MCP_ALLOW_PRIVILEGED`, `AIOS_MCP_ALLOW_SAFE_WRITE` |
| Governance record         | IMPLEMENTADO — append-only JSONL (not approval queue)                   |
| Console approval UI       | **AUSENTE** — safe actions execute immediately                          |
| Emergency stop            | **AUSENTE**                                                             |

Operator consent = environment variables, not workflow with pending/approve/reject.

---

## Budget & Resource Controls

**Status: PARCIAL (context bytes) · AUSENTE (agentic loops)**

| Control                       | Status       | Evidence                        |
| ----------------------------- | ------------ | ------------------------------- |
| Context byte/snippet caps     | IMPLEMENTADO | `engines/context/`              |
| Route cost → capability class | IMPLEMENTADO | `routeModel()`                  |
| Memory FIFO cap               | IMPLEMENTADO | Default 50 entries              |
| Token telemetry               | IMPLEMENTADO | `recordProviderChatMetric`      |
| Token budget governor         | **AUSENTE**  |                                 |
| Max tool calls / iterations   | **AUSENTE**  |                                 |
| Monetary budget               | **AUSENTE**  |                                 |
| Anti-loop guards              | **AUSENTE**  | Future ACT/LLM mode unprotected |

---

## Failure & Recovery

**Status: PARCIAL**

| Scenario                   | Mechanism               | Status                                 |
| -------------------------- | ----------------------- | -------------------------------------- |
| Provider network failure   | Retry + circuit breaker | IMPLEMENTADO — `resilience.ts`         |
| Agent plugin failure       | Per-plugin try/catch    | IMPLEMENTADO — orchestration continues |
| Quality inconsistency      | Gate blockers           | IMPLEMENTADO                           |
| Pipeline timeout           | —                       | **AUSENTE**                            |
| Checkpoint / resume        | —                       | **AUSENTE**                            |
| Dead-letter / compensation | —                       | **AUSENTE**                            |
| Human escalation           | —                       | **AUSENTE**                            |

---

## State & Memory

| Store                | Persisted | Paths                              |
| -------------------- | --------- | ---------------------------------- |
| Session memory       | Yes       | `.aios/memory/{workspaceId}.json`  |
| PipelineRun          | **No**    | Response-only                      |
| Governance decisions | Yes       | `.aios/governance/decisions.jsonl` |
| Agent registry       | Yes       | `.aios/agents.registry.json`       |
| Metrics              | Yes       | `.aios/metrics/events.jsonl`       |

Memory: not versioned, no content validation, FIFO eviction with optional rollup — **contamination risk** (Medium).

---

## Replayability

**Classification: TRACE ONLY** (§15)

| Field                 | Captured                                           |
| --------------------- | -------------------------------------------------- |
| run_id                | Ephemeral in response                              |
| trace_id              | **No**                                             |
| agent_version         | **No**                                             |
| model / model_version | Route metadata only                                |
| prompt/version        | **No** in pipeline                                 |
| context snapshot      | Reconstructible from repo if caller saved response |
| tool I/O history      | **No**                                             |
| policy version        | Policy IDs in run                                  |
| evaluation scores     | **No**                                             |

Full replay requires **caller-side persistence** of `PipelineResponse` + JSONL exports. Visibility with `runId` alone → `runLookup: 'unavailable'`.

No `aios replay` CLI.

---

## Evidence & Auditability

| Type       | Status       | Store                                 |
| ---------- | ------------ | ------------------------------------- |
| LOG        | PARCIAL      | stderr, unstructured                  |
| TRACE      | PARCIAL      | `PipelineRun.steps` (ephemeral)       |
| AUDIT      | IMPLEMENTADO | `.aios/governance/decisions.jsonl`    |
| EVIDENCE   | PARCIAL      | Visibility snapshots, Obsidian export |
| EVALUATION | **AUSENTE**  | No evaluation record store            |

**Partial answer to "why did the agent do this?"**

- Pipeline scheduling (intent matrix, policies, route reason) — **yes**
- IDE-side LLM reasoning or MCP argument choices — **no**

### Agent contracts (§23)

`packages/agent-registry/schema/agent.schema.json` — manifest schema (name, version, inputs/outputs). **Not** a runtime `AgentContract` with tools, limits, evaluator — **DOCUMENTADO / PARCIAL**.

### Evaluator architecture (§24)

**AUSENTE as first-class plugins.** Single structural `evaluateQuality()` — no `DeterministicEvaluator`, `LLMEvaluator`, `SecurityEvaluator` registry.

---

## Architectural Boundaries

**Coupling: LOW–MEDIUM** (by design)

```text
CORE (pipeline + shared types)
  engines/* — single-concern slices
PLUGINS
  agent-* engines, provider, MCP tools
APPLICATIONS
  CLI, Console, Postman integrations
```

| Boundary                  | Assessment                                         |
| ------------------------- | -------------------------------------------------- |
| AIOS vs LangGraph/CrewAI  | **CLEAR** — ADR-0001, boundary guide               |
| Core vs Companion         | **CLEAR** — ADR-0014                               |
| Policy vs MCP enforcement | **MEDIUM coupling** — main enforceable path is MCP |
| Orchestration vs 4 agents | **HIGH coupling** — `RUNNERS` hardcoded            |
| Registry vs runtime       | **MEDIUM gap** — discovery without execution       |

### Repository structure notes (§26)

- `packages/core` stub vs "ai-core" naming in some docs — minor drift
- `engines/status` aggregates metrics + governance status — acceptable but dense
- No dead `src/` top-level — intentional monorepo layout
- Community agents **fail-closed** by design — coherent

### Harnesses as platform (§28)

Specialized harnesses (Dev, Security, Eval, MCP) **make sense** as **engine slices + ADRs**, not new monoliths — aligns with ADR-0029 rejected alternative ("16th harness engine").

### Conceptual comparison (§29)

| Category               | AIOS fit                                                  |
| ---------------------- | --------------------------------------------------------- |
| Agent Runtime          | **Yes** — pipeline + plugins                              |
| Agent Harness          | **Partial**                                               |
| Agent Framework        | **No** — not generic ReAct/LangGraph                      |
| AI Gateway             | **Partial** — MCP + provider, not enterprise gateway      |
| AI Governance Platform | **Yes** — primary identity                                |
| AI Evaluation Platform | **No**                                                    |
| AI SDLC Platform       | **Partial** — delivery observability, heuristic agents    |
| MCP Runtime            | **Partial** — strong gate, weak audit                     |
| Workflow Engine        | **Partial** — synchronous pipeline, not durable workflows |

---

## Maturity Assessment

| Level                       | Definition | Fit                                            |
| --------------------------- | ---------- | ---------------------------------------------- |
| 0 — Prompt collection       |            | ❌                                             |
| 1 — Agent framework         |            | ❌                                             |
| **2 — Agent runtime**       |            | **✅ Primary**                                 |
| 3 — Agent harness           |            | **Partial** — policy, context, MCP, gate       |
| 4 — Governed agent platform |            | Partial — governance JSONL, delivery obs       |
| 5 — AI Operating System     |            | Partial — SDLC governance yes; full OS loop no |

### Maturity matrix (§32) — 0–5 per capability

| Capability         | Score | Rationale                              |
| ------------------ | ----- | -------------------------------------- |
| Agent Runtime      | 3     | Pipeline + 4 plugins; no LLM loop      |
| Context Management | 4     | Budgets, denylist, KG                  |
| Policy Engine      | 3     | Load/merge strong; enforcement partial |
| Tool Governance    | 2     | MCP gate only                          |
| MCP Governance     | 4     | Privilege model + tests                |
| Model Routing      | 3     | Decision without invocation            |
| Evaluation         | 1     | Structural gate only                   |
| Replay             | 1     | Ephemeral runs                         |
| Observability      | 3     | JSONL/Prometheus                       |
| Security (agentic) | 2     | MCP + denylist; no injection harness   |
| Human Approval     | 2     | Env flags                              |
| Budget Control     | 2     | Context bytes only                     |
| Failure Recovery   | 3     | Provider CB + plugin catch             |
| Memory             | 3     | Persisted; no validation               |
| Auditability       | 3     | Governance JSONL; no MCP audit         |
| Quality Gates      | 3     | Structural, not semantic               |

---

## Scorecard

| Capability         | Status       | Evidence                                       | Maturity | Risk     | Recommendation                      |
| ------------------ | ------------ | ---------------------------------------------- | -------- | -------- | ----------------------------------- |
| Agent Runtime      | PARCIAL      | `packages/pipeline/`, `engines/orchestration/` | 3        | Med      | Persist runs; optional ACT executor |
| Context Management | IMPLEMENTADO | `engines/context/`                             | 4        | Low      | Document replay limits              |
| Policy Engine      | PARCIAL      | `engines/policy/`, 25 JSON rules               | 3        | Med      | Extend enforceable rules beyond MCP |
| Tool Governance    | PARCIAL      | MCP catalog + Zod                              | 2        | Med      | MCP audit log + per-tool limits     |
| MCP Governance     | IMPLEMENTADO | `authorizeMcpTool()`                           | 4        | Low      | Wire HITL when ready                |
| Model Routing      | PARCIAL      | `routeModel()` — no pipeline chat              | 3        | Low      | Fallback chains; cost metrics       |
| Evaluation         | AUSENTE      | No `integrations/evals/`                       | 1        | **High** | Golden tasks + evaluator registry   |
| Replay             | TRACE ONLY   | `PipelineRun` not persisted                    | 1        | **High** | Run store + replay CLI              |
| Observability      | PARCIAL      | JSONL + Prometheus                             | 3        | Med      | Optional OTel adapter               |
| Security           | PARCIAL      | MCP caps + denylist                            | 2        | **High** | Prompt-injection spike              |
| Human Approval     | PARCIAL      | Env consent only                               | 2        | Med      | Console HITL queue                  |
| Budget Control     | PARCIAL      | Context caps only                              | 2        | Med      | Token/tool-call caps on loops       |
| Failure Recovery   | PARCIAL      | Provider CB                                    | 3        | Med      | Pipeline timeout                    |
| Memory             | PARCIAL      | `.aios/memory/`                                | 3        | Med      | Content validation                  |
| Auditability       | PARCIAL      | Governance JSONL                               | 3        | Low      | Unify evidence model                |
| Quality Gates      | IMPLEMENTADO | `evaluateQuality()` structural                 | 3        | Low      | Add numeric eval scores             |

---

## Critical Gaps

Top 10 ordered by Impact × Architectural Importance × Risk × Portfolio Value:

### 1. No AI evaluation harness (P0 · HIGH · ARCHITECTURAL)

- **Problem:** Cannot regression-test agent/LLM behavior.
- **Current:** Structural quality gate only.
- **Why it matters:** Blocks production-grade harness claims.
- **Target:** `integrations/evals/` + evaluator plugin registry.
- **Complexity:** MEDIUM · **Benefit:** Portfolio proof + CI regression.

### 2. No PipelineRun persistence / replay (P0 · HIGH · QUICK WIN)

- **Problem:** Incidents not reconstructible.
- **Current:** `AIOS does not persist PipelineRun yet` — `packages/shared/src/index.ts:1083`.
- **Target:** `.aios/runs/` JSONL/SQLite + `aios replay <runId>`.
- **Complexity:** QUICK WIN → MEDIUM.

### 3. Heuristic agents vs LLM agent loop (P1 · HIGH)

- **Problem:** Product expectation gap vs "AI OS".
- **Current:** Regex plugins; `act: false`.
- **Target:** Optional governed ACT executor behind policy + HITL — not LangGraph in core.
- **Complexity:** LARGE.

### 4. Registry ≠ runtime (P1 · MEDIUM)

- **Problem:** Discovery without safe dynamic execution.
- **Current:** `RUNNERS` hardcoded; registry intersects names only.
- **Target:** Sandboxed plugin loader + contract validation.
- **Complexity:** ARCHITECTURAL.

### 5. No formal AgentContract runtime (P1 · MEDIUM)

- **Problem:** `agent.schema.json` is catalog metadata only.
- **Target:** Extend schema with tools, limits, evaluator refs.
- **Complexity:** MEDIUM.

### 6. Prompt injection / memory poisoning (P0 · HIGH · Security)

- **Problem:** Untrusted repo content reaches context/memory unchecked beyond path denylist.
- **Current:** **AUSENTE** filter modules.
- **Target:** Input sanitizer + memory content validation spike.
- **Complexity:** MEDIUM.

### 7. No MCP tool-call audit trail (P1 · HIGH)

- **Problem:** Forensic gap on privileged ops.
- **Current:** Gate returns deny; no JSONL stream.
- **Target:** Append-only `mcp.tool` events.
- **Complexity:** QUICK WIN.

### 8. HITL is env flags, not workflow (P2 · MEDIUM)

- **Target:** Console approval queue for PRIVILEGED ops.
- **Complexity:** LARGE.

### 9. No agentic loop budgets (P1 · MEDIUM)

- **Target:** Token/tool/iteration caps when ACT mode ships.
- **Complexity:** MEDIUM.

### 10. Evaluator not first-class (P1 · HIGH)

- **Target:** Plugin model: Deterministic + Policy + optional LLM judge.
- **Complexity:** MEDIUM.

---

## Opportunities

1. **Run store + replay CLI** — highest leverage for harness credibility
2. **Evaluator plugin model** — unlocks quality gate evolution
3. **Golden task suite** in `integrations/evals/`
4. **MCP tool audit stream** — completes tool/MCP harness
5. **OpenTelemetry adapter** on `runPipeline` — without rewrite
6. **AgentContract v2** extending `agent.schema.json`
7. **Console HITL queue**
8. **Parallel harness specialist agents** (Copilot) referencing PKB — audit pattern proven

---

## Recommended Target Architecture

Minimum viable harness — **no overengineering** (§35):

```text
@aios/pipeline (unchanged SSOT — ADR-0003)
  + RunStore          → .aios/runs/ (JSONL or SQLite)
  + EvaluatorRegistry → plugins: structural, policy, golden-task
  + McpAuditLog       → append-only mcp.tool events
  + ReplayCommand     → aios replay <runId>
  + Optional OTel     → spans: run → step → tool (adapter only)
```

**Rejected for now:** Kubernetes, microservices split, event bus, new orchestrator framework — not required for single-repo SDLC governance.

---

## Roadmap

| Phase                  | Focus                                         | Priority | Size          |
| ---------------------- | --------------------------------------------- | -------- | ------------- |
| **0 — Foundation**     | Run persistence + MCP audit log               | P0       | QUICK WIN     |
| **1 — Harness core**   | Evaluator registry + ACT policy path          | P0       | MEDIUM        |
| **2 — Evaluation**     | 5–10 golden tasks + CI regression             | P0       | MEDIUM        |
| **3 — Observability**  | OTel adapter + cost/token dashboards          | P1       | MEDIUM        |
| **4 — Security**       | Prompt-injection spike + memory validation    | P0       | MEDIUM        |
| **5 — Agent platform** | AgentContract v2 + sandboxed community load   | P1       | ARCHITECTURAL |
| **6 — AI SDLC**        | Eval suite tied to delivery CI + HITL Console | P2       | ARCHITECTURAL |

---

## Portfolio Impact

**Demonstrates seniority:**

- Policy/context/MCP gate design
- ADR discipline and honest boundary rejection (LangGraph)
- Monorepo engine slices + pipeline SSOT
- Delivery observability workflow
- Fail-closed community agent policy

**Looks like "AI wrapper" if claimed without evidence:**

- Full autonomous LLM agents
- AI evaluation / replay
- Interactive HITL
- Production agent harness at Level 4–5

---

## Final Verdict

### 1. O AIOS possui um Agent Harness hoje?

**Parcialmente.** Strong **governance harness** (policy, context, MCP gate, quality gate, governance audit). Weak **evaluation, replay, contract, trajectory, and agentic security** harness.

### 2. Quais partes já funcionam como Harness?

Policy load/merge, context assembly with budgets and denylist, MCP authorization, pipeline step tracing, structural quality gate, model routing metadata, governance audit JSONL, agent execution metrics.

### 3. Quais partes são apenas abstrações/documentação?

- Full autonomous "AI OS" execution loop
- Community agent **execution** (discovery only)
- Semantic PKB/RAG in default context path
- Interactive HITL approval flow
- LLM-based agents in default `runPipeline`
- Hook bus intercepts (trace-only `record.lifecycle`)
- Skill compile in pipeline spine (recorded IDs only)

### 4. O que falta para Harness production-grade?

Run persistence, AI eval harness, agent contracts with enforcement, tool trajectory audit, interactive HITL, agentic loop budgets, prompt-injection/output safety.

### 5. O que diferencia AIOS de um Agent Framework tradicional?

AIOS is a **control plane + rules** for SDLC governance — not a generic ReAct/LangGraph runtime. Complementary category, not competitor clone.

### 6. O que falta para justificar "AI Operating System"?

Durable cross-run state, federated policy enforcement beyond MCP, eval+replay at OS layer, multi-tenant isolation — partial for single-repo SDLC OS today.

### 7. Menor arquitetura sem overengineering?

Persist runs + evaluator plugins + MCP audit on existing `@aios/pipeline` ([ADR-0003](../adr/0003-pipeline-integration-contract.md)).

### 8. Maior impacto técnico e de portfólio?

**Run store + golden-task evaluators** — unlocks replay, regression, incident analysis, and credible harness narrative.

---

## Audit execution metadata

- **Workers:** Parallel domain analysis (core/policy/context, tools/MCP/eval, observability/security) → single SSOT report (orchestrator-workers pattern).
- **Related:** [ADR-0029](../adr/0029-ai-harness-mapping.md), [`agent-runtime-evolution-analysis-2026-08.md`](./agent-runtime-evolution-analysis-2026-08.md), [`harness-mapping.md`](../architecture/harness-mapping.md).
- **PKB source:** VaultSpring `prompt.delivery.aios-harness-architecture-audit` — cross-repo catalog asset.

---

_End of audit — read-only pass; no code, PR, commit, or issues per prompt §39._
