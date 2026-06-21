# API Contract Strategy

This document details the HTTP REST, FHIR, and public-sector integration contract specifications, covering headers, error structures, cursor paginations, and versioning rules.

---

## 1. REST and OpenAPI 3.1 Standards

All REST microservices must design and document their endpoints using **OpenAPI 3.1**:
*   **Path Conventions:** Lower-case kebab-case (e.g., `/api/v1/patient-encounters`).
*   **Verb Enforcement:**
    *   `GET`: Retrieve resources. Safe and idempotent.
    *   `POST`: Create resources. Non-idempotent.
    *   `PUT`: Replace resources entirely. Idempotent.
    *   `PATCH`: Apply partial updates. Non-idempotent.
    *   `DELETE`: Remove resources. Idempotent.

---

## 2. API Versioning, Deprecation, & Lifecycle

*   **URL Versioning:** Major versions are bound to the base path: `/api/v1/hr/employees/`.
*   **Deprecation Flow:** When an API is replaced:
    1.  The API response includes `Deprecation: @timestamp` and `Sunset: @timestamp` headers.
    2.  The developer updates the OpenAPI catalog, marking the service path as `deprecated: true`.
    3.  A warning log is triggered in client-facing dashboards.
    4.  After 6 months of sunset warnings, the Gateway blocks requests to the endpoint.

---

## 3. RFC 7807 Error Envelope Standard

All HTTP error responses must return the `application/problem+json` content-type. The JSON payload must strictly follow the schema:

```json
{
  "type": "https://api.cybercom.cloud/errors/invalid-dosage",
  "title": "Invalid Medication Dosage",
  "status": 422,
  "detail": "Requested prescription dosage (500mg) exceeds maximum formulary limit (250mg) for active drug ibuprofen.",
  "instance": "/patient-records/90821-278/prescriptions/1029",
  "invalid_params": [
    {
      "name": "dosage_mg",
      "reason": "Exceeds maximum dosage threshold."
    }
  ]
}
```

---

## 4. Cursor-Based Pagination Specifications

To prevent large database loads, offset pagination is banned. High-volume list endpoints must implement cursor-based pagination:
*   **Request Parameters:**
    *   `limit`: Integer representing the maximum count of returned records (default 20, max 100).
    *   `starting_after`: A base64-encoded string containing the sorting ID (UUIDv7) and timestamp of the last record in the previous page.
*   **Response Payload:**
    ```json
    {
      "data": [...],
      "has_more": true,
      "next_cursor": "eyJpZCI6IjAxOGY3YjIyLTRhNTUtN2QxMC1hMTFmLWVkMjZkMTkzMjE5NSIsImNyZWF0ZWRfYXQiOjE3MTkwMDQ2MjF9"
    }
    ```

---

## 5. API Gateway Rate-Limiting Configuration

Kong API Gateway enforces rate limiting utilizing a dynamic sliding window:
*   **SaaS Shared Tier:** 300 requests/minute per tenant.
*   **Enterprise Premium Tier:** 3,000 requests/minute per tenant.
*   **Headers Returned:**
    *   `X-RateLimit-Limit`: Maximum requests permitted.
    *   `X-RateLimit-Remaining`: Remaining requests in the active window.
    *   `X-RateLimit-Reset`: Unix timestamp when the window resets.

---

## 6. Revision History

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-06-21 | 1.0 | Initial API Contract Strategy | Enterprise Architect |
