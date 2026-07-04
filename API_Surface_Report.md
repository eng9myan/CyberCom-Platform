# API Surface Report — Release 1.5

**Date:** 2026-06-28
**Platform:** CyberCom Platform
**Release:** 1.5

---

## API Overview

All platform APIs are versioned under /api/v1/. Authentication via OAuth2.1 JWT (Bearer token) except /api/v1/public/ which are unauthenticated rate-limited endpoints.

---

## Platform APIs

| Prefix | App | Purpose |
|--------|-----|---------|
| /api/v1/tenants/ | platform.tenant | Tenant provisioning, configuration, billing |
| /api/v1/identity/ | platform.cyidentity | Authentication, RBAC, passkeys, MFA, break-glass |
| /api/v1/events/ | platform.events | Event bus, replay, registry |
| /api/v1/integration/ | platform.cyintegrationhub | FHIR, HL7, DICOM, REST, LDAP bridges |
| /api/v1/data/ | platform.cydata | Data pipelines, analytics |
| /api/v1/ai/ | platform.cyai | AI inference, prompt registry, guardrails |
| /api/v1/common/ | platform.common | Vault, OPA, shared utilities |
| /api/v1/terminology/ | platform.terminology | ICD-11, SNOMED, LOINC, ICF lookups |
| /api/v1/notifications/ | platform.notifications | Push, email, SMS, in-app notifications |
| /api/v1/audit/ | platform.audit | Audit trail queries |

---

## CyMed Healthcare APIs

| Prefix | Module | Purpose |
|--------|--------|---------|
| /api/v1/patients/ | cymed.core.patients | Patient demographics, search |
| /api/v1/providers/ | cymed.core.providers | Provider profiles, credentials |
| /api/v1/organizations/ | cymed.core.organizations | Organizations, facilities |
| /api/v1/facilities/ | cymed.core.facilities | Facility management |
| /api/v1/encounters/ | cymed.core.encounters | Clinical encounter lifecycle |
| /api/v1/clinical/ | cymed.core.clinical | Clinical observations, assessments |
| /api/v1/documents/ | cymed.core.documents | Clinical documents, notes |
| /api/v1/careplans/ | cymed.core.careplans | Care plan management |
| /api/v1/orders/ | cymed.core.orders | Clinical orders |
| /api/v1/scheduling/ | cymed.core.scheduling | Appointment scheduling |
| /api/v1/consents/ | cymed.core.consents | Patient consents |
| /api/v1/registries/ | cymed.core.registries | Disease registries |
| /api/v1/commercial/ | cymed.commercial | Licensing, feature flags, branding |
| /api/v1/clinic/ | cymed.clinic | Clinic edition workflows |
| /api/v1/hospital/ | cymed.hospital | Hospital edition workflows |
| /api/v1/lab/ | cymed.laboratory | Laboratory workflows |
| /api/v1/imaging/ | cymed.imaging | Radiology and imaging workflows |
| /api/v1/pharmacy/ | cymed.pharmacy | Pharmacy workflows |
| /api/v1/patient-portal/ | cymed.patient_portal | Patient self-service portal |
| /api/v1/provider-portal/ | cymed.provider_portal | Provider workspace portal |
| /api/v1/rcm/ | cymed.rcm | Revenue cycle management |
| /api/v1/population-health/ | cymed.population_health | Population health analytics |
| /api/v1/workforce/ | cymed.workforce_management | Healthcare workforce management |

---

## CyCom ERP APIs

