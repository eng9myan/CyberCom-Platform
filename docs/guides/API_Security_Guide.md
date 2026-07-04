# API Security Guide

## Authentication Methods

### OAuth 2.1 + PKCE (default)
All user-facing APIs require OAuth 2.1 Authorization Code + PKCE via CyIdentity (Keycloak). Tokens are short-lived JWTs (15 min access, 24h refresh).

### API Keys (M2M)
Machine-to-machine authentication uses API keys:
- Format: `ck_{32 random bytes base64url}`
- Storage: SHA-256 hash only — raw key shown once at generation
- Header: `Authorization: Bearer ck_...`
- Verification: `ApiKeyService().verify(raw_key)` — O(1) lookup by prefix

```python
# Generate
key_obj, raw_key = ApiKeyService().generate(application, "prod-key", scopes=["fhir:read"])

# Rotate (atomic: new key created, old revoked)
new_key_obj, new_raw = ApiKeyService().rotate(old_key, created_by="admin")

# Verify (middleware or permission class)
key = ApiKeyService().verify(raw_key)  # None if invalid/expired/revoked
```

## API Key Lifecycle

```
ACTIVE → REVOKED   (manual revocation)
ACTIVE → EXPIRED   (past expires_at — hourly Celery task)
```

Revoked and expired keys are retained for audit. Never hard-delete.

## Scopes

Scopes follow `resource:action` convention:
- `fhir:read`, `fhir:write`
- `audit:read`, `audit:export`
- `analytics:read`
- `tenant:admin`

Scopes are validated at subscription creation. An application can only use scopes approved in its `ApiSubscription`.

## HMAC Webhook Signing

Every webhook delivery includes:
```http
X-CyberCom-Signature: sha256=<hmac_hex>
X-CyberCom-Event: patient.created
X-CyberCom-Delivery: <uuid>
```

Signature: `HMAC-SHA256(secret, payload_json)`

Consumers must verify:
```python
import hmac, hashlib
def verify(secret: str, payload: str, signature: str) -> bool:
    expected = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
```

## Rate Limiting

Limits enforced at middleware layer before views execute:
- Per-tenant: 60 req/min default
- Per-user: 30 req/min
- Per-application: 120 req/min
- Burst: 20 req/sec

Exceeding returns 429 with `Retry-After` header.

## Idempotency

All mutating endpoints (`POST`, `PUT`, `PATCH`) should accept `Idempotency-Key`:

```http
POST /api/v1/fhir/R4/MedicationRequest/
Idempotency-Key: client-generated-uuid-v4
```

24-hour retention. Replayed requests return the cached response without re-executing. In-flight duplicates return 409 Conflict.

## TLS

All external API traffic requires TLS 1.3. HTTP redirects to HTTPS at the gateway. mTLS required for `private` classification APIs.

## IP Allowlisting

Government and high-security partner APIs enforce IP allowlists via `ApiPolicy` with `policy_type=ip_allowlist`:

```python
ApiPolicy.objects.create(
    catalog=gov_api,
    name="moh-allowlist",
    policy_type="ip_allowlist",
    config={"allowed_cidrs": ["10.0.0.0/8", "195.229.0.0/16"]},
)
```
