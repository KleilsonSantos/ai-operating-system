# FOUNDATION — Pedra base do AIOS

> **Fonte canônica de origem** deste produto.  
> Resumos operacionais: [`VISION.md`](./VISION.md) · [`ROADMAP.md`](./ROADMAP.md) · [`architecture/overview.md`](./architecture/overview.md) · [ADR-0001](./adr/0001-standalone-platform.md).  
> Em conflito entre resumo e este arquivo, **este documento vence** até nova ADR explicitamente alterar a decisão.

## Language (canonical)

**Product documentation is written in US English** ([ADR-0018](./adr/0018-documentation-language.md), guide: [`documentation-language.md`](./guides/documentation-language.md)).

References: [Google developer docs — global audience](https://developers.google.com/style/translation) · [Kubernetes style guide](https://kubernetes.io/docs/contribute/style/style-guide/) · [Docker STYLE.md](https://github.com/docker/docs/blob/main/STYLE.md).

This FOUNDATION body is still largely Portuguese (legacy). New edits and sibling docs must follow US English; migrate sections when touched. Chat with the product owner may remain Portuguese — that is not product documentation.

---

# O que é o AIOS

O **AI Operating System (AIOS)** é um produto próprio: uma **plataforma de governança para IA aplicada ao desenvolvimento de software**.

Não é um conjunto de prompts. Não é um wrapper de um único LLM. É o sistema que gerencia como a inteligência artificial opera no ciclo de engenharia.

## Objetivo

```text
Gerenciar agentes.

Gerenciar prompts.

Gerenciar contexto.

Gerenciar documentação.

Gerenciar conhecimento.

Orquestrar MCPs.

Executar workflows.
```

---

# Posicionamento

Hoje existem projetos como:

- LangChain
- CrewAI
- AutoGen
- OpenHands
- Semantic Kernel
- OpenAI Agents SDK

Todos fazem uma parte disso.

Nenhum resolve exatamente o problema que o AIOS cobre: **governança de IA voltada para engenharia de software** — políticas, qualidade, decisão, contexto de repositório e agentes como plugins.

---

# Arquitetura

```text
AIOS

├── ai-core
│
├── context-engine
│
├── policy-engine
│
├── workflow-engine
│
├── orchestration-engine
│
├── prompt-engine
│
├── knowledge-engine
│
├── memory-engine
│
├── documentation-engine
│
├── governance-engine
│
├── quality-engine
│
├── appsec-engine
│
├── architecture-engine
│
├── repository-engine
│
├── integrations
│
└── ui
```

Os agentes passam a ser apenas **plugins**.

---

# Fluxo principal

Os agentes deixam de conversar com você.

Eles conversam entre si.

```text
Usuário

↓

AIOS

↓

Intent Engine

↓

Workflow Engine

↓

Architecture Agent

↓

AppSec Agent

↓

Documentation Agent

↓

QA Agent

↓

Resposta Final
```

Você nunca chama um agente diretamente.

---

# Intent automática

Hoje você escreve:

> Analise meu projeto.

O AIOS responde internamente:

```text
Intent

↓

Projeto

↓

Código

↓

Backend

↓

Spring Boot

↓

Java

↓

Arquitetura

↓

Acionar

Architecture

↓

Security

↓

Performance

↓

Docs

↓

QA
```

Tudo automático.

---

# Knowledge Graph

Em vez de apenas arquivos, o AIOS cria relações:

```text
Projeto

↓

Arquitetura

↓

Microsserviço

↓

API

↓

Banco

↓

Docker

↓

Observabilidade

↓

Segurança
```

Isso melhora a recuperação de contexto.

---

# Decision Engine

```text
Esse agente realmente precisa participar?

↓

Não

↓

Não execute.
```

---

# Quality Gate

Antes da resposta sair:

```text
Arquitetura OK

↓

Segurança OK

↓

Documentação OK

↓

Referências OK

↓

Consistência OK

↓

Enviar resposta
```

---

# Policy Engine

Você define as regras **uma vez**.

Exemplo:

```text
Nunca usar biblioteca abandonada.

Sempre consultar documentação oficial.

Sempre indicar trade-offs.

Sempre evitar overengineering.

Sempre justificar decisões.
```

Nunca mais precisa reescrevê-las em cada prompt.

---

# Policies no lugar de prompts longos

Hoje:

```text
Analise meu projeto

seguindo boas práticas

sem alucinação

sem redundância

com documentação oficial...
```

No AIOS:

```text
Analise meu projeto.
```

Porque essas regras já estão registradas como políticas da plataforma.

---

# Evolução em fases

* **Fase 1:** núcleo do AIOS — intent, policy, context, orchestration, plugins e quality gate — validando arquitetura e fluxos.
* **Fase 2:** plataforma reutilizável multi-repositório, com Knowledge Graph e memória de projeto.
* **Fase 3:** independência operacional completa — multi-tool (ChatGPT, Claude, Gemini, GitHub Copilot etc.), provedores de contexto, integrations/MCP e UI de governança.

O AIOS é único: uma plataforma de governança de IA para o SDLC — arquitetura, automação, políticas e qualidade compondo o produto.
