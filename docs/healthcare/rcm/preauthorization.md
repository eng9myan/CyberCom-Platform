# Preauthorization Management

## Overview

Manages prior authorization workflows for services, procedures, medications, and hospitalizations. Integrates with clinical ordering systems and tracks authorization lifecycle from request through approval, denial, or appeal.

## Models

### Preauthorization
Master authorization record. Tracks authorization type, service description, ICD-11 diagnosis codes, requested vs. approved units, and dates.

**Authorization Types:** service, procedure, medication, imaging, hospitalization, home_health, dme, rehabilitation  
**Status:** draft → submitted → pending_info → approved | partially_approved | denied | expired | cancelled

**Key fields:**
- `auth_number` — payer-assigned authorization number
- `icd11_diagnosis_codes` — JSON list, from TerminologyService (no local ICD tables)
- `source_module` — originating clinical module (clinic, hospital, imaging, pharmacy)
- `requesting_provider_id` — provider who requested authorization

### AuthorizationRequest
Submission record for a preauthorization. Captures clinical notes, supporting documents (CyData URLs), and payer reference number.

### AuthorizationDecision
Payer decision record. Captures approval, partial approval, or denial with reason codes and conditions.

### AuthorizationAppeal
Appeal filed when authorization is denied. Supports up to 3 appeal levels (first, second, external/independent).

## Authorization Workflow

```
Clinical Order Created (imaging/medication/procedure)
        │
        ▼
CoverageRule Check → Requires preauth?
        │ Yes
        ▼
Preauthorization.status = draft
        │
        ▼
Clinical notes + documents attached
        │
        ▼
Submit to payer (electronic/portal/fax)
        │
        ├──→ Approved → auth_number assigned
        │         └── Order proceeds
        │
        ├──→ Pending Info → Additional info requested
        │
        └──→ Denied → AppealWorkflow
                  ├── Level 1 (internal)
                  ├── Level 2 (peer review)
                  └── Level 3 (external/independent)
```

## Integration with Clinical Modules

| Module | Trigger |
|--------|---------|
| CyMed Imaging (P3.4) | Imaging orders requiring preauth |
| CyMed Pharmacy (P3.5) | High-cost or biologic medications |
| CyMed Hospital (P3.2) | Elective admissions |
| CyMed Clinic (P3.1) | Specialist procedures |
| Provider Portal (P3.7) | Auth status dashboard, appeal filing |
| Patient Portal (P3.6) | Auth status, estimated approval timeline |

## ICD-11 Integration

Diagnosis codes sourced exclusively from TerminologyService (P2.10):
```python
from platform.terminology.service import TerminologyService

codes = TerminologyService.search_icd11(query="cholelithiasis")
# Returns: [{"code": "DC24", "title": "Cholelithiasis", ...}]
```
No local ICD-11 tables. No duplicate terminology implementation.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/rcm/preauthorization/` | List/create preauthorizations |
| POST | `/rcm/preauthorization/{id}/submit/` | Submit to payer |
| POST | `/rcm/preauthorization/{id}/renew/` | Renew expiring authorization |
| GET/POST | `/rcm/preauthorization/requests/` | Authorization requests |
| GET/POST | `/rcm/preauthorization/decisions/` | Payer decisions |
| GET/POST | `/rcm/preauthorization/appeals/` | Appeals |
| POST | `/rcm/preauthorization/appeals/{id}/submit_appeal/` | Submit appeal |
