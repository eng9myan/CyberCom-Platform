# Service Architecture Blueprint

This document defines the responsibilities, endpoints, schemas, dependencies, and deployment structures for every microservice within the CyberCom platform.

---

## 1. CyIdentity Services
*   **Service Name:** `cyidentity-auth-engine`
*   **Responsibilities:** Authenticate users, process multi-factor authentication (WebAuthn), register device passkeys, and issue OAuth 2.1 JSON Web Tokens (JWT).
*   **Inputs:** Login requests, FIDO2 enrollment requests, OIDC client authorization codes.
*   **Outputs:** JWT access tokens, rotating refresh tokens, JWKS public keys.
*   **Events Produced:** `cybercom.cyidentity.session.created`, `cybercom.cyidentity.mfa.enrolled`, `cybercom.cyidentity.keys.rotated`.
*   **Events Consumed:** `cybercom.hr.employee.terminated`.
*   **Dependencies:** Vault (secrets), PostgreSQL (realm configurations).
*   **Ownership:** Identity & Access Management Team.
*   **Future Deployment Model:** Multi-region Active-Active cloud deployment (Kubernetes).

---

## 2. CyIntegrationHub Services
*   **Service Name:** `cyintegrationhub-router`
*   **Responsibilities:** Stateful MLLP socket listener for HL7 v2 messages, DICOMweb router, ZATCA e-invoice clearance processor, and external B2B EDI parser.
*   **Inputs:** Raw HL7 segments, DICOM files, XML invoices, X12 EDI messages.
*   **Outputs:** Standardized internal JSON event payloads, HTTP success/fail codes.
*   **Events Produced:** `cybercom.hub.healthcare.adt.received`, `cybercom.hub.finance.zatca.cleared`.
*   **Events Consumed:** `cybercom.cymed.order.placed`, `cybercom.cycom.invoice.posted`.
*   **Dependencies:** Apache Kafka, S3 Object Storage.
*   **Ownership:** Integrations and Connectivity Team.
*   **Future Deployment Model:** High-availability cluster with Layer 4 active-passive TCP ingress proxies.

---

## 3. CyData Services
*   **Service Name:** `cydata-ingest-spark`
*   **Responsibilities:** Read Kafka transaction topics, scrub PII/PHI datasets, and write analytical files to Apache Iceberg formats.
*   **Inputs:** Live Kafka transaction streams.
*   **Outputs:** Parquet files, Iceberg metadata updates, Star-Schema reporting tables.
*   **Events Produced:** `cybercom.cydata.reports.generated`.
*   **Events Consumed:** All core transactional topics.
*   **Dependencies:** Apache Spark/Flink, Object Store (S3/GCS), Iceberg REST Catalog.
*   **Ownership:** Data Platform and Analytics Team.
*   **Future Deployment Model:** Spark Serverless / Dataproc clusters.

---

## 4. CyAI Services
*   **Service Name:** `cyai-inference-server`
*   **Responsibilities:** Host Triton ML models, evaluate CDS Hooks requests, and validate safety bounds under SaMD regulations.
*   **Inputs:** Clinical features (CPOE drugs, patient metrics), historical inventory data.
*   **Outputs:** Warning cards, confidence indices, demand predictions.
*   **Events Produced:** `cybercom.cyai.prediction.rendered`.
*   **Events Consumed:** `cybercom.cymed.encounter.admitted`.
*   **Dependencies:** NVIDIA GPU-enabled node pools, Model Store (S3).
*   **Ownership:** Medical AI and Decision Support Team.
*   **Future Deployment Model:** Auto-scaling GPU clusters with OPA clinical boundaries.

---

## 5. CyMed Services
*   **Service Name:** `cymed-ehr-cpoe`
*   **Responsibilities:** ELECTRONIC Health Record (EHR) management, clinical charting, patient admission (ADT), and doctor order entries.
*   **Inputs:** FHIR resources via REST API, clinical staff inputs.
*   **Outputs:** FHIR compliance responses, digital prescription sheets.
*   **Events Produced:** `cybercom.cymed.patient.registered`, `cybercom.cymed.order.placed`, `cybercom.cymed.breakglass.invoked`.
*   **Events Consumed:** `cybercom.cyidentity.account.created`.
*   **Dependencies:** PostgreSQL (EHR Partitioned DB), Vault KMS.
*   **Ownership:** Healthcare Clinical Software Team.
*   **Future Deployment Model:** Sovereign Cloud or Local Hospital Edge (Hybrid).

