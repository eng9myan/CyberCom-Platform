# API Standards

> **Status:** Approved — Program 0, Phase 0.3
> **Owner:** Chief Software Architect

Default API style for CyberCom is **REST + OpenAPI 3.1**. gRPC and GraphQL are permitted per ADR (e.g. service-mesh internal, BFF aggregation).

---

## 1. Principles

1. **Spec-first.** Write OpenAPI before code; generate server stubs and client SDKs.
2. **Resource-oriented.** URLs name nouns; HTTP methods name verbs.
3. **Backwards compatibility is the default;** breaking changes get a new major version.
4. **Predictable.** Same patterns for pagination, filtering, errors, IDs across all products.
5. **Secure by design.** AuthN required by default; explicit opt-in for public endpoints.

---

## 2. URL Conventions

- Base path: `/api/v<major>/...` (e.g. `/api/v1/patients`).
- Lowercase, **kebab-case**, plural resource names: `/api/v1/lab-orders`.
- Sub-resources nested ≤ 2 levels: `/api/v1/patients/{id}/encounters`.
- Identifiers: UUIDs in path; never expose internal sequences.
- Query strings: snake_case keys (`?created_after=…&page_size=…`).
- No trailing slash.
- Actions that don't fit CRUD use a sub-path verb: `POST /patients/{id}:discharge` (or `/patients/{id}/actions/discharge`).

---

## 3. HTTP Methods

| Method | Use | Idempotent | Safe |
|---|---|---|---|
| `GET` | Read | ✅ | ✅ |
| `POST` | Create / non-idempotent action | ❌ (use `Idempotency-Key`) | ❌ |
| `PUT` | Full replace | ✅ | ❌ |
| `PATCH` | Partial update (JSON Merge Patch or JSON Patch) | ✅ | ❌ |
| `DELETE` | Soft delete | ✅ | ❌ |

---

## 4. Status Codes

| Code | Meaning | Notes |
|---|---|---|
| `200` | OK | GET / PUT / PATCH success with body |
| `201` | Created | POST success; `Location` header required |
| `202` | Accepted | Async work queued |
| `204` | No Content | DELETE success or empty PUT/PATCH |
| `400` | Bad Request | Validation failure |
| `401` | Unauthorized | Missing/invalid credentials |
| `403` | Forbidden | Authenticated but not authorized |
| `404` | Not Found | Resource missing (also for tenant-mismatch) |
| `409` | Conflict | Optimistic-concurrency / duplicate |
| `410` | Gone | Versioned endpoint retired |
| `412` | Precondition Failed | `If-Match` failure |
| `415` | Unsupported Media Type | |
| `422` | Unprocessable Entity | Semantic validation failure |
| `425` | Too Early | Replay protection |
| `429` | Too Many Requests | Rate-limited; `Retry-After` required |
| `500` | Server Error | Unhandled; correlation id required |
| `503` | Unavailable | Maintenance / overload |
| `504` | Gateway Timeout | Upstream timeout |

`5xx` responses always include `Retry-After` when retry is appropriate.

---

## 5. Versioning

- **URL-based major versioning:** `/api/v1`, `/api/v2`.
- Backward-compatible changes (adding optional fields, new endpoints, new enum values) ship without a major bump.
- Breaking changes (removing/renaming fields, changing types, tightening validation) require a new major version.
- Deprecated endpoints return `Deprecation` and `Sunset` headers; minimum 6-month deprecation window.
- Two major versions supported simultaneously; older versions return `410 Gone` after sunset.
- Per-field deprecation marked in OpenAPI via `deprecated: true` and documented.

---

## 6. Pagination

CyberCom uses **cursor pagination** by default; offset pagination only for small admin views.

### 6.1 Request
```
GET /api/v1/patients?page_size=50&cursor=eyJpZCI6...
```

| Param | Default | Max |
|---|---|---|
| `page_size` | 25 | 100 |
| `cursor` | — | opaque, server-generated |
| `sort` | resource-default | whitelisted fields only |

### 6.2 Response

```json
{
  "data": [ { … }, { … } ],
  "pagination": {
    "page_size": 50,
    "next_cursor": "eyJpZCI6...",
    "prev_cursor": null,
    "has_more": true
  }
}
```

- `next_cursor` `null` ⇔ end of stream.
- Cursors are opaque; clients MUST NOT parse them.
- Total counts are **not** returned by default (expensive); a separate `?include=count` opt-in is permitted for small datasets.

---

