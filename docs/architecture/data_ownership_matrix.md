# Data Ownership Matrix

> **Status:** Approved — Program 1, Phase 1.1, updated 2026-06-21 per [ADR-0018](../adr/ADR-0018-cycom-product-repositioning.md) and [ADR-0019](../adr/ADR-0019-cyconnect-communications-platform.md)
> **Owner:** Chief Enterprise Architect + Principal Engineer (Data)
> **Purpose:** Name, for every important data set, **which product owns the source of truth**, who replicates it, the data class, residency, and retention defaults.

> **Change note (2026-06-21):** §3 retitled to **CyConnect** (communications data); a new **§3b CyCom (Enterprise Back-Office / ERP) Data** section captures Finance / HR / Procurement / Inventory / Manufacturing / CRM / Projects / Assets / Quality / Documents / Approvals / Budgeting / Contracts. CyShop §4 clarified to consumer-only; CyGov §5 fee-flow refined to include CyCom AR posting.

Legend:

- **SoR** — System of Record (the only product allowed to write the canonical copy).
- **Replicas** — products that hold projections / read-only copies (typically via events into CyData; never via cross-product DB access).
- **Class** — per `database_standards.md` §13: Public / Internal / Confidential / Restricted (PII) / Restricted (PHI) / Restricted (PCI) / Secret.
- **Residency** — region pinning rules.
- **Retention** — default; legal hold and per-tenant overrides may extend.

---

## 1. Identity & Access Data

| Data set | SoR | Replicas | Class | Residency | Retention |
|---|---|---|---|---|---|
| User accounts (workforce / customer / citizen / partner) | **CyIdentity** | — | Restricted (PII) | Per-realm region | Lifetime of relationship + per-regulation grace |
| Credentials, MFA enrollments, recovery factors | **CyIdentity** | — | Secret | Same region as account | Until removed; rotation logged |
| Sessions & refresh tokens | **CyIdentity** | — | Confidential | Same region | Token TTL; revocation list 30 d |
| Federation configurations / metadata | **CyIdentity** | — | Confidential | Per-tenant | Lifetime of federation + 1 y |
| Consents (identity-level) | **CyIdentity** | CyData (analytics, redacted) | Restricted (PII) | Per-realm region | Per regulation; minimum 6 y where audit-relevant |
| Workload identities (SPIFFE IDs) | **CyIdentity + SPIRE** | — | Internal | Per-cluster | Lifecycle of workload |
| Signing keys & JWKS | **CyIdentity + Vault/KMS** | — | Secret | Per-region | Rotated every 30 d; old versions retained for verify |

---

## 2. Healthcare Data (CyMed)

| Data set | SoR | Replicas | Class | Residency | Retention |
|---|---|---|---|---|---|
| Local MPI (patient master at the hospital) | **CyMed** | CyData (de-identified Bronze→Silver) | Restricted (PHI) | Per-tenant region (BYOK common) | Per national health regulation (commonly 7–30 y) |
| Encounters & ADT | **CyMed** | CyData (de-identified) | Restricted (PHI) | Same | Same |
| EHR (problems, allergies, vitals, observations) | **CyMed** | CyData (de-identified) | Restricted (PHI) | Same | Same |
| Orders (CPOE), administrations (eMAR) | **CyMed** | CyData (de-identified) | Restricted (PHI) | Same | Same |
| Lab results, microbiology, blood bank | **CyMed** | CyData | Restricted (PHI) | Same | Same |
| Imaging metadata; pixel data | **CyMed** (metadata) + DICOM archive via CyIntegration Hub (pixels) | CyData (study refs only) | Restricted (PHI) | Same | Same |
| Scheduling & bed state | **CyMed** | CyData | Restricted (PII/PHI) | Same | Per regulation |
| Charge capture & coding output | **CyMed** | **CyShop** (payment capture), **CyCom Finance** (AR posting), CyData | Restricted (PHI; billing-derived PII) | Same | Per financial-reg + healthcare retention |
| Clinical consents & break-the-glass events | **CyMed** | Platform audit (BTG events) | Restricted (PHI) | Same | Per regulation (audit ≥ 6 y) |

PHI **never** leaves the regulated boundary unless under a BAA and an approved data-flow ADR (esp. toward CyAI vendors).

---

## 3. Communications Data (CyConnect)