| Prefix | Module | Purpose |
|--------|--------|---------|
| /api/v1/erp/ | cycom | ERP module router |
| /api/v1/erp/finance/gl/ | cycom.finance.gl | General ledger, journal entries |
| /api/v1/erp/finance/ar/ | cycom.finance.ar | Accounts receivable, invoices |
| /api/v1/erp/finance/ap/ | cycom.finance.ap | Accounts payable, bills |
| /api/v1/erp/inventory/ | cycom.inventory | Inventory, warehouses, stock |
| /api/v1/erp/procurement/vendors/ | cycom.procurement.vendors | Vendor management |
| /api/v1/erp/procurement/purchase-orders/ | cycom.procurement.purchase_orders | Purchase orders |
| /api/v1/erp/hr/ | cycom.hr | Human resources, employees |
| /api/v1/erp/payroll/ | cycom.payroll | Payroll processing |
| /api/v1/erp/assets/ | cycom.assets | Fixed asset management |
| /api/v1/erp/crm/accounts/ | cycom.crm.accounts | CRM accounts and contacts |
| /api/v1/erp/bi/ | cycom.bi | Business intelligence reports |

---

## Platform Product APIs

| Prefix | Module | Purpose |
|--------|--------|---------|
| /api/v1/demo/ | products.demo | Demo/sandbox environment |
| /api/v1/deployment/ | products.deployment | Deployment management |
| /api/v1/implementation/ | products.implementation | Implementation methodology |
| /api/v1/academy/ | products.academy | Training and certification |
| /api/v1/commercial-readiness/ | products.commercial_readiness | Go-to-market readiness |
| /api/v1/partners/ | products.partner_ecosystem | Partner ecosystem management |

---

## Website Public APIs (Unauthenticated)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/v1/public/health/ | GET | API health status |
| /api/v1/public/products/ | GET | Published product listings |
| /api/v1/public/products/{slug}/ | GET | Product detail |
| /api/v1/public/products/featured/ | GET | Featured products |
| /api/v1/public/industries/ | GET | Industry verticals |
| /api/v1/public/industries/{slug}/ | GET | Industry detail |
| /api/v1/public/case-studies/ | GET | Case studies |
| /api/v1/public/case-studies/{slug}/ | GET | Case study detail |
| /api/v1/public/demo-request/ | POST | Submit demo request (rate limited: 5/hour) |
| /api/v1/public/demo-request/{ref}/status/ | GET | Check demo request status |
| /api/v1/public/contact/ | POST | Submit contact message (rate limited: 10/hour) |
| /api/v1/public/contact/{ticket}/status/ | GET | Check contact ticket status |
| /api/v1/public/contact/newsletter/ | POST | Newsletter subscription (rate limited: 5/hour) |
| /api/v1/public/partners/ | GET | Published partner listings |
| /api/v1/public/partners/{slug}/ | GET | Partner detail |
| /api/v1/public/partners/apply/ | POST | Partner application (rate limited: 3/hour) |
| /api/v1/public/documentation/ | GET | Documentation sections |
| /api/v1/public/documentation/{slug}/ | GET | Documentation section detail |
| /api/v1/public/documentation/search/ | GET | Full-text documentation search |

---

## API Standards Compliance

| Standard | Implementation |
|----------|----------------|
| REST | DRF ModelViewSet / APIView |
| OpenAPI 3.0 | drf-spectacular |
| Versioning | URL prefix /api/v1/ |
| Authentication | JWT Bearer (RS256) via CyIdentity |
| Authorization | CyIdentityPermission + PermissionRequired |
| Rate Limiting | AnonRateThrottle (public), scope-based |
| Pagination | PageNumberPagination, page_size=25 |
| Error Format | cybercom_exception_handler standardized |
| Health | /health, /health/liveness, /health/readiness |
| Documentation | /api/docs/ (Swagger), /api/redoc/ |

---

## API Test Coverage

| Area | Endpoint Count | Test Coverage |
|------|----------------|---------------|
| Platform | 50+ | High |
| CyMed Clinical | 40+ | High |
| CyMed Hospital | 30+ | High |
| CyMed RCM | 40+ | High |
| CyMed Pharmacy | 25+ | High |
| CyCom ERP | 30+ | High |
| Website Public | 19 endpoints | 39 tests |

---

*Generated by CyberCom Principal Software Engineer
CyberCom Platform Engineering - Release 1.5*
