# Logical Reference Architecture

## 1. Executive Summary

The Logical Reference Architecture defines the structural boundaries, layerings, routing strategies, and communication paradigms within the CyberCom Platform. It enforces clean separation of concerns, decoupling of the core clinical system (`CyMed`) from the enterprise resource planning system (`CyCom`), and integrates external systems via `CyIntegrationHub`.

```mermaid
graph TD
    classDef presentation fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef gateway fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
    classDef service fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px;
    classDef data fill:#fff3e0,stroke:#e65100,stroke-width:2px;
    
    subgraph Presentation Layer
        WebApps["Web Portals (React/OWL)"]:::presentation
        MobileApps["Mobile Apps (Flutter)"]:::presentation
        ExternalClients["FHIR Clients / B2B Users"]:::presentation
    end

    subgraph API Gateway Layer
        GW["API Gateway (Kong Enterprise)<br/>Tenant Routing | JWT AuthN | Rate Limiting"]:::gateway
    end

    subgraph Core Platform Services
        CyIdentity["CyIdentity Realm Context<br/>AuthN & SCIM"]:::service
        CyMed["CyMed (Clinical)<br/>CPOE | Patient Master | EHR"]:::service
        CyCom["CyCom (ERP)<br/>HR | Finance | Procurement"]:::service
        CyShop["CyShop (Commerce)<br/>Catalog | Billing | Fulfillment"]:::service
        CyGov["CyGov (Public Services)<br/>Citizen Master | Registry"]:::service
        CyConnect["CyConnect (Communications)<br/>SMS | Email | Notifications"]:::service
        CyIntegrationHub["CyIntegration Hub<br/>FHIR / HL7 Engines | B2B EDI"]:::service
    end

    subgraph Event Streaming & Middleware
        Kafka[("Event Broker (Apache Kafka)<br/>Outbox Replication Hub")]:::data
    end

    subgraph Analytical Layer
        CyData["CyData Warehouse & Lakehouse<br/>BigQuery | Apache Iceberg"]:::service
        CyAI["CyAI Engine<br/>ML Models | Decision Support"]:::service
    end

    subgraph Storage Layer
        DB_Med[("CyMed PostgreSQL Db<br/>UUIDv7 | Clinical Schema")]:::data
        DB_Com[("CyCom PostgreSQL Db<br/>ERP Schema")]:::data
        DB_Identity[("CyIdentity Keycloak Db<br/>Realm Directory")]:::data
    end

    Presentation Layer --> GW
    GW --> CyIdentity
    GW --> CyMed
    GW --> CyCom
    GW --> CyShop
    GW --> CyGov
    GW --> CyIntegrationHub

    CyMed -- "Transactional Events" --> Kafka
    CyCom -- "Transactional Events" --> Kafka
    CyShop -- "Transactional Events" --> Kafka
    CyGov -- "Transactional Events" --> Kafka

    Kafka -- "Ingest Logs & Metrics" --> CyData
    CyData --> CyAI
    CyAI -- "Real-Time Inference" --> CyMed

    CyMed --> DB_Med
    CyCom --> DB_Com
    CyIdentity --> DB_Identity
```

---

## 2. Layering and System Boundaries

The CyberCom platform enforces strict logical layering to guarantee high availability, loose coupling, and security isolation:

### 2.1 Presentation Layer
*   **Web Portals:** Built using React for SaaS portals, and OWL (Odoo Web Library) for customized ERP elements.
*   **Mobile Portals:** Native or hybrid mobile clients interacting with the Gateway.
*   **Client Isolation:** Presentation tiers communicate strictly with the Gateway via OAuth 2.1 tokens. No direct database or microservice access is permitted.

### 2.2 API Gateway Layer
*   **Tech Stack:** Kong Enterprise or APISIX.
*   **Responsibilities:**
    *   Tenant identification via subdomains/custom domains.
    *   Access Token verification via JSON Web Key Sets (JWKS) cached locally from `CyIdentity`.
    *   Global rate-limiting, CORS enforcement, and request tracing injections.

### 2.3 Core Domain Layer (Bounded Contexts)
Following [ADR-0018](../adr/ADR-0018-cycom-product-repositioning.md) and [ADR-0026](../adr/ADR-0026-healthcare-credentialing-privileging-strategy.md), the business domains are cleanly decoupled:
*   **CyMed (Clinical Domain):** Manages Electronic Health Records (EHR), Computerized Physician Order Entry (CPOE), and scheduling. No direct dependencies on CyCom's internal schemas.
*   **CyCom (ERP Domain):** Manages Finance, HR, and Procurement.
*   **CyIdentity:** Central Identity Provider (IdP) generating secure standards-based OIDC claims.
*   **CyIntegrationHub:** Adapts external standards (FHIR, HL7 v2/v3, DICOM, EDI) into internal domain events.

---

## 3. Communication Patterns

Logical interactions are divided into synchronous transactional and asynchronous replication paths.

### 3.1 Synchronous Communication (Command/Query API)
*   **Protocol:** gRPC for internal service-to-service calls; REST/GraphQL for Gateway-to-Service communications.
*   **Rule:** Synchronous calls across the `CyMed` / `CyCom` boundary are prohibited to prevent cascading failure chains. All cross-boundary sync queries must utilize local read-only cached projections.

### 3.2 Asynchronous Event-Driven Communication
*   **Pattern:** Transactional Outbox pattern implemented via Debezium and Apache Kafka.
*   **Event Broker:** Apache Kafka.
*   **Event Format:** Schema-validated CloudEvents (JSON/Avro).
*   **Workflow:**
    1.  A service writes to its own database (e.g., admitting a patient in `CyMed`).
    2.  An atomic record is written to the service's `Outbox` database table.
    3.  Debezium streams the change log to the dedicated Kafka topic.
    4.  Consumer services (e.g., `CyCom Finance` for clinical billing) ingest the event and update local schemas.

---

## 4. Tenant Isolation Logical Model

The platform supports logical multi-tenancy as defined in [ADR-0002](../adr/ADR-0002-multi-tenancy-strategy.md):
*   **Metadata Injector:** Gateway parses the incoming JWT and injects `X-Tenant-ID` and `X-User-ID` into upstream HTTP headers.
*   **Logical Partitioning:** Consuming services enforce row-level tenant security (RLS) within shared schemas, or route the request to a dedicated tenant-specific database pool depending on the tenant's tier (SaaS Shared vs. Enterprise Dedicated).

---

## 5. Revision History

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-06-21 | 1.0 | Initial Logical Reference Architecture | Enterprise Architect |
