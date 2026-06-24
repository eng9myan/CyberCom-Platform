# Phase 3.8 — CyMed Revenue Cycle Management (RCM), Insurance & Claims Platform

**Delivery Date:** 2026-06-24  
**Branch:** develop  
**Status:** COMPLETE

---

## Executive Summary

CyMed RCM is the healthcare financial engine of the CyberCom platform — a production-ready Revenue Cycle Management, Insurance, Billing, Claims, and Payer platform built to compete directly with Epic Resolute, Oracle Cerner Revenue Cycle, R1 RCM, Optum, and Change Healthcare.

The platform owns the complete healthcare billing domain from eligibility verification through collections, while delegating accounting records to CyCom ERP via CyIntegrationHub — maintaining strict service boundary isolation with no shared tables and no direct ORM access between services.

---

## Delivery Metrics

| Metric | Count |
|--------|-------|
| Django Apps | 12 |
| Database Tables | 59 |
| Python Files | 105 |
| Test Files | 3 |
| Test Cases | 68 |
| Documentation Files | 12 |
| Commercial Editions | 3 |
| FHIR R4 Resources | 8 |

---

## Architecture

### Service Boundary (Strict)

```
CyMed RCM (owns healthcare billing domain)
  ↕ CyIntegrationHub only
CyCom Finance (owns GL, AR, AP, Treasury)
```

No shared ORM. No shared tables. No direct database access between services.

### Claims Lifecycle

```
Registration → Eligibility → Preauthorization → Service Delivery
    → Charge Capture → Encounter Billing → Invoice
    → Claim Preparation (CyAI scrubbing, advisory) → Claim Submission
    → Payer Response → Payment → CyIntegrationHub → CyCom AR
                    → Denial → Appeal → Corrective Action → Resubmit
                    → Outstanding Balance → Collections → Payment Plan
```

---

## Module Summary (12 Apps)

| App | Models | Key Capabilities |
|-----|--------|-----------------|
| `eligibility` | EligibilityRequest, EligibilityResponse, CoverageVerification, BenefitVerification | Real-time + batch eligibility, benefit verification, patient responsibility estimate |
| `insurance` | InsuranceCompany, InsurancePlan, InsuranceMember, Coverage, Benefit, CoverageRule, InsuranceCard | Multi-payer, primary/secondary/tertiary, benefit design, coverage rules |
| `preauthorization` | Preauthorization, AuthorizationRequest, AuthorizationDecision, AuthorizationAppeal | Service/procedure/medication/imaging auth, multi-level appeals |
| `billing` | PatientAccount, EncounterBilling, Invoice, InvoiceLine, BillingAdjustment, Refund | Self-pay, insurance, corporate, government, package billing |
| `charge_capture` | Charge, ChargeItem, ChargeRule, ChargeAdjustment, ChargeAudit | Auto-charge from all clinical modules, charge rules engine |
| `claims` | Claim, ClaimLine, ClaimSubmission, ClaimResponse, ClaimStatus, ClaimAttachment | FHIR R4 Claim/ClaimResponse/EOB, batch, resubmission, status history |
| `denials` | Denial, DenialReason, Appeal, AppealOutcome, CorrectiveAction | Root cause analysis, appeal workflow, denial reason library |
| `collections` | CollectionCase, CollectionAction, PaymentPlan, CollectionOutcome | Aging buckets, payment plans, CyAI collection risk scoring |
| `contracts` | PayerContract, ContractRate, ContractRule, ReimbursementRule | FFS/DRG/capitation/bundled, timely filing rules, underpayment detection |
| `pricing` | PriceList, ServicePrice, PackagePrice, DiscountRule | Hospital/clinic/lab/imaging/pharmacy pricing, packages, VAT |
| `revenue_analytics` | RevenueDashboardSnapshot, ClaimMetricsSnapshot, DenialAnalyticsSnapshot, PayerPerformanceSnapshot, RCMAIInsight, RevenueLeakageAlert | Revenue KPIs, payer performance, AI-driven leakage detection |
| `payer_portal` | PayerPortalAccount, PayerDashboard, PayerClaimReview, PayerAuthorizationReview | External payer reviewer portal, scoped to own company data |

---

## Database Tables (59 total — `cymed_rcm_*` prefix)

### Eligibility (4)
- `cymed_rcm_elig_requests`
- `cymed_rcm_elig_responses`
- `cymed_rcm_coverage_verifications`
- `cymed_rcm_benefit_verifications`

### Insurance (7)
- `cymed_rcm_ins_companies`
- `cymed_rcm_ins_plans`
- `cymed_rcm_ins_members`
- `cymed_rcm_ins_coverages`
- `cymed_rcm_ins_benefits`
- `cymed_rcm_ins_coverage_rules`
- `cymed_rcm_ins_cards`

