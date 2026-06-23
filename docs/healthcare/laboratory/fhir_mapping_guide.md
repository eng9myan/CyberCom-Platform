# FHIR R4 Mapping Guide

**Service**: `FHIRLabService` in `products.cymed.laboratory.services`

---

## Resource Mappings

### LabOrder → ServiceRequest

```python
FHIRLabService.to_fhir_service_request(order: LabOrder) -> dict
```

| LabOrder | FHIR ServiceRequest |
|----------|---------------------|
| `id` | `id` |
| `order_number` | `identifier[0].value` |
| `patient_id` | `subject.reference` ("Patient/{id}") |
| `encounter_id` | `encounter.reference` |
| `priority` | `priority` |
| `created_at` | `authoredOn` |
| `ordered_by` | `requester.reference` |
| `fhir_service_request_id` | stored back on order |

Status mapping:
```
pending → draft, active → active, completed → completed, cancelled → revoked
```

---

### Specimen → Specimen

```python
FHIRLabService.to_fhir_specimen(specimen: Specimen) -> dict
```

| Specimen | FHIR Specimen |
|----------|---------------|
| `id` | `id` |
| `patient_id` | `subject.reference` |
| `barcode` | `identifier[0].value` |
| `specimen_type` | `type.text` |
| `snomed_specimen_code` | `type.coding[0].code` (SNOMED-CT system) |
| `collection_datetime` | `collection.collectedDateTime` |

---

### LabResult → DiagnosticReport

```python
FHIRLabService.to_fhir_diagnostic_report(result: LabResult) -> dict
```

| LabResult | FHIR DiagnosticReport |
|-----------|----------------------|
| `id` | `id` |
| `order_item.order.patient_id` | `subject.reference` |
| `status` | `status` |
| `result_values` | `result[]` (Observation references) |

---

### ResultValue → Observation

```python
FHIRLabService.to_fhir_observation(rv: ResultValue) -> dict
```

| ResultValue | FHIR Observation |
|-------------|-----------------|
| `loinc_code` | `code.coding[0].code` (LOINC system) |
| `analyte_name` | `code.text` |
| `value_numeric` | `valueQuantity.value` |
| `unit` | `valueQuantity.unit` |
| `interpretation` | `interpretation[0].text` |
| `reference_range_low/high` | `referenceRange[0]` |

---

## Inbound FHIR Parsing

```python
FHIRLabService.from_fhir_service_request(fhir_dict: dict, tenant_id) -> LabOrder
```

Parses incoming FHIR ServiceRequest (from EHR, CyMed Clinic) and creates `LabOrder` with linked `LabOrderItem` records.

---

## HL7 v2.x

Inbound HL7 ORM^O01 and ORU^R01 messages are stored as `AnalyzerMessage.raw_message` and parsed by Celery workers. Parsed data flows into `AnalyzerResult` → `ResultValue`.

- ORC-2 → `LabOrder.hl7_placer_order_number`
- ORC-3 → `LabOrder.hl7_filler_order_number`
- OBX-3 → `ResultValue.loinc_code` (LOINC in OBX-3.3)
- OBX-5 → `ResultValue.value_numeric` / `value_text`
- OBX-6 → `ResultValue.unit`
- OBX-7 → reference range
- OBX-8 → interpretation
