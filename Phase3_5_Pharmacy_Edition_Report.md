# Phase 3.5 — CyMed Pharmacy Edition: Delivery Report

**Program:** CyMed Pharmacy Edition (Inpatient + Outpatient + Clinical Pharmacy)
**Date:** 2026-06-23
**Status:** Production Ready

---

## Executive Summary

CyMed Pharmacy Edition is a complete, cloud-native pharmacy management platform covering
the full medication lifecycle from prescribing to dispensing, clinical review, and
medication reconciliation. It competes directly with Epic Willow, Cerner Millennium Pharmacy,
Omnicell Pharmacy, BD Pyxis Pharmacy, McKesson Pharmacy Systems, and PharmaNet.

The platform manages zero local drug databases — all drug codes are resolved via
TerminologyService (RxNorm, SNOMED). Inventory belongs to CyCom ERP. Procurement
belongs to CyCom ERP. CyMed Pharmacy publishes events and queries via CyIntegrationHub.

---

## Deliverables

### 10 Django Applications

| App | Label | Tables | Description |
|---|---|---|---|
| `prescriptions` | `cymed_rx` | 8 | Prescriptions, items, medication orders, status history, renewals, refills, attachments, medication history |
| `dispensing` | `cymed_rx_dispense` | 5 | Dispense orders, items, batch dispensing, pharmacist verification, audit log |
| `formulary` | `cymed_formulary` | 5 | Therapeutic classes, formularies, formulary drugs, restrictions, preferred medications |
| `drug_interactions` | `cymed_rx_interaction` | 4 | Interaction rules, detected interactions, severity config, real-time alerts |
| `clinical_pharmacy` | `cymed_clinical` | 4 | Medication reviews (DUR/CMR/TMR), clinical interventions, pharmacist recommendations, MTM sessions |
| `medication_reconciliation` | `cymed_rx_recon` | 3 | Reconciliation records, medication changes, conflict tracking |
| `automation` | `cymed_automation` | 4 | Device registry (ADC/robot/cabinet), dispensing robot profiles, cabinet profiles, automation queue |
| `analytics` | `cymed_pharmacy_analytics` | 3 | Operations dashboard snapshots, medication safety events, analytics config |
| `inventory_bridge` | `cymed_inventory` | 2 | Consumption events (→ CyCom ERP), inventory query cache |
| `procurement_bridge` | `cymed_procurement` | 1 | Procurement requests (→ CyCom ERP) |

**Total: 39 database tables**

### Standards & Interoperability

| Standard | Implementation |
|---|---|
| FHIR R4 MedicationRequest | `Prescription.fhir_medication_request_id`, `MedicationOrder.fhir_medication_request_id` |
| FHIR R4 MedicationDispense | `DispenseOrder.fhir_medication_dispense_id` |
| FHIR R4 MedicationStatement | `MedicationHistory.fhir_medication_statement_id`, `MedicationChange.fhir_medication_statement_id` |
| FHIR R4 Bundle | `MedicationReconciliation.fhir_bundle_id` |
| RxNorm CUI | All drug codes via TerminologyService — `drug_code` fields |
| SNOMED CT | Drug classes, therapeutic context via TerminologyService |
| ICD-11 | Diagnosis codes, indication restrictions, interaction contraindications |
| ATC Classification | `TherapeuticClass.atc_code` via TerminologyService |
| NDC (National Drug Code) | `DispenseItem.ndc_code` — barcode verification |
| DEA Schedule I–V | `Prescription.dea_schedule`, `MedicationOrder.dea_schedule` |
| NCC MERP Safety Categories A–I | `MedicationSafetyEvent.severity` (near-miss → death) |
| CPT Billing Codes | `MedicationTherapyManagement.billing_code` (MTM sessions) |
| NPI | `Prescription.prescriber_npi` |

### Commercial Editions

| Edition | Features | Target |
|---|---|---|
| CyMed Pharmacy Basic | Prescriptions, dispensing, formulary | Retail pharmacy, outpatient clinic |
| CyMed Pharmacy Clinical | + Drug interactions, clinical pharmacy, medication reconciliation | Hospital pharmacy |
| CyMed Pharmacy Automation | + ADC integration, dispensing robots, smart cabinets | Large hospital, health system |
| CyMed Pharmacy Enterprise | + Analytics, inventory bridge, procurement bridge | Health system, national chain |

### AI Integration (CyAI Advisory)

- Interaction priority scoring: `DrugInteraction.ai_priority_score` via `CyAIService.score_interaction_priority()`
- Polypharmacy risk: `MedicationReview.ai_polypharmacy_score` — pharmacist validates
- Adherence analysis: `MedicationReview.adherence_score` — pharmacist makes all decisions
- **AI cannot verify, approve, or dispense.** `Prescription.verified_by` and `DispenseOrder.verified_by` require human pharmacist UUIDs.

