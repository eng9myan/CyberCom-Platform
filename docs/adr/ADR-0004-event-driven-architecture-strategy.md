# ADR-0004: Event-Driven Architecture Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Software Architect, Platform Architect, DevOps Architect |
| **Affects** | All services emitting or consuming events; integration layer |
| **Tags** | architecture, integration, events |
| **Related** | [backend_standards](../standards/backend_standards.md), [ADR-0003](ADR-0003-api-strategy.md) |

---

## 1. Context

Cross-product workflows (e.g. patient admitted → billing notified → analytics updated) need loose coupling. Synchronous REST chains create tight coupling, brittleness, and cascading failures.

## 2. Problem Statement

What is the event/messaging architecture for CyberCom, and how do services produce and consume events reliably?

## 3. Decision Drivers

- Loose coupling between products.
- Reliable delivery (at-least-once minimum).
- Replay capability for analytics and CyData.
- Operational maturity and ecosystem.
- Polyglot consumer support.

## 4. Considered Options

1. **Kafka for events + RabbitMQ for commands/RPC** (chosen).
2. Kafka only (events + commands).
3. RabbitMQ only.
4. Cloud-managed only (SNS/SQS, EventBridge, Pub/Sub).

## 5. Decision

- **Kafka** is the platform-wide **event log** (immutable, replayable, fan-out).
- **RabbitMQ** is used for **commands / task queues / RPC-like work** where ordering and replay are not first-order.
- Cloud-managed broker substitution permitted for sovereign deployments **per ADR**.
- All producers emit events via the **outbox pattern** (transactional write to DB + outbox row, then publisher pushes to Kafka).
- All consumers are **idempotent**; keyed by `event_id`.
- **Event schemas** versioned (JSON Schema or Avro), registered in a schema registry, evolved compatibly.
- **Topic naming:** `cybercom.<product>.<aggregate>.<event-past-tense>` (e.g. `cybercom.cymed.patient.admitted`).
- **Headers** required on every event: `event_id`, `event_type`, `schema_version`, `ts`, `tenant_id`, `producer`, `correlation_id`.
- **Retention**: per-topic policy; PHI/PII subject to data-class retention.
- **Dead-letter** queues required for every consumer; DLQ alarms paged.

## 6. Rationale

- Kafka excels at event log + replay; CyData and audit benefit directly.
- RabbitMQ is operationally simpler for task queues; Celery integrates natively.
- Outbox avoids dual-write inconsistency.

## 7. Consequences

### 7.1 Positive
- Decoupled products; replay enables analytics and recovery.
- Clear separation: events vs commands.

### 7.2 Trade-offs
- Two brokers to operate (Kafka, RabbitMQ).

### 7.3 Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Schema drift breaks consumers | Medium | High | Schema registry + compatibility checks in CI |
| 2 | PHI/PII in event payloads | Medium | Critical | Mandatory data-class tags + redaction lint; topic-level access control |
| 3 | Operational burden of dual brokers | Medium | Medium | Shared SRE tooling; managed options in cloud |

## 8. Compliance & Security Impact

- Events are auditable artifacts; producer/consumer authN via mTLS or SASL/OIDC.
- PHI/PII fields require encryption at producer (field-level) or absence from the payload.

## 9. Alternatives Rejected

- **Kafka only** — works, but task-queue ergonomics are worse than RabbitMQ + Celery for backend devs.
- **RabbitMQ only** — lacks the replay/log semantics needed by CyData and audit pipelines.
- **Cloud-managed only** — locks out sovereign/on-prem deployments.

## 10. References

- [`backend_standards`](../standards/backend_standards.md) §7
- Outbox / transactional messaging patterns

---

## Revision History
| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Platform Architect | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
