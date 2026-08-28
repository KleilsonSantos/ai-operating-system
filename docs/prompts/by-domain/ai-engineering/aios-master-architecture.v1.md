---
id: prompt.ai-engineering.aios-master-architecture
title: AIOS master architecture — vision, principles, and evolution direction
domain: ai-engineering
purpose: Strategic architectural reference — vision from AI Engineering OS to Personal AI OS; hypotheses, routing model, governance stack; not implementation authorization
tags:
  - ai-engineering
  - architecture
  - vision
  - model-router
  - provider-agnostic
  - agents
  - mcp
  - governance
  - observability
  - evaluation
  - jarvis
version: 1
status: active
language: pt-BR
ai_ready: true
related_docs:
  - docs/FOUNDATION.md
  - docs/VISION.md
  - docs/architecture/overview.md
  - docs/architecture/harness-mapping.md
  - docs/ROADMAP.md
  - docs/adr/0001-standalone-platform.md
  - docs/adr/0009-multi-provider-ollama.md
  - docs/adr/0011-resource-aware-macos.md
  - docs/adr/0014-control-plane-companion.md
  - docs/adr/0025-model-router-context-budget.md
  - docs/adr/0029-ai-harness-mapping.md
related_prompts:
  - prompt.ai-engineering.aios-implementation-mission
  - prompt.ai-engineering.agent-runtime-evolution
created_at: 2026-08-28
updated_at: 2026-08-28
---

> **Catalog note:** Strategic **vision** asset — not product SSOT (canonical truth: [`docs/FOUNDATION.md`](../../../FOUNDATION.md) · ADRs · code). Pair with [`prompt.ai-engineering.aios-implementation-mission`](./aios-implementation-mission.v1.md) for operational audit → gap → plan. Shipped reality may lag this document; always verify against repo + ADRs before implementing. **Not** authorization to build everything described here.

# AIOS — Master Architecture

AI Engineering Operating System → Personal AI Operating System

> **Documento de referência arquitetural.**
>
> Este arquivo define a visão, princípios, hipóteses, critérios de decisão e direção de evolução do AIOS.
> **Não é autorização para implementar tudo descrito aqui.**
>
> Antes de qualquer implementação, o agente deve auditar o repositório atual e verificar o que já existe.

## 1. Contexto

O AIOS (AI Operating System) é uma plataforma voltada à criação de uma camada de orquestração, governança, contexto, automação e avaliação de IA aplicada ao desenvolvimento de software.

A visão é evoluir progressivamente de:

```text
AI Assistant
    ↓
AI Agent
    ↓
Multi-Agent Platform
    ↓
AI Engineering Operating System
    ↓
Personal AI Operating System
    ↓
Jarvis
```

O objetivo não é construir simplesmente outro chatbot, IDE ou wrapper de LLM.

O objetivo é criar uma camada capaz de coordenar:

```text
Intent
Context
Policy
Models
Providers
Agents
Tools
MCP
Memory
Knowledge / RAG
Execution
Quality Gates
Observability
Evaluation
Governance
```

## 2. Tese arquitetural

A hipótese central do AIOS é:

> Uma camada governada de orquestração de IA, capaz de selecionar modelos, agentes e ferramentas de acordo com contexto, custo, privacidade, qualidade e complexidade, pode produzir melhores resultados de engenharia do que o uso não orquestrado de assistentes de IA.

Essa hipótese deve ser validada empiricamente.

O projeto não deve afirmar que AIOS aumenta produtividade, reduz custo ou melhora qualidade sem evidências.

## 3. Princípio fundamental

A LLM não deve ser o centro da arquitetura.

O AIOS deve ser o centro.

A LLM deve ser tratada como um recurso intercambiável.

```text
User
  ↓
AIOS
  ↓
Intent
  ↓
Policy
  ↓
Context
  ↓
Model / Agent / Tool Selection
  ↓
Execution
  ↓
Validation
  ↓
Quality Gate
  ↓
Result
```

## 4. Princípios arquiteturais

O AIOS deve buscar:

```text
Provider Agnostic
Model Agnostic
Tool Agnostic
Agent Agnostic
Environment Agnostic
```

Não acoplar regras de negócio a um provider específico.

Não assumir que um único modelo é melhor para todas as tarefas.

