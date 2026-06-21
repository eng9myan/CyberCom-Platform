# Phase 1.2 Healthcare Workforce Architecture Report

> **Program:** Program 1 — Platform Foundation  
> **Phase:** Phase 1.2 — Healthcare Workforce Design  
> **Date:** 2026-06-21  
> **Status:** ✅ Complete  

This report summarizes the design of the **Healthcare Workforce Architecture** for the `CyMed` product, providing a configurable, compliant, and secure system context that satisfies the constraints of all previous ADRs (ADR-0001 through ADR-0019).

---

## 1. Files Created & Bounded Contexts

We have created the following core architectural blueprints under `docs/healthcare/`:

1.  **[healthcare_workforce_architecture.md](healthcare/healthcare_workforce_architecture.md):** Defines the system context, C4 Container interactions, and the hierarchical configuration model for multi-country deployments.
2.  **[clinical_staffing_model.md](healthcare/clinical_staffing_model.md):** Establishes auxiliary department staffing parameters (Pharmacy, Lab, Imaging, Respiratory Therapy, Blood Bank, Dialysis, Rehab, CSSD, Biomed).
3.  **[nursing_model.md](healthcare/nursing_model.md):** Outlines responsibilities, authority levels, competencies, and shortages workflows for all 15 nursing tiers.
4.  **[physician_model.md](healthcare/physician_model.md):** Documents physician career paths, supervision matrices, and ACGME duty-hour compliance rules.
5.  **[oncall_architecture.md](healthcare/oncall_architecture.md):** Specifies on-call modes, shift validation, swap approvals, and SLA-driven escalation paths.
6.  **[acuity_staffing_model.md](healthcare/acuity_staffing_model.md):** Defines safe staffing ratios, dynamic NEWS2 acuity calculation rules, and fatigue-management safety limits.
7.  **[shift_management_architecture.md](healthcare/shift_management_architecture.md):** Architects shift templates (8h vs 12h), self-scheduling windows, float pools, and CyAI-driven predictive forecasting.
8.  **[workforce_compliance_framework.md](healthcare/workforce_compliance_framework.md):** Details JSON configuration schemas and rules templates for USA, Jordan, Saudi Arabia, and UAE.
9.  **[workforce_security_model.md](healthcare/workforce_security_model.md):** Sets up RBAC/ABAC models, department isolation rules, and immutable audit logs.
10. **[Phase1_2_Healthcare_Workforce_Architecture_Report.md](Phase1_2_Healthcare_Workforce_Architecture_Report.md):** (This consolidation report).

---

## 2. Architecture Decisions (AD-0020 through AD-0025)

The following architectural decisions have been accepted by the Healthcare Architecture Board:

### AD-0020: Configurable Compliance Rules via JSON Engine
*   **Context:** Hardcoding labor laws (such as ACGME resident caps or KSA Ramadan limits) results in code sprawl and validation errors.
*   **Decision:** All labor rules, overtime thresholds, and holiday constraints are loaded as hierarchical JSON config stubs. The validation engine evaluates rules at run-time based on the clinician's location.

### AD-0021: Async Event-Driven Payroll Sync
*   **Context:** Payroll needs hours-worked data from scheduling. Direct database reads or synchronous RPC calls violate bounded contexts and cause tight coupling.
*   **Decision:** CyMed Scheduling publishes `cybercom.cymed.roster.hours_worked` to Kafka at shift completion. CyCom Payroll consumes this event asynchronously.

### AD-0022: Dynamic ABAC Clinical Chart Gating
*   **Context:** Static RBAC (e.g., "Nurse") is insufficient to protect patient data from snooping.
*   **Decision:** Access to EHR data requires a dynamic Attribute-Based Access Control (ABAC) evaluation. A clinician can only read a patient's chart if they are actively scheduled on the ward where the patient is currently admitted.

### AD-0023: SLA-Driven Pager Escalation
*   **Context:** On-call clinicians missing critical pages impacts patient outcomes.
*   **Decision:** CyMed Escalation Engine tracks pages. If a Primary Call clinician does not acknowledge a page within 10 minutes, the alert automatically escalates to Secondary Call and notifies the Consultant.

### AD-0024: Acuity-Based Dynamic Staffing
*   **Context:** Fixed nurse-to-patient ratios fail to account for high-acuity patients (e.g., unstable ICU cases).
*   **Decision:** Ratios are adjusted dynamically by calculating Hours Per Patient Day (HPPD) based on real-time NEWS2 scores pulled from the CyMed EHR.

### AD-0025: CyAI Predictive Forecasting Integration
*   **Context:** Short-notice roster changes increase costs and cause staff shortages.
*   **Decision:** CyMed schedules outbound patient census histories to CyData. CyAI processes weekly forecasts, outputting predicted staffing curves 14 days in advance to allow proactive schedule adjustments.

---

## 3. Risks & Mitigations

| Risk # | Description | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| **R1** | **ABAC Latency Overhead:** Checking active shift status on every EHR read API request could degrade system performance. | Medium | High | Cache active rosters in a regional Redis cluster. Perform lookups in under 15ms. |
| **R2** | **Labor Law Overlap Conflicts:** Regional overrides conflicting with national laws (e.g., state vs. federal limits). | Low | Medium | Enforce strict hierarchical inheritance: Country-level configs act as hard maximums that regional configs cannot exceed. |
| **R3** | **Credential Sync Lag:** A clinician's license expires in CyCom HR, but they remain scheduled in CyMed, risking clinical liability. | Medium | Critical | Enable real-time webhook push from CyCom HR. If credential status shifts to expired, the clinician is immediately unassigned. |

---

## 4. Country Readiness Assessments

### 4.1 United States (USA)
*   **Labor Rules:** Complies with FLSA (Overtime > 40h) and state-specific nurse staffing limits (e.g., California Title 22).
*   **Accreditation:** Aligns with The Joint Commission (TJC) credentialing checks and audit logs.
*   **Training:** ACGME 80-hour work week and minimum 10-hour rest limits enforced automatically for residents.
*   **Status:** **Ready for Phase 1.3**.

### 4.2 Saudi Arabia (KSA)
*   **Labor Rules:** Supports Article 98 (48-hour standard week) and Article 99 (reduced Ramadan hours for Muslim staff).
*   **Accreditation:** Aligns with CBAHI clinical audit requirements and credential verification files.
*   **Status:** **Ready for Phase 1.3**.

### 4.3 Jordan (JOR)
*   **Labor Rules:** Complies with Jordanian Labor Law Article 56 (48-hour standard week).
*   **Accreditation:** Aligns with Joint Commission International (JCIA) guidelines.
*   **Status:** **Ready for Phase 1.3**.

### 4.4 United Arab Emirates (UAE)
*   **Labor Rules:** Complies with Federal Decree-Law No. 33 of 2021 (48-hour work week).
*   **Accreditation:** Aligns with Dubai Health Authority (DHA) and Department of Health (DOH) clinical licensing checks.
*   **Status:** **Ready for Phase 1.3**.

---

## 5. Readiness For Phase 1.3

All deliverables for Phase 1.2 have been defined, validated, and documented. The codebase has **zero code conflicts**, and the design is fully aligned with previous architecture matrix parameters.

### Phase 1.3 Entry Checklist:
*   [x] Configurable JSON Schema for Compliance rules defined.
*   [x] Bounded context domains between CyMed and CyCom mapped.
*   [x] Dynamic ABAC security policy written in Cedar.
*   [x] SLA-driven escalation logic designed.
*   [x] All 10 documentation files created.

**Recommendation:** Proceed immediately to **Phase 1.3: Implementation and Coding**.
