# Architecture Reference

**Platform:** CyberCom — Multi-Tenant Enterprise Platform
**Stack:** Django 5.x, PostgreSQL 16, Redis 7, Kafka (KRaft), Celery, Next.js 15
**Identity:** Keycloak 24 (CyIdentity control plane)
**Observability:** OpenTelemetry + Prometheus + Grafana

---

## Layer Model

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                  │
│         Product Dashboards + Patient/Provider Portals     │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS / JWT
┌─────────────────────────▼───────────────────────────────┐
│              Platform API Gateway (DRF + drf-spectacular) │
│         /api/v1/ — versioned, rate-limited, OpenAPI       │
└──────┬──────────┬──────────┬──────────┬─────────────────┘
       │          │          │          │
┌──────▼──┐ ┌────▼────┐ ┌───▼────┐ ┌──▼──────────┐
│ CyMed   │ │ CyCom   │ │ CyGov  │ │  CyCitizen  │
│Products │ │  ERP    │ │        │ │             │
└──────┬──┘ └────┬────┘ └───┬────┘ └──┬──────────┘
       └─────────┴──────────┴─────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   Platform Services                       │
│  CyIdentity │ Audit │ Tenant │ Events │ Notifications     │
│  CyAI │ CyData │ CyIntegrationHub │ Terminology │ API    │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                  Infrastructure Layer                     │
│  PostgreSQL (RLS) │ Redis │ Kafka │ Object Storage        │
│  Keycloak │ Vault │ OTel Collector │ Prometheus           │
└─────────────────────────────────────────────────────────┘
```

---

## Backend Directory Structure

```
backend/
  core/
    settings.py          Main Django settings (env-driven)
    settings_test.py     Test environment overrides
    urls.py              Root URL router
    asgi.py              ASGI entry point (Uvicorn)
    celery.py            Celery app configuration
    middleware/          Platform middleware stack

  platform/
    common/              BaseModel, PlatformModel, shared utilities
    tenant/              Multi-tenant RLS, TenantMiddleware, signals
    audit/               AuditRecord, AuditService, hash-chaining
    cyidentity/          Keycloak integration, RBAC/ABAC, Break Glass
    api/                 Exception handler, base serializers, base views
    events/              Kafka outbox, event schemas, replay service
    notifications/       Push, email, SMS, in-app notifications
    cyintegrationhub/    FHIR R4, HL7 v2, DICOM, REST connectors
    cydata/              Data pipelines, analytics models
    cyai/                Prompt registry, provider clients, guardrails
    terminology/         ICD-11, SNOMED CT, LOINC, ICF, FHIR terminology

  products/
    cymed/
      core/              Patients, Providers, Organizations, Facilities,
                         Encounters, Clinical, Documents, CarePlans,
                         Orders, Scheduling, Consents, Registries
      clinic/            Appointments, Consultations, Triage, Specialties,
                         Queues, Reception, Telemedicine, Billing bridge,
                         Insurance bridge, Referrals, Clinical forms
      hospital/          ADT, Inpatient, Emergency, ICU, OR, Maternity,
                         Nursing, Bed management, Discharge, Transfer center,
                         Anesthesia, Capacity management, Clinical command center
      laboratory/        Orders, Accessioning, Specimens, Results, Worklists,
                         Microbiology, Histopathology, Blood bank foundation,
                         Pathology, Quality, Reference lab, Analytics
      imaging/           Orders, Scheduling, DICOM registry, PACS gateway,
                         Modality worklist, Radiology reporting, Results,
                         Teleradiology, Quality, Analytics
      pharmacy/          Prescriptions, Dispensing, Drug interactions,
                         Medication reconciliation, Formulary, Clinical pharmacy,
                         Inventory bridge, Procurement bridge, Automation, Analytics
      patient_portal/    Accounts, Appointments, Medical records, Lab results,
                         Imaging results, Prescriptions, Messaging, Payments,
                         Wallet, Consents, Insurance, Telemedicine, Health journey,
                         Family accounts, Directory, Notifications
      provider_portal/   Workspace, Patient lists, Orders, Results, Clinical docs,
                         Clinical messaging, Clinical tasks, Care team, Rounding,
                         Approvals, Telemedicine, Analytics, Mobile, Workforce
      rcm/               Billing, Charge capture, Claims, Eligibility,
                         Preauthorization, Insurance, Denials, Collections,
                         Payer portal, Contracts, Pricing, Revenue analytics
      population_health/ Cohorts, Care gaps, Registries, Risk management,
                         Quality, Epidemiology, Surveillance, National programs,
                         Digital health, Public health, Reporting, Analytics
      workforce_management/
      commercial/        Licensing, Editions, Feature flags, Subscriptions,
                         Branding, Deployment profiles, Product catalog,
                         Usage metering, Customer management, Partner management

    cycom/
      finance/           gl/, ar/, ap/
      procurement/       purchase_orders/, vendors/, contracts/
      hr/                Employees, Departments, Contracts
      payroll/           PayrollRun, Payslip
      inventory/         Warehouse, StockItem, Movement
      assets/            Asset, Depreciation
      crm/               accounts/, contacts/
      bi/                Reports, Dashboard metrics
      retail/

    cycitizen/
    cygov/
    cyshop/
    demo/                Demo environment engine
    implementation/      Implementation methodology tools
    academy/             Training platform
    partner_ecosystem/   Partner management
    commercial_readiness/ Commercial tools
    website/             Public website CMS APIs (lead capture, content)

  shared/                Cross-product utilities
