# Security Report (Phase 1 — Hospital)

Companion to `HIPAA_Readiness_Report.md` (PHI/compliance-specific findings). This report covers general application-security findings from this session's work, verified by manual review (a `/security-review` skill run was attempted but could not get a persistent working directory in this sandbox — findings below are from direct code inspection instead, informed by having built/fixed most of the surface reviewed).

## Vulnerabilities found and fixed this session

1. **Auth completely non-functional (Critical).** Three independent bugs meant no request could ever be genuinely authenticated: middleware at the wrong import path (server couldn't start), no JWT audience validation (real tokens always rejected), and DRF silently substituting `AnonymousUser` regardless of a valid token. All three fixed and verified live against a real Keycloak instance. See `Hospital_Enterprise_Report.md` for full detail.
2. **CORS misconfiguration blocked all real frontend traffic (High, availability not confidentiality).** `X-Tenant-ID` wasn't in `CORS_ALLOW_HEADERS`; every real cross-origin request failed silently. Fixed by adding exactly that one header to the existing safe list — no broadening of allowed origins.
3. **Bed-state CRUD bypass (Medium, data-integrity not confidentiality).** Raw `POST` to bed cleaning/blocking endpoints could desync `core.facilities.Bed.status` from the cleaning/blocking record. Closed by disabling the raw endpoint and routing through the service layer, which keeps both in sync atomically.

## Checks performed, no issue found

- **IDOR (Insecure Direct Object Reference) review of every new service method added this session** (`ClinicalSafetyService`, `HospitalOperationsService`, `HospitalAIAssistant`): every `.objects.get()`/`.filter()` against a tenant-scoped model includes `tenant_id=tenant_uuid` in the lookup. Grepped for any lookup missing a tenant filter — the only hit was `ModelConfig` (platform-global config, intentionally not tenant-scoped by its own model definition). No cross-tenant data-access path found in new code.
- **Secret handling.** No credentials, tokens, or passwords used during live testing (Keycloak admin password, demo user passwords, `DJANGO_SECRET_KEY` dev value) were committed to any file — all passed via shell environment variables or ephemeral curl calls only.
- **Secure cookies.** `SESSION_COOKIE_SECURE` / `CSRF_COOKIE_SECURE` correctly gate on `not DEBUG`.

## Known gaps — status update

The three application-level gaps flagged earlier this session are now closed: audit-log coverage on all 36 hospital mutating actions, `data_classification` marking on every PHI-bearing hospital model, and per-endpoint RBAC on the highest-stakes actions (admit/discharge, code status, HAI recording, VTE ordering, OR consent). See `HIPAA_Readiness_Report.md` for full detail. Remaining: RBAC on lower-risk endpoints (mechanical, scoped), `/admin/` bypass-path inconsistency (pre-existing, platform-wide, not hospital-specific), and infrastructure-level items (TLS, production Postgres TDE, formal third-party audit) that are genuine external blockers.

## Dependency/supply-chain notes

- `npm install` surfaced 20 vulnerabilities (14 moderate, 5 high, 1 critical) across the frontend/mobile workspace's transitive dependencies. Not remediated this session — `npm audit fix --force` would apply breaking version bumps across the whole monorepo without review, which is riskier to do blind than to leave flagged for a dedicated dependency-update pass.
- Found and fixed one real supply-chain-adjacent bug: `platform/mobile/package.json` depended on `@watermelondb/watermelondb`, which does not exist on npm (404) — corrected to the real package, `@nozbe/watermelondb`. Unrelated to hospital directly, but blocked installing the hospital frontend at all since npm workspaces resolve the whole dependency graph.

## Verdict

**NOT READY** for a production security posture — same two concrete, scoped gaps as the HIPAA report (audit logging, per-endpoint RBAC) are the load-bearing items. No exploitable vulnerability was found in the code written or reviewed this session; what's missing is defense-in-depth (audit trail, granular authorization) rather than an active hole.
