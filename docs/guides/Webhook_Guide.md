# Webhook Guide

## Overview

CyberCom webhooks deliver real-time event notifications via HTTPS POST to registered endpoints. Every delivery is HMAC-SHA256 signed. Failed deliveries are retried with exponential backoff (max 3 attempts). After 3 failures, delivery enters Dead Letter status.

## Event Types

| Event | Description |
|---|---|
| `patient.created` | New patient record created |
| `patient.updated` | Patient demographics changed |
| `encounter.admitted` | Patient admitted to encounter |
| `encounter.discharged` | Patient discharged |
| `observation.created` | New clinical observation recorded |
| `medication.prescribed` | Medication order created |
| `compliance.violation` | Compliance violation detected |
| `audit.legal_hold_placed` | Legal hold placed on resources |
| `tenant.created` | New tenant provisioned |
| `api.key.rotated` | API key rotated |
| `*` | Wildcard — receive all events for this tenant |

## Registering a Webhook

```http
POST /api/v1/api/webhooks/
Authorization: Bearer <admin_jwt>
Content-Type: application/json

{
  "application": "your-app-uuid",
  "name": "Clinical Event Listener",
  "target_url": "https://yourservice.com/events",
  "events": ["patient.created", "encounter.admitted"],
  "max_retries": 3,
  "retry_delay_seconds": 60
}
```

The response includes no `secret` field — the secret was stored server-side for signing.

## Delivery Format

```http
POST https://yourservice.com/events
Content-Type: application/json
X-CyberCom-Signature: sha256=aef123...
X-CyberCom-Event: patient.created
X-CyberCom-Delivery: 550e8400-e29b-41d4-a716-446655440000
X-Correlation-ID: abcd-1234

{
  "event": "patient.created",
  "timestamp": "2026-06-22T08:34:00Z",
  "tenant_id": "your-tenant-uuid",
  "data": {
    "patient_id": "patient-abc",
    "mrn": "KF-123456"
  }
}
```

## Signature Verification

Always verify the signature before processing:

```python
import hmac, hashlib

def verify_webhook(secret: str, payload_bytes: bytes, signature_header: str) -> bool:
    if not signature_header.startswith("sha256="):
        return False
    expected = hmac.new(
        secret.encode(), payload_bytes, hashlib.sha256
    ).hexdigest()
    received = signature_header[7:]
    return hmac.compare_digest(expected, received)

# In your endpoint handler:
@app.route("/events", methods=["POST"])
def handle_event():
    if not verify_webhook(WEBHOOK_SECRET, request.data, request.headers.get("X-CyberCom-Signature", "")):
        return "Unauthorized", 401
    event = request.json
    process(event)
    return "OK", 200
```

## Retry Policy

| Attempt | Delay |
|---|---|
| 1st retry | 60s |
| 2nd retry | 120s |
| 3rd retry | 180s |
| After 3 | DEAD (no more retries) |

Your endpoint must respond with HTTP `2xx` within **10 seconds**. Slow responses count as failures.

## Webhook Lifecycle

```
ACTIVE → PAUSED     (admin pause)
ACTIVE → FAILED     (transient failure)
ACTIVE → DISABLED   (50+ dead-letter deliveries auto-disable)
PAUSED → ACTIVE     (admin resume)
```

## Celery Tasks

| Task | Schedule |
|---|---|
| `deliver_webhook_task` | Triggered per event dispatch |
| `retry_dead_webhooks_task` | Every 5 minutes |
| `disable_failed_webhooks_task` | Daily — disables webhooks with 50+ dead letters |

## Dispatching Events (Internal)

```python
from platform.api.services import WebhookService

svc = WebhookService()
deliveries = svc.dispatch(
    event_type="patient.created",
    payload={"patient_id": "abc", "mrn": "KF-123"},
    tenant_id=tenant_uuid,
)
# Returns list of ApiWebhookDelivery objects
# Celery tasks pick them up for HTTP delivery
```

## Viewing Deliveries

```http
GET /api/v1/api/webhooks/{webhook_id}/deliveries/
Authorization: Bearer <admin_jwt>
```

Returns the last 50 delivery attempts with status, response code, and error messages.
