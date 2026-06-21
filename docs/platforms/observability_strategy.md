# Observability Strategy

> **Status:** Approved — Program 0, Phase 0.5
> **Owner:** DevOps Architect + Principal Platform Engineer
> **Implements:** [ADR-0009 Observability Strategy](../adr/ADR-0009-observability-strategy.md)

You cannot operate what you cannot observe. CyberCom builds observability as a **platform service**, not as an afterthought per team.

---

## 1. Pillars

| Pillar | Standard tool |
|---|---|
| **Metrics** | OpenTelemetry → Prometheus (scrape/remote write) → Grafana |
| **Logs** | OTel → Loki (or Elastic) → SIEM stream for audit/security |
| **Traces** | OTel → Tempo (or Jaeger) |
| **Events** | Audit log per [`audit_logging_strategy`](../security/audit_logging_strategy.md) |
| **Profiles (optional)** | Pyroscope / Parca for continuous profiling on T1 services |

OpenTelemetry is the **single instrumentation API** across languages.

---

## 2. Telemetry Contract (every service)

Every service must emit, at minimum:

| Endpoint | Purpose |
|---|---|
| `/healthz` | Liveness — fast, no deps |
| `/readyz` | Readiness — checks deps |
| `/metrics` | Prometheus scrape (OTel SDK) |
| OTel exporter (OTLP/HTTP) | Traces + metrics + logs to collector |

Required attributes on every emission: `service.name`, `service.version`, `service.namespace`, `deployment.environment`, `tenant.id` (when applicable), `trace_id`, `span_id`.

Required structured log fields: `ts`, `level`, `msg`, `service`, `version`, `env`, `tenant_id`, `trace_id`, `span_id`, `correlation_id`. See [`coding_standards`](../standards/coding_standards.md) §6.

---

## 3. Metrics — RED + USE

| Pattern | Where | Examples |
|---|---|---|
| **RED** (Rate, Errors, Duration) | Every request handler / consumer | `http_server_requests_total`, `..._errors_total`, `..._duration_seconds` |
| **USE** (Utilization, Saturation, Errors) | Every resource | CPU, memory, DB pool, queue depth, cache hit rate |
| **Business** | Per product, opt-in | `patient.admissions.total`, `payments.processed.total` (no PHI/PII as labels) |

Metric naming:
- Snake case, suffix the unit (`_seconds`, `_bytes`, `_total`).
- Labels low-cardinality only; **never** raw IDs or PII.
- Tenant cardinality controlled (use `tenant_id` only if necessary; consider hashed buckets at scale).

---

## 4. Logs

- Structured JSON, one event per line.
- Forwarded by node agent (Vector / Promtail / Fluent Bit) to Loki / Elastic.
- Operational and audit logs are **separate streams** with different retention and access controls.
- Sensitive data redacted at the source by a maintained allow/deny list.
- Per [`audit_logging_strategy`](../security/audit_logging_strategy.md): audit events go to the immutable, tamper-evident sink — **never** sampled.

Retention defaults:
- Operational: 30 d hot, 1 y cold.
- Audit: 90 d hot, 1 y warm, 6+ y cold (regulated).

---

## 5. Traces

- 100% sampling at the edge for ingress requests in `prod` is too expensive — use **tail-based sampling** at the OTel Collector to keep error and slow traces while down-sampling success.
- W3C `traceparent` propagation across all hops (HTTP, gRPC, queues).
- Every trace links to logs (via `trace_id`) and metrics (via exemplars).
- Span attributes: `tenant.id`, `db.system`, `messaging.system`, `peer.service`. No PHI/PII attributes.

---

## 6. SLIs and SLOs

### 6.1 Definitions
- **SLI** — a measurable signal about service behavior (latency, availability, correctness).
- **SLO** — a target for an SLI over a window.
- **Error budget** — `1 − SLO` over the window; spent by incidents/changes.

### 6.2 Standard SLIs (every user-facing API)

| SLI | Definition |
|---|---|
| **Availability** | `1 − (5xx / total)` over 30 d (excluding documented planned maintenance) |
| **Latency** | `p95 ≤ target` over rolling 30 d |
| **Correctness** | Business-defined success rate (e.g. payment posted exactly once) |
| **Freshness** | For async/data pipelines: end-to-end delay ≤ target |

### 6.3 Tier defaults

| Tier | Availability SLO | Latency (p95) | Error budget / 30 d |
|---|---|---|---|
| T1 | 99.95% | per perf tier in [`coding_standards`](../standards/coding_standards.md) §8 | 21.6 min |
| T2 | 99.9% | per perf tier | 43.2 min |
| T3 | 99.5% | per perf tier | 3.6 h |
| T4 | — | — | — |

Each service publishes `SLO.md` listing SLIs, SLO targets, windows, alerts, owners.

---

## 7. Alerting Philosophy

- **Alert on symptoms, not causes.** Pages should map to user impact.
- **Multi-window, multi-burn-rate** (Google SRE pattern):
  - Page on fast burn (e.g. 14.4× over 1 h consuming 2% budget).
  - Ticket on slow burn (e.g. 6× over 6 h).
- **Every page has a runbook.** An unrunbooked alert is a bug.
- **No noise.** Alerts that fire without action for 2 weeks are deleted or tuned.

### 7.1 Standard alert sources

| Source | Examples |
|---|---|
| SLO burn | Availability/latency budget exhaustion |
| Saturation | Pod CPU/mem, DB connection pool, queue depth |
| Anomaly | Auth failure spike, PHI mass read |
| Security | SIEM correlations, WAF blocks, secret reads |
| Infra | Cluster autoscaler errors, node not ready |
| Pipeline | Argo CD sync failure, image admission denial |

### 7.2 Routing
- Tier-1 → 24×7 pager.
- Tier-2 → business-hours pager + after-hours for SEV-1.
- Tier-3 → ticket + Slack channel.

---

## 8. Dashboards

Each service ships:

- **Service overview** — RED + USE, SLO burn, deploys, errors.
- **Dependency health** — DB, cache, queue, downstreams.
- **Business** — opt-in counters (no PII).
- **Capacity & cost** — pod count, request rate, $ per request (where instrumented).

Dashboards live as JSON under `infrastructure/observability/dashboards/<service>/` and are provisioned via Grafana provider.

---

## 9. Tracing & Logging Cost Controls

- **Tail-based sampling** at the collector.
- **Log-level discipline:** DEBUG sampled at 1% in non-prod; off in prod by default.
- **Cardinality budgets** per service; cardinality explosion fires a meta-alert.
- **Cold-tier offload** for old data.

---

## 10. Observability for the Platform Itself

The platform is observed by the same stack:

- CI duration, failure rate per job, DORA metrics.
- Argo CD sync lag/failures.
- Vault availability, secret-read anomalies.
- KMS errors.
- Cluster control-plane health.
- Branch-protection drift.

---

## 11. Compliance Considerations

- Audit log path is **separate** and immutable; see [`audit_logging_strategy`](../security/audit_logging_strategy.md).
- Operational logs MUST NOT contain PHI/PII (redaction at the source).
- Cross-region telemetry transfers respect data-residency rules.
- Access to logs/traces audited; PHI in error messages is itself an incident.

---

## 12. Forbidden

- High-cardinality labels (raw user ID, full URL, request body content).
- PHI/PII in metrics labels, log messages, or span attributes.
- Pager alerts without runbooks.
- Per-team unique tooling that bypasses the platform stack (without ADR).
- Disabling sampling in prod without capacity planning.
