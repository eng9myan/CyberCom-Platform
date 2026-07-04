# CyMed Provider Portal — Care Teams

## Overview

Care teams enable structured clinical collaboration across specialties and disciplines.
Every patient can have one or more care teams; teams can also be unit-level or
specialty-level without patient assignment.

## Team Types

| Type | Use Case |
|---|---|
| `primary` | Main attending team |
| `specialty` | Consulting specialty team |
| `multidisciplinary` | MDT: physicians + nurses + pharmacy + therapy |
| `on_call` | Current on-call coverage team |
| `rapid_response` | RRT/code response team |
| `perioperative` | Surgical/anesthesia/PACU team |
| `maternity` | OB/midwife/neonatal team |
| `oncology` | Tumor board / chemotherapy team |
| `custom` | Any ad-hoc team |

## Member Roles

`CareTeamMember.role` maps clinical function:

| Role | Provider Types |
|---|---|
| `attending` | Physician, Consultant |
| `resident` | Resident |
| `intern` | Medical intern |
| `charge_nurse` | Charge Nurse |
| `nurse` | Nurse |
| `pharmacist` | Clinical Pharmacist |
| `therapist` | Physical/Occupational/Speech Therapist |
| `social_worker` | Social Worker |
| `care_coordinator` | Care Coordinator |
| `consultant` | Consulting Physician |
| `student` | Medical Student (observer) |

## Coverage Scheduling

`CoverageSchedule` manages on-call and cross-cover:
- Links a covering provider to a covered provider for a specific date/time window
- `coverage_type`: on_call / cross_cover / holiday / leave_cover
- Used to route escalations and critical alerts to the correct on-call provider

## Care Team Assignment to Patients

`CareTeamAssignment` links a team to a patient encounter:
- `patient_id` + `cymed_encounter_id` — specific encounter
- `is_active` flag — team active for this patient
- `assignment_reason` — clinical rationale

## FHIR Integration

`CareTeam` maps to FHIR R4 CareTeam resource:
- `CareTeamMember` → FHIR CareTeam.participant
- `CareTeamRole` → FHIR CareTeam.participant.role (SNOMED code via TerminologyService)

## Role Permissions

`CareTeamRole` defines what each role can do:
- `can_order` — authorized to place orders
- `can_sign_documents` — authorized to sign clinical notes
- `responsibilities` — JSONField list of clinical responsibilities
