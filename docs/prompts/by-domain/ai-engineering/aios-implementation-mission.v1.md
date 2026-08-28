---
id: prompt.ai-engineering.aios-implementation-mission
title: AIOS implementation mission — audit, gap analysis, incremental plan
domain: ai-engineering
purpose: Operational mission for coding agents — audit repo vs architecture spec, report gaps, propose minimal evolution; no code before approval
tags:
  - ai-engineering
  - audit
  - gap-analysis
  - implementation-plan
  - model-router
  - provider
  - mcp
  - agents
  - governance
  - observability
version: 1
status: active
language: pt-BR
ai_ready: true
related_docs:
  - docs/FOUNDATION.md
  - docs/architecture/overview.md
  - docs/architecture/system-guide.md
  - docs/architecture/harness-mapping.md
  - docs/ROADMAP.md
  - docs/audits/agent-runtime-evolution-analysis-2026-08.md
  - docs/adr/0001-standalone-platform.md
  - docs/adr/0003-pipeline-integration-contract.md
  - docs/adr/0009-multi-provider-ollama.md
  - docs/adr/0014-control-plane-companion.md
  - docs/adr/0024-execution-state-capability-registry.md
  - docs/adr/0025-model-router-context-budget.md
  - docs/adr/0029-ai-harness-mapping.md
  - docs/guides/cursor-chat-bridge.md
related_prompts:
  - prompt.ai-engineering.aios-master-architecture
  - prompt.ai-engineering.agent-runtime-evolution
  - prompt.ai-engineering.integral-e2e-evidence-audit
  - prompt.ai-engineering.audit-to-issue-generation
created_at: 2026-08-28
updated_at: 2026-08-28
---

> **Catalog note:** Operational companion to [`prompt.ai-engineering.aios-master-architecture`](./aios-master-architecture.v1.md) (strategic vision) and [`prompt.ai-engineering.agent-runtime-evolution`](./agent-runtime-evolution.v1.md). An accepted analysis already exists at [`docs/audits/agent-runtime-evolution-analysis-2026-08.md`](../../../audits/agent-runtime-evolution-analysis-2026-08.md); Phase 1 execution contract shipped as [ADR-0024](../../../adr/0024-execution-state-capability-registry.md). **PKB intake only** unless the owner authorizes a run (`ok` / `prossegue`). First output must be the 21-section report; **do not implement** before explicit approval.

# AIOS — Implementation Mission

Auditoria → Gap Analysis → Plano → Implementação Incremental

> **Este documento é operacional.**
>
> Ele deve ser usado pelo Cursor/Coding Agent depois que a arquitetura do AIOS
> estiver compreendida.
>
> **NÃO implemente tudo automaticamente.**
>
> A primeira missão é auditar o repositório atual, comparar com a especificação
> arquitetural e propor a menor evolução capaz de gerar valor real.

## 1. Papel do agente

Atue como:

- Principal Software Architect;
- Senior AI Engineer;
- Agentic Systems Engineer;
- Backend Engineer;
- DevOps Engineer;
- Security Engineer;
- AI Evaluation Engineer.

Priorize compreensão da arquitetura existente antes de alterar código.

## 2. Documentos de referência

Considere como referência arquitetural o arquivo:

```text
AIOS-MASTER-ARCHITECTURE.md
```

Este documento representa a visão estratégica.

Este arquivo representa a missão de implementação.

A ordem correta é:

```text
MASTER ARCHITECTURE
        ↓
REPOSITORY AUDIT
        ↓
CURRENT STATE
        ↓
GAP ANALYSIS
        ↓
TARGET ARCHITECTURE
        ↓
IMPLEMENTATION PLAN
        ↓
APPROVAL
        ↓
IMPLEMENTATION
        ↓
VALIDATION
        ↓
METRICS
```

## 3. Regra crítica

Antes de escrever código:

```text
NÃO IMPLEMENTE.
```

Primeiro:

1. Analise o repositório inteiro.
2. Identifique a arquitetura atual.
3. Identifique componentes existentes.
4. Identifique ADRs.
5. Identifique TODOs.
6. Identifique funcionalidades parcialmente implementadas.
7. Identifique duplicidades.
8. Identifique riscos.
9. Identifique gaps.
10. Proponha a menor evolução necessária.

Somente depois de apresentar o diagnóstico e obter aprovação explícita deverá iniciar implementação.

## 4. Auditoria obrigatória

Investigue pelo menos:

