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

_New ADRs are appended above. Keep the index sorted ascending by number._
