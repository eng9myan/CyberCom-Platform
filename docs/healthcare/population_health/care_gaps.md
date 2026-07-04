# Care Gap Management

## Purpose

Identifies, prioritizes, and tracks gaps in preventive and chronic care delivery across the patient population. Drives proactive outreach, provider nudges, and population health improvement programs.

## What is a Care Gap?

A care gap exists when a patient is overdue for a clinical service defined by evidence-based guidelines: screenings, vaccinations, lab monitoring, follow-up visits, or chronic disease management checkpoints.

## Models

### CareGap
Core record of a care gap identified for a specific patient. `gap_type`: screening / vaccination / follow_up / medication_adherence / lab_test / imaging / preventive / chronic_monitoring / dental / mental_health. `priority` (low/medium/high/critical) drives outreach ordering. `status` lifecycle: open → in_progress → closed / waived / declined. `source` (automated/manual/registry/external) identifies origin. `identified_by_rule_id` links to the `CareGapRule` that generated this gap.

### CareGapRule
Configurable rule engine for gap detection. Defines inclusion criteria (age range, gender, active conditions via `applies_to_conditions` ICD-11 codes), frequency in days, and the recommendation text. Rules are evaluated by CyAI Population Risk Analysis (advisory output only — humans must act on detected gaps).

### CareGapRecommendation
Provider-facing recommendation for closing a gap. `loinc_code` identifies the recommended test/service. `is_ai_generated` marks CyAI-produced recommendations. AI recommendations require provider acknowledgement before being communicated to patients.

### CareGapResolution
Documents how a gap was closed: completed / waived / declined / transferred / auto_closed. Links to the `encounter_id` where the service was delivered (if applicable). Resolution is always performed by a human user (`resolved_by_user_id` required).

## Gap Detection Pipeline

```
CareGapRule (criteria, frequency_days)
        │
        ▼
CyAI Population Risk Analysis (advisory only)
        │
        ▼
CareGap created (status=open, source=automated)
        │
        ▼
CareGapRecommendation added (is_ai_generated=True)
        │   ← provider must acknowledge
        ▼
Provider communicates with patient
        │
        ▼
CareGapResolution (completed/waived/declined)
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET/POST | `/care-gaps/gaps/` | List / identify gaps |
| POST | `/care-gaps/gaps/{id}/close/` | Close resolved gap |
| POST | `/care-gaps/gaps/{id}/waive/` | Waive gap (clinical judgment) |
| GET/POST | `/care-gaps/rules/` | Configure detection rules |
| GET/POST | `/care-gaps/recommendations/` | View / add recommendations |
| GET/POST | `/care-gaps/resolutions/` | Record gap resolutions |

## Quality Integration

Care gap closure rates feed directly into `QualityMeasureResult.performance_rate` for denominator/numerator calculation, enabling HEDIS-style quality reporting.
