# Production Go-Live Checklist — CyberCom Platform
**Program 10, Phase 6 — Operational Readiness**  
**Date:** 2026-06-29

---

## Instructions

Complete every item before authorizing production go-live. Items marked **[BLOCKER]** must be PASS before go-live. Items marked **[WARNING]** must be resolved within 30 days post go-live.

---

## Phase 1: Infrastructure Readiness

| # | Item | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1.1 | Kubernetes cluster provisioned and healthy | IT | ☐ | `kubectl get nodes` — all Ready |
| 1.2 | PostgreSQL cluster with replication | IT | ☐ | Primary + replica |
| 1.3 | Redis cluster with replication | IT | ☐ | Sentinel or Cluster mode |
| 1.4 | TLS certificates provisioned | IT | ☐ | Valid, trusted CA |
| 1.5 | DNS entries propagated | IT | ☐ | api., portal., fhir. subdomains |
| 1.6 | HashiCorp Vault cluster running | IT | ☐ | Unseal + token ready |
| 1.7 | CDN / WAF configured | IT | ☐ | Rate limiting at edge |
| 1.8 | VPN / network segmentation | IT | ☐ | Production network isolated |
| 1.9 | Load balancer health checks configured | IT | ☐ | `/health/` endpoint |
| 1.10 | **[BLOCKER]** All Helm releases healthy | DevOps | ☐ | `helm status cybercom` |

---

## Phase 2: Application Deployment

| # | Item | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 2.1 | **[BLOCKER]** All Docker images from release tag (not `latest`) | DevOps | ☐ | Pin image digests |
| 2.2 | **[BLOCKER]** All database migrations applied | DevOps | ☐ | `python manage.py migrate --check` |
| 2.3 | **[BLOCKER]** Celery workers running | DevOps | ☐ | At least 2 workers |
| 2.4 | Celery beat (scheduler) running | DevOps | ☐ | Periodic tasks enabled |
| 2.5 | **[BLOCKER]** API health returns HTTP 200 | DevOps | ☐ | `/health/` endpoint |
| 2.6 | FHIR endpoint returns CapabilityStatement | DevOps | ☐ | `/fhir/R4/metadata` |
| 2.7 | Static assets served (or CDN) | DevOps | ☐ | |
| 2.8 | Email (SMTP) notification functional | DevOps | ☐ | Send test email |
| 2.9 | SMS notification functional (if enabled) | DevOps | ☐ | |

---

## Phase 3: Security Validation

| # | Item | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 3.1 | **[BLOCKER]** Production secrets in Vault (not .env files) | CISO | ☐ | Audit environment variables |
| 3.2 | **[BLOCKER]** No DEBUG=True in production | DevOps | ☐ | |
| 3.3 | **[BLOCKER]** Tenant isolation enforced (reject requests without X-Tenant-ID) | Dev | ☐ | Test with `validate_production_readiness.py` |
| 3.4 | **[BLOCKER]** MFA enforced for admin accounts | CISO | ☐ | Keycloak realm policy |
| 3.5 | Security headers set (HSTS, CSP, X-Frame-Options) | IT | ☐ | Check via Nginx config |
| 3.6 | Rate limiting active (429 on burst) | Dev | ☐ | Test with `validate_production_readiness.py` |
| 3.7 | Audit trail operational | Dev | ☐ | POST → check audit log |
| 3.8 | OPA policy server accessible from API | DevOps | ☐ | |
| 3.9 | gitleaks pre-commit scan clean | Dev | ☐ | No secrets in repo |
| 3.10 | [WARNING] Penetration test completed | CISO | ☐ | Schedule if not done |
| 3.11 | JWT short TTL (≤15 min access token) | Dev | ☐ | Keycloak realm settings |
| 3.12 | Refresh token rotation enabled | Dev | ☐ | Keycloak realm settings |

---

## Phase 4: Data & Licensing

