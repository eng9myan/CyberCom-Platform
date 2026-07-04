# ADR-0005: Identity & Access Management Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Security Architect, Platform Architect, Chief Software Architect |
| **Affects** | All products; CyIdentity is the implementation |
| **Tags** | security, identity, authz, authn |
| **Related** | [identity_access_strategy](../security/identity_access_strategy.md), [security_architecture](../security/security_architecture.md) |

---

## 1. Context

CyberCom needs one identity model across workforce, customers, citizens, and services, with strong authentication, fine-grained authorization, and full auditability.

## 2. Problem Statement

Which IdP architecture, authentication methods, and authorization model does CyberCom adopt as the single source of truth?

## 3. Decision Drivers

- One identity for all human/service principals.
- Standards: OAuth 2.1, OIDC, SCIM, WebAuthn, SAML (federation).
- Phishing-resistant MFA.
- Policy-based authorization (not role-hardcoded).
- Multi-tenant + multi-realm.

## 4. Considered Options

1. **CyIdentity (own IdP) with hybrid RBAC+ABAC via policy engine** (chosen).
2. Pure commercial IdP (e.g. Okta/Auth0) for all identity domains.
3. Per-product IdP.

## 5. Decision

- **CyIdentity** is the single IdP for the platform across workforce, customer/tenant, citizen, and service realms.
- **AuthN:** OAuth 2.1 + OIDC; MFA mandatory (WebAuthn/passkey preferred); SAML for federation; SCIM for provisioning; mTLS or workload-OIDC for services.
- **AuthZ:** **policy engine** with **hybrid RBAC + ABAC**. Engine choice (**OPA/Rego** or **AWS Cedar**) deferred to follow-up sub-ADR after a 2-week PoC; both meet requirements.
- **JIT privileged access** for admin/ops; break-the-glass with audit.
- **Tokens:** short-lived (≤15 min user access, ≤5 min service), audience-scoped, signed; rotating refresh tokens.
- All authN/Z events flow to audit log (see [`audit_logging_strategy`](../security/audit_logging_strategy.md)).
- Detailed strategy in [`identity_access_strategy`](../security/identity_access_strategy.md).

## 6. Rationale

- One IdP avoids identity sprawl and reduces compliance scope.
- Standards-based ⇒ portable, interoperable with hospital IdPs, government eID, partner SSO.
- Policy engine externalizes authz so application code never hardcodes roles.

## 7. Consequences

### 7.1 Positive
- Single audit/lifecycle pane; consistent MFA.
- Policy changes ship as policy code, not app code.

### 7.2 Trade-offs
- Building/operating an IdP is a serious commitment; mitigate by leveraging proven OSS (Keycloak / Zitadel / Ory) as a base where applicable per follow-up ADR.

### 7.3 Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | CyIdentity is a single point of failure | Medium | Critical | Multi-region active-active; Tier-1 backup/DR |
| 2 | Policy engine learning curve | Medium | Medium | Reference policies + sample apps in standards-template |
| 3 | Federation drift across tenants | Medium | Medium | Automated SAML/OIDC metadata refresh; per-tenant smoke tests |

## 8. Compliance & Security Impact

- Maps directly to HIPAA §164.312(a)(d), GDPR Art. 32, ISO 27001 A.5.15–A.5.18, NIST 800-53 IA family.

## 9. Alternatives Rejected

- **Commercial IdP for everything** — vendor lock-in, sovereign-deployment constraints, weaker fit for citizen identity (eID).
- **Per-product IdP** — duplicated cost, fragmented audit, weaker compliance posture.

## 10. References

- [`identity_access_strategy`](../security/identity_access_strategy.md)
- OAuth 2.1, OIDC, WebAuthn, SCIM, SAML 2.0

---

## Revision History
| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Chief Security Architect | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
