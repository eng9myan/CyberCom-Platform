# Operating Room (OR) & Anesthesia Services
**CyMed Hospital Edition | Modules: Operating Room, Anesthesia**

---

## Operating Room Module Overview

The Operating Room module manages the full perioperative workflow from surgical case registration through post-operative close-out.

### Operating Room Models

| Model | Description |
|---|---|
| `SurgicalCase` | Primary surgical case; procedure code validated via SNOMED TerminologyService |
| `SurgicalSchedule` | Operating room allocation and scheduling |
| `ProcedureBooking` | Pre-operative booking with priority classification |
| `ProcedureConsent` | Informed consent document with patient signature |
| `ProcedureChecklist` | WHO Surgical Safety Checklist (Sign-In, Time-Out, Sign-Out) |
| `SurgicalTeam` | Per-case surgical team member assignments |
| `SurgicalEquipment` | Sterilized equipment asset tracking for each case |

### OR API Endpoints

```
POST   /api/v1/hospital/or/cases/
PATCH  /api/v1/hospital/or/cases/{id}/          (completion → events)
POST   /api/v1/hospital/or/schedules/
POST   /api/v1/hospital/or/bookings/
POST   /api/v1/hospital/or/consents/
POST   /api/v1/hospital/or/checklists/
POST   /api/v1/hospital/or/teams/
POST   /api/v1/hospital/or/equipment/
```

### Terminology Validation

- `procedure_code` on `SurgicalCase` must be a valid **SNOMED CT** code
- Validation is delegated to `TerminologyService.validate(provider="snomed", code=..., tenant_id=...)`
- Invalid codes return HTTP 400

### OR Events Emitted

| Trigger | Event Type | Topic |
|---|---|---|
| Equipment assigned | `cymed.asset.assigned` | `cymed.hospital.events` |
| Case status → completed | `cymed.hospital.surgery.completed` | `cymed.hospital.events` |
| Case status → completed | `cymed.charge.created` (charge_type: or_utilization) | `cymed.billing.events` |
| Case status → completed | `cymed.inventory.consumed` | `cymed.inventory.events` |

---

## Anesthesia Module Overview

The Anesthesia module covers the full peri-anesthesia workflow including pre-operative assessment, intra-operative record, and post-anesthesia care unit (PACU) recovery.

### Anesthesia Models

| Model | Description |
|---|---|
| `AnesthesiaAssessment` | Pre-operative ASA classification and Mallampati airway assessment |
| `AnesthesiaPlan` | Anesthetic technique selection (general, regional, monitored anesthesia care) |
| `AnesthesiaRecord` | Intra-operative record with agent list, start/end times |
| `RecoveryAssessment` | Post-anesthesia Aldrete score for PACU discharge readiness |

### Anesthesia API Endpoints

```
POST  /api/v1/hospital/anesthesia/assessments/
POST  /api/v1/hospital/anesthesia/plans/
POST  /api/v1/hospital/anesthesia/records/
POST  /api/v1/hospital/anesthesia/recovery-assessments/
```

### Anesthesia Events Emitted

| Trigger | Event Type | Topic |
|---|---|---|
| Anesthesia record created | `cymed.charge.created` (charge_type: anesthesia_services) | `cymed.billing.events` |
| Recovery assessment created | `cymed.charge.created` (charge_type: anesthesia_recovery) | `cymed.billing.events` |

### Clinical Scoring

**ASA Classification (American Society of Anesthesiologists)**
- Stored per assessment: ASA I through ASA VI
- Used for pre-operative risk stratification

**Mallampati Airway Score**
- Class I–IV stored numerically
- Used for intubation difficulty prediction

**Aldrete Score (Modified)**
- Post-anesthesia recovery scoring (0–10)
- Score ≥ 9 = PACU discharge criteria met
