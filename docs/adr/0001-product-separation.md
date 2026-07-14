# ADR-0001: AIOS como produto separado do portfólio

- **Status:** Aceito
- **Data:** 2026-07-13
- **Decisores:** Kleilson dos Santos

## Contexto

O portfólio (`kleilson-portfolio`) acumula disciplina enterprise (Git, ADRs, agents). Surgiu a necessidade de governança de IA no SDLC (agentes, policies, contexto, quality gates). Embutir isso no monorepo do portfólio misturaria dois produtos com objetivos distintos.

## Decisão

Criar o repositório **`ai-operating-system` (AIOS)** como produto independente.

```text
Portfolio (cliente)  →  consome  →  AIOS (plataforma)
```

Qualquer projeto futuro (financeiro, ERP, CRM) poderá consumir o mesmo AIOS.

## Consequências

### Positivas

- Portfólio permanece enxuto (mostrar pessoa + projetos)
- AIOS evolui como plataforma reutilizável
- Rastreabilidade e releases independentes
- Demonstra arquitetura de produto, não só UI de portfólio

### Negativas / trade-offs

- Dois repositórios para manter (governança espelhada de forma deliberada)
- Integração exige contratos claros (API/CLI) desde a Fase 1

## Alternativas rejeitadas

| Opção | Motivo |
| --- | --- |
| Pasta `packages/ai-governance` dentro do portfólio | Acopla ciclos de release e confunde missão do repo |
| Só prompts/`AGENTS.md` no portfólio | Não escala para multi-projeto nem policies/quality gates |

## Referências

- [`docs/VISION.md`](../VISION.md)
- [`docs/ROADMAP.md`](../ROADMAP.md)
