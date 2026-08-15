---
id: prompt.ai-engineering.agent-runtime-evolution
title: Agent runtime, model routing, and execution governance
domain: ai-engineering
purpose: Analyze how to evolve AIOS toward a governed agent runtime without becoming a generic coding agent
tags:
  - agent-runtime
  - model-routing
  - execution-governance
  - skills
  - architecture
version: 1
status: active
language: pt-BR
ai_ready: true
related_docs:
  - docs/FOUNDATION.md
  - docs/adr/0001-standalone-platform.md
  - docs/adr/0003-pipeline-integration-contract.md
  - docs/adr/0024-execution-state-capability-registry.md
  - docs/audits/agent-runtime-evolution-analysis-2026-08.md
  - docs/architecture/system-guide.md
related_prompts:
  - prompt.ai-engineering.prompt-knowledge-base-proposal
created_at: 2026-08-15
updated_at: 2026-08-15
---

> **Catalog note:** An accepted analysis already exists at [`docs/audits/agent-runtime-evolution-analysis-2026-08.md`](../../../audits/agent-runtime-evolution-analysis-2026-08.md). Phase 1 shipped as [ADR-0024](../../../adr/0024-execution-state-capability-registry.md). Re-run this prompt only to refresh the analysis. Do not re-implement Phase 1 without a new gap. Wait for explicit authorization before any implementation.

# AIOS — Agent Runtime, Model Routing & Execution Governance Evolution

## ROLE

Atue como **Principal AI Architect + Agent Systems Engineer + Software Architecture Reviewer**.

Você deve evoluir o **AI Operating System (AIOS)** sem descaracterizar sua proposta central:

> AIOS é uma plataforma de governança para IA aplicada ao desenvolvimento de software.

Repositório principal:

`https://github.com/KleilsonSantos/ai-operating-system`

Referências arquiteturais externas para estudo:

- OpenClaude / Open Claude Code
- OpenClaw
- DeepSeek / awesome-deepseek-agent
- DeepSeek-Coder
- padrões modernos de coding agents, agent runtime, skills, MCP e model routing

**IMPORTANTE:** não copie código, prompts, estruturas ou implementações proprietárias. Extraia somente padrões arquiteturais, conceitos, contratos e boas práticas que possam ser reimplementados de forma independente dentro do AIOS.

---

# 1. OBJETIVO

Realizar uma análise arquitetural profunda do AIOS e identificar como evoluí-lo de uma plataforma baseada principalmente em:

`Agents + Rules + Policies + Context + Workflows`

para uma arquitetura mais madura:

`Governance + Agent Runtime + Skills + Tools + Context + Model Routing + Execution State + Evidence + Quality Gates`

A evolução deve preservar simplicidade, coerência e governança.

Não criar complexidade apenas para parecer mais sofisticado.

---

# 2. PRIMEIRO: AUDITAR O AIOS

Antes de alterar qualquer arquivo, inspecione:

- README.md
- AGENTS.md
- docs/
- engines/
- policies/
- scripts/
- .github/agents/
- .github/workflows/
- .cursor/
- .trae/
- testes
- package.json
- configurações relacionadas a MCP
- Context Engine
- agentes existentes
- workflows existentes
- quality gates
- task planning
- execution/promotion flow

Mapeie:

```text
Current AIOS
│
├── Governance
├── Policies
├── Agents
├── Context Engine
├── Skills
├── Tools
├── MCP
├── Workflows
├── Quality Gates
├── CI/CD
├── Memory / State
└── Model / Provider abstraction
```

Para cada componente determine:

- responsabilidade
- entrada
- saída
- dependências
- acoplamento
- estado
- autoridade
- pontos de extensão
- riscos
- duplicações
- lacunas

---

# 3. ESTUDAR PADRÕES EXTERNOS

Analise conceitualmente:

## OpenClaude / Open Claude Code

Investigue principalmente:

- agent loop
- tool execution
- provider abstraction
- model switching
- sessions
- hooks
- permissions
- MCP
- subagents
- task execution
- terminal-first workflow

Não reproduzir implementação.

Extraia somente padrões úteis para o AIOS.

---

## OpenClaw

Investigue principalmente:

- Agent Core
- Runtime
- Harness
- Tools
- Skills
- Plugins
- Sessions
- Resource discovery
- Context compaction
- Tool policies
- Model/provider routing
- lifecycle hooks
- workspace/project skills
- capability boundaries

