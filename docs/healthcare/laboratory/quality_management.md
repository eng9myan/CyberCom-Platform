# Quality Management

**App**: `products.cymed.laboratory.quality` (label: `lab_quality`)

---

## Models

| Model | Purpose |
|-------|---------|
| `QualityRule` | Westgard rule definition |
| `QualityControl` | QC material (lot, concentration levels) |
| `QCLevel` | Low / Normal / High concentration within a material |
| `QualityRun` | Single QC measurement with z-score |
| `QCFailure` | Rule violation event requiring corrective action |
| `ProficiencyTest` | External proficiency testing participation |

---

## Westgard Rules

| Code | Rule | Type |
|------|------|------|
| `12s` | 1 value > 2 SD | Warning (never reject alone) |
| `13s` | 1 value > 3 SD | Rejection |
| `22s` | 2 consecutive > 2 SD same direction | Rejection |
| `r4s` | Range > 4 SD in same run | Rejection |
| `41s` | 4 consecutive > 1 SD same direction | Rejection |
| `10x` | 10 consecutive same side of mean | Rejection |

```python
QCService.WESTGARD_RULES = {
    "12s": lambda z, history: abs(z) > 2.0,
    "13s": lambda z, history: abs(z) > 3.0,
    "22s": lambda z, history: ...,
    "r4s": lambda z, history: ...,
    "41s": lambda z, history: ...,
    "10x": lambda z, history: ...,
}
```

`QCService.evaluate_run(qc_run_id)` evaluates all rules, stores `rules_triggered` (JSONField), marks run pass/fail.

---

## Z-Score Calculation

`z = (measured - target_mean) / target_sd`

Stored on `QualityRun.z_score`. Cumulative stats on `QCLevel.current_mean`, `current_sd`, `cv_percent`.

---

## QC Failure Workflow

`QCFailure.corrective_action` — free text root cause and corrective action.  
`QCFailure.resolved_at` — timestamp when resolved.

Patient results on the affected analyzer during the failure window are automatically flagged as `qc_hold = True` on `LabResult`.

---

## Proficiency Testing

`ProficiencyTest` records external PT participation (CAP, RCPAQAP, Saudi Accreditation Center).  
`result_score`, `passing_score`, `passed` fields track accreditation compliance.

---

## Feature Flag

`required_feature = "lab.quality"` — Advanced edition and above.
