# Population Risk Management

## Purpose

Stratifies patients by risk across multiple health dimensions (readmission, mortality, chronic disease, high cost, preventable ED utilization) to prioritize care management interventions.

## Models

### RiskScore
A scored risk for a patient in a specific `risk_category`. `score` ranges 0.00–100.00. `risk_level` (low/moderate/high/very_high/critical) is derived from category thresholds. `is_ai_generated` flags CyAI-produced scores; all AI scores have `is_advisory_only=True` (non-editable). Valid until `valid_until` — after which scores should be recalculated.

### RiskFactor
Individual risk drivers contributing to a `RiskScore`. `contribution_weight` (0–100%) quantifies the factor's influence. `factor_type`: clinical / demographic / behavioral / social / historical. Clinical factors reference `icd11_code` from TerminologyService.

### RiskCategory
Defines the scoring model configuration: threshold values separating low/moderate/high/very_high/critical, plus a list of recommended interventions per level. Editable by platform admin — allows local calibration.

### RiskAssessment
A holistic multi-category risk review. Aggregates scores across categories into `overall_risk_level`. `assessment_type`: automated / manual / combined. Human assessments require `assessor_user_id`. `status`: pending_review → acknowledged (by provider) → acted_upon / archived. `acknowledged_by_user_id` is required before the assessment can proceed to care plan creation.

## Risk Scoring Flow

```
CyAI Disease Forecasting / Population Risk Analysis
        │  (advisory only — is_advisory_only=True)
        ▼
RiskScore created (is_ai_generated=True)
        │
        ├── RiskFactor[1..n] created
        │
        ▼
RiskAssessment generated (status=pending_review)
        │
        │  ← Provider must acknowledge (POST /risk/assessments/{id}/acknowledge/)
        ▼
Care plan / intervention assigned
(outside Population Health — via CyMed Clinical P3.1)
```

## AI Guardrails

- `RiskScore.is_advisory_only = True` with `editable=False` — cannot be overridden by any API call
- `RiskAssessment.is_advisory_only = True` with `editable=False`
- CyAI cannot enroll a patient in a care program
- CyAI cannot schedule a clinical appointment
- All assessments require `acknowledged_by_user_id` before any downstream action

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET/POST | `/risk/scores/` | View / create risk scores |
| GET/POST | `/risk/factors/` | View risk factors |
| GET/POST | `/risk/categories/` | Manage risk categories |
| GET/POST | `/risk/assessments/` | View / create assessments |
| POST | `/risk/assessments/{id}/acknowledge/` | Provider acknowledges assessment |

## Risk Categories Supported

| Category | Description |
|---|---|
| readmission | 30/90-day readmission prediction |
| mortality | In-hospital and 30-day mortality |
| chronic_disease | Likelihood of developing DM/HTN/CVD |
| high_cost | Top 5% healthcare utilizer prediction |
| preventable_ed | Avoidable emergency department visit |
| falls | Inpatient and community fall risk |
| mental_health | Depression, anxiety, crisis risk |
| sepsis | Sepsis onset prediction |
| malnutrition | Malnutrition risk screening |
