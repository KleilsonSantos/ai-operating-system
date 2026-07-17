# ADR-0020: Governance audit v2 (actionable signals)

- **Status:** Accepted
- **Date:** 2026-07-17
- **Deciders:** Kleilson dos Santos
- **Issue:** #121

## Context

[ADR-0013](./0013-documentation-governance-engines.md) shipped a heuristic MVP (`recordDecision` + thin `auditGovernance`). Health Attention barely reflected governance depth. Maturity analysis showed engines ~45–55% deep while ROADMAP checkboxes were ✅.

## Decision

1. Keep local JSONL store (Resource-Aware); no LLM / no SaaS audit.
2. Harden `auditGovernance` with actionable findings:
   - **Core must coverage** (`PLATFORM_CORE_MUST_IDS`)
   - **Fail verdicts** in recent decisions → `error`
   - **Unknown `policyIds`** on decisions → `warn`
   - **Non-canonical kinds** → `info` (prefer `policy|adr|release|exception|note|audit`)
3. Normalize `recordDecision` kinds (lowercase) and validate verdicts.
4. `getGovernanceStatus` runs a **quick** governance audit (`includeDocumentation: false`) and merges warn/error findings into Attention (skip duplicates of empty-store / no-must).
5. Operational State exposes `governance.ok` + `findingCount`.

## Consequences

### Positive

- Governance signals visible in console Health without a separate click
- Stronger control-plane depth without new services

### Trade-offs

- Core must list is AIOS-opinionated (custom homes may see `gov-missing-core-must`)
- Status poll now reads decisions.jsonl (cheap; still no docs walk)

## References

- [ADR-0013](./0013-documentation-governance-engines.md)
- [ADR-0010](./0010-governance-console.md)
- [ADR-0015](./0015-operational-state.md)
