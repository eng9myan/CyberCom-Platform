# CyberCom Tenant Framework Developer Guide

**Program:** 2.2 — Multi-Tenant Framework  
**Date:** 2026-06-22  
**ADRs:** ADR-0002, ADR-0005, ADR-0012

---

## 1. Architecture Overview

CyberCom uses a **tiered multi-tenancy model** (ADR-0002):

```
┌─────────────────────────────────────────────────────┐
│                  API Gateway (Kong)                  │
│          X-Tenant-ID header injection                │
└───────────────────────┬─────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────┐
│           TenantIsolationMiddleware                  │
│    JWT claim → PostgreSQL GUC app.current_tenant_id  │
└───────────────────────┬─────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
  T-Shared (RLS)              T-Cluster / T-DB / T-Schema
  Most SaaS tenants           Sovereign / Enterprise tenants
```

### Isolation Tiers (ADR-0002 §5)

| Tier | Pattern | Use Case |
|---|---|---|
| T-Shared | Shared schema + PostgreSQL RLS | Default SaaS |
| T-Schema | Schema per tenant | Mid-trust enterprise |
| T-DB | Database per tenant (same cluster) | BYOK, per-tenant backups |
| T-Cluster | Full stack per tenant | Sovereign cloud, on-premise |

---

## 2. Domain Models

### Core Models

| Model | Table | Purpose |
|---|---|---|
| Tenant | platform_tenants | Central registry — one row per org |
| TenantProfile | platform_tenant_profiles | Legal, billing, contact info |
| TenantConfiguration | platform_tenant_configurations | Limits, MFA, residency settings |
| TenantBranding | platform_tenant_brandings | White-label colors, logos, RTL |
| TenantSubscription | platform_tenant_subscriptions | Plan and billing cycle |
| TenantLicense | platform_tenant_licenses | Module licensing per org |
| TenantEnvironment | platform_tenant_environments | Per-env (prod/staging/dev) records |
| TenantRegion | platform_tenant_regions | Data residency region assignments |
| TenantDeploymentProfile | platform_tenant_deployment_profiles | Kubernetes resource parameters |
| TenantFeatureFlag | platform_tenant_feature_flags | Per-tenant feature toggles |
| TenantDomain | platform_tenant_domains | Custom domain → tenant mapping |
| TenantSSOConfiguration | platform_tenant_sso_configurations | OIDC / SAML / LDAP federation |
| TenantStoragePolicy | platform_tenant_storage_policies | S3/Blob storage limits |
| TenantRetentionPolicy | platform_tenant_retention_policies | Data retention per category |
| TenantComplianceProfile | platform_tenant_compliance_profiles | Active compliance certifications |
| TenantAuditConfiguration | platform_tenant_audit_configurations | Audit capture settings, SIEM export |

---

## 3. Service Layer

### TenantBootstrapService — Full Provisioning

```python
from platform.tenant.services import TenantBootstrapService, TenantBootstrapRequest
from platform.tenant.models import TenantType, TenantTier, SubscriptionPlan

req = TenantBootstrapRequest(
    name="Metro Hospital",
    slug="metro-hospital",
    tenant_type=TenantType.HEALTHCARE_SOVEREIGN,
    tier=TenantTier.DATABASE,
    country_code="SA",
    locale="ar",
    home_region="me-central-1",
    plan=SubscriptionPlan.ENTERPRISE,
    compliance_frameworks=["hipaa", "gdpr"],
    contact_email="admin@metro.sa",
)
tenant = TenantBootstrapService().bootstrap(req, created_by="admin@cybercom.io")
# Creates: Tenant + Profile + Configuration + Branding + Subscription +
#          AuditConfiguration + StoragePolicy + DeploymentProfile +
#          1 Production Environment + 1 Primary Region +
#          2 ComplianceProfiles + 5 default FeatureFlags +
#          4 default RetentionPolicies
```

### TenantLifecycleService

