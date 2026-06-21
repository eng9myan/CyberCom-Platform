# Reusable GitHub Actions Workflows — Specification

> **Status:** Specification — Program 0, Phase 0.5 (implementation in Program 1)
> **Owner:** DevOps Architect
> **Implements:** [`cicd_baseline`](../../../docs/implementation/cicd_baseline.md)

This folder holds the **reusable workflows** consumed by every CyberCom repository. Service repos call them via `workflow_call`. The implementation will land in Program 1; this README is the **contract** they must satisfy.

---

## 1. Workflow Catalog

| File | Purpose |
|---|---|
| `ci.yml` | Standard PR pipeline (lint, typecheck, tests, scans, build, sign, SBOM, provenance) |
| `release.yml` | Tag, release notes, publish, attach artifacts, GitOps PR open |
| `gitops-bump.yml` | Open a PR in the GitOps repo bumping an image digest |
| `terraform.yml` | Plan on PR, apply on merge, drift-detection schedule |
| `docs.yml` | Markdown lint, link check, spell check, ADR presence |
| `security-nightly.yml` | DAST baseline, image rescan, mutation tests, dependency freshness |
| `tenant-provision.yml` | Onboard a new tenant via control-plane API + IaC |
| `db-migrate.yml` | Run safe migration phases (additive → backfill → enforce) |
| `cleanup-preview.yml` | TTL-expire preview environments |

---

## 2. `ci.yml` — Contract

### 2.1 Inputs (`workflow_call`)

| Input | Type | Default | Notes |
|---|---|---|---|
| `language` | string | required | `python` \| `node` \| `go` \| `mixed` |
| `service_name` | string | required | Lowercase kebab-case |
| `tier` | number | required | 1–4 (per [`platform_engineering_baseline`](../../../docs/platforms/platform_engineering_baseline.md)) |
| `has_openapi` | boolean | `false` | Enable openapi-lint + contract tests |
| `has_ui` | boolean | `false` | Enable a11y + Playwright smoke |
| `build_image` | boolean | `true` | Build + scan + sign + SBOM |
| `coverage_min` | number | `80` | Aggregate gate (per-layer enforced in repo config) |
| `extra_steps` | string | `''` | Allow-listed extension hook (paths) |

### 2.2 Secrets / OIDC

- No long-lived secrets. Uses GitHub OIDC to assume cloud roles + registry tokens.
- Required `id-token: write` permission.

### 2.3 Jobs (must implement)

Mirrors [`cicd_baseline`](../../../docs/implementation/cicd_baseline.md) §3:

1. `setup` (checkout full history, restore caches)
2. `commitlint`
3. `lint`
4. `format-check`
5. `typecheck`
6. `unit-tests` (with coverage)
7. `coverage-gate` (diff-aware, no regression)
8. `secret-scan` (gitleaks + native)
9. `sast` (CodeQL — Python + TS)
10. `sca` (Trivy fs, pip-audit, npm audit)
11. `license-scan`
12. `openapi-lint` (`spectral`, `oasdiff`) — when `has_openapi`
13. `iac-scan` (`checkov`, `tflint`, `kubeconform`, `kube-linter`) — when IaC touched
14. `docker-build` — when `build_image`
15. `image-scan` (Trivy + Dockle) — when `build_image`
16. `integration-tests` (Testcontainers) — required on protected targets
17. `api-contract-tests` (Schemathesis) — when `has_openapi`
18. `accessibility-checks` (axe-core) — when `has_ui`
19. `e2e-smoke` (Playwright) — for `develop`/`release/*`/`main`
20. `smoke-perf` (k6) — for critical-tier endpoints
21. `sbom` (Syft → CycloneDX)
22. `sign` (cosign keyless via OIDC)
23. `provenance` (SLSA L3)
24. `docs-check`
25. `adr-check`
26. `pr-size-check`

### 2.4 Concurrency

```yaml
concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### 2.5 Outputs

- `image_digest` (when built)
- `sbom_uri`
- `provenance_uri`
- `coverage_pct`

---

## 3. `release.yml` — Contract

- Triggered by tag `v*.*.*` on `main` from a release PR.
- Verifies all G4 release exit criteria ([`quality_gates`](../../../docs/standards/quality_gates.md) §6).
- Generates changelog (release-please or equivalent).
- Publishes GitHub Release with: signed image digest list, SBOMs, SLSA provenance, OpenAPI bundle, Helm chart.
- Opens `gitops-bump.yml` PR against the GitOps repo for `stage` overlay.

---

## 4. `gitops-bump.yml` — Contract

- Inputs: `image`, `digest`, `chart_version`, `target_overlay` (`dev`/`test`/`stage`/`prod`).
- Opens a PR in the GitOps repo (or `infrastructure/gitops/`) editing the overlay values.
- Auto-merges for `dev` when prior gate passed; manual review for higher envs.

---

## 5. `terraform.yml` — Contract

- PR: `fmt`, `validate`, `lint` (tflint), `checkov`, `plan` — posts plan as PR comment.
- Merge to `main`: `apply` using stored plan, OIDC-assumed role per env.
- Scheduled (nightly): `plan` per env; non-empty diff opens issue.
- Forbidden: `apply` from non-CI contexts; long-lived cloud keys.

---

## 6. `docs.yml` — Contract

- `markdownlint-cli2`, `lychee` (link check), `cspell` (spell check).
- ADR-presence check for PRs touching architecture-tagged paths.
- Fails on broken links, lint errors, unknown dictionary words.

---

## 7. `security-nightly.yml` — Contract

- DAST baseline (OWASP ZAP) against `dev` + `staging`.
- Image rescan (Trivy) for new CVE disclosures since build.
- Mutation tests on Tier-1 critical paths.
- Dependency freshness report.
- Opens issues for findings; routes Critical/High to security backlog.

---

## 8. `tenant-provision.yml` — Contract

- Input: tenant spec (name, tier, region, residency, BYOK?).
- Calls control-plane API + Terraform pipeline.
- Outputs: realm, namespaces, DBs, secrets paths, dashboards, on-call entries.
- Fails on policy violation (residency / quota).

---

## 9. `db-migrate.yml` — Contract

- Phases: `plan` → `apply-additive` → `backfill` → `apply-enforce`.
- Locks: per service + per environment.
- Safety: long-running DDL flagged; `CONCURRENTLY` for indexes; timeouts enforced.
- Failure: blocks promotion to next env.

---

## 10. `cleanup-preview.yml` — Contract

- Scheduled hourly + on PR close.
- Destroys preview envs past TTL.
- Audits all destructions.

---

## 11. Cross-cutting Requirements

- All workflows pin `actions/*` by **commit SHA** (not floating tags).
- All workflows have `permissions:` declared minimally.
- All workflows have `timeout-minutes` set.
- `self-hosted` runners only for explicit, documented cases; ephemeral and isolated.
- Caching keyed by lockfile hash; never by branch name alone.
- Each workflow exports timing metrics → Prometheus.

---

## 12. Implementation Sequence (Program 1)

1. `ci.yml` (Python + Node variants under one entry).
2. `terraform.yml` + branch-protection Terraform module (`infrastructure/terraform/github/`).
3. `docs.yml`.
4. `gitops-bump.yml` (paired with Argo CD bootstrap).
5. `release.yml`.
6. `security-nightly.yml`.
7. `db-migrate.yml`.
8. `tenant-provision.yml`.
9. `cleanup-preview.yml`.
