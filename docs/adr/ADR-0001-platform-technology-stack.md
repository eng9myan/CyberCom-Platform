# ADR-0001: Platform Technology Stack

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Software Architect, Chief Security Architect, Platform Architect, DevOps Architect |
| **Consulted** | Domain Architects, Engineering Standards Authority |
| **Informed** | All contributors |
| **Affects** | Platform (all products) |
| **Tags** | architecture, platform, baseline |
| **Related** | [coding_standards](../standards/coding_standards.md), [backend_standards](../standards/backend_standards.md), [frontend_standards](../standards/frontend_standards.md), [database_standards](../standards/database_standards.md) |

---

## 1. Context

CyberCom is a multi-product enterprise platform (CyIdentity, CyCitizen, CyIntegration Hub, CyData, CyAI, CyMed, CyCom, CyShop, CyGov). To enable mobility of engineers across products, shared tooling, predictable security posture, and economy of scale, the platform must converge on **one default stack** while leaving justified deviations possible via ADR.

## 2. Problem Statement

What is the **default** technology stack for CyberCom services across backend, frontend, mobile, desktop, data, and infrastructure?

## 3. Decision Drivers

- Enterprise-grade ecosystem support (long-term maintenance, vendor maturity).
- Suitability for healthcare/ERP/government workloads (security, auditability, longevity).
- Talent availability globally.
- On-prem, private-cloud, and national-cloud portability.
- Compatibility with HIPAA, GDPR, ISO 27001 requirements.
- Speed of iteration without compromising stability.

## 4. Considered Options

1. **Python/Django + React/Next.js + PostgreSQL + Kubernetes** (chosen).
2. Java/Spring + React/Next.js + PostgreSQL + Kubernetes.
3. Node/NestJS + React/Next.js + PostgreSQL + Kubernetes.
4. .NET + Blazor + SQL Server + Kubernetes.

## 5. Decision

The default CyberCom stack is:

- **Backend:** Python 3.12, Django 5, Django REST Framework, Celery.
- **Database:** PostgreSQL 16 (primary), Redis (cache/queues).
- **Frontend (web):** React 19, Next.js (App Router), TypeScript 5 (strict).
- **Mobile:** React Native (Expo).
- **Desktop:** Electron (with sandbox + context isolation).
- **API:** REST + OpenAPI 3.1; gRPC/GraphQL by ADR.
- **Containers:** Docker (multi-stage, non-root, distroless/slim).
- **Orchestration:** Kubernetes.
- **IaC:** Terraform; Helm for K8s app config.
- **Observability:** OpenTelemetry + Prometheus + Grafana + structured JSON logs.
- **CI/CD:** GitHub Actions with OIDC to cloud roles.
- **Secrets:** HashiCorp Vault (or cloud-native equivalent) via External Secrets Operator.
- **Identity:** CyIdentity (OIDC + OAuth 2.1 + SCIM + WebAuthn).

Other languages (Go, Rust) MAY be used where Python is unsuitable (high-throughput edge, embedded), with an ADR.

## 6. Rationale

- Python + Django gives high productivity, mature security defaults, and broad healthcare/ERP precedent.
- PostgreSQL provides RLS, JSONB, GIS, and time-series via extensions — covering 90% of needs without a polyglot zoo.
- React/Next.js dominates web talent supply; App Router enables hybrid server/client rendering for performance.
- React Native + Electron reuse JS/TS talent and codebase for mobile/desktop.
- Kubernetes is portable across clouds and on-prem, essential for sovereign deployments.

## 7. Consequences

### 7.1 Positive
- One language per tier ⇒ one toolchain, one CI image, one set of standards.
- Reuse of components and packages across products.
- Easier mobility of engineers and ops.

### 7.2 Trade-offs
- Python GIL constraints for CPU-bound work — mitigate with workers, async I/O, or Go/Rust per ADR.
- Electron memory footprint — acceptable for back-office apps.

### 7.3 Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Stack lock-in slows adoption of better tech | Medium | Medium | Quarterly review; clear ADR path for exceptions |
| 2 | Python performance for hot paths | Medium | Medium | Profile early; use C-extensions, async, or polyglot per ADR |
| 3 | Next.js App Router churn | Medium | Low | Pin to LTS-equivalent minor; track Next.js stable releases |

## 8. Compliance & Security Impact

All listed components have a security track record and active maintainers. HIPAA/GDPR controls are achievable across the stack. Choices align with [`security_architecture`](../security/security_architecture.md).

## 9. Alternatives Rejected

- **Java/Spring** — strong, but heavier toolchain and slower iteration than Django for CRUD-heavy healthcare/ERP workloads.
- **Node/NestJS** — capable, but Python's data/AI ecosystem and ORM maturity tip the balance for our domain mix.
- **.NET** — excellent platform, but talent pool less universal in target geographies and less aligned with our on-prem Linux/K8s default.

## 10. References

- [`coding_standards`](../standards/coding_standards.md), [`python_standards`](../standards/python_standards.md), [`backend_standards`](../standards/backend_standards.md), [`frontend_standards`](../standards/frontend_standards.md), [`database_standards`](../standards/database_standards.md), [`api_standards`](../standards/api_standards.md)

---

## Revision History
| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Chief Software Architect | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
