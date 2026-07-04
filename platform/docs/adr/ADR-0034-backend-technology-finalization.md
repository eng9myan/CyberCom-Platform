# ADR-0034: Backend Technology Finalization

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Domain Architect, Platform Architect, Chief Software Architect |
| **Affects** | All CyberCom Services, Engineering Teams, Platforms |
| **Tags** | governance, backend, stack, python, django, go |
| **Related** | [ADR-0001](ADR-0001-platform-technology-stack.md), [ADR-0011](ADR-0011-platform-engineering-strategy.md) |

---

## 1. Context

In earlier platform design iterations, Go (Golang) and Python were both evaluated for general backend service development. To prevent engineering fragmentation, establish clear language boundaries, and optimize developer onboarding velocity, the platform must declare and enforce a locked, standardized technology stack.

---

## 2. Problem Statement

What is the finalized technology stack for CyberCom, and what is the specific policy regulating the usage of Python/Django versus Go across core business and utility microservices?

---

## 3. Decision Drivers

-   **Engineering Velocity:** Reducing stack diversity allows developers to move between products (e.g., from `CyMed` to `CyCom`) without retraining.
-   **Ecosystem Richness:** Python and Django provide mature libraries for rapid database mapping, administrative portals, and Middle East localizations.
-   **Performance Constraints:** High-concurrency operations (such as parsing persistent HL7 TCP streams, streaming video DICOM frames, and AI inference routing) require compiled, low-latency execution engines.
-   **Security compliance:** Consistent audit and secrets handling across all business applications.

---

## 4. Decision

We finalize and lock the **CyberCom Platform Technology Stack** under the following parameters:

### 4.1 Primary Core Technology Stack

*   **Primary Backend Language & Framework:** **Python 3.12** using **Django 5** and **Django REST Framework (DRF)**.
*   **Primary Database:** **PostgreSQL 16+**.
*   **Primary Frontend:** **Next.js** / **React** using **TypeScript**.
*   **Primary Mobile:** **React Native** (using TypeScript).
*   **Primary Event Broker:** **Apache Kafka**.
*   **Primary Cache:** **Redis**.
*   **Primary Background Processing:** **Celery**.
*   **Primary Identity Provider:** **Keycloak** or **Zitadel** (configured based on approved PoC).
*   **Primary Containerization:** **Docker** and **Kubernetes**.
*   **Primary Observability:** **OpenTelemetry**, **Prometheus**, and **Grafana**.

### 4.2 Go (Golang) Usage Policy

Go is **NOT** a primary backend language for business applications. All core business services (e.g., patient portals, general ledgers, procurement systems, CRM, citizen registers) must be built using Python and Django.

Go is restricted and may **only** be utilized for the following specialized, performance-critical services:
1.  **HL7 Processing:** Sockets listening to persistent MLLP TCP streams.
2.  **FHIR Processing:** Stateful FHIR validation and high-performance ingestion gateways.
3.  **DICOM Processing:** Direct processing and chunking of heavy medical pixel binaries.
4.  **Streaming Services:** Live video streams or real-time websocket brokers.
5.  **High-Performance ETL:** Extractor nodes in ingestion pipelines (`CyData`).
6.  **Media Services:** High-frequency rendering and processing of images and PDFs.
7.  **AI Inference Gateways:** High-throughput routers communicating with GPU Triton servers (`CyAI`).

---

## 5. Rationale

*   Standardizing business services on Python and Django simplifies recruitment, speeds up the release of business features, and standardizes database migrations.
*   Restricting Go to stateful, high-throughput protocol parsing (like HL7/DICOM streams) ensures maximum execution performance where it matters most, without fragmenting the general application layer.

---

## 6. Consequences

### 6.1 Positive
*   Clear structural boundaries for developers.
*   Standardized and simplified CI/CD build templates.
*   Optimal matching of language characteristics to service demands.

### 6.2 Negative / Trade-offs
*   Slightly higher RAM consumption for Python business services relative to compiled Go binaries.
*   Mandates dual-language expertise (Python and Go) in the platform tooling and integration teams.

---

## Revision History

| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Enterprise Architect | Proposed & Approved |
