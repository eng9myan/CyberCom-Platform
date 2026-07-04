# CyMed Pharmacy Edition — Architecture
*Program 3.5 | Hospital & Retail Pharmacy Information System*

---

## Overview

The CyMed Pharmacy Edition is a world-class, multi-tenant Pharmacy Information System (PIS) supporting hospital inpatient, retail, pharmacy chains, and national pharmacy networks. It competes directly with Epic Willow, Cerner PharmNet, Omnicell, Swisslog, McKesson Pharmacy, and TrakCare Pharmacy.

---

## Module Topology

```
backend/products/cymed/pharmacy/
├── prescriptions/          # Rx Management (MedicationRequest FHIR)
├── dispensing/             # Dispensing Workflow (MedicationDispense FHIR)
├── clinical_pharmacy/      # Clinical Review, MTM, Interventions
├── medication_reconciliation/ # Admission/Transfer/Discharge Reconciliation
├── drug_interactions/      # Drug-Drug, -Allergy, -Diagnosis, -Age, -Pregnancy
├── formulary/              # Formulary Management + Therapeutic Interchange
├── automation/             # ADC/Robot/Cabinet via CyIntegrationHub
├── analytics/              # Dashboards + Medication Safety Events
├── inventory_bridge/       # CyCom ERP Inventory (events only)
└── procurement_bridge/     # CyCom ERP Procurement (events only)
```

---

## Integration Architecture

```
CyMed Pharmacy
    │
    ├──► CyMed Core Clinical Platform (Program 3.0)
    │    Patients, Encounters, Admissions, Providers, Organizations
    │
    ├──► CyCom ERP (via CyIntegrationHub)
    │    Inventory (consumption events), Procurement, Finance, HR
    │
    ├──► CyAI (advisory, never prescribes/dispenses)
    │    Polypharmacy Risk, Adherence Analysis, Interaction Prioritization
    │
    ├──► CyIntegrationHub (Program 2.6)
    │    ADC, Robots, Cabinets, ERP, FHIR external endpoints
    │
    ├──► Program 2.10 Terminology Foundation
    │    RxNorm (drugs), ICD-11 (diagnoses), SNOMED, ATC, FHIR Terminology
    │
    ├──► Program 3.C0 Commercial Foundation
    │    Feature flags, licensing, editions, white labeling
    │
    └──► Program 2.5 Event Framework (Kafka / OutboxEvent)
         cymed.pharmacy.prescription.*
         cymed.pharmacy.dispense.*
         cymed.pharmacy.interaction.*
         cymed.inventory.consumed
         cymed.procurement.requested
```

---

## Boundary Rules

| Domain        | Owner              | Pharmacy Access    |
|---------------|--------------------|--------------------|
| Inventory     | CyCom ERP          | Events only        |
| Finance       | CyCom ERP          | Events only        |
| Drug DB       | TerminologyService | Code lookup only   |
| AI Decisions  | CyAI (advisory)    | Score + context    |
| Device Comms  | CyIntegrationHub   | Queue + status     |
| Patient Data  | CyMed Core         | UUID reference     |

---

## Security

- **CyIdentity**: JWT tokens for all API access
- **ABAC/RBAC**: Pharmacist, Clinical Pharmacist, Pharmacy Technician, Pharmacy Manager, Director of Pharmacy, Auditor
- **Tenant Isolation**: All models scoped by `tenant_id` + Django queryset filtering
- **Audit Trail**: `DispenseAudit` immutable log per dispense action
- **Break Glass**: Supported via `override_allowed` flag + pharmacist approval required
- **AI cannot approve**: AI provides scoring only; pharmacist makes all clinical decisions

---

## FHIR Resource Mapping

| FHIR Resource             | CyMed Model                |
|---------------------------|----------------------------|
| MedicationRequest         | Prescription, MedicationOrder |
| MedicationDispense        | DispenseOrder              |
| MedicationStatement       | MedicationHistory, MedicationChange |
| MedicationAdministration  | (via Hospital MAR)         |
| MedicationKnowledge       | FormularyDrug, InteractionRule |
| Patient                   | CyMed Core (UUID reference)|
| Practitioner              | CyIdentity (UUID reference)|

FHIR operations supported: **Create**, **Update**, **Search**, **Export**

---

## Database Tables (prefix: `cymed_rx_*`, `cymed_formulary_*`, `cymed_automation_*`, `cymed_inventory_*`, `cymed_clinical_*`, `cymed_pharmacy_*`)

All tables carry:
- `id` (UUID primary key)
- `tenant_id` (UUID, indexed)
- `created_at`, `updated_at` (auto timestamps)

---

## Deployment Profiles

| Mode            | Description                              |
|-----------------|------------------------------------------|
| Cloud           | Multi-tenant SaaS                        |
| Private Cloud   | Single-tenant, customer infrastructure   |
| Government Cloud| NDMO/NCA compliant isolation             |
| Hybrid          | On-prem pharmacy + cloud analytics       |
| Air-Gapped      | Fully disconnected, no cloud dependency  |
