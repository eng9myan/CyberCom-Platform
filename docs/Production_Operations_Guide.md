# Production Operations Guide

This guide details scaling parameters, cluster operations, and monitoring dashboards for Platform Operators.

---

## 1. Production Scaling Configurations

The platform is designed to scale horizontally in Kubernetes.

### 1.1 Database Scaling (PostgreSQL 16)
*   **Connection Pooling:** Enforce PgBouncer in front of databases. Set `CONN_MAX_AGE=60` and `CONN_HEALTH_CHECKS=True` in Django settings to reuse database connections.
*   **Partitioning:** Partitions large audit and logs tables (e.g. `platform_login_audits` and `platform_outbox_events`) by date ranges.

### 1.2 Event Streaming Scaling (Kafka)
*   **Partitions:** Configure topics with a minimum of 6 partitions to support multi-consumer processing.
*   **Compression:** Ensure compression type is set to `snappy` (configured in `publisher.py`) to reduce network throughput.
*   **Acks:** Require `acks = all` and idempotency (`enable.idempotence = True`) to guarantee zero event loss.

---

## 2. Observability Dashboards (Prometheus / Grafana)

Configure Grafana dashboards to monitor core platform key performance indicators (KPIs):

### 2.1 API Gateway Dashboard
*   **Latency p95:** Target < 150 ms.
*   **Error Rate:** Target < 0.05% for HTTP 5xx.
*   **Throughput:** Requests per second (RPS).

### 2.2 Kafka Metrics Dashboard
*   **Broker Backlog:** Monitor consumer group lags. If lag on a topic exceeds 10,000, trigger automated pod scaling.
*   **Under-Replicated Partitions:** Alert immediately if > 0 (indicates broker failure).

### 2.3 System Resource Dashboard
*   **Pod Resource Limits:** Alert if worker memory exceeds 85% or if CPU throttling is active.