Não transformar o Cursor em dependência do núcleo.

Não colocar regras de governança dentro dos adapters de providers.

## 5. Diferencial estratégico

O AIOS não deve tentar competir diretamente com:

- Cursor;
- GitHub Copilot;
- Claude Code;
- Codex;
- Windsurf;
- outras IDEs ou coding agents.

O AIOS deve atuar como uma camada superior de:

- orchestration;
- governance;
- context;
- agents;
- model routing;
- tools;
- quality;
- observability;
- evaluation.

Conceitualmente:

```text
IDE / Coding Agent
        ↓
      AIOS
        ↓
Governance / Orchestration / Intelligence
        ↓
Models / Agents / Tools
```

O Cursor pode ser uma interface importante para o AIOS, mas não deve ser uma dependência arquitetural do núcleo.

## 6. Diferencial pretendido

O diferencial não deve ser simplesmente:

- suportar várias LLMs;
- possuir vários agentes;
- possuir MCP;
- possuir RAG;
- possuir memória.

Essas capacidades existem isoladamente no ecossistema.

O diferencial pretendido é a combinação:

```text
Intent
+
Context
+
Policy
+
Model Selection
+
Agent Selection
+
Tool Selection
+
Governance
+
Quality Gates
+
Observability
+
Evaluation
```

orientada ao Software Development Lifecycle.

## 7. Model Router

O AIOS deve possuir uma camada denominada:

```text
AIOS Model Router
```

Responsabilidade:

Receber uma tarefa e selecionar o provider/modelo mais adequado.

Fluxo:

```text
Task
 ↓
Classification
 ↓
Complexity
 ↓
Privacy
 ↓
Cost Constraint
 ↓
Latency Requirement
 ↓
Model Capabilities
 ↓
Provider Availability
 ↓
Historical Performance
 ↓
Selected Model
 ↓
Execution
 ↓
Metrics
```

## 8. Classificação de tarefas

Categorias mínimas:

```text
SIMPLE
MEDIUM
COMPLEX
AGENTIC
CRITICAL
```

**SIMPLE**

- resumo;
- classificação;
- transformação simples;
- pequenas consultas;
- explicação de código.

**MEDIUM**

- geração de testes;
- refatoração simples;
- análise de classe;
- documentação.

**COMPLEX**

- análise arquitetural;
- refatoração ampla;
- debugging complexo;
- análise de múltiplos módulos.

**AGENTIC**

- modificar múltiplos arquivos;
- executar comandos;
- executar testes;
- corrigir erros;
- iterar;
- criar PR;
- trabalhar com ferramentas.

**CRITICAL**

- operações destrutivas;
- produção;
- infraestrutura;
- banco de dados;
- segurança;
- operações irreversíveis.

## 9. Hierarquia de modelos

O sistema deve permitir:

```text
LOCAL
  ↓
FREE / LOW COST
  ↓
STANDARD
  ↓
PREMIUM
  ↓
SPECIALIZED
```

A seleção deve ser dinâmica.

Não codificar nomes de modelos diretamente na lógica de negócio.

## 10. Local AI

O ambiente principal considerado possui aproximadamente:

- MacBook Pro;
- 16 GB RAM;
- 250 GB de armazenamento.

Não assumir capacidade para modelos locais grandes.

Evitar modelos de 30B+ como padrão.

O objetivo do modelo local é:

- tarefas simples;
- tarefas privadas;
- tarefas offline;
- classificação;
- pequenas transformações;
- fallback;
- redução de custo.

O modelo local não precisa substituir modelos premium.

## 11. Ollama

Ollama deve ser tratado como provider local.

```text
AIOS
 ↓
Provider Interface
 ↓
Ollama Provider
 ↓
Local Model
```

O núcleo não deve depender diretamente da API do Ollama.

A arquitetura deve permitir:

```text
Provider
 ├── OpenAI
 ├── Anthropic
 ├── Google
 ├── Ollama
 └── Future Providers
```

## 12. Cursor

O Cursor Pro pode continuar sendo o principal ambiente de desenvolvimento.

Arquitetura desejada:

```text
Developer
   ↓
Cursor
   ↓
AIOS MCP / Bridge
   ↓
AIOS
   ↓
Model Router
   ↓
Provider
   ↓
Model
```

O objetivo é complementar o Cursor, não substituí-lo.

