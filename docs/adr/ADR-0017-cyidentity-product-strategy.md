# ADR-0017: CyIdentity Product Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Security Architect, Chief Software Architect, Platform Architect, Compliance Architect |
| **Affects** | CyIdentity (the product); every product that authenticates anyone or anything |
| **Tags** | identity, product, security, compliance |
| **Related** | [ADR-0005](ADR-0005-identity-access-management-strategy.md), [ADR-0035](ADR-0035-identity-provider-finalization.md), [identity_access_strategy](../security/identity_access_strategy.md), [security_architecture](../security/security_architecture.md), [ADR-0008](ADR-0008-saas-deployment-strategy.md) |

---

## 1. Context

[ADR-0005](ADR-0005-identity-access-management-strategy.md) sets the platform-wide IAM **strategy**: CyIdentity is the single IdP, with OAuth 2.1 / OIDC / SCIM / WebAuthn / SAML federation, and a hybrid RBAC + ABAC policy engine. That ADR deliberately defers the **product** decisions: what we build vs buy/extend, the realm model, deployment topology, customer-facing features, and the multi-year roadmap.

This ADR makes those product decisions.

## 2. Problem Statement

What is the **product shape** of CyIdentity — its build approach, realm model, customer-facing capability set, deployment topology, and roadmap — that lets it serve workforce, customer/tenant, citizen, partner, and workload identities across SaaS, private cloud, and sovereign on-prem?

## 3. Decision Drivers

- Single IdP across four identity domains (workforce, customer/tenant, citizen, service/workload) — see [ADR-0005](ADR-0005-identity-access-management-strategy.md).
- Standards-first (OIDC, OAuth 2.1, SCIM, WebAuthn, SAML, FAPI 2.0 for high-assurance) so partners and national systems interoperate.
- Sovereign / on-prem deployments **and** SaaS from the same product.
- **Time-to-value:** the first product (CyMed / CyCitizen) needs CyIdentity working in months, not years.
- Mitigate the **single-point-of-failure** risk explicitly named in [ADR-0005](ADR-0005-identity-access-management-strategy.md) §7.
- Compliance: HIPAA, GDPR, eIDAS-aligned, national eID schemes.
- Cost: a small platform team must operate it.

## 4. Considered Options

1. **Build CyIdentity on a vetted OSS IdP base (Keycloak or Zitadel), with CyberCom-owned control plane, customer/citizen UX, and integrations** (chosen).
2. Build the IdP from scratch.
3. Resell / OEM a commercial IdP (Okta / Auth0 / Microsoft Entra) and call it CyIdentity.
4. Different IdPs per identity domain.

## 5. Decision

### 5.1 Build approach

- **Build on a vetted OSS IdP base. Base selected: Keycloak 24** — see [ADR-0035](ADR-0035-identity-provider-finalization.md). Both candidates (Keycloak, Zitadel) met baseline standards (OIDC, OAuth 2.1, SCIM, SAML, WebAuthn); Keycloak selected for FAPI 2.0 certification, SMART on FHIR, and CIBA.
- **CyberCom owns:**
  - **Control plane** (tenant lifecycle, realm/policy provisioning, audit export, SCIM ingress).
  - **Customer / citizen UX** (white-labelable login, MFA enrollment, account, consent, recovery flows).
  - **Federation & partner connectors** (national eID schemes, hospital IdPs, government SSO).
  - **Policy distribution** (push policies to the platform-wide policy engine — see [ADR-0005](ADR-0005-identity-access-management-strategy.md)).
  - **Workload identity bridge** (CyIdentity ↔ SPIFFE/SPIRE in the mesh — see [ADR-0013](ADR-0013-service-mesh-strategy.md)).
  - **Compliance evidence pack** (audit export, access reviews, regulatory mappings).
- **CyberCom does not re-implement:** the OIDC/OAuth/SAML protocol layer, base session/token logic, base cryptography — the OSS base owns those.
- Customizations live above the OSS base via supported extension points (themes, custom flows, event listeners, REST extensions), not forks. Forking is forbidden without an ADR.

### 5.2 Realms (identity domains)

| Realm | Population | Federation | MFA |
|---|---|---|---|
| `workforce` | CyberCom employees + contractors | Federated to corporate IdP (OIDC/SAML) | WebAuthn mandatory |
| `customer-<tenant>` | Hospital staff, ERP users, etc. (one realm per tenant) | Optional federation to tenant's IdP | MFA mandatory; phishing-resistant required for PHI/PII/financial scope |
| `citizen-<jurisdiction>` | Citizens for CyCitizen | National eID where available; OIDC fallback | MFA mandatory; phishing-resistant for high-assurance services |
| `partner` | B2B integrations | SAML / OIDC | mTLS or signed JWT for services; MFA for human admins |
| `workload` | Services / jobs / agents | n/a | SPIFFE SVIDs (mesh) + short-lived OIDC for non-mesh callers |

Realm provisioning is IaC (Terraform CyIdentity provider) + control-plane API; manual realm creation forbidden.

### 5.3 Customer-facing capability set (v1)

