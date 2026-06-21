# ADR-0035: Identity Provider Finalization — Keycloak 24

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Security Architect, Platform Architect, Chief Software Architect, Compliance Architect |
| **Consulted** | Healthcare Integration Lead, DevOps Lead, Sovereign Deployment Lead |
| **Informed** | All product teams, CyIdentity squad |
| **Affects** | CyIdentity, all products that authenticate via CyIdentity, CyMed (SMART on FHIR), CyGov (FAPI 2.0), CyCitizen (national eID), sovereign/on-prem deployments |
| **Tags** | identity, security, authentication, compliance, keycloak |
| **Related** | [ADR-0005](ADR-0005-identity-access-management-strategy.md) · [ADR-0017](ADR-0017-cyidentity-product-strategy.md) · [ADR-0007](ADR-0007-healthcare-interoperability-strategy.md) · [ADR-0008](ADR-0008-saas-deployment-strategy.md) · [ADR-0013](ADR-0013-service-mesh-strategy.md) · [cyidentity_architecture](../platforms/cyidentity_architecture.md) · [identity_access_strategy](../security/identity_access_strategy.md) |

---

## 1. Context

[ADR-0005](ADR-0005-identity-access-management-strategy.md) established CyIdentity as the single IdP for the platform.
[ADR-0017](ADR-0017-cyidentity-product-strategy.md) §5.1 decided to build on a vetted OSS IdP base and deferred the **base selection** to a 3-week PoC comparing Keycloak and Zitadel, tracked as follow-up action ADR-0017 §7.4 bullet 1.

Program 2.0 bootstrap deployed Keycloak 24 to the local dev stack as a working baseline. This ADR closes the deferred PoC, formally selects the base, and locks implementation direction for Program 2.1 CyIdentity sprint work.

**Scope of this decision:** which OSS IdP base underpins CyIdentity's `AuthN Core` module. It does not re-open any other decision from ADR-0005 or ADR-0017.

---

## 2. Problem Statement

Which OSS IdP base — **Keycloak 24** or **Zitadel 2.x** — should CyberCom adopt for CyIdentity, given the full requirements set across healthcare interoperability, government-grade API assurance, sovereign/on-prem deployment, multi-tenant realm management, and phishing-resistant authentication?

---

## 3. Decision Drivers

In priority order:

1. **FAPI 2.0 certification** — mandated in ADR-0017 §5.5 for high-assurance government and financial APIs (CyGov, payer integrations).
2. **SMART on FHIR app launch** — mandated in ADR-0007 for CyMed clinical application onboarding; must work without custom-building the launch protocol.
3. **CIBA (Client-Initiated Backchannel Authentication)** — required for decoupled clinical pager and push-approval workflows referenced in ADR-0017 §5.5.
4. **SAML 2.0 federation as IdP** — hospital partner IdPs (ADFS, Azure AD, Okta) federate via SAML; required before first CyMed tenant onboarding.
5. **SCIM 2.0 provisioning** — HRIS joiner/mover/leaver automation and tenant-IdP SCIM feeds (ADR-0017 §5.3).
6. **WebAuthn L3 + passkeys** — mandatory phishing-resistant MFA (ADR-0005).
7. **Per-tenant realm isolation** — one realm per `customer-<tenant>` and one per jurisdiction for citizens (ADR-0017 §5.2).
8. **Theming and white-labelling** — per-tenant branded login, Arabic RTL support (ADR-0032).
9. **Sovereign / air-gap deployment** — signed bundle delivery to on-prem sovereign environments (ADR-0008).
10. **Multi-region active/active** — Tier-1 SLO 99.95% / login p95 ≤ 500 ms (ADR-0017 §5.8).
11. **Extension via supported SPIs, not forks** — ADR-0017 §5.1 forbids forks without an ADR.
12. **Team operability** — small platform team; operator tooling, Helm, K8s operator maturity matters.

---

## 4. Considered Options

1. **Keycloak 24** — Red Hat–backed Java/Quarkus OSS IdP (2014–present). OIDC, OAuth 2.1, SAML 2.0 IdP + SP, SCIM (extension), WebAuthn/passkey, CIBA, FAPI 2.0 certified. Realm-per-tenant model.

2. **Zitadel 2.x** — Cloud-native Go OSS IdP (2020–present). OIDC, OAuth 2.1, modern API (gRPC + REST), organization model, WebAuthn/passkey. FAPI 2.0 not certified; CIBA absent; SMART on FHIR absent; SAML IdP partial.

3. **Ory Hydra + Kratos** — decoupled components (authorization server + identity manager). Maximum flexibility; highest assembly and operational burden; no path to SMART on FHIR or FAPI 2.0 certification without significant build.

