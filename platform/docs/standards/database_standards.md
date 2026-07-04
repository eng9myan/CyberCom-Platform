# Database Standards

> **Status:** Approved — Program 0, Phase 0.3
> **Owner:** Principal Engineer (Data) + DevOps Architect
> **Primary engine:** PostgreSQL 16

Extends [`coding_standards.md`](coding_standards.md) and [`backend_standards.md`](backend_standards.md).

---

## 1. Principles

1. **Each service owns its schema.** No cross-service joins. Cross-service reads via API or events.
2. **Schema is code.** Migrations live with the service; reviewed; never edited after merge.
3. **Multi-tenant by default.** Every business table carries `tenant_id`.
4. **Soft delete by default.** Hard deletes only for transient/compliance-driven tables.
5. **Audit by default.** Every row records who/when of create and update.
6. **Boring is good.** Default to relational; introduce other stores only with an ADR.

---

## 2. Naming

| Object | Convention | Example |
|---|---|---|
| Database | `snake_case` | `cymed_clinical` |
| Schema (namespace) | `snake_case` | `clinical` |
| Tables | `snake_case`, **plural** | `patients`, `lab_orders` |
| Columns | `snake_case` | `created_at`, `tenant_id` |
| Primary key column | `id` | `id` |
| Foreign key column | `<referenced_singular>_id` | `patient_id` |
| Indexes | `ix_<table>_<cols>` (b-tree), `uq_<table>_<cols>` (unique), `gin_<table>_<cols>` | `ix_patients_tenant_id` |
| Constraints | `ck_<table>_<rule>`, `fk_<table>_<col>` | `ck_patients_dob_past` |
| Sequences | `seq_<table>_<col>` | rarely used (UUIDs preferred) |
| Views | `vw_<name>` | `vw_active_patients` |
| Materialized views | `mvw_<name>` | `mvw_billing_daily` |
| Functions | `fn_<verb>_<noun>` | `fn_anonymize_patient` |
| Triggers | `tg_<table>_<event>` | `tg_patients_touch_updated_at` |

Reserved suffixes: `_at` (timestamp), `_by` (actor), `_id` (foreign key), `_count`, `_amount`, `_currency`.

---

## 3. Primary Keys — UUID

