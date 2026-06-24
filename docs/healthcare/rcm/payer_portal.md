# Payer Portal

## Overview

The Payer Portal provides external insurance company staff with a dedicated, access-controlled interface to review claims, process authorizations, review appeals, and manage eligibility. Payer users authenticate via CyIdentity with MFA and are scoped to their own company's data only.

## Models

### PayerPortalAccount
User account for a payer reviewer. Each account is linked to an insurance company and a CyIdentity user. Access level determines what actions the reviewer can take.

**Roles:** claims_reviewer, eligibility_reviewer, auth_reviewer, appeals_reviewer, account_manager, admin  
**Access Levels:** read_only, reviewer, approver, admin

### PayerDashboard
Per-account dashboard showing pending claims count, pending authorizations, and pending appeals. Refreshed on login.

### PayerClaimReview
Payer reviewer's claim review record. Tracks review status, decision, and additional information requests.

**Review Status:** pending → under_review → additional_info_requested → decision_made

### PayerAuthorizationReview
Payer reviewer's authorization review record. Supports clinical review workflow, approved units, and approved dates.

**Review Status:** pending → under_review → clinical_review → decision_made

## Access Control

- Payer portal users see **only their own company's** claims, authorizations, and eligibility
- Row-level tenant + company filter applied to all queries
- MFA enforced via CyIdentity for all payer accounts
- Break-glass access not applicable (payer is external party)
- All decisions are audit-logged

## Data Exposed to Payers

| Resource | What Payers See |
|----------|----------------|
| Claims | Claims submitted to their company |
| Authorizations | Auth requests for their company's members |
| Appeals | Appeals against their company's denials |
| Eligibility | Member eligibility for their plans |

## Payer Decision Flow

```
Claim submitted electronically
        │
        ▼
PayerClaimReview created (status=pending)
        │
        ▼
Payer reviewer logs in to Payer Portal
        │
        ▼
Reviews claim + attachments
        │
     ┌──┴──┐
     ▼     ▼
  Approve  Deny / Request Info
     │
     ▼
PayerClaimReview.decision recorded
     │
     ▼
CyMed ClaimResponse updated
CyIntegrationHub event fired
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/rcm/payer-portal/accounts/` | Payer portal accounts |
| GET | `/rcm/payer-portal/dashboard/` | Payer dashboard |
| GET/POST | `/rcm/payer-portal/claim-reviews/` | Claim reviews |
| POST | `/rcm/payer-portal/claim-reviews/{id}/make_decision/` | Record claim decision |
| GET/POST | `/rcm/payer-portal/auth-reviews/` | Authorization reviews |
| POST | `/rcm/payer-portal/auth-reviews/{id}/make_decision/` | Record auth decision |