---

## 5. Decision

**We select Keycloak 24 as the CyIdentity OSS base IdP.**

Keycloak is the only evaluated option that satisfies all three hard requirements simultaneously: FAPI 2.0 certification, SMART on FHIR support, and CIBA. The gap profile of the alternatives makes them non-viable for the ADR-0007 and ADR-0017 mandates without multi-year custom development that defeats the purpose of building on an OSS base.

### 5.1 Selected version and upgrade path

| Milestone | Version | Notes |
|---|---|---|
| Program 2.1 (now) | Keycloak 24 | Deployed in bootstrap; FAPI 2.0 certified; actively supported |
| Program 2.2 | Keycloak 25 / 26 | Upgrade when stable; non-breaking realm data model |
| Long-term | Follow Red Hat major releases | Stay within N or N-1; track RHBK (Red Hat Build of Keycloak) for enterprise support |

### 5.2 Configuration baseline

| Setting | Value | Rationale |
|---|---|---|
| Database | PostgreSQL 16 (platform standard) | ADR-0001; no embedded H2 in any environment |
| Clustering | Infinispan distributed cache; JGroups JDBC_PING for K8s discovery | No Zookeeper dependency |
| TLS termination | At ingress (nginx / Istio); Keycloak HTTP on internal port 8080 | mTLS inside mesh (ADR-0013) |
| Realm provisioning | Terraform CyIdentity provider + Admin REST; no manual console changes | ADR-0017 §5.2 — realm-as-code |
| Token signing | RS256 with JWKS; `kid` rotation every 30 days, overlap 24 h | ADR-0005; ADR-0017 §5.6 |
| Session / refresh tokens | Access ≤ 15 min; refresh rotating, single-use; reuse → revoke chain | ADR-0005 §3.3 |
| Admin access | JIT via PAM workflow; no standing admin accounts in production | identity_access_strategy §6 |
| FAPI 2.0 profile | Enabled per realm for CyGov, payer, high-assurance APIs | ADR-0017 §5.5 |
| SMART on FHIR | Keycloak SMART on FHIR extension (smart-on-fhir-keycloak); pinned version | ADR-0007 |
| CIBA | Built-in CIBA flow; `backchannel_authentication_endpoint` enabled per realm | ADR-0017 §5.5 |
| WebAuthn | `webauthn-register` + `webauthn-authenticate` flows; L3 attestation; passkeys enabled | ADR-0005 |
| Theming | Per-realm Freemarker themes (Keycloak.X SPI); CSS design tokens from ADR-0032 | ADR-0032; ADR-0017 §5.3 |
| i18n | `ar` locale added to all realms; `dir: rtl` injected in theme base template | ADR-0032 |
| SCIM 2.0 | Phase Two SCIM extension (or equivalent maintained extension) | ADR-0017 §5.3 |

### 5.3 Realm map

| Realm name | Population | SAML federation | FAPI 2.0 | SMART on FHIR |
|---|---|---|---|---|
| `cybercom-workforce` | CyberCom employees + contractors | Corporate IdP (OIDC/SAML) | No | No |
| `customer-{tenant-slug}` | Hospital staff, ERP users, tenant admins | Optional; per-tenant hospital ADFS / Azure AD | Optional (required for payer tenants) | Optional (required for CyMed tenants) |
| `citizen-{jurisdiction}` | Citizens (CyCitizen, CyGov) | National eID (OIDC / eIDAS) | Required (government services) | No |
| `partner` | B2B integrations | SAML / OIDC | mTLS + signed JWT | No |
| `workload` | Services, jobs, agents | n/a | No | No |

All realm provisioning via Terraform; manual realm creation in production blocked by OPA policy.

### 5.4 Extension policy

| Extension type | Allowed | Mechanism |
|---|---|---|
| Login flows | Yes | Authentication Flow SPI |
| Custom themes | Yes | Freemarker + Keycloak.X theme SPI |
| Event listeners | Yes | Event Listener SPI (audit, SIEM integration) |
| Protocol mappers | Yes | Protocol Mapper SPI |
| SCIM provider | Yes | Approved third-party extension |
| SMART on FHIR | Yes | Approved third-party extension |
| Source fork | **Forbidden** | Requires separate ADR |
| Custom Java classes injected into realm data | **Forbidden** | No escape-hatch class loading |

### 5.5 Deployment topology

Mirrors ADR-0017 §5.6 — no change to topology decisions. Keycloak fits all four deployment modes:

