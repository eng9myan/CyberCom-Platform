# Identity & Access Strategy

> **Status:** Approved — Program 0, Phase 0.4
> **Owner:** Chief Security Architect
> **Implements:** [ADR-0005 Identity & Access Management Strategy](../adr/ADR-0005-identity-access-management-strategy.md)

CyberCom centralizes all identity in **CyIdentity** and all authorization decisions through a **policy engine**. No service implements its own login, password handling, or role logic.

---

## 1. Principles

1. **One identity provider.** CyIdentity is the only IdP for workforce, customers, citizens, and services.
2. **Standards-based.** OAuth 2.1 + OIDC + SCIM + WebAuthn + SAML 2.0 (federation only).
3. **MFA always.** Mandatory for all human accounts; phishing-resistant preferred.
4. **Zero-trust tokens.** Short-lived, audience-scoped, signed; no long-lived bearer tokens.
5. **Policy-driven authorization.** RBAC for grouping, ABAC for context. No inline role checks.
6. **Least privilege + JIT.** Privileged access is just-in-time, approved, time-boxed, audited.

---

## 2. Identity Domains

| Domain | Examples | Realm |
|---|---|---|
| **Workforce** | Employees, contractors, ops | `workforce` realm; SSO to corporate IdP (federation) |
| **Customers / Tenants** | Hospital staff, ERP users | Per-tenant realm under CyIdentity |
| **Citizens** | CyCitizen users | National eID + CyIdentity |
| **Services** | Microservices, jobs, agents | SPIFFE/SPIRE identities + workload OIDC |
| **Devices** | Workforce laptops, kiosks | Device certificates + posture |
| **Partners** | B2B integrations | Federated via SAML/OIDC; mTLS |

---

## 3. Authentication

### 3.1 Methods

| Method | Use | Strength |
|---|---|---|
| **WebAuthn / Passkeys** | Default for workforce + high-assurance customers | Phishing-resistant |
| **TOTP** | Standard MFA second factor | Strong |
| **Push to verified device** | Workforce convenience flow | Strong |
| **SMS / email OTP** | Fallback only; not for healthcare/financial | Weak |
| **Password** | Optional; if used, paired with mandatory MFA | Weak alone |
| **mTLS** | Service-to-service | Strong |
| **OIDC client credentials + workload identity** | Service-to-service via gateway | Strong |

### 3.2 MFA policy

- **Mandatory** for all workforce accounts and all customer accounts that touch PHI, PII, or financial data.
- Phishing-resistant (WebAuthn/passkey) **required** for: admins, ops, on-call, compliance, anyone with break-the-glass capability.
- Risk-based **step-up** for sensitive actions (export, mass update, prescription, money movement).

### 3.3 Sessions & tokens

| Token | TTL | Notes |
|---|---|---|
| Access token (user) | ≤ 15 min | JWT, audience-scoped |
| Refresh token (user) | ≤ 8 hours (workforce) / ≤ 30 days (customer) | Rotating, one-time use; reuse → revoke chain |
| Service access token | ≤ 5 min | Workload identity |
| Break-the-glass token | ≤ 30 min | Approval + full audit |
| Session cookies | HttpOnly · Secure · SameSite=Lax · `__Host-` prefix |

- All JWTs validated: `iss`, `aud`, `exp`, `nbf`, `kid`, signature.
- Refresh tokens are bound to client + device fingerprint; rotation enforced.
- Token revocation list / introspection available; gateway honors it.

---

## 4. Authorization

### 4.1 Hybrid RBAC + ABAC

- **RBAC** for coarse grouping: `clinician`, `nurse`, `pharmacist`, `billing_clerk`, `tenant_admin`, `support`, `ops`.
- **ABAC** for fine-grained, contextual decisions, using attributes:
  - Subject: role, department, location, clearance, employment status.
  - Resource: data class (PHI/PII/Confidential), tenant, owning department, sensitivity, jurisdiction.
  - Action: read/write/export/delete/print/share.
  - Context: time, network, device posture, purpose-of-use, emergency flag.

### 4.2 Policy engine

- **OPA (Rego)** or **AWS Cedar** — selected per [ADR-0005](../adr/ADR-0005-identity-access-management-strategy.md).
- Policies versioned in `infrastructure/policies/`; reviewed like code.
- Decision logs streamed to SIEM.
- Local sidecar evaluation for low latency; central authoring/distribution via control plane.

### 4.3 Examples (illustrative)

- "A nurse may read a patient's chart only if the patient is admitted to a ward where the nurse is currently rostered."
- "A billing clerk may export financial reports only between 08:00–18:00 from a managed device."
- "An emergency physician may break-the-glass to view any chart with `purpose_of_use=emergency`; the action is logged and reviewed within 24 h."

---

## 5. Multi-Tenant Isolation

- Tenant scope is bound to the token (`tid` claim) and enforced at every layer:
  1. **API gateway** strips/validates `X-Tenant-Id`.
  2. **Application** sets request-scoped tenant context.
  3. **Database** enforces RLS using `app.tenant_id` session GUC.
  4. **Object storage / queues** segregated by tenant prefix or topic.
- Cross-tenant access is impossible by default; any approved cross-tenant operation requires an explicit policy + audit event.

---

## 6. Privileged Access Management (PAM)

- **No standing admin.** All `admin` / `ops` roles are granted JIT via a request → approval → time-boxed workflow.
- **Approval** by a second human (no self-approval). Break-the-glass uses an alternate approver list with pager escalation.
- **Session recording** for interactive admin sessions to production.
- **Audit** of every PAM grant, use, and expiry.

---

## 7. Service Identity

- Every workload has a SPIFFE ID (e.g. `spiffe://cybercom/prod/cymed/patient-service`).
- mTLS via SPIRE-issued SVIDs inside the mesh.
- For external calls: short-lived OIDC tokens fetched at startup and refreshed before expiry.
- CI/CD uses **GitHub OIDC → cloud role**; no static cloud keys in Actions secrets.

---

## 8. Customer / Tenant Onboarding

- Per-tenant realm provisioned via SCIM + IaC.
- Optional federation to the tenant's own IdP (SAML or OIDC).
- Tenant-admin self-service: invite users, manage roles, view audit log.
- Tenant offboarding: 30-day grace, export, then secure deletion with attestation.

---

## 9. Citizen Identity (CyCitizen)

- Federated to **national eID** where available; OIDC fallback otherwise.
- Mandatory MFA; phishing-resistant required for high-assurance services.
- Consent records stored and queryable; revocation honored within 24 h.
- Pseudonymization at analytics boundary.

---

## 10. Account Lifecycle

- **Joiner / Mover / Leaver (JML)** automation via SCIM.
- Workforce de-provisioning ≤ 1 hour from HRIS termination event.
- Inactive accounts disabled after 90 days; deleted after 1 year (subject to compliance).
- Periodic access reviews: quarterly for privileged; annual for general.

---

## 11. Logging & Monitoring

- Every authN event (success/failure) logged.
- Every authZ decision logged (allow/deny + policy id).
- Anomaly detection: impossible travel, mass denials, token theft signals, credential stuffing.
- SIEM alerts route to SecOps; high-risk events page on-call.

---

## 12. Forbidden

- Long-lived static API keys for service-to-service.
- Passwords stored or hashed outside CyIdentity.
- Inline role checks in application code (`if user.role == "admin"`).
- Sharing accounts.
- Per-product custom login screens.
- Disabling MFA for "convenience".
