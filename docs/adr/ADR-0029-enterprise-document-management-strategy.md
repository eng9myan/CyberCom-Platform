# ADR-0029: Enterprise Document Management Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Domain Architect, Enterprise Architect, Compliance Architect, Chief Security Architect |
| **Affects** | CyCom (Documents, Contracts), CyMed (EHR), CyGov (Case management), Platform Storage |
| **Tags** | architecture, documents, storage, compliance |
| **Related** | [ADR-0007](ADR-0007-healthcare-interoperability-strategy.md), [ADR-0018](ADR-0018-cycom-product-repositioning.md), [data_ownership_matrix.md](../architecture/data_ownership_matrix.md) |

---

## 1. Context

CyberCom's products generate millions of documents daily, ranging from clinical records (patient consent forms, radiology scans), to back-office enterprise files (contracts, invoices, employee payroll records), and civic documents (permit applications, vital certificates). 

Without a clear document management strategy:
-   Unstructured files containing PHI or PII could land in non-compliant object storage.
-   Retention schedules (often mandated by tax, healthcare, or government statutes) may be missed.
-   Legal hold requirements during active litigation could be bypassed.

---

## 2. Problem Statement

What is the technical strategy to structure document storage, versioning, e-signature validation, and compliance retention across the CyberCom platform?

---

## 3. Decision Drivers

-   **Domain Isolation:** Clinical documents must stay in the healthcare zone; corporate records in the ERP; civic files in the government zone.
-   **Traceable Integrity:** All documents must be version-controlled and digitally signed where legally required.
-   **Legal Hold & Lifecycles:** Dynamic ability to freeze document deletions during active audits or investigations.
-   **Security Controls:** Enforce encryption, authorization checks, and access audits on every file download.

---

## 4. Considered Options

1.  **Option 1: Centralized Shared Document Repository:** Store all files in a single, platform-wide document database.
2.  **Option 2: Distributed, Domain-Bounded Storage with Unified Metadata Registry, e-Signature APIs, and Centralized Retention Policy Enforcement** (chosen).
3.  **Option 3: External Document Management System (DMS) integration:** Outsource document storage to a third-party enterprise cloud DMS.

---

## 5. Decision

**We choose Option 2.**

The platform enforces a decentralized storage model. Document binaries are stored in domain-isolated object storage buckets (S3-compatible, region-pinned). Document lifecycle policies (retention, archival, legal hold, signature gates) are managed via standard metadata registries inside the owning product context.

```
       [Clinical Document]              [ERP Record]             [Civic Certificate]
                │                            │                            │
                ▼                            ▼                            ▼
      [CyMed EHR Storage]           [CyCom Documents]              [CyGov Storage]
       - HIPAA compliant             - SOX compliant              - Gov-Cloud pinned
       - PHI Encryption              - Finance / HR files         - Case files
```

### 5.1 Document Domain Boundaries

1.  **Clinical Documents (`CyMed`):** Retains clinical consent PDF records, lab reports, imaging scans, and medical summaries. Subject to HIPAA and healthcare retention policies (commonly 7–30 years).
2.  **Enterprise ERP Documents (`CyCom Documents`):** Manages supplier contracts, invoices, POs, tax reports, and employee records. Subject to financial auditing, payroll, and corporate compliance laws (commonly 7–10 years).
3.  **Civic Case Documents (`CyGov`):** Manages permit applications, land registrations, and birth/death certificates. Subject to government records acts (often permanent).

---

## 6. Retention, Archiving & Legal Hold Workflows

### 6.1 Expiration & Deletion Flow
When a document's statutory retention limit expires, the system triggers the deletion sequence:

```
 [Retention Limit Reached] ➔ [Validate Legal Hold Status]
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼ (No active hold)                                    ▼ (Active legal hold)
 [Trigger Purge Runbook]                                    [Freeze Deletion]
 - Erase binary from object bucket                          - Keep files in warm storage
 - Retain metadata skeleton with deletion log               - Log hold reference
```

### 6.2 Legal Hold Overrides
If a legal authority issues a subpoena or audit freeze:
*   A compliance officer sets `legal_hold = true` on the document metadata.
*   This attribute overrides all automated cleanup or deletion scripts, freezing the binary in place until the hold is manually removed by authorized legal counsel.

### 6.3 Digital Signatures
All contracts, medical discharge letters, and official permits must be signed using cryptographic certificates (integrating with regional signature providers like DocuSign, Adobe Sign, or local national PKI networks via CyIntegration Hub). Signed files are locked as **Read-Only** PDFs with embedded cryptographic stamps.

---

## 7. Rationale

-   **Data Security Isolation:** Prevents clinical PHI from transiting into the corporate ERP document buckets, keeping the ERP's HIPAA compliance footprint minimal.
-   **Sovereign Deployment:** Pining object storage buckets to local regions ensures compliance with national data residency laws (such as the UAE Health Data Law).
-   **Legal Integrity:** Lockable, versioned records with cryptographic hashes prevent corporate data tampering or accidental deletions.

---

## 8. Consequences

### 8.1 Positive
- Zero risk of clinical PHI mixing with public or corporate files.
- Scalable, cost-effective object storage.
- Immutable legal hold guarantees.

### 8.2 Negative / Trade-offs
- Multiple object storage buckets to secure and manage (mitigated by unified Terraform templates).

---

## 9. Compliance & Security Impact

*   **SOX Compliance:** Satisfies the audit trail and document preservation requirements for financial corporate transactions.
*   **HIPAA Security Rule §164.312(c)(1):** Enforced by storing SHA-256 integrity hashes for all clinical document binaries to detect file corruption or modification.

---

## 10. Alternatives Rejected

*   **Option 1 (Centralized Shared Repo):** Rejected because it violates HIPAA isolation boundaries and increases the scope of compliance audits for non-clinical products.
*   **Option 3 (External DMS):** Rejected due to high licensing costs, vendor lock-in risks, and the inability to support air-gapped sovereign installations.

---

## Revision History

| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Enterprise Architect | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
