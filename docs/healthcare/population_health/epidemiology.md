# Epidemiology & Population Indicators

## Purpose

Tracks disease trends, incidence and prevalence rates, population-level health indicators, and formal epidemiological studies. Provides the evidence base for public health policy and national health planning.

## Models

### EpidemiologyStudy
Formal research or surveillance study definition. `study_type`: cohort / case_control / cross_sectional / rct / surveillance / registry / ecological. `fhir_research_study_id` references the FHIR ResearchStudy resource. Study lifecycle: planning → recruiting → active → analysis → completed → published.

### DiseaseTrend
Time-series data for a specific disease by period (weekly/monthly/quarterly/annual) and geographic scope. `incidence_rate` and `prevalence_rate` are per 100,000 population. `unique_together` on (tenant, disease_code, period_type, period_date, geographic_scope) ensures one record per measurement. Disease codes are ICD-11 sourced from TerminologyService.

### PopulationIndicator
Named health indicator with a measured value, unit, and context (age group, gender, geographic scope). `indicator_type`: health_outcome / social_determinant / health_system / demographic / environmental / economic. Supports `confidence_interval_low` and `confidence_interval_high` for survey-based estimates.

### HealthMeasure
Aggregate population health summary statistics: morbidity, mortality, fertility, disability, life expectancy, DALY, QALY. Used for national health accounts and WHO reporting.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET/POST | `/epidemiology/studies/` | Epidemiology studies |
| GET/POST | `/epidemiology/trends/` | Disease trends time series |
| GET/POST | `/epidemiology/indicators/` | Population health indicators |
| GET/POST | `/epidemiology/measures/` | Health measures (mortality, fertility) |

## CyAI Disease Forecasting (Advisory)

CyAI Disease Forecasting analyzes `DiseaseTrend` time series to generate `OutbreakForecast` records (in the analytics module). These are:
- `is_ai_generated=True`
- `is_advisory_only=True` (non-editable)
- Status: pending_review until acknowledged by an authorized public health officer

Forecasts cannot trigger alerts, notifications, or authority submissions autonomously.

## FHIR Mapping

| Model | FHIR Resource |
|---|---|
| EpidemiologyStudy | `ResearchStudy` |
| DiseaseTrend | `MeasureReport` (population) |
| PopulationIndicator | `Observation` (population-level) |
| HealthMeasure | `MeasureReport` |
