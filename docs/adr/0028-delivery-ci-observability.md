# ADR-0028: Delivery CI observability events

- **Status:** Accepted
- **Date:** 2026-08-18
- **Deciders:** Kleilson dos Santos

## Context

Delivery flow (PR → GitHub Actions → merge → promote) is tracked in chat with synchronous `gh pr checks` polling. GitHub remains the SSOT for full CI logs, but AIOS had no indexed events for “which check failed on which PR/base branch” for local history or Prometheus/Grafana (ADR-0021).

Kafka or a always-on webhook service would violate Resource-Aware policy for a single-repo maintainer cadence.

## Decision

1. Append **`kind: delivery.ci`** rows to `.aios/metrics/events.jsonl` (same file as ADR-0019) with low-cardinality fields:
   - `check`, `conclusion`, `baseBranch`, optional `pr`, `runId`, `commit`, `url`, `source`
2. **`recordDeliveryCiMetric`** in `@aios/status`; aggregate in `loadMetricsSnapshot` / `renderPrometheusMetrics` as `aios_delivery_ci_total{check,conclusion,base_branch}`.
3. **Ingest paths (MVP):**
   - Local: `node scripts/record-delivery-ci.mjs --pr <n>` after babysit or merge prep
   - CI: workflow `Delivery observability` on `workflow_run` (CI completed) → artifact `delivery-ci-events.jsonl` (optional download; not committed)
4. **GitHub SSOT:** events store pointers + conclusions, not log bodies. Detail links use `url`.
5. **No** Kafka, Pushgateway, or default Grafana/Prometheus install (ADR-0021).

## Consequences

### Positive

- Reuses JSONL + Prometheus spine; Grafana dashboards stay user-owned
- Chat can move to async babysit while preserving traceability
- Cardinality bounded (no `pr` / `commit` as Prometheus labels)

### Trade-offs

- GHA artifact is not auto-synced to developer laptop — local `--pr` ingest fills `.aios/` on demand
- Counters are file aggregates on scrape (same as provider.chat MVP)

## References

- [ADR-0019](./0019-provider-consumption-metrics.md) · [ADR-0021](./0021-prometheus-metrics-export.md) · [ADR-0015](./0015-operational-state.md)
- `scripts/record-delivery-ci.mjs` · `.github/workflows/delivery-observability.yml`
