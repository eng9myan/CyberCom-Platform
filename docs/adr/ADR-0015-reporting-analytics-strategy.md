# ADR-0015: Reporting & Analytics Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Principal Engineer (Data), Chief Software Architect, Compliance Architect, Platform Architect |
| **Affects** | CyData; every product that produces reports, dashboards, or ML features |
| **Tags** | data, analytics, ml, compliance |
| **Related** | [ADR-0004](ADR-0004-event-driven-architecture-strategy.md), [ADR-0014](ADR-0014-database-scaling-strategy.md), [ADR-0016](ADR-0016-ai-platform-strategy.md), [database_standards](../standards/database_standards.md), [audit_logging_strategy](../security/audit_logging_strategy.md) |

---

## 1. Context

Reports, dashboards, ad-hoc analytics, and ML training all need data — but running them on the OLTP primaries corrupts SLOs, leaks PHI/PII into uncontrolled surfaces, and fragments the data model. CyData is the platform's data plane; this ADR defines how reporting and analytics flow into and out of it.

## 2. Problem Statement

How does CyberCom serve operational reporting, BI/analytics, and ML feature production without coupling them to OLTP systems and without compromising compliance?

## 3. Decision Drivers

- Separate OLTP from analytical workloads ([ADR-0014](ADR-0014-database-scaling-strategy.md) §5.2).
- Tenant-aware analytics with strong isolation and access control.
- HIPAA / GDPR: minimum-necessary, de-identification, residency, retention.
- Realistic operational analytics latency (≤ minutes for most reports; seconds for "operational" dashboards in product).
- Reusable across products (CyMed, ERP, CyCom, CyShop, CyGov).
- Cost control — analytics will be the most expensive data tier if left unchecked.

## 4. Considered Options

1. **Three-tier model: operational reads → CyData lakehouse → curated marts; CDC + outbox + Kafka into Bronze/Silver/Gold, with FHIR-aware semantic layer for healthcare** (chosen).
2. Run analytics directly on OLTP read replicas indefinitely.
3. Push every product into building its own analytics stack.
4. Move all reporting into a single BI vendor's warehouse.

## 5. Decision

### 5.1 Three tiers

| Tier | Purpose | Where it lives | Latency |
|---|---|---|---|
| **T-Operational** | In-product reports / dashboards (e.g. "today's admissions"); operational searches | Service's own DB (read replica) **or** dedicated read store (OpenSearch / Timescale) — per [ADR-0014](ADR-0014-database-scaling-strategy.md) step 8 | Seconds |
| **T-Analytical (BI)** | Cross-product reporting, KPI dashboards, finance, regulatory submissions | **CyData lakehouse** | Minutes |
| **T-Science (ML)** | Feature engineering, model training, evaluation | CyData lakehouse + Feature Store ([ADR-0016](ADR-0016-ai-platform-strategy.md)) | Minutes–hours |

**Rule:** operational dashboards inside a product use **T-Operational**. Anything cross-product, multi-tenant aggregate, finance, regulatory, ML, or executive — uses **T-Analytical** / **T-Science**.

### 5.2 Ingestion

- **Source of record:** product OLTP DBs and event streams.
- **Path 1 — Events (preferred):** product emits domain events via outbox → Kafka ([ADR-0004](ADR-0004-event-driven-architecture-strategy.md)); CyData subscribes.
- **Path 2 — Change Data Capture:** Debezium-style CDC from PG WAL → Kafka for entities not yet event-modelled; documented as a temporary path with migration target.
- **Path 3 — Batch (last resort):** scheduled export from a read replica; only for legacy systems we don't own.
- **No direct OLTP queries from analytics tools.**

### 5.3 Lakehouse layout (medallion)

| Layer | Content | Format |
|---|---|---|
| **Bronze (raw)** | Append-only, source-fidelity events / CDC | Parquet / Iceberg on object storage |
| **Silver (cleansed)** | Deduplicated, conformed, typed, validated | Iceberg (Delta if vendor mandates) |
| **Gold (modelled)** | Dimensional / wide marts; semantic concepts | Iceberg + warehouse views |
| **Marts (consumer)** | Use-case-specific views (Finance, Clinical Ops, Public Health, RCM, …) | Warehouse views / materialized views |

