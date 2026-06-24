# CyMed Population Health, Registries & Public Health — Architecture

## Overview

CyMed Population Health is a multi-tenant, FHIR R4-compliant platform for managing disease registries, population surveillance, care gaps, risk stratification, national programs, and digital health credentials. It operates as a bounded product domain within the CyberCom Platform under `backend/products/cymed/population_health/`.

## Core Design Principles

- **Population-first, patient-contexted**: Every module can operate at population scale (cohort/region/national) while maintaining individual patient linkage via `patient_id` UUIDField.
- **Terminolgy via TerminologyService only**: ICD-11, SNOMED CT, LOINC, ICF codes are always resolved through `platform.services.terminology.TerminologyService` (P2.10). No local terminology tables.
- **AI advisory only**: All AI-generated fields (`is_ai_generated=True`) are paired with `is_advisory_only=True, editable=False`. CyAI cannot diagnose, prescribe, or take autonomous clinical action.
- **CyGov integration via CyIntegrationHub**: National identity, licensing, and citizen service data flows through CyIntegrationHub events to CyGov — never via shared ORM or direct database joins.
- **FHIR national exchange**: Patient, Practitioner, Organization, Location, Condition, Observation, DiagnosticReport, CarePlan, Immunization, Encounter resources are supported for national health information exchange.
- **Multi-tenant isolation**: Every query is scoped by `tenant_id`. Row-level isolation is enforced at the model level.

## Module Map

```
backend/products/cymed/population_health/
├── __init__.py
├── apps.py                     # cymed_population_health
├── urls.py                     # Top-level router for 12 sub-apps
├── signals.py                  # Outbreak/enrollment event publishers
├── views.py                    # Health check + edition listing
├── registries/                 # Disease registries
├── public_health/              # Population groups, national providers/facilities
├── surveillance/               # Outbreak detection and case investigation
├── quality/                    # Quality measures and clinical audits
├── care_gaps/                  # Care gap identification and resolution
├── risk_management/            # Patient risk scoring and assessment
├── cohorts/                    # Population cohort management
├── epidemiology/               # Disease trends and epidemiological studies
├── national_programs/          # Government health programs
├── analytics/                  # Insights, forecasts, KPI dashboards
├── reporting/                  # National reports and government submissions
└── digital_health/             # National Health ID, vaccination certificates, health passes
```

## Commercial Editions

| Edition | Key Modules |
|---|---|
| Population Health | registries, care_gaps, cohorts, risk_management, quality, analytics |
| Public Health | + surveillance, epidemiology, reporting |
| National Health Platform | + public_health, national_programs, digital_health |
| Government Digital Health Platform | + ministry_dashboards, cross_agency_integration, citizen_health_services |

## Integration Boundaries

```
CyMed Population Health
        │
        ├─► CyGov (via CyIntegrationHub)
        │   • CyGov Identity: NationalHealthID linking
        │   • CyGov Licensing: Provider/Facility registration sync
        │   • CyGov Citizen Services: Digital health pass issuance
        │   • CyGov Registries: National registries reporting
        │
        ├─► CyMed Clinical (P3.1-P3.4 via OutboxEvent)
        │   • patient_id reference (UUIDField — no direct FK)
        │   • Immunization, Condition, Encounter references for gap/risk calculation
        │
        ├─► CyAI (advisory only)
        │   • Disease forecasting (is_advisory_only=True)
        │   • Outbreak prediction (is_advisory_only=True)
        │   • Population risk scoring (is_advisory_only=True)
        │   • Care gap detection (is_advisory_only=True)
        │
        └─► FHIR National Exchange
            • Patient, Practitioner, Organization, Location
            • Condition, Observation, DiagnosticReport
            • CarePlan, Immunization, Encounter
```

## Database Table Prefixes

| Module | Prefix |
|---|---|
| registries | `cymed_ph_reg_` |
| public_health | `cymed_ph_pop_` |
| surveillance | `cymed_ph_surv_` |
| quality | `cymed_ph_qual_` |
| care_gaps | `cymed_ph_gap_` |
| risk_management | `cymed_ph_risk_` |
| cohorts | `cymed_ph_coh_` |
| epidemiology | `cymed_ph_epi_` |
| national_programs | `cymed_ph_prog_` |
| analytics | `cymed_ph_ana_` |
| reporting | `cymed_ph_rep_` |
| digital_health | `cymed_ph_dh_` |

## Security Model

- **ABAC**: Patient-level records gated by Attribute-Based Access Control (provider–patient relationship, facility assignment, program enrollment).
- **RBAC**: Population health analyst, public health officer, epidemiologist, program manager, national admin, ministry officer roles.
- **Break-glass**: Override for emergency surveillance access with mandatory audit log to `platform.audit`.
- **National Health ID**: Cross-referenced with CyGov Identity before issuance; deduplication via `national_id_hash`.
- **Vaccination Certificate QR**: Encoded offline-verifiable payload in `qr_code_data`; validity enforced at certificate level.
