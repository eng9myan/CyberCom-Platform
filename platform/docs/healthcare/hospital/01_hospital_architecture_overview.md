# CyMed Hospital Edition — Architecture Overview
**Program 3.2 | CyberCom Platform | Branch: develop**

---

## 1. Product Identity

| Attribute | Value |
|---|---|
| Product | CyMed Hospital Edition |
| Program | 3.2 |
| Edition Class | Enterprise |
| Target Segments | Private, Public, Teaching, Military, University, Ministry Hospitals |
| Target Markets | Jordan, Saudi Arabia, UAE, USA |

---

## 2. Module Architecture

CyMed Hospital Edition is implemented as 13 composable Django sub-applications registered under `products.cymed.hospital`:

```
products/cymed/hospital/
├── adt/                      # Admission, Transfer, Discharge
├── bed_management/           # Bed lifecycle management
├── emergency/                # Emergency Department
├── inpatient/                # Inpatient stay & rounding
├── nursing/                  # Nursing workflow
├── icu/                      # Intensive Care Unit
├── operating_room/           # Surgical suite management
├── anesthesia/               # Anesthesia services
├── maternity/                # Obstetrics & maternity
├── transfer_center/          # External transfer coordination
├── discharge/                # Discharge management
├── clinical_command_center/  # Real-time hospital operations dashboard
└── capacity_management/      # Surge & bed capacity planning
```

---

## 3. Dependency Graph

```
Program 2.1 CyIdentity       → Authentication & RBAC
Program 2.2 Multi-Tenant     → Tenant isolation via BaseModel
Program 2.3 Audit Framework  → All clinical audit trails
Program 2.4 API Framework    → REST API standards
Program 2.5 Event Framework  → All outbound events via OutboxEvent
Program 2.6 CyIntegrationHub → ERP, Billing, Inventory integration
Program 2.7 CyData           → Analytics readiness
Program 2.8 CyAI             → Read-only AI advisory (CyAI cannot modify records)
Program 2.10 Terminology     → All clinical code validation (SNOMED, ICD-11, LOINC)
Program 3.0 Core Clinical    → Patient, Encounter, Organization, Facility foundation
Program 3.1 Clinic Edition   → Shared clinical entities reused by Hospital Edition
```

---

## 4. API Namespace

All hospital endpoints are served under:

```
/api/v1/hospital/
```

| Module | Base URL |
|---|---|
| ADT | `/api/v1/hospital/adt/` |
| Bed Management | `/api/v1/hospital/beds/` |
| Emergency | `/api/v1/hospital/emergency/` |
| Inpatient | `/api/v1/hospital/inpatient/` |
| Nursing | `/api/v1/hospital/nursing/` |
| ICU | `/api/v1/hospital/icu/` |
| Operating Room | `/api/v1/hospital/or/` |
| Anesthesia | `/api/v1/hospital/anesthesia/` |
| Maternity | `/api/v1/hospital/maternity/` |
| Transfer Center | `/api/v1/hospital/transfer-center/` |
| Discharge | `/api/v1/hospital/discharge/` |
| Command Center | `/api/v1/hospital/command-center/` |
| Capacity | `/api/v1/hospital/capacity/` |

---

## 5. Architecture Constraints

1. **All models inherit from `BaseModel`** — guarantees `tenant_id`, `id` (UUID), `created_at`, `updated_at`.
2. **No ICD-11, SNOMED, or LOINC logic inside Hospital Edition** — all terminology is delegated to `platform.terminology.services.TerminologyService`.
3. **No direct ERP/Inventory/Billing database access** — all cross-system integration occurs via `OutboxEvent` (CyIntegrationHub pattern).
4. **CyAI is read-only** — AI advisory queries are read-only; CyAI cannot mutate any clinical record.
5. **Break Glass access** is audited via `platform.audit` and triggers events to the clinical governance queue.
6. **Multi-tenancy enforced at every endpoint** — `TenantMiddleware` extracts tenant context from the JWT and stamps all ORM operations.