## 7. Filtering, Sorting, Sparse Fields

- **Filtering:** explicit query params (`?status=active&created_after=2025-01-01`). No ad-hoc string DSL.
- **Sorting:** `?sort=-created_at,name` (`-` = desc). Whitelisted fields only.
- **Sparse fields:** `?fields=id,name,status`.
- **Expansion:** `?expand=encounters` (≤ 1 level; deeper expansion via dedicated endpoints).

---

## 8. Standard Error Envelope

Every `4xx`/`5xx` response uses the same shape:

```json
{
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Patient does not exist.",
    "correlation_id": "01J7Z2YZ4D6KQ7Q8H1J6Y8KQX0",
    "details": [
      { "field": "patient_id", "issue": "not_found" }
    ],
    "documentation_url": "https://docs.cybercom/errors/PATIENT_NOT_FOUND"
  }
}
```

- `code` — stable, machine-readable, `UPPER_SNAKE_CASE`. Catalogued in `docs/standards/error-codes.md` (to be authored).
- `message` — human-readable, **never PII/PHI**, never localized in the API (localization is client-side).
- `correlation_id` — required; echoed in `X-Correlation-Id` header.
- `details` — optional, structured per-field validation errors.

---

## 9. Required Headers

### Request
- `Authorization: Bearer <jwt>` (when authenticated).
- `X-Correlation-Id` (optional; server generates if missing).
- `X-Tenant-Id` (when not derivable from JWT).
- `Idempotency-Key` (required for non-idempotent POSTs that may retry).
- `If-Match` / `If-None-Match` for optimistic concurrency.
- `Accept-Language` for client locale (affects errors only when applicable).

### Response
- `X-Correlation-Id`.
- `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- `ETag` on cacheable resources.
- `Deprecation`, `Sunset` for deprecated endpoints.
- Security headers: `Cache-Control`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Content-Security-Policy` (where applicable).

---

## 10. Authentication & Authorization

- **AuthN:** OAuth 2.1 / OIDC via CyIdentity; JWT bearer tokens; short TTL (≤ 15 min) + refresh.
- **AuthZ:** policy-based (OPA/Cedar). API handlers call the policy engine; no inline role checks.
- Service-to-service: mTLS preferred; otherwise signed JWT with `aud` scoped to the target service.
- Multi-tenant: tenant scope derived from JWT or `X-Tenant-Id`; enforced at DB layer (RLS).
- Public endpoints: explicitly marked `security: []` in OpenAPI; reviewed by Security Architect.

---

## 11. Rate Limiting & Quotas

- Default: 60 RPM per user per endpoint group; per-tenant aggregate limits configurable.
- `429` includes `Retry-After`.
- Burst tokens via leaky-bucket; configured per tier.
- DoS protection at the edge (WAF/CDN); application limits are second line.

---

## 12. Idempotency

- All non-idempotent POSTs accept `Idempotency-Key`.
- Server stores the (key, tenant, route) → response for 24 h.
- Replaying the same key returns the original response; same key with different body returns `409`.

---

## 13. Webhooks

- Outbound webhooks signed with HMAC-SHA256 (`X-CyberCom-Signature`).
- Include `X-CyberCom-Event`, `X-CyberCom-Delivery-Id`, `X-CyberCom-Timestamp`.
- At-least-once delivery; consumers must be idempotent.
- Retries with exponential backoff; dead-letter after configurable max attempts.

---

## 14. OpenAPI 3.1 — Spec Requirements

Every API ships with a spec that includes:

- `info.version` matching the deployed version.
- `servers` for each environment.
- `securitySchemes` (bearer JWT, mTLS).
- `components.schemas` reused via `$ref`; no inline duplication.
- `examples` for every request and response.
- `x-perf-tier` extension declaring perf tier ([`coding_standards.md`](coding_standards.md) §8).
- `x-error-codes` extension enumerating possible error codes per operation.
- Validated in CI by `spectral`; breaking-change detection via `oasdiff`.

---

## 15. SDK Generation

- TypeScript SDKs generated via `openapi-typescript` + `orval` (or similar).
- Python SDKs generated via `openapi-python-client`.
- Generated code committed under `<service>/clients/` or published to internal registry.

---

## 16. Forbidden

- Verbs in URLs (except action sub-paths).
- Returning `200` for errors.
- Inventing per-endpoint error shapes.
- Exposing internal numeric IDs.
- Synchronous endpoints that take > 5 s — return `202` and a status URL.
- Breaking changes inside a major version.
