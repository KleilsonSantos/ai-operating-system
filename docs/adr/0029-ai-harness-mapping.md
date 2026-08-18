# ADR-0029: AI harness mapping — industry concept to AIOS engines

- **Status:** Accepted
- **Date:** 2026-08-18
- **Deciders:** Kleilson dos Santos
- **Issue:** #321

## Context

Industry diagrams describe an **AI harness** as everything that guides a model beyond a single user prompt: system instructions, tools, memory, policies, verification, and I/O shaping. Operators comparing AIOS to agent-builder infographics need a **canonical map** from that vocabulary to shipped engines — without adopting third-party orchestrators as the product core.

AIOS already implements harness layers incrementally (Policy Engine, Prompt Engine + skill packs, MCP caps, Memory Engine, Quality Gate, hook bus, metrics). What was missing was explicit documentation, not a new runtime.

## Decision

1. **AIOS is the harness for SDLC governance.** The model (local or cloud via `@aios/provider`) is a capability; AIOS owns rules, context assembly, tool exposure, memory boundaries, and pre-response verification.
2. **Map harness layers to existing engines** (see table below). New harness concerns ship as **engine slices or ADRs**, not as LangGraph/CrewAI/LlamaIndex embedded orchestrators ([ADR-0001](./0001-standalone-platform.md)).
3. **Default-none extensions.** Skill packs ([ADR-0026](./0026-skill-packs-prompt-engine.md)) and pipeline hooks ([ADR-0027](./0027-pipeline-hook-bus.md)) stay opt-in — the harness does not load catalogs unless requested.
4. **Memory and PKB stay separate SSOTs.** Session/project memory ([ADR-0006](./0006-memory-engine-session.md)) is authoritative for run context; PKB (`docs/prompts/`) is catalog-only until semantic/RAG ADRs pass Resource-Aware gates ([`pkb-evolution.md`](../prompts/pkb-evolution.md)).
5. **Experience plane stays out of core.** Voice, n8n-style automation, CRM, and IDE watchers belong to the Companion client ([ADR-0014](./0014-control-plane-companion.md)), consuming `aios_*` contracts — not reimplemented engines.

### Harness layer → AIOS mapping

| Harness concern (industry)  | AIOS engine / artifact                       | Shipped | Notes                                              |
| --------------------------- | -------------------------------------------- | ------- | -------------------------------------------------- |
| User prompt                 | CLI / MCP / pipeline input                   | ✅      | `runPipeline`, `aios_compile_prompt`               |
| System instructions         | Policy Engine + Prompt brief                 | ✅      | Policies in `policies/`; brief from `@aios/prompt` |
| Skills / workflows          | Prompt Engine skill packs + `@aios/pipeline` | ✅      | ADR-0026; not a second agent runtime               |
| Tools & APIs                | MCP `@aios/mcp` + Agent Registry             | ✅      | Capability caps; agents as plugins                 |
| Memory & context            | Memory Engine + Context Engine + KG          | ✅      | JSON session memory; heuristic KG (ADR-0005)       |
| Rules & policies            | Policy Engine                                | ✅      | `policies/aios.policies.json`                      |
| Verification / eval         | Quality Gate + governance audit              | ✅      | Pre-response gate; `aios_audit_*`                  |
| Inputs & outputs            | Status metrics + JSONL events                | ✅      | ADR-0019, ADR-0028                                 |
| Model routing               | Model router (capability classes)            | ✅      | ADR-0025; operator binds provider                  |
| Semantic PKB / RAG          | Deferred                                     | ⏳      | Ladder steps 4–6; ADR after spike                  |
| Multi-agent crew frameworks | **Not in core**                              | ❌      | Use Agent Registry + pipeline; see boundary guide  |

Guide with diagrams: [`docs/architecture/harness-mapping.md`](../architecture/harness-mapping.md).

## Consequences

### Positive

- Clear answer to “is AIOS an agent framework?” — **governance harness**, not a LangChain clone
- Onboarding aligns industry vocabulary with repo layout
- Future slices (memory compression, PKB vectors) attach to named layers instead of ad-hoc stacks

### Trade-offs

- Documentation-only ADR — no user-visible feature flag
- Infographics that show cloud vector DBs as defaults remain **misleading** until Phase D ADRs

## Rejected alternatives

| Option                                 | Reason                                            |
| -------------------------------------- | ------------------------------------------------- |
| Embed LangGraph/CrewAI as orchestrator | Violates ADR-0001; duplicates pipeline            |
| Add “harness engine” as 16th runtime   | Redundant — concerns already distributed          |
| Import claude-mem or Mem0              | Third-party memory SSOT; AGPL / drift vs ADR-0006 |
| Scrapy in monorepo for references      | Python stack; optional external job only          |

## References

- [ADR-0001](./0001-standalone-platform.md) — standalone platform
- [ADR-0006](./0006-memory-engine-session.md) — memory
- [ADR-0014](./0014-control-plane-companion.md) — control plane vs companion
- [ADR-0026](./0026-skill-packs-prompt-engine.md) — skill packs
- [ADR-0027](./0027-pipeline-hook-bus.md) — hook bus
- [Architecture harness mapping](../architecture/harness-mapping.md)
- [Agent framework boundaries](../guides/agent-framework-boundaries.md)
- [MCP architecture](https://modelcontextprotocol.io/docs/learn/architecture)
