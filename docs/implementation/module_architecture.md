# Module Architecture & Customization Strategy

This document defines the modular structure of CyberCom applications, specifying core, supporting, and extension boundaries, along with tenant customization and upgrade guidelines.

---

## 1. Product Modular Breakdown

Each platform product divides its internal code structure into distinct modules to maintain decoupling:

```
+-------------------------------------------------------------+
|                     Product Boundary                        |
|                                                             |
|  +-----------------+  +-----------------+  +--------------+ |
|  |   Core Module   |  |Supporting Module|  |Shared Module | |
|  |  (EHR/Fin GL)   |  | (Billing/Roster)|  | (Crypto/SDK) | |
|  +-----------------+  +-----------------+  +--------------+ |
|                                                             |
|  +-------------------------------------------------------+  |
|  |                     Plugin Bridge                     |  |
|  +-------------------------------------------------------+  |
|                               |                             |
+-------------------------------|-----------------------------+
                                ▼
                   +------------------------+
                   |    Extension Module    |
                   |   (Custom Hospital)    |
                   +------------------------+
```

### 1.1 CyMed Modules
*   **Core:** Patient Context, EHR Engine, CPOE.
*   **Supporting:** Scheduling, Ward Management, Bed Allocation.
*   **Shared:** ICD-11 Terminology Resolver, Consent Validator.
*   **Extension:** Specialized ICU and Oncology workflow cards.

### 1.2 CyCom Modules
*   **Core:** General Ledger, HR Employee Registry.
*   **Supporting:** Accounts Payable/Receivable, Procurement routing, Payroll compute.
*   **Shared:** Tax calculation wrappers (ZATCA signature generators).
*   **Extension:** Manufacturing router extensions, customized CRM templates.

---

## 2. Plugin & Customization Strategy

To support multi-tenant customization without modifying the core codebase (which would prevent clean platform upgrades):

### 2.1 Dynamic Attribute Customization (Metadata Schemas)
*   **Database JSONB Columns:** High-level entities (e.g., `Patient`, `Supplier`) contain a `metadata JSONB` column.
*   **Schema Registry Configuration:** Tenants define custom fields (e.g., specific intake questions) inside a JSON Schema config file. The API validates submissions against the tenant's schema before saving to the JSONB column.

### 2.2 Event-Driven Extension Hooks
*   Third-party systems or tenant plugins extend functionality by consuming specific Kafka topics (e.g., `cybercom.cymed.order.placed`) and returning results via specific APIs, avoiding deep in-process code injections.

---

## 3. Upgrade and Migration Strategy

To guarantee that upgrading the core platform does not break tenant extensions:
1.  **Contract Immutability:** Public API payloads and Avro schemas undergo backward-compatibility checks in CI pipelines.
2.  **API Gateway Deprecation Policy:** Deprecated schemas must remain active for 6 months (returning Sunset headers) before removal.
3.  **Isolation:** Custom tenant-written views or reports query secondary read replicas (`CyData` or read replicas), protecting main transactional database performance during upgrades.

---

## 4. Revision History

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-06-21 | 1.0 | Initial Module Architecture | Enterprise Architect |
