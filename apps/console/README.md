# AIOS Console (`@aios/console`)

UI de governança — **Health + Needs attention + Try it** (#71 · #76 · ADR-0010 · ADR-0012).

Não é Grafana. Grafana/séries de consumo vêm depois via `.aios/metrics/events.jsonl`.

## Dev

```bash
# na raiz do monorepo
export AIOS_HOME=/caminho/para/ai-operating-system
pnpm --filter @aios/console dev
```

- UI: http://127.0.0.1:5173 (proxy `/api` → API)
- API: http://127.0.0.1:8787 (`GET /api/status`, `POST /api/action`)

## API

| Rota | Descrição |
| --- | --- |
| `GET /api/status` | `GovernanceStatus` |
| `GET /api/actions` | Lista de safe actions |
| `POST /api/action` | `{ action, input?, workspaceId? }` → resultado + latência |
| `GET /api/health` | Liveness da API |

Safe actions: `contract` · `validate_workspaces` · `load_policies` · `compile_brief` · `provider_ping` · `memory_recall` · `memory_remember`.

## Nota de produto

Agentes não aparecem como “botões para chamar” — só estado e ações que exercitam engines.
