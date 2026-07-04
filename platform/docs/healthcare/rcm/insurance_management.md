# Insurance Management

## Overview

The Insurance Management module maintains the complete insurance data model — companies, plans, members, coverages, benefits, and coverage rules. It supports multi-payer environments with primary, secondary, and tertiary insurance layers.

## Models

### InsuranceCompany
Master registry of all payers. Each company has a unique `payer_id` used for EDI transactions.

**Company Types:** private, government, semi_government, cooperative, international

**Key fields:**
- `payer_id` — unique EDI payer identifier (X12/FHIR)
- `eligibility_endpoint` — real-time eligibility API URL
- `claims_endpoint` — electronic claims submission endpoint

### InsurancePlan
Plans offered by an insurance company. Governs coverage category, network type, and benefit design.

**Plan Types:** hmo, ppo, epo, pos, indemnity, government, corporate, family, individual

### InsuranceMember
Links a patient to an insurance plan. Supports up to 3 insurance tiers via `priority_order` (1=primary, 2=secondary, 3=tertiary). Unique constraint enforces one plan per priority per tenant per patient.

### Coverage
Coverage details for a member, broken down by coverage type (medical, dental, vision, pharmacy, etc.). Contains deductible, OOP max, and FHIR Coverage ID.

### Benefit
Per-service benefit design: coverage percentage, copay, visit limits, preauth requirements.

### CoverageRule
Plan-level rules that govern billing behavior — preauth requirements, exclusions, referral requirements.

### InsuranceCard
Digital copies of insurance cards (front/back) stored as CyData references.

## Multi-Payer Coordination

```
Patient
  ├── Primary Insurance (priority_order=1)
  │     └── Coverage → Benefits
  ├── Secondary Insurance (priority_order=2)
  │     └── Coverage → Benefits (coordination of benefits)
  └── Tertiary Insurance (priority_order=3)
        └── Coverage → Benefits
```

Coordination of Benefits (COB) logic is applied during claim generation to correctly split responsibility across payers.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/rcm/insurance/companies/` | List/create insurance companies |
| GET/PUT/DELETE | `/rcm/insurance/companies/{id}/` | Insurance company detail |
| GET/POST | `/rcm/insurance/plans/` | List/create plans |
| GET/POST | `/rcm/insurance/members/` | List/create member enrollments |
| GET/POST | `/rcm/insurance/coverages/` | List/create coverages |
| GET/POST | `/rcm/insurance/benefits/` | List/create benefits |
| GET/POST | `/rcm/insurance/coverage-rules/` | List/create coverage rules |
| GET/POST | `/rcm/insurance/cards/` | Insurance card management |

## FHIR Mapping

| CyMed Model | FHIR R4 Resource |
|-------------|-----------------|
| InsurancePlan | InsurancePlan |
| InsuranceMember | Coverage (subscriber) |
| Coverage | Coverage |
| Benefit | InsurancePlan.coverage |
