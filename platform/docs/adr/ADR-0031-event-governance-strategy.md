# ADR-0031: Event Governance Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Domain Architect, Platform Architect, Chief Software Architect |
| **Affects** | All Microservices, Kafka Clusters, Event Consumers & Producers |
| **Tags** | governance, events, kafka, rabbitmq, schemas |
| **Related** | [ADR-0004](ADR-0004-event-driven-architecture-strategy.md), [ADR-0027](ADR-0027-master-data-management-strategy.md) |

---

## 1. Context

CyberCom relies on an Event-Driven Architecture (EDA) via Apache Kafka for master data replication, cross-domain state syncing, and telemetry ingestion. Additionally, it uses RabbitMQ for lightweight, transient worker task dispatching. Without formal event governance:
-   Event payloads change without notice, breaking consumer services in production.
-   Topic naming is arbitrary, making discovery difficult.
-   Mismatched partition counts lead to out-of-order execution.
-   Failed events are silently lost or lock up consumer thread loops indefinitely.

---

## 2. Decision Drivers

-   **Order Preservation:** Events must execute in chronological order per entity.
-   **Contract Stability:** Automated schema compatibility checks.
-   **Fault Tolerance:** Resilient consumer error handling (retry loops, dead-letter queues).
-   **Discoverability:** Standardized topic names and a central event catalog.

---

## 3. Decision

We establish an **Event Governance Strategy** outlining strict serialization, naming, registry, and retry standards:

### 3.1 Topic Naming Standards
Topics must comply with the hierarchical kebab-case structure:
`cybercom.<environment>.<domain-owner>.<entity-name>.<action>`

*Examples:*
*   `cybercom.prod.cymed.patient.registered`
*   `cybercom.prod.cycom.invoice.posted`
*   `cybercom.prod.cyidentity.keys.rotated`

### 3.2 Serialization & Schema Registry
1.  **Format:** **Apache Avro** is mandated for all Kafka events due to its compact binary footprint and schema evolution support.
2.  **Schema Registry:** An active Schema Registry (Confluent or Apicurio) must gate all event publications.
3.  **Compatibility Rule:** All schemas must be configured with **BACKWARD** compatibility rules. The Schema Registry will reject any schema updates that break existing consumers.
4.  **CI Validation:** PR builds compile Avro schema files and execute compatibility checks against the active registry.

### 3.3 Partitioning Keys
To preserve message order, events relating to an entity (e.g., patient admissions, updates, discharges) must be published using a deterministic partitioning key:
*   `partition_key = tenant_id + entity_id` (e.g., tenant UUID + Patient UUIDv7).
*   This ensures that all state changes for a patient are handled by the same consumer partition.

### 3.4 Resiliency, Retries, and Dead Letter Queues (DLQ)
When consumer services encounter processing errors:

```
 [Consumer Ingests Event]
            │
            ▼
    [Process Logic] ───(Success)───> [Commit Offset]
            │
         (Error)
            │
            ▼
    [Retry Queue (Exponential Backoff: 3 Retries)]
            │
         (Fails)
            │
            ▼
   [Dead Letter Queue (DLQ)] ───> [Raise Observability Alert]
```

1.  **Exponential Backoff:** Consumers attempt processing up to 3 times with exponential backoff (e.g., 2s, 10s, 30s) for transient failures (e.g., database lock, network timeout).
2.  **Dead Letter Queue (DLQ):** Non-transient payload errors (e.g., schema validation failures) bypass retries and publish directly to a topic suffixed with `.dlq`.
3.  **Alerting:** DLQ writes immediately raise priority metrics warnings in Grafana.

### 3.5 RabbitMQ Task Queues
*   Used strictly for transient, localized work queues (e.g., dispatching email templates, triggering PDF renders).
*   No schema registry is enforced, but payloads must use standard JSON envelopes.

---

## 4. Rationale

*   Avro schema checks ensure runtime stability by detecting contract breaks during compilation.
*   Structured retry policies prevent bad payloads from blocking healthy message processing queues (head-of-line blocking).

---

## 5. Consequences

### 5.1 Positive
*   Zero silent packet drops.
*   Enforced compatibility rules make deployments safer.
*   Clean recovery paths for failed consumer services.

### 5.2 Negative / Trade-offs
*   Slightly increased overhead in local developer environments due to running a Schema Registry container.
*   Slightly higher CPU overhead for Avro serialization compared to plain text JSON.

---

## Revision History

| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Enterprise Architect | Proposed & Approved |
