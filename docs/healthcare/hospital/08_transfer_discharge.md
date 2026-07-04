# Transfer Center & Discharge Management
**CyMed Hospital Edition | Modules: Transfer Center, Discharge**

---

## Transfer Center Module Overview

The Transfer Center manages all external patient transfers — both incoming referrals and outbound transfers to other facilities.

### Transfer Center Models

| Model | Description |
|---|---|
| `ReceivingFacility` | External facility catalog (hospitals, rehab centers, nursing homes) |
| `TransferCase` | External transfer record linking patient to source and target facility |
| `ExternalReferral` | Referral document from the transferring physician |
| `AcceptanceReview` | Acceptance or denial decision by the receiving clinical team |

### Transfer Center API Endpoints

```
POST  /api/v1/hospital/transfer-center/facilities/
POST  /api/v1/hospital/transfer-center/cases/
POST  /api/v1/hospital/transfer-center/referrals/
POST  /api/v1/hospital/transfer-center/reviews/
```

### Transfer Case Status Flow

```
initiated → under_review → accepted → completed
                        ↘ rejected
```

---

## Discharge Management Module Overview

The Discharge Management module orchestrates the administrative and clinical tasks required for a safe patient discharge.

### Discharge Models

| Model | Description |
|---|---|
| `DischargeChecklist` | Per-stay discharge task list (medication reconciliation, billing clearance, follow-up booking) |
| `DischargeMedication` | Medication reconciliation at discharge; medication code validated via SNOMED TerminologyService |
| `FollowUpAppointment` | Post-discharge specialty follow-up scheduling |
| `DischargeInstruction` | Patient education: diet, activity restrictions, warning symptoms |

### Discharge API Endpoints

```
POST   /api/v1/hospital/discharge/checklists/
PATCH  /api/v1/hospital/discharge/checklists/{id}/    (completion → billing event)
POST   /api/v1/hospital/discharge/medications/
POST   /api/v1/hospital/discharge/followups/
POST   /api/v1/hospital/discharge/instructions/
```

### Terminology Validation

- `medication_code` on `DischargeMedication` must be a valid **SNOMED CT** code
- Invalid codes return HTTP 400

### Discharge Events Emitted

| Trigger | Event Type | Topic |
|---|---|---|
| Checklist task completed | `cymed.charge.created` (charge_type: discharge_processing) | `cymed.billing.events` |