### Preauthorization (4)
- `cymed_rcm_preauths`
- `cymed_rcm_auth_requests`
- `cymed_rcm_auth_decisions`
- `cymed_rcm_auth_appeals`

### Billing (6)
- `cymed_rcm_bill_patient_accounts`
- `cymed_rcm_bill_encounter_billings`
- `cymed_rcm_bill_invoices`
- `cymed_rcm_bill_invoice_lines`
- `cymed_rcm_bill_adjustments`
- `cymed_rcm_bill_refunds`

### Charge Capture (5)
- `cymed_rcm_chg_charges`
- `cymed_rcm_chg_charge_items`
- `cymed_rcm_chg_charge_rules`
- `cymed_rcm_chg_adjustments`
- `cymed_rcm_chg_audits`

### Claims (6)
- `cymed_rcm_clm_claims`
- `cymed_rcm_clm_lines`
- `cymed_rcm_clm_submissions`
- `cymed_rcm_clm_responses`
- `cymed_rcm_clm_status_history`
- `cymed_rcm_clm_attachments`

### Denials (5)
- `cymed_rcm_denial_denials`
- `cymed_rcm_denial_reasons`
- `cymed_rcm_denial_appeals`
- `cymed_rcm_denial_appeal_outcomes`
- `cymed_rcm_denial_corrective_actions`

### Collections (4)
- `cymed_rcm_coll_cases`
- `cymed_rcm_coll_actions`
- `cymed_rcm_coll_payment_plans`
- `cymed_rcm_coll_outcomes`

### Contracts (4)
- `cymed_rcm_ctr_contracts`
- `cymed_rcm_ctr_rates`
- `cymed_rcm_ctr_rules`
- `cymed_rcm_ctr_reimbursement_rules`

### Pricing (4)
- `cymed_rcm_price_lists`
- `cymed_rcm_price_service_prices`
- `cymed_rcm_price_packages`
- `cymed_rcm_price_discount_rules`

### Revenue Analytics (6)
- `cymed_rcm_ana_revenue_snapshots`
- `cymed_rcm_ana_claim_metrics`
- `cymed_rcm_ana_denial_snapshots`
- `cymed_rcm_ana_payer_performance`
- `cymed_rcm_ana_ai_insights`
- `cymed_rcm_ana_leakage_alerts`

### Payer Portal (4)
- `cymed_rcm_payer_accounts`
- `cymed_rcm_payer_dashboards`
- `cymed_rcm_payer_claim_reviews`
- `cymed_rcm_payer_auth_reviews`

---

## FHIR R4 Implementation

| FHIR Resource | CyMed Model | Field |
|--------------|-------------|-------|
| `Coverage` | InsuranceMember + Coverage | `fhir_coverage_id` |
| `CoverageEligibilityRequest` | EligibilityRequest | `fhir_coverage_eligibility_request_id` |
| `CoverageEligibilityResponse` | EligibilityResponse | `fhir_coverage_eligibility_response_id` |
| `Claim` | Claim | `fhir_claim_id` |
| `ClaimResponse` | ClaimResponse | `fhir_claim_response_id` |
| `ExplanationOfBenefit` | ClaimResponse | `fhir_eob_id` |
| `Invoice` | Invoice | `fhir_invoice_id` |
| `Account` | PatientAccount | `fhir_account_id` |

All diagnosis codes reference ICD-11 via `TerminologyService` (P2.10). No local ICD tables.

---

## ICD-11 Integration

```python
from platform.terminology.service import TerminologyService

# All diagnosis codes sourced here — no local tables
codes = TerminologyService.search_icd11(query="cholelithiasis")
# Returns: [{"code": "DC24", "title": "Cholelithiasis", ...}]
```

---

## CyAI Integration (Advisory Only)

| Capability | Model | Rule |
|-----------|-------|------|
| Claim Scrubbing | RCMAIInsight | Advisory only — cannot submit claims |
| Denial Prediction | Denial.ai_denial_prediction | Advisory only — cannot deny claims |
| Revenue Leakage Detection | RevenueLeakageAlert | Advisory only |
| Authorization Risk | RCMAIInsight | Advisory only — cannot approve auths |
| Payer Performance Analysis | PayerPerformanceSnapshot | Read-only analysis |
| Collection Risk Scoring | CollectionCase.ai_collection_risk_score | Advisory only — cannot write off |

**AI Guardrails:**
- `is_advisory_only = True` with `editable=False` on all AI fields
- All AI decisions require human review and explicit approval
- CyAI cannot submit, approve, deny, or write off any financial record

