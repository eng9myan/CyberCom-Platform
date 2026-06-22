# Competitive Roadmap Matrix

This matrix prioritizes feature developments over a 3-year roadmap to close competitive gaps and consolidate CyberCom's advantages.

## 1. Feature Prioritization

*   **Must-Have (M):** Mandatory for regulatory compliance, security, or baseline transactions. Required in Year 1.
*   **Should-Have (S):** Enhances developer experience, operational speed, or workflow automation. Target in Year 2.
*   **Nice-To-Have (N):** Specialized industry verticals, predictive models, or experimental integrations. Target in Year 3.

| Feature Area | Product | Priority | Year Target | Description |
|---|---|---|---|---|
| **ZATCA Phase 2** | `CyCom` | Must-Have (M) | Year 1 | Native e-invoicing clearance APIs. |
| **FHIR Core EHR** | `CyMed` | Must-Have (M) | Year 1 | Patient registry, scheduling, clinical observations. |
| **WebAuthn MFA** | `CyIdentity` | Must-Have (M) | Year 1 | Cryptographic passkey support. |
| **mTLS Mesh** | Platform | Must-Have (M) | Year 1 | Envoy service mesh configuration. |
| **RTL Layout Flow** | UI/UX | Must-Have (M) | Year 1 | CSS Logical properties and Arabic translations. |
| **HL7 MLLP Gateway**| `CyIntegrationHub`| Must-Have (M) | Year 2 | Stateful ADT TCP listener. |
| **BPMN Workflows** | `CyGov` | Should-Have (S)| Year 2 | Camunda integration for permitting. |
| **Matrix E2EE Chat** | `CyConnect` | Should-Have (S)| Year 2 | Encrypted clinician messaging. |
| **Pact Testing** | QA | Should-Have (S)| Year 2 | API contract verification. |
| **Iceberg Ingest** | `CyData` | Should-Have (S)| Year 2 | Spark-based PII scrubbing pipeline. |
| **Triton ML Model** | `CyAI` | Should-Have (S)| Year 3 | Inference serving. |
| **Offline Wallet** | `CyCitizen` | Should-Have (S)| Year 3 | Offline QR civic ID. |
| **Mobile POS (mPOS)**| `CyShop` | Nice-to-Have (N)| Year 3 | Mobile checkout for retail pharmacy. |
| **Treasury Forecast**| `CyCom` | Nice-to-Have (N)| Year 3 | FX hedging and cash pools. |
| **Oncology Paths** | `CyMed` | Nice-to-Have (N)| Year 3 | Specialized chemotherapy charting. |

---

## 2. Multi-Year Implementation Roadmap

### 2.1 Year 1 (Programs 2 & 3)
*   **Focus:** Core Foundations, Identity, and Basic Ledgers.
*   **Deliverables:** `CyIdentity` Realms, Kong API Gateway, PostgreSQL RLS schema deployments, `CyMed` Patient MPI, encounters, clinical core registries, `CyCom` GL accounts, and the Clinical Terminology Foundation (Program 2.10 and Phase 3.0 completed).

### 2.2 Year 2 (Program 4)
*   **Focus:** Interoperability and Transactions.
*   **Deliverables:** `CyIntegrationHub` MLLP/DICOM, `CyCom` Procurement/Inventory, and `CyShop` e-commerce checkout.

### 2.3 Year 3 (Programs 5 & 6)
*   **Focus:** Mobility, AI, and Advanced Analytics.
*   **Deliverables:** `CyCitizen` Mobile Digital Wallet, `CyConnect` Matrix chat, Triton inference serving, and Apache Iceberg analytical warehouses.

---

## 3. Revision History

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-06-21 | 1.0 | Initial Roadmap Matrix | Enterprise Architect |
| 2026-06-22 | 1.1 | Mark Phase 3.0 Core Clinical Platform Complete | Claude Code / Antigravity |
| 2026-06-22 | 1.2 | Mark Program 2.10 Clinical Terminology Foundation Complete | Claude Code / Antigravity |


