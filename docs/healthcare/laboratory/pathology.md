# Surgical Pathology

**App**: `products.cymed.laboratory.pathology` (label: `lab_pathology`)

---

## Models

| Model | Purpose |
|-------|---------|
| `PathologyCase` | Master case record |
| `PathologySpecimen` | Individual specimen part (A, B, C...) |
| `GrossExamination` | Macroscopic description by pathologist |
| `MicroscopicExamination` | Microscopic description |
| `PathologyDiagnosis` | Final diagnosis with SNOMED + ICD-11 codes |
| `PathologyReport` | Finalized, signed report |
| `PathologyConsultation` | External opinion request |

---

## Case Lifecycle

```
RECEIVED → GROSSING → PROCESSING → EMBEDDING → SECTIONING → STAINING
→ MICROSCOPY → PRELIMINARY → SIGNED_OUT | AMENDED
```

---

## Terminology

`PathologyDiagnosis`:
- `snomed_code` — SNOMED-CT morphology code via `TerminologyService.search(system="snomed")`
- `icd11_code` — ICD-11 code via `TerminologyService.lookup(system="icd11")`

No local SNOMED or ICD-11 database — always via TerminologyService.

---

## Case Assignment

`PathologyCase.assigned_pathologist` — UUID reference to CyMed Clinic/Hospital user. Multi-site labs can assign remotely via CyIntegrationHub.

---

## Report Signout

`PathologyReport.signed_by` + `signed_at` locked on signout. Amendments create new `PathologyReport` with `amendment_reason` and link to original via `original_report`.

---

## Feature Flag

`required_feature = "lab.pathology"` — Advanced edition and above.