```text
apps/
engines/
agents/
governance/
quality/
memory/
knowledge/
mcp/
plugins/
observability/
providers/
router/
resilience/
Cursor Bridge
```

Caso os nomes reais sejam diferentes, mapeie-os para os conceitos equivalentes.

Não crie diretórios ou componentes apenas porque foram citados neste documento.

## 5. Perguntas obrigatórias

Responder:

1. O que já existe?
2. Qual é a arquitetura atual?
3. Qual é o fluxo de execução atual?
4. O que já resolve Model Routing?
5. O que já resolve Provider Abstraction?
6. Quais providers estão implementados?
7. Como Ollama está integrado?
8. Como MCP está integrado?
9. Como Cursor está integrado?
10. Como Memory está implementada?
11. Como Knowledge/RAG está implementado?
12. Como Agents estão implementados?
13. Como Governance está implementada?
14. Como Quality Gates estão implementados?
15. Como Observability está implementada?
16. Como métricas de provider/model são registradas?
17. Existem mecanismos de cost tracking?
18. Existem mecanismos de latency tracking?
19. Existem mecanismos de quality evaluation?
20. Quais ADRs suportam essas decisões?
21. Quais componentes devem permanecer inalterados?
22. Existem duplicidades?
23. Existem acoplamentos inadequados?
24. Existem riscos de segurança?
25. Existem problemas de observabilidade?
26. Qual é o menor caminho para um Model Router funcional?
27. O que já está pronto e não deve ser recriado?

## 6. Entregável 1 — Current State

Produza um relatório:

```text
CURRENT STATE
```

Incluindo:

- arquitetura atual;
- módulos;
- dependências;
- fluxo principal;
- providers;
- router;
- agents;
- MCP;
- memory;
- knowledge;
- governance;
- quality;
- observability;
- integração com Cursor.

Sempre referenciar arquivos reais do repositório.

## 7. Entregável 2 — Architecture Map

Criar um mapa textual semelhante a:

```text
User
 ↓
[Current Entry Point]
 ↓
[Intent]
 ↓
[Orchestrator]
 ↓
[Agent]
 ↓
[Provider]
 ↓
[Tools]
 ↓
[Validation]
 ↓
[Result]
```

Substituir os nomes genéricos pelos componentes reais encontrados no projeto.

Se útil, produzir também Mermaid.

## 8. Entregável 3 — Gap Analysis

Criar:

| Capability                | Existing | Partial | Missing | Evidence | Recommendation |
| ------------------------- | -------- | ------- | ------- | -------- | -------------- |
| Provider Abstraction      |          |         |         |          |                |
| Model Router              |          |         |         |          |                |
| Ollama                    |          |         |         |          |                |
| Model Capability Registry |          |         |         |          |                |
| Cost Tracking             |          |         |         |          |                |
| Latency Tracking          |          |         |         |          |                |
| Quality Tracking          |          |         |         |          |                |
| MCP                       |          |         |         |          |                |
| Agent Orchestration       |          |         |         |          |                |
| Memory                    |          |         |         |          |                |
| RAG                       |          |         |         |          |                |
| Governance                |          |         |         |          |                |
| Quality Gates             |          |         |         |          |                |
| Observability             |          |         |         |          |                |
| Cursor Integration        |          |         |         |          |                |
| Benchmark                 |          |         |         |          |                |

“Existing” só deve ser usado quando houver evidência no código/documentação.

## 9. Entregável 4 — Architectural Risks

Identifique:

- acoplamento de provider;
- acoplamento de model;
- duplicação;
- interfaces frágeis;
- dependências circulares;
- ausência de abstração;
- ausência de testes;
- falta de observabilidade;
- riscos de segurança;
- operações sem autorização;
- armazenamento inadequado de dados;
- excesso de complexidade;
- componentes sem responsabilidade clara.

Classificar:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

## 10. Entregável 5 — Target Architecture

Depois da auditoria, propor uma arquitetura futura mínima.

Não propor uma arquitetura idealizada que ignore o código existente.

Mostrar:

```text
CURRENT
   ↓
TARGET
```

Explicar:

- o que muda;
- por que muda;
- o que permanece;
- quais componentes serão reutilizados;
- quais componentes precisam ser criados;
- quais componentes devem ser removidos/refatorados.

## 11. Primeiro objetivo funcional

O primeiro objetivo NÃO é construir o Jarvis completo.

O primeiro objetivo é demonstrar:

