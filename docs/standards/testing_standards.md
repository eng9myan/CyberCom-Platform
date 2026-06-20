# Testing Standards

> **Status:** Approved — Program 0, Phase 0.3
> **Owner:** QA Architect

Defines the test types, tools, scope, coverage, and quality bars for all CyberCom code.

---

## 1. Test Pyramid

```
            ▲
           / \      e2e          (few, slow, brittle, high-value)
          /---\
         / API \    contract & API tests
        /-------\
       /   int   \  integration  (with real adapters)
      /-----------\
     /   unit      \  unit       (many, fast, deterministic)
    /---------------\
```

Rule of thumb: **~70% unit, ~20% integration, ~10% e2e** by count.

---

## 2. Test Types

### 2.1 Unit Tests
- Test a single function, class, or component in isolation.
- All external dependencies mocked/stubbed.
- Must be **deterministic** and run in **< 100 ms** per test.
- Tools:
  - Python: **`pytest`** + `pytest-mock`, `hypothesis` for property-based.
  - TypeScript / React: **Vitest** + Testing Library.
  - React Native: Vitest/Jest + RN Testing Library.

### 2.2 Integration Tests
- Test a component **with real adapters** (real DB, real Redis, real broker via Testcontainers).
- Scope: a single service, end-to-end internally.
- Tools:
  - Python: `pytest` + **Testcontainers-Python** (Postgres, Redis, RabbitMQ).
  - TS: Vitest + Testcontainers / msw for HTTP.
- Run in CI on every PR; tagged `@integration`.

### 2.3 API Tests
- Verify HTTP API behavior against the **OpenAPI spec**.
- Contract tests using **Schemathesis** (Python) or **Dredd** / generated clients.
- Includes auth, pagination, error envelope, idempotency, rate-limit behavior.
- A failing contract test blocks the PR.

### 2.4 End-to-End (E2E) Tests
- Browser/UI through real backend in a disposable environment.
- Tools: **Playwright** (web, Electron renderer), **Detox** or Maestro (React Native).
- Cover **critical user journeys** only — not every form.
- Run on every PR to `develop`/`release/*`, nightly on `main`.

### 2.5 Performance Tests
- Tools: **k6** or **Locust** — scripts under `tests/perf/`.
- Smoke perf test in CI per PR (≤ 2 min).
- Full load test weekly + before each release.
- Regression budget: > 10% p99 latency increase on critical paths fails the release.

### 2.6 Security Tests
- SAST: **CodeQL** (mandatory CI).
- SCA: Dependabot + **Trivy** (deps + container).
- Secret scanning: native GitHub + **Gitleaks**.
- DAST: **OWASP ZAP** baseline scan in nightly.
- Container/Image scan: Trivy on every build.
- Periodic penetration test per release train (Tier-1 products).

### 2.7 Accessibility Tests
- Automated: `axe-core` via Playwright; `eslint-plugin-jsx-a11y` at lint stage.
- Manual: screen-reader smoke on critical journeys per release.

### 2.8 Resilience / Chaos Tests
- Game days quarterly; targeted fault injection in staging.
- Tools: **Litmus** or **Chaos Mesh** on Kubernetes.

### 2.9 Mutation Tests
- Tools: **mutmut** / **Cosmic Ray** (Python), **Stryker** (TS).
- Required for **Tier-1 critical paths** (auth, billing, clinical, audit) with mutation score ≥ 70%.

---

## 3. Coverage Requirements

Mirrors [`coding_standards.md`](coding_standards.md) §10.

| Layer | Min line coverage | Min branch coverage |
|---|---|---|
| Domain | 90% | 85% |
| Application | 85% | 80% |
| Infrastructure | 70% | 60% |
| API handlers | 80% | 75% |
| UI components (logic) | 80% | 70% |
| Critical paths | 95% + mutation ≥ 70% | 90% |

- Coverage measured by **`pytest-cov`** / **Vitest coverage** (v8 provider).
- New code in a PR must meet its layer threshold; aggregate cannot regress.
- HTML coverage report uploaded to CI artifacts.

---

## 4. Test Data

- **Factories** (`factory_boy`, `@mswjs/data`) over fixtures.
- No production data in tests. Synthetic data only.
- PHI/PII in test fixtures must be obviously fake (`Test_Patient_001`).
- Tenant-scoped tests must verify cross-tenant isolation (negative cases).

---

## 5. Test Environments

| Env | Purpose | Data | Refresh |
|---|---|---|---|
| `local` | Dev loop | Seed scripts | On demand |
| `ci` | PR pipeline | Ephemeral via Testcontainers | Per job |
| `dev` | Always-on integration | Synthetic, freely mutable | Daily reset |
| `staging` | Pre-prod | Synthetic, prod-like volume | Weekly |
| `prod` | Production | Real | n/a |

E2E runs target `ci` (ephemeral) or `dev` (long-lived) — never `prod`.

---

## 6. Test Naming

- Pattern: `should_<expected>_when_<condition>` or `test_<unit>__<scenario>__<expectation>`.
- Examples:
  - `test_patient_service__create__sets_tenant_from_context`
  - `should_return_409_when_idempotency_key_reused`

---

## 7. Test Structure (AAA / Given-When-Then)

```python
def test_patient_admission_emits_event(patient_factory, event_bus_spy):
    # given
    patient = patient_factory(status="registered")

    # when
    admit_patient(patient.id, ward_id=ward.id)

    # then
    assert event_bus_spy.published("cymed.patient.admitted")
```

---

## 8. Flakiness Policy

- A flaky test is a **bug**. Fix or **quarantine** within 24 h.
- Quarantine label `@flaky`; excluded from blocking CI but tracked.
- Two-strike rule: tests flaky in two consecutive weeks are deleted unless an owner re-stabilizes them.

---

## 9. CI Integration

Every PR runs:
1. Lint + format
2. Type check
3. Unit tests + coverage gate
4. Integration tests (Testcontainers)
5. API contract tests
6. Security scans (SAST, SCA, secrets)
7. License scan
8. Smoke perf test (critical APIs)
9. E2E (smoke subset)
10. Docs check (links, ADR presence where required)

Full e2e + chaos + full perf run nightly on `main` and on each `release/*`.

---

## 10. Release Test Plan

For every release (`vX.Y.Z`):
- [ ] All required CI checks green on the release commit.
- [ ] Full e2e suite green.
- [ ] Full perf suite within budget.
- [ ] DAST baseline scan clean.
- [ ] Manual exploratory test session logged in `docs/implementation/releases/`.
- [ ] Accessibility check on changed flows.
- [ ] Rollback rehearsal performed.

---

## 11. Forbidden

- Tests that hit production or third-party services without recording (use **VCR** / `nock` / `msw`).
- `time.sleep` / arbitrary waits — use polling with timeout.
- Shared mutable state across tests.
- Snapshot tests as the **only** assertion — pair with explicit behavioral assertions.
- Disabling tests without an issue link and a deadline.
