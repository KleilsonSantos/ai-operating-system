# AI Operating System (AIOS)

> Governance platform for AI applied to software development.

[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](./LICENSE)

[Repo](https://github.com/KleilsonSantos/ai-operating-system) · [Issues](https://github.com/KleilsonSantos/ai-operating-system/issues) · [Project board](https://github.com/users/KleilsonSantos/projects/7) · [Wiki](https://github.com/KleilsonSantos/ai-operating-system/wiki)

**Docs language:** US English ([ADR-0018](./docs/adr/0018-documentation-language.md) · [guide](./docs/guides/documentation-language.md)).

---

## In one sentence

You write _"Analyze my project."_ — policies, context, agents, and quality gates run underneath. Agents are **plugins**; you do not call them directly.

## Status

| Item                  | Value                                                                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase                 | Phase 4 mature · Companion + control plane                                                                                                                                                                                                                                |
| Production            | `main` + SemVer tags                                                                                                                                                                                                                                                      |
| Latest release        | [`v0.25.0`](https://github.com/KleilsonSantos/ai-operating-system/releases/tag/v0.25.0)                                                                                                                                                                                   |
| Monorepo              | pnpm workspaces + Turborepo                                                                                                                                                                                                                                               |
| Integration           | `sandbox` → `main` · [`@aios/pipeline`](./packages/pipeline/README.md) · [Cursor chat](./docs/guides/cursor-chat-bridge.md)                                                                                                                                               |
| Foundation            | [`docs/FOUNDATION.md`](./docs/FOUNDATION.md)                                                                                                                                                                                                                              |
| Prompt Knowledge Base | [`docs/prompts/`](./docs/prompts/)                                                                                                                                                                                                                                        |
| External references   | [`docs/references/`](./docs/references/)                                                                                                                                                                                                                                  |
| Vision (summary)      | [`docs/VISION.md`](./docs/VISION.md)                                                                                                                                                                                                                                      |
| Roadmap               | [`docs/ROADMAP.md`](./docs/ROADMAP.md)                                                                                                                                                                                                                                    |
| ADR                   | [ADR-0001](./docs/adr/0001-standalone-platform.md) · [ADR-0003 pipeline](./docs/adr/0003-pipeline-integration-contract.md) · [ADR-0014 companion](./docs/adr/0014-control-plane-companion.md) · repo [`aios-companion`](https://github.com/KleilsonSantos/aios-companion) |
| Architecture          | [`docs/architecture/overview.md`](./docs/architecture/overview.md)                                                                                                                                                                                                        |

## Layout

```text
apps/cli/                 # Thin client → @aios/pipeline
apps/mcp/                 # MCP stdio (+ opt-in HTTP) → Cursor / Companion
apps/console/             # Governance UI Health + Attention (#71)
packages/
  shared/                 # Types + PipelineRequest/Response
  core/                   # ai-core (events)
  pipeline/               # runPipeline — stable contract (#9)
engines/
  intent/ policy/ context/ decision/
  orchestration/ quality-gate/
  workspace/ knowledge/ memory/ prompt/ provider/ status/
  documentation/ governance/
  agent-architecture/ agent-appsec/ agent-docs/ agent-qa/   # plugins
docs/
  FOUNDATION.md VISION.md ROADMAP.md adr/ architecture/
  prompts/ references/
```

## Quick start

```bash
pnpm install
pnpm sync:cursor-rules   # policies → .cursor/rules (Cursor chat)
pnpm --filter @aios/cli dev -- "Analyze my project."
# console: AIOS_HOME=$PWD pnpm --filter @aios/console dev
```

In this workspace’s Cursor Agent, policies load automatically (Project Rules). Guide: [cursor-chat-bridge](./docs/guides/cursor-chat-bridge.md).

## Documentation

| Doc                                                          | Purpose                                  |
| ------------------------------------------------------------ | ---------------------------------------- |
| [FOUNDATION](./docs/FOUNDATION.md)                           | Product foundation — origin thesis       |
| [VISION](./docs/VISION.md)                                   | Operational summary                      |
| [ROADMAP](./docs/ROADMAP.md)                                 | What lands in each phase                 |
| [ADR-0001](./docs/adr/0001-standalone-platform.md)           | Standalone platform                      |
| [ADR-0003](./docs/adr/0003-pipeline-integration-contract.md) | `@aios/pipeline` contract                |
| [Architecture](./docs/architecture/overview.md)              | Engines, plugins, policies, quality gate |
| [System guide](./docs/architecture/system-guide.md)          | Phase 1 flow                             |
| [Cursor chat bridge](./docs/guides/cursor-chat-bridge.md)    | Policies in chat without CLI             |

## License

MIT — see [LICENSE](./LICENSE).