```text
Task
 ↓
Classification
 ↓
Complexity
 ↓
Privacy
 ↓
Cost
 ↓
Model Capabilities
 ↓
Provider Availability
 ↓
Model Selection
 ↓
Execution
 ↓
Metrics
 ↓
Validation
```

## 12. Model Router mínimo

Caso o router ainda não exista ou seja insuficiente, propor uma abstração mínima.

Conceitualmente:

```text
Task
 ↓
Task Profile
 ↓
Candidate Models
 ↓
Policy Filter
 ↓
Scoring
 ↓
Selected Model
```

O scoring pode inicialmente utilizar regras determinísticas.

Não criar machine learning desnecessariamente.

## 13. Model Capability Registry

Caso necessário, criar uma representação de capabilities.

Exemplo conceitual:

```text
ModelCapability:
- coding
- reasoning
- contextWindow
- toolCalling
- structuredOutput
- vision
- multilingual
- privacyLevel
- cost
- latency
- availability
```

Não assumir que todos os providers possuem todas as capabilities.

## 14. Cost / Latency / Quality

Registrar, quando possível:

```text
provider
model
task
inputTokens
outputTokens
estimatedCost
latency
success
quality
retries
```

Evitar criar um sistema de billing complexo na primeira versão.

A prioridade é observabilidade suficiente para experimentação.

## 15. Ollama

Se houver integração existente:

- reutilizar;
- corrigir;
- abstrair;
- testar.

Se não houver:

implementar somente após avaliar a Provider Interface existente.

Não criar um caminho paralelo específico para Ollama.

## 16. Cursor

O Cursor deve permanecer uma camada de interface/desenvolvimento.

Não transformar componentes internos do AIOS em dependências do Cursor.

Preferir:

```text
Cursor
 ↓
MCP / Bridge
 ↓
AIOS
```

## 17. MCP

Antes de adicionar novas ferramentas:

1. catalogar MCPs existentes;
2. verificar permissões;
3. verificar autenticação;
4. verificar auditoria;
5. verificar política de execução;
6. verificar ferramentas destrutivas.

Operações críticas devem exigir autorização conforme a policy.

## 18. Agents

Não criar agentes simplesmente para aumentar a quantidade de agentes.

Para cada agente existente:

```text
Agent
 ├── Purpose
 ├── Inputs
 ├── Outputs
 ├── Tools
 ├── Model Requirements
 ├── Policies
 ├── Quality Criteria
 └── Failure Modes
```

Antes de criar um novo agente, verificar se um existente pode resolver o problema.

## 19. Quality Gates

Para operações de coding, considerar:

```text
Build
Test
Lint
Security
Architecture
Documentation
```

Não marcar execução como sucesso apenas porque o modelo respondeu.

## 20. Benchmark e Evaluation

Depois que houver um fluxo funcional, preparar uma estrutura para comparar:

```text
Developer Only
Developer + Cursor
Developer + Cursor + AIOS
Developer + Cursor + AIOS + Local Model
```

Categorias:

- bug fixing;
- feature;
- refactoring;
- testing;
- documentation;
- architecture;
- security;
- review.

Registrar:

```text
Time
Cost
Quality
Defects
Coverage
Human Intervention
Latency
Iterations
```

Não fabricar resultados.

## 21. Dogfooding

Sempre que apropriado, utilizar o próprio AIOS para trabalhar no AIOS.

Registrar:

```text
Task
 ↓
AIOS
 ↓
Execution
 ↓
Result
 ↓
Human Feedback
 ↓
Metrics
```

Usar essas experiências como evidência para evolução.

## 22. Anti-overengineering

Antes de implementar qualquer coisa, responder:

```text
Existe componente equivalente?
Podemos reutilizar?
Qual é o menor design?
Qual é o benefício?
Como será testado?
Como será medido?
```

Não introduzir:

- microserviços;
- event buses;
- bancos adicionais;
- filas;
- machine learning;
- vector databases;
- novos frameworks;

sem justificativa concreta baseada no estado atual.

## 23. Ordem de implementação recomendada

Depois da auditoria e aprovação:

**Fase 1 — Foundation Audit**

- mapear arquitetura;
- corrigir inconsistências;
- consolidar interfaces;
- atualizar ADRs quando necessário.

**Fase 2 — Provider Abstraction**

- consolidar provider contract;
- adapters;
- resilience.

**Fase 3 — Model Router**

- task profile;
- capability registry;
- policy;
- scoring;
- fallback.