```

---

## Multi-Tenancy Architecture

**Strategy:** Row-Level Security (RLS) via PostgreSQL GUC `app.current_tenant_id`

**Flow:**
1. `TenantMiddleware` extracts tenant from `X-Tenant-ID` header
2. Sets PostgreSQL GUC via `SET LOCAL app.current_tenant_id = '<uuid>'`
3. All RLS policies filter automatically
4. `TenantSignal` handlers enforce tenant on model save

**Bypass paths** (no tenant required):
- `/health`, `/health/liveness`, `/health/readiness`
- `/api/schema/`, `/api/docs/`
- `/admin/`

---

## Identity Architecture (ADR-0005, ADR-0017, ADR-0035)

**Provider:** Keycloak 24

**Realm Types:**
- `workforce` — staff and clinicians
- `customer` — per-tenant end users
- `citizen` — per-jurisdiction citizens
- `partner` — B2B partner accounts
- `workload` — service-to-service M2M

**Token flow:** OAuth2.1 + OIDC → RS256 JWT → validated against JWKS URI

**MFA:** TOTP, WebAuthn/Passkey, SMS (fallback), Email (fallback), Push

**Break Glass:** time-limited emergency access, requires justification, fully audited

---

## Event Architecture

**Transport:** Kafka (KRaft mode, no ZooKeeper)

**Pattern:** Transactional Outbox — events written to DB in same transaction, Kafka relay via Celery

**Event signing:** HMAC-SHA256 per event

**Topics convention:** `cybercom.<product>.<entity>.<action>` e.g. `cybercom.cymed.patient.admitted`

---

## Audit Architecture (ADR-0028)

**Storage:** `AuditRecord` table — immutable, hash-chained

**Fields:** id, tenant_id, user_id, action, resource_type, resource_id, category, data_classification, ip_address, user_agent, outcome, previous_hash, hash

**Hash chain:** SHA-256 over (previous_hash + timestamp + payload) — tamper-evident

**Coverage:** Every business action, all clinical events, all financial transactions, all security events

---

## Clinical Data Standards

| Standard | Purpose | Implementation |
|----------|---------|----------------|
| FHIR R4 | Data exchange | CyIntegrationHub FHIR adapter |
| HL7 v2 | Legacy integration | CyIntegrationHub HL7 parser |
| DICOM | Medical imaging | CyIntegrationHub DICOM gateway |
| ICD-11 | Diagnoses | TerminologyService |
| SNOMED CT | Clinical concepts | TerminologyService |
| LOINC | Lab observations | TerminologyService |
| ICF | Functional classification | TerminologyService |
| RxNorm | Drug codes | TerminologyService |

---

## Infrastructure (Production)

| Component | Technology | Role |
|-----------|-----------|------|
| Container runtime | Docker | Local and CI |
| Orchestration | Kubernetes | Production |
| Helm charts | `infrastructure/helm/cybercom-platform/` | Deployment |
| IaC | Terraform | Cloud provisioning |
| CI | GitHub Actions `ci.yml` | PR validation |
| CD | GitHub Actions `cd.yml` | Build + publish to GHCR |
| Registry | GHCR | Container images |
| Secrets | HashiCorp Vault | Production secrets |
| Observability | Prometheus + Grafana + OTel | Metrics, traces, logs |
| Database | PostgreSQL 16 | Primary data store |
| Cache | Redis 7 | Sessions, cache, Celery broker |
| Message bus | Kafka 7.6 (KRaft) | Event streaming |
| Identity | Keycloak 24 | Authentication |

---

## Architecture Decision Records (ADRs)

Key ADRs referenced in code:
- ADR-0001: Django + PostgreSQL + Redis + Kafka + Celery stack
- ADR-0002: Multi-tenant RLS strategy
- ADR-0003: OpenAPI/Spectacular for API documentation
- ADR-0004: Kafka event bus with transactional outbox
- ADR-0005: CyIdentity (Keycloak 24) IAM strategy
- ADR-0009: OpenTelemetry observability
- ADR-0017: CyIdentity product definition
- ADR-0028: Immutable hash-chained audit trail
- ADR-0032: Bilingual Arabic/English with RTL support
- ADR-0034: Structured error handling
- ADR-0035: Keycloak 24 finalization
