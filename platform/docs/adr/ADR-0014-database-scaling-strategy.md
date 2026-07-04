# ADR-0014: Database Scaling Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Principal Engineer (Data), Infrastructure Architect, Platform Architect, Chief Security Architect |
| **Affects** | Every service that persists data |
| **Tags** | data, platform, performance, scalability |
| **Related** | [database_standards](../standards/database_standards.md), [ADR-0002](ADR-0002-multi-tenancy-strategy.md), [ADR-0008](ADR-0008-saas-deployment-strategy.md), [backup_recovery_strategy](../security/backup_recovery_strategy.md) |

---

## 1. Context

PostgreSQL is CyberCom's primary store ([ADR-0001](ADR-0001-platform-technology-stack.md)). As tenant count, transaction volume, and analytics demand grow, naive single-primary deployments will not hold. We need a deliberate scaling playbook **before** any product hits the wall.

## 2. Problem Statement

How does CyberCom scale PostgreSQL (and adjacent stores) along the dimensions of read load, write load, dataset size, tenant count, and analytics demand — without compromising tenant isolation, compliance, or operational simplicity?

## 3. Decision Drivers

- Aligned with the **tiered multi-tenant** model ([ADR-0002](ADR-0002-multi-tenancy-strategy.md)).
- Predictable performance at p95/p99 under tenant skew.
- Boring before fancy: exhaust vertical and read-replica options before sharding.
- Works in cloud (RDS/Aurora, Cloud SQL, Azure DB) and on-prem (CloudNativePG / Patroni).
- Compliance: per-tenant residency, BYOK, point-in-time recovery.
- Operational simplicity for a small platform team.

## 4. Considered Options

1. **Tiered ladder: vertical → read replicas → connection pooling → partitioning → service split → shard / dedicated DB → CitusDB (per ADR)** (chosen).
2. Shard everything from day one (Citus / Vitess-style).
3. Move to a distributed SQL DB (CockroachDB / Yugabyte) as the default.
4. Per-service freedom to pick whatever store fits.

## 5. Decision

CyberCom uses a **scaling ladder**. Services climb only as data justifies, and each step is the result of measurement — not speculation.

### 5.1 The ladder

| Step | Technique | When to use |
|---|---|---|
| **1. Vertical scale + index hygiene** | Bigger instance; remove N+1; partial / BRIN / GIN indexes; vacuum/analyze tuning | Default. First lever for any hot service. |
| **2. Read replicas** | Hot standby with read traffic via app-aware router (writes → primary, reads → replica with replica-lag SLO) | Read-heavy services with tolerant replica lag (≤ 1 s for app reads, ≤ 5 s for reports). |
| **3. Connection pooling** | **PgBouncer** in transaction mode (per cluster); per-app `pool_size` budgets | Always-on as soon as concurrent connections exceed comfortable limits. Mandatory in `prod` for every service. |
| **4. Table partitioning** | Native PG declarative partitioning (range for time-series; list for tenant; hash for high-cardinality) | Tables > 100 GB or with clear hot/cold boundary (e.g. audit, events, observations). |
| **5. Service / schema split** | Move a hot bounded context to its own service + DB | Single service becomes monolithic; one workload starves others. |
| **6. Shard or move tenant to dedicated DB** | Promote tenant to **T-DB** ([ADR-0002](ADR-0002-multi-tenancy-strategy.md)); shard rule = tenant | Top-N tenants dominate load; regulatory residency / BYOK needs. |
| **7. Distributed PostgreSQL (Citus)** | Citus extension for hash sharding within a managed PG | Datasets that outgrow the largest practical single primary even after partitioning + tenant moves. **Per-service ADR required.** |
| **8. CQRS + dedicated read store** | Project writes to OpenSearch / ClickHouse / Timescale for read patterns PG can't serve | Search, analytics, time-series, very large fan-out reads. |
| **9. Move to CyData analytics plane** | Stream via CDC / outbox → CyData lakehouse for BI and ML | Anything labeled "report" / "analytics" / "ML feature". See [ADR-0015](ADR-0015-reporting-analytics-strategy.md). |

### 5.2 Defaults wired into the platform

- **Connection pooling is mandatory** in `stage`/`prod` from day one (PgBouncer sidecar or shared service).
- Every business table is **partitionable by design** — schema reviewers flag candidate tables (time-series, audit, large append-only) before they grow.
- Read replicas are provisioned by default for Tier-1 / Tier-2 services; replica-lag SLO published.
- **OLTP and analytics are separated**: no service runs analytical queries against an OLTP primary. Use replicas or CyData ([ADR-0015](ADR-0015-reporting-analytics-strategy.md)).
- Sharding is **opt-in per service via ADR** — not platform-wide.
- **Tenant promotion** between T-Shared → T-Schema → T-DB is a documented runbook with zero-downtime targets.

### 5.3 Non-PostgreSQL stores (per [`database_standards`](../standards/database_standards.md) §14)

- **Redis** — cache, ephemeral queues, rate-limit. Cluster mode in prod.
- **Kafka** — event log; tiered storage when retention demands.
- **OpenSearch / Meilisearch** — secondary search index.
- **ClickHouse / Timescale** — analytics / time-series, per ADR.
- **Object storage (S3-compatible)** — blobs, documents, exports.