- All primary keys are **UUID v7** (time-ordered) where supported; fall back to UUID v4.
- Column: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` (with `pgcrypto` or `uuidv7` extension).
- Rationale: globally unique, safe across shards/regions, friendly to event sourcing and federation, no enumeration attacks.
- External-facing IDs MAY be opaque slugs (ULID/UUID base32) — never expose internal integer sequences.

---

## 4. Audit Fields (mandatory on every business table)

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | `UUID` | `gen_random_uuid()` | PK |
| `tenant_id` | `UUID` | (from request context) | indexed; RLS filter |
| `created_at` | `TIMESTAMPTZ` | `now()` | immutable |
| `updated_at` | `TIMESTAMPTZ` | `now()` | trigger-updated |
| `created_by` | `UUID` | (user/service id) | nullable for system seed |
| `updated_by` | `UUID` | (user/service id) | |
| `is_deleted` | `BOOLEAN` | `false` | soft-delete flag |
| `deleted_at` | `TIMESTAMPTZ` | `NULL` | set on soft delete |
| `deleted_by` | `UUID` | `NULL` | actor |
| `version` | `BIGINT` | `1` | optimistic concurrency / event versioning |

A standard trigger maintains `updated_at`. ORM `BaseModel` enforces the rest.

---

## 5. Soft Delete Strategy

- **Default:** soft delete via `is_deleted = true` + `deleted_at`.
- All read queries filter `is_deleted = false` (enforced by default manager / row-level policy).
- A nightly job purges soft-deleted rows older than the retention window (per data class — see Data Classification).
- **Hard delete** allowed only for: ephemeral tables (sessions, idempotency keys), GDPR/HIPAA right-to-erasure executions, and explicit ADR exceptions.
- Right-to-erasure: documented, audited, irreversible — uses a dedicated `fn_erase_subject` function.

---

## 6. Multi-Tenant Strategy

CyberCom supports three tenant isolation patterns. **Default is Shared-Schema with RLS.** Selection per product via ADR.

| Pattern | When | Pros | Cons |
|---|---|---|---|
| **Shared schema + RLS** (default) | Most SaaS use cases | Lowest cost; fastest provisioning; central ops | Strict RLS discipline required |
| **Schema-per-tenant** | Mid-trust isolation; ≤ low-thousands of tenants | Logical isolation; per-tenant migrations possible | Migration fan-out; connection pressure |
| **Database-per-tenant** | Regulated / sovereign / large enterprise tenants | Strongest isolation; per-tenant residency | Highest ops cost; per-tenant CI/CD |

### Shared-schema rules (default)

- Every business table has `tenant_id UUID NOT NULL`.
- Composite indexes start with `tenant_id` for tenant-scoped queries.
- **Row-Level Security (RLS) enabled** on every business table:
  ```sql
  ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
  CREATE POLICY tenant_isolation ON patients
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
  ```
- Application sets `SET LOCAL app.tenant_id = …` at the start of each request transaction.
- Admin/maintenance roles bypass RLS via a separate role; their use is audited.

---

## 7. Data Types

- Strings: `TEXT` (no `VARCHAR(n)` unless a real constraint exists; enforce length via `CHECK`).
- Money: `NUMERIC(19,4)` plus a `*_currency CHAR(3)` ISO-4217 column. Never `FLOAT` for money.
- Timestamps: `TIMESTAMPTZ` only. UTC stored; client converts.
- Booleans: `BOOLEAN NOT NULL DEFAULT false`.
- Enums: `TEXT` + `CHECK (col IN (…))` (cheaper to evolve than native `ENUM`).
- JSON: `JSONB`; schema documented; indexed where queried.
- Geography: PostGIS types when needed.

---

## 8. Indexes & Performance

- Index every `tenant_id` and every FK.
- Index columns used in `WHERE`, `JOIN`, `ORDER BY` for hot queries.
- Use **partial indexes** for soft-delete (`WHERE is_deleted = false`) on large tables.
- Use **BRIN** for very large append-only time-series tables.
- Use **GIN** for JSONB / full-text.
- Never index without a query that uses it; remove unused indexes (`pg_stat_user_indexes`).
- Vacuum/analyze monitored; bloat thresholds alarmed.

---

## 9. Migrations

- One migration per logical change; descriptive names (`0042_add_lab_orders_status_index`).
- Migrations are **forward-only** in prod; rollbacks via compensating migration, not `--reverse`.
- Long-running DDL (e.g. `ADD COLUMN NOT NULL` on big tables) split into safe phases:
  1. Add nullable column + default.
  2. Backfill in batches.
  3. Add `NOT NULL` constraint.
  4. (Optional) drop default.
- Use `CONCURRENTLY` for index creation in prod.
- Migrations run in CI against an ephemeral DB; merged migrations cannot be edited.

---

## 10. Transactions & Concurrency

- Isolation level: **`READ COMMITTED`** default; `REPEATABLE READ` for read-heavy reports; `SERIALIZABLE` only when invariants require it.
- Optimistic concurrency via `version` column or `xmin` checks for high-contention rows.
- Long transactions (> 5 s) are bugs.
- Advisory locks for cross-process critical sections (with timeout).

---

## 11. Backups & Recovery

| Topic | Standard |
|---|---|
| Backup type | Daily full + continuous WAL archiving (PITR) |
| Retention | 30 days hot, 1 year cold (or per compliance) |
| RTO | ≤ 1 hour (Tier-1 services) |
| RPO | ≤ 5 minutes (Tier-1 services) |
| Restore drill | Quarterly, signed off by DevOps Architect |
| Encryption | At rest (KMS) + in transit (TLS 1.3) |

---

## 12. Security

- TLS required for all client connections.
- Least-privilege DB roles: `app_rw`, `app_ro`, `migrator`, `admin` — services use `app_rw`.
- Credentials rotated via secret manager; no static passwords in env files.
- All PHI/PII columns tagged in the data dictionary; access logged.
- Column-level encryption for highly sensitive fields (e.g. national ID) using application-side envelope encryption.

---

## 13. Data Classification

| Class | Examples | Storage rules |
|---|---|---|
| **Public** | Country list | Any |
| **Internal** | Feature flags | Any |
| **Confidential** | Employee email, billing amount | Encrypted at rest |
| **Restricted (PII)** | Name, DOB, address | Encrypted at rest; access audited; masking in non-prod |
| **Restricted (PHI)** | Diagnosis, labs, prescriptions | HIPAA controls; never in non-prod; per-row audit |
| **Secret** | Tokens, keys | Secret manager only — never in DB |

---

## 14. Non-Relational Stores (when justified)

- **Redis** — cache, rate-limit, transient queues. Not a system of record.
- **Object storage (S3-compatible)** — documents, images, exports.
- **Search (OpenSearch/Meilisearch)** — secondary index; never source of truth.
- **Event store (Kafka)** — durable event log; per ADR.
- **Time-series (Timescale)** — observability/telemetry; per ADR.

Any new store requires an ADR justifying it over PostgreSQL.

---

## 15. Forbidden

- Cross-service joins.
- Storing files as `BYTEA` in row data (use object storage; store URI).
- `SELECT *` in application code paths.
- Integer/serial primary keys for business entities.
- Disabling RLS in production without an audited admin role.
- Edit-then-merge of an already-merged migration.
