# ADR-0014: AIOS como control plane · Companion como experiência separada

- **Status:** Aceito
- **Data:** 2026-07-16
- **Decisores:** Kleilson dos Santos

## Contexto

A visão “Jarvis Dev” (voz, estado vivo do ambiente, abrir IDE/Docker) é maior que a missão atual do AIOS: **governança de IA no SDLC**. Misturar os dois no mesmo produto/release gera:

- duplicidade de engines (memory/policy/knowledge);
- colisão com “não substituir IDE” (ROADMAP / FOUNDATION);
- pressão Resource-Aware (watchers + voz + containers no Mac 16GB);
- ciclos de release acoplados sem necessidade.

Padrões de indústria relevantes: **control plane vs data/execution plane** (Hashicorp Well-Architected e equivalentes); **MCP host ↔ múltiplos servers** ([arquitetura oficial MCP](https://modelcontextprotocol.io/docs/learn/architecture)); fronteira de repo alinhada a acoplamento/release (prática monorepo/polyrepo híbrida).

## Decisão

1. **AIOS (`ai-operating-system`)** permanece o **control plane**: policies, intent, context on-demand, memory/KG, prompt brief, governance/docs audit, quality, MCP `aios_*`, console de governança.
2. **Companion / experiência cognitiva** (voz, Conversation Manager, watchers IDE/Docker/Git, UX “Jarvis”) é um **produto cliente** — consome AIOS via contratos estáveis (`@aios/pipeline`, `@aios/mcp`, CLI). **Não** reimplementa Policy/Memory/Knowledge/Prompt.
3. **Curto prazo:** evoluções de *Operational State* / eventos leves que fortalecem o control plane podem viver no monorepo AIOS (`engines/` / `apps/`), sem voz e sem controlar a IDE.
4. **Médio prazo:** quando a experiência Companion tiver lifecycle próprio (voz, watchers, automação de desktop), criar **repositório separado** (nome a definir: ex. `aios-companion`) que fala com AIOS — **não** embutir AIOS como pasta noutro monorepo (reafirma ADR-0001).
5. Integrações externas (GitHub, filesystem, etc.) preferem **MCP mesh** no host Companion ou servers dedicados — AIOS não precisa absorver todas as tools.

```text
Companion (UX / events / voice)
        │  MCP + pipeline contract
        ▼
AIOS control plane (governança)
        │
        ▼
Capabilities / outros MCP servers (IDE, Git, …)
```

## Consequências

### Positivas

- Missão AIOS clara e estável (ADR-0001)
- Escalabilidade: companion escala/release independente
- Agilidade: AIOS continua a entregar governança sem bloquear UX
- Desempenho / Resource-Aware: menos processos no núcleo
- Zero duplicidade de engines

### Negativas / trade-offs

- Dois artefatos a coordenar quando o companion existir
- Exige disciplina de contrato (`contractVersion`, tools versionadas)

## Alternativas rejeitadas

| Opção | Motivo |
| --- | --- |
| Fundir Jarvis + AIOS num único produto monolítico | Confunde missão; viola fora-de-escopo IDE; Resource-Aware |
| Embutir AIOS como pasta do companion | Rejeitado por ADR-0001 |
| Duplicar Memory/Policy no companion | Redundância e drift de verdade |
| Só prompts longos no Cursor sem plataforma | Já rejeitado na génese do AIOS |

## Referências

- [ADR-0001](./0001-standalone-platform.md)
- [ADR-0011](./0011-resource-aware-macos.md)
- [FOUNDATION](../FOUNDATION.md)
- [MCP Architecture](https://modelcontextprotocol.io/docs/learn/architecture)
- Guia: [`docs/guides/control-plane-companion.md`](../guides/control-plane-companion.md)
