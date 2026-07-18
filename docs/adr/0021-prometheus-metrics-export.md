# ADR-0021: Prometheus metrics export (ADR-0010 layer 2)

- **Status:** Accepted
- **Date:** 2026-07-18
- **Deciders:** Kleilson dos Santos
- **Issue:** #130

## Context

[ADR-0010](./0010-governance-console.md) deferred Prometheus/Grafana until useful series existed. [ADR-0019](./0019-provider-consumption-metrics.md) shipped `provider.chat` JSONL under `.aios/metrics/events.jsonl`. Ops still had no scrape surface.

## Decision

1. **On-demand** Prometheus text exposition (format 0.0.4) from that JSONL — `renderPrometheusMetrics` in `@aios/status`.
2. Expose:
   - Console API `GET /metrics` (and `/api/metrics`) while the local console API is running
   - CLI `aios --metrics-prometheus` (alias `--prometheus`) prints the same text
3. Metric families (MVP): event line count, provider chat requests/errors/tokens with `provider` label.
4. **Do not** install Grafana or Prometheus by default (Resource-Aware / inspect-before-install). Scrape is optional.
5. No Pushgateway / remote write in this vertical.

## Consequences

### Positive

- Closes ADR-0010 layer 2 with data that already exists
- Same aggregation path as governance `metrics.providerChat`
- Compatible with a user-managed Prometheus scrape config

### Trade-offs

- Counters are cumulative **file aggregates** re-read on each scrape (not an in-process registry) — fine for MVP volume
- Grafana dashboards remain user-owned

## References

- [Exposition formats](https://prometheus.io/docs/instrumenting/exposition_formats/)
- [ADR-0010](./0010-governance-console.md) · [ADR-0019](./0019-provider-consumption-metrics.md)
