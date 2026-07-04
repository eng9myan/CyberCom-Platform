# Clinical Records Architecture

## 1. Overview
The Clinical Records module (`clinical` app) stores patient health records. This includes diagnosed conditions, medical problems, drug/food allergies, physiological vital signs, laboratory observations, immunizations, and clinical risk flags.

## 2. Domain Models
*   **`Condition`**: Active diseases, diagnoses, or complaints.
*   **`Problem`**: Active clinical concerns on the patient's problem list.
*   **`Diagnosis`**: Encounter-specific medical findings.
*   **`Allergy`**: Intolerance listings categorized by type (food, medication, environmental) and criticality.
*   **`AllergyReaction`**: Specific physiological symptoms observed during an allergic event.
*   **`VitalSign`**: Numeric physiological metrics (e.g., heart rate, blood pressure, temperature).
*   **`Observation`**: Lab and imaging results, clinical assessments, or social history observations.
*   **`Immunization`**: Vaccinations administered or self-reported, including lot numbers and dosage.
*   **`RiskFactor`**: Predisposition indices (e.g., family history of diabetes, heavy smoking).
*   **`ClinicalFlag`**: High-priority safety warnings (e.g., "Fall Risk", "Difficult Airway").

## 3. Strict Terminology Decoupling & Validation
To remain terminology-neutral, all coding validations route through the platform's `TerminologyService`. 
When a Condition or Diagnosis is saved:
1.  The system calls the `TerminologyService.validate_code()` method.
2.  The validation references the appropriate engine (e.g., `ICD11Provider` or `SNOMEDProvider`) depending on the `system` code provided.
3.  Invalid codes are blocked at the API serializer level with an HTTP 400 Bad Request.

```python
# Conceptual validation inside ConditionSerializer
def validate(self, data):
    code = data.get("code")
    system = data.get("system")
    
    # Call TerminologyService to validate code against system
    is_valid = TerminologyService.validate(system=system, code=code)
    if not is_valid:
        raise serializers.ValidationError(f"Invalid code '{code}' for terminology system '{system}'.")
    return data
```

## 4. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/clinical/conditions/` | GET/POST | Query and log patient conditions (validates against TerminologyService) |
| `/api/v1/clinical/vitals/` | GET/POST | Log and query patient vitals |
| `/api/v1/clinical/observations/` | GET/POST | Log laboratory observations and results |
| `/api/v1/clinical/allergies/` | GET/POST | Log allergies and reactions |

## 5. FHIR Mapping
*   `Condition` / `Problem` ──> **FHIR Condition**
*   `VitalSign` / `Observation` ──> **FHIR Observation**
*   `Allergy` ──> **FHIR AllergyIntolerance**
*   `Immunization` ──> **FHIR Immunization**
