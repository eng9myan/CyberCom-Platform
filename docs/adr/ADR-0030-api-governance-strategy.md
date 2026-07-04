# ADR-0030: API Governance Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Domain Architect, Platform Architect, Chief Software Architect |
| **Affects** | All CyberCom Services, Ingress Gateways, Integrators |
| **Tags** | governance, api, rest, fhir, openapi |
| **Related** | [ADR-0003](ADR-0003-api-strategy.md), [ADR-0017](ADR-0017-cyidentity-product-strategy.md) |

---

## 1. Context

CyberCom consists of multiple modular products (e.g., `CyMed`, `CyCom`, `CyShop`, `CyGov`) that expose interfaces to web frontends, mobile wallets, internal services, and external legacy healthcare or B2B supply chain partners. Without strict API governance:
-   API endpoints diverge in formatting, pagination, and error patterns.
-   Contract breaks occur between frontend and backend services.
-   Deprecation of legacy endpoints is uncoordinated, causing application crashes.
-   Compliance issues arise due to non-standardized audit logs on sensitive interfaces.

---

## 2. Decision Drivers

-   **Developer Experience (DX):** Unified schemas, documentation, and error formats.
*   **Standards Compliance:** Native FHIR compliance for clinical pathways and RFC 7807 compliance for general REST APIs.
-   **Security and Auditability:** Universal token validation, rate-limiting, and auditable parameter captures.
-   **Stable Lifecycles:** Backward-compatible evolution, version tagging, and deterministic deprecation pathways.

---

## 3. Decision

We accept a unified **API Governance Strategy** mandating the following standards:

### 3.1 HTTP API Specifications
1.  **OpenAPI 3.1:** All non-FHIR APIs must publish OpenAPI 3.1 definitions in their source directories. Code generation tools (e.g., OpenAPI Generator, spectral linting) are enforced in CI pipelines.
2.  **REST Principles:** JSON over HTTPS, standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`).
3.  **Versioning:** Major versions included in the URL prefix (e.g., `/api/v1/workforce/...`). Minor/patch upgrades must be backward-compatible and avoid URL updates.
4.  **Pagination:** Cursor-based pagination (`limit`, `starting_after` / UUIDv7 cursor) is required for high-throughput lists to prevent memory exhaustion. Offset pagination is prohibited.
5.  **Error Format (RFC 7807):** All HTTP error responses must return the `application/problem+json` content-type with the standard schema:
    ```json
    {
      "type": "https://api.cybercom.cloud/errors/out-of-stock",
      "title": "Inventory Exhausted",
      "status": 409,
      "detail": "Requested item SKU-9081 is out of stock in warehouse WH-3.",
      "instance": "/orders/81827-182",
      "invalid_params": []
    }
    ```

### 3.2 Healthcare APIs (FHIR)
*   **Conformance:** Clinical data exposes `/fhir/R4/...` (and selectively `/fhir/R5/...`) endpoints complying with FHIR resources (Patient, Encounter, MedicationRequest, etc.).
*   **SMART on FHIR:** App launches validate clients using the SMART App Launch framework via `CyIdentity`.

### 3.3 Security & Gateway Controls
*   **Authentication:** OAuth 2.1 Access Tokens passed as Bearer tokens in the `Authorization` header.
*   **Rate Limiting:** Enforced at the Kong API Gateway using dynamic Redis limits tied to the JWT's `tenant_id` and client IP.
*   **Authorization:** Kong routes validated requests to services where OPA sidecars execute ABAC policy rules.

### 3.4 API Lifecycle and Deprecation
*   **Sunrise/Sunset Headers:** Deprecated APIs must return a `Deprecation: @timestamp` header and a `Sunset: @timestamp` header indicating when the endpoint will be terminated.
*   **Minimum Lifetime:** Deprecated APIs must remain active for a minimum of 6 months before being decommissioned.

---

## 4. Rationale

*   Standardized errors reduce frontend handling complexity and improve troubleshooting speed.
*   Cursor-based pagination keeps SQL queries fast and memory usage flat.
*   Decoupled API gateway validation offloads authentication overhead from the core microservices.

---

## 5. Consequences

### 5.1 Positive
*   Consistent developer experience across teams.
*   Clean deprecation paths preventing silent client breakages.
*   Built-in security guards at the API ingress.

### 5.2 Negative / Trade-offs
*   Higher upfront development effort due to strict contract validation and linting in CI pipelines.
*   Increased complexity in maintaining dual versions during active API migrations.

---

## Revision History

| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Enterprise Architect | Proposed & Approved |