---

## CyCom Integration Boundary

Events pushed to CyCom Finance via `CyIntegrationHub` (never direct ORM):

| Event | Trigger | CyCom Action |
|-------|---------|-------------|
| `cymed.rcm.invoice.approved` | Invoice status → approved | AR entry created |
| `cymed.rcm.claim.submitted` | Claim status → submitted | Claim tracking notification |
| `cymed.rcm.collection_case.created` | CollectionCase created | Receivable flagged |

CyCom remains the system of record for:
- General Ledger
- Accounts Receivable (entries)
- Accounts Payable
- Treasury
- Financial Reporting

---

## Clinical Module Integration

| Module | Integration Point |
|--------|-----------------|
| CyMed Clinic (P3.1) | Consultation charges, preauth for procedures |
| CyMed Hospital (P3.2) | Admission charges, DRG billing, room & board |
| CyMed Laboratory (P3.3) | Lab test charges, auto-charge on result verification |
| CyMed Imaging (P3.4) | Imaging charges, preauth for studies |
| CyMed Pharmacy (P3.5) | Medication charges, preauth for high-cost drugs |
| Patient Portal (P3.6) | Invoice view, payment plan enrollment, coverage status |
| Provider Portal (P3.7) | Auth status dashboard, claim issue alerts, coding assistance |

---

## Testing

| Test File | Coverage |
|-----------|---------|
| `test_rcm_insurance_eligibility.py` | 7 insurance + 4 eligibility + 4 preauthorization + 5 charge capture = 20 tests |
| `test_rcm_billing_claims.py` | 7 billing + 7 claims + 4 denials + 4 collections = 22 tests |
| `test_rcm_contracts_analytics_security.py` | 4 contracts + 4 pricing + 5 analytics + 4 payer portal + 2 isolation + 3 AI guardrails + 3 CyCom boundary = 25 tests |
| **Total** | **68 tests** |

---

## Commercial Editions

### CyMed Revenue Cycle Standard
Eligibility, insurance, billing, claims. Per-facility SaaS.

### CyMed Revenue Cycle Enterprise
Adds preauthorization, charge capture, denials, collections, contracts, pricing, revenue analytics, payer portal. Annual enterprise contract.

### CyMed Government Payer Platform
Adds national insurance programs, government claims, public health funding models. Air-gapped, Arabic RTL, government branding.

---

## Competitive Analysis

| Competitor | CyMed RCM Advantage |
|-----------|-------------------|
| **Epic Resolute** | Native clinical-financial integration (no middleware); ICD-11 vs ICD-10; sovereign/air-gap deployment |
| **Oracle Cerner Revenue Cycle** | Integrated CyCom ERP as accounting SoR; MENA-native; Arabic RTL first |
| **R1 RCM** | Platform-owned (not outsourced service); patient self-service via P3.6 Portal |
| **Optum Revenue Cycle** | No US market dependency; government payer platform; FHIR-native |
| **Change Healthcare** | No US clearinghouse dependency; direct FHIR R4 payer connectivity |
| **TrakCare Financials** | Auto-charge from clinical orders; full P3.0–P3.7 clinical integration; modern Django API |

---

## Documentation (12 files)

| File | Content |
|------|---------|
| `rcm_architecture.md` | Architecture, claims lifecycle, service boundaries, security roles |
| `insurance_management.md` | Multi-payer model, coverage, benefits, FHIR mapping |
| `eligibility.md` | Real-time + batch eligibility, patient responsibility estimate |
| `preauthorization.md` | Auth workflow, appeal levels, ICD-11 integration |
| `billing.md` | Billing workflow, invoice types, CyCom integration |
| `claims.md` | Claims lifecycle, FHIR mapping, batch processing |
| `denials.md` | Denial management, appeals, CyAI prediction |
| `contracts.md` | Payer contracts, rates, underpayment detection |
| `collections.md` | Collections workflow, payment plans, AI risk scoring |
| `payer_portal.md` | External payer access, review workflow, access control |
| `fhir_mapping.md` | Complete FHIR R4 field mapping |
| `commercial_packaging.md` | Editions, deployment options, competitive readiness |

---

## Roadmap

| Phase | Module | Target |
|-------|--------|--------|
| P3.9 | Population Health & National Digital Health | Next |
| P4.0 | CyMed AI Clinical Decision Support | Q3 2026 |
| P4.1 | CyCom ERP Foundation | Q3 2026 |
| P4.2 | Frontend (Next.js) & Mobile (React Native) | Q4 2026 |
| P5.0 | Commercial Launch | Q1 2027 |
