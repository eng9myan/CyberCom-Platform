# ADR-0027: Master Data Management Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Domain Architect, Enterprise Architect, Platform Architect, Chief Software Architect |
| **Affects** | All products; CyIdentity, CyIntegration Hub, CyData, CyMed, CyCom, CyShop, CyGov |
| **Tags** | architecture, mdm, data, governance |
| **Related** | [ADR-0002](ADR-0002-multi-tenancy-strategy.md), [ADR-0004](ADR-0004-event-driven-architecture-strategy.md), [domain_ownership_matrix.md](../architecture/domain_ownership_matrix.md) |

---

## 1. Context

As a multi-tenant, multi-product enterprise platform, CyberCom manages key master data entities (e.g., Patients, Citizens, Employees, Products, and Suppliers) across adjacent business domains. Without a clear Master Data Management (MDM) strategy:
-   Data duplication occurs (e.g., patient identity attributes duplicated in billing, scheduling, and EHR databases).
-   Conflict of truth arises (e.g., an employee is active in HR but terminated in the active login database).
-   Circular synchronization patterns degrade system reliability.

---

## 2. Problem Statement

What is the technical strategy to define system of record (SoR) ownership, synchronization triggers, and golden record reconciliation rules for CyberCom's key master data domains?

---

## 3. Decision Drivers

-   **One Source of Truth:** Every master data field has exactly one writing SoR.
-   **Decoupled Sync:** Microservices must not perform synchronous cross-domain database reads to retrieve master attributes.
-   **Compliance & Privacy:** Support HIPAA, GDPR, and regional residency rules (KSA PDPL, UAE DOH).
-   **High Availability:** Local systems must remain functional during network cuts using cached projections.

---

## 4. Considered Options

1.  **Option 1: Shared Database Model:** Store all master records in a single database shared across all products.
2.  **Option 2: Outbox-Driven Event Replication with Decoupled Systems of Record (SoR) and cached local projections** (chosen).
3.  **Option 3: Real-Time Federated RPC Queries:** Request master data attributes synchronously from the owning service during every transaction.

---

## 5. Decision

**We choose Option 2.** 

Each master data entity is owned by exactly one writing System of Record (SoR). Changes are published asynchronously to Kafka using the Outbox pattern. Other services consume these events to maintain read-only cached projections locally.

### 5.1 Master Data Entity Ownership Registry

| Entity Master | Writing System of Record (SoR) | Primary Cached Consumers | Key Reference Identifiers |
|---|---|---|---|
| **Patient Master** | `CyMed Patient Context` | `CyData`, `CyShop` (billing) | `patient_id` (UUIDv7), local MRN |
| **Citizen Master** | `CyGov Registry Context` | `CyCitizen`, `CyIdentity` | `citizen_id` (UUIDv7), National ID |
| **Employee Master** | `CyCom HR` | `CyIdentity`, `CyMed`, `CyData` | `employee_id` (UUIDv7), email |
| **Provider Master** | `CyMed Scheduling` | `CyIdentity`, `CyCom HR` | `provider_id` (UUIDv7), License Num |
| **Supplier Master** | `CyCom Procurement` | `CyCom Finance`, `CyData` | `supplier_id` (UUIDv7), Tax Reg |
| **Product Master (Retail)**| `CyShop Catalog` | `CyData` | `sku` (String), UPC/EAN |
| **Product Master (Med)** | `CyMed Pharmacy` | `CyShop` (fulfillment), `CyData` | `ndc_code` (National Drug Code) |
| **Organization Master** | `CyCom HR` | All Products | `org_id` (UUIDv7), Department ID |
| **Facility Master** | `CyCom HR` | `CyMed`, `CyGov` | `facility_id` (UUIDv7) |
| **Location Master** | `CyCom HR` (HQ) / `CyMed` (Clinics) | `CyIdentity` (RBAC/ABAC context) | `location_id` (UUIDv7) |
| **Asset Master** | `CyCom Fixed Assets` | `CyCom Maintenance`, `CyData` | `asset_tag` (String), Serial Num |

---

## 6. Golden Record & Reconciliation Strategy

When master data is imported from external partner systems (e.g., syncing external lab providers, national citizen registers, or hospital legacy databases via CyIntegration Hub), the platform applies a **Golden Record Resolution Flow**:

```
 [Inbound External Profile] ➔ [Identify Matching Attributes] (National ID, Email, Phone)
                                         │
                                         ▼
                             [Matching Algorithm Checks]
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        ▼ (Match Score > 95%)                                             ▼ (Match Score 70% - 95%)
 [Auto-Merge into Golden Record]                                   [Create Validation Ticket]
 - Retain original source lineage                                 - Route to Admin Queue
 - Broadcast update event                                         - Flag potential duplicate
```

### Conflict Resolution Principles:
1.  **Attribute Survivorship Rules:** System-defined precedence tables. E.g., a national business register update overrides manual supplier contact entries in CyCom.
2.  **Immutability of History:** Reconciliations do not overwrite historical states. The database retains a signed version history of all merges.

---

## 7. Rationale

-   **Zero Coupling:** Prevents direct SQL joins and synchronous REST bottlenecks across products.
-   **Resilience:** Local ward clinicans can continue admitting patients and placing orders even if the connection to the core corporate HR system is cut, because CyMed has a cached local projection of active provider credentials.
-   **Security Compliance:** Simplifies data residency enforcement by pinning master database instances to local regional zones while replicating anonymized metadata to the analytics warehouse (CyData).

---

## 8. Consequences

### 8.1 Positive
- Clear and audit-logged data ownership.
- High-performance lookups utilizing cached local projections.
- Auto-reconciliation reduces manual registration errors.

### 8.2 Negative / Trade-offs
- Eventual consistency delay (typically 100ms - 500ms).
- Temporary "split-brain" states if event brokers are offline (mitigated by setting strict outbox retries).

---

## 9. Compliance & Security Impact

*   **GDPR Art. 25 (Privacy by Design):** The golden record model ensures that citizen data erasure requests (Right to be Forgotten) propagate cleanly from the master SoR to all cached projections.
*   **HIPAA §164.312 (Data Integrity):** The append-only history of the Patient Master prevents unauthorized modifications of clinical registries.

---

## 10. Alternatives Rejected

*   **Option 1 (Shared Database):** Rejected because it causes tight coupling, schema deployment lock-in, and violates the microservice isolation principles of ADR-0008 and ADR-0011.
*   **Option 3 (Real-Time RPC):** Rejected because clinical and checkout flows require sub-second reliability. Relying on synchronous HTTP/REST queries to external HR or registry databases during an active trauma admission or retail checkout introduces a high risk of transaction timeout.

---

## Revision History

| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Enterprise Architect | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
