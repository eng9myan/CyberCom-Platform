# Quality Gates

> **Status:** Approved — Program 0, Phase 0.3
> **Owner:** QA Architect + DevOps Architect + Security Architect

This document defines the **minimum bars a change must clear before it may merge** and before a release may ship. Every bar maps to an automated CI check where possible; manual gates are listed explicitly with the responsible role.

A PR is mergeable **only when every applicable gate is green**. A release ships **only when every release gate is green**.

---

## 1. Gate Tiers

| Tier | Triggered by |
|---|---|
| **G0 — Pre-commit** | Local commit (developer machine) |
| **G1 — PR open** | Every PR to any branch |
| **G2 — Pre-merge (protected)** | PRs targeting protected branches |
| **G3 — Nightly** | Scheduled runs on `main` and `release/*` |
| **G4 — Release** | Release PRs and pre-tag verification |
| **G5 — Production** | Post-deploy smoke + monitoring |

---

## 2. G0 — Pre-commit (developer machine)

Enforced by `pre-commit` hooks. CI re-runs these to catch bypasses.

- [ ] Conventional Commits message format (`commitlint`)
- [ ] Formatter (Ruff format / Prettier) — no diff
- [ ] Linter (Ruff / ESLint) — zero errors
- [ ] Type check (mypy --strict / `tsc --noEmit`) — zero errors
- [ ] Secret scan (`gitleaks protect`) — zero hits
- [ ] Large-file check (>5 MB rejected; use LFS)
- [ ] EOF newline + trailing-whitespace fixes applied

---

## 3. G1 — PR open (every PR)

Required status checks on every PR:

| # | Check | Owner | Blocking |
|---|---|---|---|
| 1 | `commitlint` (PR title + commits) | Tooling | ✅ |
| 2 | `lint` (Ruff / ESLint) | Tooling | ✅ |
| 3 | `format-check` | Tooling | ✅ |
| 4 | `typecheck` (mypy / tsc) | Tooling | ✅ |
| 5 | `unit-tests` | Tooling | ✅ |
| 6 | `coverage-gate` (per-layer thresholds, no regression) | Tooling | ✅ |
| 7 | `secret-scan` (gitleaks + GitHub native) | Security | ✅ |
| 8 | `sast` (CodeQL) | Security | ✅ |
| 9 | `sca` (Trivy / pip-audit / npm audit) | Security | ✅ — High/Critical block |
| 10 | `license-scan` | Legal/Tooling | ✅ |
| 11 | `markdown-lint` + `link-check` (docs touched) | Docs | ✅ when docs changed |
| 12 | `openapi-lint` (`spectral`) + `oasdiff` (breaking-change) | API | ✅ when spec changed |
| 13 | `iac-scan` (`checkov` / `tflint` / `kubeconform`) | DevOps | ✅ when IaC changed |
| 14 | `image-scan` (Trivy on built image) | DevOps | ✅ when Dockerfile/image changed |
| 15 | `pr-size-check` | QA | ⚠️ warns at > 600 LOC; requires justification at > 1 000 |
| 16 | `adr-check` | Architecture | ✅ when `architecture` label or paths matched |

---

## 4. G2 — Pre-merge to protected branches

Adds to G1, per [`branch_protection_strategy.md`](../governance/branch_protection_strategy.md):

| # | Check | Notes |
|---|---|---|
| 17 | `integration-tests` (Testcontainers) | Required for code branches |
| 18 | `api-contract-tests` (Schemathesis vs OpenAPI) | Required when API touched |
| 19 | `accessibility-checks` (axe-core via Playwright) | Required when UI touched |
| 20 | `smoke-perf` (k6) | Required for critical-tier endpoints |
| 21 | `e2e-smoke` (Playwright critical journeys) | Required for `develop`, `release/*`, `main` |
| 22 | `sbom` generation + diff | Required for `main`, `release/*` |
| 23 | **CODEOWNERS approvals** | Tier-1: 2; Tier-2: 1–2 per branch |
| 24 | **Conversation resolution** | All threads resolved |
| 25 | **Signed commits** | Required (where supported) |
| 26 | **Linear history** | No merge commits except release/hotfix |
| 27 | **Branch up to date** | Rebase required |

---

## 5. G3 — Nightly

Runs against the tip of `main` and each active `release/*`:

- [ ] Full e2e suite (all journeys, multi-browser)
- [ ] Full perf suite vs. baseline (regression budget enforced)
- [ ] DAST baseline scan (OWASP ZAP)
- [ ] Mutation tests on Tier-1 critical paths (score ≥ 70%)
- [ ] Container image rescan (new CVE disclosures)
- [ ] Dependency freshness report
- [ ] Documentation link & spell check repo-wide
- [ ] Branch-protection drift detection

Failures open issues; consecutive failures escalate to Technical PM.

---

## 6. G4 — Release

Per [`release_management.md`](../governance/release_management.md). All G1–G3 green plus:

- [ ] All required CI checks pass on the release commit
- [ ] Zero open Sev-1/Sev-2 bugs in scope
- [ ] Security scans clean (no Critical/High unresolved)
- [ ] SBOM generated, signed, and attached to the release
- [ ] Release notes published and reviewed
- [ ] Rollback plan documented and rehearsed
- [ ] Compliance review complete (healthcare/government scope)
- [ ] Approval matrix satisfied (Release Manager, Chief Architect, Security, QA, affected Domain Leads)
- [ ] Performance regression < 10% on critical paths vs prior release
- [ ] Migrations reviewed; long-running DDL pre-staged where applicable

---

## 7. G5 — Production (post-deploy)

Within 30 minutes of deploy:
- [ ] Health checks green on all replicas
- [ ] Error-rate SLO holding (p99 ≤ baseline + 10%)
- [ ] Latency SLO holding
- [ ] No new Sev-1 alerts
- [ ] Smoke test job green
- [ ] Synthetic monitors green

Within 72 hours:
- [ ] No rollback triggered
- [ ] Heightened-watch window concluded without incident

If any prod gate fails → automatic rollback per runbook.

---

## 8. Coverage Gate Detail

The `coverage-gate` check (G1 #6) enforces, per [`testing_standards.md`](testing_standards.md) §3:

| Layer | Line | Branch | Critical-path mutation |
|---|---|---|---|
| Domain | ≥ 90% | ≥ 85% | n/a |
| Application | ≥ 85% | ≥ 80% | n/a |
| Infrastructure | ≥ 70% | ≥ 60% | n/a |
| API handlers | ≥ 80% | ≥ 75% | n/a |
| UI logic | ≥ 80% | ≥ 70% | n/a |
| Critical (auth/billing/clinical/audit) | ≥ 95% | ≥ 90% | ≥ 70% |

**Rule:** new code in the diff must meet its layer threshold; **aggregate may not regress** more than 0.5 pp.

---

## 9. Bypass Policy

Quality gates may **not** be bypassed in normal operation.

Emergency bypass requires:
1. Sev-1 production incident with documented user impact.
2. Verbal approval from Chief Architect + Security Architect.
3. Issue opened citing the bypass.
4. Post-incident review within 5 business days, including a permanent fix to prevent recurrence.
5. Bypass logs reviewed monthly.

---

## 10. Metrics

Tracked weekly by the Technical PM:
- PR cycle time (open → merge)
- Gate failure rate per check
- Flaky-test rate
- Coverage trend per service
- Escape defects per release
- Rollback rate
- Mean time to recover (MTTR)

These metrics drive continuous improvement of the gates themselves (review cadence: quarterly).