---

## 6. CyCom Services
*   **Service Name:** `cycom-erp-core`
*   **Responsibilities:** General Ledger accounting, HR employee listings, payroll, and corporate procurement.
*   **Inputs:** Procurement requests, employee profile updates, payment vouchers.
*   **Outputs:** Standard JSON financial states, tax XML files, bank ledger records.
*   **Events Produced:** `cybercom.hr.employee.created`, `cybercom.cycom.invoice.posted`.
*   **Events Consumed:** `cybercom.cymed.chargecapture.posted`.
*   **Dependencies:** PostgreSQL (ERP DB).
*   **Ownership:** Enterprise Back-Office Software Team.
*   **Future Deployment Model:** SaaS Cloud (Multi-Tenant).

---

## 7. CyShop Services
*   **Service Name:** `cyshop-commerce-engine`
*   **Responsibilities:** Retail catalogs, basket orders, payment processor handshakes, and shipping fulfillment.
*   **Inputs:** Checkout carts, credit card transaction tokens.
*   **Outputs:** Order summaries, payment status.
*   **Events Produced:** `cybercom.cyshop.order.paid`, `cybercom.cyshop.shipment.dispatched`.
*   **Events Consumed:** `cybercom.cycom.inventory.updated`.
*   **Dependencies:** External Payment Processor APIs (Stripe).
*   **Ownership:** Commerce and Consumer Software Team.
*   **Future Deployment Model:** Multi-region active-active cloud nodes.

---

## 8. CyGov Services
*   **Service Name:** `cygov-civic-registry`
*   **Responsibilities:** Citizen registry details, land deeds, permitting approvals, and BPMN workflow tasks.
*   **Inputs:** Business permit forms, land transfer requests.
*   **Outputs:** Permit approval PDFs (PAdES signed).
*   **Events Produced:** `cybercom.cygov.citizen.updated`, `cybercom.cygov.permit.granted`.
*   **Events Consumed:** `cybercom.cyidentity.keys.rotated`.
*   **Dependencies:** Camunda Engine, PostgreSQL (Gov DB).
*   **Ownership:** Public Sector Development Team.
*   **Future Deployment Model:** Sovereign Government Cloud (VPC Isolated).

---

## 9. CyConnect Services
*   **Service Name:** `cyconnect-notification-router`
*   **Responsibilities:** Dispatch outbound SMS, emails, and push alerts; manage secure clinician chat.
*   **Inputs:** Delivery payloads (Kafka events).
*   **Outputs:** SMS gateway packets, SMTP transmissions.
*   **Events Produced:** `cybercom.cyconnect.message.delivered`.
*   **Events Consumed:** `cybercom.cymed.order.placed`, `cybercom.cycom.invoice.posted`.
*   **Dependencies:** SMTP Gateways, External Telco APIs, Matrix HomeServer.
*   **Ownership:** Communications Platform Team.
*   **Future Deployment Model:** Multi-AZ container deployment.

---

## 10. CyCitizen Services
*   **Service Name:** `cycitizen-portal-aggregator`
*   **Responsibilities:** Frontend backend-for-frontend (BFF) aggregator compiling citizen metrics.
*   **Inputs:** GraphQL queries, user profiles.
*   **Outputs:** Aggregated JSON states.
*   **Events Produced:** `cybercom.cycitizen.portal.accessed`.
*   **Events Consumed:** `cybercom.cygov.permit.granted`.
*   **Dependencies:** `CyGov` services, `CyIdentity` realms.
*   **Ownership:** Civic Frontend Team.
*   **Future Deployment Model:** Multi-region SaaS clusters.

---

## 11. Revision History

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-06-21 | 1.0 | Initial Service Architecture | Enterprise Architect |
