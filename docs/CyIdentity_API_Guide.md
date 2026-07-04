# CyIdentity REST API Guide

This document outlines the API specifications for the **CyIdentity Control Plane** (`/api/v1/identity/`).

---

## 1. Authentication & Headers

All write operations (except health, metrics, and token validation) require valid authentication and tenancy headers:

| Header | Format / Example | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <JWT_Token>` | Decoded JWT carrying roles/permissions. |
| `X-Tenant-ID` | `00000000-0000-0000-0000-000000000000` | Target Tenant UUID for Row-Level Isolation (RLS). |

---

## 2. Unauthenticated Public Endpoints

### 2.1 Health Check
*   **Path:** `GET /api/v1/identity/healthz/`
*   **Response:** `200 OK`
```json
{
  "status": "ok",
  "realm_count": 3,
  "active_realm_count": 2,
  "active_session_count": 0,
  "keycloak_enabled": false
}
```

### 2.2 Metrics Exposition
*   **Path:** `GET /api/v1/identity/metrics`
*   **Format:** Prometheus Text Exposition (v0.0.4)
*   **Output Example:**
```text
# TYPE cybercom_identity_login_total counter
cybercom_identity_login_total 0
# TYPE cybercom_identity_login_failure_total counter
cybercom_identity_login_failure_total 0
```

### 2.3 Token Verification
*   **Path:** `POST /api/v1/identity/token/validate/`
*   **Request Payload:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIs..."
}
```
*   **Response (Valid):** `200 OK`
```json
{
  "valid": true,
  "subject": "11111111-1111-1111-1111-111111111111",
  "issuer": "http://localhost:8080/realms/cybercom",
  "audience": "cybercom-backend",
  "expires_at": 1782086400,
  "scope": "read write"
}
```
*   **Response (Invalid):** `401 Unauthorized`
```json
{
  "valid": false,
  "subject": "",
  "issuer": "",
  "audience": "",
  "expires_at": 0,
  "scope": ""
}
```

---

## 3. Realm Operations (Administrative)

### 3.1 Provision Realm
Creates a new tenant-specific realm mirror locally and creates the workspace in Keycloak.
*   **Path:** `POST /api/v1/identity/realms/provision/`
*   **Role Required:** `platform_admin`
*   **Request Payload:**
```json
{
  "tenant_id": "90cf1873-10bb-469b-98df-823901ba329b",
  "realm_name": "acme-tenant",
  "realm_type": "customer",
  "display_name": "ACME Corporation",
  "mfa_methods": ["webauthn"]
}
```
*   **Response:** `201 Created`

### 3.2 Transition Realm Status
Modify realm status via lifecycle actions:
*   **Activate:** `POST /api/v1/identity/realms/{id}/activate/`
*   **Suspend:** `POST /api/v1/identity/realms/{id}/suspend/` (optional `"reason"` string in body)
*   **Decommission:** `POST /api/v1/identity/realms/{id}/decommission/`
*   **Response:** `200 OK` (returns updated Realm object)

---

## 4. Client Registry & Secrets

### 4.1 Register Client
*   **Path:** `POST /api/v1/identity/clients/register/`
*   **Payload:**
```json
{
  "realm_id": "realm-uuid-here",
  "client_id": "new-client-app",
  "name": "Frontend Portal",
  "public_client": true,
  "redirect_uris": ["https://app.cybercom.io/callback"]
}
```
*   **Response:** `201 Created`

### 4.2 Rotate Client Secret
Generates a new credential and revokes previous active secrets. Returns the cleartext exactly once.
*   **Path:** `POST /api/v1/identity/clients/{id}/rotate-secret/`
*   **Response:** `201 Created`
```json
{
  "id": "secret-uuid",
  "client_id": "new-client-app",
  "cleartext": "fake-secret-xyz123...",
  "secret_hint": "z123",
  "expires_at": "2026-09-22T00:00:00Z",
  "rotated_at": "2026-06-22T00:00:00Z"
}
```

---

## 5. Users & Sessions

### 5.1 Provision User Profile
*   **Path:** `POST /api/v1/identity/users/provision/`
*   **Payload:**
```json
{
  "realm_id": "realm-uuid-here",
  "username": "j.doe",
  "email": "jdoe@cybercom.com",
  "first_name": "Jane",
  "last_name": "Doe"
}
```
*   **Response:** `201 Created`

### 5.2 Lock / Unlock User Accounts
*   **Lock:** `POST /api/v1/identity/users/{id}/lock/`
*   **Unlock:** `POST /api/v1/identity/users/{id}/unlock/`

### 5.3 Session Control
*   **Revoke Session:** `POST /api/v1/identity/sessions/{id}/revoke/` (optional `"reason"` string in body)
*   **Enforce Global Idle Timeout:** `POST /api/v1/identity/sessions/enforce-idle-timeout/` (scans and revokes idle sessions)

---

## 6. Break-Glass (Emergency Access)

Emergency overrides follow a strict state machine: `Requested` → `Approved` (dual approvers required) → `Active` (time-boxed) → `Expired` or `Revoked`.

### 6.1 Request Emergency Access
*   **Path:** `POST /api/v1/identity/break-glass/`
*   **Payload:**
```json
{
  "user_id": "user-uuid",
  "realm_id": "realm-uuid",
  "reason": "clinical",
  "justification": "Mass casualty event in ER wing",
  "target_resource": "patient_records",
  "target_action": "override-consent"
}
```
*   **Response:** `201 Created`

### 6.2 Dual Signature Approval
*   **Path:** `POST /api/v1/identity/break-glass/{id}/approve/`
*   **Payload:**
```json
{
  "approver": "security-officer-user",
  "second_approver": "clinical-director-user"
}
```
*   **Response:** `200 OK`

### 6.3 Activate
*   **Path:** `POST /api/v1/identity/break-glass/{id}/activate/`
*   **Payload:**
```json
{
  "duration_seconds": 3600
}
```
*   **Response:** `200 OK`