- **Sign-in:** username/password (optional), WebAuthn/passkey (primary), TOTP, push, SMS/email OTP (fallback only — never for PHI/PII/financial).
- **MFA enrollment + recovery** (recovery codes, secondary factor, account-recovery workflow).
- **Tenant admin portal:** users, roles, federation config, audit view, app registration, SCIM tokens.
- **End-user account:** profile, devices, sessions, consents, app authorizations, recent activity.
- **Consent & purpose-of-use** capture (drives policy engine + audit).
- **Privacy self-service:** access request export + erasure request (routes to control plane).
- **White-labelling:** per-tenant themes, logos, copy, custom domains.
- **Internationalization:** all flows i18n + RTL from day one (per [`frontend_standards`](../standards/frontend_standards.md)).
- **SMART on FHIR app launch** ([ADR-0007](ADR-0007-healthcare-interoperability-strategy.md)) — clinician/patient app onboarding.
- **APIs:** OIDC discovery, token, userinfo, introspection, revocation, JWKS, SCIM, admin REST.

### 5.4 Workload identity

- **SPIFFE SVIDs** issued by SPIRE inside each mesh (per [ADR-0013](ADR-0013-service-mesh-strategy.md)).
- **CyIdentity bridge:** out-of-mesh services obtain short-lived OIDC tokens from CyIdentity workload realm via workload-binding (K8s SA → CyIdentity exchange).
- CI/CD uses **GitHub OIDC → CyIdentity workload realm → cloud role**; no long-lived secrets.

### 5.5 Standards & assurance levels

- **OAuth 2.1**, OIDC Core + Discovery + Dynamic Client Registration (gated), CIBA for back-channel flows.
- **FAPI 2.0** profile for high-assurance APIs (financial, government, payer).
- **WebAuthn L3** + Passkey support.
- **SCIM 2.0** for provisioning.
- **SAML 2.0** for federation only.
- **eIDAS / NIST 800-63** assurance levels mapped per realm (Low/Substantial/High; IAL2/AAL2 baseline).

### 5.6 Deployment topology

| Mode | Topology |
|---|---|
| **SaaS** | Multi-region active/active; per-region CyIdentity cluster; tenant realms sharded by region with home-region pinning for residency |
| **Dedicated SaaS** | Per-tenant or per-tenant-group cluster (T-DB / T-Cluster per [ADR-0002](ADR-0002-multi-tenancy-strategy.md)) |
| **Private cloud (BYOC)** | CyIdentity stack in customer cloud; control plane bridged over mTLS |
| **On-prem / Sovereign** | Same Helm charts + signed bundles; air-gap option; offline-update flow |

- **Tier-1** service: multi-AZ default; multi-region active/active for SaaS production.
- **SPOF mitigation** ([ADR-0005](ADR-0005-identity-access-management-strategy.md) Risk-1): multi-region, regional failover, **graceful-degradation libraries** in every product (cached JWKS, longer-lived bearer tokens during outage, read-only fallback for non-sensitive paths).
- **Data tier:** PostgreSQL per [`database_standards`](../standards/database_standards.md) + [ADR-0014](ADR-0014-database-scaling-strategy.md); audit log on the immutable platform sink per [`audit_logging_strategy`](../security/audit_logging_strategy.md).
- **Key management:** per-region KMS; BYOK for regulated tenants; JWT signing keys rotate every 30 days via `kid` rotation with overlap window.

### 5.7 Policy & authorization integration

- CyIdentity owns **authentication** and **identity attributes** (roles, group memberships, attribute claims).
- CyIdentity issues tokens carrying minimal claims; **authorization decisions** happen at the policy engine ([ADR-0005](ADR-0005-identity-access-management-strategy.md)) on the application side.
- Policy bundles are versioned and distributed from CyIdentity control plane to per-cluster policy engines.

### 5.8 Operations

- Tier-1 SLOs (per [`platform_engineering_baseline`](../platforms/platform_engineering_baseline.md) §5): **99.95% availability**, login p95 ≤ 500 ms.
- Per-region runbooks, DR drills quarterly, signed bundles for sovereign updates.
- All admin actions audited; admin standing access forbidden — JIT PAM with dual approval (per [`identity_access_strategy`](../security/identity_access_strategy.md) §6).

### 5.9 Roadmap (high-level)

| Phase | Outcome |
|---|---|
| **P1.1** | Keycloak/Zitadel PoC → ADR-0017a; CyIdentity v0.1 with workforce + first tenant customer realm in `dev`/`stage`; SCIM-in/OIDC-out working; WebAuthn for workforce; observability + audit wired |
| **P1.2** | Tenant onboarding self-service; per-tenant themes + custom domains; SMART on FHIR app launch; SAML federation for first hospital partner |
| **P1.3** | Multi-region active/active; FAPI 2.0 profile; CIBA; clinical break-the-glass flow with audit |
| **P1.4** | Citizen realm + national eID federation (first jurisdiction); consent management v1; privacy self-service exports |
| **P2** | BYOK per-tenant key management; sovereign on-prem signed-bundle pipeline; multi-cluster federation via mesh; advanced fraud / risk scoring |
| **P3** | Decentralized identity (Verifiable Credentials, OID4VC) where regulation requires |

