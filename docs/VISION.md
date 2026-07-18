# Product vision — AIOS

> Operational summary. **Foundation:** [`FOUNDATION.md`](./FOUNDATION.md).

## Short answer

AIOS is a **governance platform for AI applied to software development**.

## Goal

```text
Manage agents · prompts · context · documentation · knowledge
Orchestrate MCPs · run workflows
```

## Positioning

Pieces of the problem exist in LangChain, CrewAI, AutoGen, OpenHands, Semantic Kernel, and the OpenAI Agents SDK.

AIOS focuses on what is missing as a single product: **policies, quality gates, decision, repository context, and agents as plugins** — aimed at software engineering.

## Core idea

- You do **not** call agents directly.
- You send an intent (e.g. *"Analyze my project."*).
- Intent → workflow → agents (plugins) → quality gate → response.
- Long rules become **Policies** (once); user prompts stay short.

## Evolution

| Phase | Goal |
| --- | --- |
| **1** | Core — intent, policy, context, orchestration, plugins, quality gate |
| **2** | Multi-repository · Knowledge Graph · memory |
| **3** | Multi-tool · MCP · governance UI · docs/governance |
| **4** | Mature control plane · Companion (experience) — [ADR-0014](./adr/0014-control-plane-companion.md) |

Details: [`ROADMAP.md`](./ROADMAP.md) · [`architecture/overview.md`](./architecture/overview.md) · [ADR-0001](./adr/0001-standalone-platform.md) · [ADR-0014](./adr/0014-control-plane-companion.md).