## 13. MCP

MCP deve funcionar como camada de integração entre AIOS e ferramentas.

Possíveis ferramentas:

- GitHub;
- filesystem;
- terminal;
- Docker;
- databases;
- Supabase;
- n8n;
- browser;
- CI/CD;
- observability;
- knowledge base;
- RAG;
- memory.

```text
AIOS
 ↓
MCP
 ↓
Tools
```

O AIOS deve controlar políticas e permissões antes da execução.

## 14. Agent Orchestration

O AIOS deve delegar tarefas para agentes especializados.

Exemplo:

```text
User
 ↓
Intent
 ↓
Complexity
 ↓
Context
 ↓
Model Selection
 ↓
Agent Selection
 ↓
Tools
 ↓
Execution
 ↓
Quality Gates
 ↓
Result
```

Agentes devem ser extensíveis e, quando possível, tratados como plugins/capabilities.

## 15. Agentic Software Development

Fluxo desejado:

```text
Issue
 ↓
Planning
 ↓
Context Retrieval
 ↓
Implementation
 ↓
Tests
 ↓
Build
 ↓
Error Detection
 ↓
Fix
 ↓
Tests Again
 ↓
Review
 ↓
Quality Gate
 ↓
PR
```

Iteração deve ocorrer somente quando permitida pelas políticas.

## 16. Quality Gates

Gerar código não significa sucesso.

O AIOS deve validar:

- build;
- testes;
- cobertura;
- lint;
- segurança;
- dependências;
- arquitetura;
- complexidade;
- regressões;
- documentação.

```text
Agent Result
 ↓
Quality Gate
 ├── BUILD
 ├── TEST
 ├── SECURITY
 ├── ARCHITECTURE
 └── DOCUMENTATION
 ↓
PASS / FAIL
```

## 17. Memory

A memória deve possuir níveis distintos.

**Short-term**

Contexto da tarefa atual.

**Project memory**

- arquitetura;
- decisões;
- convenções;
- padrões;
- regras;
- dependências.

**Long-term**

Informações persistentes relevantes ao usuário/ecossistema.

Memória não deve ser apenas um histórico gigantesco.

Deve existir estratégia de:

- retenção;
- relevância;
- atualização;
- expiração;
- segurança;
- privacidade.

## 18. Knowledge / RAG

Fontes potenciais:

- código;
- README;
- ADRs;
- documentação;
- GitHub;
- Notion;
- arquivos;
- banco de dados;
- conhecimento operacional.

```text
Query
 ↓
Retrieval
 ↓
Relevant Context
 ↓
Model
 ↓
Answer / Action
```

RAG deve ser desacoplado do provider.

## 19. Privacy-aware routing

Exemplo:

```text
Highly Sensitive
    ↓
LOCAL
Internal / Controlled
    ↓
Trusted Provider
Public
    ↓
Any Suitable Provider
```

Políticas de privacidade devem poder ser definidas por:

- projeto;
- ferramenta;
- tipo de informação;
- operação.

## 20. Cost-aware routing

Registrar:

- provider;
- model;
- input tokens;
- output tokens;
- estimated cost;
- latency;
- task;
- success;
- quality;
- retries.

O sistema deve poder responder:

```text
Qual modelo é mais eficiente para esta tarefa?
```

e:

```text
Qual provider possui melhor relação
custo × qualidade × latência?
```

## 21. Model Intelligence

O router não deve evoluir para apenas um conjunto de if/else.

Objetivo futuro:

```text
Task Requirements
 ↓
Model Capabilities
 ↓
Cost
 ↓
Latency
 ↓
Privacy
 ↓
Historical Performance
 ↓
Availability
 ↓
Model Selection
```

Quando houver dados suficientes, usar histórico de desempenho.

Exemplo:

```text
Java Refactoring
Model A
Quality: 94
Cost: 0.08
Latency: 12s
Model B
Quality: 91
Cost: 0.05
Latency: 9s
Model C
Quality: 84
Cost: 0
Latency: 5s
```

O router poderá aprender que tarefas diferentes possuem modelos diferentes mais eficientes.

## 22. Observability

O AIOS deve observar:

- execução;
- agent;
- model;
- provider;
- tokens;
- custo;
- latência;
- ferramentas;
- retries;
- falhas;
- qualidade;
- intervenção humana.