| Data set | SoR | Replicas | Class | Residency | Retention |
|---|---|---|---|---|---|
| Channel preferences & opt-in/out | **CyConnect** | CyIdentity (identity-level overlay) | Restricted (PII) | Per-recipient region | Lifetime of recipient + per-regulation |
| Conversation threads & message bodies | **CyConnect** | CyData (metadata only; bodies opt-in by tenant policy) | Confidential (default) or Restricted (PHI/PII when contextual) | Per-tenant region | Per use case (clinical longer; marketing shorter) |
| Delivery attempts, receipts, DLR | **CyConnect** | CyData | Confidential | Same | 1 y default |
| Voice call metadata | **CyConnect** | CyData | Confidential | Per recording-jurisdiction | 1 y default (varies) |
| Voice / video recordings | **CyConnect** | — | Restricted (depending on context) | Per recording-jurisdiction | Per consent + jurisdiction; defaults short |
| Contact-center state (queues, agent assignments) | **CyConnect** | CyData (operational analytics) | Confidential | Per-tenant region | Short hot; long cold for KPI |

---

## 3b. Enterprise Back-Office / ERP Data (CyCom)

Per [ADR-0018](../adr/ADR-0018-cycom-product-repositioning.md). Each ERP module owns its slice; cross-module joins happen within CyCom.

| Data set | SoR | Replicas | Class | Residency | Retention |
|---|---|---|---|---|---|
| Chart of accounts, fiscal calendars, period status | **CyCom Finance** | CyData | Confidential | Per-tenant region | Permanent (with period locks) |
| Journals & sub-ledger postings (immutable; corrections by offset) | **CyCom Accounting** | CyData | Confidential | Same | Per financial-reg (commonly 7–10 y) |
| AR sub-ledger (invoices, receipts, credit notes) | **CyCom Finance** | CyData | Confidential (with PII) | Same | Per financial-reg |
| AP sub-ledger (supplier invoices, payments) | **CyCom Finance** | CyData | Confidential (with PII for sole-proprietor suppliers) | Same | Per financial-reg |
| FX rates & revaluation results | **CyCom Finance** | CyData | Internal | Per-region | Permanent |
| Employee master, organization, positions | **CyCom HR** | CyIdentity (identity attributes), CyData (de-identified) | Restricted (PII) | Per-employee region | Per employment-law retention + grace |
| Leave / performance / benefits | **CyCom HR** | CyData (aggregated, de-identified) | Restricted (PII) | Same | Per employment-law retention |
| Payroll calc results, deductions, statutory filings, payslips | **CyCom Payroll** | CyData (aggregates), CyConnect (delivery refs only) | Restricted (PII; financial) | Same | Per payroll-law (commonly 5–10 y) |
| Supplier master, RFx, POs, GRNs, three-way-match status | **CyCom Procurement** | CyData | Confidential (PII for sole-proprietor suppliers) | Per-tenant region | Per financial-reg + anti-fraud (often long) |
| Items, lots, serials, warehouses, stock balances, valuations | **CyCom Inventory** | CyData | Confidential | Per-tenant region | Per financial-reg |
| BoMs, routings, work orders, operation results, costing | **CyCom Manufacturing** | CyData | Confidential | Per-tenant region | Per industry retention |
| CRM: accounts, contacts, opportunities, activities, B2B sales orders | **CyCom CRM** | CyData | Confidential (PII) | Per-tenant region | Per consent + commercial retention |
| Projects, tasks, timesheets, expenses, project ledgers | **CyCom Projects** | CyData, CyCom Finance | Confidential | Per-tenant region | Per financial-reg |
| Fixed assets, depreciation schedules, maintenance records | **CyCom Assets** | CyData, CyCom Finance | Confidential | Per-tenant region | Lifecycle + per financial-reg |
| Quality plans, inspection results, non-conformance, CAPA | **CyCom Quality** | CyData | Confidential | Per-tenant region | Per industry retention |
| **Enterprise documents** (invoices, POs, contracts, employee files, quality records) — versioned, signed | **CyCom Documents** | CyData (metadata), CyIntegration Hub (e-sign references) | Confidential / Restricted (depending on content) | Per-tenant region | Per record class & jurisdiction |
| Approval workflow definitions, in-flight, history | **CyCom Approvals** | Platform audit (decisions), CyData | Confidential | Per-tenant region | Per financial-reg (approval evidence) |
| Budgets, forecasts, encumbrances, variance | **CyCom Budgeting** | CyData | Confidential | Per-tenant region | Per financial-reg |
| Customer + supplier contracts, terms, obligations, e-sign envelopes | **CyCom Contracts** | CyIntegration Hub (e-sign), CyData | Confidential / Restricted (PII) | Per-tenant region | Contract term + statutory retention |

**PHI does not enter CyCom** except as minimum-necessary fields in charge-capture pass-through (e.g. encounter id, charge code, amount, payer reference). **PCI does not enter CyCom** — capture lives in CyShop; CyCom sees masked transaction references for AR posting.

