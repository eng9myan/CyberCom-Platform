# AI Knowledge Base — Architecture Rules for Claude Code

## Repository

**CyberCom-Platform** — Django backend, Next.js frontend, multi-tenant enterprise platform.

Branch: `develop` (default working branch)

---

## Mandatory Workflow

Every session:
1. Read this file.
2. Read `ARCHITECTURE.md` — understand service boundaries before touching any code.
3. Read `PRODUCTS.md` — understand which product owns which domain.
4. Inspect the specific area you are about to modify using grep or file reads.
5. Search for existing services before writing new ones.

---

## Product Ownership Map

| Domain | Owner | Never duplicate in |
|--------|-------|--------------------|
| Authentication | CyIdentity (`platform/cyidentity/`) | Any product |
| Authorization (RBAC/ABAC) | CyIdentity | Any product |
| Finance, Accounting, GL, AR, AP | CyCom (`products/cycom/finance/`) | CyMed |
| Procurement, Purchase Orders | CyCom (`products/cycom/procurement/`) | CyMed |
| Inventory (non-clinical) | CyCom (`products/cycom/inventory/`) | CyMed |
| HR, Payroll | CyCom (`products/cycom/hr/`, `products/cycom/payroll/`) | CyMed |
| CRM (business) | CyCom (`products/cycom/crm/`) | CyMed |
| Assets | CyCom (`products/cycom/assets/`) | CyMed |
| BI / Business Intelligence | CyCom (`products/cycom/bi/`) | CyMed |
| AI Prompts, Providers, Guardrails | CyAI (`platform/cyai/`) | Any product |
| FHIR, HL7, DICOM, Interop | CyIntegrationHub (`platform/cyintegrationhub/`) | Any product |
| ICD-11, SNOMED CT, LOINC, ICF | TerminologyService (`platform/terminology/`) | Any product |
| Event Bus / Kafka Outbox | Events (`platform/events/`) | Any product |
| Audit Trail | Audit (`platform/audit/`) | Any product |
| Multi-Tenant RLS | Tenant (`platform/tenant/`) | Any product |
| Analytics Pipelines | CyData (`platform/cydata/`) | Any product |
| Notifications (push/email/SMS) | Notifications (`platform/notifications/`) | Any product |
| Clinical Patients, Encounters | CyMed Core (`products/cymed/core/`) | Sub-products |
| Drug Interactions | CyMed Pharmacy (`products/cymed/pharmacy/drug_interactions/`) | Nowhere else |
| Allergy Checks | CyMed Core clinical | Nowhere else |
| Radiology / PACS | CyMed Imaging | Nowhere else |

---

## Shared Platform Services — How to Use

### CyIdentity
```python
from platform.cyidentity.services import IdentityService, BreakGlassService
from platform.cyidentity.permissions import CyberComPermission
```

### Audit
```python
from platform.audit.services import AuditService
AuditService.log(action, resource_type, resource_id, tenant_id=..., user_id=..., data=...)
```

### Events
```python
from platform.events.services import EventService
EventService.publish(event_type, payload, tenant_id=...)
```

### Terminology
```python
from platform.terminology.services import TerminologyService
TerminologyService.lookup(code_system, code)
TerminologyService.validate(code_system, code)
```

### CyAI (advisory only)
```python
from platform.cyai.services import CyAIService
result = CyAIService.execute(prompt_key, context)  # returns advisory output, human decides
```

---

## Model Conventions

Every model inherits from `BaseModel` in `platform/common/models.py`:
- `id` — UUID primary key
- `tenant_id` — UUID, indexed, never nullable
- `created_at`, `updated_at` — auto timestamps
- `created_by`, `updated_by` — user UUID references
- `is_deleted` — soft delete flag

Every queryset must filter `tenant_id=<current_tenant>`.
Use `TenantMiddleware` to get current tenant from request context.

---

## API Conventions

- Base path: `/api/v1/<product>/<resource>/`
- Authentication: Bearer JWT (validated by CyIdentity JWKS)
- Pagination: `PageNumberPagination` (25 per page default)
- Schema: OpenAPI/Swagger via `drf_spectacular`
- Errors: `cybercom_exception_handler` — structured JSON errors
- Tenant: `X-Tenant-ID` header (enforced by middleware)
- Rate limiting: configured per scope in settings

---

## Clinical Safety Rules

- CyAI is **advisory only** — all clinical decision support requires human approval.
- Drug interaction engine generates **alerts**, pharmacist makes final decision.
- Break Glass access is logged, time-limited, and requires justification.
- Allergy alerts are **never suppressible** without documented pharmacist override.
- Critical lab results trigger mandatory notification workflow.
- Radiology reports require radiologist signature before release.

---

## Commit Standards

Format: `<type>(<scope>): <description>`

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `security`

Scopes: `cymed`, `cycom`, `cyidentity`, `cyai`, `cydata`, `cyintegrationhub`, `platform`, `infra`, `frontend`, `tests`

Example: `feat(cymed): add critical lab alert notification workflow`

---

## Testing

- Unit: `pytest` with Django plugin
- Integration: requires PostgreSQL, Redis, Kafka (use `docker compose up -d`)
- Coverage target: 90%+
- Run: `python run_tests.py` from `backend/`
- Test settings: `backend/core/settings_test.py`

---

## What NOT to Do

- Do not create authentication logic in any product — use CyIdentity.
- Do not create finance/accounting in CyMed — use CyCom bridges.
- Do not create FHIR/HL7 parsers in products — use CyIntegrationHub.
- Do not create terminology lookups — use TerminologyService.
- Do not create AI providers — use CyAI.
- Do not bypass tenant filtering.
- Do not bypass audit logging.
- Do not write placeholder code — implement fully or do not implement.
