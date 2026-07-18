# Architecture — Overview (target)

Source of truth for the product shape. Implementation arrives by phase ([ROADMAP](../ROADMAP.md)); this doc describes the **target**.

## Principle

Agents are **plugins**. The user talks to AIOS; AIOS orchestrates.

```text
User
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
 Final response
```

## Engine map (target)

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

| Engine | Role |
| --- | --- |
| **ai-core** | Shared runtime (types, events, execution) |
| **intent** | Interprets the user request |
| **policy** | Global rules (official docs, trade-offs, anti-overengineering) |
| **context** | Retrieves relevant code/docs from the repo |
| **workflow** | Defines the pipeline for the intent |
| **orchestration** | Schedules and coordinates plugins |
| **prompt** | Internal templates (do not replace policies) |
| **knowledge** | Knowledge Graph (relations, not just files) |
| **memory** | Session / project memory |
| **documentation** | Doc generation/validation |
| **governance** | Audit, decision tracking |
| **quality** | Pre-response Quality Gate |
| **appsec / architecture / repository** | Specialized domains (also plugins/agents) |
| **decision** | “Does this agent need to participate?” — if not, do not run |
| **integrations** | MCPs, IDEs, LLM providers |
| **ui** | Governance surface (Phase 3+) |

## Policies instead of long prompts

Today (without AIOS):

```text
Analyze my project following best practices, without hallucination,
without redundancy, with official documentation...
```

With AIOS:

```text
Analyze my project.
```

Rules are registered once in the **Policy Engine**, for example:

- Never use an abandoned library
- Always consult official documentation
- Always state trade-offs
- Always avoid overengineering
- Always justify decisions

## Intent → automatic decomposition

Request: *Analyze my project.*

```text
Intent → Project → Code → Backend → Spring Boot → Java → Architecture
         → trigger Architecture / Security / Performance / Docs / QA
```

All via workflow — the user does not pick an agent.

## Knowledge Graph (concept)

Instead of only loose files:

```text
Project → Architecture → Microservice → API → Database
       → Docker → Observability → Security
```

Improves context retrieval ([knowledge-engine](./system-guide.md)).

## Decision + Quality Gate

**Decision Engine**

```text
Does this agent really need to participate?  →  No  →  do not run
```

**Quality Gate** (before output)

```text
Architecture OK → Security OK → Docs OK → References OK → Consistency OK → send
```

## Phase 1 (implement first)

Do not build 15+ engines at once. Minimum core:

```text
intent · policy · context · orchestration/workflow · decision · quality-gate
+ plugins: architecture, appsec, docs, qa
+ cli (client)
```

See [system-guide.md](./system-guide.md).
