# AIOS Console (`@aios/console`)

Governance UI — **Health + Needs attention + Try it** (#71 · #76 · ADR-0010 · ADR-0012) · **Consumption** (`providerChat`, #118) · **Prometheus** scrape (#130 / ADR-0021).

Not Grafana-first. Provider chat appends `.aios/metrics/events.jsonl` (`provider.chat`, ADR-0019). The Health strip shows call/token totals. Scrape `GET /metrics` for Prometheus text (Grafana remains optional / user-owned).

## Dev

```bash
# at the monorepo root
export AIOS_HOME=/path/to/ai-operating-system
pnpm --filter @aios/console dev
```

- UI: http://127.0.0.1:5173 (proxy `/api` → API)
- API: http://127.0.0.1:8787 (`GET /api/status`, `POST /api/action`, `GET /metrics`)

## API

| Route | Description |
| --- | --- |
| `GET /api/status` | `GovernanceStatus` |
| `GET /metrics` · `GET /api/metrics` | Prometheus text (0.0.4) from JSONL |
| `GET /api/actions` | List of safe actions |
| `POST /api/action` | `{ action, input?, workspaceId? }` → result + latency |
| `GET /api/health` | API liveness |

CLI (no console required): `aios --metrics-prometheus`

Safe actions: `contract` · `validate_workspaces` · `load_policies` · `compile_brief` · `provider_ping` · `memory_recall` · `memory_remember` · `audit_docs` · `governance_audit` · `operational_state`.

## Product note

Agents do not appear as “buttons to call” — only state and actions that exercise engines.