| Mode | Keycloak topology |
|---|---|
| SaaS multi-region | Per-region Keycloak cluster; Infinispan cross-region replication for sessions; per-realm home-region pinning |
| Dedicated SaaS | Per-tenant-group Keycloak cluster |
| Private cloud (BYOC) | Customer VPC; Admin REST bridge over mTLS |
| Sovereign on-prem | Same Helm charts + image bundle; air-gap image mirror; offline realm export/import |

### 5.6 Graceful degradation

Per ADR-0005 Risk-1 (SPOF) and ADR-0017 §5.6:

- All products ship a **JWKS cache** (5-minute TTL; serve cached JWKS on network error up to 60 minutes).
- Access tokens extended to ≤ 30 minutes during declared CyIdentity degraded-mode incident (OPA policy switch; auto-reverted).
- Read-only fallback: unauthenticated product paths (informational pages) bypass auth check when CyIdentity health endpoint returns `503`.
- Per-region Keycloak independently serves its realm; cross-region sessions require replication but auth still works region-local.

---

## 6. Rationale

### 6.1 Evaluation matrix

| Requirement | Keycloak 24 | Zitadel 2.x | Ory Stack | Weight |
|---|---|---|---|---|
| FAPI 2.0 certified | ✅ OpenID Foundation certified | ❌ Not certified | ❌ Not certified | **Critical** |
| SMART on FHIR app launch | ✅ Mature extension | ❌ Absent | ❌ Build from scratch | **Critical** |
| CIBA | ✅ Built-in since v18 | ❌ Absent | ❌ Requires custom build | **Critical** |
| SAML 2.0 as IdP | ✅ Full, widely deployed | ⚠️ Partial (SP only mature) | ⚠️ Hydra SP only | High |
| SCIM 2.0 | ✅ Extension (Phasetwo / RH) | ⚠️ v2 in progress | ❌ Not available | High |
| WebAuthn L3 / Passkey | ✅ Built-in, L3 attestation | ✅ | ✅ Kratos | High |
| Per-tenant realm isolation | ✅ Native realm model | ✅ Organization model | ⚠️ Manual assembly | High |
| Theming / white-label | ✅ Freemarker SPI, per-realm | ⚠️ Actions flows (less mature) | ❌ No UI, bring your own | High |
| Arabic RTL i18n | ✅ `ar` locale built-in; theme CSS overrides documented | ⚠️ Limited testing | ❌ N/A | High |
| Sovereign / air-gap | ✅ Proven (US DoD, EU gov) | ⚠️ Less documented | ⚠️ Possible, less proven | High |
| Multi-region clustering | ✅ Infinispan; production-proven | ✅ CockroachDB / Spanner option | ⚠️ Manual | High |
| HIPAA BAA (vendor) | ✅ Red Hat BAA available | ❌ None | ❌ None | Medium |
| Kubernetes operator | ✅ Keycloak Operator (RH) | ✅ Zitadel Operator | ⚠️ None native | Medium |
| Extension without fork | ✅ 10+ SPI hooks | ✅ Actions; fewer hooks | ⚠️ Config-only | Medium |
| Memory footprint | ⚠️ ~500 MB per instance | ✅ ~150 MB | ✅ Low | Low |
| eIDAS / NIST 800-63 | ✅ Documented compliance | ⚠️ Partial | ❌ Build required | Medium |
| OIDC Dynamic Client Reg | ✅ Policy-gated | ✅ | ✅ | Medium |
| Community + longevity | ✅ 10+ yr; Red Hat sponsored | ⚠️ 5 yr; no major backer | ✅ CNCF project | Medium |

**Score summary:** Keycloak satisfies all Critical + High requirements. Zitadel has 3 Critical gaps. Ory has 3 Critical + 3 High gaps.

### 6.2 Why Zitadel gaps are blockers

- **FAPI 2.0 not certified:** ADR-0017 §5.5 mandates it for government/financial APIs. Building a FAPI 2.0 compliant token endpoint on an uncertified base is equivalent to building from scratch — it defeats the purpose of choosing an OSS base and creates an unverifiable compliance claim.

- **SMART on FHIR absent:** First product (CyMed) requires SMART on FHIR app launch. Without it, CyMed cannot onboard EHR-embedded apps. Alternative: build the launch protocol as a custom Zitadel extension — estimated 6–12 months of security-sensitive protocol work on a healthcare-critical path.

- **CIBA absent:** Decoupled auth (on-call physician paging, pharmacy approval flows, push-to-device MFA) requires CIBA. Alternative: build a custom backchannel endpoint — protocol complexity is high; risk of non-conformance.

### 6.3 Why Keycloak memory footprint is acceptable

