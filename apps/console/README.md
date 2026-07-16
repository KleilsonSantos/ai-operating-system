# AIOS Console (`@aios/console`)

UI de governança — **Health + Needs attention** (#71 · ADR-0010).

Não é Grafana. Grafana/séries de consumo vêm depois via `.aios/metrics/events.jsonl`.

## Dev

```bash
# na raiz do monorepo
export AIOS_HOME=/caminho/para/ai-operating-system
pnpm --filter @aios/console dev
```

- UI: http://127.0.0.1:5173 (proxy `/api` → API)
- API: http://127.0.0.1:8787 (`GET /api/status`)

## API

| Rota | Descrição |
| --- | --- |
| `GET /api/status` | `GovernanceStatus` (workspaces, policies, provider, MCP catalog, attention) |
| `GET /api/health` | Liveness da API |

## Nota de produto

Agentes não aparecem como “botões para chamar” — só estado e surface MCP disponibilizada.
