# Collections Management

## Overview

Manages outstanding patient balances through a structured collection workflow — from initial aging to payment plan setup, collection actions, and final resolution. CyAI provides collection risk scoring (advisory) to prioritize high-risk accounts.

## Models

### CollectionCase
Master collection record per patient account. Tracks outstanding and original balance, aging bucket, priority, and AI risk score.

**Aging Buckets:** current, 30_days, 60_days, 90_days, 120_days, over_120  
**Status:** active, payment_plan, legal, written_off, resolved, closed

**AI Field:**
- `ai_collection_risk_score` — 0-100 risk score from CyAI (advisory only)

### CollectionAction
Log of all collection activities — calls, SMS, letters, payment received, plan created.

**Action Types:** phone_call, sms, email, letter, payment_arrangement, legal_notice, field_visit, payment_received, plan_created, write_off_recommended

### PaymentPlan
Installment payment arrangement for patients unable to pay full balance. Tracks installments, frequency, and payment progress.

**Frequencies:** weekly, biweekly, monthly

### CollectionOutcome
Final resolution of a collection case — paid in full, partial, payment plan completed, written off, legal settlement.

## Collections Workflow

```
Patient balance outstanding after invoice due date
                │
                ▼
CollectionCase created (aging_bucket = current)
                │
                ▼
CyAI assigns risk score (advisory)
Collections Officer reviews and prioritizes
                │
                ▼
CollectionAction logged:
  → Phone call / SMS / Email / Letter
                │
            ┌───┴───┐
            ▼       ▼
     Payment     No Response
     Received      │
         │         ▼
   Outcome=    PaymentPlan or
   paid_in_full  Legal Notice
                   │
                   ▼
            CollectionOutcome recorded
```

## AI Collection Risk Scoring

CyAI evaluates:
- Payment history (previous encounters)
- Insurance coverage status
- Balance amount relative to income indicators
- Days outstanding
- Previous collection case history

**Output:** 0-100 score — higher = higher risk of non-collection.  
**Collections Officer** uses the score to prioritize their worklist. AI cannot write off balances — human approval required.

## Integration with Patient Portal

Outstanding balances and payment plans are visible to patients in Patient Portal (P3.6):
- View outstanding balance
- Set up payment plan (if enabled by facility)
- Make partial payments

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/rcm/collections/cases/` | Collection case management |
| POST | `/rcm/collections/cases/{id}/assign/` | Assign to collections officer |
| POST | `/rcm/collections/cases/{id}/write_off/` | Write off balance |
| GET/POST | `/rcm/collections/actions/` | Log collection actions |
| GET/POST | `/rcm/collections/payment-plans/` | Payment plan management |
| POST | `/rcm/collections/payment-plans/{id}/approve/` | Approve payment plan |
| GET/POST | `/rcm/collections/outcomes/` | Record collection outcomes |
