# AIOS Console (`@aios/console`)

UI de governança — **Health + Needs attention + Try it** (#71 · #76 · ADR-0010 · ADR-0012) · **Consumption** (`providerChat`, #118) · **Prometheus** scrape (#130 / ADR-0021).

Not Grafana-first. Provider chat appends `.aios/metrics/events.jsonl` (`provider.chat`, ADR-0019). The Health strip shows call/token totals. Scrape `GET /metrics` for Prometheus text (Grafana remains optional / user-owned).

## Dev

```bash
# na raiz do monorepo
export AIOS_HOME=/caminho/para/ai-operating-system
pnpm --filter @aios/console dev
```

- UI: http://127.0.0.1:5173 (proxy `/api` → API)
- API: http://127.0.0.1:8787 (`GET /api/status`, `POST /api/action`, `GET /metrics`)

## API

| Rota | Descrição |
| --- | --- |
| `GET /api/status` | `GovernanceStatus` |
| `GET /metrics` · `GET /api/metrics` | Prometheus text (0.0.4) from JSONL |
| `GET /api/actions` | Lista de safe actions |
| `POST /api/action` | `{ action, input?, workspaceId? }` → resultado + latência |
| `GET /api/health` | Liveness da API |

CLI (no console required): `aios --metrics-prometheus`

Safe actions: `contract` · `validate_workspaces` · `load_policies` · `compile_brief` · `provider_ping` · `memory_recall` · `memory_remember` · `audit_docs` · `governance_audit` · `operational_state`.

## Nota de produto

Agentes não aparecem como “botões para chamar” — só estado e ações que exercitam engines.
