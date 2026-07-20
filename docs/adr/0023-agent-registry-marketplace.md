# ADR-0023 — Agent Registry & Marketplace

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Kleilson Santos  
**Phase:** Phase 5  

---

## Context

By Phase 4, AIOS had:
- Governance engines (Intent, Policy, Context, Decision, Quality-Gate)
- Agent plugins (Architecture, AppSec, Docs, QA) coordinated via Orchestration Engine
- Multi-provider support (OpenAI, Anthropic, Ollama)
- Observability (audit v2, consumption metrics)
- Multi-repository workspace registry

**Problem:** Agents exist but are not discoverable or reusable across AIOS instances. Scaling agent adoption requires:
1. Standardized packaging (manifest, dependencies, versioning)
2. Registry for discovery (CLI, API, dashboard)
3. Observability of agent execution (adoption, health, cost)
4. Community publishing (GitHub topics, async ingestion)

Without this, agents remain "hidden" in `engines/`, and AIOS cannot differentiate itself from LangChain/CrewAI on the reuse axis.

---

## Decision

Implement **Phase 5: Agent Registry & Marketplace** as a 4-pillar system:

### 1. Agent Registry
- Versionless discovery: `aios list-agents` / `GET /agents`
- Metadata: name, version, maintainer, capabilities, tags, health-score
- Storage: local (`.aios/agents.registry.json`) + cloud (GitHub releases)

### 2. Agent Packaging
- Standard manifest: `.aios/agent.yaml` (name, version, inputs, outputs, dependencies)
- Distribution: npm + git submodule + local filesystem
- Dependency resolution: agent → agent, agent → engine

### 3. Agent Observability
- Hook `recordAgentExecution` in Orchestration Engine
- Metrics: `kind: agent.execution` (who, when, outcome, cost)
- Health-score: success-rate + recency + adoption
- Console card: agent catalog with trending/top-used/health

### 4. Community Publishing
- Template: `npm create @aios/agent@latest --name my-agent`
- GitHub discovery: weekly scan for `aios-agent` topic
- Registry ingestion (async, validated, abuse-aware)
- Documentation: "Publish Your Agent"

---

## Rationale

1. **Reuse is the differentiator** — governance was Phase 1–4; agents are the multiplier
2. **Community is ready** — Companion + multi-provider + PKB created openness
3. **Observability exists** — metrics + audit v2 enable adoption tracking
4. **Scales with contributors** — marketplace scales communities, not just curators
5. **Prepares Phase 6** — agent ↔ IDE bridging (Companion integration)

---

## Implications

### What we build
- `@aios/agent-registry` — discovery + metadata + validation
- `@aios/agent-scaffold` — template + validator + dependency resolver
- Console: Agent Catalog surface (trending, adoption curve, health)
- GitHub Actions: async registry ingestion
- Documentation: packaging standards, publish workflow

### What we defer (on purpose)
- Alerting (proactive, advanced — exists in basic form via Attention)
- Grafana dashboard (Prometheus text export enough today)
- RBAC (granular agent permissions — Phase 6+)
- Horizontal scaling / federation (Phase 6+)
- RAG over agent catalog (textual/tag search sufficient)

### Backwards compatibility
- Existing agents in `engines/` auto-discover as built-in
- Legacy agents wrapped in minimal manifest (no breaking changes)
- Orchestration Engine unchanged (only adds observability hook)

---

## Alternative

**Status quo:** Manual agent curation.
- ❌ Doesn't scale
- ❌ No adoption signals
- ❌ Discoverability = asking humans

---

## Consequences

- **Positive:**
  - Agents become first-class, composable building blocks
  - Health-score signals problematic agents early
  - Community can extend AIOS without forking
  - Metrics inform Phase 6 (IDE integration priorities)
  - Prepares for distributed/federated future

- **Negative:**
  - Additional complexity in packaging (manifest, dependencies, versioning)
  - Abuse/spam risk (GitHub ingestion needs validation gate)
  - Storage: agents.registry.json grows (manageable for MVP; pagination Phase 6+)

---

## References

- [Phase 5 Briefing](../ROADMAP.md#phase-5--agent-marketplace--reusability) — rationale & timeline
- ADR-0001 (Standalone Platform) — AIOS governance thesis
- ADR-0008 (Prompt Engine) — brief/token economy analogy
- [Architecture Overview](./architecture/overview.md) — orchestration contract

---

## Next

1. ✅ ADR accepted (this doc)
2. → Create `plan.md` + `tasks.json` in `.github/modernize/phase-5-agent-marketplace/`
3. → Feature branch: `feature/agent-registry-v5`
4. → PR → `sandbox` → review → `main`