---

## 4. Consumer Commerce Data (CyShop)

| Data set | SoR | Replicas | Class | Residency | Retention |
|---|---|---|---|---|---|
| Catalog, prices, promotions | **CyShop** | CyData | Internal / Public | Per-tenant region | Lifecycle |
| Carts & sessions | **CyShop** | CyData (abandoned-cart analytics) | Confidential | Same | Short (30–90 d) |
| Orders, fulfillments, returns (consumer) | **CyShop** | **CyCom Finance** (AR posting), CyData | Confidential (with PII) | Same | Per financial-reg (commonly 7 y) |
| Payment **tokens** (no PANs) | **CyShop** (PCI enclave) | — | Restricted (PCI) | Same | Per PCI DSS |
| Payment transactions, refunds, chargebacks | **CyShop** | **CyCom Finance** (AR posting; masked references), CyData (aggregated) | Restricted (PCI / Confidential) | Same | Per financial-reg |
| Subscriptions, invoices, billing schedules (consumer) | **CyShop** | **CyCom Finance**, CyData (financial reporting) | Confidential | Same | Per tax/financial-reg |
| Marketplace sellers, listings, payouts | **CyShop** | **CyCom Finance** (AP for payouts), CyData | Confidential (PII for sellers) | Same | Per regulation |
| Fraud signals & risk decisions | **CyShop** | CyData (de-identified), CyAI (features) | Confidential | Same | 1–2 y |

---

## 5. Government Data (CyGov)

| Data set | SoR | Replicas | Class | Residency | Retention |
|---|---|---|---|---|---|
| Service catalog (government services) | **CyGov** | CyCitizen (cache), CyData | Public / Internal | Per-jurisdiction | Lifecycle |
| Cases / applications & documents | **CyGov** | CyData (KPI metrics, redacted) | Restricted (PII; sometimes PHI when health-services) | Per-jurisdiction (sovereign common) | Per jurisdictional retention |
| Permits & licensing registers | **CyGov** | CyCitizen (lookups), CyData | Restricted (PII) | Per-jurisdiction | Per regulation (often very long) |
| e-Procurement: RFx, bids, evaluations, contracts | **CyGov** | CyData (procurement analytics) | Confidential / Restricted (PII) | Per-jurisdiction | Long retention per anti-fraud rules |
| Civic registers (vital / business / property where SoR) | **CyGov** | CyCitizen (public projections where applicable), CyData | Restricted (PII) | Per-jurisdiction | Often permanent (append-only) |
| Fee & fine **assessments** | **CyGov** | **CyShop** (capture), **CyCom Finance** (AR posting), CyData | Confidential | Per-jurisdiction | Per financial / public-finance reg |
| Regulatory submissions in/out | **CyGov** | CyData | Confidential / Restricted (varies) | Per-jurisdiction | Per sector reg |
| Inter-agency exchange envelopes | **CyGov** | Platform audit | Confidential | Per-jurisdiction | Per gov retention |
| Open-data publications | **CyGov** (curated) | CyData (publication) | Public | Per-jurisdiction | Lifecycle (versions retained) |

---

## 6. Citizen-Facing Data (CyCitizen)

| Data set | SoR | Replicas | Class | Residency | Retention |
|---|---|---|---|---|---|
| Citizen portal UI state, preferences, layout choices | **CyCitizen** | — | Internal | Per-citizen region | Lifetime of relationship |
| Civic engagement (feedback, polls) | **CyCitizen** | CyGov (when becomes a case), CyData | Confidential | Per-jurisdiction | Per engagement policy |
| **Citizen identity, civic records, cases** | **NOT CyCitizen** | — | — | — | Lives in CyIdentity / CyGov |

---

## 7. Integration & Platform Data

| Data set | SoR | Replicas | Class | Residency | Retention |
|---|---|---|---|---|---|
| Partner registrations, API keys (hashed) | **CyIntegration Hub** | Platform audit | Confidential | Per-region | Lifetime of partner |
| Schemas (Avro / JSON-Schema) | **CyIntegration Hub (Schema Registry)** | — | Internal | Per-region | Permanent |
| Connector configurations | **CyIntegration Hub** (secrets in Vault) | — | Confidential | Per-region | Lifecycle |
| Outbox events (transient) | Producing product | **CyIntegration Hub** publishes; CyData consumes | Mirrors source class | Per source | Topic-policy retention |
| Schemas: webhook deliveries | **CyIntegration Hub** | CyData | Confidential | Per-tenant | 90 d default |
| Audit events | **Platform audit sink** | — | Restricted | Per region with replicated cold copy | 90 d hot / 1 y warm / 6+ y cold (regulated) |
| Operational logs | **Platform observability** | — | Confidential | Per region | 30 d hot / 1 y cold |
| Traces & metrics | **Platform observability** | — | Internal | Per region | 30–90 d default |
| Secrets | **Vault / KMS** | — | Secret | Per region | Lifecycle + 90 d versions |

