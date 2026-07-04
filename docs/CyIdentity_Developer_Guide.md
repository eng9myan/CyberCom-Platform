# CyIdentity Developer Guide

This guide provides technical onboarding and development instructions for the **CyIdentity Foundation** control plane within the CyberCom Platform.

---

## 1. Overview & Architecture

CyIdentity is the central identity control plane for CyberCom, serving as a mirror and orchestration layer for **Keycloak 24** (the primary Identity Provider). 

### Key Design Principles:
*   **Decoupled Control Plane:** AuthN validation, token generation, and user credentials reside inside Keycloak. CyberCom database models mirror metadata, status, client registration, and local RBAC configuration.
*   **Outbox Pattern (ADR-0004):** Modifications to identity models emit messages to the transactional outbox (`OutboxEvent`) to sync downstream services via Kafka.
*   **Zero-Trust Security (ADR-0005):** Row-level tenant isolation, mandatory MFA, and dual-authorization emergency access (Break Glass).

---

## 2. Directory Layout

The application resides in the backend repository under `platform/cyidentity/`:

```
backend/platform/cyidentity/
├── admin.py          # Django Admin console configurations
├── apps.py           # AppConfig definitions
├── models.py         # 17 domain models (mirroring Keycloak states)
├── permissions.py    # DRF claim-based and object-level permission classes
├── serializers.py    # Serializers for API schemas
├── services.py       # Core business logic (Keycloak REST Client, Break Glass, Sessions)
├── signals.py        # Audit log signals on state changes
├── tasks.py          # Celery background tasks (Idle timeouts, Break Glass expiration)
├── urls.py           # API route mappings
├── views.py          # DRF ViewSets and custom action handlers
└── tests/            # Test suite
    ├── test_cyidentity.py    # Unit tests
    └── test_integration.py   # API integration tests
```

---

## 3. Local Development Setup

### Prerequisites
*   Python 3.12+
*   Django 5.x
*   PostgreSQL 16+ (development defaults to SQLite under unit tests)
*   Redis 7+ (used for Celery & caching)

### Active Virtual Environment
Navigate to the `backend/` directory and activate the python virtual environment:
```powershell
cd backend
.venv\Scripts\activate
```

### Configuration Settings
Unit tests and local development use the test configurations located in `backend/core/settings_test.py`.
Important environment flags:
*   `DJANGO_SETTINGS_MODULE="core.settings_test"`: Enforces in-memory database and cache to accelerate development cycles.
*   `KEYCLOAK_ENABLED=False`: Runs the Keycloak Admin client in **Fake Mode**, bypassing the need to have a running Keycloak cluster locally.

---

## 4. Keycloak Client Modes

In `backend/platform/cyidentity/services.py`, the `KeycloakAdminClient` manages administrative commands.

```python
class KeycloakAdminClient:
    def __init__(self, realm: IdentityRealm | None = None):
        # settings.KEYCLOAK_ENABLED determines backend mode
```

### Fake Mode (Unit Testing / Offline Dev)
If `settings.KEYCLOAK_ENABLED` is `False`, the client:
*   Generates deterministic fake admin tokens (`fake-admin-token-...`).
*   Stores realm, user, role, and client details in a local thread-safe in-memory store (`self._fake_store`).
*   Avoids making external HTTP requests.

### Real Mode (Staging / Production)
If `settings.KEYCLOAK_ENABLED` is `True`, the client:
*   Uses `httpx` to authenticate against Keycloak's master realm using administrator credentials.
*   Pushes HTTP requests to `/admin/realms/{realm_name}/` endpoints for all operations.

---

## 5. Domain Models (17 Core Entities)

Developers must interact with the following mirror tables:
1.  `IdentityRealm`: Keycloak realm metadata mapping.
2.  `RealmConfiguration`: Custom parameters (lifetimes, MFA, themes).
3.  `IdentityProvider`: Federated Identity Provider details (OIDC/SAML).
4.  `ServicePrincipal`: Machine-to-machine client configuration.
5.  `ApplicationClient`: Application registration details.
6.  `ClientSecret`: Encrypted client credentials (Argon2id/SHA256).
7.  `Role`: Coarse RBAC roles.
8.  `Permission`: Fine-grained actions.
9.  `RoleAssignment`: Role inheritance and role-to-permission mapping.
10. `Group`: Core User groups.
11. `GroupMembership`: User-to-Group mappings.
12. `UserProfile`: Basic local user profile mirror.
13. `UserSession`: User session records for auditing/timeouts.
14. `LoginAudit`: Authentication attempt log.
15. `DeviceRegistration`: MFA WebAuthn device references.
16. `WebAuthnCredential`: Public keys for passkey authentication.
17. `BreakGlassAccess`: Emergency dual-approval access logs.

---

## 6. Testing

Run the test suite using `pytest` wrapped through the python entrypoint to prevent package shadowing:
```powershell
$env:DJANGO_SETTINGS_MODULE="core.settings_test"
$env:DJANGO_DEBUG="True"
.venv\Scripts\python -c "import manage, pytest, sys; sys.exit(pytest.main(['platform/cyidentity/']))"
```

All contributions must maintain a minimum of **80% code coverage** (currently at **84%**).
