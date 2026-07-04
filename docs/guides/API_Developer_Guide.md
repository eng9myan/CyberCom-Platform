# API Developer Guide

## Quick Start

### 1. Get an API Key

```http
POST /api/v1/api/keys/generate/
Authorization: Bearer <admin_jwt>
Content-Type: application/json

{
  "application_id": "your-app-uuid",
  "name": "Production Key",
  "scopes": ["fhir:read"],
  "expires_in_days": 365
}

Response:
{
  "key_prefix": "ck_prod_kfsh",
  "raw_key": "ck_abc123...",   ← save this, shown once
  "status": "active",
  "scopes": ["fhir:read"]
}
```

### 2. Make an Authenticated Request

```http
GET /api/v1/fhir/R4/Patient/?limit=20
Authorization: Bearer ck_abc123...
X-Correlation-ID: my-trace-id-001
X-Tenant-ID: your-tenant-uuid
```

### 3. Cursor Pagination

```python
import requests

def fetch_all_patients(base_url, api_key):
    results = []
    cursor = None
    while True:
        params = {"limit": 100}
        if cursor:
            params["starting_after"] = cursor
        r = requests.get(
            f"{base_url}/api/v1/fhir/R4/Patient/",
            params=params,
            headers={"Authorization": f"Bearer {api_key}"},
        )
        data = r.json()
        results.extend(data["data"])
        if not data["pagination"]["has_more"]:
            break
        cursor = data["pagination"]["next_cursor"]
    return results
```

### 4. Idempotent Requests

```http
POST /api/v1/fhir/R4/MedicationRequest/
Authorization: Bearer ck_abc123...
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{ "resourceType": "MedicationRequest", ... }
```

If the network fails, retry with the **same** `Idempotency-Key`. The server returns the same response without creating a duplicate.

## SDK Generation

```http
POST /api/v1/api/sdk/generate/
Authorization: Bearer <admin_jwt>
Content-Type: application/json

{
  "catalog_slug": "patient-api",
  "language": "typescript"
}
```

Returns a TypeScript or Python SDK stub. Full SDK generation via openapi-generator-cli in CI.

## Error Handling

All errors are RFC 7807 problem details:

```python
import requests

r = requests.get("/api/v1/fhir/R4/Patient/unknown-id/")
if not r.ok:
    err = r.json()
    print(err["type"])    # https://cybercom.io/errors/not_found
    print(err["status"])  # 404
    print(err["detail"])  # human-readable message
```

| HTTP Status | Meaning |
|---|---|
| 400 | Invalid request (validation error) |
| 401 | Missing or invalid authentication |
| 403 | Insufficient scope / role |
| 404 | Resource not found |
| 409 | Conflict (idempotency in-flight) |
| 422 | Unprocessable entity |
| 429 | Rate limit exceeded |
| 503 | Service unavailable |

## Webhooks

```http
POST /api/v1/api/webhooks/
Authorization: Bearer <admin_jwt>
Content-Type: application/json

{
  "application": "your-app-uuid",
  "name": "Patient Events",
  "target_url": "https://yourservice.com/webhooks",
  "events": ["patient.created", "patient.updated"]
}
```

Your endpoint receives:
```http
POST https://yourservice.com/webhooks
Content-Type: application/json
X-CyberCom-Signature: sha256=abc...
X-CyberCom-Event: patient.created

{ "event": "patient.created", "data": { ... }, "tenant_id": "..." }
```

Respond with `HTTP 200` within 10 seconds. Non-200 triggers retry (exponential backoff, up to 3 attempts).

## OpenAPI Spec

Each catalog has its OpenAPI 3.1 spec at:
```
GET /api/v1/api/openapi/{catalog_slug}/
```

Import into Postman, Insomnia, or generate an SDK:
```bash
openapi-generator-cli generate \
  -i https://api.cybercom.cloud/api/v1/api/openapi/patient-api/ \
  -g python \
  -o ./sdk/python
```
