# CyIdentity Security Guide

This document outlines the security architecture, compliance controls, encryption policies, and risk mitigation strategies implemented in the **CyIdentity Control Plane**.

---

## 1. Compliance & Security Frameworks

CyIdentity complies with global healthcare and financial security standards:
*   **HIPAA & JCI:** Safeguards access to Electronic Health Records (EHR) through strict identity verifications and immutable audit logging.
*   **ISO 27001 & SOC 2:** Follows zero-trust access controls, multi-factor authentication (MFA), and auditability.
*   **ADR-0005 (IAM Strategy):** Establishes hybrid RBAC (Role-Based Access Control) and ABAC (Attribute-Based Access Control) systems.

---

## 2. Multi-Tenancy Boundary Isolation (ADR-0002)

Multi-tenancy isolation is enforced at the database layer using PostgreSQL **Row-Level Security (RLS)**.

1.  **Isolation Variable:** The `TenantIsolationMiddleware` extracts the tenant UUID from the `X-Tenant-ID` header or JWT claims.
2.  **PG Session Setting:** Set via `SET LOCAL app.current_tenant_id = %s;` within the transaction context.
3.  **Bypass Safeguards:** Open paths (such as health, metrics, and token validation) do not require a tenant ID. All other operations block any query that crosses tenant boundaries.

---

## 3. Token Validation & Signature Verification

CyIdentity implements strict JWT validation using cached **JWKS** (JSON Web Key Sets) from Keycloak:

*   **Signature Algorithm:** Mandates `RS256` (RSA Signature with SHA-256). Symmetric tokens (such as HMAC) are rejected.
*   **Key Rotation Grace Period:** The `JWKSCache` uses a stale-while-error pattern. If Keycloak is down or unreachable, the local cache falls back to cached keys for up to 60 minutes to prevent system outages during Keycloak key rotations.
*   **Claims Inspection:** Every token must carry valid `exp` (expiration), `iat` (issued at), `iss` (issuer matching `CYIDENTITY_ISSUER`), and `sub` (subject uuid) claims.

---

## 4. Multi-Factor Authentication (MFA) & Passkeys

MFA policies are defined per-realm in the `RealmConfiguration`:

*   **Preferred Method:** **WebAuthn / Passkeys** (FIDO2). Public keys are registered in the `WebAuthnCredential` model, ensuring private key material never leaves the user's authenticator device.
*   **Enforcement Levels:** Realms can enforce mandatory MFA (`mfa_enforced=True`). Attempted access from public clients to confidential endpoints triggers immediate authentication challenges.

---

## 5. Emergency Break-Glass Override Protocol

When users require elevated access during emergencies (e.g., medical disaster or infrastructure outage), access is granted through the **Break Glass Service** matching **ADR-0017 §7.3 Risk-8**:

1.  **Dual Signatures:** Approval requires approval fields from two separate authorized users (e.g. `approver` and `second_approver` set on the endpoint). Approving without dual signatures raises a validation error.
2.  **Time-Boxing:** The maximum duration is dictated by the realm configurations (`break_glass_max_duration_seconds`), typically defaulting to 3600 seconds (1 hour).
3.  **Automatic Expiration:** Background Celery cron tasks execute every 60 seconds to immediately revoke active break-glass tokens that exceed their lifespan.
4.  **Immutable Auditing:** Every state change (Request, Approve, Activate, Expire, Revoke) generates a high-severity audit record sent to the central `platform_audit_logs` sink.