Use como referência para avaliar se o AIOS deveria separar:

```text
Agent
Runtime
Tool
Skill
Policy
Provider
Session
State
```

---

## DeepSeek

Investigue:

- DeepSeek agent ecosystem
- DeepSeek-Coder
- awesome-deepseek-agent
- integrações com coding agents
- modelos rápidos vs modelos de raciocínio
- agentic coding
- MCP
- Agent Skills
- reasoning effort
- context window
- model routing
- multi-agent orchestration

Avalie especialmente o conceito:

```text
Fast Model
    ↓
Classification / Routing
    ↓
Worker Agents
    ↓
Strong Reasoning Model
    ↓
Validation / Arbitration
```

Não assuma que esse padrão deve ser adotado integralmente.

Determine onde ele realmente agrega valor ao AIOS.

---

# 4. NOVA VISÃO ARQUITETURAL

Avalie a possibilidade de evoluir para:

```text
                    ┌──────────────────────┐
                    │      AIOS CLI/API    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Task Orchestrator  │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
          Context Engine   Policy Engine   Model Router
                │              │              │
                └──────────────┼──────────────┘
                               ▼
                    ┌──────────────────────┐
                    │     Agent Runtime    │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
             Skills          Tools          MCP
                │              │              │
                └──────────────┼──────────────┘
                               ▼
                    ┌──────────────────────┐
                    │    Agent Execution   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Evidence / Artifacts │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Validation / Gates   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Decision / Promotion │
                    └──────────────────────┘
```

Essa arquitetura é uma hipótese.

Não implemente cegamente.

Valide primeiro contra a arquitetura existente.

---

# 5. AGENT RUNTIME

Avalie a criação de um núcleo conceitual:

```text
Agent Runtime
```

Responsável por:

- lifecycle
- execution loop
- task state
- tool invocation
- skill loading
- context assembly
- model selection
- permissions
- hooks
- retries
- cancellation
- observability
- evidence collection

O Runtime NÃO deve possuir regras de negócio específicas.

Ele deve executar políticas e contratos.

---

# 6. SKILLS

Evolua o conceito de Skill para uma unidade operacional reutilizável.

Modelo:

```text
Skill
├── metadata
├── purpose
├── prerequisites
├── allowed-tools
├── context-requirements
├── execution-steps
├── validation
└── failure-policy
```

Avalie:

```text
skills/
├── code-review/
├── security-review/
├── architecture-review/
├── testing/
├── documentation/
├── dependency-audit/
└── release/
```

Não criar skills redundantes com os agentes existentes.

Determine claramente:

```text
Agent = quem decide
Skill = como executar uma capacidade
Tool = mecanismo de ação
Policy = o que é permitido
```

---

# 7. MODEL ROUTER

Avalie a criação de uma abstração:

```text
Model Router
```

Responsável por selecionar o modelo adequado considerando:

- tipo da tarefa
- complexidade
- risco
- necessidade de reasoning
- contexto
- custo
- latência
- disponibilidade
- política do projeto

Exemplo:

```text
Simple task
    ↓
Fast model

Coding task
    ↓
Coding model

Architecture / Security / Critical decision
    ↓
Reasoning model

Final arbitration
    ↓
Strong reasoning model
```

Não acoplar o AIOS a DeepSeek, OpenAI, Anthropic ou qualquer fornecedor.

Usar:

```text
Provider
Model
Capability
Policy
Router
```

como abstrações independentes.

---

# 8. MULTI-AGENT ORCHESTRATION

Avalie um modelo de execução:

```text
Planner
   │
   ├── Worker A
   ├── Worker B
   ├── Worker C
   │
   ▼
Validator
   │
   ▼
Arbitrator
```

Workers podem atuar em paralelo quando:

- tarefas são independentes
- arquivos não entram em conflito
- contexto pode ser isolado
- política permite paralelismo

Implemente mecanismos conceituais para:

- task dependency graph
- execution locks
- conflict detection
- result aggregation
- retry
- failure isolation
- arbitration

Não criar multi-agent apenas por estética.

Use somente quando houver benefício mensurável.

---

# 9. CONTEXT ENGINE 2.0

O Context Engine atual deve ser preservado e evoluído.

Avalie:

```text
Repository Discovery
        ↓
Scope Detection
        ↓
Context Retrieval
        ↓
Relevance Ranking
        ↓
Policy Filtering
        ↓
Context Budgeting
        ↓
Prompt Assembly
```

