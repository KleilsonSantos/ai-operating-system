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
- [ ] Policy Engine (regras fixas da plataforma)
- [ ] Context Engine (repo + docs)
- [ ] Orchestration + Workflow (escolher agentes)
- [ ] Agentes plugin: Architecture, AppSec, Docs, QA
- [ ] Decision Engine (precisa este agente?)
- [ ] Quality Gate (antes da resposta sair)
- [ ] CLI / API mínima para consumir o núcleo

## Fase 2 — Multi-repositório (`v0.y.0`)

- [ ] Contratos de integração estáveis
- [ ] Onboarding de múltiplos repositórios
- [ ] Knowledge Graph básico (relações Projeto → API → Banco → …)
- [ ] Memory Engine (sessão / projeto)

## Fase 3 — Plataforma completa (`v1.0.0` aspiracional)

- [ ] Multi-repo genérico
- [ ] Multi-provider (ChatGPT, Claude, Gemini, Copilot, …)
- [ ] Integrations / MCP orchestration
- [ ] UI de governança
- [ ] Documentation / Governance engines completos

## Fora de escopo (de propósito)

- Substituir IDEs ou Copilot como editor — o AIOS governa e orquestra, não compete como autocomplete
- Construir todos os engines target na Fase 1
