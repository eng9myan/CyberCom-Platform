# CyIdentity Security Guide

**Program:** 2.1 — CyIdentity Foundation  
**Date:** 2026-06-22  
**Classification:** Internal — Security Sensitive  
**ADRs:** ADR-0005, ADR-0017, ADR-0035  
**Compliance:** HIPAA §164.312(a)(d), GDPR Art. 32, ISO 27001 A.5.15–A.5.18, NIST 800-53 IA

---

## 1. Authentication Security

### 1.1 Token Policy (ADR-0005 §5)

| Token Type | Lifetime | Signing |
|---|---|---|
| User access token | ≤15 minutes | RS256 |
| Service access token | ≤5 minutes | RS256 |
| Refresh token | 30 minutes (rotating) | RS256 |
| Break-glass token | ≤60 minutes | RS256 (special claim) |

All tokens are audience-scoped. Tokens without a valid `aud` claim targeting the calling service are rejected.

### 1.2 MFA Requirements

| Realm Type | MFA Policy |
|---|---|
| `workforce` | WebAuthn mandatory |
| `customer-<tenant>` | MFA mandatory; phishing-resistant required for PHI/PII |
| `citizen-<jurisdiction>` | MFA mandatory; phishing-resistant for high-assurance |
| `partner` | MFA for human admins; mTLS or signed JWT for services |
| `workload` | SPIFFE SVIDs (mesh) + short-lived OIDC for non-mesh |

SMS/email OTP are permitted only as fallbacks and **never** for PHI/PII/financial operations.

### 1.3 WebAuthn / Passkeys

WebAuthn credentials are stored in `platform_webauthn_credentials`. Security properties:
- **Private key material is never stored** — only credential ID, public key (COSE-encoded), and counter
- Sign counter monotonically increases; counter regression triggers authentication failure
- Attestation format recorded for compliance evidence
- `aaguid` identifies authenticator model (hardware key, platform authenticator)

---

## 2. Authorization Security

### 2.1 RBAC + ABAC (ADR-0005 §5)

Authorization uses hybrid RBAC + ABAC:
- RBAC: coarse-grained realm roles (enforced by Keycloak + control-plane JWT claims)
- ABAC: fine-grained attribute-based decisions routed through OPA/Rego policies
- `Permission` catalog entries carry `policy_bundle_ref` pointing to the OPA bundle

Application code **must not** hardcode role checks. Use the policy engine for all authorization decisions.

### 2.2 Principle of Least Privilege

- Service accounts (`ServicePrincipal`) have `token_lifetime_seconds=300` (5 min max)
- Scopes are explicit lists — no wildcard grants
- Admin tokens are obtained via dedicated `admin-cli` flow, never shared

---

## 3. Client Secret Security

### 3.1 Storage

- Cleartext secrets are **returned exactly once** at creation/rotation and **never stored**
- Secrets are stored as Argon2id hashes (`argon2-cffi`) with SHA-256 fallback
- `secret_hint` stores only the last 4 characters for UI display
- Secrets expire after 90 days (quarterly rotation per ADR-0035)

### 3.2 Rotation

```python
# Programmatic rotation
from platform.cyidentity.services import ClientService
row, cleartext = ClientService().rotate_secret(client, created_by="operator@cybercom.io")
# cleartext must be delivered via secure channel (e.g., HashiCorp Vault dynamic secret)
# row.is_active is now True; all previous secrets are revoked
```

### 3.3 Public clients (PKCE)

SPAs and mobile apps use public client mode (`public_client=True`) with mandatory PKCE (code_challenge_method=S256). No client secret is issued.

---

## 4. JWT Validation Security

### 4.1 Validation chain

Every request through `CyIdentityAuthMiddleware`:
1. Extract Bearer token
2. Fetch JWKS (cached; fail-open for 60 min on Keycloak outage)
3. Verify RS256 signature using public key matching `kid` claim
4. Verify `exp`, `iat`, `iss`, `sub` (all required)
5. Verify `aud` matches the calling service's client ID
6. Reject tokens with `nbf > now`

### 4.2 JWKS cache security

- Cache key: `cyidentity:jwks:{jwks_uri}` (per-realm)
- Redis TTL: 3600 seconds (stale-while-revalidate)
- Stale keys served up to 60 minutes during Keycloak outage
- Cache is in-process for unit tests; Redis in production

