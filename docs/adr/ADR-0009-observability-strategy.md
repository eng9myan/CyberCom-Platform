# ADR-0009: Observability Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | DevOps Architect, Principal Platform Engineer, Chief Security Architect |
| **Affects** | All services and the platform itself |
| **Tags** | platform, observability, sre, security |
| **Related** | [observability_strategy](../platforms/observability_strategy.md), [audit_logging_strategy](../security/audit_logging_strategy.md) |

---

## 1. Context

CyberCom is multi-product, multi-region, multi-tenant. Without consistent observability, every team will pick its own tools, MTTR will balloon, and compliance evidence will fragment.

## 2. Problem Statement

What is the **single observability stack and contract** every CyberCom service must use?

## 3. Decision Drivers

- One instrumentation API across Python, TypeScript, Go.
- Open standards to avoid vendor lock-in but allow managed vendors.
- Separation of operational telemetry from immutable audit logs.
- Cost control at scale.
- SLO-driven operations.

## 4. Considered Options

1. **OpenTelemetry SDK + Prometheus + Grafana + Loki/Tempo, separated audit pipeline** (chosen).
2. Vendor-only (e.g. Datadog, NewRelic) everywhere.
3. Per-team choice.

## 5. Decision

- **Instrumentation:** OpenTelemetry SDKs in every service (auto-instrumentation where mature).
- **Pipeline:** OTel Collector(s) per cluster with **tail-based sampling** for traces.
- **Sinks:** Prometheus (metrics), Loki or Elastic (logs), Tempo or Jaeger (traces). Managed vendor equivalents permitted per env (especially on-prem vs SaaS), provided the OTel surface stays canonical.
- **Visualization:** Grafana — dashboards provisioned as JSON in `infrastructure/observability/dashboards/`.
- **Alerting:** Prometheus / Alertmanager (or vendor) → PagerDuty / Opsgenie; SLO-based, multi-window multi-burn-rate.
- **SLOs:** every user-facing service publishes `SLO.md`; error budgets drive release pace.
- **Audit logs** flow on a separate, immutable pipeline per [`audit_logging_strategy`](../security/audit_logging_strategy.md).
- **Telemetry attributes** mandatory: `service.name/.version/.namespace`, `deployment.environment`, `tenant.id`, `trace_id`, `span_id`.
- **Forbidden:** PHI/PII in metrics labels, log messages, or span attributes.

## 6. Rationale

- OTel is the de-facto standard with broad language and vendor support — keeps us portable.
- A pluggable sink lets us choose between OSS and vendors per deployment without changing services.
- Separating audit from ops logs is a compliance and operability requirement.

## 7. Consequences

### 7.1 Positive
- Single mental model across products.
- Vendor swap is a collector config change.

### 7.2 Trade-offs
- OTel still maturing for some signals; collector ops is non-trivial.

### 7.3 Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Cardinality explosion | High | High | Per-service cardinality budgets; meta-alerts |
| 2 | Trace cost runaway | Medium | Medium | Tail-based sampling; per-tier budgets |
| 3 | Vendor drift across envs | Medium | Medium | Conformance tests on the OTel surface |

## 8. Compliance & Security Impact

- Supports HIPAA §164.308(a)(1)(ii)(D), ISO 27001 A.8.15, SOC 2 CC7.2.
- PHI/PII forbidden in telemetry; redaction at source enforced.

## 9. Alternatives Rejected

- **Vendor-only** — works for SaaS but blocks sovereign on-prem profiles.
- **Per-team choice** — fragments tooling, blows up cost and MTTR.

## 10. References

- [`observability_strategy`](../platforms/observability_strategy.md), OpenTelemetry, Google SRE SLO book

---

## Revision History
| Date | Author | Change |
|---|---|---|
| 2026-06-21 | DevOps Architect | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
