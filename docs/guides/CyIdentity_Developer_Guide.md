# CyIdentity Developer Guide

**Program:** 2.1 — CyIdentity Foundation  
**Date:** 2026-06-22  
**Status:** Active  
**ADRs:** ADR-0005, ADR-0017, ADR-0035

---

## 1. Overview

CyIdentity is the CyberCom identity platform — the single source of truth for all human and service identities across Workforce, Citizen, Partner, Customer, and Workload realms.

Built on **Keycloak 24** (ADR-0035) as the OIDC/OAuth/SAML base. The `platform.cyidentity` Django app is the **control plane**: it provisions and manages realms, clients, users, roles, sessions, and break-glass access by calling the Keycloak Admin REST API.

---

## 2. Architecture

```
┌──────────────────────────────────────────────┐
│            CyberCom Apps / Products          │
│        (CyMed, CyCom, CyGov, CyShop)        │
└──────────────────┬───────────────────────────┘
                   │ OAuth 2.1 / OIDC
┌──────────────────▼───────────────────────────┐
│          Keycloak 24 (IdP Base Layer)        │
│   Sessions · Tokens · MFA · SAML Federation │
└──────────────────┬───────────────────────────┘
                   │ Admin REST API
┌──────────────────▼───────────────────────────┐
│     platform.cyidentity (Django Control Plane)│
│  Models: Realm, Client, Role, User, Session  │
│  Services: RealmService, ClientService, ...  │
│  APIs: /api/v1/identity/*                   │
└──────────────────────────────────────────────┘
```

### Realm Isolation Model (ADR-0017 §5.2)

| Realm Pattern | Population |
|---|---|
| `workforce` | CyberCom employees + contractors |
| `customer-<tenant>` | Hospital/enterprise staff |
| `citizen-<jurisdiction>` | Citizens for CyCitizen |
| `partner` | B2B integrations |
| `workload` | M2M services / jobs |

---

## 3. Development Setup

### 3.1 Prerequisites

- Docker + Docker Compose
- Python 3.12, Django 5, DRF
- `pip install -r backend/requirements.txt`

### 3.2 Keycloak (local)

```bash
docker compose up keycloak -d
# Keycloak admin UI: http://localhost:8080/admin
# Default credentials: admin / admin (set via KEYCLOAK_ADMIN / KEYCLOAK_ADMIN_PASSWORD)
```

### 3.3 Disable Keycloak for unit tests

```python
# settings/test.py
KEYCLOAK_ENABLED = False
```

All service methods check `settings.KEYCLOAK_ENABLED` and fall back to the in-memory fake store.

### 3.4 Environment variables

| Variable | Description | Default |
|---|---|---|
| `CYIDENTITY_ISSUER` | Keycloak realm issuer URL | `http://localhost:8080/realms/master` |
| `CYIDENTITY_JWKS_URI` | JWKS endpoint | derived from ISSUER |
| `CYIDENTITY_CLIENT_ID` | Token audience claim | `cybercom-backend` |
| `KEYCLOAK_ADMIN` | Admin username | `admin` |
| `KEYCLOAK_ADMIN_PASSWORD` | Admin password | `admin` |
| `KEYCLOAK_ENABLED` | Enable real Keycloak calls | `True` |

---

## 4. Domain Models

All 17 models live in `backend/platform/cyidentity/models.py`.

| Model | Table | Purpose |
|---|---|---|
| `IdentityRealm` | `platform_identity_realms` | Tenant→Keycloak realm mapping |
| `RealmConfiguration` | `platform_realm_configurations` | Token lifetimes, MFA policy, branding |
| `IdentityProvider` | `platform_identity_providers` | SAML/OIDC federation partners |
| `ServicePrincipal` | `platform_service_principals` | M2M workload identities |
| `ApplicationClient` | `platform_application_clients` | OAuth/OIDC/SAML app registrations |
| `ClientSecret` | `platform_client_secrets` | Rotating secrets (hashed only) |
| `Role` | `platform_roles` | RBAC roles (realm- or client-scoped) |
| `Permission` | `platform_permissions` | Fine-grained permission catalog |
| `RoleAssignment` | `platform_role_assignments` | Role→permission + composite roles |
| `Group` | `platform_identity_groups` | ABAC groups with hierarchy |
| `GroupMembership` | `platform_group_memberships` | User→group membership |
| `UserProfile` | `platform_user_profiles` | Control-plane mirror of Keycloak user |
| `UserSession` | `platform_user_sessions` | Session tracking + revocation |
| `LoginAudit` | `platform_login_audits` | Per-login audit records |
| `DeviceRegistration` | `platform_device_registrations` | Bound devices for MFA |
| `WebAuthnCredential` | `platform_webauthn_credentials` | Passkey credential metadata |
| `BreakGlassAccess` | `platform_break_glass_accesses` | Emergency access with dual-approval |

---

## 5. Service Layer

### 5.1 RealmService

```python
from platform.cyidentity.services import RealmService

svc = RealmService()
realm = svc.provision(
    tenant_id=uuid.UUID("..."),
    realm_name="hospital-x",
    realm_type="customer",
    display_name="Hospital X",
    mfa_methods=["webauthn"],
)
svc.activate(realm)
svc.suspend(realm, reason="billing_hold")
svc.decommission(realm)
```

### 5.2 ClientService

```python
from platform.cyidentity.services import ClientService

client = ClientService().register(
    realm,
    client_id="cymed-portal",
    name="CyMed Portal",
    public_client=True,
    redirect_uris=["https://app.cymed.io/callback"],
    smart_on_fhir_enabled=True,
)
row, cleartext = ClientService().rotate_secret(client, created_by="admin")
```

### 5.3 UserProvisioningService

```python
from platform.cyidentity.services import UserProvisioningService

user = UserProvisioningService().provision_user(
    realm, username="dr.smith", email="smith@hospital.x",
    first_name="John", last_name="Smith",
)
```

### 5.4 BreakGlassService

```python
from platform.cyidentity.services import BreakGlassService

bg = BreakGlassService().request(
    user=user, realm=realm,
    reason="clinical",
    justification="Mass casualty — ERW override",
    target_resource="patient", target_action="override-consent",
)
BreakGlassService().approve(bg, approver="cso@x", second_approver="cdo@x")
BreakGlassService().activate(bg, duration_seconds=1800)
```

---

## 6. JWT Validation

The `CyIdentityAuthMiddleware` (`backend/platform/cyidentity/middleware.py`) validates every request's Bearer token:

1. Extracts `Authorization: Bearer <token>`
2. Fetches JWKS from `settings.CYIDENTITY_JWKS_URI` (cached 5 min)
3. Verifies RS256 signature + `exp`, `iat`, `iss`, `sub`
4. Attaches `request.auth_claims` (dict) for downstream use

Claims-based permission checks use `request.auth_claims["realm_access"]["roles"]`.

---

## 7. Running Tests

```bash
cd backend
pytest platform/cyidentity/tests/ -v --cov=platform.cyidentity --cov-report=term-missing
# Target: 90% coverage
```

---

## 8. Celery Tasks

| Task | Schedule | Purpose |
|---|---|---|
| `cyidentity.expire_break_glass` | Every 5 min | Expire active break-glass records |
| `cyidentity.enforce_idle_timeout` | Every 15 min | Revoke idle sessions |
| `cyidentity.rotate_client_secret` | On demand | Per-client quarterly rotation |

---

## 9. API Reference

Base path: `/api/v1/identity/`

See `CyIdentity_API_Guide.md` for full endpoint reference.

OpenAPI schema: `/api/schema/` — Swagger UI: `/api/docs/`