- **Open table format:** **Apache Iceberg** preferred for portability; Delta acceptable when a managed vendor mandates it.
- **Storage:** S3-compatible object storage (per-region, per-residency).
- **Compute:** **Trino / Spark / DuckDB** for transforms; warehouse engine (Snowflake / BigQuery / Redshift / on-prem alternative) for serving — chosen per deployment via deployment-mode addendum.
- **Transformations:** **dbt** is the standard transformation framework; tests + docs co-located with models.
- **Orchestration:** **Airflow** (or Dagster, per follow-up sub-ADR) for pipelines; idempotent, re-runnable, lineage-emitting.
- **Catalog & lineage:** **OpenLineage** + a metadata catalog (DataHub / OpenMetadata / vendor) — single source of truth for datasets, owners, classification, lineage.

### 5.4 Semantic & healthcare layer

- A **shared semantic layer** in the Gold layer defines canonical entities (Patient, Encounter, Order, Claim, Posting, Citizen, …) — names, units, codes ([ADR-0006 ICD-11](ADR-0006-icd-11-strategy.md)).
- For healthcare, a **FHIR-aware** projection layer makes FHIR resources first-class in analytics (R4 schemas → conformed Gold tables). Powers public-health, CDS analytics, and CyData APIs.

### 5.5 Tenant model & access

- **Tenant column on every row** in Silver/Gold (`tenant_id`); enforced by row-/column-level security in the warehouse and by Iceberg view filters.
- **Per-tenant marts** for regulated tenants (T-DB / T-Cluster from [ADR-0002](ADR-0002-multi-tenancy-strategy.md)).
- Access via CyIdentity SSO; AuthZ via policy engine (per [ADR-0005](ADR-0005-identity-access-management-strategy.md)) at the BI tool, warehouse, and dataset level.
- All access **audited** per [`audit_logging_strategy`](../security/audit_logging_strategy.md) — analytics reads of PHI are first-class audit events.

### 5.6 Privacy & compliance

- **Data classification carried through** from source ([`database_standards`](../standards/database_standards.md) §13). Bronze inherits classification; Silver/Gold re-classify (often lower) after de-identification.
- **De-identification pipelines:** HIPAA Safe Harbor / Expert Determination methods for PHI; pseudonymization with key separation for PII; configurable per dataset.
- **Right-to-erasure:** propagated to analytics — `erasure_subject_id` propagated from a control-plane signal triggers downstream re-materialization or tombstoning; audit-immutable evidence kept.
- **Retention:** Bronze ≤ source retention; Silver/Gold per dataset policy; raw PHI in Bronze tier minimized — derive Silver as fast as possible and prune Bronze where law permits.
- **Residency:** lakehouse storage region-pinned per tenant; cross-region transfer disabled by default; aggregate-only data flows allowed with privacy sign-off.

### 5.7 Quality & contracts

- **Data contracts** between producers and CyData: schema (Avro/JSON-Schema), semantics, SLAs (freshness, completeness), classification, owner. CI-enforced.
- **Data quality tests** (dbt tests + Great Expectations) gate Silver → Gold promotion; failures alert dataset owner.
- **Freshness SLOs** per consumer:
  - Operational mart: ≤ 5 minutes.
  - BI mart: ≤ 1 hour.
  - Science / ML training set: ≤ 24 hours (or per use case).

### 5.8 Consumption surfaces

- **BI / dashboards:** a primary BI tool standardized per deployment (Superset / Metabase / Looker / Power BI, chosen per addendum).
- **Embedded reports** inside products: served via per-product read APIs from Gold (no raw warehouse access from product UIs).
- **Programmatic access:** CyData APIs (FHIR Bulk Data for healthcare; OpenAPI for general) — never direct warehouse credentials to external consumers.
- **ML / data science:** notebooks against the lakehouse via a managed compute layer with audit; Feature Store reads ([ADR-0016](ADR-0016-ai-platform-strategy.md)).

