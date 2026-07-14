# System Guide — AIOS (Fase 1)

Guia operacional do núcleo que será implementado primeiro. O mapa completo está em [overview.md](./overview.md).

## Fluxo ponta a ponta (Fase 1)

```mermaid
flowchart TD
  U[Usuário / Cliente] --> I[Intent Engine]
  I --> P[Policy Engine]
  P --> C[Context Engine]
  C --> D[Decision Engine]
  D --> W[Workflow / Orchestration]
  W --> A1[Architecture plugin]
  W --> A2[AppSec plugin]
  W --> A3[Docs plugin]
  W --> A4[QA plugin]
  A1 --> Q[Quality Gate]
  A2 --> Q
  A3 --> Q
  A4 --> Q
  Q --> R[Resposta final]
```

## Contratos (esboço)

| Porta | Quem fala | O quê |
| --- | --- | --- |
| CLI / API | Humano ou integrador | Intent + escopo (path do repo) |
| Engine API | Interno | Eventos tipados entre engines |
| Plugin API | Agentes | Input de contexto + policies → artefato |

### Intent Engine (`@aios/intent`) — issue #5

`resolveIntent(raw)` → `{ raw, kind, confidence, signals }`.

Kinds Fase 1: `analyze.project` · `explain.code` · `review.change` · `unknown`.

Classificação heurística (sem LLM). Detalhe: [`engines/intent/README.md`](../../engines/intent/README.md).

### Policy Engine (`@aios/policy`) — issue #6

`loadPolicies()` → `{ rules, source, path? }` · `applyPolicies(rules)` → `{ constraints, mustIds }`.

Arquivo opcional: `policies/aios.policies.json` (ou `AIOS_POLICIES_PATH` / `configPath`).

Injeção Fase 1: `runWorkflow(intent, { policies })` anexa `policy:<id>` e `policies.injected` nos resultados dos plugins.

Detalhe: [`engines/policy/README.md`](../../engines/policy/README.md).

### Ponte Cursor Chat (Nível 1)

`pnpm sync:cursor-rules` → `.cursor/rules/aios-*.mdc` (`alwaysApply`) a partir de `policies/aios.policies.json`.

Pedido curto no chat; policies injetadas sem CLI. Guia: [`docs/guides/cursor-chat-bridge.md`](../guides/cursor-chat-bridge.md).

## O que Fase 1 NÃO inclui

- UI completa
- Multi-provider LLM genérico
- Knowledge Graph completo
- Memory persistente multi-projeto

Esses itens entram nas Fases 2–3 ([ROADMAP](../ROADMAP.md)).
