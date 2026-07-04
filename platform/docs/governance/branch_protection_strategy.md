# Branch Protection Strategy

> **Status:** Approved — Program 0, Phase 0.2
> **Owner:** DevOps Architect + Security Architect

This document specifies the exact GitHub branch-protection configuration to apply to every protected branch. It is the **executable spec** for `gh api` calls, Terraform `github_branch_protection`, or manual UI setup.

---

## 1. Protected Branches

| Branch | Tier |
|---|---|
| `main` | **Tier 1 — Maximum** |
| `release/*` | **Tier 1 — Maximum** |
| `develop` | **Tier 2 — High** |
| `architecture` | **Tier 2 — High** |
| `platform` | **Tier 2 — High** |
| `erp-core` | **Tier 2 — High** |
| `cymed` | **Tier 2 — High** |
| `mobile` | **Tier 2 — High** |
| `website` | **Tier 3 — Standard** |

Transient branches (`feat/*`, `fix/*`, `hotfix/*`, `docs/*`, `chore/*`) are **not** protected, but inherit org-level secret scanning and push protection.

---

## 2. Protection Settings by Tier

### 2.1 Tier 1 — Maximum (`main`, `release/*`)

| Setting | Value |
|---|---|
| Require pull request before merging | ✅ |
| Required approving reviews | **2** |
| Dismiss stale reviews on new commits | ✅ |
| Require review from CODEOWNERS | ✅ |
| Require approval of the most recent reviewable push | ✅ |
| Require status checks to pass | ✅ (all required checks — see §3) |
| Require branches to be up to date | ✅ |
| Require conversation resolution | ✅ |
| Require signed commits | ✅ |
| Require linear history | ✅ |
| Require deployment to succeed (where applicable) | ✅ |
| Restrict who can push | Release Manager + Chief Architect only |
| Allow force pushes | ❌ |
| Allow deletions | ❌ |
| Lock branch | ❌ (until release frozen) |
| Block creations | ❌ |

### 2.2 Tier 2 — High (`develop`, `architecture`, `platform`, `erp-core`, `cymed`, `mobile`)

| Setting | Value |
|---|---|
| Require pull request before merging | ✅ |
| Required approving reviews | **2** (`develop`, `architecture`) / **1** (others) |
| Dismiss stale reviews on new commits | ✅ |
| Require review from CODEOWNERS | ✅ |
| Required status checks | All required checks (see §3) |
| Require branches to be up to date | ✅ |
| Require conversation resolution | ✅ |
| Require signed commits | ✅ |
| Require linear history | ✅ |
| Restrict who can push | Domain owners |
| Allow force pushes | ❌ |
| Allow deletions | ❌ |

### 2.3 Tier 3 — Standard (`website`)

| Setting | Value |
|---|---|
| Require pull request before merging | ✅ |
| Required approving reviews | **1** |
| Require review from CODEOWNERS | ✅ |
| Required status checks | Lint, build, basic security |
| Require branches to be up to date | ✅ |
| Require conversation resolution | ✅ |
| Require signed commits | ✅ (target) |
| Allow force pushes | ❌ |
| Allow deletions | ❌ |

---

## 3. Required Status Checks (target state)

Apply as required checks once the corresponding workflows exist in `.github/workflows/`:

| Check | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|
| `lint` | ✅ | ✅ | ✅ |
| `commitlint` (Conventional Commits) | ✅ | ✅ | ✅ |
| `unit-tests` | ✅ | ✅ | ✅ |
| `integration-tests` | ✅ | ✅ | optional |
| `e2e-tests` | ✅ | optional | optional |
| `sast` (CodeQL) | ✅ | ✅ | ✅ |
| `sca` (dependency vulns) | ✅ | ✅ | ✅ |
| `secret-scan` | ✅ | ✅ | ✅ |
| `license-scan` | ✅ | ✅ | optional |
| `iac-scan` (when IaC changed) | ✅ | ✅ | n/a |
| `sbom` | ✅ | optional | optional |
| `docs-check` (ADRs, link rot) | ✅ | ✅ | optional |

---

## 4. Repository-Level Settings

- **Default branch:** `main`
- **Merge button options:** Squash only (Tier 2/3); Merge commit only for Tier 1 (release/hotfix promotion).
- **Auto-delete head branches:** ✅
- **Web-flow signed commits:** ✅
- **Vulnerability alerts:** ✅
- **Dependabot:** ✅ (security + version)
- **Secret scanning + push protection:** ✅
- **Private vulnerability reporting:** ✅
- **Discussions:** ✅
- **Wikis:** ❌ (use `/docs`)
- **Projects:** ✅

---

## 5. Org-Level Recommendations

- Enforce 2FA (preferably hardware keys) for all members.
- Require SSO for the org.
- Restrict GitHub Apps to a vetted allowlist.
- Disable forking of private repos (when private repos are added).
- OIDC for cloud deployments — no long-lived cloud credentials in Actions.

---

## 6. Bypass Policy

No standing bypass. Emergency bypass requires:
1. Verbal approval from Chief Architect + Security Architect.
2. Recorded incident ticket.
3. Post-incident review within 5 business days.
4. Bypass logs reviewed monthly.

---

## 7. Apply Order

When provisioning:
1. Create the branch (empty commit or branch-from-`main`).
2. Apply CODEOWNERS coverage for the branch's paths.
3. Configure status-check workflows (so they appear in the required-checks dropdown).
4. Apply branch protection rules.
5. Verify by attempting a deliberately-failing PR.

---

## 8. Drift Detection

- Branch-protection configuration MUST be expressed as code (Terraform or GitHub CLI scripts) under `infrastructure/github/`.
- A scheduled workflow MUST diff actual settings vs. declared settings and alert on drift.
