# Arquitetura — Visão Geral (target)

Fonte de verdade da forma do produto. Implementação chega por fase ([ROADMAP](../ROADMAP.md)); este doc descreve o **alvo**.

## Princípio

Agentes são **plugins**. O usuário fala com o AIOS; o AIOS orquestra.

```text
Usuário
   │
   ▼
 AIOS
   │
   ▼
 Intent Engine
   │
   ▼
 Workflow Engine
   │
   ├── Architecture Agent (plugin)
   ├── AppSec Agent (plugin)
   ├── Documentation Agent (plugin)
   └── QA Agent (plugin)
   │
   ▼
 Quality Gate
   │
   ▼
 Resposta final
```

## Mapa de engines (target)

```text
AIOS
├── ai-core
├── context-engine
├── policy-engine
├── workflow-engine
├── orchestration-engine
├── prompt-engine
├── knowledge-engine
├── memory-engine
├── documentation-engine
├── governance-engine
├── quality-engine
├── appsec-engine
├── architecture-engine
├── repository-engine
├── decision-engine
├── integrations
└── ui
```

| Engine | Papel |
| --- | --- |
| **ai-core** | Runtime compartilhado (tipos, eventos, execução) |
| **intent** | Interpreta o pedido do usuário |
| **policy** | Regras globais (docs oficiais, trade-offs, anti-overengineering) |
| **context** | Recupera código/docs relevantes do repo |
| **workflow** | Define o pipeline da intenção |
| **orchestration** | Agenda e coordena plugins |
| **prompt** | Templates internos (não substituem policies) |
| **knowledge** | Knowledge Graph (relações, não só arquivos) |
| **memory** | Memória de sessão / projeto |
| **documentation** | Geração/validação de docs |
| **governance** | Auditoria, rastreio de decisões |
| **quality** | Quality Gate pré-resposta |
| **appsec / architecture / repository** | Domínios especializados (também plugins/agentes) |
| **decision** | “Este agente precisa participar?” — senão, não executa |
| **integrations** | MCPs, IDEs, provedores LLM |
| **ui** | Superfície de governança (Fase 3+) |

## Policies no lugar de prompts longos

Hoje (sem AIOS):

```text
Analise meu projeto seguindo boas práticas, sem alucinação,
sem redundância, com documentação oficial...
```

Com AIOS:

```text
Analise meu projeto.
```

As regras ficam registradas uma vez no **Policy Engine**, por exemplo:

- Nunca usar biblioteca abandonada
- Sempre consultar documentação oficial
- Sempre indicar trade-offs
- Sempre evitar overengineering
- Sempre justificar decisões

## Intent → decomposição automática

Pedido: *Analise meu projeto.*

```text
Intent → Projeto → Código → Backend → Spring Boot → Java → Arquitetura
         → acionar Architecture / Security / Performance / Docs / QA
```

Tudo via workflow — sem o usuário escolher agente.

## Knowledge Graph (conceito)

Em vez de só arquivos soltos:

```text
Projeto → Arquitetura → Microsserviço → API → Banco
       → Docker → Observabilidade → Segurança
```

Melhora recuperação de contexto ([knowledge-engine](./system-guide.md)).

## Decision + Quality Gate

**Decision Engine**

```text
Esse agente realmente precisa participar?  →  Não  →  não executa
```

**Quality Gate** (antes de sair)

```text
Arquitetura OK → Segurança OK → Docs OK → Referências OK → Consistência OK → enviar
```

## Fase 1 (implementável primeiro)

Não construir os 15+ engines de uma vez. Núcleo mínimo:

```text
intent · policy · context · orchestration/workflow · decision · quality-gate
+ plugins: architecture, appsec, docs, qa
+ cli (cliente)
```

Ver [system-guide.md](./system-guide.md).