Any new store class requires an ADR justifying it over PG.

### 5.4 Capacity planning

- Each Tier-1/2 service publishes a **capacity model**: peak QPS, p95/p99 query budget, replica-lag SLO, storage growth/month, partition strategy, scaling triggers (CPU, IOPS, connections, lag, table size).
- Capacity reviewed at every release train and after each promotion.
- Quarterly **scaling drill**: synthetic load that exercises the next ladder step before it's needed.

### 5.5 Operational guardrails

- Long-running statements killed after configurable budget; `pg_stat_statements` + `auto_explain` on in prod.
- DDL on large tables uses the safe-migration pattern ([`database_standards`](../standards/database_standards.md) §9) — additive → backfill → enforce, with `CONCURRENTLY` indexes.
- Vacuum / autovacuum tuned per service; bloat alarms.
- Read replicas continuously monitored for lag; alerts at tier-specific thresholds.
- Backups + PITR per [`backup_recovery_strategy`](../security/backup_recovery_strategy.md).
- Tenant-aware throttling on noisy-neighbor risk (T-Shared); per-tenant quotas + cost budgets.

## 6. Rationale

- A **ladder** keeps engineers from over-engineering early while giving a clear escalation path.
- PostgreSQL handles the vast majority of CyberCom workloads at steps 1–4 — measured by the rest of the industry. We standardize on that and reserve sharding / Citus for genuinely large outliers.
- Promoting tenants to **T-DB** uses the multi-tenant escalation path we already chose; it scales **and** improves isolation/compliance in one move.
- Separating OLTP from analytics avoids the failure mode where a single reporting query crashes a production primary.

## 7. Consequences

### 7.1 Positive
- Predictable scaling story for every service.
- No platform-wide rewrites; teams pay complexity costs only when justified.
- Cleaner compliance + residency story via tenant promotion.

### 7.2 Trade-offs
- Citus / sharded paths add real operational weight when they land.
- App-aware read/write routing requires discipline (e.g. stale-read tolerance per endpoint).

### 7.3 Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Teams skip the ladder and over-engineer (or under-engineer) | High | Medium | Mandatory capacity model + scaling-trigger thresholds; review at each release |
| 2 | Sharding adoption fragments the platform | Medium | High | Sharding requires per-service ADR; reuse a small set of patterns (Citus or tenant-keyed) |
| 3 | Replica-lag bites correctness | Medium | High | Per-endpoint stale-read policy; "read-your-writes" requires routing to primary |
| 4 | Connection-pool misconfig causes cascading timeouts | Medium | High | Centralized PgBouncer config; per-service pool budgets enforced |
| 5 | T-Shared "noisy-neighbor" hurts SLOs | Medium | High | Per-tenant quotas; query-cost guardrails; promote heavy tenants to T-DB |
| 6 | Tenant migration (T-Shared → T-DB) has downtime / data risk | Medium | High | Documented runbook with logical replication + cutover; rehearsed quarterly |
| 7 | Drift between cloud-managed PG and on-prem CloudNativePG | Medium | Medium | Conformance test matrix; version-pinned extensions |
| 8 | Analytics queries on OLTP via "just one report" | High | Medium | Standards forbid it; review enforces; CyData paved road |

### 7.4 Follow-up actions
- [ ] Author **capacity model template** in `docs/platforms/` — Principal Engineer (Data), Program 1 Sprint 2.
- [ ] Add **PgBouncer** to the platform addons + `cybercom-service` chart — DevOps, Program 1 Sprint 1.
- [ ] Author **tenant promotion runbook** in `docs/implementation/runbooks/` — Platform Eng, Program 1 Sprint 3.
- [ ] Define **replica-lag SLO defaults** per tier — Principal Engineer (Data), Program 1 Sprint 2.

## 8. Compliance & Security Impact

- **Tenant promotion to T-DB** strengthens HIPAA / GDPR isolation and supports BYOK and data residency.
- Backups, encryption, audit unchanged; per-ladder-step controls reviewed in security check.
- Read replicas obey the same encryption-at-rest and access controls as primary.

## 9. Alternatives Rejected

- **Shard everything from day one** — premature, expensive, fragments query patterns; not justified at current scale.
- **Distributed SQL as default** (CockroachDB / Yugabyte) — appealing but introduces a second SQL dialect/ops surface for the entire platform; reserve for specific need with ADR.
- **Per-service freedom of store** — fragmentation, weaker compliance, multiplied ops cost. Per [`database_standards`](../standards/database_standards.md), new store classes require ADR.

## 10. References

- [`database_standards`](../standards/database_standards.md)
- PostgreSQL declarative partitioning; PgBouncer; Citus; CloudNativePG; Patroni
- [ADR-0002 Multi-Tenancy](ADR-0002-multi-tenancy-strategy.md); [ADR-0015 Reporting & Analytics](ADR-0015-reporting-analytics-strategy.md)

---

## Revision History
| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Principal Engineer (Data) | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
