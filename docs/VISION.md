# Visão de Produto — AIOS

## Resposta curta

O AIOS é um **produto próprio**, não uma feature do portfólio.

| Produto | Objetivo |
| --- | --- |
| Portfólio | Mostrar quem você é · projetos · habilidades · interviews |
| **AIOS** | Gerenciar agentes · prompts · contexto · documentação · conhecimento · MCPs · workflows |

São problemas diferentes. Misturar os dois aumenta complexidade sem necessidade.

## Relação com outros projetos

```text
Portfolio ──────────┐
Sistema Financeiro ──┤
ERP ─────────────────┼──►  AIOS (plataforma)
CRM ─────────────────┘
```

O portfólio (e qualquer app futuro) é **cliente**. O AIOS é a **plataforma**.

## Posicionamento

Existem pedaços do problema em LangChain, CrewAI, AutoGen, OpenHands, Semantic Kernel, OpenAI Agents SDK.

Nenhum resolve exatamente o foco deste produto: **governança de IA aplicada à engenharia de software** (políticas, qualidade, decisão, contexto de repositório, agentes como plugins).

## Ideia central

- Você **não** chama agentes diretamente.
- Você envia uma intenção (ex.: *"Analise meu projeto."*).
- Intent → workflow → agentes (plugins) → quality gate → resposta.
- Regras longas viram **Policies** (uma vez); prompts do usuário ficam curtos.

## Evolução

| Fase | Meta |
| --- | --- |
| **1** | AIOS voltado ao portfólio — validar arquitetura e fluxos |
| **2** | Plataforma reutilizável para outros projetos pessoais |
| **3** | Independente do portfólio — multi-repo, multi-tool (ChatGPT, Claude, Gemini, Copilot) e provedores de contexto |

Detalhe operacional: [`ROADMAP.md`](./ROADMAP.md).
Arquitetura target: [`architecture/overview.md`](./architecture/overview.md) (próximos commits).
