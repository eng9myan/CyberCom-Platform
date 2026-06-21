# ADR-0026: Healthcare Credentialing & Privileging Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Healthcare Architect, Chief Security Architect, Chief Software Architect, Workforce Planning Architect, Clinical Safety Architect |
| **Affects** | CyMed (CPOE, Scheduling, EHR), CyCom (HR, Payroll), CyIdentity (Workforce Realm), Platform Policy Engine |
| **Tags** | architecture, healthcare, security, identity, compliance |
| **Related** | [ADR-0005](ADR-0005-identity-access-management-strategy.md), [ADR-0017](ADR-0017-cyidentity-product-strategy.md), [ADR-0018](ADR-0018-cycom-product-repositioning.md) |

---

## 1. Context

Clinical safety and regulatory compliance dictate that healthcare professionals must be verified as qualified (**Credentialing**) and authorized for specific clinical actions (**Privileging**) before engaging in patient care. This is a primary requirement for accreditation by **The Joint Commission (TJC)** in the United States and the **Joint Commission International (JCI)** globally (including Saudi Arabia, UAE, and Jordan).

To prevent clinical errors and liability:
-   **Physicians, Nurses, and Allied Health staff** must undergo rigorous license, certification, and competency checks.
-   Access to order entry (CPOE), medication administration (eMAR), and ward duty assignments must be locked behind active, verified qualifications.
-   A multi-tenant, multi-country SaaS and sovereign platform cannot hardcode local regulations (e.g., Saudi Labor Law, California Title 22, UAE licensing decrees); instead, a configurable verification and privileging model is required.

---

## 2. Problem Statement

What is the enterprise strategy to architect clinician credentialing, competency tracking, and clinical privileging verification while maintaining a clean product boundary between `CyMed` (clinical engine) and `CyCom` (ERP/HR) without sacrificing real-time CPOE performance?

---

## 3. Decision Drivers

-   **Clinical Safety & Quality:** Zero tolerance for unverified clinical orders or unlicensed medication administrations.
-   **Accreditation Standards:** Absolute compliance with Joint Commission / JCI credential audits, Primary Source Verification (PSV) requirements, and competency evaluations.
-   **Configurable Multi-Country Support:** Support for USA (State Boards, DEA), Saudi Arabia (SCFHS, CBAHI), UAE (DHA/MOH/DOH, JCI), and Jordan (MOH, Jordan Medical Association) without code duplication.
-   **Performance Limits:** Gating verification during CPOE ordering must execute in < 5ms to maintain acceptable clinician workflows.
-   **Separation of Duties (ADR-0018):** HR/payroll administration remains separate from clinical scheduling and treatment environments.

---

## 4. Considered Options

1.  **Option 1: CyMed-Isolated Credentialing Database:** Store and verify all credential and license data within CyMed, ignoring CyCom HR records.
2.  **Option 2: Unified HR Master (CyCom) with Event-Driven Active Privilege Projections to CyIdentity and Platform Policy Cache** (chosen).
3.  **Option 3: Real-time National Registry Queries (Direct RPC):** Call national databases (e.g., SCFHS Mumaris+, DHA registry) synchronously on every clinician login or order entry.

---

## 5. Decision

**We choose Option 2.** 

`CyCom HR` acts as the single System of Record (SoR) for workforce master data, including verified credential documents, license registries, and competency status. Active, validated privilege codes are projected into `CyIdentity` token claims and cached in the Platform Policy Cache (Redis) to allow low-latency ABAC gating in `CyMed CPOE`.

```
                  ┌──────────────────────────────┐
                  │          CyCom HR            │
                  │   - Professional Licenses    │
                  │   - Certs (ACLS, BLS, Board) │
                  │   - Competency Log (HR side) │
                  └──────────────┬───────────────┘
                                 │
                                 ▼ (Event: cybercom.cycom.credential.verified)
                  ┌──────────────────────────────┐
                  │    CyIdentity / Redis Cache  │
                  │   - Privilege Scopes Claims  │
                  │   - Active Verification TTL  │
                  └──────────────┬───────────────┘
                                 │
                                 ▼ (Real-time ABAC Gating check)
                  ┌──────────────────────────────┐
                  │        CyMed CPOE            │
                  │   - Order Entry Blockers     │
                  │   - Shift Scheduling Gates   │
                  └──────────────────────────────┘
```

### 5.1 Credentialing & License Specifications

#### 1. Physician Credentialing
*   **Verification Parameters:** Medical School degree verification, Residency Completion Certificates, Board Certifications, and active National/State Medical Licenses.
*   **Enforcement:** Mapped to clinical specialties. For example, a clinician cannot be designated as an Attending or Specialist in Cardiology without an active Cardiology Board Certification claim.

#### 2. Nursing Credentialing
*   **Verification Parameters:** Active nursing board registration (e.g., RN license), specialized training diplomas (e.g., ICU, Neonatology), and clinical practice hours validation.
*   **Enforcement:** Restricts ward assignments in the scheduling engine. Only nurses with active ICU credentials can be allocated to ICU shift templates.

#### 3. Allied Health Credentialing
*   **Verification Parameters:** Specific technician/technologist registrations for Pharmacy (license to dispense), Laboratory (board certifications for blood bank, immunology), Imaging (radiation safety certification), and Respiratory Therapy.
*   **Enforcement:** Gated at the specific clinical module boundary (e.g., laboratory technologists cannot release blood bank cross-matches without active Blood Bank credentials).

---

## 6. Configurable Abstraction Framework (Multi-Country Support)

