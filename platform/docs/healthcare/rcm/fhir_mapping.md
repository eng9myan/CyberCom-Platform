# FHIR R4 Mapping — CyMed RCM

## Overview

CyMed RCM implements FHIR R4 financial resources to support interoperability with payer systems, national health information exchanges, and external billing platforms.

## Resource Mapping

### Coverage (FHIR R4)

**CyMed Source:** `insurance.InsuranceMember` + `insurance.Coverage`

| FHIR Field | CyMed Field |
|-----------|------------|
| `Coverage.status` | Derived from `Coverage.is_active` + `end_date` |
| `Coverage.subscriber` | Reference to patient (patient_id) |
| `Coverage.subscriberId` | `InsuranceMember.member_id` |
| `Coverage.beneficiary` | Reference to patient |
| `Coverage.relationship` | `InsuranceMember.member_relationship` |
| `Coverage.period.start` | `InsuranceMember.effective_date` |
| `Coverage.period.end` | `InsuranceMember.expiry_date` |
| `Coverage.payor` | Reference to insurance company (payer_id) |
| `Coverage.class.type` | `InsurancePlan.plan_type` |
| `Coverage.class.value` | `InsuranceMember.group_number` |
| `Coverage.order` | `InsuranceMember.priority_order` |
| `id` | `fhir_coverage_id` |

---

### CoverageEligibilityRequest (FHIR R4)

**CyMed Source:** `eligibility.EligibilityRequest`

| FHIR Field | CyMed Field |
|-----------|------------|
| `CoverageEligibilityRequest.status` | Mapped from `EligibilityRequest.status` |
| `CoverageEligibilityRequest.patient` | `patient_id` |
| `CoverageEligibilityRequest.created` | `created_at` |
| `CoverageEligibilityRequest.servicedDate` | `service_date` |
| `CoverageEligibilityRequest.insurance` | `insurance_plan_id` |
| `id` | `fhir_coverage_eligibility_request_id` |

---

### CoverageEligibilityResponse (FHIR R4)

**CyMed Source:** `eligibility.EligibilityResponse`

| FHIR Field | CyMed Field |
|-----------|------------|
| `CoverageEligibilityResponse.outcome` | `coverage_status` |
| `CoverageEligibilityResponse.insurance.inforce` | `is_eligible` |
| `insurance.item.benefit.allowedMoney` | `deductible_amount`, `out_of_pocket_max` |
| `insurance.item.benefit.usedMoney` | `deductible_met`, `out_of_pocket_met` |
| `id` | `fhir_coverage_eligibility_response_id` |

---

### Claim (FHIR R4)

**CyMed Source:** `claims.Claim`

| FHIR Field | CyMed Field |
|-----------|------------|
| `Claim.status` | Mapped from `Claim.status` |
| `Claim.type` | `Claim.claim_type` (institutional/professional/dental/pharmacy) |
| `Claim.patient` | `patient_id` |
| `Claim.billablePeriod.start` | `service_from_date` |
| `Claim.billablePeriod.end` | `service_to_date` |
| `Claim.created` | `claim_date` |
| `Claim.provider` | `rendering_provider_id` |
| `Claim.referral` | `referring_provider_id` |
| `Claim.insurance.coverage` | `insurance_member_id` |
| `Claim.insurance.preAuthRef` | `preauthorization_number` |
| `Claim.diagnosis.sequence` | ICD-11 primary + secondary |
| `Claim.diagnosis.diagnosisCodeableConcept.system` | `http://hl7.org/fhir/sid/icd-11` |
| `Claim.item` | `ClaimLine` records |
| `Claim.total.value` | `total_billed_amount` |
| `id` | `fhir_claim_id` |

---

### ClaimResponse (FHIR R4)

**CyMed Source:** `claims.ClaimResponse`

| FHIR Field | CyMed Field |
|-----------|------------|
| `ClaimResponse.outcome` | `response_type` |
| `ClaimResponse.payment.amount` | `paid_amount` |
| `ClaimResponse.payment.date` | `payment_date` |
| `ClaimResponse.error` | `denial_codes` |
| `id` | `fhir_claim_response_id` |

---

### ExplanationOfBenefit (FHIR R4)

**CyMed Source:** `claims.ClaimResponse` (eob_number field)

| FHIR Field | CyMed Field |
|-----------|------------|
| `ExplanationOfBenefit.claim` | Reference to Claim |
| `ExplanationOfBenefit.outcome` | Derived from `response_type` |
| `ExplanationOfBenefit.payment.amount` | `paid_amount` |
| `id` | `fhir_eob_id` |

---

### Invoice (FHIR R4)

**CyMed Source:** `billing.Invoice`

| FHIR Field | CyMed Field |
|-----------|------------|
| `Invoice.status` | Mapped from `Invoice.status` |
| `Invoice.subject` | `patient_account.patient_id` |
| `Invoice.date` | `invoice_date` |
| `Invoice.totalNet` | `amount_subtotal` |
| `Invoice.totalGross` | `amount_total` |
| `Invoice.lineItem` | `InvoiceLine` records |
| `id` | `fhir_invoice_id` |

---

### Account (FHIR R4)

**CyMed Source:** `billing.PatientAccount`

| FHIR Field | CyMed Field |
|-----------|------------|
| `Account.status` | `account_status` |
| `Account.subject` | `patient_id` |
| `Account.identifier` | `account_number` |
| `id` | `fhir_account_id` |

## ICD-11 in FHIR Claims

All diagnosis codes use the ICD-11 coding system:
```
"diagnosis": [{
  "sequence": 1,
  "diagnosisCodeableConcept": {
    "coding": [{
      "system": "http://hl7.org/fhir/sid/icd-11",
      "code": "DC24",
      "display": "Cholelithiasis"
    }]
  },
  "type": [{"coding": [{"code": "principal"}]}]
}]
```

Codes sourced from `TerminologyService.get_icd11(code)` — no local ICD tables.