### 5.9 Cost & sustainability

- Per-tenant cost attribution mandatory at warehouse level.
- Dataset owner reviews cost quarterly; idle datasets archived or deprecated.
- Query cost guardrails (max bytes scanned per role) enforced.

## 6. Rationale

- The three-tier split protects OLTP SLOs and gives a clear place for every read pattern.
- The medallion pattern is well understood, vendor-portable, and lineage-friendly.
- Iceberg + dbt + Airflow keeps us portable across cloud SaaS, private cloud, and sovereign on-prem (which can run the same OSS stack).
- Tying classification, audit, and consent through the pipeline keeps healthcare/government compliance achievable rather than aspirational.

## 7. Consequences

### 7.1 Positive
- One destination for cross-product analytics; one mental model for engineers.
- ML and BI share a clean substrate; less duplication.
- Compliance evidence (lineage, access audit, classification) is centralized.

### 7.2 Trade-offs
- A lakehouse + warehouse + orchestration stack is a real ops commitment.
- Per-deployment vendor choice (warehouse / BI) introduces variability — managed by addendum.

### 7.3 Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | "Just one report" against OLTP slips into prod | High | High | Standard ban; review enforced; paved-road embedded read APIs |
| 2 | Tenant cross-leak in marts | Low | Critical | RLS / row filters mandatory; per-dataset isolation tests; per-tenant marts for regulated tenants |
| 3 | PHI lingers in Bronze beyond need | Medium | High | Aggressive Bronze pruning where law permits; minimize raw-PHI columns; tokenize in CDC |
| 4 | Schema drift breaks downstream marts | High | Medium | Data contracts in CI; OpenLineage alerts on breaking changes |
| 5 | Vendor lock-in (warehouse / BI) | Medium | Medium | Iceberg + dbt portable layer; per-deployment vendor addendum |
| 6 | Cost explosion from unrestricted SQL | High | Medium | Per-role byte-scan limits; cost dashboards; quarterly review |
| 7 | ML pipelines diverge from analytics | Medium | Medium | Shared Feature Store reading Gold layer ([ADR-0016](ADR-0016-ai-platform-strategy.md)) |
| 8 | Right-to-erasure incomplete in analytics | Medium | Critical | Erasure signal propagated as first-class event; quarterly audit |

### 7.4 Follow-up actions
- [ ] Author **CyData reference architecture** in `docs/architecture/` — Principal Engineer (Data), Program 2 Sprint 1.
- [ ] Author **data contract template + CI check** — Data + Platform Eng, Program 2 Sprint 1.
- [ ] Author **erasure-propagation runbook** — Compliance + Data, Program 2 Sprint 2.
- [ ] Publish **per-deployment vendor addendum** (warehouse + BI) — Platform Architect, Program 2 Sprint 2.
- [ ] Stand up **OpenLineage + metadata catalog** before the second analytics consumer joins.

## 8. Compliance & Security Impact

- HIPAA: minimum-necessary at the dataset level; de-identification pipelines; per-tenant audit of analytics reads.
- GDPR: residency, lawful basis, erasure propagation, lineage as Art. 30 evidence.
- ISO 27001 / SOC 2: access control, audit, change management of pipelines (dbt + Airflow under GitOps).
- Healthcare interop: FHIR-aware semantic layer satisfies public-health reporting requirements.

## 9. Alternatives Rejected

- **Analytics on OLTP replicas** — works briefly, then degrades SLOs and blocks cross-product reporting; weak compliance evidence.
- **Per-product analytics stacks** — duplicates effort, fragments compliance, locks talent.
- **Single BI vendor warehouse for everything** — fast for SaaS, incompatible with sovereign on-prem and BYOC.

## 10. References

- [`database_standards`](../standards/database_standards.md), [`audit_logging_strategy`](../security/audit_logging_strategy.md)
- Apache Iceberg, dbt, Airflow, OpenLineage; medallion architecture
- FHIR R4 analytics patterns (Bulk Data, Subscriptions)

---

## Revision History
| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Principal Engineer (Data) | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
