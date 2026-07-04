# Event Framework Guide (Program 2.5)

This guide documents the design, architecture, and usage of the **Transactional Outbox Event Framework** on the CyberCom Platform.

---

## 1. Outbox Pattern Architecture (ADR-0004)

All business services must record data changes AND emit domain events atomically inside a single database transaction. This guarantees eventual consistency across microservices and downstream read-models.

```
[Service Request] ──> [Begin DB Transaction]
                            │
                            ├──> Update Domain Tables (e.g. Clinical Records)
                            ├──> Insert Outbox Event row (platform_outbox_events)
                            │
                      [Commit DB Transaction]
```

A CDC pipeline (Debezium / Kafka Connect) reads the PostgreSQL Write-Ahead Log (WAL) and publishes the event to the designated Kafka topic.

---

## 2. Cryptographic Event Signing

To prevent tampering and ensure non-repudiation, all outbox events are signed prior to dispatch.

### Signature Generation
The `EventSigner` computes a secure HMAC-SHA256 signature using the system `JWT_SIGNING_KEY` and the tenant boundary identifier:
```python
from platform.events.signing import EventSigner
signature = EventSigner.sign_payload(tenant_id, json_payload_bytes)
```

### Signature Verification
Downstream consumers must verify the payload integrity at the consumer boundary. Events failing verification are rejected:
```python
is_valid = EventSigner.verify_signature(tenant_id, json_payload_bytes, signature)
```

---

## 3. Event Catalog & Topics Registry

Standard events and their associated Kafka topics are registered in `registry.py`:

| Source / Domain | Topic Name | Standard Event Types |
| :--- | :--- | :--- |
| **CyIdentity** | `platform.identity.events` | `cyidentity.user.provisioned`, `cyidentity.user.locked`, `cyidentity.secret.rotated` |
| **Tenant** | `platform.tenant.events` | `tenant.provisioned`, `tenant.suspended` |
| **Audit** | `platform.audit.events` | `audit.log.emitted` |
| **CyMed** | `product.cymed.clinical.events` | `cymed.patient.admission`, `cymed.prescription.written` |
| **CyCom** | `product.cycom.erp.events` | `cycom.transaction.approved` |
| **CyAI** | `platform.cyai.inference.events` | `cyai.prompt.evaluated` |

---

## 4. Dead Letter Queue (DLQ) & Replays

### Toxic Events (DLQ)
When an event fails validation or processing repeatedly:
1.  It is routed to the `platform_dead_letter_events` table (Dead Letter Queue).
2.  An administrator can view the log and check the error message.
3.  Clicking **Retry** will re-publish the event for processing.

### Event Replays
If a downstream consumer fails or needs to rebuild its read-model, historical events can be replayed:
```python
from platform.events.replay import EventReplayManager
EventReplayManager.replay_events(tenant_id, topic, start_time, end_time)
```
This queries the outbox history and re-publishes matching events with the header `x-replay: true`.
