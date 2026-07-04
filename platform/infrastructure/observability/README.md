# Observability

> Implements [`observability_strategy`](../../docs/platforms/observability_strategy.md).

- `dashboards/<service>/` — Grafana JSON, provisioned via Helm/Argo.
- `alerts/<service>/` — Prometheus alert rules.
- `slos/<service>/` — SLO definitions (Sloth / Pyrra format) per service.
