# Healthcare Billing

## Overview

Healthcare billing manages patient financial accounts, encounter billing, invoice generation, billing adjustments, and refunds. CyMed owns the healthcare billing workflow; CyCom owns accounts receivable and the general ledger — data flows between them via CyIntegrationHub.

## Models

### PatientAccount
Financial account for a patient. One account per patient per tenant. Tracks primary, secondary, and tertiary insurance, outstanding balance, and credit balance.

**Guarantor Types:** self, parent, spouse, employer, government, other  
**FHIR:** Maps to `Account`

### EncounterBilling
Billing record for a single clinical encounter. Links to the clinical encounter by UUID (no cross-service FK). Tracks billing status from open through paid/denied/written-off.

**Encounter Types:** outpatient, inpatient, emergency, day_case, telemedicine, home_visit, lab, imaging, pharmacy  
**Billing Status:** open → coded → reviewed → billed → paid | partial | denied | written_off

### Invoice
Formal invoice issued to patient, insurance company, or corporate account.

**Invoice Types:** patient, insurance, corporate, government  
**Status:** draft → issued → sent → partial | paid | overdue | cancelled | written_off

**When status → approved:** Signal fires → CyIntegrationHub → CyCom Finance (AR entry).

**FHIR:** Maps to `Invoice`

### InvoiceLine
Line items on an invoice. Each line maps to a charge, with service code, quantity, unit price, discount, and tax.

### BillingAdjustment
Contractual write-offs, courtesy adjustments, insurance write-offs, bad debt. Reduces the invoice balance. Requires approval for non-contractual adjustments.

**Types:** contractual, write_off, discount, refund, correction, insurance_writeoff, bad_debt, courtesy

### Refund
Refund of an overpayment or cancelled service. Requires approval. Tracked by method and processed by a named user.

## Billing Workflow

```
Encounter closed by clinical team
           │
           ▼
EncounterBilling created (status=open)
           │
           ▼
Medical coding (ICD-11 via TerminologyService)
           │
           ▼
Charge Capture validated and linked
           │
           ▼
EncounterBilling.status = reviewed
           │
           ▼
Invoice generated (per billing party type)
           │
       ┌───┼───┐
       ▼   ▼   ▼
  Patient  Insurance  Corporate
  Invoice  Invoice    Invoice
       │
       ▼
Invoice issued → Payment received
       │
       ▼
CyIntegrationHub → CyCom AR (revenue posted)
```

## Billing Types Supported

| Type | Description |
|------|-------------|
| Self Pay | Billed directly to patient |
| Insurance Billing | Primary → Secondary → Tertiary coordination |
| Corporate Billing | Billed to employer account |
| Government Billing | National health scheme billing |
| Package Billing | Fixed price for bundled services |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/rcm/billing/patient-accounts/` | Patient account management |
| GET/POST | `/rcm/billing/encounter-billings/` | Encounter billing records |
| GET/POST | `/rcm/billing/invoices/` | Invoice management |
| POST | `/rcm/billing/invoices/{id}/issue/` | Issue invoice |
| GET/POST | `/rcm/billing/invoice-lines/` | Invoice line items |
| GET/POST | `/rcm/billing/adjustments/` | Billing adjustments |
| GET/POST | `/rcm/billing/refunds/` | Refund processing |
| POST | `/rcm/billing/refunds/{id}/approve/` | Approve refund |
