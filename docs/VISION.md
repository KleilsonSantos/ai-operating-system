# Visão de Produto — AIOS

> Resumo operacional. **Pedra base:** [`FOUNDATION.md`](./FOUNDATION.md).

## Resposta curta

O AIOS é uma **plataforma de governança para IA aplicada ao desenvolvimento de software**.

## Objetivo

```text
Gerenciar agentes · prompts · contexto · documentação · conhecimento
Orquestrar MCPs · executar workflows
```

## Posicionamento

Existem pedaços do problema em LangChain, CrewAI, AutoGen, OpenHands, Semantic Kernel, OpenAI Agents SDK.

O AIOS foca no que falta como produto único: **policies, quality gates, decision, contexto de repositório e agentes como plugins** — voltado à engenharia de software.

## Ideia central

- Você **não** chama agentes diretamente.
- Você envia uma intenção (ex.: *"Analise meu projeto."*).
- Intent → workflow → agentes (plugins) → quality gate → resposta.
- Regras longas viram **Policies** (uma vez); prompts do usuário ficam curtos.

## Evolução

| Fase | Meta |
| --- | --- |
| **1** | Núcleo — intent, policy, context, orchestration, plugins, quality gate |
| **2** | Multi-repositório · Knowledge Graph · memory |
| **3** | Multi-tool (ChatGPT, Claude, Gemini, Copilot) · MCP · UI de governança |

Detalhe: [`ROADMAP.md`](./ROADMAP.md) · [`architecture/overview.md`](./architecture/overview.md) · [ADR-0001](./adr/0001-standalone-platform.md).