---

## 8. AI Data (CyAI)

| Data set | SoR | Replicas | Class | Residency | Retention |
|---|---|---|---|---|---|
| Model registry metadata | **CyAI** | — | Internal | Per-region | Permanent |
| Vector indexes (per feature, per tenant) | **CyAI** | — | Mirrors source class (often Restricted) | Per-tenant region | Lifecycle of feature |
| Prompts / system prompts / RAG templates | **CyAI** (in git) | — | Internal | Per-region | Permanent |
| Inference logs (redacted) | **CyAI** | CyData (de-identified, aggregate) | Confidential / Restricted | Per-tenant | 30 d hot / 1 y cold (regulated overrides) |
| Eval datasets & results | **CyAI** | — | Confidential | Per-region | Permanent |
| Training run metadata + artifacts | **CyAI** | — | Internal / Confidential | Per-region | Per model lifecycle |
| Guardrail outcomes | **CyAI** | Platform audit (security-relevant), CyData | Confidential | Per-region | Per audit policy |

---

## 9. Cross-Cutting Rules

1. **No cross-product DB reads.** Replicas exist only via events into CyData (or explicit, audited API reads).
2. **PHI** has exactly one SoR (CyMed). Any other product that needs PHI signals does it via FHIR APIs with audit. **PHI does not enter CyCom (ERP)** beyond minimum-necessary charge-capture fields.
3. **PCI** has exactly one SoR (CyShop). No PANs anywhere else — not in CyCom (ERP), not in CyMed, not in CyGov.
4. **General Ledger and AR/AP sub-ledger** have exactly one SoR (**CyCom Finance**). No product writes to its own GL.
5. **Citizen identity attributes** live in CyIdentity; civic data lives in CyGov; CyCitizen renders, never stores SoR.
6. **Audit events** live in the immutable platform sink — never duplicated in product DBs.
7. **Communications data** (preferences, conversations, recordings, DLRs) has exactly one SoR (**CyConnect**). No product runs its own message archive.
8. **Residency** flows from tenant configuration; storage and compute are region-pinned accordingly.
9. **Erasure** propagates from CyIdentity → SoR → replicas; audit events are exempt (legal hold).
10. **Replicas** in CyData are governed by data contracts; breaking the contract is a CI failure.
11. **Classification** flows with data: a copy never has a *lower* class than its source.
12. **Encryption**: at-rest CMK per environment; per-tenant CMK for regulated tenants; field-level for Restricted classes.
13. **Separation of duties** for ERP (Finance / Procurement / Payroll): creator ≠ approver ≠ poster ≠ payer; enforced by the platform policy engine.

---

## 10. Erasure & Consent Propagation

```mermaid
flowchart LR
  REQ[Erasure request<br/>via CyCitizen or CyIdentity] --> CTRL[Control plane]
  CTRL --> CYID[CyIdentity<br/>remove account & PII]
  CTRL --> CYMED[CyMed<br/>erase non-required PHI; keep clinical-legal minima]
  CTRL --> CYSHOP[CyShop<br/>erase PII; retain financial records per law]
  CTRL --> CYGOV[CyGov<br/>per jurisdictional rules]
  CTRL --> CYCONNECT[CyConnect<br/>erase conversations / recordings beyond legal min;<br/>honor opt-out]
  CTRL --> CYCOM[CyCom — ERP<br/>erase HR/PII; retain financial records per law;<br/>retain payroll per statutory min]
  CTRL --> CYDATA[CyData<br/>re-materialize / tombstone marts + indexes]
  CTRL --> CYAI[CyAI<br/>purge vector entries; retrain affected models per cadence]
  AUDIT[(Platform Audit)] -. preserved per regulation .-> CTRL
```

Each product publishes an **erasure runbook** as part of its `RECOVERY.md` and operates against the central erasure-procedure document (planned in `docs/security/erasure-procedure.md`).

---

## 11. Change Process

Same as the other matrices: a data ownership change requires an ADR plus a coordinated PR updating this matrix, the [domain ownership matrix](domain_ownership_matrix.md), the [product boundary matrix](product_boundary_matrix.md), and the affected product architecture docs.
