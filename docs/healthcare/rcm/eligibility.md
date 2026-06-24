# Eligibility Verification

## Overview

Real-time and batch eligibility verification against insurance payers. Determines patient coverage status, benefits, deductibles, and estimated patient responsibility before service delivery.

## Models

### EligibilityRequest
A request to verify a patient's insurance eligibility for a specific service type on a specific date.

**Request Types:** real_time, batch  
**Service Types:** medical, pharmacy, dental, vision, mental_health, substance_abuse, preventive, emergency  
**Status:** pending → submitted → received | error

**FHIR:** Maps to `CoverageEligibilityRequest`

### EligibilityResponse
The payer's response to an eligibility request. Contains coverage status, deductible amounts, out-of-pocket maximums, copay, coinsurance, and patient responsibility estimate.

**FHIR:** Maps to `CoverageEligibilityResponse`

### CoverageVerification
Manual or electronic coverage verification record linked to an encounter. Tracks who verified coverage, when, and by what method.

**Methods:** electronic, phone, portal, manual

### BenefitVerification
Per-benefit-type verification nested under a CoverageVerification. Captures whether a specific service (hospitalization, lab, imaging, etc.) is covered, requires preauth, and at what network status.

## Eligibility Workflow

```
1. Registration / Check-In
   └── EligibilityRequest created (real_time)

2. CyIntegrationHub → Payer API
   └── 270 (request) / 271 (response) or FHIR CoverageEligibilityRequest/Response

3. EligibilityResponse saved
   └── Coverage status, deductibles, patient responsibility estimate

4. CoverageVerification confirmed
   └── Per-benefit BenefitVerification records created

5. Results surfaced to:
   ├── Patient Portal (estimated cost, coverage summary)
   ├── Provider Portal (auth requirements, network status)
   └── Billing (drives claim preparation)
```

## Patient Responsibility Estimate

Computed from:
- `deductible_amount - deductible_met` (remaining deductible)
- `coinsurance_percentage` × (charge - deductible_portion)
- `copay_amount` (per-visit flat fee)
- Network adjustment if out-of-network

Displayed to patients via Patient Portal (P3.6) before or at point of service.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/rcm/eligibility/requests/` | Create eligibility request |
| POST | `/rcm/eligibility/requests/{id}/submit/` | Submit to payer |
| GET | `/rcm/eligibility/responses/` | View eligibility responses |
| POST | `/rcm/eligibility/verifications/` | Create coverage verification |
| POST | `/rcm/eligibility/verifications/{id}/verify/` | Confirm verification |
| GET/POST | `/rcm/eligibility/benefit-verifications/` | Benefit-level details |

## Batch Eligibility

Batch runs verify all scheduled patients for upcoming appointments:
- Triggered nightly or before clinic sessions
- Patients with `request_type=batch` processed as a group
- Results stored and linked to appointment encounters
