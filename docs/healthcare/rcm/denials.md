# Denial Management

## Overview

Tracks denied claims, classifies denial root causes, manages appeals workflows, and drives corrective actions. CyAI provides denial prediction (advisory only) to flag high-risk claims before submission.

## Models

### Denial
Master denial record. Links to a specific claim (and optionally a claim line). Tracks denial category, root cause, amount, and assignment.

**Denial Categories:** eligibility, authorization, medical_necessity, coding, documentation, duplicate, timely_filing, network, other

**Root Causes:** missing_auth, wrong_code, expired_coverage, missing_docs, wrong_provider, other

**AI Fields:**
- `ai_denial_prediction` — CyAI flagged this before submission (advisory)
- `ai_prediction_confidence` — 0-100% confidence score

### DenialReason
Library of denial codes with standard descriptions, categories, resolution guidance, and historical appeal success rates.

### Appeal
Appeal filed against a denial. Supports 3 levels: internal, external peer review, administrative/legal. Tracks appeal reason, supporting documents, and clinical justification.

**Appeal Levels:** 1=internal, 2=external peer review, 3=independent external review

### AppealOutcome
Outcome of an appeal — amount recovered, payer reference, and outcome notes.

### CorrectiveAction
Action to resolve the underlying denial cause — recode, resubmit, add documentation, etc. Assigned to a user with a due date.

## Denial Management Workflow

```
Claim denied by payer
        │
        ▼
Denial created → Root cause classified
        │
        ▼
Corrective actions assigned (coder / billing specialist)
        │
     ┌──┴──┐
     ▼     ▼
  Recode  Add docs / Get auth
     │
     ▼
  Resubmit claim OR
  File Appeal (if within deadline)
        │
   Level 1 → Level 2 → Level 3
        │
   AppealOutcome recorded
   Amount recovered posted
```

## Denial Analytics

Denial data feeds `DenialAnalyticsSnapshot` in revenue_analytics:
- Denial rate by category, payer, provider, facility
- Appeal success rate by level and category
- Root cause Pareto (top denial reasons)
- Trend over time

## CyAI Denial Prediction

Before claim submission, CyAI analyzes:
- Historical payer denial patterns for this service/payer combination
- Missing authorization probability
- Coding mismatch patterns
- Documentation completeness

**Important:** AI cannot deny or approve claims. Prediction is advisory — human billing specialist reviews and decides whether to add documentation or obtain authorization before submitting.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/rcm/denials/` | List/create denials |
| POST | `/rcm/denials/{id}/assign/` | Assign to staff member |
| POST | `/rcm/denials/{id}/write_off/` | Mark as written off |
| GET/POST | `/rcm/denials/reasons/` | Denial reason library |
| GET/POST | `/rcm/denials/appeals/` | Appeal management |
| POST | `/rcm/denials/appeals/{id}/submit/` | Submit appeal |
| GET/POST | `/rcm/denials/appeal-outcomes/` | Record appeal outcomes |
| GET/POST | `/rcm/denials/corrective-actions/` | Corrective actions |
