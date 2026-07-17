# ADR-0010: Console de governança (Health + Attention) — não Grafana-first

- **Status:** Aceito
- **Data:** 2026-07-15
- **Decisores:** Kleilson dos Santos
- **Issue:** #71

## Contexto

Precisamos de visibilidade palatável: o que está ativo, disponibilizado e a precisar de atenção. Grafana é excelente para séries temporais, mas o domínio AIOS (workspaces, policies, providers, MCP) ainda não tem instrumentação rica de consumo.

## Decisão

1. **Camada 1 (MVP):** `apps/console` (Vite + React) + API local + engine `@aios/status` (`getGovernanceStatus`).
2. Primeiro ecran: resumo de saúde + lista **Needs attention** (não wall de gráficos).
3. **Camada 2 (depois):** export Prometheus / Grafana a partir de `.aios/metrics/events.jsonl` (`recordMetricEvent`).
4. Stack: Vite + React (leve, local). Sem chamar agentes no UX principal.
5. MCP `aios_governance_status` · CLI `--governance-status`.

## Consequências

### Positivas

- Valor imediato sem depender de Ollama/Prometheus
- Separação produto (console) vs ops (Grafana)
- Attention rules versionadas no código

### Negativas / trade-offs

- Token consumption was stub until ADR-0019 (`provider.chat` JSONL)
- Console is local (not multi-tenant SaaS)

## Alternativas rejeitadas

| Opção | Motivo |
| --- | --- |
| Grafana-first | Sem séries úteis; fraco no domínio AIOS |
| Next.js já | Overkill para MVP local |
| Dashboard só de agentes | Viola “plugins, não UX de chamada direta” |

## Referências

- [ROADMAP Fase 3](../ROADMAP.md)
- [ADR-0009](./0009-multi-provider-ollama.md)
- [`apps/console/README.md`](../../apps/console/README.md)
