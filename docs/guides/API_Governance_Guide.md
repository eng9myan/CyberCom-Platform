# API Governance Guide

## Standards (ADR-0030)

All CyberCom APIs must conform to:

| Standard | Requirement |
|---|---|
| Spec | OpenAPI 3.1.0 (spec-first) |
| Errors | RFC 7807 `application/problem+json` |
| Pagination | Cursor-only (`limit` + `starting_after`). No offset. |
| Versioning | URL path (`/api/v1/`, `/api/v2/`) |
| Deprecation | 6-month minimum Sunrise/Sunset notice |
| Auth | OAuth 2.1 + PKCE via CyIdentity; API keys for M2M |
| Idempotency | `Idempotency-Key` header on all mutating operations |

## Versioning

```
/api/v1/{resource}/   ← stable
/api/v2/{resource}/   ← new major version during transition
```

When deprecating a version:
1. Set `lifecycle = deprecated` on `ApiVersion`
2. Inject `Deprecation: @YYYY-MM-DD` and `Sunset: @YYYY-MM-DD` headers
3. Minimum 6-month sunset window per ADR-0030 S3.4
4. Run `api_version_service.deprecate(version, sunset_days=180)`

## Lifecycle Stages

```
DRAFT → ACTIVE → DEPRECATED → RETIRED
                 ↑ requires 6-month Sunrise notice
```

## Rate Limiting

Headers returned on every API response:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 47
Retry-After: 32   (only on 429)
```

Scopes: `tenant` > `application` > `user` > `ip`. More specific limit wins.

429 response (RFC 7807):
```json
{
  "type": "https://cybercom.io/errors/rate_limit_exceeded",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded. Retry after 32s.",
  "instance": "/api/v1/fhir/R4/Patient/"
}
```

## Deprecation Headers

```http
HTTP/1.1 200 OK
Deprecation: @2026-01-01
Sunset: @2026-07-01
Link: <https://api.cybercom.cloud/api/v2/patients/>; rel="successor-version"
```

## Correlation IDs

Every request receives `X-Correlation-ID` for distributed tracing. Clients should forward this header in downstream calls.

```http
X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
```

## API Catalog Classification

| Classification | Consumers | Auth |
|---|---|---|
| `public` | Anyone | OAuth 2.1 |
| `partner` | Registered partners | OAuth 2.1 + API key |
| `internal` | CyberCom services | API key or mTLS |
| `government` | Government agencies | API key + IP allowlist |
| `fhir` | Clinical systems | SMART on FHIR |
| `private` | Internal only, not documented | mTLS only |

## Contract Testing

Register consumer contracts before releasing schema changes:

```python
ApiContractService().register(
    catalog=patient_catalog,
    version=v1,
    consumer_name="KFSH EMR",
    schema=openapi_schema_dict,
)
```

CI validates all contracts on every push: `ApiContractService().validate_all(catalog)`.
