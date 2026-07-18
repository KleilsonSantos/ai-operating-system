# ADR-0013: Documentation + Governance engines (heuristic MVP)

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** Kleilson dos Santos
- **Issue:** #80

## Context

FOUNDATION lists `documentation-engine` and `governance-engine`. The `agent-docs` plugin only looks at Context Engine snippets. Canonical docs inventory/drift and a light decision trail are still missing — without an LLM, without Grafana, Resource-Aware.

## Decision

1. **`@aios/documentation`**: `auditDocumentation({ repoPath })` — canonical paths (FOUNDATION, ROADMAP, ADRs, policies…) + findings.
2. **`@aios/governance`**: `recordDecision` / `listDecisions` (`.aios/governance/decisions.jsonl`) + `auditGovernance` (must policies + decisions + optional docs audit).
3. MCP: `aios_audit_docs` · `aios_governance_audit` · `aios_governance_record`.
4. CLI: `--audit-docs` · `--governance-audit`.
5. Console Try it: `audit_docs` · `governance_audit`.
6. Distinct from the **Documentation Agent** (plugin): engine = inventory; agent = findings in the workflow.

## Consequences

### Positive

- Closes the last explicit Phase 3 gap in the ROADMAP (MVP)
- Reuses filesystem + policies; zero new services
- Local audit trail aligned with memory/metrics

### Trade-offs

- Heuristic (not NLP / embeddings)
- Local governance store, not multi-tenant

## Rejected alternatives

| Option | Reason |
| --- | --- |
| Only expand agent-docs | Does not cover canonical path inventory |
| Grafana/SaaS audit | Outside Resource-Aware / Phase 3 MVP |

## References

- [FOUNDATION](../FOUNDATION.md)
- [ADR-0010](./0010-governance-console.md)
- [ADR-0011](./0011-resource-aware-macos.md)
