# Results Management

**App**: `products.cymed.laboratory.results` (label: `lab_results`)

---

## Models

| Model | Purpose |
|-------|---------|
| `LabResult` | Result header per order item |
| `ResultValue` | Individual analyte value (LOINC-coded) |
| `ReferenceRange` | Age/sex/unit-specific normal ranges |
| `CriticalResult` | Mandatory notification workflow |
| `ResultApproval` | Electronic signoff with digital signature |
| `ResultCorrection` | Corrected/amended result history |

---

## Result Value Types

`numeric | text | coded | ratio | titer | semi_quantitative`

---

## Reference Ranges

```
ReferenceRange.applies_to(patient_age, patient_sex) → (low, high)
```

Ranges keyed by `(test_id, age_min_years, age_max_years, sex, specimen_type)`.

---

## Delta Checks

`ResultService.run_delta_check(result_value_id)`:
1. Fetches previous `ResultValue` for same patient + analyte_code
2. Computes `delta_pct = (current - previous) / previous * 100`
3. Flags as `delta_flag = "significant"` if > 20%
4. Stores `previous_value`, `delta_percentage` on `ResultValue`

---

## Critical Values

`CriticalResult` created when result value breaches critical threshold.

States: `pending_notification → notified → acknowledged → completed`

`notification_status` must reach `completed` with `read_back_verified = True` before result can be released.

---

## Result Approval

```python
ResultApproval.objects.create(
    result=result, approved_by=user_id,
    signature_method="digital_pin",
    digital_signature="...",
    ip_address="...",
)
```

Supports `digital_pin | biometric | two_factor`.

---

## CyAI Integration

`ResultService.request_ai_interpretation(result_id)` → `CyAIService.analyze_lab_result()` returns advisory text. AI advisory is stored on `LabResult.ai_interpretation`. AI **cannot** approve or release results.

---

## FHIR R4 Mapping

`ResultValue` → FHIR `Observation`  
`LabResult` → FHIR `DiagnosticReport`

---

## Feature Flag

`required_feature = "lab.results"`
