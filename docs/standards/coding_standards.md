# Coding Standards (Cross-Language)

> **Status:** Approved — Program 0, Phase 0.3
> **Owner:** Engineering Standards Authority
> **Scope:** All CyberCom code regardless of language.

These are the **baseline** rules. Language-specific standards (Python, TypeScript, etc.) extend, never weaken, these.

---

## 1. Naming Conventions

| Concept | Convention | Example |
|---|---|---|
| Repositories | `kebab-case` | `cybercom-platform` |
| Folders | `kebab-case` (top-level), `snake_case` (Python pkg), `camelCase`/`kebab-case` (TS/JS pkg) | `domain-models/` |
| Files (TS/JS) | `kebab-case.ts`, React components `PascalCase.tsx` | `patient-card.tsx`, `PatientCard.tsx` |
| Files (Python) | `snake_case.py` | `patient_service.py` |
| Classes / Types | `PascalCase` | `PatientService` |
| Functions / methods | `camelCase` (TS) / `snake_case` (Python) | `getPatient` / `get_patient` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Env vars | `UPPER_SNAKE_CASE` with product prefix | `CYMED_DB_HOST` |
| DB tables | `snake_case`, plural | `patients`, `lab_orders` |
| DB columns | `snake_case` | `created_at`, `tenant_id` |
| API routes | `kebab-case`, plural resources | `/api/v1/lab-orders` |
| Events / topics | `dot.case` past-tense | `cymed.patient.admitted` |
| Branches | `type/scope-short-desc` | `feat/cymed-fhir-patient` |

**Forbidden:** abbreviations that hide intent (`mgr`, `tmp`, `data2`), Hungarian notation, single-letter names outside trivial loops.

---

## 2. Folder Conventions (per-service baseline)

```
<service>/
├── README.md
├── src/
│   ├── api/            # HTTP / gRPC entry points
│   ├── domain/         # Entities, aggregates, domain services (no I/O)
│   ├── application/    # Use cases / orchestration
│   ├── infrastructure/ # DB, queues, external SDKs
│   ├── config/         # Settings / env binding
│   └── shared/         # Cross-cutting helpers (logging, errors)
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── migrations/         # If service owns its schema
├── scripts/
├── Dockerfile
├── pyproject.toml | package.json
└── CHANGELOG.md
```

Rationale: hexagonal / clean-architecture layering — `domain` has zero infrastructure imports.

---

## 3. Code Organization Principles

1. **One responsibility per module.** A file > 400 lines is a smell.
2. **Dependencies point inward.** `domain` ← `application` ← `infrastructure`/`api`.
3. **Public API is explicit.** Use `__all__` (Py), `index.ts` (TS) barrels for module boundaries.
4. **No circular imports.** CI enforced (`importlinter`, `eslint-plugin-import`).
5. **No dead code.** Delete it. Git remembers.
6. **No TODOs without an issue link.** `// TODO(#123): …`.
7. **Feature flags, not commented-out code.**

---

## 4. Dependency Management

| Topic | Rule |
|---|---|
| Lockfiles | Always committed (`poetry.lock`, `package-lock.json`, `requirements.txt`-hashed) |
| Pinning | Top-level deps pinned to compatible-release (`~=`, `^`); transitive resolved via lockfile |
| Updates | Dependabot weekly; security-only PRs auto-mergeable after CI + 1 review |
| New dependency review | Required for any new top-level dep — owner approves on PR (license, maintenance, alternatives) |
| Banned | Unmaintained (>24 mo no release), GPL/AGPL in proprietary code, deps with known unresolved Critical CVEs |
| Internal packages | Use workspace tooling (pnpm/poetry workspaces); never `file:` paths in lockfile |

---

## 5. Error Handling

1. **Fail fast at boundaries.** Validate inputs at API/CLI/queue ingress; trust internal calls.
2. **Typed errors.** Custom exception hierarchies per domain; never raise/throw bare `Exception`/`Error`.
3. **Errors carry context.** Include correlation id, tenant id, resource id — never PHI/PII in messages.
4. **No silent catches.** A `try` that swallows an exception MUST log at `warn`+ and explain why.
5. **Retries are explicit.** Use exponential backoff with jitter; idempotency keys for writes.
6. **User-facing errors are sanitized.** Internal stack traces never reach end users; map to stable error codes.