```python
from platform.tenant.services import TenantLifecycleService

svc = TenantLifecycleService()
svc.activate(tenant, by="admin@cybercom.io")
svc.suspend(tenant, reason="billing_hold", by="ops@cybercom.io")
svc.archive(tenant, by="admin@cybercom.io")
svc.restore(tenant)
svc.terminate(tenant, reason="contract_end", by="admin@cybercom.io")
svc.decommission(tenant, by="admin@cybercom.io")
```

### TenantContextService — Tenant Resolution

```python
from platform.tenant.services import TenantContextService

svc = TenantContextService()

# From JWT claims (primary)
tenant = svc.resolve_from_claims(request.auth_claims)

# From X-Tenant-ID header (API gateway injection)
tenant = svc.resolve_from_header(request.headers.get("X-Tenant-ID"))

# From domain (custom domain mapping)
tenant = svc.resolve_from_domain(request.get_host())

# From URL slug
tenant = svc.resolve_from_slug("metro-hospital")
```

### TenantFeatureFlagService

```python
from platform.tenant.services import TenantFeatureFlagService

svc = TenantFeatureFlagService()
if svc.is_enabled(tenant, "beta.ai_assist"):
    # show feature

svc.enable(tenant, "new.feature", by="admin@cybercom.io", value={"max_calls": 100})
svc.disable(tenant, "beta.ai_assist")
```

### TenantRealmMappingService — CyIdentity Integration

```python
from platform.tenant.services import TenantRealmMappingService
from platform.cyidentity.services import RealmService

# 1. Provision CyIdentity realm
realm = RealmService().provision(realm_name=f"customer-{tenant.slug}", ...)

# 2. Link to tenant
TenantRealmMappingService().assign_realm(tenant, realm.id, realm.realm_name)
```

---

## 4. Tenant Isolation Middleware

`TenantIsolationMiddleware` in `core/middleware/tenant.py`:
- Reads `X-Tenant-ID` header (injected by Kong API Gateway)
- Sets PostgreSQL session GUC: `SET app.current_tenant_id = '<uuid>'`
- All RLS policies on T-Shared tables use `current_setting('app.current_tenant_id')`

**Never bypass the middleware in production.** Open paths (health, metrics) are exempt.

---

## 5. Database Isolation per Tier

### T-Shared: RLS Policy Pattern

```sql
CREATE POLICY tenant_isolation ON platform_appointments
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### T-DB: Connection Router

```python
# TenantDatabaseResolver (future Program 2.3)
# Routes ORM queries to per-tenant database based on TenantEnvironment.database_name
```

---

## 6. Testing

```bash
# From backend/
export DJANGO_SETTINGS_MODULE=core.test_settings
pytest platform/tenant/tests/test_tenant.py -v --no-cov
# 88 passed in 0.98s

# Combined suite (Program 2.1 + 2.2)
pytest platform/cyidentity/tests/ platform/tenant/tests/test_tenant.py --no-cov -q
# 173 passed in 1.40s
```

---

## 7. Kafka Domain Events

All significant tenant events emit to the Kafka outbox (`OutboxEvent`):

| Event | Trigger |
|---|---|
| `tenant.provisioned` | Bootstrap complete |
| `tenant.activated` | Status → active |
| `tenant.suspended` | Status → suspended |
| `tenant.archived` | Status → archived |
| `tenant.terminated` | Status → terminated |
| `tenant.decommissioned` | Status → decommissioned |
| `tenant.realm.created` | Realm assigned |
| `tenant.feature.enabled` | Flag enabled |
| `tenant.license.updated` | License granted/updated |
| `tenant.domain.verified` | Domain verified |
| `tenant.compliance.added` | Compliance framework added |

---

## 8. Celery Tasks

| Task | Schedule | Purpose |
|---|---|---|
| `tenant.check_subscription_expiry` | Daily | Suspend tenants with expired subscriptions |
| `tenant.expire_feature_flags` | Hourly | Disable flags past `expires_at` |
| `tenant.check_license_expiry` | Daily | Mark expired licenses inactive |
| `tenant.sync_realm_mapping` | On-demand | Re-sync Keycloak realm info |
