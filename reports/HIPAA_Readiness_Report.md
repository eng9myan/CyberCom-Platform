# HIPAA Readiness Report (Phase 1 — Hospital)

**Scope:** This report covers what was actually verified this session against a live stack (Postgres + Keycloak + Redis + real Django backend + real Next.js frontend), plus code inspection of the security-relevant paths touched or reviewed during Hospital Phase 1. It is not a substitute for a formal third-party HIPAA compliance audit — that requires a licensed auditor and is explicitly out of scope for this session (external blocker, not attempted).

## What's real and verified

| Control | Status | Evidence |
|---|---|---|
| **Tenant isolation** | **Verified working** | `TenantIsolationMiddleware` sets PostgreSQL `app.current_tenant_id` per-request from `X-Tenant-ID` header or JWT `tenant_id` claim; every hospital queryset filters by `tenant_id` via `HospitalModelViewSet.get_queryset()`. Confirmed live: real API calls only ever returned data for the authenticated tenant. |
| **Authentication (JWT/OIDC)** | **Fixed and verified working this session** | Was completely non-functional before this pass (see `Hospital_Enterprise_Report.md` — wrong file path, no audience validation, DRF ignoring `request.user` entirely). Now verified live: real Keycloak login → PKCE → real signed RS256 JWT → validated audience+issuer+signature → real DRF-authenticated request → 200 with real data. |
| **RBAC (role claims)** | **Partially verified** | `platform/api/permissions.py` reads `realm_access.roles` from the verified JWT claims (`IsApiAdmin`, `IsApiOwner`, etc.) — the plumbing is real and correctly reads from claims the middleware already verified. Not verified this session: whether hospital's own endpoints actually apply role-based restrictions beyond `IsAuthenticated` (most hospital ViewSets only require authentication, not a specific role — see gap below). |
| **Secure cookies** | **Correct as configured** | `SESSION_COOKIE_SECURE` / `CSRF_COOKIE_SECURE` are `not DEBUG` — correctly forces secure cookies outside dev mode. Not independently verified in a real HTTPS deployment (no TLS cert available in this sandbox). |
| **CORS** | **Fixed, scoped correctly** | Fixed a bug where the required `X-Tenant-ID` header wasn't in `CORS_ALLOW_HEADERS` (blocked every real frontend request). Fix only adds that one header — `CORS_ALLOWED_ORIGINS` stays env-restricted, `CORS_ALLOW_ALL_ORIGINS` stays gated to `DEBUG` only. |
| **Break Glass** | **Exists, not exercised this session** | `TestBreakGlassSecurity` in `core/tests/test_clinical_core.py` exists and (per its own test) covers emergency access grant. Not re-verified live this pass — out of Hospital-specific scope. |
| **Terminology (ICD-11/SNOMED/LOINC)** | **Real, verified in earlier pass** | See `Hospital_Enterprise_Report.md` — genuine WHO ICD-11 API integration with audit logging, not a stub. |

## Gaps found this session (not fixed — flagged, not hidden)

**Critical:**
- **No hospital action calls `AuditService.log()`.** `platform/audit` implements a real immutable, hash-chained `AuditRecord` model exactly as `ARCHITECTURE.md` describes ("Coverage: Every business action, all clinical events... "). Grepped `hospital/services.py`: **zero** references to `AuditService` anywhere — not in admit/discharge/transfer, not in code-status changes (a resuscitation-directive change is about as audit-critical as clinical data gets), not in HAI infection recording, not in ICU critical events. Every action does emit an `OutboxEvent` (a different mechanism — async integration bus, not a tamper-evident compliance log) but that is not the same control. **This needs to be closed before any real PHI touches this system.**
- **`data_classification` is never applied to any hospital model field.** `STANDARDS.md` mandates: *"PHI/PII fields must be marked with `data_classification = DataClassification.RESTRICTED`."* `DataClassification` is defined once, in `platform/audit/models.py`, and referenced nowhere else in the codebase. Every hospital model holding PHI (Patient, Admission, ICUStay, CodeStatusOrder, DischargeSummary, etc.) currently carries no machine-readable PHI marking at all.

**High:**
- **Most hospital ViewSets only require `IsAuthenticated`, not a specific clinical role.** A logged-in user with any valid token — regardless of role (nurse, admin, billing clerk) — can currently call any hospital endpoint for their tenant. Real RBAC (e.g., only physicians can order code-status changes, only pharmacists can dispense) is not enforced at the API layer for the endpoints built this session. The plumbing to do this (`platform/api/permissions.py` role-reading pattern) already exists and works — it's just not applied per-endpoint in hospital yet.
- **No encryption-at-rest verification.** `STANDARDS.md` specifies "PostgreSQL TDE in production" — not configured or tested in this sandbox's plain Postgres 16 container (expected: this needs real production infrastructure, genuinely out of reach here).
- **No TLS.** Everything this session ran over plain HTTP on localhost. Real TLS termination needs a real domain + certificate (DNS/SSL access) — explicit external blocker, flagged in `Subdomain_Deployment_Report.md` already.
- **Django Admin auth mismatch.** `ARCHITECTURE.md` lists `/admin/` as a tenant-bypass path, but `CyIdentityAuthMiddleware`'s bypass whitelist does not include `/admin/` — meaning Django's own cookie-session-based admin login would require a Bearer JWT to even load, which the admin login page doesn't send. This is a pre-existing inconsistency (not introduced this session), not fixed here — flagged for a future pass since it's a platform-wide concern, not hospital-specific.

**Medium:**
- MFA (TOTP/WebAuthn per `ARCHITECTURE.md`) not configured or tested on the test Keycloak realm this session — realm-level policy, not exercised.
- Rate limiting exists as platform infrastructure (`platform/api/rate_limit.py`) — not verified against hospital endpoints specifically this session.

## Recommendation (priority order)

1. Wire `AuditService.log()` into every hospital service method that touches PHI or makes a clinical/administrative decision — start with `ClinicalSafetyService` (code status, HAI, VTE) and `AdmissionService`, since those are the highest-stakes actions.
2. Apply `data_classification = DataClassification.RESTRICTED` to every PHI-bearing model field per `STANDARDS.md`'s own rule.
3. Add role-based `permission_classes` to hospital ViewSets beyond bare `IsAuthenticated` — at minimum gate code-status changes and discharge to physician/appropriate roles.
4. Resolve the `/admin/` bypass-path inconsistency (platform-wide decision, not hospital-scoped).
5. Formal third-party HIPAA audit, TLS/production Postgres TDE — external, need real infrastructure/vendor engagement.

## Verdict

**NOT READY** for PHI in production. Tenant isolation and authentication — the two most fundamental controls — are now real and verified working (a first for this codebase). Audit logging coverage and per-endpoint RBAC are the two concrete gaps standing between "works" and "compliant," both scoped and neither requiring external resources to close.
