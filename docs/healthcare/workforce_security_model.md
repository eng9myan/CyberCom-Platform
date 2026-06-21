# CyMed Workforce Security Model

> **Status:** Approved — Phase 1.2
> **Owner:** Chief Security Architect + Clinical Safety Architect
> **Related Documents:** [healthcare_workforce_architecture.md](healthcare_workforce_architecture.md), [workforce_compliance_framework.md](workforce_compliance_framework.md), [ADR-0005](../adr/ADR-0005-identity-access-management-strategy.md)

This document establishes the security architecture, role models, and audit procedures governing the workforce scheduling and clinical access layers.

---

## 1. Role-Based Access Control (RBAC)

The workforce management system defines four primary scheduling-related roles, mapped to OIDC claims issued by `CyIdentity`:

```
 [Clinician]      ➔ Read own shift assignments, request swaps, check-in
 [Ward Clerk]     ➔ Draft unit rosters, update shift logs, request floats
 [Head Nurse]     ➔ Approve swaps, publish ward rosters, override ratios
 [System Admin]   ➔ Modify compliance configurations, edit global templates
```

*   **Clinician (`role_clinician`):** Can read their own assignments, update profile preferences, request swaps, and perform shift check-ins. No access to other departments' schedules.
*   **Ward Clerk / Scheduler (`role_scheduler`):** Can edit, draft, and manage duty rosters within their assigned department. Cannot modify compliance rules or override credential gates.
*   **Head Nurse / Department Chair (`role_clinical_supervisor`):** Can approve shift swaps, authorize emergency call-ins, publish finalized rosters, and approve safety ratio overrides.
*   **System Administrator (`role_sys_admin`):** Access to country-specific compliance configs, system templates, and integration parameters. No access to patient charts or direct scheduling actions.

---

## 2. Attribute-Based Access Control (ABAC)

While RBAC manages menu and API routing, **fine-grained clinical permissions** are governed by ABAC (evaluated in the Platform Policy Engine).

### Key Attributes Used:
1.  `principal.active_duty_roster_ward`: The ward ID where the clinician is currently scheduled.
2.  `principal.credential_status`: The status of the clinician's medical license (must be `VALID`).
3.  `resource.patient_current_ward`: The ward ID where the patient is currently admitted.
4.  `context.current_time`: Must fall within `shift.start_time` and `shift.end_time` (plus a 30-minute pre- and post-shift grace period).

### Evaluation Flow:
```
Request: GET /fhir/R4/Patient/102/Condition (Read Patient Diagnosis)
                 │
                 ▼
     [Platform Policy Engine]
                 │
                 ├─► Check 1: Is user license active? ➔ YES
                 ├─► Check 2: Is user currently on duty? ➔ YES
                 └─► Check 3: Is patient in user's rostered ward? ➔ YES
                 │
                 ▼
              [PERMIT]
```

If the clinician is not rostered on the patient's ward, the policy engine returns `DENY`, and the request is blocked at the gateway.

---

## 3. Roster Visibility & Department Isolation

To protect staff and comply with regional privacy rules (such as HIPAA and the Saudi Personal Data Protection Law - PDPL):

*   **Roster Masking:** General staff schedules only display `Display Name` and `Clinical Specialty` on mobile apps. Personal contact details (phone, email) and home addresses are masked and accessible only to authorized HR personnel via `CyCom HR`.
*   **Department Isolation:** Schedulers can only query and view rosters within their assigned facility department. Cross-department queries (except for the central Float Pool coordinator) are denied by default.

---

## 4. Audit & Compliance Trails

Every write action in the scheduling and validation engines must emit a structured, signed log to the **Platform Audit Sink**.

### Audit Event Log Schema:
```json
{
  "timestamp": "2026-06-21T11:11:42Z",
  "event_id": "evt_bc992a2a",
  "actor": {
    "employee_id": "emp_01239a",
    "role": "role_clinical_supervisor",
    "ip": "10.240.15.101"
  },
  "action": "override.ratio.safety",
  "resource": "ward_roster_pediatrics_2026_25",
  "compliance_data": {
    "reason_code": "DISASTER_OVERRIDE",
    "incident_id": "inc_2026_99a",
    "original_ratio": "1:4",
    "temporary_ratio": "1:6"
  },
  "signature": "me5e982a7a..."
}
```

Audit trails are append-only and cryptographically verified nightly. Any alteration of audit records triggers a critical security event and pager alert to the SRE security team.