O contexto deve considerar:

- tarefa
- agente
- skill
- arquivos relevantes
- regras
- políticas
- histórico
- evidências
- estado atual

Evitar:

```text
dump entire repository into context
```

Priorizar:

```text
minimum sufficient context
```

---

# 10. EXECUTION STATE

Avalie um modelo explícito:

```text
Task
 ↓
Run
 ↓
Step
 ↓
Tool Call
 ↓
Artifact
 ↓
Evidence
 ↓
Validation
 ↓
Decision
```

Cada execução deve poder responder:

- quem executou?
- qual modelo?
- qual skill?
- qual política?
- quais ferramentas?
- qual contexto?
- quais arquivos foram alterados?
- quais testes foram executados?
- quais evidências foram produzidas?
- qual gate foi aprovado/reprovado?
- por que a decisão foi tomada?

Isso deve aumentar a governança sem transformar o projeto em um sistema de auditoria excessivamente complexo.

---

# 11. HOOKS

Avalie lifecycle hooks:

```text
before-task
before-context
before-model
before-tool
after-tool
after-step
after-task
before-promotion
after-promotion
```

Use hooks para:

- policy enforcement
- observability
- security
- validation
- telemetry
- context management

Evitar hooks espalhados pelo código.

Criar um contrato centralizado.

---

# 12. GOVERNANCE CHAIN

O AIOS deve manter a governança como autoridade superior.

Proposta:

```text
Policy
  ↓
Capability
  ↓
Skill
  ↓
Agent
  ↓
Tool
  ↓
Execution
  ↓
Evidence
  ↓
Gate
  ↓
Decision
```

Nenhum Agent deve poder ultrapassar uma Policy.

Nenhuma Skill deve conceder permissões que a Policy não permita.

Nenhuma Tool deve executar ações fora de seu capability scope.

---

# 13. SECURITY MODEL

Avalie:

- tool allowlist
- capability-based permissions
- sandbox
- filesystem boundaries
- command execution policy
- network policy
- secret isolation
- model/provider isolation
- MCP server trust
- skill trust level
- human approval gates

Criar níveis como:

```text
READ_ONLY
SAFE_WRITE
CONTROLLED_EXECUTION
PRIVILEGED
HUMAN_APPROVAL_REQUIRED
```

Não permitir que o modelo determine sozinho seu próprio nível de privilégio.

---

# 14. OBSERVABILITY

Defina eventos estruturados:

```text
task.started
task.completed
task.failed

agent.started
agent.completed

model.selected
model.requested
model.completed

skill.loaded
skill.completed

tool.requested
tool.completed
tool.denied

policy.checked
policy.denied

gate.started
gate.passed
gate.failed

artifact.created
decision.created
```

Avalie compatibilidade futura com:

- OpenTelemetry
- logs estruturados
- métricas
- tracing
- custo por execução
- latência
- token usage
- failure rate

Não implementar observability excessiva na primeira etapa.

---

# 15. WORKFLOW EXISTENTE

Preserve o fluxo atual de governança:

```text
Issue
 ↓
Branch
 ↓
PR
 ↓
Validation
 ↓
Sandbox
 ↓
Promotion
 ↓
Main
```

Não substituir o workflow existente.

A nova arquitetura deve se integrar a ele.

O AIOS atualmente determina que o trabalho começa por Issue, segue para branch baseada em `sandbox`, PR para `sandbox` e posterior promoção para `main`. Preserve essa regra.

---

# 16. O QUE NÃO FAZER

NÃO:

- copiar OpenClaude
- copiar OpenClaw
- copiar DeepSeek
- transformar AIOS em outro coding agent genérico
- criar agentes desnecessários
- criar skills duplicadas
- criar abstrações sem consumidor real
- introduzir framework de multi-agent sem necessidade
- acoplar provider ao core
- transformar Policy em prompt
- transformar Skill em agente
- transformar Tool em regra de negócio
- introduzir dependências pesadas sem justificativa
- quebrar APIs existentes
- alterar workflow Git sem necessidade
- remover regras existentes apenas para simplificar
- implementar tudo de uma vez

---

# 17. MATRIZ DE DECISÃO

Para cada ideia identificada nos projetos externos, produza:

| Pattern         | Source                   | AIOS Gap | Benefit | Complexity | Risk | Recommendation     |
| --------------- | ------------------------ | -------- | ------- | ---------- | ---- | ------------------ |
| Agent Runtime   | OpenClaw                 | ?        | ?       | ?          | ?    | ADOPT/ADAPT/REJECT |
| Skills          | OpenClaw/OpenClaude      | ?        | ?       | ?          | ?    | ADOPT/ADAPT/REJECT |
| Provider Router | OpenClaude/DeepSeek      | ?        | ?       | ?          | ?    | ADOPT/ADAPT/REJECT |
| Model Routing   | DeepSeek                 | ?        | ?       | ?          | ?    | ADOPT/ADAPT/REJECT |
| Multi-Agent     | DeepSeek ecosystem       | ?        | ?       | ?          | ?    | ADOPT/ADAPT/REJECT |
| Session State   | OpenClaw/OpenClaude      | ?        | ?       | ?          | ?    | ADOPT/ADAPT/REJECT |
| Hooks           | OpenClaude/OpenClaw      | ?        | ?       | ?          | ?    | ADOPT/ADAPT/REJECT |
| Tool Policy     | OpenClaw                 | ?        | ?       | ?          | ?    | ADOPT/ADAPT/REJECT |
| Context Budget  | OpenClaw/DeepSeek agents | ?        | ?       | ?          | ?    | ADOPT/ADAPT/REJECT |

---

# 18. PRIORIZAÇÃO

Classifique cada proposta:

```text
P0 = essencial para arquitetura
P1 = alto valor
P2 = melhoria relevante
P3 = experimental
REJECT = não pertence ao AIOS
```

Use:

```text
Value / Complexity / Risk / Architectural Fit
```

como critérios.

---

# 19. IMPLEMENTAÇÃO

Depois da análise, NÃO implemente automaticamente.

Primeiro produza:

## Phase 1 — Foundation

- Agent Runtime contract
- execution state
- capability model
- model/provider abstraction

## Phase 2 — Intelligence

- Model Router
- Context Engine evolution
- Skill registry
- task decomposition

## Phase 3 — Orchestration

- parallel workers
- dependency graph
- validation
- arbitration

## Phase 4 — Governance

- hooks
- evidence
- policy enforcement
- observability

## Phase 5 — Optimization

- cost routing
- context optimization
- caching
- model selection optimization

Somente implementar uma fase se houver justificativa arquitetural.

---

# 20. OUTPUT OBRIGATÓRIO

Entregue:

### A. Current Architecture

Mapa da arquitetura atual.

### B. External Patterns

Padrões relevantes encontrados em OpenClaude, OpenClaw e DeepSeek.

### C. Gap Analysis

O que falta no AIOS.

### D. Duplication Analysis

O que NÃO deve ser adicionado porque já existe.

### E. Target Architecture

Arquitetura proposta.

### F. Execution Chain

Descrever a cadeia:

```text
Intent
→ Classification
→ Planning
→ Context
→ Policy
→ Model Routing
→ Skill
→ Agent
→ Tool
→ Evidence
→ Validation
→ Arbitration
→ Decision
→ Promotion
```

### G. Proposed Contracts

Definir interfaces/types conceituais antes de implementar.

### H. Migration Plan

Como migrar sem quebrar o AIOS.

### I. Prioritized Backlog

P0/P1/P2/P3.

### J. Risks

Identificar:

- overengineering
- provider lock-in
- context explosion
- agent explosion
- permission escalation
- state complexity
- duplicated orchestration
- unnecessary dependencies

### K. Final Verdict

Responder objetivamente:

1. O que devemos incorporar?
2. O que devemos adaptar?
3. O que devemos rejeitar?
4. Qual deve ser a próxima evolução arquitetural?
5. Qual é o menor conjunto de mudanças capaz de gerar maior ganho?

---

# 21. REGRA FINAL

O objetivo não é fazer o AIOS parecer com OpenClaude, OpenClaw ou DeepSeek.

O objetivo é fazer o AIOS evoluir para um:

> **Governed Agent Operating System for Software Engineering**

onde:

```text
Models provide intelligence
Agents provide decision-making
Skills provide repeatable capabilities
Tools provide actions
Context provides knowledge
Policies provide boundaries
Runtime provides execution
Evidence provides traceability
Gates provide quality
Governance provides control
```

A arquitetura final deve ser:

**modular, provider-agnostic, auditable, extensible, testable, secure e operacionalmente simples.**

Antes de qualquer implementação, apresente a análise e aguarde autorização explícita para prosseguir.