To avoid hardcoded national laws, CyMed implements a hierarchical configuration structure. Rules and constraints flow from the country down to the individual department unit.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CredentialComplianceConfiguration",
  "type": "object",
  "properties": {
    "country": { "type": "string" }, -- E.g., "USA", "SAU", "JOR", "ARE"
    "primary_source_verification_required": { "type": "boolean" },
    "grace_period_days_post_expiration": { "type": "integer" },
    "mandatory_certifications": {
      "type": "array",
      "items": { "type": "string" } -- E.g., "BLS", "ACLS", "PALS"
    },
    "licensing_bodies": {
      "type": "array",
      "items": { "type": "string" } -- E.g., "SCFHS", "DHA", "StateBoard"
    }
  }
}
```

### Country-Specific Config Profiles

*   **United States (USA):**
    *   *Licensing Body:* State Medical/Nursing Boards.
    *   *Mandatory Certifications:* BLS, ACLS (Clinical), PALS (Pediatric units).
    *   *Grace Period:* 0 days (hard block at expiration).
    *   *Accreditation:* Joint Commission (TJC) credentialing standards (standards HR.01.02.01).
*   **Saudi Arabia (SAU):**
    *   *Licensing Body:* Saudi Commission for Health Specialties (SCFHS / Mumaris+).
    *   *Mandatory Certifications:* BLS, Saudi Licensing Exam (SLE) status.
    *   *Grace Period:* 30 days for license renewal processing, subject to active SCFHS application status check.
    *   *Accreditation:* CBAHI standards.
*   **Jordan (JOR):**
    *   *Licensing Body:* Jordan Medical Association (JMA), Ministry of Health (MOH).
    *   *Mandatory Certifications:* Jordanian Board, BLS.
    *   *Grace Period:* 15 days.
    *   *Accreditation:* JCI guidelines.
*   **United Arab Emirates (UAE):**
    *   *Licensing Body:* Dubai Health Authority (DHA), Department of Health Abu Dhabi (DOH), Ministry of Health and Prevention (MOHAP).
    *   *Mandatory Certifications:* Basic Life Support, UAE Board/equivalent.
    *   *Grace Period:* 30 days, subject to active licensing portal transaction token.
    *   *Accreditation:* JCI guidelines.

---

## 7. Rationale

*   **Boundary Decoupling:** `CyCom HR` manages the complex, document-heavy workflows of Primary Source Verification (PSV), background checks, and salary linkages. `CyMed` only needs to evaluate the final "Verified" status claim, protecting clinical performance.
*   **Sub-5ms Evaluation:** Caching active privileging codes (e.g., `PRIV_CPOE_CHEMO`, `PRIV_OR_SURGERY`) as OIDC token claims or within Redis allows the OPA policy engine to evaluate CPOE transactions locally without making external database queries.
*   **Accreditation Audit Compliance:** Storing both the original credential documents (CyCom) and the system access decisions (CyMed/Policy Engine) creates an end-to-end, tamper-evident audit trail matching JCI/Joint Commission standards.

---

## 8. Consequences & Expiry Workflows

### 8.1 Expiry & Renewal Tracking Matrix

CyMed initiates automated workflows via `CyConnect` as credentials approach their expiration date:

```
[90 Days Out] ➔ System Event ➔ CyConnect Notification to Clinician (Email/App)
[60 Days Out] ➔ Roster Warning ➔ Scheduler warned in Shift planning view
[30 Days Out] ➔ Escalation Event ➔ Alert to Head Nurse & HR Coordinator
[ 0 Days Out] ➔ Revocation ➔ Clear active Redis privilege cache; Lock EHR CPOE entry
```

1.  **90 Days Prior:** `CyCom HR` publishes `cybercom.cycom.credential.expiration_warning`. `CyConnect` delivers a renewal reminder to the clinician.
2.  **60 Days Prior:** `CyMed Scheduling` flags the clinician with an amber status badge in the duty roster. Schedulers are warned that the clinician cannot be allocated to shifts extending past the expiration date.
3.  **0 Days (Expiration):** At 00:00 UTC on the date of expiration, `CyCom HR` publishes `cybercom.cycom.credential.expired`. `CyIdentity` sofort invalidates the clinician's active session, and the Platform Policy Cache purges all privilege entries. Any active CPOE order attempt is blocked.

### 8.2 Security & Auditing requirements
*   All credential updates, validation override approvals, and access revocations are written to the **Platform Audit Sink** (tamper-evident, hash-chained).
*   Joint Commission audits are supported by exporting signed metadata reports containing:
    *   Clinician identifier.
    *   Primary Source Verification (PSV) timestamp.
    *   Active/Expired status history.
    *   Explicit list of granted clinical privileges.

---

## 9. Alternatives Rejected

*   **Option 1 (CyMed-Isolated DB):** Rejected because it duplicates employee files, licenses, and contracts between HR and Clinical departments, leading to data synchronization drift and violating the single-source-of-truth principle.
*   **Option 3 (Direct RPC):** Rejected because calling national ministry registries synchronously on every clinical order entry introduces external network latency (often > 1,000ms) and creates a critical single point of failure if a ministry portal is offline.

---

## 10. References

*   [ADR-0005 Identity & Access Management Strategy](ADR-0005-identity-access-management-strategy.md)
*   [docs/healthcare/workforce_security_model.md](../healthcare/workforce_security_model.md)
*   Joint Commission Standard HR.01.02.01 (Primary Source Verification)

---

## Revision History

| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Chief Healthcare Architect | Proposed |
| 2026-06-21 | Architecture Board | Accepted & Expanded |
