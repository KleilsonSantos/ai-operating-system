# AI Operating System (AIOS)

> Plataforma de governança para IA aplicada ao desenvolvimento de software.

[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](./LICENSE)

[Repo](https://github.com/KleilsonSantos/ai-operating-system) · [Issues](https://github.com/KleilsonSantos/ai-operating-system/issues) · [Project board](https://github.com/users/KleilsonSantos/projects/7) · [Wiki](https://github.com/KleilsonSantos/ai-operating-system/wiki)

---

## Em uma frase

Você escreve *"Analise meu projeto."* — policies, contexto, agentes e quality gates rodam por baixo. Agentes são **plugins**; você não os chama diretamente.

## Status

| Item | Valor |
| --- | --- |
| Fase | Fase 2 (multi-repo + KG) · `v0.9.0` |
| Produção | `main` + tag SemVer |
| Última release | [`v0.9.0`](https://github.com/KleilsonSantos/ai-operating-system/releases/tag/v0.9.0) |
| Monorepo | pnpm workspaces + Turborepo (stubs) |
| Integração | `sandbox` → `main` · [`@aios/pipeline`](./packages/pipeline/README.md) · [Cursor chat](./docs/guides/cursor-chat-bridge.md) |
| Pedra base | [`docs/FOUNDATION.md`](./docs/FOUNDATION.md) |
| Visão (resumo) | [`docs/VISION.md`](./docs/VISION.md) |
| Roadmap | [`docs/ROADMAP.md`](./docs/ROADMAP.md) |
| ADR | [ADR-0001](./docs/adr/0001-standalone-platform.md) · [ADR-0003 pipeline](./docs/adr/0003-pipeline-integration-contract.md) |
| Arquitetura | [`docs/architecture/overview.md`](./docs/architecture/overview.md) |

## Estrutura (Fase 1)

```text
apps/cli/                 # Cliente fino → @aios/pipeline
apps/mcp/                 # MCP stdio → Cursor Agent (#38)
packages/
  shared/                 # Tipos + PipelineRequest/Response
  core/                   # ai-core (eventos)
  pipeline/               # runPipeline — contrato estável (#9)
engines/
  intent/ policy/ context/ decision/
  orchestration/ quality-gate/
  agent-architecture/ agent-appsec/ agent-docs/ agent-qa/   # plugins
docs/
  FOUNDATION.md VISION.md ROADMAP.md adr/ architecture/
```

## Quick start

```bash
pnpm install
pnpm sync:cursor-rules   # policies → .cursor/rules (chat do Cursor)
pnpm --filter @aios/cli dev -- "Analise meu projeto."
```

No Cursor Agent deste workspace, as policies já entram sozinhas (Project Rules). Guia: [cursor-chat-bridge](./docs/guides/cursor-chat-bridge.md).

## Documentação

| Doc | Para quê |
| --- | --- |
| [FOUNDATION](./docs/FOUNDATION.md) | Pedra base — tese integral de origem |
| [VISION](./docs/VISION.md) | Resumo operacional |
| [ROADMAP](./docs/ROADMAP.md) | O que entra em cada fase |
| [ADR-0001](./docs/adr/0001-standalone-platform.md) | Plataforma standalone |
| [ADR-0003](./docs/adr/0003-pipeline-integration-contract.md) | Contrato `@aios/pipeline` |
| [Arquitetura](./docs/architecture/overview.md) | Engines, plugins, policies, quality gate |
| [System guide](./docs/architecture/system-guide.md) | Fluxo Fase 1 |
| [Cursor chat bridge](./docs/guides/cursor-chat-bridge.md) | Policies no chat sem CLI |

## Licença

MIT — veja [LICENSE](./LICENSE).
