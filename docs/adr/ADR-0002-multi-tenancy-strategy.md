# ADR-0002: Multi-Tenancy Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Software Architect, Chief Security Architect, Platform Architect |
| **Affects** | All products that hold tenant data |
| **Tags** | architecture, data, security, compliance |
| **Related** | [database_standards](../standards/database_standards.md), [security_architecture](../security/security_architecture.md) |

---

## 1. Context

CyberCom serves hospitals, enterprises, and governments — each a tenant, often with strict isolation, residency, and audit requirements. Multi-tenancy choices drive cost, isolation strength, ops burden, and compliance posture.

## 2. Problem Statement

What is CyberCom's default tenant isolation model, and how do we accommodate tenants with stricter isolation needs?

## 3. Decision Drivers

- HIPAA / GDPR isolation expectations.
- Cost per tenant.
- Time to onboard a new tenant.
- Blast radius of an incident.
- Per-tenant residency, BYOK, and migration support.

## 4. Considered Options

1. **Shared schema with PostgreSQL Row-Level Security (RLS)** — default.
2. **Schema-per-tenant** in shared database.
3. **Database-per-tenant**.
4. **Cluster-per-tenant** (full isolation).

## 5. Decision

CyberCom uses a **tiered model**, defaulting to shared schema + RLS and escalating per tenant requirements:

| Tier | Pattern | When |
|---|---|---|
| **T-Shared (default)** | Shared schema + Postgres RLS, tenant claim in JWT, session GUC `app.tenant_id`, RLS policies on every table | Most SaaS tenants |
| **T-Schema** | Shared DB, schema per tenant | Mid-trust isolation, ≤ low-thousands of tenants |
| **T-DB** | Database per tenant (same cluster) | High-trust enterprise tenants, BYOK, per-tenant backups |
| **T-Cluster** | Full stack per tenant (namespace or cluster) | Sovereign deployments, on-prem hospitals, government |

Movement between tiers is supported through documented migration runbooks.

## 6. Rationale

- Shared+RLS minimizes cost and onboarding time while still providing strong, enforced isolation if RLS is disciplined.
- Higher tiers exist explicitly so we never have to choose between "cheap but unsafe" and "safe but unaffordable".
- Aligns with [`database_standards`](../standards/database_standards.md) §6.

## 7. Consequences

### 7.1 Positive
- Predictable model; one mental model for most engineers.
- Compliance escalation path without re-architecting.

### 7.2 Trade-offs
- T-Shared requires strict RLS discipline; misconfig is high-impact.
- T-Cluster increases ops cost meaningfully.

### 7.3 Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | RLS disabled inadvertently | Low | Critical | Migration linter; CI assertion; per-tenant isolation tests |
| 2 | Noisy-neighbor on T-Shared | Medium | Medium | Per-tenant quotas; query cost guardrails |
| 3 | T-Cluster sprawl ops cost | Medium | High | Strict criteria for T-Cluster; centralized control plane |

## 8. Compliance & Security Impact

- All tiers support HIPAA/GDPR; T-DB/T-Cluster support data residency, BYOK, and per-tenant audit export.
- Audit logs always include `tenant_id`.

## 9. Alternatives Rejected

- **Pure schema-per-tenant as default** — migration fan-out and connection pressure outweigh isolation gains for most tenants.
- **Pure database-per-tenant as default** — ops cost not justified for the majority of SaaS tenants.

## 10. References

- [`database_standards`](../standards/database_standards.md) §6
- PostgreSQL Row Security Policies

---

## Revision History
| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Platform Architect | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