At 500 MB per instance and 2-replica minimum, CyIdentity runs at ~1 GB per region — well within the ResourceQuota headroom. The Quarkus-based Keycloak.X (default since v17) starts in ~2 seconds and has a smaller footprint than legacy WildFly Keycloak.

---

## 7. Consequences

### 7.1 Positive

- FAPI 2.0, SMART on FHIR, CIBA, SAML 2.0 all available out-of-box or via approved extensions — no custom protocol builds.
- Red Hat HIPAA BAA and enterprise support available — directly supports healthcare compliance evidence.
- Arabic (`ar`) locale and RTL theming documented and proven — unblocks ADR-0032 i18n from day one.
- Sovereign/air-gap track record in regulated government environments.
- Existing CyberCom bootstrap (Docker Compose, Helm chart, Kubernetes overlay) already uses Keycloak 24 — no migration needed.
- Large community, extension ecosystem, StackOverflow coverage — reduces internal L2 load.

### 7.2 Trade-offs

- Java/Quarkus ~500 MB per instance vs Zitadel ~150 MB. Mitigated: modern JVM heap tuning, horizontal scaling before vertical.
- Admin UI less intuitive than Zitadel console for new operators. Mitigated: Terraform realm-as-code means console is read-only for configuration; runbooks cover common ops.
- SCIM 2.0 requires a third-party extension (not in the Keycloak core). Mitigated: Phasetwo SCIM extension is actively maintained; pin version in Helm chart; evaluate Red Hat's upcoming native SCIM.
- Extension API (SPIs) is Java-only — Go extensions are not possible. Mitigated: all CyberCom extensions are thin (event listeners, mappers, theme providers); no need for deep protocol extension.

### 7.3 Risks introduced

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Keycloak major-version upgrade breaks extension SPIs | Medium | High | Pin extension versions; test upgrades in `test` env before staging; maintain upgrade runbook |
| 2 | SCIM extension EOL or unmaintained | Medium | High | Evaluate Red Hat native SCIM per roadmap; maintain an abstraction layer so extension is swappable |
| 3 | SMART on FHIR extension incompatibility with Keycloak version | Medium | High | Pin SMART extension to Keycloak minor version; conformance test in CI (ADR-0017 §7.4) |
| 4 | JVM heap pressure under realm count spike | Low | Medium | Set `-Xmx` based on realm count profiling; HPA on requests-per-second; load test in `stage` |
| 5 | Keycloak CVE with no patch (zero-day window) | Low | Critical | RH CVE feeds in SIEM; patch SLA (critical ≤ 24 h); nightly Trivy scan of image |
| 6 | Arabic RTL theme regression after Keycloak upgrade | Medium | Medium | RTL smoke tests in playwright suite; theme locked to Keycloak minor version |
| 7 | FAPI 2.0 conformance drift across Keycloak upgrades | Low | High | FAPI 2.0 conformance test harness in CI (OpenID Foundation conformance suite) |

### 7.4 Follow-up actions

- [ ] **Pin SMART on FHIR extension** (`smart-on-fhir-keycloak` or equivalent) in `infrastructure/helm/cybercom-platform/values.yaml` — Platform Eng — Program 2.1 Sprint 1
- [ ] **SCIM extension:** evaluate Phasetwo SCIM vs other maintained options; document selection + version in `docs/platforms/cyidentity_architecture.md` — CyIdentity squad — Program 2.1 Sprint 1
- [ ] **Realm provisioning Terraform module** — `infrastructure/terraform/modules/keycloak/` — Platform Eng + Security — Program 2.1 Sprint 1–2
- [ ] **Keycloak Helm values** per environment (`values.dev.yaml`, `values.staging.yaml`, `values.prod.yaml`) — DevOps — Program 2.1 Sprint 1
- [ ] **Arabic RTL theme** — base Freemarker theme + CSS logical properties from ADR-0032 design tokens — Frontend + CyIdentity — Program 2.1 Sprint 2
- [ ] **FAPI 2.0 conformance harness** in CI (`cyidentity/conformance/` test suite; OID4 conformance runner) — QA Architect — Program 2.1 Sprint 2–3
- [ ] **SMART on FHIR conformance test** in CI (`inferno-framework` or equivalent) — Healthcare Integration Lead — Program 2.1 Sprint 3
- [ ] **CIBA flow test** for clinical push-approval workflows — CyIdentity squad — Program 2.1 Sprint 3
- [ ] **Upgrade runbook** for Keycloak major version transitions in `docs/platforms/cyidentity_architecture.md` — SRE Lead — Program 2.1 Sprint 2
- [ ] **Update `cyidentity_architecture.md`** to replace "Keycloak or Zitadel" language with "Keycloak 24" — CyIdentity squad — Program 2.1 Sprint 1
- [ ] **Close ADR-0017 follow-up action** (§7.4 bullet 1) by linking to this ADR — Chief Security Architect — Program 2.1 Sprint 1

