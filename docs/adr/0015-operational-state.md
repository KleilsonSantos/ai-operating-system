# ADR-0015: Operational State MVP (control plane)

- **Status:** Aceito
- **Data:** 2026-07-16
- **Decisores:** Kleilson dos Santos
- **Issue:** #84

## Contexto

O Companion (ADR-0014) precisa de um **estado operacional estável** no control plane — sem voz, sem watchers agressivos, sem controlar IDE/Docker. `@aios/status` cobre Health/Attention; falta um snapshot unificado (git leve + focus workspace + ponte memory/governance) consumível por MCP/CLI/console.

## Decisão

1. **`@aios/operational-state`**: `getOperationalState({ homePath, workspaceId? })` — agrega `getGovernanceStatus`, `probeGit` (on-demand, timeout curto), `listDecisions`, focus de workspace; `mode: 'on-demand'`; `boundaries` explícitas (`voice`/`ideControl`/`dockerControl` = false).
2. **Event hook barato:** `recordOperationalEvent` → `.aios/state/events.jsonl` (append on-demand; sem polling).
3. MCP: `aios_operational_state`. CLI: `--operational-state`. Console Try it: `operational_state`.
4. Distinto do Companion: este engine **não** abre IDE, não sobe Docker, não faz voz.

## Consequências

### Positivas

- Contrato claro para o futuro Companion
- Reutiliza Status/Governance; zero serviços novos
- Alinhado Resource-Aware (ADR-0011)

### Negativas / trade-offs

- Git via `git` CLI local (ausente → `available: false`)
- Snapshot pontual — não “estado vivo” contínuo (isso fica no Companion)

## Alternativas rejeitadas

| Opção | Motivo |
| --- | --- |
| Watchers Git/IDE no AIOS | Resource-Aware + fora de missão (ADR-0014) |
| Expandir só `@aios/status` sem engine | Mistura consola de saúde com contrato Companion |
| Embutir voz no state | Escopo Companion |

## Referências

- [ADR-0014](./0014-control-plane-companion.md)
- [ADR-0010](./0010-governance-console.md)
- [ADR-0011](./0011-resource-aware-macos.md)
- Guia: [`docs/guides/control-plane-companion.md`](../guides/control-plane-companion.md)