## 6. Rationale

- **Build on OSS base** captures 5+ years of compliance and protocol work we'd otherwise rebuild — and lets us own the differentiating layers (customer UX, control plane, integrations, governance).
- **Both Keycloak and Zitadel** are credible bases; deferring to a 3-week PoC avoids debating ergonomics vs first-hand evidence.
- **Resell-only** would forfeit sovereign / on-prem and saddle the platform with vendor-shape compliance scope.
- **Per-domain IdPs** would fragment identity, multiply audit surface, and defeat the [ADR-0005](ADR-0005-identity-access-management-strategy.md) premise.
- **Multi-region + graceful degradation** directly answers the SPOF concern raised against the single-IdP decision.

## 7. Consequences

### 7.1 Positive
- Time-to-value within the first product cycle.
- Strong compliance posture from day one (we don't re-implement crypto/protocols).
- Sovereign / on-prem viable on the same product.
- Clear seam between **authentication** (CyIdentity) and **authorization** (policy engine).

### 7.2 Trade-offs
- Operating an IdP (even on OSS base) is a serious commitment — upgrades, CVEs, migrations.
- We own customer UX quality; bad UX in CyIdentity becomes a customer-facing problem in every product.

### 7.3 Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | OSS base direction diverges from our needs | Medium | High | Stay on supported releases; contribute upstream; abstract via control plane so a base swap is feasible (costly but possible) |
| 2 | OSS base CVE under active exploitation | Medium | Critical | Patch SLA per [`security_architecture`](../security/security_architecture.md); signed-bundle propagation for sovereign |
| 3 | Customization debt via theme/extension sprawl | High | Medium | Single design system; extension review; deprecate forks |
| 4 | National eID schemes vary widely / change | High | Medium | Per-jurisdiction connector packs; capability matrix; conformance harness |
| 5 | SPOF for the platform (re-raise of ADR-0005 Risk-1) | Medium | Critical | Multi-region active/active; graceful-degradation libraries; cached JWKS; chaos drills |
| 6 | Customer-realm sprawl operational burden | High | Medium | Realm-as-code; lifecycle automation; per-tenant SLOs |
| 7 | FAPI 2.0 / SMART on FHIR conformance gaps | Medium | High | Conformance test harness in CI; certification where required |
| 8 | Break-the-glass abuse | Medium | High | Time-boxed, dual-approval, mandatory post-review within 24 h; SIEM detections |
| 9 | Migration from a prior tenant IdP | High | Medium | Documented migration runbooks; coexistence via federation during transition |
| 10 | Key-rotation outage (JWT signing) | Low | Critical | Overlap window; canary verification; chaos drill |

### 7.4 Follow-up actions
- [x] **ADR-0035:** OSS base selection — **Keycloak 24 selected** — see [ADR-0035](ADR-0035-identity-provider-finalization.md) — Chief Security Architect, 2026-06-21. ✅ CLOSED
- [ ] Author **CyIdentity reference architecture** in `docs/architecture/cyidentity/` — Security Architect, Program 1 Sprint 2.
- [ ] Author **realm provisioning runbook** + Terraform module — Platform Eng + Security, Program 1 Sprint 2.
- [ ] Author **graceful-degradation library spec** for product SDKs — Platform Eng, Program 1 Sprint 2.
- [ ] Define **conformance test harness** (OIDC + SMART on FHIR + FAPI) — QA Architect + Security, Program 1 Sprint 3.
- [ ] Publish **per-jurisdiction eID connector matrix** — Compliance Architect, Program 1 Sprint 3.

## 8. Compliance & Security Impact

- HIPAA §164.312(a)(d), GDPR Art. 32, ISO 27001 A.5.15–A.5.18, NIST 800-53 IA family — all mapped to concrete CyIdentity controls.
- eIDAS / NIST 800-63 assurance levels supported per realm.
- Audit log on the immutable platform sink — first-class evidence for every authN/Z event.
- Workforce phishing-resistant MFA mandatory by P1; customers/citizens on a documented rollout.

## 9. Alternatives Rejected

- **Build from scratch** — re-implementing OIDC/OAuth/SAML/WebAuthn is years of work with attack-surface risk that doesn't differentiate CyberCom.
- **Resell commercial IdP** — fastest to ship SaaS-only, but blocks sovereign on-prem and traps regulated tenants in vendor compliance scope.
- **Per-domain IdPs** — fragments identity, audit, and ops; directly contradicts [ADR-0005](ADR-0005-identity-access-management-strategy.md).

## 10. References

- [ADR-0005 Identity & Access Management Strategy](ADR-0005-identity-access-management-strategy.md)
- [`identity_access_strategy`](../security/identity_access_strategy.md), [`security_architecture`](../security/security_architecture.md), [`audit_logging_strategy`](../security/audit_logging_strategy.md)
- OAuth 2.1, OIDC Core / Discovery / DCR, FAPI 2.0, SCIM 2.0, SAML 2.0, WebAuthn L3, CIBA, SMART on FHIR
- eIDAS; NIST 800-63; HIPAA; GDPR

---

## Revision History
| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Chief Security Architect | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
