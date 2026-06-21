# ADR-0026: Healthcare Credentialing & Privileging Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Healthcare Architect, Chief Security Architect, Chief Software Architect, Workforce Planning Architect |
| **Affects** | CyMed (CPOE, Scheduling), CyCom (HR), CyIdentity (Workforce Realm), Platform Policy Engine |
| **Tags** | architecture, healthcare, security, identity |
| **Related** | [ADR-0005](ADR-0005-identity-access-management-strategy.md), [ADR-0017](ADR-0017-cyidentity-product-strategy.md), [ADR-0018](ADR-0018-cycom-product-repositioning.md) |

---

## 1. Context

In clinical settings, verifying a practitioner's qualifications (**Credentialing**) and defining their authorized scope of clinical actions (**Privileging**) are vital for patient safety and regulatory compliance (HIPAA, JCIA, CBAHI, and regional ministries of health).

The system must ensure that:
1.  No clinician can enter orders (CPOE), administer medications (eMAR), or perform procedures (OR) without verified, active clinical credentials.
2.  Privileging boundaries are enforced dynamically at the CPOE boundary (e.g., an Orthopedic Surgeon cannot write chemotherapy orders; an Intern cannot prescribe high-alert medications without an Attending's co-signature).
3.  Enforcement is high-performance (overhead < 10ms per CPOE transaction) and operates across multi-hospital networks and sovereign deployments.

---

## 2. Problem Statement

What is the technical strategy for verifying clinical credentials and enforcing dynamic clinical privileging gates in the CyberCom platform?

---

## 3. Decision Drivers

- **Clinical Safety:** Prevent clinical errors by blocking unauthorized order entries before they reach clinical queues.
- **Performance:** Gating checks must not introduce latency to high-frequency clinician ordering workflows.
- **Sovereignty & Multi-Tenancy:** Must support regional verifications (KSA CBAHI, UAE DOH, Jordan MOH, US licensing boards) within tenant-isolated zones.
- **Separation of Duties (ADR-0018):** Maintain clean boundaries between back-office HR master records and active clinical execution engines.

---

## 4. Considered Options

1.  **Option 1: Static RBAC inside CyMed:** Hardcode clinical privileges based on generic roles (e.g., "Physician", "Nurse") in CyMed.
2.  **Option 2: Federated Credentialing and Privileging Service inside CyCom HR, caching active privileges to CyIdentity/Redis for high-speed ABAC gating at the CyMed CPOE boundary** (chosen).
3.  **Option 3: External Real-time RPC:** Query third-party national licensing databases synchronously during every clinical order entry.

---

## 5. Decision

**We choose Option 2.** 

*   **System of Record (SoR):** `CyCom HR` acts as the SoR for employee profiles, verified credentials (licenses, board certifications, DEA numbers), and institutional clinical privileges.
*   **Verification Engine:** CyCom HR utilizes integration adapters via `CyIntegration Hub` to verify license status asynchronously against national registries (e.g., Saudi Commission for Health Specialties - SCFHS, State Boards).
*   **Access Cache:** Active, valid privileging codes are compiled by CyCom HR and pushed via event triggers (`cybercom.cycom.credential.verified`) to `CyIdentity` (Workforce Realm) and the Platform Redis Cache.
*   **Gating Enforcement:** `CyMed CPOE` enforces gates locally by comparing the clinician's cached privileging claims against the metadata of the requested order.

```
 [CyCom HR] ➔ Verifies License Asynchronously (SCFHS/DHA)
     │
     ▼ (Event: cybercom.cycom.credential.verified)
 [CyIdentity / Redis] ➔ Caches Active Privileging Claims
     │
     ▼ (Token/Cache check at CPOE API Entry)
 [CyMed CPOE Gates] ➔ Authorizes or Gates Order Execution
```

---

## 6. Rationale

- **Clean Boundaries:** Keeps the operational administrative tracking (credential audits, verification processes) inside `CyCom HR`, preventing database pollution in the clinical `CyMed` database.
- **Performance:** Relying on Redis cache lookup or JWT claim checks keeps validation latency under 5ms, avoiding the performance penalties of Option 3.
- **Dynamic Adaptability:** If a credential expires, `CyCom HR` immediately publishes a revocation event, clearing the cache and blocking clinical CPOE access in real-time, which is impossible with Option 1's static roles.

---

## 7. Consequences

### 7.1 Positive
- High-performance, low-latency privilege checks.
- Real-time revocation of clinical access upon license expiration or credential suspension.
- Clear audit trails linking order placement to the clinician's active privileging status.

### 7.2 Trade-offs
- Requires secondary caching synchronization between CyCom and CyIdentity.
- A temporary caching sync failure could result in stale credential records (mitigated by setting a conservative 12-hour TTL on Redis privilege entries).

### 7.3 Risks introduced

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Sync latency allows suspended clinician to place orders | Low | High | Revocation events bypass the standard outbox queue; they are routed through high-priority Kafka topics directly to the cache. |
| 2 | Downstream verifier API is offline | Medium | Medium | Implement an "Active Grace Period" policy inside CyCom HR, allowing temporary override for up to 48 hours with supervisor sign-off. |

### 7.4 Follow-up actions
- [ ] Design the privileging JSON claim schema for the Workforce OIDC token — Security Architect — Phase 1.3.
- [ ] Define national registry API adapter specs in `docs/platforms/cyintegrationhub_architecture.md` — Integration Architect — Phase 1.3.

---

## 8. Compliance & Security Impact

*   **HIPAA §164.308(a)(3):** Ensures only verified clinical personnel have credentials to access and modify PHI.
*   **CBAHI / JCIA Standards:** Satisfies hospital accreditation requirements for continuous credential verification and documented privileging approvals.
*   **Audit Logging:** Every blocked transaction or clinical co-signature override is logged to the Platform Audit Sink with the verification outcome.

---

## 9. Alternatives Rejected

*   **Option 1 (Static RBAC):** Rejected because it cannot enforce dynamic, granular restrictions (e.g., restricting specific procedures to certified surgeons only) and fails to address real-time credential expirations.
*   **Option 3 (External RPC):** Rejected because clinical systems require zero-downtime, sub-second response times. Relying on external ministry APIs during emergency CPOE order entries poses an unacceptable safety risk.

---

## 10. References

*   [ADR-0005 Identity & Access Management Strategy](ADR-0005-identity-access-management-strategy.md)
*   [docs/healthcare/workforce_security_model.md](../healthcare/workforce_security_model.md)

---

## Revision History

| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Chief Healthcare Architect | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
