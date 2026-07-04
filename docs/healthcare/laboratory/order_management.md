# Order Management

**App**: `products.cymed.laboratory.orders` (label: `lab_orders`)

---

## Models

| Model | Purpose |
|-------|---------|
| `LabTest` | Atomic test definition with LOINC code, TAT, analyzer mapping |
| `LabPanel` | Bundle of tests with reflex rules |
| `LabOrder` | Patient order with FHIR/HL7 identifiers |
| `LabOrderItem` | Single test within an order |
| `LabOrderDiagnosis` | ICD-11 diagnosis codes on order |
| `LabOrderAttachment` | Clinical documents attached to order |
| `LabOrderStatusHistory` | Immutable audit trail of status transitions |

---

## Order Types

- `hospital` — inpatient/emergency
- `clinic` — outpatient (CyMed Clinic)
- `external` — referring physician
- `standing` — recurring protocol
- `stat_manual` — verbal STAT

## Priority Levels

`routine` → `urgent` → `stat` → `critical`

---

## FHIR Mapping

`LabOrder` ↔ FHIR `ServiceRequest` (R4)

| LabOrder field | FHIR field |
|---------------|------------|
| `order_number` | `identifier[0].value` |
| `patient_id` | `subject.reference` |
| `priority` | `priority` |
| `fhir_service_request_id` | `id` |

---

## HL7 v2.x

- `hl7_placer_order_number` maps to ORC-2
- `hl7_filler_order_number` maps to ORC-3
- Inbound ORM^O01 parsed by `AnalyzerMessage` in worklists app

---

## Service: `LabOrderingService`

```python
LabOrderingService.create_order(
    tenant_id, patient_id, order_type, tests, priority, ordered_by,
    encounter_id=None, diagnoses=None
)
```

Returns `{"order_number": "LAB-XXXXXXXX", "order_id": str(uuid), ...}`

Validates each test LOINC via `TerminologyService.lookup(system="loinc")`.

---

## Feature Flag

`required_feature = "lab.orders"` — gated at ViewSet level.
