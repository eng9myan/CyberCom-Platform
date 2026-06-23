# ADT — Admission, Transfer, Discharge
**CyMed Hospital Edition | Module: ADT**

---

## Overview

The ADT module governs the entire patient movement lifecycle within the hospital. It is the authoritative source of patient admission status and serves as the entry point for all downstream hospital modules.

---

## Models

| Model | Description |
|---|---|
| `AdmissionReason` | Tenant-scoped catalog of clinical admission reasons |
| `AdmissionType` | Tenant-scoped catalog of admission types (Emergency, Routine, Elective) |
| `DischargeReason` | Tenant-scoped catalog of discharge reasons |
| `DischargeDisposition` | Tenant-scoped catalog of discharge dispositions (Home, Transfer, Deceased) |
| `Admission` | Core clinical admission record linked to an Encounter |
| `TransferRequest` | Intra-hospital transfer request (source bed → target bed) |
| `TransferApproval` | Approval record for a transfer request; updates request status to `approved` |
| `DischargeSummary` | Clinical discharge summary; sets Admission status to `discharged` |

---

## API Endpoints

```
POST   /api/v1/hospital/adt/admissions/
GET    /api/v1/hospital/adt/admissions/{id}/
POST   /api/v1/hospital/adt/transfer-requests/
POST   /api/v1/hospital/adt/transfer-approvals/
POST   /api/v1/hospital/adt/discharge-summaries/
```

---

## Events Emitted (OutboxEvent)

| Trigger | Event Type | Topic |
|---|---|---|
| Admission created | `cymed.hospital.admission.created` | `cymed.hospital.events` |
| Admission created | `cymed.charge.created` (charge_type: admission) | `cymed.billing.events` |
| Transfer approved | `cymed.hospital.transfer.created` | `cymed.hospital.events` |
| Transfer approved | `cymed.charge.created` (charge_type: bed_transfer) | `cymed.billing.events` |
| Discharge summary created | `cymed.hospital.discharge.completed` | `cymed.hospital.events` |

---

## State Machine

```
Encounter (inpatient) → Admission (admitted) → [TransferRequest → TransferApproval]* → DischargeSummary → Admission (discharged)
```

---

## Architecture Constraints

- `Admission` must reference an existing `Encounter` with `encounter_type=inpatient`.
- `TransferApproval.create()` atomically updates `TransferRequest.status = "approved"`.
- `DischargeSummary.create()` atomically updates `Admission.status = "discharged"`.
