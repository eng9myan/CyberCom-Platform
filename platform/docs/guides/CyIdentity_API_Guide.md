# CyIdentity API Guide

**Program:** 2.1 — CyIdentity Foundation  
**Base URL:** `/api/v1/identity/`  
**Date:** 2026-06-22  
**Auth:** Bearer JWT (RS256, issued by Keycloak)

---

## Authentication

All endpoints except `GET /healthz/`, `GET /metrics`, and `POST /token/validate/` require an `Authorization: Bearer <access_token>` header.

Write operations (`POST`, `PUT`, `PATCH`, `DELETE`) require the `platform_admin` or `cyidentity_admin` realm role in the JWT claims.

---

## Health & Metrics

### GET /api/v1/identity/healthz/
Returns service liveness + summary counts.

**Response 200:**
```json
{
  "status": "ok",
  "realm_count": 5,
  "active_realm_count": 4,
  "active_session_count": 312,
  "keycloak_enabled": true
}
```

### GET /api/v1/identity/metrics
Prometheus text format exposition of identity metrics.

---

## Token Validation

### POST /api/v1/identity/token/validate/
Validates a JWT without requiring authentication.

**Request:**
```json
{ "token": "<jwt>", "audience": "cybercom-backend" }
```

**Response 200:**
```json
{
  "valid": true,
  "subject": "user-uuid",
  "issuer": "https://keycloak.cybercom.io/realms/workforce",
  "audience": "cybercom-backend",
  "expires_at": 1750000000,
  "scope": "openid email profile"
}
```

**Response 401:** `{ "valid": false }`

---

## Realms

### GET /api/v1/identity/realms/
List all realms. Supports `?status=active&realm_type=customer`.

### GET /api/v1/identity/realms/{id}/
Retrieve realm detail including nested `configuration`.

### POST /api/v1/identity/realms/provision/
Provision a new realm in Keycloak and the control plane.

**Request:**
```json
{
  "tenant_id": "uuid",
  "realm_name": "hospital-x",
  "realm_type": "customer",
  "display_name": "Hospital X",
  "mfa_methods": ["webauthn"],
  "access_token_lifetime": 900,
  "home_region": "me-central-1",
  "locale": "en"
}
```

**Response 201:** Full `IdentityRealm` object with `configuration`.

### POST /api/v1/identity/realms/{id}/activate/
Activate a PENDING realm.

### POST /api/v1/identity/realms/{id}/suspend/
Suspend an ACTIVE realm. Body: `{ "reason": "..." }`.

### POST /api/v1/identity/realms/{id}/decommission/
Permanently decommission a realm (irreversible).

---

## Identity Providers (Federation)

### GET /api/v1/identity/identity-providers/
### POST /api/v1/identity/identity-providers/
### GET|PUT|PATCH|DELETE /api/v1/identity/identity-providers/{id}/

**Request (SAML):**
```json
{
  "realm": "realm-uuid",
  "alias": "corporate-saml",
  "display_name": "Corporate IdP",
  "protocol": "saml",
  "entity_id": "https://corp.example.com/saml",
  "sso_url": "https://corp.example.com/sso",
  "x509_cert": "MII..."
}
```

---

## Service Principals

### GET /api/v1/identity/service-principals/
### POST /api/v1/identity/service-principals/
### GET|PUT|PATCH|DELETE /api/v1/identity/service-principals/{id}/

```json
{
  "name": "cydata-etl",
  "realm": "realm-uuid",
  "client_id": "cydata-etl-svc",
  "scopes": ["cydata.read", "events.publish"],
  "token_lifetime_seconds": 300
}
```

---

## Application Clients

### GET /api/v1/identity/clients/
### POST /api/v1/identity/clients/register/
Register a new OAuth/OIDC client.

**Request:**
```json
{
  "realm_id": "realm-uuid",
  "client_id": "cymed-portal",
  "name": "CyMed Patient Portal",
  "protocol": "oidc",
  "public_client": true,
  "redirect_uris": ["https://portal.cymed.io/callback"],
  "web_origins": ["https://portal.cymed.io"],
  "mfa_required": true,
  "smart_on_fhir_enabled": true
}
```

### POST /api/v1/identity/clients/{id}/rotate-secret/
Rotate client secret (confidential clients only). Returns cleartext **once**.

