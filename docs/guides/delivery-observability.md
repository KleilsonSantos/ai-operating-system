# Delivery observability (CI events)

Thin index of GitHub Actions check conclusions for local history and Prometheus — **not** a second CI system. SSOT for logs remains GitHub.

ADR: [0028-delivery-ci-observability.md](../adr/0028-delivery-ci-observability.md)

## Event shape (`kind: delivery.ci`)

Stored in `.aios/metrics/events.jsonl` alongside `provider.chat` and `agent.execution`.

| Field                          | Notes                                              |
| ------------------------------ | -------------------------------------------------- |
| `check`                        | Job/check name (e.g. `quality`, `semver-align`)    |
| `conclusion`                   | `success`, `failure`, `skipped`, …                 |
| `baseBranch`                   | PR base (`sandbox`, `main`) — **Prometheus label** |
| `pr`, `runId`, `commit`, `url` | Detail for humans; **not** Prometheus labels       |

## Ingest

**Local (after PR checks finish):**

```bash
node scripts/record-delivery-ci.mjs --pr 313
```

**GitHub Actions:** workflow `Delivery observability` on CI `workflow_run` completed → artifact `delivery-ci-events-<run_id>` (30-day retention).

## Prometheus / Grafana

```bash
aios --metrics-prometheus
# or Console GET /metrics while the API is running
```

Example panels (user-owned Grafana):

```promql
sum by (check, conclusion) (aios_delivery_ci_total)
sum(aios_delivery_ci_errors_total)
```

Do not install Prometheus/Grafana by default (Resource-Aware). Scrape locally when needed.

## Async chat pattern

1. Agent opens PR and stops blocking on `gh pr checks` poll.
2. Owner continues other work; Cursor **Babysit** or manual re-check later.
3. On green/fail: run `--pr` ingest + merge via `scripts/merge-pr.sh` when appropriate.

No Kafka — volume and team size do not justify a broker.
