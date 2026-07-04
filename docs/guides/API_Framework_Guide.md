# API Framework Guide

## Overview

The CyberCom API Framework (`backend/platform/api/`) implements a production-grade API management layer per ADR-0003 (API Strategy) and ADR-0030 (API Governance). It provides registration, lifecycle management, key-based authentication, rate limiting, idempotency, webhook delivery, contract testing, FHIR R4/R5, SDK generation, and Prometheus metrics.

## Architecture

```
platform/api/
├── models.py          # 16 domain models
├── services.py        # Service layer (ApiKeyService, WebhookService, FHIRService, etc.)
├── views.py           # ViewSets + FHIR + SDK + Metrics endpoints
├── urls.py            # Flat DefaultRouter + FHIR paths
├── serializers.py     # DRF serializers
├── permissions.py     # Role-based permission classes
├── pagination.py      # Cursor pagination (CyberComCursorPagination)
├── rate_limit.py      # Sliding-window rate limiter
├── idempotency.py     # Idempotency key service
├── middleware.py      # CorrelationId, RateLimit, ApiUsage middleware
├── tasks.py           # Celery tasks (delivery, expiry, aggregation)
├── versioning.py      # URLPathVersioning (existing)
├── exceptions.py      # RFC 7807 exception handler (existing)
└── tests/test_api.py  # 86 tests (all passing)
```

## Domain Models

| Model | Purpose |
|---|---|
| `ApiVersion` | Semantic version lifecycle (stable → deprecated → retired) |
| `ApiCatalog` | API registry entry — one per API product |
| `ApiEndpoint` | Individual REST operation within a catalog |
| `ApiScope` | OAuth 2.1 scope bound to a catalog |
| `ApiApplication` | Registered consumer application |
| `ApiKey` | SHA-256 hashed API key; prefix stored for lookup |
| `ApiSubscription` | Application-to-catalog access grant |
| `ApiRateLimit` | Limit config per scope (tenant/user/app/global) |
| `ApiConsumer` | Resolved consumer context per request |
| `ApiUsage` | Per-request usage record for analytics |
| `ApiContract` | OpenAPI schema snapshot for contract testing |
| `ApiPolicy` | Governance policies (auth, CORS, rate limit, caching) |
| `ApiWebhook` | Webhook subscription with HMAC-SHA256 signing |
| `ApiWebhookDelivery` | Delivery attempt with retry tracking |
| `IdempotencyKey` | 24h idempotency store; safe retry semantics |

## API Endpoints

```
GET  /api/v1/api/versions/
GET  /api/v1/api/catalog/
POST /api/v1/api/catalog/{id}/publish/
GET  /api/v1/api/applications/
POST /api/v1/api/keys/generate/
POST /api/v1/api/keys/{id}/revoke/
POST /api/v1/api/keys/{id}/rotate/
POST /api/v1/api/subscriptions/subscribe/
GET  /api/v1/api/usage/summary/
POST /api/v1/api/webhooks/dispatch/
POST /api/v1/api/contracts/{id}/validate/
GET  /api/v1/api/openapi/{catalog_slug}/
POST /api/v1/api/sdk/generate/
GET  /api/v1/api/metrics/

# FHIR
GET  /api/v1/api/fhir/R4/Patient/
GET  /api/v1/api/fhir/R4/Patient/{id}/
POST /api/v1/api/fhir/R4/Encounter/
```

## Pagination (ADR-0030)

All list endpoints use cursor pagination. Offset pagination is prohibited.

```http
GET /api/v1/api/applications/?limit=20&starting_after=<cursor>

Response:
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJvZmZzZXQiOiIyMCJ9",
    "has_more": true,
    "count": 20,
    "limit": 20
  }
}
```

## Error Format (RFC 7807)

All errors return `application/problem+json`:

```json
{
  "type": "https://cybercom.io/errors/not_found",
  "title": "Not Found",
  "status": 404,
  "detail": "Application not found.",
  "instance": "/api/v1/api/applications/missing-id/"
}
```

## Running Tests

```bash
cd backend
DJANGO_SETTINGS_MODULE=core.test_settings DJANGO_SECRET_KEY=test-secret-key-for-ci \
  .venv/Scripts/python -m pytest platform/api/tests/test_api.py -v
# 86 passed
```
