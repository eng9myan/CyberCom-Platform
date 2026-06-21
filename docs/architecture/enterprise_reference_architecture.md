# Enterprise Reference Architecture

## 1. Introduction

The Enterprise Reference Architecture defines the overarching design rules, technical policies, and system layout for the CyberCom Platform. It acts as the master framework under which all sub-architectures operate, ensuring that the clinical (`CyMed`), enterprise resource planning (`CyCom`), identity (`CyIdentity`), and public-sector (`CyGov`) modules compose safely, securely, and scalably.

```mermaid
graph TD
    subgraph Clients
        Web["Web Portals"]
        Mob["Mobile Apps"]
        MedDev["Medical Devices / HL7 Systems"]
    end

    subgraph Security Boundary
        GW["API Gateway (Kong Enterprise)"]
        Mesh["Service Mesh (Envoy / mTLS)"]
    end

    subgraph Core Platform Domains
        ID["CyIdentity (IAM)"]
        Med["CyMed (Clinical)"]
        Com["CyCom (ERP)"]
        Int["CyIntegrationHub"]
    end

    subgraph Shared Data & Storage
        Kafka[("Kafka Event Broker")]
        DBs[("PostgreSQL Clusters (RLS / Patroni)")]
        Vault[("HashiCorp Vault KMS")]
    end

    Web & Mob --> GW
    MedDev --> Int
    GW --> Mesh
    Mesh --> ID & Med & Com & Int
    ID & Med & Com & Int --> Shared Data & Storage
```

---

## 2. Core Architectural Principles

1.  **Strict Domain Decoupling:** In accordance with [ADR-0018](../adr/ADR-0018-cycom-product-repositioning.md) and [ADR-0026](../adr/ADR-0026-healthcare-credentialing-privileging-strategy.md), transactional processes in `CyMed` (e.g., patient encounters, clinical charting) must never depend synchronously on `CyCom` (e.g., employee HR state, general ledger postings). Decoupling is maintained via local read caches.
2.  **Zero Trust Security:** Access verification is mandatory for every user and workload at the API gateway and service boundaries, utilizing passwordless WebAuthn and ABAC policies.
3.  **Outbox-Driven Event Replication:** Data synchronization across domains uses Debezium CDC and Apache Kafka, avoiding direct cross-service SQL joins and synchronous REST blocking calls.
4.  **Sovereign Compliance:** Physical deployments isolate database records to local regional zones to comply with local healthcare privacy (HIPAA) and citizen data laws (KSA PDPL, UAE DOH).

---

## 3. Sub-Reference Architectures Directory

To examine specific aspects of the CyberCom Platform design, refer to the following dedicated reference guides:

*   **[Logical Reference Architecture](logical_reference_architecture.md):** Defines logical layers (Presentation, Gateway, Bounded Contexts, Event Bus) and service boundaries.
*   **[Physical Reference Architecture](physical_reference_architecture.md):** Hardware specifications, cluster setups, network DMZs, and HSM deployments.
*   **[Database Reference Architecture](database_reference_architecture.md):** PostgreSQL standards, UUIDv7 indexing benefits, Row-Level Security (RLS) multi-tenancy, and partitioning.
*   **[Security Reference Architecture](security_reference_architecture.md):** Zero Trust identity flow, dynamic ABAC policies, cryptographic standards, and clinical Break-Glass protocols.
*   **[Integration Reference Architecture](integration_reference_architecture.md):** Details HL7 v2 ADT sockets, SMART on FHIR endpoints, DICOMweb, ZATCA e-invoicing compliance, and B2B supply chain EDI.
*   **[Deployment Reference Architecture](deployment_reference_architecture.md):** SaaS, Private Cloud, Government Cloud, Hybrid, On-Premise, and Air-Gapped deployment profiles.
*   **[Observability Reference Architecture](observability_reference_architecture.md):** Structured JSON logs, RED/USE metrics, distributed trace propagation, and domain SLOs.
*   **[Multi-Tenant Reference Architecture](multi_tenant_reference_architecture.md):** Tenant isolation models, schema vs database pools, onboarding lifecycles, and resource quotas.
*   **[Master Data Reference Architecture](master_data_reference_architecture.md):** Defines Systems of Record (SoR) and golden record survivorship rules.
*   **[Document Reference Architecture](document_management_reference_architecture.md):** Regulates clinical/ERP document zones, digital signatures, and retention schedules.
*   **[Environment Reference Architecture](reference_environment_architecture.md):** Sizing and data masking configurations for Dev, Test, UAT, Training, Staging, and Production.

---

## 4. Revision History

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-06-21 | 1.0 | Initial Master Reference Architecture | Enterprise Architect |