Standard error envelope (REST):

```json
{
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Patient does not exist.",
    "correlation_id": "01J…",
    "details": []
  }
}
```

---

## 6. Logging

| Rule | Detail |
|---|---|
| Format | **Structured JSON** only. No `print`/`console.log` in production code |
| Levels | `DEBUG` (dev), `INFO` (lifecycle), `WARN` (recoverable), `ERROR` (action required), `CRITICAL` (page on-call) |
| Required fields | `ts`, `level`, `msg`, `service`, `version`, `env`, `tenant_id`, `trace_id`, `span_id` |
| Forbidden in logs | Passwords, tokens, cookies, full PHI/PII, raw request bodies for sensitive endpoints |
| Sampling | High-volume `DEBUG` sampled at 1% in non-prod |
| Retention | 30 days hot, 1 year cold (overridden by compliance) |

---

## 7. Observability

CyberCom observability is built on the **three pillars + one**: metrics, logs, traces, and events.

- **Tracing:** OpenTelemetry; every external call instrumented; `trace_id` propagated end-to-end.
- **Metrics:** OTel/Prometheus; RED (Rate/Errors/Duration) for every request handler; USE (Utilization/Saturation/Errors) for every resource.
- **Logs:** see §6.
- **Events:** business-meaningful events (e.g. `patient.admitted`) emitted to the event bus for analytics & audit.
- **Dashboards:** every service ships with a Grafana JSON dashboard in `infrastructure/observability/`.
- **Alerts:** SLO-based; symptom alerts page, cause alerts inform.

---

## 8. Performance Requirements (baseline)

| Tier | API p99 latency | Throughput target | Cold start |
|---|---|---|---|
| Critical (auth, billing, clinical) | ≤ 200 ms | ≥ 1 000 RPS / pod | ≤ 2 s |
| Standard | ≤ 500 ms | ≥ 300 RPS / pod | ≤ 5 s |
| Batch / async | n/a | per SLA | n/a |

- Every endpoint declares its tier in OpenAPI (`x-perf-tier`).
- Performance regressions >10% vs. baseline fail CI for critical paths.
- N+1 queries are bugs.

---

## 9. Scalability Requirements

- **Stateless services.** State in DB/cache/queue, not in-process.
- **12-factor compliant.** Config via env, logs to stdout, disposable processes.
- **Horizontal scaling first.** Vertical scaling only for stateful tiers.
- **Multi-AZ default;** multi-region required for Tier-1 products.
- **Backpressure.** Bounded queues; reject (429) when over capacity rather than collapse.
- **Idempotency.** All `POST` mutating endpoints accept `Idempotency-Key`.

---

## 10. Test Coverage Requirements

| Layer | Minimum line coverage | Notes |
|---|---|---|
| Domain / business logic | **90%** | Pure functions; cheap to cover |
| Application / use cases | **85%** | Mock infrastructure boundaries |
| Infrastructure adapters | **70%** | Integration tests preferred over unit |
| API handlers | **80%** | Contract tests required |
| Critical paths (auth, payments, clinical, audit) | **95%** + mutation testing | Mutation score ≥ 70% |

See [`testing_standards.md`](testing_standards.md) for type definitions and tooling.

---

## 11. Documentation Requirements

Every code change must update relevant docs:

- New service → `README.md`, OpenAPI spec, ADR, runbook in `docs/implementation/`.
- New API endpoint → OpenAPI updated, examples, error codes.
- New env var → `.env.example`, README, config doc.
- Behavior change → CHANGELOG entry (auto from Conventional Commits) + release notes.
- Architectural decision → ADR in `docs/adr/`.

See [`documentation_standards.md`](documentation_standards.md).

---

## 12. Security Baseline (every language)

- No secrets in code or logs.
- All inputs validated at boundaries.
- Parameterized queries only; no string-built SQL.
- AuthN via CyIdentity; AuthZ via policy engine — no ad-hoc checks.
- Dependencies scanned; Criticals block release.
- Crypto: only vetted libraries; never roll your own.
- See `docs/security/` once authored.
