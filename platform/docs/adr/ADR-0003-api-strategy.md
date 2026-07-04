# ADR-0003: API Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Software Architect, Platform Architect, Chief Security Architect |
| **Affects** | All services exposing or consuming APIs |
| **Tags** | architecture, api, integration |
| **Related** | [api_standards](../standards/api_standards.md), [ADR-0001](ADR-0001-platform-technology-stack.md) |

---

## 1. Context

CyberCom integrates many products (internal) and many partners (external). API choices drive interoperability, developer experience, performance, and security.

## 2. Problem Statement

What API style(s) does CyberCom adopt for external and internal communication, and what governance applies?

## 3. Decision Drivers

- Wide ecosystem and tool support (clients, docs, code-gen).
- Healthcare and government interop standards (HL7 FHIR, ISO 20022, OAuth, OIDC).
- Performance for internal calls; clarity for external.
- Spec-first to keep contracts honest.

## 4. Considered Options

1. **REST + OpenAPI 3.1 default; gRPC and GraphQL by ADR** (chosen).
2. GraphQL-first across the platform.
3. gRPC-first across the platform.
4. Free-form per service.

## 5. Decision

- **Default external & internal API style:** **REST + OpenAPI 3.1**.
- **gRPC:** permitted for high-throughput internal service-mesh calls (per-service ADR).
- **GraphQL:** permitted for BFF aggregation layers (per-service ADR).
- **Event streams:** see [ADR-0004 Event-Driven Architecture](ADR-0004-event-driven-architecture-strategy.md).
- **Spec-first**: OpenAPI authored before code; clients generated.
- All APIs follow [`api_standards`](../standards/api_standards.md) (URLs, status codes, cursor pagination, error envelope, versioning, idempotency, webhooks, headers, SDK generation).

## 6. Rationale

- REST + OpenAPI gives the broadest ecosystem and best fit for healthcare/finance partners.
- gRPC and GraphQL exist as scoped tools for specific problems, not platform defaults.
- Spec-first prevents drift between implementation and contract.

## 7. Consequences

### 7.1 Positive
- One predictable shape for every API.
- SDKs auto-generated; less hand-written client code.

### 7.2 Trade-offs
- REST + JSON is heavier than gRPC for chatty internal calls — solved by selective gRPC adoption.

### 7.3 Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | OpenAPI drift | Medium | Medium | Contract tests (Schemathesis); CI breaking-change detection (oasdiff) |
| 2 | Inconsistent error shapes | Medium | Medium | Shared error-envelope library; lint rule |
| 3 | Public exposure of internal APIs | Low | High | Gateway routes only registered for documented public APIs |

## 8. Compliance & Security Impact

- All APIs default to AuthN required; public exception requires Security Architect sign-off.
- Audit events emitted for sensitive operations.

## 9. Alternatives Rejected

- **GraphQL-first** — strong DX for product clients, but adds complexity for partners and weak fit for healthcare interop expectations.
- **gRPC-first** — excellent perf, but external partner and tool support is weaker.

## 10. References

- [`api_standards`](../standards/api_standards.md), OpenAPI 3.1, OAuth 2.1, FHIR R4.

---

## Revision History
| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Chief Software Architect | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
