# National Health Programs

## Purpose

Manages government-mandated and facility-led health programs: vaccination campaigns, chronic disease management, maternal and child health, cancer screening, nutrition, and smoking cessation. Tracks enrollment, outcomes, and program performance metrics.

## Models

### HealthProgram
Defines a health program with: `program_code` (unique), `program_type`, governing authority, target population, and target size. Status lifecycle: planning → active → completed / suspended. `related_icd11_codes` (JSONField) links the program to ICD-11 conditions from TerminologyService. `fhir_care_plan_id` references the FHIR CarePlan resource for interoperability.

**Supported program types:** vaccination, screening, chronic_disease, maternal, child_health, mental_health, cancer, nutrition, smoking_cessation, cardiovascular, elderly_care, other.

### ProgramEnrollment
Enrolls a patient in a program. `unique_together` on (tenant_id, program, patient_id) prevents duplicate enrollment. `status`: active / completed / withdrawn / transferred / lost_to_followup. Enrollment requires a human actor (`enrolled_by_user_id` or facility workflow).

### ProgramOutcome
Records clinical outcomes achieved within a program context. `outcome_type`: screening_complete / vaccination_complete / goal_achieved / condition_improved / hospitalization_avoided / complication_prevented / other. All outcomes require `recording_provider_id` — CyAI cannot autonomously record clinical outcomes.

### ProgramMetric
Tracks program-level KPIs: coverage rate, adherence rate, clinical outcome rate, cost-effectiveness, patient satisfaction. `metric_type` drives dashboard categorization. `meets_target` is calculated at save time from `actual_value vs target_value`.

## Program Enrollment Signal

When a patient enrolls, an OutboxEvent is published:
```python
OutboxEvent.publish(
    tenant_id=...,
    event_type="cymed.ph.program.enrollment",
    payload={"enrollment_id": "...", "program_id": "..."}
)
```
This event can trigger care plan creation in CyMed Clinical (P3.1) or scheduling actions in P3.7 Provider Portal.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET/POST | `/programs/programs/` | List / create programs |
| POST | `/programs/programs/{id}/enroll/` | Enroll patient |
| POST | `/programs/programs/{id}/suspend/` | Suspend program |
| GET/POST | `/programs/enrollments/` | List / view enrollments |
| POST | `/programs/enrollments/{id}/withdraw/` | Withdraw patient |
| GET/POST | `/programs/outcomes/` | Record / view outcomes |
| GET/POST | `/programs/metrics/` | Program KPI metrics |

## FHIR Mapping

| Model | FHIR Resource |
|---|---|
| HealthProgram | `CarePlan` (population-level) |
| ProgramEnrollment | `CarePlan` (patient-level, reference) |
| ProgramOutcome | `Observation` or `Goal` |
| ProgramMetric | `MeasureReport` |

## CyGov Integration

National programs designated as government-mandated are synchronized with CyGov Registries via CyIntegrationHub. Enrollment counts, completion rates, and regional coverage metrics are pushed as national reporting events.
