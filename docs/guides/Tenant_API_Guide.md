# CyberCom Tenant Framework API Guide

**Program:** 2.2 — Multi-Tenant Framework  
**Date:** 2026-06-22  
**Base:** `/api/v1/tenants/`

---

## Special Endpoints

### GET /api/v1/tenants/healthz/
Health check for the tenant service.

**Response 200:**
```json
{"status": "ok", "active_tenants": 42}
```

### GET /api/v1/tenants/metrics
Prometheus metrics (text/plain).

---

## Tenant CRUD

### POST /api/v1/tenants/bootstrap/
Provision a full new tenant (all sub-records created atomically).

**Auth:** `platform_admin` role required.

**Request:**
```json
{
  "name": "Metro Hospital",
  "slug": "metro-hospital",
  "display_name": "Metro Hospital System",
  "tenant_type": "healthcare_sovereign",
  "tier": "database",
  "country_code": "SA",
  "locale": "ar",
  "home_region": "me-central-1",
  "plan": "enterprise",
  "compliance_frameworks": ["hipaa", "gdpr"],
  "contact_email": "admin@metro.sa"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "name": "Metro Hospital",
  "slug": "metro-hospital",
  "tenant_type": "healthcare_sovereign",
  "tier": "database",
  "status": "provisioning",
  "keycloak_realm_name": "",
  "profile": {...},
  "configuration": {...},
  "branding": {...}
}
```

### GET /api/v1/tenants/
List all tenants. Requires read access.

### GET /api/v1/tenants/{id}/
Retrieve single tenant with nested profile, configuration, branding.

### PATCH /api/v1/tenants/{id}/
Update tenant fields (name, metadata, etc.).

---

## Tenant Lifecycle Actions

### POST /api/v1/tenants/{id}/activate/
Activate a provisioning/pending tenant.

### POST /api/v1/tenants/{id}/suspend/
Suspend an active tenant.
```json
{"reason": "billing_hold"}
```

### POST /api/v1/tenants/{id}/archive/
Archive a suspended tenant.

### POST /api/v1/tenants/{id}/restore/
Restore an archived or suspended tenant to active.

### POST /api/v1/tenants/{id}/terminate/
Terminate a tenant. Requires confirmation.
```json
{"reason": "contract_end", "confirm": true}
```

### POST /api/v1/tenants/{id}/decommission/
Decommission a terminated tenant (irreversible).

### POST /api/v1/tenants/{id}/assign-realm/
Link a CyIdentity realm to this tenant.
```json
{"realm_id": "uuid", "realm_name": "customer-metro-hospital"}
```

---

## Sub-Resources

### Profiles — GET/PATCH /api/v1/tenants/profiles/{id}/
Legal name, contact info, billing address.

### Configurations — GET/PATCH /api/v1/tenants/configurations/{id}/
Limits, MFA settings, data residency, BYOK.

### Brandings — GET/PATCH /api/v1/tenants/brandings/{id}/
Colors, logos, RTL default, language.

### Subscriptions — /api/v1/tenants/subscriptions/
Plan, billing cycle, trial period.

### Licenses — /api/v1/tenants/licenses/
Module licensing. Auth: `platform_admin`.

### Environments — /api/v1/tenants/environments/
Per-env (production/staging/dev) records.

### Regions — /api/v1/tenants/regions/
Data residency region assignments.

### Deployment Profiles — /api/v1/tenants/deployment-profiles/
Kubernetes resource parameters.

---

## Feature Flags

### GET /api/v1/tenants/feature-flags/
List all flags.

### POST /api/v1/tenants/feature-flags/toggle/
Toggle a feature flag on or off.
```json
{
  "tenant_id": "uuid",
  "key": "beta.ai_assist",
  "enabled": true,
  "value": {"max_daily_calls": 100}
}
```

---

## Domains

### GET/POST /api/v1/tenants/domains/
List or create custom domain mappings.

### POST /api/v1/tenants/domains/{id}/verify/
Mark a domain as verified (after DNS CNAME check).

---

## SSO Configuration

### /api/v1/tenants/sso/
CRUD for OIDC / SAML / LDAP federation per tenant. Auth: `platform_admin`.

**OIDC example:**
```json
{
  "tenant": "uuid",
  "protocol": "oidc",
  "alias": "adfs",
  "authorization_url": "https://adfs.hospital.sa/auth",
  "token_url": "https://adfs.hospital.sa/token",
  "client_id": "cybercom-sp",
  "scopes": ["openid", "profile", "email"]
}
```

---

## Compliance

### /api/v1/tenants/compliance/
CRUD for compliance framework profiles.

```json
{
  "tenant": "uuid",
  "framework": "hipaa",
  "certified_at": "2026-01-01T00:00:00Z",
  "expires_at": "2027-01-01T00:00:00Z",
  "certification_body": "HITRUST",
  "certificate_number": "CERT-2026-001"
}
```

---

## Retention Policies

### /api/v1/tenants/retention-policies/
Data retention schedule per category.

```json
{
  "tenant": "uuid",
  "data_category": "medical_records",
  "retention_days": 3650,
  "deletion_strategy": "archive",
  "compliance_basis": "hipaa"
}
```

---

## Audit Configuration

### /api/v1/tenants/audit-configurations/
Per-tenant audit settings, SIEM export configuration.

---

## Error Format

All errors follow RFC 7807:
```json
{
  "type": "https://cybercom.io/errors/tenant-not-found",
  "title": "Tenant not found",
  "status": 404,
  "detail": "No tenant with slug 'unknown-tenant' exists."
}
```
