# Reference Laboratory

**App**: `products.cymed.laboratory.reference_lab` (label: `lab_reference`)

---

## Models

| Model | Purpose |
|-------|---------|
| `ReferenceLab` | External reference laboratory definition |
| `ReferenceLabRouting` | Test → Reference lab routing rules |
| `ReferenceLabOrder` | Order sent to reference lab |
| `ReferenceLabResult` | Result received from reference lab |
| `ReferenceLabBilling` | Billing tracking for reference lab charges |

---

## Integration Types

`ReferenceLab.integration_type`:
- `fhir` — FHIR R4 ServiceRequest / DiagnosticReport
- `hl7` — HL7 v2.x OML/ORU
- `api_rest` — Proprietary REST API
- `manual` — Manual entry / fax / email

---

## Secret Management

`ReferenceLab.api_key_reference` stores the **secret manager key name** (e.g. `"cybercom/secrets/reflab-aramco-api-key"`), not the key itself. The key is fetched at runtime from the platform secret manager.

---

## Routing Logic

`ReferenceLabRouting` maps `LabTest → ReferenceLab` with:
- `is_default` — primary route for this test
- `conditions` — JSON conditions (e.g., specific specimen type, insurance type)
- `estimated_tat_hours` — SLA for this route

Multiple routes per test supported (fallback chains).

---

## Result Ingestion

`ReferenceLabResult`:
- `raw_result` (JSONField) — original payload
- `raw_format` — fhir | hl7 | json | pdf
- `status` — received → processing → integrated → error

On integration, result values are mapped into `ResultValue` models in the local `lab_results` app.

---

## Multi-Site Network (National Edition)

With `ReferenceLab.is_national = True` and `lab.national_registry` feature, results are shared across tenant network for epidemiology and benchmarking.

---

## Feature Flag

`required_feature = "lab.reference_lab"` — Reference edition and above.
