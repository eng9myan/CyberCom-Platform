# Disease Registries

## Purpose

Disease registries track patient populations with specific conditions (cancer, diabetes, cardiovascular disease, rare diseases, vaccination) to enable long-term outcome monitoring, population management, and national reporting.

## Models

### DiseaseRegistry
Central registry definition. `registry_type` supports: cancer, diabetes, cardiology, stroke, maternal, child_health, rare_disease, mental_health, vaccination, chronic_kidney, hypertension, other. `icd11_codes` stores the ICD-11 condition codes sourced from TerminologyService.

### RegistryPatient
Links a patient to a registry. `patient_id` is a UUIDField referencing CyMed Clinical. `status` tracks lifecycle: active / inactive / deceased / transferred / withdrawn. `national_id_hash` is a salted hash of national ID for deduplication without storing raw PII.

### RegistryEnrollment
Records the enrollment event: enrolling provider/facility, criteria met at time of enrollment.

### RegistryStatus
Immutable audit trail of status changes. One entry per status transition — never updated, only appended.

### RegistryOutcome
Captures clinical outcomes: remission, progression, complication, recovery, death, transfer, lost_to_followup. `icd11_code` for the outcome condition is resolved from TerminologyService.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET/POST | `/registries/disease-registries/` | List / create registries |
| GET/PUT/PATCH | `/registries/disease-registries/{id}/` | Retrieve / update registry |
| POST | `/registries/disease-registries/{id}/activate/` | Activate registry |
| POST | `/registries/disease-registries/{id}/deactivate/` | Deactivate registry |
| GET/POST | `/registries/registry-patients/` | Enroll patient / list enrollees |
| GET/POST | `/registries/registry-enrollments/` | View enrollment details |
| GET | `/registries/registry-status/` | View status history (read-only) |
| GET/POST | `/registries/registry-outcomes/` | Record / view outcomes |

## FHIR Mapping

- **DiseaseRegistry** → FHIR `List` (resource type Patient) with `fhir_list_id`
- **RegistryPatient** → FHIR `Patient` reference within the list
- **RegistryOutcome** → FHIR `Condition` or `Observation` with relevant codes

## Terminology

All `icd11_codes` and `primary_icd11_code` values are fetched at runtime from `TerminologyService.resolve(system="icd11", code=...)`. No local ICD-11 tables exist.

## National Registry Integration

When `is_national=True`, outbreak events and outcome summaries are forwarded to CyGov Registries via CyIntegrationHub:
```python
CyIntegrationHub.send(
    destination="cygov_registries",
    event_type="cymed.ph.registry.outcome",
    payload={...}
)
```