---

## 5. Session Security

### 5.1 Session tracking

All sessions mirrored from Keycloak into `platform_user_sessions`:
- IP address + user agent recorded for anomaly detection
- `risk_score` field reserved for risk scoring integration (Program 2.2)
- Geo country recorded for compliance reporting

### 5.2 Idle timeout

Sessions idle >30 minutes are automatically revoked by the `cyidentity.enforce_idle_timeout` Celery task. Configurable per realm via `RealmConfiguration.idle_timeout_seconds`.

### 5.3 Session revocation

Session revocation calls Keycloak Admin API to invalidate the Keycloak session server-side, preventing token refresh. Mirrored locally as `status=revoked`.

---

## 6. Break-Glass Security (ADR-0017 §7.3 Risk-8)

### 6.1 Controls

| Control | Enforcement |
|---|---|
| Dual approval | `BreakGlassService.approve()` requires both `approver` + `second_approver` |
| Time-boxed | Max duration from `RealmConfiguration.break_glass_max_duration_seconds` (default: 1h) |
| Automatic expiry | `cyidentity.expire_break_glass` Celery task runs every 5 min |
| Audit on every state change | `BreakGlassService` calls `AuditService.record()` at every transition |
| Post-review required | `post_review_completed_at` must be set within 24h per policy |
| Immutable audit trail | All events written to `platform_audit_logs` (hash chain, no delete) |

### 6.2 Approval workflow

```
REQUESTED → (dual approve) → APPROVED → (activate) → ACTIVE → (expire/revoke) → EXPIRED/REVOKED
```

Any attempt to skip dual approval raises `ValueError: Break-glass requires dual approval (ADR-0017 §7.3)`.

---

## 7. Audit Logging

### 7.1 CyIdentity-specific events

Written to `platform_login_audits`:
- `success` — successful login
- `failure` — failed login
- `mfa_challenge` — MFA prompted
- `mfa_failure` — MFA failed
- `locked` — account locked
- `break_glass` — break-glass event

### 7.2 Platform audit sink

All CyIdentity events are also emitted to `platform_audit_logs` (immutable, hash-chained) via `AuditService.record()`. This ensures cross-service correlation and compliance evidence.

### 7.3 Domain events (Kafka outbox)

Every significant identity event emits to the Kafka outbox (`OutboxEvent`) for downstream consumers:
- `cyidentity.realm.status_changed`
- `cyidentity.client.secret_rotated` (via `AuditService`)
- `cyidentity.session.revoked`
- `cyidentity.break_glass.*`

---

## 8. Compliance Mapping

| Requirement | Control |
|---|---|
| HIPAA §164.312(a) — Access Control | RBAC roles + ABAC policies + MFA enforcement |
| HIPAA §164.312(d) — Person Authentication | WebAuthn passkeys + TOTP; no shared accounts |
| GDPR Art. 32 — Technical measures | Encryption in transit (TLS 1.3), at rest (PostgreSQL encryption), token short lifetimes |
| ISO 27001 A.5.15 — Access control | Realm isolation, role catalog, permission catalog |
| ISO 27001 A.5.18 — Access rights | SCIM provisioning, de-provisioning signals, audit trail |
| NIST 800-53 IA-2 — MFA | WebAuthn mandatory for workforce; phishing-resistant for PHI |
| NIST 800-53 AU-3 — Audit content | LoginAudit captures user, IP, outcome, method, timestamp |
| eIDAS — High assurance | FAPI 2.0 profile on applicable clients; national eID federation |

---

## 9. Security Hardening Checklist

- [ ] Keycloak SSL required in all non-dev environments (`sslRequired: external`)
- [ ] Brute force protection enabled on all realms (`bruteForceProtected: true`)
- [ ] Registration disabled on production realms (`registrationAllowed: false`)
- [ ] Direct access grants disabled on all client registrations
- [ ] Admin API restricted to internal network (not exposed externally)
- [ ] `KEYCLOAK_ADMIN_PASSWORD` stored in HashiCorp Vault, not env files
- [ ] JWKS endpoint rate-limited at the load balancer layer
- [ ] Audit log exports scheduled to cold storage daily
- [ ] Break-glass post-reviews tracked in compliance dashboard
