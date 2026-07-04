# Inpatient & Nursing Services
**CyMed Hospital Edition | Modules: Inpatient, Nursing**

---

## Inpatient Module Overview

The Inpatient module tracks patients from admission through to discharge planning. It provides the clinical workflow for in-ward rounding and progress monitoring.

### Inpatient Models

| Model | Description |
|---|---|
| `HospitalStay` | Primary inpatient stay record linked to an Admission |
| `DailyRound` | SOAP-format daily rounding notes (Subjective, Objective, Assessment, Plan) |
| `ProgressReview` | Periodic clinical progress status (improving, stable, deteriorating) |
| `InpatientCarePlan` | Structured care plan with goals and interventions |
| `DischargePlanning` | Target discharge date, barriers to discharge, clearance flag |

### Inpatient API Endpoints

```
POST  /api/v1/hospital/inpatient/stays/
POST  /api/v1/hospital/inpatient/rounds/
POST  /api/v1/hospital/inpatient/reviews/
POST  /api/v1/hospital/inpatient/careplans/
POST  /api/v1/hospital/inpatient/discharge-planning/
```

---

## Nursing Module Overview

The Nursing module manages all nursing workforce and clinical care activities for admitted patients.

### Nursing Models

| Model | Description |
|---|---|
| `NursingShift` | Shift definitions (Day, Night) with start/end times |
| `NursingAssignment` | Nurse-to-ward assignment per shift per day |
| `NursingAssessment` | Clinical nursing assessment for an admission |
| `NursingCarePlan` | Nursing-specific care plan (goals + activities) |
| `NursingTask` | Scheduled nursing intervention with status tracking |
| `NursingHandover` | SBAR-format nursing handover at shift change |

### Nursing API Endpoints

```
POST   /api/v1/hospital/nursing/shifts/
POST   /api/v1/hospital/nursing/assignments/
POST   /api/v1/hospital/nursing/assessments/
POST   /api/v1/hospital/nursing/careplans/
POST   /api/v1/hospital/nursing/tasks/
PATCH  /api/v1/hospital/nursing/tasks/{id}/
POST   /api/v1/hospital/nursing/handovers/
```

---

## Events Emitted (OutboxEvent)

| Trigger | Event Type | Topic |
|---|---|---|
| Nurse assignment created | `cymed.employee.synced` | `cymed.workforce.events` |
| Nursing task completed | `cymed.charge.created` (charge_type: nursing_care) | `cymed.billing.events` |

---

## SBAR Handover Standard

The `NursingHandover` model enforces the internationally recognized SBAR format:
- **S**ituation + **B**ackground → stored in `situation_background`
- **A**ssessment + **R**ecommendation → stored in `assessment_recommendation`
