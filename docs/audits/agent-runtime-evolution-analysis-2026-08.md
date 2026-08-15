# AIOS — Agent Runtime, Model Routing & Execution Governance

> Point-in-time architecture analysis. **Not** product SSOT — [`FOUNDATION.md`](../FOUNDATION.md) and ADRs win.  
> **Date:** 2026-08-15  
> **Scope:** evolve AIOS without turning it into a generic coding agent.  
> **Status:** analysis accepted. **Phase 1 implemented** (#261 / ADR-0024). Phases 2+ still unauthorized.  
> **Sources:** repo code/docs (facts) · OpenClaude / Claude Code, OpenClaw, DeepSeek agent ecosystem (patterns only — no copied code).

---

## Executive verdict

AIOS is already a **governed control plane** (`runPipeline` + policies + plugins + quality gate + MCP). It is **not** missing a product identity. It is missing a thin **execution contract** on top of what already exists.

The smallest high-value change is **not** “add Skills + Runtime + Router + multi-agent”:

```text
P0: Execution State + Capability model + close the registry→orchestration gap
P1: Policy-driven Model Router (capability, not vendor)
P1: Context budgeting (minimum sufficient context)
P2: Skills as governed capability packs (not a second agent type)
P2: Centralized hooks
P3: Parallel workers / arbitrator — only when the pipeline is I/O bound
REJECT: Become OpenClaude/OpenClaw/DeepSeek-TUI
```

Preserve: ADR-0001 (standalone), ADR-0003 (`runPipeline` is the public API), ADR-0014 (Companion is experience), ADR-0002 (Issue → `feature/*` from `sandbox` → PR → `sandbox` → `main`).

---

## A. Current architecture

### Canonical flow (implemented)

```text
CLI / MCP / Companion
        │
        ▼
  @aios/pipeline.runPipeline          ← ADR-0003, contractVersion "1"
        │
        ▼
  Intent → Policy → Context → Knowledge → Memory?
        │
        ▼
  Orchestration (decision matrix + 4 hardcoded plugins)
        │
        ▼
  Quality Gate → PipelineResponse
        │
        ▼
  Governance / Status / Operational State / Console
```

### Component map

| Component        | Exists                                                   | Authority                 | Notes                                                                 |
| ---------------- | -------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------- |
| Governance       | Yes — `@aios/governance`, console                        | Decision trail, audit     | JSONL; ADR-0013/0020                                                  |
| Policies         | Yes — `@aios/policy` + `policies/aios.policies.json`     | **Highest**               | Injected into workflow; synced to Cursor rules                        |
| Agents           | Yes — 4 plugins (`architecture`, `appsec`, `docs`, `qa`) | Heuristic findings        | **Not** user-callable; not registry-driven at runtime                 |
| Context Engine   | Yes — `@aios/context`                                    | Heuristic snippets        | No embeddings/LLM                                                     |
| Skills           | **Not found**                                            | —                         | Closest: `docs/prompts/`, `@aios/prompt`, `.github/agents/*.agent.md` |
| Tools            | MCP tools only                                           | Control-plane ops         | ~22 `aios_*` tools; no Tools engine                                   |
| MCP              | Yes — `@aios/mcp`                                        | IDE/Companion bridge      | stdio default; HTTP opt-in :8791 (ADR-0022)                           |
| Workflows        | Partial                                                  | Merged into orchestration | No `engines/workflow/`                                                |
| Quality Gates    | Yes — `@aios/quality-gate` + CI                          | Blocks CLI if `!passed`   | Heuristic + repo CI                                                   |
| CI/CD            | Yes                                                      | Git promotion             | ADR-0002; `green` = sandbox→main                                      |
| Memory / State   | Yes — memory + operational-state + metrics               | Session + ops snapshot    | On-demand (Resource-Aware)                                            |
| Model / Provider | Yes — `@aios/provider`                                   | Auxiliary chat            | Ollama / OpenAI-compatible / Anthropic; **router is name stub**       |
| Agent Registry   | Yes — Phase 5                                            | Discovery/packaging       | **Does not load plugins into orchestration** (ADR-0023)               |

### Pipeline fact

`packages/pipeline/src/index.ts`:

```text
Intent → Policy → Context → Knowledge → Memory? → runWorkflow → evaluateQuality
```

Provider is **outside** this path (ADR-0008/0009: does not replace the IDE LLM).

### Version drift (docs hygiene)

| Source                     | Value             |
| -------------------------- | ----------------- |
| `package.json` / CHANGELOG | `0.32.0`          |
| README “Latest release”    | `v0.25.0` (stale) |
| MCP server version in code | `0.25.0` (stale)  |

---

## B. External patterns (concepts only)

### OpenClaude / Claude Code

Useful patterns (not to copy the loop):

| Pattern                              | Meaning for AIOS                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| Single agent loop around the model   | Coding-agent concern. AIOS is a **control plane**; Companion/IDE already loop.        |
| Permissions before tools             | Capability allowlist — AIOS should own this for MCP/`aios_*`, not recreate Bash/Edit. |
| Context compaction / minimum context | Evolve Context Engine 2.0 (budget + rank).                                            |
| Hooks as interceptors                | Central contract, not scattered `if`s.                                                |
| MCP as tool bus                      | Already the AIOS public surface.                                                      |
| Subagents with isolated context      | Only if tasks are independent; AIOS already isolates by workspace.                    |
| Skills as instruction packs          | Repeatable _how_, not a new agent identity.                                           |

**Do not adopt:** becoming a terminal coding agent; dumping the repo into context; model-owned privilege.

### OpenClaw

Useful patterns:

| Pattern                                           | Meaning for AIOS                                                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Runtime ≠ model                                   | Memory/state live **outside** any provider (AIOS already does this).                                                                 |
| Tool vs Skill vs Plugin                           | Tool = action; Skill = how to use tools; Plugin = packaged capability. Maps to AIOS: MCP tool / prompt-or-skill pack / agent plugin. |
| Tool policy (visible tools = survivors of policy) | Policy must filter MCP capabilities.                                                                                                 |
| Session / durable workflow                        | AIOS has memory + operational-state; lacks explicit Run/Step/Evidence chain.                                                         |
| Harness vs core                                   | OpenClaw embeds an external agent loop. AIOS must **not** embed a second loop in the control plane.                                  |

**Do not adopt:** gateway/chat-channel product; in-process unsandboxed plugin trust as default; self-authoring skills without a gate.

### DeepSeek ecosystem

Useful patterns:

| Pattern                                  | Meaning for AIOS                                                |
| ---------------------------------------- | --------------------------------------------------------------- |
| Fast vs reasoning **capability**         | Route by task class / risk / cost — **not** by vendor name.     |
| Escalate after N tool calls or high risk | Fits Policy + Router, not a DeepSeek lock-in.                   |
| OpenAI-compatible function calling       | Already covered by `@aios/provider` OpenAI-compatible adapter.  |
| Parallel tool fan-out                    | Valuable for **read-only** MCP probes; not for write/promotion. |

**Do not adopt:** “always Flash then Pro”; coupling core to DeepSeek-Coder; multi-agent theatre.

---

## C. Gap analysis

| Gap                                                     | Why it matters                                            | Fit          |
| ------------------------------------------------------- | --------------------------------------------------------- | ------------ |
| Registry does not drive orchestration                   | Phase 5 discovery is cosmetic if plugins stay hardcoded   | P0           |
| No first-class Execution State (Task/Run/Step/Evidence) | Governance cannot answer “who/what/why” per run           | P0           |
| No capability / privilege levels                        | Policy exists but tools are not capability-scoped         | P0           |
| Provider router is name stub                            | Cannot select by risk/cost/latency                        | P1           |
| Context has no budget/rank/policy filter                | Risk of dump-the-repo as scope grows                      | P1           |
| No Skills layer                                         | Repeatable “how” lives in prompts/agents/docs, fragmented | P2           |
| No centralized hooks                                    | Policy/obs/security intercepts will sprawl                | P2           |
| No parallel worker graph                                | Sequential `runAcrossWorkspaces` only                     | P3           |
| Agent plugins untested                                  | 4 plugins have no `*.test.ts`                             | P1 (quality) |
| README/MCP version stale                                | Contradicts SemVer discipline                             | P1 (hygiene) |

---

## D. Duplication analysis — do **not** add

| Tempting add                                           | Already exists                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| New “workflow engine”                                  | `@aios/orchestration.runWorkflow`                                         |
| New “agent marketplace runtime”                        | Registry + create-agent (discovery only — extend, don’t fork)             |
| Second control plane in Companion                      | Forbidden by ADR-0014                                                     |
| Prompt-as-policy                                       | `@aios/policy` + `aios.policies.json`                                     |
| Knowledge graph as production graph DB                 | ADR-0005: heuristic MVP                                                   |
| Coding-agent loop in AIOS core                         | Belongs in IDE / Companion                                                |
| Tools engine parallel to MCP                           | MCP **is** the tool surface                                               |
| Extra agents (planner/validator/arbitrator as plugins) | Decision matrix + quality-gate + governance already cover decide/validate |

---

## E. Target architecture (hypothesis — validated)

Keep the **pipeline as the spine**. Add three thin layers; do not insert a second orchestrator.

```text
                    CLI / MCP / Companion
                              │
                              ▼
                    Task Orchestrator = @aios/pipeline
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
     Context Engine     Policy Engine      Model Router
     (budgeted)         (authority)        (capability)
           └──────────────────┼──────────────────┘
                              ▼
                    Agent Runtime (thin)
                    lifecycle · permissions · evidence
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
        Skills             Tools              MCP
     (how / packs)    (aios_* actions)   (transport)
           └──────────────────┼──────────────────┘
                              ▼
              Plugins (who decides / domain heuristics)
                              │
                              ▼
              Evidence → Quality Gate → Decision / Promotion
```

**Runtime must not own business rules.** It executes Policy + contracts.

**Governance chain (keep this order):**

```text
Policy → Capability → Skill → Agent → Tool → Execution → Evidence → Gate → Decision
```

---

## F. Execution chain (target)

```text
Intent
→ Classification          (@aios/intent — exists)
→ Planning                (decision matrix — exists; optional decompose later)
→ Context                 (gather + budget + filter)
→ Policy                  (load/apply — exists)
→ Model Routing           (NEW: capability class, optional)
→ Skill                   (NEW: optional pack; default = none)
→ Agent                   (plugins — exist; should be registry-selected)
→ Tool                    (MCP aios_* — exists)
→ Evidence                (NEW: structured run record)
→ Validation              (quality-gate — exists)
→ Arbitration             (governance recordDecision — exists; not a new agent)
→ Decision
→ Promotion               (Git ADR-0002 — unchanged)
```

Promotion stays **human + Git**. AIOS must not auto-merge `sandbox` → `main`.

---

## G. Proposed contracts (conceptual — not implemented)

```ts
// Capability — privilege is never chosen by the model
type Privilege =
  'READ_ONLY' | 'SAFE_WRITE' | 'CONTROLLED_EXECUTION' | 'PRIVILEGED' | 'HUMAN_APPROVAL_REQUIRED';

type Capability = {
  id: string;
  privilege: Privilege;
  tools: string[]; // MCP tool names
};

// Execution state — answer who / what / why
type Run = {
  runId: string;
  taskId: string;
  intentKind: string;
  workspaceId?: string;
  policyIds: string[];
  agentIds: string[];
  skillIds: string[];
  model?: { providerId: string; modelId: string; capabilityClass: string };
  steps: Step[];
  artifacts: Artifact[];
  verdict?: { passed: boolean; reasons: string[] };
};

type Step = {
  stepId: string;
  kind: 'classify' | 'context' | 'policy' | 'agent' | 'tool' | 'gate';
  status: 'ok' | 'skip' | 'fail' | 'denied';
};

// Model router — vendor-agnostic
type ModelCapabilityClass = 'fast' | 'coding' | 'reasoning' | 'arbitration';

type RouteRequest = {
  intentKind: string;
  risk: 'low' | 'medium' | 'high';
  privilege: Privilege;
  costBudget?: 'low' | 'normal';
};

type RouteDecision = {
  providerId: string;
  modelId: string;
  capabilityClass: ModelCapabilityClass;
  reason: string;
};

// Skill — how, not who
type SkillManifest = {
  id: string;
  purpose: string;
  prerequisites: string[];
  allowedTools: string[];
  contextRequirements: string[];
  validation: string[];
  failurePolicy: 'fail' | 'skip' | 'retry';
};
```

Hooks (central list, not scattered):

```text
before-task · before-context · before-model · before-tool
after-tool · after-step · after-task · before-promotion · after-promotion
```

Observability (Phase 4, not Phase 1): structured events already sketched in `@aios/status` / metrics — extend, don’t invent a second bus.

---

## H. Migration plan (no API break)

1. **Keep** `runPipeline` / `contractVersion: "1"`. Additive fields only (`runId`, `route`, `evidence`).
2. **Wire registry → orchestration** behind a flag; default = current 4 plugins (ADR-0023 backcompat).
3. **Extract** privilege + validateContact-style shared checks: Policy already lists `agents-as-plugins`; add capability table next to it.
4. **Router** lives in `@aios/provider` replacing the name stub; pipeline calls it only when `PipelineRequest` asks for chat/provider.
5. **Skills** start as optional manifests consumed by Prompt Engine — **do not** create `engines/agent-code-review` if `review.change` + docs-writer already cover it.
6. **Git flow unchanged.** Issues still start work; branches from `sandbox`.

---

## I. Prioritized backlog

| ID  | Item                                                      | Pri    | Value   | Complexity | Risk   |
| --- | --------------------------------------------------------- | ------ | ------- | ---------- | ------ |
| 1   | Execution State on `PipelineResponse` (run/step/evidence) | P0     | High    | Low        | Low    |
| 2   | Registry-selected plugins (flag + fallback to 4)          | P0     | High    | Medium     | Medium |
| 3   | Capability / privilege table for MCP tools                | P0     | High    | Low        | Low    |
| 4   | Tests for 4 agent plugins                                 | P1     | High    | Low        | Low    |
| 5   | Fix README + MCP version drift                            | P1     | Medium  | Low        | Low    |
| 6   | Model Router by capability class + policy                 | P1     | High    | Medium     | Medium |
| 7   | Context budget + rank + policy filter                     | P1     | High    | Medium     | Low    |
| 8   | Skill registry (packs, not agents)                        | P2     | Medium  | Medium     | Medium |
| 9   | Central hook bus                                          | P2     | Medium  | Medium     | Medium |
| 10  | Parallel read-only workspace fan-out                      | P3     | Low–Med | High       | High   |
| 11  | Planner/Validator/Arbitrator as new agents                | REJECT | —       | High       | High   |
| 12  | Embed coding-agent loop in core                           | REJECT | —       | High       | High   |
| 13  | Vendor-locked DeepSeek/OpenAI routing                     | REJECT | —       | Low        | High   |

### Phases (only if justified)

| Phase           | Contents                                            | Implement now?             |
| --------------- | --------------------------------------------------- | -------------------------- |
| 1 Foundation    | Execution state, capability, registry→orchestration | **Yes — if authorized**    |
| 2 Intelligence  | Router, context budget, skill registry              | After Phase 1 is used      |
| 3 Orchestration | Parallel workers, dep graph, arbitration agent      | **No** until measured need |
| 4 Governance    | Hooks, richer evidence, OTel-ready events           | Incremental on 1           |
| 5 Optimization  | Cost routing, cache, selection tuning               | Last                       |

---

## J. Risks

| Risk                     | Mitigation                                       |
| ------------------------ | ------------------------------------------------ |
| Overengineering          | Smallest set: state + capability + registry wire |
| Provider lock-in         | Capability class, never vendor in Policy         |
| Context explosion        | Budget + rank; no full-repo dump                 |
| Agent explosion          | Plugins stay 4 until a consumer exists           |
| Permission escalation    | Model cannot pick `PRIVILEGED`                   |
| State complexity         | Append-only run record; FIFO like memory         |
| Duplicated orchestration | One spine: `runPipeline`                         |
| Unnecessary dependencies | No Pi/Claude-Code SDK in core                    |

---

## K. Final verdict

1. **Incorporate:** execution state; capability/privilege; registry-driven plugin selection; context budgeting; policy-driven model routing (capability classes).
2. **Adapt:** OpenClaw Tool/Skill/Plugin vocabulary; Claude Code permissions + hooks; DeepSeek fast/reasoning **as classes**, not products.
3. **Reject:** second agent loop in AIOS; Skills that clone existing plugins; multi-agent Planner/Validator theatre; vendor coupling; auto-promotion.
4. **Next architectural evolution:** **Governed execution contract** on the existing pipeline — not a new OS inside the OS.
5. **Smallest change, largest gain:**  
   `PipelineResponse.run` + capability allowlist on MCP tools + orchestration reads Agent Registry (with hardcoded fallback).

---

## Decision matrix (section 17)

| Pattern              | Source                 | AIOS Gap              | Benefit                            | Complexity | Risk   | Recommendation                      |
| -------------------- | ---------------------- | --------------------- | ---------------------------------- | ---------- | ------ | ----------------------------------- |
| Agent Runtime        | OpenClaw               | No lifecycle kernel   | One place for permissions/evidence | Medium     | Medium | **ADAPT** (thin, no business rules) |
| Skills               | OpenClaw / Claude Code | Not found             | Repeatable how-to                  | Medium     | Medium | **ADAPT** (packs; no new agents)    |
| Provider abstraction | Claude Code / DeepSeek | Exists; name stub     | Swap models                        | Low        | Low    | **ADOPT** (finish stub)             |
| Model Routing        | DeepSeek               | No capability routing | Cost/risk fit                      | Medium     | Medium | **ADAPT** (class + policy)          |
| Multi-Agent          | DeepSeek ecosystem     | Sequential only       | Parallel reads                     | High       | High   | **REJECT** now; revisit P3          |
| Session State        | Both                   | Memory exists; no Run | Traceability                       | Low        | Low    | **ADOPT** (Run/Step)                |
| Hooks                | Both                   | Scattered             | Policy/obs intercept               | Medium     | Medium | **ADAPT** (central list)            |
| Tool Policy          | OpenClaw               | Tools unscoped        | Safety                             | Low        | Low    | **ADOPT**                           |
| Context Budget       | Both                   | Heuristic gather only | Min sufficient context             | Medium     | Low    | **ADOPT**                           |

---

## What this analysis will not do

Phase 1 authorized and implemented (#261 / ADR-0024). No Phase 2+ (router, skills, hooks, parallel workers) until a later authorization.

Suggested first issue title if authorized:

```text
feat: execution state + capability allowlist + registry-selected plugins
```

Branch from `sandbox`: `feature/execution-state-capability-registry`.
