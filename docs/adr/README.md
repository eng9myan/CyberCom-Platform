# Architecture Decision Records (ADRs)

> Numbered, immutable records of significant architectural decisions for the CyberCom Platform.

This folder is the **canonical home of ADRs**. The pre-existing `docs/decisions/` folder is retained for backward references and may be migrated here.

## Why ADRs?

- Capture the **context** and **consequences** of decisions, not just the outcome.
- Provide a durable trail when teams or vendors change.
- Force trade-offs to be made explicit.

## Conventions

- **File name:** `ADR-NNNN-short-kebab-title.md` (4-digit, zero-padded, sequential).
- **Status lifecycle:** `Proposed` → `Accepted` → (`Superseded by ADR-XXXX` | `Deprecated`).
- **Immutability:** Once `Accepted`, an ADR is **not edited**. Replace it with a new ADR that supersedes it.
- **Granularity:** One decision per ADR. Multi-decision proposals are split.

## Template

Start every new ADR by copying [`ADR-0000-template.md`](ADR-0000-template.md).

## Authoring workflow

1. Branch `docs/adr-NNNN-<slug>` from `architecture`.
2. Copy the template, fill it in.
3. Open PR to `architecture` using the PR template.
4. Discuss inline; the PR is the decision forum.
5. Chief Architect + relevant Domain Architect approve.
6. Squash-merge. The merge commit is the decision timestamp.

## Index

| # | Title | Status | Date | Supersedes |
|---|---|---|---|---|
| _0000_ | _Template_ | _N/A_ | _—_ | _—_ |
| [0001](ADR-0001-platform-technology-stack.md) | Platform Technology Stack | Accepted | 2026-06-21 | — |
| [0002](ADR-0002-multi-tenancy-strategy.md) | Multi-Tenancy Strategy | Accepted | 2026-06-21 | — |
| [0003](ADR-0003-api-strategy.md) | API Strategy | Accepted | 2026-06-21 | — |
| [0004](ADR-0004-event-driven-architecture-strategy.md) | Event-Driven Architecture Strategy | Accepted | 2026-06-21 | — |
| [0005](ADR-0005-identity-access-management-strategy.md) | Identity & Access Management Strategy | Accepted | 2026-06-21 | — |
| [0006](ADR-0006-icd-11-strategy.md) | ICD-11 Strategy | Accepted | 2026-06-21 | — |
| [0007](ADR-0007-healthcare-interoperability-strategy.md) | Healthcare Interoperability Strategy | Accepted | 2026-06-21 | — |
| [0008](ADR-0008-saas-deployment-strategy.md) | SaaS Deployment Strategy | Accepted | 2026-06-21 | — |
| [0009](ADR-0009-observability-strategy.md) | Observability Strategy | Accepted | 2026-06-21 | — |
| [0010](ADR-0010-gitops-deployment-strategy.md) | GitOps Deployment Strategy | Accepted | 2026-06-21 | — |
| [0011](ADR-0011-platform-engineering-strategy.md) | Platform Engineering Strategy | Accepted | 2026-06-21 | — |
| [0012](ADR-0012-environment-management-strategy.md) | Environment Management Strategy | Accepted | 2026-06-21 | — |
| [0013](ADR-0013-service-mesh-strategy.md) | Service Mesh Strategy | Accepted | 2026-06-21 | — |
| [0014](ADR-0014-database-scaling-strategy.md) | Database Scaling Strategy | Accepted | 2026-06-21 | — |
| [0015](ADR-0015-reporting-analytics-strategy.md) | Reporting & Analytics Strategy | Accepted | 2026-06-21 | — |
| [0016](ADR-0016-ai-platform-strategy.md) | AI Platform Strategy | Accepted | 2026-06-21 | — |
| [0017](ADR-0017-cyidentity-product-strategy.md) | CyIdentity Product Strategy | Accepted | 2026-06-21 | — |
| [0018](ADR-0018-cycom-product-repositioning.md) | CyCom Product Repositioning (→ Enterprise Back-Office / ERP) | Accepted | 2026-06-21 | — |
| [0019](ADR-0019-cyconnect-communications-platform.md) | CyConnect Communications Platform | Accepted | 2026-06-21 | — |
| [0026](ADR-0026-healthcare-credentialing-privileging-strategy.md) | Healthcare Credentialing & Privileging Strategy | Accepted | 2026-06-21 | — |
| [0027](ADR-0027-master-data-management-strategy.md) | Master Data Management Strategy | Accepted | 2026-06-21 | — |
| [0028](ADR-0028-audit-legal-record-strategy.md) | Audit & Legal Record Strategy | Accepted | 2026-06-21 | — |
| [0029](ADR-0029-enterprise-document-management-strategy.md) | Enterprise Document Management Strategy | Accepted | 2026-06-21 | — |
| [0030](ADR-0030-api-governance-strategy.md) | API Governance Strategy | Accepted | 2026-06-21 | — |
| [0031](ADR-0031-event-governance-strategy.md) | Event Governance Strategy | Accepted | 2026-06-21 | — |
| [0032](ADR-0032-ui-design-system-strategy.md) | UI Design System Strategy | Accepted | 2026-06-21 | — |
| [0033](ADR-0033-mobile-offline-architecture-strategy.md) | Mobile & Offline Architecture Strategy | Accepted | 2026-06-21 | — |
| [0034](ADR-0034-backend-technology-finalization.md) | Backend Technology Finalization | Accepted | 2026-06-21 | — |

_New ADRs are appended above. Keep the index sorted ascending by number._

