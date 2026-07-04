# ADR-0028: Audit & Legal Record Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Security Architect, Platform Architect, Chief Domain Architect, Compliance Architect |
| **Affects** | All products; Platform Audit Sink, CyData, CyMed, CyCom, CyGov |
| **Tags** | architecture, security, compliance, audit |
| **Related** | [ADR-0005](ADR-0005-identity-access-management-strategy.md), [ADR-0009](ADR-0009-observability-strategy.md), [audit_logging_strategy](../security/audit_logging_strategy.md) |

---

## 1. Context

High-assurance platforms in healthcare and government must maintain absolute, legally admissible records of clinical interventions, financial postings, administrative approvals, and identity-access events. 

To satisfy audit criteria for **The Joint Commission (TJC)** and the **Joint Commission International (JCI)**, audit logs must be:
-   **Immutable:** Non-modifiable and non-deletable, even by database administrators.
-   **Tamper-Evident:** Any modification attempt must be immediately detectable via cryptographic validation.
-   **Traceable:** Linked directly to the authenticated actor, IP address, device posture, and clinical/business purpose-of-use context.

---

## 2. Problem Statement

What is the technical strategy to implement a platform-wide, immutable, and tamper-evident audit logging service that complies with healthcare and government regulations?

---

## 3. Decision Drivers

-   **Legal Admissibility:** Logs must stand up in a court of law as authentic.
-   **Regulatory Compliance:** HIPAA §164.312(b), GDPR Art. 30, and JCI Clinical Record standards.
-   **Performance Overhead:** Writing an audit event must not cause transaction blocking or latency spikes on the primary OLTP thread.
-   **Resilience:** Audit logs must survive system crashes, disk failures, or security breaches.

---

## 4. Considered Options

1.  **Option 1: In-Database Audit Tables:** Each microservice maintains its own relational audit tables with database triggers.
2.  **Option 2: Centralized Cryptographic Audit Sink with Asynchronous Outbox Delivery and Tamper-Evident Hash Chaining** (chosen).
3.  **Option 3: Commercial Third-Party Logging Service:** Route all audit events to an external SaaS logging vendor.

---

## 5. Decision

**We choose Option 2.**

The platform establishes a centralized, append-only **Platform Audit Sink** service. Bounded contexts emit structured JSON audit events asynchronously via their local database outbox. The Audit Sink cryptographically signs, hashes, and chains each log entry, periodically sealing log blocks using external HSM/KMS keys.

```
 [Local Service Transaction] ➔ Writes Outbox Audit Event
                                      │
                                      ▼
                        [Kafka Audit Event Topic]
                                      │
                                      ▼
                           [Platform Audit Sink]
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼ (Hash Chaining)                               ▼ (Storage)
 [Calculate SHA-256 Block Hash]                       [Write to WORM Storage]
 - Link to previous block hash                        - 90-day hot cache
 - Cryptographic sign via KMS                         - Permanent Glacier Archive
```

### 5.1 Cryptographic Chain Schema
Every audit block is linked to its predecessor, creating a blockchain-like integrity verification loop:

$$\text{Block}_n\text{ Hash} = \text{SHA-256}(\text{Payload}_n \parallel \text{Block}_{n-1}\text{ Hash} \parallel \text{Signature}_{KMS})$$

Any modification of an archived block breaks the chain, triggering immediate automated security alerts to the security operations center (SOC).

### 5.2 Mandatory Audit Payload Fields
Every audit event emitted across the platform must conform to the canonical schema:

*   `timestamp`: ISO 8601 UTC.
*   `event_id`: UUIDv7.
*   `tenant_id`: Globally unique tenant identifier.
*   `actor`: User ID, role claims, and IP address.
*   `action`: Standard verb (e.g., `clinical.chart.read`, `ledger.posting.created`).
*   `resource`: Affected resource URI.
*   `purpose_of_use`: Mandatory clinical or operational reason (e.g., `emergency_treatment`, `period_close_reconciliation`).
*   `status`: Success or Failure.

---

## 6. Rationale

-   **Tamper-Evidence:** Hash-chaining and digital signing via HSM/KMS keys prevent rogue admins or intruders from modifying logs to hide unauthorized access.
-   **Performance:** Decoupling audit logging from the primary transactional database via the outbox pattern ensures that database locks are released in sub-milliseconds.
-   **Storage Optimization (Tiered Retention):**
    *   *Hot Tier:* Elasticsearch/OpenSearch for 90 days (fast search for operational incident response).
    *   *Warm Tier:* Object storage for 1 year (compliance reporting, billing validations).
    *   *Cold Tier:* Write-Once-Read-Many (WORM) cloud storage for 7–21 years depending on country-specific healthcare retention laws.

---

## 7. Consequences

### 7.1 Positive
- Strong legal admissibility.
- Full compliance with HIPAA and JCI credential/audit requirements.
- Zero performance impact on core OLTP engines.

### 7.2 Trade-offs
- Increased storage cost due to long-term WORM archiving.
- Slightly higher verification complexity (requires running validator scripts to confirm chain integrity).

---

## 8. Compliance & Security Impact

*   **HIPAA §164.312(b) Audit Controls:** Enforced by logging every clinical action with the actor, IP, and reason.
*   **JCI Standards:** Meets the requirement for tracking all edits to medical records, including pre- and post-modification clinical values.

---

## 9. Alternatives Rejected

*   **Option 1 (In-DB Tables):** Rejected because database administrators with root access can bypass database triggers and modify or delete audit rows, violating the immutability requirement.
*   **Option 3 (SaaS Vendor):** Rejected due to national data residency requirements (KSA PDPL, UAE Health Data Law) which prohibit exporting raw patient audit records to external, non-sovereign clouds.

---

## Revision History

| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Chief Security Architect | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
