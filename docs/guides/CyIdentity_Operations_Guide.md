# CyIdentity Operations Guide

**Program:** 2.1 — CyIdentity Foundation  
**Date:** 2026-06-22  
**Audience:** SRE / Platform Engineering  
**ADRs:** ADR-0005, ADR-0017, ADR-0035

---

## 1. Deployment Architecture

CyIdentity consists of two layers:

| Layer | Component | Technology |
|---|---|---|
| Protocol layer | Keycloak 24 | Java, Quarkus |
| Control plane | `platform.cyidentity` Django app | Python 3.12, Django 5 |

Both layers must be healthy for identity functions to work.

### 1.1 Keycloak HA Topology

- Active-active across 2+ nodes (ADR-0005 §7.1 Risk-1)
- Infinispan distributed cache for sessions
- PostgreSQL 16 as Keycloak database (separate from the control-plane database)
- Home region: `me-central-1` (primary), `me-west-1` (DR)

---

## 2. Health Monitoring

### 2.1 Control plane health

```bash
curl https://api.cybercom.io/api/v1/identity/healthz/
# Expected: {"status": "ok", ...}
```

### 2.2 Keycloak health

```bash
curl http://keycloak:8080/health/ready
curl http://keycloak:8080/health/live
```

### 2.3 Prometheus metrics

```bash
curl https://api.cybercom.io/api/v1/identity/metrics
```

Key metrics to alert on:

| Metric | Alert Condition |
|---|---|
| `cybercom_identity_login_failure_total` | Rate > 50/min per realm |
| `cybercom_identity_mfa_failure_total` | Rate > 20/min |
| `cybercom_identity_jwks_serve_stale_total` | Count > 0 (Keycloak JWKS unreachable) |
| `cybercom_identity_break_glass_activated_total` | Any activation (PagerDuty) |
| `cybercom_identity_session_revoked_total` | Sudden spike |

---

## 3. Celery Task Operations

```bash
# Check Celery worker status
celery -A cybercom inspect active

# Trigger break-glass expiry manually
celery -A cybercom call cyidentity.expire_break_glass

# Trigger idle timeout enforcement
celery -A cybercom call cyidentity.enforce_idle_timeout

# Rotate a specific client secret
celery -A cybercom call cyidentity.rotate_client_secret --args='["cymed-portal", "ops@cybercom.io"]'
```

---

## 4. JWKS Cache Operations

JWKS is cached in Redis for 5 minutes with a 60-minute stale-while-error window.

```bash
# Force JWKS refresh (clear Redis cache)
redis-cli del "cyidentity:jwks:*"

# Monitor stale JWKS serves
watch 'curl -s https://api.cybercom.io/api/v1/identity/metrics | grep jwks'
```

---

## 5. Realm Lifecycle Operations

### 5.1 Provision a new tenant realm (via API)

```bash
curl -X POST https://api.cybercom.io/api/v1/identity/realms/provision/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid-here",
    "realm_name": "hospital-x",
    "realm_type": "customer",
    "display_name": "Hospital X",
    "mfa_methods": ["webauthn"],
    "home_region": "me-central-1"
  }'
```

### 5.2 Suspend a realm

```bash
curl -X POST https://api.cybercom.io/api/v1/identity/realms/{id}/suspend/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"reason": "billing_hold"}'
```

---

## 6. Secret Rotation Schedule

Client secrets rotate quarterly (90 days). The rotation Celery task can be scheduled via Celery Beat:

```python
# celery_config.py
CELERYBEAT_SCHEDULE = {
    "expire-break-glass": {
        "task": "cyidentity.expire_break_glass",
        "schedule": 300,  # every 5 minutes
    },
    "enforce-idle-timeout": {
        "task": "cyidentity.enforce_idle_timeout",
        "schedule": 900,  # every 15 minutes
    },
}
```

---

## 7. Break-Glass Emergency Operations

### 7.1 Identify active break-glass sessions

```bash
curl https://api.cybercom.io/api/v1/identity/break-glass/?status=active \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 7.2 Force-revoke a break-glass session

```bash
curl -X POST https://api.cybercom.io/api/v1/identity/break-glass/{id}/revoke/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 7.3 Post-event review

All break-glass accesses must have `post_review_notes` completed within 24 hours. Query open reviews:

```sql
SELECT id, user_id, reason, activated_at, expires_at
FROM platform_break_glass_accesses
WHERE status IN ('expired', 'revoked')
  AND post_review_completed_at IS NULL
  AND activated_at < NOW() - INTERVAL '24 hours';
```

---

## 8. Session Management

### 8.1 Revoke all sessions for a compromised user

```bash
curl -X POST https://api.cybercom.io/api/v1/identity/sessions/enforce-idle-timeout/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Or revoke specific session:

```bash
curl -X POST https://api.cybercom.io/api/v1/identity/sessions/{session_id}/revoke/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"reason": "security_incident"}'
```

---

## 9. Audit Log Retention

All login events write to both `platform_login_audits` and the platform-wide `platform_audit_logs`.

- `platform_login_audits`: 90-day hot storage
- `platform_audit_logs`: 7-year cold archive (per compliance requirements)

Retention policy enforced by PostgreSQL partition pruning (see `database_standards.md`).

---

## 10. Runbook — Keycloak Outage

If Keycloak goes down:

1. JWKS cache serves stale keys for up to 60 minutes (graceful degradation)
2. New logins fail — users see error; existing valid tokens still accepted
3. Alert: `cybercom_identity_jwks_serve_stale_total > 0`
4. Recovery: Keycloak auto-restarts via Kubernetes `restartPolicy: Always`
5. If Keycloak disk corruption: restore from most recent PostgreSQL snapshot
6. Post-recovery: `redis-cli del "cyidentity:jwks:*"` to force JWKS refresh

---

## 11. Database Migrations

```bash
cd backend
python manage.py makemigrations platform_cyidentity
python manage.py migrate platform_cyidentity
```

All migrations are backwards-compatible (additive-only for deployed realms).
