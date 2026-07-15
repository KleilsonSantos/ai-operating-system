# ROADMAP

## Fase 0 — Bootstrap ✅ (`v0.1.0`)

- [x] Repositório `ai-operating-system` (LICENSE, README, package)
- [x] Pedra base (`docs/FOUNDATION.md`) + visão operacional
- [x] ADR-0001 — plataforma standalone
- [x] Arquitetura target documentada (engines + agents-as-plugins)
- [x] Scaffold monorepo Fase 1 (engines + plugins + CLI)
- [x] Fluxo Git enterprise (`sandbox` → `main`, SemVer)
- [x] Community health (Issues, Project, Wiki mapa, CI/templates)

## Fase 1 — Núcleo (`v0.1.0`+)

Validar arquitetura e fluxos do AIOS.

- [x] Intent Engine (interpretar pedido) — #5
- [x] Policy Engine (regras fixas da plataforma) — #6
- [x] Context Engine (repo + docs) — #7
- [x] Orchestration + Workflow (escolher agentes) — #8
- [x] Agentes plugin: Architecture, AppSec, Docs, QA — #8
- [x] Decision Engine (precisa este agente?) — #8
- [x] Quality Gate (antes da resposta sair) — #8
- [x] CLI / API mínima para consumir o núcleo — #9

## Fase 2 — Multi-repositório (`v0.y.0`)

- [x] Contratos de integração estáveis — ADR-0003 / `@aios/pipeline` (#9); MCP Nível 2 (#38)
- [x] Onboarding de múltiplos repositórios — `@aios/workspace` + ADR-0004 (#43)
- [x] Knowledge Graph básico (relações Projeto → packages/engines → docs…) — `#47` / ADR-0005
- [x] Memory Engine (sessão / projeto) — `#51` / ADR-0006

## Fase 3 — Plataforma completa (`v1.0.0` aspiracional)

- [x] Multi-repo genérico — ops registry + `runAcrossWorkspaces` (#55 / ADR-0007)
- [x] Prompt Engine — brief governado / economia de tokens (#59 / ADR-0008)
- [x] Intent Engine v2 — `implement.feature` · `fix.bug` (#63)
- [x] Multi-provider MVP — `@aios/provider` + Ollama (`health`/`chat`) (#67 / ADR-0009); providers cloud depois
- [x] Integrations / MCP orchestration — MVP stdio `@aios/mcp` (#38; expansão futura)
- [ ] UI de governança
- [ ] Documentation / Governance engines completos

## Fora de escopo (de propósito)

- Substituir IDEs ou Copilot como editor — o AIOS governa e orquestra, não compete como autocomplete
- Construir todos os engines target na Fase 1
