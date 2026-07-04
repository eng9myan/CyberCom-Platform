# ADR-0035: Identity Provider Finalization

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Domain Architect, Platform Architect, Chief Software Architect |
| **Affects** | CyIdentity, Authentication flows, Core Platform |
| **Tags** | governance, iam, keycloak, zitadel |
| **Related** | [ADR-0005](ADR-0005-identity-access-management-strategy.md), [ADR-0017](ADR-0017-cyidentity-product-strategy.md) |

---

## 1. Context

CyberCom requires a single, standards-based identity provider (IdP) to support multiple realms (Workforce, Citizen, Partner, Customer, and Workload identities). In [ADR-0017](ADR-0017-cyidentity-product-strategy.md), both Keycloak and Zitadel were proposed as potential platforms, with a final decision pending a Proof of Concept (PoC). 

---

## 2. Decision Drivers

-   **Ecosystem Maturity:** Production stability, deployment footprints, and support for enterprise protocols (SAML 2.0, OIDC, WebAuthn, SCIM 2.0).
-   **Multi-Tenancy Support:** Capability to manage isolated customer realms and local regionalizations (RTL, Arabic translation, national ID integrations).
-   **Custom Extension Support:** Ease of implementing custom event listeners, user federation hooks, and administrative REST API integrations.
-   **Regulatory Compliance:** Support for FIPS 140-3 cryptography, FAPI 2.0, and HIPAA auditing requirements.

---

## 3. Decision

We choose **Keycloak** as the primary Identity Provider (IdP) for the CyberCom Platform. Zitadel is deferred.

Keycloak will serve as the source of truth for OAuth 2.1 and OIDC flows, managing user realms (`workforce`, `customer-<tenant>`, `citizen-<jurisdiction>`, etc.). The `cyidentity` Django application will interact with Keycloak using the Keycloak Admin REST APIs to automate realm, client, group, and user provisioning.

---

## 4. Rationale

-   **Enterprise Validation:** Keycloak is widely adopted in government, healthcare, and finance sectors. It supports all critical enterprise integration features (e.g., Active Directory federation, SAML, WebAuthn, FAPI profiles) out-of-the-box.
-   **Rich Extensions:** Keycloak's Java-based SPI (Service Provider Interface) permits custom user storage providers, custom event listeners (to stream auth events to Kafka), and highly tailored theme overlays for RTL/Arabic logins.
-   **Zitadel Assessment:** While Zitadel offers excellent native multi-tenancy design, its ecosystem for legacy SAML integrations and medical device SMART-on-FHIR launch templates is less mature compared to Keycloak.

---

## 5. Consequences

### 5.1 Positive
- Locked and validated deployment target.
- Deep integration libraries (e.g., python-keycloak) reduce custom gateway development efforts.
- Native out-of-the-box support for WebAuthn passkeys.

### 5.2 Negative / Trade-offs
- Keycloak is resource-heavy (JVM-based), requiring larger memory profiles in Kubernetes node pools.
- Realm configuration management requires rigid IaC/API syncing to prevent drift.

---

## Revision History

| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Enterprise Architect | Proposed & Approved |
