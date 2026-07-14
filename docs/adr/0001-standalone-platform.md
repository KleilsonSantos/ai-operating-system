# ADR-0001: AIOS como plataforma standalone de governança

- **Status:** Aceito
- **Data:** 2026-07-13
- **Decisores:** Kleilson dos Santos

## Contexto

Há demanda por governança de IA no SDLC (agentes, policies, contexto, quality gates). Empacotar isso apenas como prompts soltos ou como anexo de outro repositório não escala: falta orquestração, decision, quality gate e contratos estáveis.

## Decisão

Tratar o **`ai-operating-system` (AIOS)** como produto **único e independente**: plataforma de governança para IA aplicada ao desenvolvimento de software.

```text
Usuário / integradores  →  AIOS (plataforma)  →  engines + plugins
```

## Consequências

### Positivas

- Missão clara: governança de IA no SDLC
- Evolução e releases próprias
- Agentes como plugins; policies como fonte de verdade
- Demonstra arquitetura de plataforma, não só prompts

### Negativas / trade-offs

- Escopo maior que um kit de prompts
- Exige disciplina de ROADMAP por fases (evitar construir todos os engines de uma vez)

## Alternativas rejeitadas

| Opção | Motivo |
| --- | --- |
| Só prompts / `AGENTS.md` sem runtime | Não cobre orchestration, decision nem quality gate |
| Embutir o AIOS como pasta de outro monorepo | Acopla ciclos de release e confunde a missão do produto |

## Referências

- [`docs/FOUNDATION.md`](../FOUNDATION.md) — pedra base
- [`docs/VISION.md`](../VISION.md)
- [`docs/ROADMAP.md`](../ROADMAP.md)