| # | Item | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 4.1 | **[BLOCKER]** Active license installed and valid | Sales/IT | ☐ | Check via API `/api/v1/commercial-readiness/licenses/` |
| 4.2 | **[BLOCKER]** License features match facility type | Sales | ☐ | |
| 4.3 | **[BLOCKER]** Production tenant provisioned | IT | ☐ | Not demo tenant |
| 4.4 | Demo data removed (if production environment) | IT | ☐ | |
| 4.5 | Drug interaction database loaded (licensed) | Clinical | ☐ | BLOCKER if pharmacy enabled |
| 4.6 | Formulary configured by pharmacist | Clinical | ☐ | |
| 4.7 | Critical value thresholds configured by lab director | Clinical | ☐ | |
| 4.8 | User accounts created for all staff | IT | ☐ | |
| 4.9 | Role assignments verified | IT | ☐ | |

---

## Phase 5: Clinical Configuration

| # | Item | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 5.1 | **[BLOCKER]** Drug interaction engine active | Clinical | ☐ | Test with known interaction |
| 5.2 | **[BLOCKER]** Drug allergy check active | Clinical | ☐ | Test with known allergy |
| 5.3 | ICD-11 terminology loaded | Clinical | ☐ | Or offline cache populated |
| 5.4 | LOINC codes available for lab tests | Clinical | ☐ | |
| 5.5 | Department codes configured | Admin | ☐ | |
| 5.6 | Ward/bed configuration | Admin | ☐ | Hospital only |
| 5.7 | Referring physician directory | Admin | ☐ | |

---

## Phase 6: Monitoring & Observability

| # | Item | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 6.1 | Prometheus metrics endpoint active | DevOps | ☐ | `/metrics` returns data |
| 6.2 | Grafana dashboards imported | DevOps | ☐ | API latency, error rate, DB |
| 6.3 | Alert rules configured (PagerDuty / OpsGenie) | DevOps | ☐ | P1 pager alert |
| 6.4 | Log aggregation active (ELK / Loki) | DevOps | ☐ | |
| 6.5 | Error tracking active (Sentry / equivalent) | Dev | ☐ | |
| 6.6 | Database backup job scheduled | IT | ☐ | Daily backup confirmed |
| 6.7 | Backup restore tested | IT | ☐ | Restore to staging verified |
| 6.8 | DR runbook documented | IT | ☐ | RTO/RPO targets set |

---

## Phase 7: Compliance & Legal

| # | Item | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 7.1 | [WARNING] Data Processing Agreement signed | Legal | ☐ | Per GDPR/PDPL |
| 7.2 | [WARNING] Business Associate Agreement signed (US) | Legal | ☐ | HIPAA requirement |
| 7.3 | Privacy policy published | Legal | ☐ | |
| 7.4 | Terms of service accepted by customer | Legal | ☐ | |
| 7.5 | Incident response plan communicated | CISO | ☐ | |
| 7.6 | Data breach notification procedure agreed | CCO | ☐ | |

---

## Phase 8: Training & Acceptance

| # | Item | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 8.1 | **[BLOCKER]** All clinical staff trained | CS | ☐ | Sign-off required |
| 8.2 | **[BLOCKER]** IT staff trained | CS | ☐ | |
| 8.3 | **[BLOCKER]** UAT acceptance criteria all passed | CS + Customer | ☐ | See Customer_Acceptance_Report.md |
| 8.4 | **[BLOCKER]** Customer sign-off on Customer_Acceptance_Report.md | Customer | ☐ | |
| 8.5 | Hypercare team briefed and on standby | CS | ☐ | |
| 8.6 | Rollback procedure tested in staging | DevOps | ☐ | `./scripts/pilot/rollback.sh --dry-run` |
| 8.7 | Escalation contacts distributed to customer | CS | ☐ | |

---

## Go-Live Authorization

All BLOCKER items must be marked ☑ before this form can be signed:

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Release Manager | | | |
| CISO | | | |
| CMIO | | | |
| Customer CIO | | | |

**Production go-live authorized:** ☐ YES  ☐ NO

**Go-live date/time (UTC):** _______________

---

## Post Go-Live — Day 1 Checks

Run within 1 hour of go-live:

```bash
python scripts/validation/validate_production_readiness.py \
  --api-url https://api.cy-com.com \
  --token <PROD_ADMIN_TOKEN> \
  --tenant-id <PROD_TENANT_UUID>
```

All checks must PASS. Any new FAIL = escalate immediately to DevOps on-call.
