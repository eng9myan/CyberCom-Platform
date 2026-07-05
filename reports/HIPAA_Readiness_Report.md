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

## Gaps found this session — status update

**Critical (both closed same session):**
- ~~No hospital action calls `AuditService.log()`~~ **CLOSED.** Found the real, correct interface is `AuditService().record(...)` — a broken pattern (`AuditService.log(...)`, calling a method that doesn't exist) was found elsewhere in the codebase (`core/clinical/services.py`), silently swallowed by a bare `except`, since its introduction. Avoided that bug. All 36 mutating methods across `hospital/services.py` now write a real audit record via a new `_write_audit()` helper, classified `phi`/`confidential`/`internal` per action.
- ~~`data_classification` never applied to any hospital model field~~ **CLOSED.** Added as a plain class attribute (no migration) to `BaseModel`, overridden to `"phi"`/`"confidential"` on every PHI-bearing model across all 13 hospital submodules.

**High:**
- ~~Most hospital ViewSets only require `IsAuthenticated`~~ **CLOSED for the highest-stakes actions.** Added `action_required_roles` to `HospitalModelViewSet`: admit/discharge (physician), code-status changes (physician), HAI infection recording (physician), VTE ordering (physician), OR schedule/complete/consent (physician). Verified live with real signed JWTs carrying different roles — a nurse-role token gets 403, a physician-role token gets 201. Remaining hospital endpoints (nursing tasks, bed management, discharge planning, ICU rounds) are still `IsAuthenticated`-only — lower marginal risk, left as scoped remaining work, not silently expanded to "done."
- **No encryption-at-rest verification.** `STANDARDS.md` specifies "PostgreSQL TDE in production" — not configured or tested in this sandbox's plain Postgres 16 container (needs real production infrastructure, genuinely out of reach here).
- **No TLS.** Everything this session ran over plain HTTP on localhost. Real TLS termination needs a real domain + certificate (DNS/SSL access) — explicit external blocker, flagged in `Subdomain_Deployment_Report.md` already.
- **Django Admin auth mismatch.** `ARCHITECTURE.md` lists `/admin/` as a tenant-bypass path, but `CyIdentityAuthMiddleware`'s bypass whitelist does not include `/admin/`. Pre-existing, platform-wide, not hospital-specific — not fixed this session.

**Medium:**
- MFA (TOTP/WebAuthn per `ARCHITECTURE.md`) not configured or tested on the test Keycloak realm this session — realm-level policy, not exercised.
- Rate limiting exists as platform infrastructure (`platform/api/rate_limit.py`) — not verified against hospital endpoints specifically.

## Recommendation (priority order, updated)

1. Extend `action_required_roles` to the remaining hospital endpoints (nursing, bed management, discharge planning, ICU) as each gets its next real-world pass.
2. Resolve the `/admin/` bypass-path inconsistency (platform-wide decision, not hospital-scoped).
3. Formal third-party HIPAA audit, TLS/production Postgres TDE — external, need real infrastructure/vendor engagement.

## Verdict

**Materially closer to READY, still NOT READY for PHI in production.** Tenant isolation, authentication, audit logging, PHI classification, and role-gating on the highest-stakes actions are now all real, verified, and closed this session. What's left is either (a) a small amount of remaining endpoint-level RBAC coverage, scoped and mechanical, or (b) genuine external blockers (TLS, production TDE, formal third-party audit) that no amount of further code work can substitute for.
