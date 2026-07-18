# FOUNDATION — AIOS foundation

> **Canonical origin** for this product.  
> Operational summaries: [`VISION.md`](./VISION.md) · [`ROADMAP.md`](./ROADMAP.md) · [`architecture/overview.md`](./architecture/overview.md) · [ADR-0001](./adr/0001-standalone-platform.md).  
> If a summary conflicts with this file, **this document wins** until an ADR explicitly changes the decision.

## Language (canonical)

**Product documentation is written in US English** ([ADR-0018](./adr/0018-documentation-language.md), guide: [`documentation-language.md`](./guides/documentation-language.md)).

References: [Google developer docs — global audience](https://developers.google.com/style/translation) · [Kubernetes style guide](https://kubernetes.io/docs/contribute/style/style-guide/) · [Docker STYLE.md](https://github.com/docker/docs/blob/main/STYLE.md).

This FOUNDATION body is US English (migrated #124). New edits and sibling docs must follow US English; migrate remaining legacy Portuguese pages when touched. Chat with the product owner may remain Portuguese — that is not product documentation.

---

# What AIOS is

The **AI Operating System (AIOS)** is a standalone product: a **governance platform for AI applied to software development**.

It is not a pile of prompts. It is not a wrapper around a single LLM. It is the system that manages how artificial intelligence operates in the engineering lifecycle.

## Goal

```text
Manage agents.

Manage prompts.

Manage context.

Manage documentation.

Manage knowledge.

Orchestrate MCPs.

Run workflows.
```

---

# Positioning

Projects today include:

- LangChain
- CrewAI
- AutoGen
- OpenHands
- Semantic Kernel
- OpenAI Agents SDK

Each covers part of the space.

None solves exactly what AIOS covers: **AI governance for software engineering** — policies, quality, decision, repository context, and agents as plugins.

---

# Architecture

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

Agents become **plugins** only.

---

# Main flow

Agents stop talking to you.

They talk to each other.

```text
User

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

Final response
```

You never call an agent directly.

---

# Automatic intent

Today you write:

> Analyze my project.

AIOS responds internally:

```text
Intent

↓

Project

↓

Code

↓

Backend

↓

Spring Boot

↓

Java

↓

Architecture

↓

Trigger

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

All automatic.

---

# Knowledge Graph

Instead of files alone, AIOS builds relationships:

```text
Project

↓

Architecture

↓

Microservice

↓

API

↓

Database

↓

Docker

↓

Observability

↓

Security
```

That improves context retrieval.

---

# Decision Engine

```text
Does this agent really need to participate?

↓

No

↓

Do not run it.
```

---

# Quality Gate

Before the response leaves:

```text
Architecture OK

↓

Security OK

↓

Documentation OK

↓

References OK

↓

Consistency OK

↓

Send response
```

---

# Policy Engine

You define the rules **once**.

Example:

```text
Never use an abandoned library.

Always consult official documentation.

Always state trade-offs.

Always avoid overengineering.

Always justify decisions.
```

You never need to rewrite them in every prompt.

---

# Policies instead of long prompts

Today:

```text
Analyze my project

following best practices

without hallucination

without redundancy

with official documentation...
```

With AIOS:

```text
Analyze my project.
```

Because those rules are already registered as platform policies.

---

# Phased evolution

* **Phase 1:** AIOS core — intent, policy, context, orchestration, plugins, and quality gate — validating architecture and flows.
* **Phase 2:** reusable multi-repository platform, with Knowledge Graph and project memory.
* **Phase 3:** full operational independence — multi-tool (ChatGPT, Claude, Gemini, GitHub Copilot, etc.), context providers, integrations/MCP, and governance UI.

AIOS is unique: an AI governance platform for the SDLC — architecture, automation, policies, and quality composing the product.
