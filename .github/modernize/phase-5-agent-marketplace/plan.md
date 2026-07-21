# Phase 5 Implementation Plan — Agent Marketplace & Reusability

**Phase:** 5  
**Target Release:** v0.28.0 (aspirational: 2026-08-20)  
**Pillar:** Agent Marketplace & Reusability  
**Status:** In Progress

---

## Overview

Phase 5 enables agents as first-class, discoverable, reusable building blocks for AIOS. Four pillars:

1. **Agent Registry** — discovery + metadata
2. **Agent Packaging** — standard manifest + dependencies
3. **Agent Observability** — execution tracking + health-score
4. **Community Publishing** — GitHub ingestion + template

---

## Milestones

### M1: Foundation (Week 1)

- [x] ADR-0023 approved (decision captured)
- [ ] Agent Registry architecture docs
- [ ] `agent.yaml` manifest schema (JSON Schema)
- [ ] `@aios/agent-registry` package scaffold

**Deliverables:** Schema + package structure  
**Owner:** Architect  
**Gate:** Spec clarity + dependency review

---

### M2: Registry MVP (Week 1–2)

- [ ] Implement `@aios/agent-registry` core (parse, validate, discover)
- [ ] CLI: `aios list-agents` command
- [ ] MCP: `aios_list_agents` tool
- [ ] Local registry storage (`.aios/agents.registry.json`)
- [ ] Agent metadata resolver (npm, git, local)

**Deliverables:** Functional discovery (CLI + MCP)  
**Owner:** Platform Engineer  
**Gate:** E2E test (list existing agents)

---

### M3: Packaging Standards (Week 2)

- [ ] Agent manifest validator
- [ ] npm scaffolder: `npm create @aios/agent@latest --name my-agent`
- [ ] Dependency resolver (multi-level: agent → agent → engine)
- [ ] Publish `@aios/agent-template` on npm
- [ ] Documentation: "Writing an Agent"

**Deliverables:** Template repo + validator + docs  
**Owner:** DevEx Engineer  
**Gate:** Template scaffolds without errors

---

### M4: Observability & Metrics (Week 2–3)

- [ ] Add `recordAgentExecution` hook to Orchestration Engine
- [ ] Metrics schema: `kind: agent.execution` (agent-name, version, outcome, duration, cost)
- [ ] Health-score calculator (success-rate + recency + adoption)
- [ ] Console card: Agent Catalog (trending, top-used, health, adoption curve)
- [ ] Integrate metrics into dashboard

**Deliverables:** Observability working end-to-end  
**Owner:** Analytics Engineer  
**Gate:** Dashboard shows real agent executions

---

### M5: Community Publishing (Week 3)

- [ ] GitHub Actions workflow: detect `aios-agent` topic, ingest metadata
- [ ] Async registry ingestion service (weekly scan)
- [ ] Abuse detection heuristics (stale agents, spam repos)
- [ ] Registry validation gate
- [ ] Documentation: "Publish Your Agent"

**Deliverables:** Community agents appear in catalog  
**Owner:** DevOps + DevEx  
**Gate:** First community agent ingested successfully

---

### M6: Integration & Backcompat (Week 3–4)

- [ ] Migrate built-in agents (Architecture, AppSec, Docs, QA) to registry
- [ ] Backwards compatibility: auto-wrap engines/* agents
- [ ] Cross-workspace discovery (multi-repo context)
- [ ] Companion integration (agents discoverable via MCP)
- [ ] Adoption curve metrics (Phase 5 → Phase 6 readiness)

**Deliverables:** Full end-to-end integration  
**Owner:** Platform Lead  
**Gate:** Adoption metrics + completeness gate

---

## Task Breakdown

See `tasks.json` for detailed task graph.

### Key epics:

| Epic              | Tasks   | Owner         | Week | Gate                     |
| ----------------- | ------- | ------------- | ---- | ------------------------ |
| **Registry**      | T1–T8   | Platform      | 1–2  | List agents ✅           |
| **Packaging**     | T9–T14  | DevEx         | 2    | Scaffold works           |
| **Observability** | T15–T22 | Analytics     | 2–3  | Dashboard live           |
| **Publishing**    | T23–T28 | DevOps+DevEx  | 3    | Community agent ingested |
| **Integration**   | T29–T35 | Platform Lead | 3–4  | Full adoption tracking   |

---

## Acceptance Criteria

**Phase 5 is complete when:**

1. ✅ `aios list-agents` returns built-in + community agents
2. ✅ Console Agent Catalog shows trending/health/adoption
3. ✅ `npm create @aios/agent` scaffolds without errors
4. ✅ Community agents (GitHub `aios-agent` topic) auto-ingest weekly
5. ✅ Metrics (`kind: agent.execution`) record every orchestration event
6. ✅ Health-score reflects adoption + success rate
7. ✅ No breaking changes to existing agents
8. ✅ Documentation complete (writing, publishing, integration)
9. ✅ Completeness gate passes (all REQ-* traced to tasks)

---

## Out of Scope (Defer to Phase 6+)

- **RBAC:** Granular agent permissions (owner, maintainer, trustlevel)
- **Grafana:** Advanced dashboards (Prometheus text export sufficient)
- **Horizontal scaling:** Distributed agent registry
- **RAG/Embeddings:** Advanced search (textual + tags MVP)
- **Federation:** Multi-AIOS instance coordination
- **IDE Integration:** VS Code / JetBrains extension bridge (Phase 6)

---

## Blockers & Risks

| Risk                            | Mitigation                                                   |
| ------------------------------- | ------------------------------------------------------------ |
| Spam/abuse in community agents  | Validation gate + manual moderation (first month)            |
| Dependency resolution conflicts | Sandbox all agent tests; version constraints clear in schema |
| Registry size explosion         | Pagination + archive (Phase 6+)                              |
| Backwards compat issues         | Built-in agents wrapped in shim; tests for both paths        |
| GitHub API rate limits          | Batch ingestion; cache responses (24h TTL)                   |

---

## References

- ADR-0023: Agent Registry & Marketplace (decision)
- [ROADMAP.md#phase-5](../../ROADMAP.md) — strategic context
- Architecture: Orchestration Engine (where hook lives)
- Governance: Policy Engine (agent validation rules)
- Console: Health + Attention surfaces

---

## Timeline

```
Week 1     Week 2     Week 3     Week 4
M1|        M2 M3      M4 M5      M6
┌─┼─────────┼──┼───────┼──┼───────┼───┐
│ │ Schema  │  │Bundle │  │Publish│Int│
│ │ Registry│  │ Obs   │  │Backc  │   │
└─┴─────────┴──┴───────┴──┴───────┴───┘
```

**Target:** v0.28.0 on 2026-08-20 (4 weeks)

---

## Sign-off

- [ ] Architect reviews spec + ADR
- [ ] Platform Lead approves milestone sequence
- [ ] DevOps confirms ingestion feasibility
- [ ] QA defines acceptance test matrix
