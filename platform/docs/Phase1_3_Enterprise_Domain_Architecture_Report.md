# Phase 1.3 Enterprise Domain Architecture Report

> **Program:** Program 1 — Platform Foundation  
> **Phase:** Phase 1.3 — Enterprise Domain Design  
> **Date:** 2026-06-21  
> **Status:** ✅ Complete  

This report consolidates the **Enterprise Domain Architecture** for the CyberCom Platform, detailing the sub-domain classifications, bounded contexts, entities, and event integrations across all 10 products.

---

## 1. Files Created & Bounded Contexts

We have created the following core architectural blueprints under `docs/` and `docs/domain-models/`:

1.  **[enterprise_domain_architecture.md](architecture/enterprise_domain_architecture.md):** Defines the overall enterprise Bounded Context map, entity ownership table, integration event mappings, and future microservice database boundaries.
2.  **[cyidentity_domain_model.md](domain-models/cyidentity_domain_model.md):** Specifies aggregates for Realm, UserAccount, and ConsentRecord, including token claims and MFA policies.
3.  **[cyintegrationhub_domain_model.md](domain-models/cyintegrationhub_domain_model.md):** Outlines aggregates for APIProduct, SchemaDefinition, and OutboxPublishJob, detailing protocol bridges.
4.  **[cydata_domain_model.md](domain-models/cydata_domain_model.md):** Architects the IcebergTable, DataContract, and FeatureSet aggregates, including de-identification pipelines.
5.  **[cyai_domain_model.md](domain-models/cyai_domain_model.md):** Specifies the RegisteredModel, PromptTemplate, and AgentSession aggregates, outlining guardrail integrations.
6.  **[cymed_domain_model.md](domain-models/cymed_domain_model.md):** Maps all 22 clinical sub-domains, detailing Patient, Encounter, ClinicalOrder, and ChargeCapture aggregates.
7.  **[cycom_domain_model.md](domain-models/cycom_domain_model.md):** Maps all 18 ERP contexts, detailing GeneralLedgerJournal, EmployeeHRRecord, and PurchaseOrder aggregates with Separation of Duties policies.
8.  **[cyshop_domain_model.md](domain-models/cyshop_domain_model.md):** Maps all 7 consumer commerce areas, detailing CustomerOrder, PaymentToken (PCI), and SubscriptionPlan aggregates.
9.  **[cygov_domain_model.md](domain-models/cygov_domain_model.md):** Maps all 8 public sector contexts, detailing ServiceCase, PermitRecord, CivicRegisterEntry (vital records), and GovernmentTender aggregates.
10. **[cyconnect_domain_model.md](domain-models/cyconnect_domain_model.md):** Specifies the DeliveryJob, MessageTemplate, ConversationThread, and ContactCenterQueue aggregates.
11. **[cycitizen_domain_model.md](domain-models/cycitizen_domain_model.md):** Outlines the PortalSession and EngagementSurvey aggregates, enforcing WCAG accessibility.
12. **[Phase1_3_Enterprise_Domain_Architecture_Report.md](Phase1_3_Enterprise_Domain_Architecture_Report.md):** (This report).

---

## 2. Architecture Decisions (AD-0027 through AD-0032)

### AD-0027: Domain Classifications Strategy
*   **Context:** Unregulated domain ownership leads to overlapping databases and dual-write conflicts.
*   **Decision:** Every product sub-domain is classified as Core (differentiating business value), Supporting (specialized operational needs), or Generic (horizontal platform capabilities). Only one product context can act as the System of Record (SoR) for any given entity.

### AD-0028: Outbox Pattern as Standard Event Publisher
*   **Context:** Multi-step transactions (e.g., updating database and publishing message) are prone to dual-write failures when brokers are offline.
*   **Decision:** All bounded contexts must utilize the Outbox pattern. Events are written to local database tables within the same transaction as the entity edit; a daemon publisher subsequently transfers them to Kafka.

### AD-0029: Bounded Context Database Isolation
*   **Context:** Direct SQL joins across product databases cause tight coupling, blocking independent releases.
*   **Decision:** Each bounded context maintains its own isolated database instance. Cross-context queries are strictly forbidden. Data sharing must occur via Kafka events or REST APIs.

### AD-0030: Shared Kernel Token Claim Standards
*   **Context:** Downstream services need quick authentication and role checks to maintain low latency.
*   **Decision:** standard OIDC JWT claims are defined for the Workforce realm, containing `active_ward_id`, `role_claims`, and `credential_status` (issued by CyIdentity).

### AD-0031: Anti-Corruption Layer for Legacy Formats
*   **Context:** Direct ingestion of legacy formats (HL7 v2, DICOM, ISO 20022) into core product databases pollutes clean domain models.
*   **Decision:** CyIntegration Hub operates as an Anti-Corruption Layer (ACL), translating all inbound legacy messages into clean JSON/FHIR formats before publishing them to internal Kafka topics.

### AD-0032: Gold-Layer De-Identification Pipeline
*   **Context:** Exporting raw database columns containing patient/citizen PII for analytics or ML training violates privacy laws.
*   **Decision:** CyData enforces an automated de-identification pipeline (Safe Harbor guidelines) when copying data from the Silver (cleansed) to the Gold (analytical) medallion layer.

---

## 3. Risks & Mitigations

| Risk # | Description | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| **R1** | **Outbox Publisher Latency:** Message delivery lag could impact immediate downstream actions (e.g., payment success to delivery trigger). | Low | Medium | Configure outbox daemons to poll every 100ms. Provide high-priority lanes for transaction topics. |
| **R2** | **Event Schema Drift:** Changes to producer events breaking downstream consumer models. | Medium | High | Enforce strict Schema Registry validations in CI/CD pipelines. Block commits that violate backward compatibility. |
| **R3** | **Data Consistency Gaps:** Asynchronous updates causing temporary UI mismatch. | Medium | Low | Enforce eventual consistency patterns in the UI/UX design (e.g., optimistic updates, loading states). |

---

## 4. Recommendations & Future Enhancements

1.  **Introduce Cedar for Authorization Policy Files:** Deferring the final policy file format to Cedar will allow the security team to write human-readable, testable policy logic for ABAC gates.
2.  **Schema Conformance Testing in CI:** Implement automated API contract tests (using Pact or similar) during PR builds to catch contract breakages before deployment.
3.  **Establish Domain-Driven Monitoring Metrics:** Add custom OTel counters tracking business metrics (e.g., `orders.placed.count`, `authentications.failed.rate`) to detect logical system anomalies.

---

## 5. Readiness For Phase 1.4

With the complete Enterprise Domain Architecture defined and documented:

*   [x] Bounded contexts and aggregates mapped.
*   [x] Bounded Context database isolation enforced in design.
*   [x] Outbox pattern mandated for event delivery.
*   [x] All 12 files successfully created, committed, and pushed to GitHub.

**Recommendation:** Proceed immediately to **Phase 1.4: Database & Schema Design**.
