# Backend Standards

> **Status:** Approved — Program 0, Phase 0.3
> **Owner:** Principal Engineer (Backend)
> **Stack:** Python 3.12 · Django 5 · Django REST Framework · PostgreSQL 16 · Redis · Celery · Docker · Kubernetes

Extends [`coding_standards.md`](coding_standards.md) and [`python_standards.md`](python_standards.md).

---

## 1. Service Anatomy

Every backend service exposes:

| Surface | Required |
|---|---|
| HTTP API (REST) | ✅ per [`api_standards.md`](api_standards.md) |
| Health endpoints | `/healthz` (liveness), `/readyz` (readiness), `/metrics` (Prometheus) |
| OpenAPI spec | At `/openapi.json` and committed under `<service>/openapi/` |
| OpenTelemetry exporter | OTLP/HTTP |
| Structured logs | JSON to stdout |
| Container image | Multi-stage, non-root, distroless or slim |
| Helm chart | Under `infrastructure/helm/<service>/` |

---

## 2. Layered Architecture (Hexagonal)

```
┌───────────────────────────────────────────────┐
│                 API layer (DRF)               │
├───────────────────────────────────────────────┤
│              Application layer                │  ← use cases / orchestration
├───────────────────────────────────────────────┤
│                Domain layer                   │  ← entities, aggregates (pure)
├───────────────────────────────────────────────┤
│            Infrastructure layer               │  ← ORM, queues, HTTP clients
└───────────────────────────────────────────────┘
```

- Dependencies point **inward** (domain has no Django/ORM imports).
- Repository interfaces in `domain/`; implementations in `infrastructure/`.
- Use cases receive interfaces, not concrete classes (DI by constructor).

---

## 3. Configuration

- 12-factor: all config via env vars; secrets via secret manager (AWS Secrets Manager / Vault), never in repo.
- Settings loader: `pydantic-settings` or `django-environ`.
- Per-environment settings modules (`settings/dev.py`, `prod.py`, `test.py`).
- `.env.example` committed; real `.env` ignored.

---

## 4. Persistence

See [`database_standards.md`](database_standards.md). Backend rules:

- One **owned** schema per service. Cross-service joins are forbidden — use APIs or events.
- All writes go through repository classes; no `Model.objects.*` calls from `api/` or `application/`.
- Transactions explicit: `with transaction.atomic():` at the use-case boundary.
- Migrations: `python manage.py makemigrations` reviewed; never edited after merge.

---

## 5. Caching

- **Redis** is the default cache. Cluster mode in prod.
- Cache keys: `cybercom:<service>:<entity>:<id>:<version>` — versioned to allow rolling invalidation.
- TTLs explicit; no infinite caches.
- Cache stampede protection: single-flight (`lock`) or `XFETCH` style.
- Read-through and write-through documented per cache; mixed strategies forbidden.

---

## 6. Async Processing

- **Celery** for background tasks; **Celery Beat** for schedules.
- Tasks idempotent; accept `idempotency_key`.
- Retry policy explicit: `autoretry_for`, `retry_backoff`, `max_retries`.
- Long tasks split into chains; never one-hour monoliths.
- Dead-letter queue mandatory; DLQ alarms paged.

---

## 7. Messaging / Events

- Default broker: **RabbitMQ** (commands) and **Kafka** (events) — selected per ADR.
- Event schemas in `<service>/events/` as JSON Schema or Avro; versioned (`v1`, `v2`).
- Topic naming: `cybercom.<product>.<aggregate>.<event-past-tense>` (e.g. `cybercom.cymed.patient.admitted`).
- Producers MUST publish via an outbox table to guarantee at-least-once.
- Consumers MUST be idempotent.

---

## 8. Authentication & Authorization

- **AuthN:** OIDC via CyIdentity; backend validates JWTs (signed, `aud`, `iss`, `exp`, `nbf`, `kid`).
- Service-to-service: mTLS or signed JWT with short TTL; never shared static tokens.
- **AuthZ:** policy-based (OPA/Cedar — selected per ADR); checks in application layer, not views.
- Multi-tenant isolation: `tenant_id` enforced in every query via a request-scoped middleware + row-level policy.

---

## 9. Resilience

- **Timeouts** on every outbound call (no defaults).
- **Retries** with exponential backoff + jitter; classified errors (transient vs permanent).
- **Circuit breakers** on cross-service calls (`pybreaker` or equivalent).
- **Bulkheads:** isolate thread/connection pools per downstream.
- **Graceful shutdown:** drain in-flight requests on SIGTERM; ≤30 s.

---

## 10. Observability

- OTel instrumentation auto-enabled (`opentelemetry-instrumentation-django`, `-psycopg`, `-celery`, `-httpx`).
- RED metrics per endpoint; USE metrics for DB/cache/queue.
- Standard log fields per [`coding_standards.md`](coding_standards.md) §6.
- Each service ships a Grafana dashboard JSON in `infrastructure/observability/`.

---

## 11. Containerization

- Base image: `python:3.12-slim` or distroless.
- Non-root user (UID 10001 standard).
- Read-only root filesystem; writable `/tmp` via emptyDir.
- Image scanning (Trivy) gates CI.
- Image labels: `org.opencontainers.image.{source,revision,version,licenses}`.
- Image tags: `vMAJOR.MINOR.PATCH` and `git-<sha>`. Never `latest` in deployment manifests.

---

## 12. Kubernetes

- Resource requests/limits mandatory; OOMKilled is a bug, not a budget.
- `livenessProbe` (slow), `readinessProbe` (fast); both required.
- `podDisruptionBudget`, `horizontalPodAutoscaler`, and `networkPolicy` per service.
- Secrets via Kubernetes Secrets backed by external manager (External Secrets Operator).
- Helm chart with values per environment under `infrastructure/helm/<service>/`.

---

## 13. Performance & Capacity

- See [`coding_standards.md`](coding_standards.md) §8.
- Load tests in `tests/perf/` (Locust or k6); baseline run weekly + before each release.
- DB query budget: ≤ 5 queries per typical request, ≤ 50 ms total in p95.

---

## 14. Forbidden

- Long-lived shared static tokens.
- Direct DB access across services.
- `select *` style ORM patterns that return all fields.
- Synchronous HTTP calls in request handlers without timeout/circuit-breaker.
- Storing files on local pod disk (use S3-compatible storage).
- Writing to `latest` image tags in production.
