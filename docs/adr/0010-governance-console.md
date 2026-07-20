# ADR-0010: Governance console (Health + Attention) — not Grafana-first

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** Kleilson dos Santos
- **Issue:** #71

## Context

We need palatable visibility: what is active, available, and needs attention. Grafana is excellent for time series, but the AIOS domain (workspaces, policies, providers, MCP) still lacks rich consumption instrumentation.

## Decision

1. **Layer 1 (MVP):** `apps/console` (Vite + React) + local API + `@aios/status` engine (`getGovernanceStatus`).
2. First screen: health summary + **Needs attention** list (not a wall of charts).
3. **Layer 2:** export Prometheus text from `.aios/metrics/events.jsonl` — `GET /metrics` + `aios --metrics-prometheus` ([ADR-0021](./0021-prometheus-metrics-export.md)). Grafana remains optional / user-owned.
4. Stack: Vite + React (light, local). No agent calls in the primary UX.
5. MCP `aios_governance_status` · CLI `--governance-status`.

## Consequences

### Positive

- Immediate value without depending on Ollama/Prometheus
- Product (console) vs ops (Grafana) separation
- Attention rules versioned in code

### Trade-offs

- Token consumption was stub until ADR-0019 (`provider.chat` JSONL)
- Console is local (not multi-tenant SaaS)

## Rejected alternatives

| Option                | Reason                                             |
| --------------------- | -------------------------------------------------- |
| Grafana-first         | No useful series yet; weak fit for the AIOS domain |
| Next.js already       | Overkill for a local MVP                           |
| Agents-only dashboard | Violates “plugins, not direct-call UX”             |

## References

- [ROADMAP Phase 3](../ROADMAP.md)
- [ADR-0009](./0009-multi-provider-ollama.md)
- [`apps/console/README.md`](../../apps/console/README.md)