**Fase 4 — Local Provider**

- Ollama;
- modelos pequenos;
- health check;
- fallback.

**Fase 5 — Metrics**

- tokens;
- cost;
- latency;
- execution;
- quality.

**Fase 6 — Agent Orchestration**

- agent registry;
- selection;
- execution;
- tool permissions.

**Fase 7 — MCP**

- tool discovery;
- authorization;
- execution;
- audit.

**Fase 8 — RAG + Memory**

- project context;
- retrieval;
- persistence;
- policies.

**Fase 9 — Evaluation**

- benchmark;
- experiments;
- reports.

**Fase 10 — Personal AI Layer**

Somente depois da maturidade do núcleo:

- personal assistant;
- broader automation;
- multimodal;
- voice;
- broader tools.

## 24. ADRs

Quando uma mudança alterar uma decisão arquitetural significativa:

1. identificar ADR existente;
2. verificar se continua válido;
3. atualizar ou criar novo ADR;
4. explicar trade-offs;
5. registrar alternativas rejeitadas.

Não modificar arquitetura importante sem documentação.

## 25. Testes

Toda implementação deve considerar:

- unit tests;
- integration tests;
- contract tests;
- provider tests;
- router tests;
- policy tests;
- agent tests;
- MCP/tool tests;
- failure/fallback tests.

O Model Router deve possuir testes determinísticos para as regras de seleção.

## 26. Segurança

Dar atenção especial a:

- secrets;
- credentials;
- filesystem;
- terminal;
- shell commands;
- database operations;
- GitHub write operations;
- production infrastructure;
- prompt injection;
- tool injection;
- data leakage;
- model output validation.

Operações destrutivas devem ser explicitamente governadas.

## 27. Critérios de sucesso da primeira evolução

A primeira evolução será considerada bem-sucedida quando o AIOS conseguir:

1. Receber uma tarefa.
2. Classificar a tarefa.
3. Avaliar complexidade.
4. Avaliar privacidade.
5. Consultar capabilities.
6. Avaliar custo.
7. Avaliar disponibilidade.
8. Selecionar provider/model.
9. Executar.
10. Registrar métricas.
11. Validar resultado.
12. Aplicar fallback quando necessário.

## 28. Exemplos de comportamento esperado

**Exemplo 1**

```text
"Resuma este arquivo."
```

Esperado:

```text
Complexity = SIMPLE
Cost = LOW
Privacy = INTERNAL
Latency = HIGH PRIORITY
→ Local/small model quando adequado
```

**Exemplo 2**

```text
"Analise a arquitetura completa e proponha uma refatoração."
```

Esperado:

```text
Complexity = COMPLEX
Reasoning = HIGH
Context = LARGE
Quality = HIGH
→ Capable premium/reasoning model
```

**Exemplo 3**

```text
"Implemente esta feature, rode testes e prepare um PR."
```

Esperado:

```text
Complexity = AGENTIC
Tools = REQUIRED
Coding = REQUIRED
Validation = REQUIRED
→ Agent + capable coding model + MCP + Quality Gates
```

## 29. Formato obrigatório do relatório inicial

A primeira resposta do agente deve conter exatamente estas seções:

```text
# AIOS CURRENT STATE
## 1. Executive Summary
## 2. Repository Architecture
## 3. Execution Flow
## 4. Existing Capabilities
## 5. Provider Architecture
## 6. Model Routing
## 7. Agents
## 8. MCP / Tools
## 9. Memory / Knowledge / RAG
## 10. Governance / Quality
## 11. Observability / Metrics
## 12. Cursor Integration
## 13. Architecture Risks
## 14. Gap Analysis
## 15. Recommended Target Architecture
## 16. Minimum Viable Evolution
## 17. Implementation Plan
## 18. Test Strategy
## 19. Security Considerations
## 20. Acceptance Criteria
## 21. Open Questions
```

Não iniciar implementação antes desse relatório.

## 30. Regra final

O objetivo NÃO é transformar o AIOS em um projeto gigantesco.

O objetivo é fazer o AIOS provar que consegue:

```text
UNDERSTAND
    ↓
CLASSIFY
    ↓
SELECT
    ↓
ORCHESTRATE
    ↓
EXECUTE
    ↓
VALIDATE
    ↓
MEASURE
    ↓
LEARN
```

A evolução para Jarvis somente deve ocorrer sobre um núcleo que demonstre valor real.

A prioridade é:

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
