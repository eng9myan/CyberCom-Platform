# Observability Reference Architecture

## 1. Unified Telemetry Collection Pipeline

CyberCom implements a standardized observability framework based on the **OpenTelemetry (OTel)** standard. This ensures that vendor-agnostic metrics, logs, and traces are collected and exported uniformly.

```mermaid
graph LR
    subgraph Pods / Nodes
        App_Pod["Application Pod<br/>(OTel SDK)"]
        Mesh_Envoy["Service Mesh<br/>(Envoy Proxy)"]
    end

    subgraph Collection Layer (DaemonSet)
        Otel_Collector["OpenTelemetry Collector<br/>(Local Agent)"]
    end

    subgraph Storage & Visualization Layer
        Prometheus[("Prometheus / Mimir<br/>(Metrics)")]
        Tempo[("Tempo / Jaeger<br/>(Traces)")]
        Loki[("Loki / Elasticsearch<br/>(Logs)")]
        Grafana["Grafana Dashboards"]
    end

    App_Pod & Mesh_Envoy -->|OTLP Protocol| Otel_Collector
    Otel_Collector -->|Export Metrics| Prometheus
    Otel_Collector -->|Export Traces| Tempo
    Otel_Collector -->|Export Logs| Loki

    Grafana -->|Query| Prometheus & Tempo & Loki
```

---

## 2. Telemetry Standards

### 2.1 Structured Logs
*   **Format:** JSON.
*   **Mandatory Fields:** `timestamp` (ISO 8601), `level` (DEBUG, INFO, WARN, ERROR, FATAL), `service.name`, `tenant.id`, `user.id`, `trace_id`, `span_id`, `message`.
*   **PII Masking:** Logs must pass through local collector regex filters to strip National ID numbers, patient names, and credit card values before shipping to central disk storage.

### 2.2 Metrics (RED and USE Patterns)
*   **Request-Scoped Services (APIs):** Measure **RED** metrics:
    *   **R**ate (Requests per second).
    *   **E**rrors (HTTP 5xx / gRPC non-zero statuses).
    *   **D**uration (Latency percentiles: p90, p95, p99).
*   **Infrastructure Services (DB, VM, Queue):** Measure **USE** metrics:
    *   **U**tilization (CPU, memory percentage).
    *   **S**aturation (Disk queue length, thread pool exhaustion).
    *   **E**rrors (Hardware faults, network timeouts).

### 2.3 Distributed Tracing
*   **Context Propagation:** W3C Trace Context standard (`traceparent` header).
*   **Cross-Process Tracing:** Trace IDs must propagate through HTTP gateways, internal gRPC calls, and Kafka event metadata headers to track a clinical or ERP action end-to-end.

---

## 3. Service Level Objectives (SLOs) and Indicators (SLIs)

| Domain | Service Level Indicator (SLI) | Service Level Objective (SLO) | Alert Trigger |
|---|---|---|---|
| **Identity (`CyIdentity`)** | Latency of OIDC passwordless token generation. | p95 < 200ms | Immediate PagerDuty if p99 > 1s for 3 consecutive minutes. |
| **Clinical (`CyMed`)** | Order entry (CPOE) submission latency. | p99 < 500ms | Alert to Clinical Director if latency > 1.5s (potential system degradation). |
| **Integration (`CyIntegrationHub`)**| HL7 ADT message parsing and Kafka dispatch. | p90 < 100ms | Alert to integration queue if Kafka outbox lag > 1000 messages. |
| **Commerce (`CyShop`)** | Checkout processing success rate. | 99.9% Successful Checkouts | Immediate alert if credit card gateway failure rate > 2%. |

---

## 4. Domain-Specific Dashboards

*   **Clinical Safety Dashboard:** Tracks ER break-glass occurrences, CPOE entry speed, HL7 transmission queues, and medical device telemetry disconnects.
*   **ERP Financial Dashboard:** Monitors ZATCA e-invoice clearance lag, B2B procurement EDI success rates, and billing reconciliation latency.
*   **Government Citizen Dashboard:** Monitors national registry SCIM sync lag, citizen portal login rates, and public notification dispatch queues.

---

## 5. Revision History

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-06-21 | 1.0 | Initial Observability Reference Architecture | Enterprise Architect |
