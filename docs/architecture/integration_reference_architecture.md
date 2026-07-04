# Integration Reference Architecture

## 1. Enterprise Integration Hub Overview

The Integration Reference Architecture details how the CyberCom Platform connects with external medical hardware, national registries, corporate supply chains, tax authorities, and client systems. The core router for all external interactions is **CyIntegrationHub**.

```mermaid
graph TD
    classDef internal fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px;
    classDef hub fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
    classDef external fill:#ffebee,stroke:#c62828,stroke-width:2px;

    subgraph CyberCom Platform Internal
        Kafka[("Kafka Event Broker")]:::internal
        CyMed["CyMed Clinical Context"]:::internal
        CyCom["CyCom ERP Context"]:::internal
    end

    subgraph CyIntegrationHub
        MLLP["MLLP / TCP Adapter<br/>HL7 v2 ADT/ORU"]:::hub
        FHIR_Engine["SMART on FHIR Gateway<br/>FHIR R4/R5 Rest APIs"]:::hub
        DICOM_Engine["DICOM Web Router<br/>QIDO / WADO / STOW"]:::hub
        EDI_Engine["EDI Translation Engine<br/>X12 / EDIFACT"]:::hub
        Tax_Gateway["Tax Compliance Router<br/>ZATCA XML / Signatures"]:::hub
    end

    subgraph External Systems
        EHR["Legacy Hospital EHRs"]:::external
        PACS["Hospital DICOM PACS / Imaging"]:::external
        Suppliers["B2B Suppliers (EDI)"]:::external
        GovTax["Gov Tax / ZATCA Portal"]:::external
        NationalRegistry["National Health Registry"]:::external
    end

    EHR --> MLLP
    PACS <--> DICOM_Engine
    Suppliers <--> EDI_Engine
    GovTax <--> Tax_Gateway
    NationalRegistry <--> FHIR_Engine

    MLLP & FHIR_Engine & DICOM_Engine & EDI_Engine & Tax_Gateway <--> Kafka
    Kafka <--> CyMed & CyCom
```

---

## 2. Healthcare Interoperability

CyberCom is fully compliant with modern and legacy healthcare integration standards:

### 2.1 HL7 v2 / v3 Integration
*   **Transport:** TCP/IP socket connection using the Minimal Lower Layer Protocol (MLLP).
*   **Use Cases:** Stream admission, transfer, and discharge events (ADT), lab orders (ORM), and lab results (ORU).
*   **Adapter:** `CyIntegrationHub` ingests MLLP messages, parses the segments, maps them into JSON payloads, and publishes them to Kafka.

### 2.2 FHIR R4 & R5 Strategy
*   **SMART on FHIR:** Supported to allow external application launches within the clinical EHR layout using OAuth 2.1 token validation.
*   **Data Models:** Patient, Encounter, Observation, DiagnosticReport, and MedicationRequest mapped natively to the `CyMed` domain.

### 2.3 DICOM (Medical Imaging)
*   **Web Interfaces:** Supports DICOMweb APIs:
    *   `QIDO-RS` (Query based on RESTful Web Services).
    *   `WADO-RS` (Retrieve based on RESTful Web Services).
    *   `STOW-RS` (Store based on RESTful Web Services).
*   **Router:** CyIntegrationHub routes metadata to `CyMed` while forwarding heavy binary pixel data directly to tenant-specific S3-compatible cold stores.

---

## 3. Financial and Government Integrations

### 3.1 ZATCA & Tax E-Invoicing
*   **Jurisdiction Compliance:** Complies with Saudi Arabia (ZATCA Phase 2), UAE, and Jordan e-invoicing laws.
*   **Requirements:**
    *   XML invoice generation with embedded cryptographic signatures.
    *   Universally Unique Invoice Identifiers (UUID) and cryptographic hash chaining from the preceding invoice.
    *   Integration with ZATCA APIs for real-time clearance (for B2B) and reporting (for B2C).

### 3.2 B2B EDI Supply Chain
*   **Standards:** ANSI X12 and UN/EDIFACT.
*   **Transactions:**
    *   EDI 850 (Purchase Order).
    *   EDI 856 (Advance Ship Notice).
    *   EDI 810 (Invoice).

---

## 4. Platform API Gateway Specifications

All synchronous external APIs are published using standard formats:
*   **REST/OpenAPI:** The standard for internal and external developer APIs. Configured with strict OpenAPI 3.1 definitions.
*   **GraphQL:** Used at the Web Client/Presentation edge to aggregate multiple backend queries into a single HTTP request (preventing over-fetching).
*   **Webhooks:** Outbound events are signed with tenant-specific secret keys (HMAC-SHA256) inside the `X-CyberCom-Signature` header to allow safe external consumer consumption.

---

## 5. Revision History

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-06-21 | 1.0 | Initial Integration Reference Architecture | Enterprise Architect |