---

## 8. Compliance & Security Impact

| Standard | Impact | Note |
|---|---|---|
| HIPAA §164.312(d) | ✅ | Keycloak supports entity authentication controls; Red Hat HIPAA BAA available |
| GDPR Art. 32 | ✅ | Password hashing (Argon2id), token encryption, audit events; data residency via realm home-region pinning |
| ISO 27001 A.5.15–A.5.18 | ✅ | Access control, identity management, authentication controls mapped to Keycloak features |
| NIST 800-63 B (AAL2+) | ✅ | WebAuthn + TOTP satisfy AAL2; passkeys + hardware bound satisfy AAL3 for high-assurance realms |
| eIDAS Substantial | ✅ | OIDC flows satisfy eIDAS Substantial; High assurance requires FAPI 2.0 profile (enabled per realm) |
| FAPI 2.0 | ✅ | OpenID Foundation certified; required for CyGov and payer APIs |
| SMART on FHIR | ✅ | Extension provides conformant launch protocol; required for CyMed EHR-embedded app flows |
| PCI-DSS 4.0 MFA | ✅ | WebAuthn mandatory; step-up for high-value transactions |

**New threat model entries:**
- `TM-CYID-001`: Keycloak Admin REST exposed → mitigate: internal-only; PAM-gated; OPA policy deny external access.
- `TM-CYID-002`: SCIM token compromise → mitigate: SCIM tokens stored in Vault; rotated quarterly; scoped to single tenant realm.
- `TM-CYID-003`: Extension supply chain (SMART/SCIM jars) → mitigate: pin versions; verify checksums in Dockerfile; Trivy scan.

---

## 9. Alternatives Rejected

**Zitadel 2.x** — rejected due to three critical blockers against ADR-0017 §5.5 requirements:
(1) FAPI 2.0 not certified by OpenID Foundation as of this ADR; government and payer integrations require certification, not self-attestation.
(2) SMART on FHIR app launch absent; CyMed clinical onboarding cannot proceed without it; building the protocol on an uncertified base carries unacceptable patient-safety risk.
(3) CIBA absent; clinical decoupled auth flows require it.
Zitadel's superior developer experience (gRPC API, lower memory, modern console) is a real advantage but is outweighed by protocol gaps on the critical path. If FAPI 2.0 certification, SMART on FHIR, and CIBA land in a future Zitadel release, re-evaluate at that milestone — the platform extension abstraction is designed to tolerate a base swap.

**Ory Hydra + Kratos** — rejected due to assembly burden: two separate OSS components, no built-in UI, no path to FAPI 2.0 or SMART on FHIR certification, no CIBA. Maximum flexibility at maximum operational cost; disproportionate to platform team size. Ory remains a consideration for **workload-only** OAuth flows (e.g. a lightweight internal token exchange service) in a future ADR.

**Remaining on "PoC pending"** — rejected. Program 2.1 CyIdentity sprints begin immediately. Indecision forces teams to hedge (duplicate abstractions, avoid SMART on FHIR planning) at high coordination cost. The evaluation evidence is sufficient.

---

## 10. References

- [ADR-0005 Identity & Access Management Strategy](ADR-0005-identity-access-management-strategy.md)
- [ADR-0007 Healthcare Interoperability Strategy](ADR-0007-healthcare-interoperability-strategy.md)
- [ADR-0017 CyIdentity Product Strategy](ADR-0017-cyidentity-product-strategy.md) — this ADR closes §7.4 bullet 1
- [cyidentity_architecture](../platforms/cyidentity_architecture.md)
- [identity_access_strategy](../security/identity_access_strategy.md)
- Keycloak 24 documentation — keycloak.org
- OpenID Foundation FAPI 2.0 Certification — openid.net/certification/#FAPI_OPs
- SMART on FHIR — smarthealthit.org
- CIBA Core spec — openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html
- NIST SP 800-63B — pages.nist.gov/800-63-3
- Phasetwo SCIM extension — github.com/p2-inc/keycloak-magic-link (SCIM branch)
- Inferno SMART on FHIR conformance framework — inferno-framework.org
- RHBK (Red Hat Build of Keycloak) — access.redhat.com

---

## Revision History

| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Chief Security Architect | Proposed — closes ADR-0017 §7.4 bullet 1 |
| 2026-06-21 | Architecture Board | Accepted |