**Response 201:**
```json
{
  "id": "secret-uuid",
  "client_id": "cycom-erp",
  "cleartext": "CLEARTEXT_SHOWN_ONCE",
  "secret_hint": "XfG9",
  "expires_at": "2026-09-22T00:00:00Z",
  "rotated_at": "2026-06-22T00:00:00Z"
}
```

---

## Roles & Permissions

### GET|POST /api/v1/identity/roles/
### GET|PUT|PATCH|DELETE /api/v1/identity/roles/{id}/

### GET|POST /api/v1/identity/permissions/
### GET|PUT|PATCH|DELETE /api/v1/identity/permissions/{id}/

```json
{ "scope": "cymed", "action": "write", "resource": "patient", "requires_mfa": true }
```

### GET|POST /api/v1/identity/role-assignments/

```json
{ "kind": "permission", "role": "role-uuid", "permission": "perm-uuid" }
```

---

## Groups

### GET|POST /api/v1/identity/groups/
### GET|PUT|PATCH|DELETE /api/v1/identity/groups/{id}/

```json
{ "realm": "realm-uuid", "name": "Clinical Staff", "path": "/medical/clinicians" }
```

### GET|POST /api/v1/identity/group-memberships/
```json
{ "group": "group-uuid", "user_id": "keycloak-user-uuid" }
```

---

## Users

### GET /api/v1/identity/users/
### POST /api/v1/identity/users/provision/
Provision a user in Keycloak and create a local `UserProfile` mirror.

**Request:**
```json
{
  "realm_id": "realm-uuid",
  "username": "dr.smith",
  "email": "smith@hospital.x",
  "first_name": "John",
  "last_name": "Smith",
  "email_verified": false
}
```

### POST /api/v1/identity/users/{id}/lock/
Lock account for 15 minutes.

### POST /api/v1/identity/users/{id}/unlock/
Clear lock + reset failed login count.

---

## Sessions

### GET /api/v1/identity/sessions/
### POST /api/v1/identity/sessions/{id}/revoke/
Body: `{ "reason": "admin_action" }`

### POST /api/v1/identity/sessions/enforce-idle-timeout/
Revokes all sessions idle >30 minutes. Returns `{ "revoked_count": N }`.

---

## Login Audits

### GET /api/v1/identity/login-audits/
Read-only. Ordered by `-created_at`.

Filter: `?outcome=failure&realm=realm-uuid`

---

## Devices & WebAuthn

### GET|POST /api/v1/identity/devices/
### GET|PUT|PATCH|DELETE /api/v1/identity/devices/{id}/

### GET|POST /api/v1/identity/webauthn-credentials/
### GET|PUT|PATCH|DELETE /api/v1/identity/webauthn-credentials/{id}/

Note: `public_key` is never returned in API responses.

---

## Break-Glass (Emergency Access)

### POST /api/v1/identity/break-glass/
Request emergency access.

**Request:**
```json
{
  "user_id": "user-uuid",
  "realm_id": "realm-uuid",
  "reason": "clinical",
  "justification": "Mass casualty — ER wing override required",
  "target_resource": "patient",
  "target_action": "override-consent"
}
```

### POST /api/v1/identity/break-glass/{id}/approve/
Requires both approvers (dual approval enforced).

```json
{ "approver": "cso@cybercom.io", "second_approver": "cdo@cybercom.io" }
```

### POST /api/v1/identity/break-glass/{id}/activate/
```json
{ "duration_seconds": 1800 }
```

### POST /api/v1/identity/break-glass/{id}/revoke/
Immediately revoke active break-glass access.

---

## Error Responses

All errors follow RFC 7807 Problem Detail format:

```json
{
  "type": "https://cybercom.io/errors/validation",
  "title": "Validation Error",
  "status": 400,
  "detail": "realm_name: Enter a valid slug.",
  "instance": "/api/v1/identity/realms/provision/"
}
```

| Status | Meaning |
|---|---|
| 400 | Validation error |
| 401 | Invalid / missing JWT |
| 403 | Insufficient role / dual approval missing |
| 404 | Resource not found |
| 409 | Conflict (duplicate realm / client) |
| 502 | Keycloak upstream error |
