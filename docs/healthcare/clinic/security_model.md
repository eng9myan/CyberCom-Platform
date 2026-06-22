# Clinic Security & Multi-Tenancy

## 1. Multi-Tenant Isolation
All clinic models inherit from `platform.common.models.BaseModel`, implementing PostgreSQL Row-Level Security (RLS) policies.
*   **Django Middleware**: `TenantIsolationMiddleware` intercepts requests, extracts the `X-Tenant-ID` header (or JWT claim), and applies it to the active PostgreSQL database connection session setting (`SET LOCAL app.current_tenant_id`).
*   **Query Set Security**: In the application layer, `ClinicModelViewSet` filters all queries by `tenant_id` at the queryset level to prevent cross-tenant data leaks.
*   **Automatic Ingestion**: When calling `serializer.save()`, the base viewset automatically injects `tenant_id` into the model instance, securing all newly created entities.

## 2. Access Control (RBAC & ABAC)
API endpoints enforce permission-based authentication rules.
*   Clinicians and admin staff require JWT tokens signed by `CyIdentity` containing roles (e.g., `clinic_admin`, `practitioner`, `receptionist`) and permissions.
*   Central middleware verifies token signatures using public keys stored in HashiCorp Vault.

## 3. Auditing & Observability
All write operations (POST, PUT, PATCH, DELETE) and accesses to sensitive data (e.g. telemedicine sessions, referrals) are intercepted and pushed to the centralized `Audit Framework` (`platform.audit`).
*   Logs capture IP address, tenant context, practitioner user UUID, path, method, and duration.
