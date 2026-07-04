# Contract Management

## Overview

Manages payer contracts, contracted rates, contract rules, and reimbursement logic. Used to calculate expected reimbursement, identify underpayments, and enforce billing rules per payer agreement.

## Models

### PayerContract
Master contract between a healthcare facility/group and an insurance company.

**Contract Types:** fee_for_service, capitation, bundled, drg, per_diem, value_based, discount_from_charges

**Status lifecycle:** draft → active → expired | terminated | pending_renewal

### ContractRate
Per-service contracted rates under a payer contract. Supports flat fee, percentage, per-diem, case rate, and DRG rate types.

### ContractRule
Billing rules and restrictions that apply under a contract — preauth requirements, timely filing windows, COB rules, bundling restrictions, global surgery periods.

**Rule Types:** preauth_required, timely_filing, coordination_of_benefits, billing_restriction, exclusion, bundling, global_period

### ReimbursementRule
Higher-level reimbursement calculation rules — percent of charges, DRG multiplier, capitation per-member-per-month, case rates.

## Contract Rate Lookup

When a claim is being prepared:
1. Look up `PayerContract` for the insurance company + facility
2. Find matching `ContractRate` by service code and effective date
3. Calculate expected reimbursement based on `rate_type` and `rate_amount`
4. If actual payment differs → identify underpayment for follow-up

## Underpayment Detection

CyAI analyzes `ClaimResponse.paid_amount` vs. `ContractRate.rate_amount`:
- Flags underpayments for revenue recovery
- Surfaces in `RevenueLeakageAlert` (leakage_type=contract_underpayment)

## Contract Renewal Workflow

- `renewal_notice_days` (default 90) triggers alerts before expiry
- `auto_renewal=True` creates a draft renewal contract automatically
- Finance Director / Revenue Manager reviews and activates

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/rcm/contracts/` | Payer contracts |
| POST | `/rcm/contracts/{id}/renew/` | Initiate contract renewal |
| GET/POST | `/rcm/contracts/rates/` | Contract rates |
| GET/POST | `/rcm/contracts/rules/` | Contract rules |
| GET/POST | `/rcm/contracts/reimbursement-rules/` | Reimbursement rules |
