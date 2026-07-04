# Claims Management

## Overview

End-to-end claims lifecycle management — from claim preparation through submission, tracking, payer response, resubmission, and reconciliation. Supports electronic claims (FHIR R4 / X12 837), batch processing, and full audit history.

## Models

### Claim
Master claim record. Supports institutional, professional, dental, and pharmacy claim types. Tracks diagnosis codes (ICD-11), preauthorization number, and FHIR resource IDs.

**Claim Types:** institutional, professional, dental, pharmacy  
**Status:** draft → ready → submitted → acknowledged → pending → paid | partial | denied | voided | resubmitted

**FHIR:** Maps to `Claim`

### ClaimLine
Individual service lines on a claim. Each line has its own approval/payment amount and can be independently denied.

### ClaimSubmission
Submission event record. Tracks when a claim was submitted, by whom, via what method, and payer acknowledgement.

**Methods:** electronic, batch, portal, direct

### ClaimResponse
Payer response to a claim. Captures approved/paid amounts, payment method, EOB number, denial codes, and raw response data.

**FHIR:** Maps to `ClaimResponse` + `ExplanationOfBenefit`

### ClaimStatus
Immutable status history log. Every status transition is recorded with timestamp and user.

### ClaimAttachment
Supporting documents attached to a claim — medical records, lab results, imaging, authorizations, referrals. Stored in CyData.

## Claims Lifecycle

```
Claim.status = draft
  ↓ Claim preparation (link charges, validate codes)
  ↓ CyAI claim scrubbing (advisory — flags issues)
  ↓ Human review of AI flags
Claim.status = ready
  ↓ Submit (electronic/batch)
Claim.status = submitted
  ↓ Payer acknowledgement received
Claim.status = acknowledged
  ↓ Payer processes claim
  ├──→ paid: ClaimResponse (payment) → CyIntegrationHub → CyCom
  ├──→ partial: Patient balance remains
  ├──→ denied: → Denial Management (P3.8)
  └──→ resubmission needed: is_resubmission=True, original_claim_id set
```

## Claim Scrubbing (CyAI — Advisory Only)

CyAI analyzes claims before submission and flags potential issues:
- Missing or invalid ICD-11 codes
- Mismatched diagnosis-procedure pairs
- Missing authorization numbers
- Timely filing risk (approaching deadline)
- Duplicate claim detection

**CyAI cannot submit claims. Human approval required for all submissions.**

## FHIR R4 Mapping

| CyMed Field | FHIR R4 |
|-------------|---------|
| `Claim` | `Claim` resource |
| `ClaimLine` | `Claim.item` |
| `ClaimResponse` | `ClaimResponse` resource |
| `fhir_eob_id` | `ExplanationOfBenefit` resource |
| `icd11_primary_diagnosis` | `Claim.diagnosis.diagnosisCodeableConcept` (ICD-11) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/rcm/claims/` | List/create claims |
| POST | `/rcm/claims/{id}/submit/` | Submit claim to payer |
| POST | `/rcm/claims/{id}/resubmit/` | Resubmit denied claim |
| POST | `/rcm/claims/{id}/void/` | Void a claim |
| GET/POST | `/rcm/claims/lines/` | Claim line items |
| GET | `/rcm/claims/submissions/` | Submission history |
| GET | `/rcm/claims/responses/` | Payer responses |
| GET | `/rcm/claims/status-history/` | Status audit trail |
| GET/POST | `/rcm/claims/attachments/` | Claim attachments |

## Batch Claims Processing

- Batch claims grouped by `batch_id` on `ClaimSubmission`
- Nightly batch run for non-urgent claims
- Batch acknowledgement processed when payer responds
- Individual claim status updated within batch context