## 23. Métricas de produtividade

Medir:

- tempo da tarefa;
- tempo de implementação;
- tempo de debugging;
- iterações;
- alterações;
- testes criados;
- cobertura;
- bugs encontrados;
- bugs introduzidos;
- chamadas ao modelo;
- tokens;
- custo;
- latência;
- taxa de sucesso;
- intervenção humana.

Não usar linhas de código como métrica principal de produtividade.

## 24. AIOS como experimento

O próprio desenvolvimento do AIOS deve servir como ambiente de experimentação.

```text
AIOS
 ↓
Development
 ↓
Observation
 ↓
Metrics
 ↓
Feedback
 ↓
Architecture Evolution
```

Sempre que apropriado, utilizar o AIOS para desenvolver e avaliar o próprio AIOS.

Ciclo:

```text
Build
 ↓
Measure
 ↓
Learn
 ↓
Improve
 ↓
Measure Again
```

## 25. Benchmark

Criar metodologia comparativa:

```text
A — Developer Only
B — Developer + Cursor
C — Developer + Cursor + AIOS
D — Developer + Cursor + AIOS + Local Model
```

Categorias:

- bug fixing;
- feature development;
- refactoring;
- testing;
- documentation;
- architecture analysis;
- security;
- code review.

Métricas:

```text
Time to Completion
Cost
Quality
Defect Rate
Test Coverage
Human Intervention
Latency
Iterations
```

Resultados positivos, neutros ou negativos devem ser registrados honestamente.

## 26. Hipótese de valor

O AIOS não deve assumir:

> “Mais agentes = mais produtividade.”

Nem:

> “Mais modelos = melhor resultado.”

Nem:

> “Mais automação = melhor engenharia.”

Toda nova capability deve ser avaliada pelo valor que produz.

## 27. Evitar Feature Accumulation

Antes de qualquer nova capability, responder:

1. Qual problema resolve?
2. Quem precisa dela?
3. O que já existe?
4. Podemos reutilizar um componente?
5. Qual o custo de manutenção?
6. Como será testada?
7. Como será observada?
8. Como será medida?
9. Ela aumenta o valor do AIOS?
10. Existe solução mais simples?

Uma feature não deve existir apenas porque é tecnicamente interessante.

## 28. Regra de evolução

Priorizar:

```text
VALUE
  >
EVIDENCE
  >
SIMPLICITY
  >
EXTENSIBILITY
  >
FEATURES
```

Não adicionar complexidade sem justificativa.

## 29. Compatibilidade com a arquitetura existente

Componentes que devem receber atenção durante auditoria:

```text
engines/provider
engines/provider/router
engines/provider/resilience
apps/mcp
Cursor Chat Bridge
memory
knowledge
agents
governance
quality gates
observability
```

Não assumir que esses componentes estão ausentes.

## 30. Visão Jarvis

A visão final:

```text
                    USER
                      │
                      ▼
                 ┌─────────┐
                 │  AIOS   │
                 │ JARVIS  │
                 └────┬────┘
                      │
          ┌───────────┼────────────┐
          ▼           ▼            ▼
       MEMORY      KNOWLEDGE     TOOLS
          │           │            │
          │          RAG           │
          │           │            │
          └───────────┼────────────┘
                      │
                 MODEL ROUTER
                      │
          ┌───────────┼────────────┐
          ▼           ▼            ▼
        LOCAL        FREE        PREMIUM
          │           │            │
        Ollama      APIs      Premium Models
                      │
                      ▼
                    AGENT
                      │
                      ▼
                  EXECUTION
                      │
                      ▼
                 QUALITY GATE
                      │
                      ▼
                   RESULT
```

“Jarvis” representa uma visão de longo prazo, não o escopo imediato.

A prioridade é construir um núcleo sólido, mensurável, governado e extensível.

## 31. Regra de ouro

O AIOS deve conseguir responder:

```text
Por que esta decisão foi tomada?
Por que este modelo foi escolhido?
Por que este agente foi executado?
Por que esta ferramenta foi utilizada?
Quanto custou?
Quanto tempo levou?
Qual foi a qualidade?
Houve intervenção humana?
O resultado foi melhor?
Temos evidência?
```

Essas perguntas devem orientar a evolução do sistema.
