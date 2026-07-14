# ROADMAP

## Fase 0 — Bootstrap ⏳ (`v0.0.0` → `v0.1.0`)

- [x] Repositório `ai-operating-system` (LICENSE, README, package)
- [ ] Visão de produto canônica (`docs/VISION.md`)
- [ ] ADR de produto separado do portfólio
- [ ] Arquitetura target documentada (engines + agents-as-plugins)
- [ ] Fluxo Git enterprise (`sandbox` → `main`, SemVer)
- [ ] Community health (Issues, Project, Wiki mapa, CI/templates)

## Fase 1 — Núcleo no portfólio (`v0.1.0`+)

Validar arquitetura e fluxos usando o portfólio como primeiro cliente.

- [ ] Intent Engine (interpretar pedido)
- [ ] Policy Engine (regras fixas da plataforma)
- [ ] Context Engine (repo + docs)
- [ ] Orchestration + Workflow (escolher agentes)
- [ ] Agentes plugin: Architecture, AppSec, Docs, QA
- [ ] Decision Engine (precisa este agente?)
- [ ] Quality Gate (antes da resposta sair)
- [ ] CLI mínima / API interna para o portfólio consumir

## Fase 2 — Multi-projeto pessoal (`v0.y.0`)

- [ ] Contratos de integração estáveis (cliente ≠ engine)
- [ ] Onboarding de um segundo repositório pessoal
- [ ] Knowledge Graph básico (relações Projeto → API → Banco → …)
- [ ] Memory Engine (sessão / projeto)

## Fase 3 — Plataforma independente (`v1.0.0` aspiracional)

- [ ] Multi-repo genérico
- [ ] Multi-provider (ChatGPT, Claude, Gemini, Copilot, …)
- [ ] Integrations / MCP orchestration
- [ ] UI de governança
- [ ] Documentation / Governance engines completos

## Fora de escopo (de propósito)

- Conteúdo narrativo do portfólio (fica no repo do portfólio)
- Substituir IDEs ou Copilot como editor — o AIOS governa e orquestra, não compete como autocomplete
