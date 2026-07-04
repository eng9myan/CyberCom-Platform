# CyberCom Tenant Framework Operations Guide

**Program:** 2.2 — Multi-Tenant Framework  
**Date:** 2026-06-22  
**Audience:** SRE / Platform Engineering  
**ADRs:** ADR-0002, ADR-0012

---

## 1. Service Health

```bash
curl https://api.cybercom.io/api/v1/tenants/healthz/
# {"status": "ok", "active_tenants": 42}

curl https://api.cybercom.io/api/v1/tenants/metrics
```

---

## 2. Prometheus Alerts

| Metric | Alert Condition |
|---|---|
| `cybercom_tenant_tenant_provisioned_total` | Monitor ramp-up rate |
| `cybercom_tenant_tenant_suspended_total` | Spike may indicate billing issues |
| `cybercom_tenant_tenant_terminated_total` | Any termination → notify account team |
| `cybercom_tenant_domain_verified_total` | Track onboarding progress |
| `cybercom_tenant_realm_mapped_total` | Should match provisioned_total |

---

## 3. Celery Task Operations

```bash
# Check task worker status
celery -A cybercom inspect active

# Manually trigger subscription expiry check
celery -A cybercom call tenant.check_subscription_expiry

# Trigger feature flag expiry sweep
celery -A cybercom call tenant.expire_feature_flags

# Trigger license expiry check
celery -A cybercom call tenant.check_license_expiry

# Re-sync a specific tenant's realm mapping
celery -A cybercom call tenant.sync_realm_mapping --args='["<tenant-uuid>"]'
```

Celery Beat schedule:
```python
CELERYBEAT_SCHEDULE = {
    "tenant-subscription-expiry": {
        "task": "tenant.check_subscription_expiry",
        "schedule": 86400,  # daily
    },
    "tenant-feature-flag-expiry": {
        "task": "tenant.expire_feature_flags",
        "schedule": 3600,  # hourly
    },
    "tenant-license-expiry": {
        "task": "tenant.check_license_expiry",
        "schedule": 86400,  # daily
    },
}
```

---

## 4. Tenant Provisioning Runbook

### 4.1 Provision new tenant via API
```bash
curl -X POST https://api.cybercom.io/api/v1/tenants/bootstrap/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Hospital",
    "slug": "new-hospital",
    "tenant_type": "healthcare_sovereign",
    "tier": "database",
    "country_code": "SA",
    "locale": "ar",
    "plan": "enterprise",
    "compliance_frameworks": ["hipaa"]
  }'
```

### 4.2 Assign CyIdentity realm
```bash
curl -X POST https://api.cybercom.io/api/v1/tenants/<id>/assign-realm/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"realm_id": "<realm-uuid>", "realm_name": "customer-new-hospital"}'
```

### 4.3 Activate
```bash
curl -X POST https://api.cybercom.io/api/v1/tenants/<id>/activate/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 5. Tenant Suspension Runbook

```bash
# Suspend (billing hold)
curl -X POST https://api.cybercom.io/api/v1/tenants/<id>/suspend/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"reason": "billing_hold"}'

# Restore when billing resolves
curl -X POST https://api.cybercom.io/api/v1/tenants/<id>/restore/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 6. Tenant Termination + Decommission Runbook

1. Notify tenant (30-day notice per contract)
2. Export all audit logs to cold storage
3. Revoke all CyIdentity sessions (`POST /api/v1/identity/sessions/enforce-idle-timeout/`)
4. Terminate:
   ```bash
   curl -X POST https://api.cybercom.io/api/v1/tenants/<id>/terminate/ \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"reason": "contract_end_2026", "confirm": true}'
   ```
5. Deprovision Keycloak realm: `DELETE /api/v1/identity/realms/{realm_id}/decommission/`
6. Schedule data deletion per retention policies
7. Decommission (after data deletion confirmed):
   ```bash
   curl -X POST https://api.cybercom.io/api/v1/tenants/<id>/decommission/ \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

---

## 7. Feature Flag Operations

```bash
# Enable a beta feature for a tenant
curl -X POST https://api.cybercom.io/api/v1/tenants/feature-flags/toggle/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"tenant_id": "<uuid>", "key": "beta.ai_assist", "enabled": true}'

# Query flags for a tenant
curl https://api.cybercom.io/api/v1/tenants/feature-flags/?tenant=<uuid>
```

---

## 8. Domain Management

```bash
# Add domain
curl -X POST https://api.cybercom.io/api/v1/tenants/domains/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"tenant": "<uuid>", "domain": "portal.hospital.sa", "is_primary": true}'

# Verify domain (after CNAME check)
curl -X POST https://api.cybercom.io/api/v1/tenants/domains/<id>/verify/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

DNS verification: add CNAME `portal.hospital.sa → tenants.cybercom.io`.

---

## 9. Environment Topology (ADR-0012)

Each tenant has environments matching ADR-0012:

| Env Type | Production mirror? | PHI allowed? |
|---|---|---|
| production | — (is production) | Yes |
| staging | Full mirror | Synthetic only |
| testing | Simplified | Synthetic only |
| development | Simplified | No |
| demo | Simplified | No |

---

## 10. Database Operations

```bash
# Create tenant migrations
python manage.py makemigrations platform_tenant
python manage.py migrate platform_tenant

# Check active tenant count
python manage.py shell -c "from platform.tenant.models import Tenant, TenantStatus; print(Tenant.objects.filter(status=TenantStatus.ACTIVE).count())"

# Find tenants without assigned realm
python manage.py shell -c "
from platform.tenant.models import Tenant, TenantStatus
orphaned = Tenant.objects.filter(status=TenantStatus.ACTIVE, identity_realm_id__isnull=True)
print(list(orphaned.values_list('slug', flat=True)))
"
```
