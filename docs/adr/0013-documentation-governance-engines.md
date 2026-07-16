# ADR-0013: Documentation + Governance engines (MVP heurístico)

- **Status:** Aceito
- **Data:** 2026-07-15
- **Decisores:** Kleilson dos Santos
- **Issue:** #80

## Contexto

FOUNDATION lista `documentation-engine` e `governance-engine`. O plugin `agent-docs` só olha snippets do Context Engine. Falta inventário/drift de docs canónicas e um rasto leve de decisões — sem LLM, sem Grafana, Resource-Aware.

## Decisão

1. **`@aios/documentation`**: `auditDocumentation({ repoPath })` — paths canónicos (FOUNDATION, ROADMAP, ADRs, policies…) + findings.
2. **`@aios/governance`**: `recordDecision` / `listDecisions` (`.aios/governance/decisions.jsonl`) + `auditGovernance` (policies must + decisões + opcional docs audit).
3. MCP: `aios_audit_docs` · `aios_governance_audit` · `aios_governance_record`.
4. CLI: `--audit-docs` · `--governance-audit`.
5. Console Try it: `audit_docs` · `governance_audit`.
6. Distinto do **Documentation Agent** (plugin): engine = inventário; agent = findings no workflow.

## Consequências

### Positivas

- Fecha o último gap explícito da Fase 3 no ROADMAP (MVP)
- Reutiliza filesystem + policies; zero serviços novos
- Audit trail local alinhado a memory/metrics

### Negativas / trade-offs

- Heurístico (não NLP / embeddings)
- Governance store local, não multi-tenant

## Alternativas rejeitadas

| Opção | Motivo |
| --- | --- |
| Só expandir agent-docs | Não cobre inventário de paths canónicos |
| Grafana/audit SaaS | Fora de Resource-Aware / Fase 3 MVP |

## Referências

- [FOUNDATION](../FOUNDATION.md)
- [ADR-0010](./0010-governance-console.md)
- [ADR-0011](./0011-resource-aware-macos.md)