### Platform Integrations

- **CyCom ERP (Inventory):** `MedicationConsumptionEvent` publishes `cymed.inventory.consumed` — ERP handles deduction
- **CyCom ERP (Procurement):** `ProcurementRequest` publishes `cymed.procurement.requested` — ERP creates POs
- **CyIntegrationHub:** `AutomationDevice.integration_hub_device_id` — all robot/ADC commands route through Hub
- **TerminologyService:** RxNorm, SNOMED, ICD-11, ATC — no local terminology stores
- **Event Framework (P2.5):** `OutboxEvent` on prescription created, dispense completed, interaction overridden
- **FeatureFlagService:** All 4 edition tiers gated by commercial feature flags
- **CyData:** Analytics snapshots via Kafka pipeline

---

## Test Results

**64 tests — 64 passed — 0 failed**

| Test File | Tests | Coverage |
|---|---|---|
| `test_pharmacy_edition.py` | 44 | Prescriptions, items, controlled substances, refills, renewals, attachments, medication history, dispense orders, items, batches, verification, audit, interaction rules, severity config, alerts, medication reviews, interventions, recommendations, MTM, reconciliation, conflicts, formulary, drugs, restrictions, preferred medications, automation devices, robots, cabinets, queue, dashboard snapshots, safety events, consumption events, inventory cache, procurement requests |
| `test_fhir.py` | 8 | MedicationRequest on Prescription and MedicationOrder, MedicationDispense on DispenseOrder, MedicationStatement on MedicationHistory and MedicationChange, reconciliation FHIR bundle, FHIR search by ID |
| `test_security_workflow.py` | 12 | Tenant isolation (prescriptions, dispense, formulary, interaction rules), controlled substance field enforcement (DEA schedule, prescriber DEA), dispense audit for controlled substances, end-to-end workflow (prescribe → verify → dispense), event publishing, AI cannot change prescription status, override requires reason ≥ 10 chars |

---

## Architecture Decisions

### No Local Drug Database
All drug codes reference RxNorm CUI via TerminologyService. `drug_code` fields store
external codes as strings — display names fetched on demand. No local formulary/NDC
database duplication with CyCom or external drug compendia.

### AI as Advisory Layer
`DrugInteractionService._apply_ai_priority()` scores interactions but cannot set
`alert_status="overridden"`. `override_interaction()` enforces `pharmacist_id` as a
required human actor. `MedicationReview.ai_polypharmacy_score` is informational —
it cannot update `Prescription.status` or trigger dispensing.

### Inventory and Procurement Delegation
`MedicationConsumptionEvent` publishes a `cymed.inventory.consumed` Kafka event.
CyCom ERP consumes and owns the deduction. `ProcurementRequest` publishes
`cymed.procurement.requested` — CyCom creates and tracks purchase orders.
No pricing, stock counts, or supplier logic in pharmacy.

### Automation via CyIntegrationHub
`AutomationQueue` records device dispense requests. `AutomationDevice.integration_hub_device_id`
links to the Hub. All robot/ADC commands, HL7 messages, and device callbacks route
through Program 2.6 CyIntegrationHub — no direct device socket connections in pharmacy.

### Terminology Delegation
No local SNOMED, ICD-11, ATC, or RxNorm tables. `TherapeuticClass.atc_code` stores
the code string; the hierarchy is maintained here for formulary navigation only.
All term lookups delegate to TerminologyService.

### Controlled Substance Compliance
`Prescription.is_controlled` + `dea_schedule` are indexed separately for regulatory
reporting. `DispenseAudit` captures every state transition with `performed_by`,
`ip_address`, and `is_override` flags. `CabinetDevice.requires_witness` enforces
dual-pharmacist workflows for Schedule II dispensing.

### Medication Reconciliation Design
`MedicationReconciliation` is encounter-scoped and supports five transition types
(admission, transfer, discharge, pre-op, post-op). `MedicationConflict` records
must be resolved before reconciliation status can reach `completed`. FHIR Bundle
ID links the reconciliation to the external FHIR server record.

---

## Roadmap

| Feature | Target |
|---|---|
| e-Prescribing (NCPDP SCRIPT / SureScripts) integration | Phase 4.1 |
| Pharmacogenomics (PGx) interaction checking | Phase 4.2 |
| Patient medication adherence portal | Phase 4.3 |
| IV admixture compounding module | Phase 4.4 |
| Controlled substance regulatory reporting (state PDMP) | Phase 4.5 |
| Automated discharge prescription counseling (CyAI) | Phase 4.6 |
