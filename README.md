# AI Operating System (AIOS)

> Plataforma de governança para IA aplicada ao desenvolvimento de software.
> **Não** é o portfólio — é um produto separado. O portfólio (e outros apps) serão clientes.

[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](./LICENSE)

[Repo](https://github.com/KleilsonSantos/ai-operating-system) · [Issues](https://github.com/KleilsonSantos/ai-operating-system/issues) · [Project board](https://github.com/users/KleilsonSantos/projects/7) · [Wiki](https://github.com/KleilsonSantos/ai-operating-system/wiki)

---

## Em uma frase

Você escreve *"Analise meu projeto."* — políticas, contexto, agentes e quality gates rodam por baixo. Agentes são **plugins**; você não os chama diretamente.

## Por que existe

| Produto | Objetivo |
| --- | --- |
| [kleilson-portfolio](https://github.com/KleilsonSantos/kleilson-portfolio) | Mostrar quem você é · projetos · entrevistas |
| **AIOS** (este repo) | Gerenciar agentes, prompts, contexto, conhecimento, MCPs e workflows |

Misturar os dois aumenta complexidade. Aqui o AIOS é a plataforma; o portfólio só consome.

## Status

| Item | Valor |
| --- | --- |
| Fase | Scaffold Fase 1 (`v0.0.0`) |
| Produção | ainda não |
| Monorepo | pnpm workspaces + Turborepo (stubs) |
| Integração | `sandbox` → `main` · SemVer ([guia](./docs/guides/git-workflow.md)) |
| Visão | [`docs/VISION.md`](./docs/VISION.md) |
| Roadmap | [`docs/ROADMAP.md`](./docs/ROADMAP.md) |
| ADR | [ADR-0001 — produto separado](./docs/adr/0001-product-separation.md) |
| Arquitetura | [`docs/architecture/overview.md`](./docs/architecture/overview.md) |

## Estrutura (Fase 1)

```text
apps/cli/                 # Cliente mínimo (portfólio consumirá depois)
packages/
  shared/                 # Tipos compartilhados
  core/                   # ai-core (pipeline stub)
engines/
  intent/ policy/ context/ decision/
  orchestration/ quality-gate/
  agent-architecture/ agent-appsec/ agent-docs/ agent-qa/   # plugins
docs/
  VISION.md ROADMAP.md adr/ architecture/
```

## Quick start

```bash
pnpm install
pnpm --filter @aios/cli dev -- "Analise meu projeto."
```

## Documentação

| Doc | Para quê |
| --- | --- |
| [VISION](./docs/VISION.md) | Por que existe, relação portfólio↔AIOS, fases |
| [ROADMAP](./docs/ROADMAP.md) | O que entra em cada fase |
| [ADR-0001](./docs/adr/0001-product-separation.md) | Decisão de produto separado |
| [Arquitetura](./docs/architecture/overview.md) | Engines, plugins, policies, quality gate |
| [System guide](./docs/architecture/system-guide.md) | Fluxo Fase 1 |

## Licença

MIT — veja [LICENSE](./LICENSE).
