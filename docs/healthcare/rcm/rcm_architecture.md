# CyMed RCM — Architecture Overview

## Overview

CyMed Revenue Cycle Management (RCM) is the financial engine of the CyMed clinical platform, responsible for all healthcare-specific financial workflows from charge capture through collections. It is a distinct service from CyCom (ERP) — CyMed RCM owns the healthcare billing domain, while CyCom owns the accounting system of record.

## Service Boundaries

```
┌─────────────────────────────────────────────────────────┐
│                     CyMed RCM                           │
│  Eligibility → Insurance → Preauth → Charge Capture     │
│  → Billing → Claims → Denials → Collections             │
│  + Contracts + Pricing + Revenue Analytics              │
│  + Payer Portal                                         │
└─────────────────┬───────────────────────────────────────┘
                  │ CyIntegrationHub only
                  │ (no shared ORM, no shared tables)
┌─────────────────▼───────────────────────────────────────┐
│                    CyCom Finance                        │
│  General Ledger · Accounts Receivable                   │
│  Accounts Payable · Treasury · Fixed Assets             │
└─────────────────────────────────────────────────────────┘
```

## Claims Lifecycle

```
Patient Encounter
       │
       ▼
Eligibility Verification ──→ Coverage Confirmation
       │
       ▼
Preauthorization (if required) ──→ Auth Number
       │
       ▼
Service Delivery (Clinic/Hospital/Lab/Imaging/Pharmacy)
       │
       ▼
Charge Capture (auto from orders, manual override)
       │
       ▼
Encounter Billing (coding, ICD-11, diagnosis mapping)
       │
       ▼
Invoice Generation (patient / insurance / corporate)
       │
       ▼
Claim Preparation & Scrubbing (CyAI advisory)
       │
       ▼
Claim Submission (electronic/batch)
       │
       ├──→ Paid ──→ Payment Posting ──→ CyIntegrationHub → CyCom AR
       │
       ├──→ Partial ──→ Patient Balance → Collections
       │
       └──→ Denied ──→ Denial Management → Appeal → Resubmit
```

## Module Structure

| App | Responsibility | Tables |
|-----|---------------|--------|
| `eligibility` | Real-time & batch eligibility | 4 |
| `insurance` | Insurance companies, plans, members | 7 |
| `preauthorization` | Auth requests, decisions, appeals | 4 |
| `billing` | Patient accounts, invoices, adjustments | 6 |
| `charge_capture` | Auto & manual charge generation | 5 |
| `claims` | Claim lifecycle & submission | 6 |
| `denials` | Denial tracking, appeals, corrective actions | 5 |
| `collections` | Payment plans, collection workflow | 4 |
| `contracts` | Payer contracts, rates, rules | 4 |
| `pricing` | Price lists, service pricing, packages | 4 |
| `revenue_analytics` | Dashboards, KPIs, AI insights | 6 |
| `payer_portal` | Payer review portal | 4 |

**Total: 59 database tables**

## Integration Points

### Clinical Platform (P3.0–P3.7)
- Charge Capture receives triggers from all clinical modules
- Preauthorization linked to orders (imaging, medication, procedure)
- Provider Portal: shows auth status, claim issues, documentation requests
- Patient Portal: shows invoices, payment plans, insurance status

### CyCom ERP (via CyIntegrationHub)
- Approved invoices → CyCom Accounts Receivable
- Payment transactions → CyCom Cash Management
- Financial summaries → CyCom General Ledger
- No direct database access between CyMed and CyCom

### External Payers
- Eligibility: HL7 270/271 or FHIR CoverageEligibilityRequest/Response
- Claims: FHIR Claim/ClaimResponse or X12 837/835
- Payer Portal: Dedicated reviewer accounts via CyIdentity

## Technology Stack

- **Framework:** Django + Django REST Framework
- **Database:** PostgreSQL with per-tenant row-level isolation (tenant_id)
- **Auth:** CyIdentity (RBAC/ABAC, MFA)
- **Events:** OutboxEvent → Kafka → CyIntegrationHub
- **Terminology:** P2.10 TerminologyService (ICD-11, SNOMED CT, LOINC)
- **AI:** CyAI advisory layer (claim scrubbing, denial prediction, leakage detection)
- **Storage:** CyData for claim attachments and supporting documents
- **Analytics:** CyData analytics lake for revenue dashboards

## Security Model

```
Role                  │ Permissions
──────────────────────┼──────────────────────────────────
Billing Specialist    │ Charge capture, invoice management
Revenue Manager       │ Full RCM, analytics, contract view
Insurance Officer     │ Eligibility, insurance, preauth
Claims Analyst        │ Claims management, denial workflows
Collections Officer   │ Collections, payment plans
Finance Director      │ Read-only all + analytics + CyCom push
Auditor               │ Read-only all + full audit trail
Payer (external)      │ Payer portal only — own company data
```

## Deployment Profiles

| Profile | Description |
|---------|-------------|
| Cloud | Multi-tenant SaaS, shared infrastructure |
| Private Cloud | Single-tenant, customer VPC |
| Government Cloud | Air-gapped, national insurance programs |
| Hybrid | Clinical on-premise, RCM cloud |
| Air-Gapped | Full isolation, no external connectivity |
