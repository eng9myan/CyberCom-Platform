# CyMed Laboratory Edition — Architecture

**Program**: 3.3  
**Status**: COMPLETE  
**Branch**: develop

---

## Overview

CyMed Laboratory Edition is a world-class Laboratory Information System (LIS) built on the CyberCom Platform. It competes directly with Cerner PathNet, Sunquest, Orchard Harvest, SCC Soft, Epic Beaker, TrakCare Laboratory, and Hakeem Laboratory.

---

## Application Structure

```
backend/products/cymed/laboratory/
├── orders/              # Test catalog, panels, orders, order items
├── specimens/           # Specimen lifecycle, containers, chain of custody
├── accessioning/        # Accession number generation, batching
├── worklists/           # Department worklists, analyzers, queues
├── results/             # Results, reference ranges, critical values
├── microbiology/        # Cultures, organisms, sensitivity, resistance
├── pathology/           # Surgical pathology case management
├── histopathology/      # Tissue blocks, slides, review workflow
├── quality/             # QC rules, runs, failures, proficiency testing
├── blood_bank_foundation/ # Blood products, inventory, transfusion requests
├── analytics/           # Pre-aggregated dashboards and metrics
└── reference_lab/       # Cross-lab routing, referral testing
```

---

## API Endpoints

All endpoints mounted at `/api/v1/lab/`:

| Module | Prefix | Key Resources |
|--------|--------|---------------|
| Orders | `/orders/` | tests, panels, orders, order-items |
| Specimens | `/specimens/` | specimens, containers, transports, rejections, chain-of-custody |
| Accessioning | `/accessioning/` | accessions, batches, audit |
| Worklists | `/worklists/` | analyzers, worklists, worklist-items, assignments |
| Results | `/results/` | results, result-values, reference-ranges, critical-results, approvals |
| Microbiology | `/microbiology/` | cultures, organisms, sensitivities, resistance-profiles |
| Pathology | `/pathology/` | cases, specimens, gross-exams, microscopic-exams, diagnoses |
| Histopathology | `/histopathology/` | histology-cases, tissue-blocks, slides, slide-reviews, diagnoses |
| Quality | `/quality/` | rules, controls, runs, failures, proficiency |
| Blood Bank | `/blood-bank/` | products, inventory, compatibility, transfusion-requests |
| Analytics | `/analytics/` | ops-dashboard, tat-metrics, productivity, quality-dashboard |
| Reference Lab | `/reference/` | reference-labs, routing, reference-orders, reference-results |

---

## Architecture Principles

### Tenant Isolation
All models inherit `BaseModel` from `platform.common.models`. Every query is scoped by `tenant_id`. No cross-tenant data leakage is possible at the ORM level.

### Feature Gating
`LaboratoryModelViewSet.required_feature` declares which feature a ViewSet requires. The feature is checked via `FeatureFlagService.is_enabled()` before every request. Zero hardcoded feature access in clinical code.

### Terminology Foundation
No local LOINC, SNOMED-CT, or ICD-11 databases. All terminology operations route through `TerminologyService` (Program 2.10). LOINC codes stored as reference fields populated at order creation time.

### Event-Driven Integration
All lifecycle events published via `OutboxEvent` (transactional outbox pattern) to Kafka topics. No direct coupling to downstream systems.

### Zero ERP Functionality
Finance, inventory, procurement, and HR remain in CyCom ERP. LIS publishes events (lab charges, reagent consumption, analyzer asset references) that CyCom consumes via CyIntegrationHub.

### AI Advisory Only
CyAI integration is available for critical value detection, delta checks, and interpretation suggestions. AI cannot validate or release results — human approval required.

---

## Integration Map

```
CyMed Clinic  ──→  orders/  ─→  specimens/ ─→ accessioning/ ─→ worklists/ ─→ results/
CyMed Hospital ──→                                                               ↓
CyIntegrationHub ─→ HL7 ORM/ORU parsing ─→ AnalyzerMessage ─→ AnalyzerResult  ↓
TerminologyService ─→ LOINC, SNOMED, ICD-11 validation ────────────────────→  ↓
CyAI ─→ Critical value detection, delta checks ───────────────────────────→   ↓
CyData ←── Order/Specimen/Result/QC events ────────────────────────────────────
CyCom ERP ←── Lab charges, reagent consumption events ─────────────────────────
```
