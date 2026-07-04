# Quality Measures & Clinical Audits

## Purpose

Defines, calculates, and tracks clinical quality measures at facility and national level. Supports HEDIS, JCIA, CBAHI, and MOH-defined quality frameworks. Drives continuous improvement via QualityImprovement plans and ClinicalAudit cycles.

## Models

### QualityMeasure
Master measure definition. `measure_code` (unique) identifies the measure (e.g., HbA1c testing rate, mammography screening, readmission rate). `measure_type`: process / outcome / structure / composite / patient_reported. `numerator_definition` and `denominator_definition` are JSONField schemas used by the calculation engine. `related_icd11_codes` references conditions from TerminologyService; `loinc_codes` references observations.

### QualityMeasureResult
Calculated performance for a specific facility over a time period. `performance_rate = numerator / denominator * 100`. `meets_target` is True when performance_rate ≥ target_percentage. `unique_together` on (tenant, measure, facility, period_start, period_end) ensures one result per calculation period.

### QualityImprovement
Action plan linked to a QualityMeasureResult that did not meet target. `intervention_type`: process_change / training / technology / policy / care_pathway / audit_feedback. Tracks `expected_improvement` vs `actual_improvement` to close the PDSA loop.

### ClinicalAudit
Structured clinical audit with criteria checklist. `compliance_rate = compliant_count / sample_size * 100`. `findings` and `recommendations` are JSONField arrays. Audit lifecycle: planned → in_progress → completed → reported.

## Calculation Flow

```
CareGapResolution / Encounter data (via OutboxEvent)
        │
        ▼
QualityMeasure (numerator_definition, denominator_definition)
        │
        ▼
QualityMeasureResult (calculated periodically)
        │
        ├── meets_target=True  → QualityKPIDashboard (green)
        └── meets_target=False → QualityImprovement (action plan required)
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET/POST | `/quality/measures/` | Define / list measures |
| GET/POST | `/quality/results/` | View calculated results |
| GET/POST | `/quality/improvements/` | Quality improvement plans |
| GET/POST | `/quality/audits/` | Clinical audits |
| POST | `/quality/audits/{id}/complete/` | Mark audit complete |

## Supported Frameworks

| Framework | Scope |
|---|---|
| HEDIS (Healthcare Effectiveness Data) | Chronic disease, preventive care |
| JCIA (Joint Commission International) | Hospital accreditation |
| CBAHI (Saudi CB for Health Specialties) | National hospital standards |
| MOH Quality Standards | Ministry-defined KPIs |
| WHO Health System Performance | National health benchmarks |

## Analytics Integration

QualityMeasureResult feeds `QualityKPIDashboard` in the analytics module, which surfaces in the `PopulationHealthDashboard` for ministry-level review.
