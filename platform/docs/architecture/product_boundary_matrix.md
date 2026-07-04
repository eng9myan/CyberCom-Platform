# Product Boundary Matrix

> **Status:** Approved — Program 1, Phase 1.1, updated 2026-06-21 per [ADR-0018](../adr/ADR-0018-cycom-product-repositioning.md) and [ADR-0019](../adr/ADR-0019-cyconnect-communications-platform.md)
> **Owner:** Chief Enterprise Architect
> **Purpose:** Settle, in one place, **what belongs in which product** and what each one explicitly does **not** do — so feature debates have a single source of truth.

This matrix is **normative**. A new capability that does not fit cleanly into one product requires either (a) an ADR placing it, or (b) extension of the relevant product's scope via PR.

> **Change note (2026-06-21):** CyCom has been repositioned as the enterprise back-office (ERP). Communications now live in **CyConnect**. The previous "CyCom = communications" rows have moved to §1.2 CyConnect; new "CyCom = ERP" rows are in §1.3.

---

## 1. Per-Product "In / Out" Summary

### 1.1 CyMed (Healthcare)

| ✅ In CyMed | ❌ Not in CyMed |
|---|---|
| Patient registration, encounters, ADT | Customer identity & login (→ CyIdentity) |
| Clinical orders (CPOE), eMAR, results | Patient bill payment (→ CyShop captures; CyCom Finance posts AR) |
| Pharmacy (clinical: formulary, dispensing) | Retail pharmacy fulfillment & checkout (→ CyShop) |
| Lab, imaging worklists, blood bank | PACS image storage; carrier delivery (→ via CyIntegration Hub) |
| Nursing care, scheduling, beds, OR | SMS / email / push / voice to patients (→ CyConnect) |
| Charge capture, ICD-11 coding | Invoicing & receipts (→ CyShop / CyCom Finance) |
| Consent (clinical purpose-of-use) | Identity consent capture (→ CyIdentity) |
| Break-the-glass + post-review | Audit log storage (→ Platform audit sink) |
| Population-level clinical insights *use* | Population-level clinical analytics *store* (→ CyData) |
| Clinical decision authority | Model serving / inference (→ CyAI) |

### 1.2 CyConnect (Omnichannel Communications)

| ✅ In CyConnect | ❌ Not in CyConnect |
|---|---|
| Channel adapters (SMS / MMS / RCS / email / push / WhatsApp / voice / video) | Authoring of clinical / financial / civic / commerce content (→ producing product) |
| Templates & locales | Domain identities (→ CyIdentity) |
| Consent & channel preferences | Identity-level consent (→ CyIdentity) |
| Conversation store & threading | Long-term engagement analytics (→ CyData) |
| Voice IVR, SIP, recording | Telephony billing for premium / international traffic (→ CyShop captures; CyCom Finance recognizes) |
| Video call sessions & recording | Clinical interpretation of a telehealth call (→ CyMed) |
| Contact center (queues, agents, supervisors) | ERP approval **workflows** (→ CyCom Approvals; CyConnect delivers the notification) |
| Agent Assist *embedding* | Agent Assist *models* (→ CyAI) |
| Jurisdictional suppression (TCPA / CASL / GDPR / ePrivacy) | Case workflows for citizens (→ CyGov) |

### 1.3 CyCom (Enterprise Back-Office / ERP) — repositioned by [ADR-0018](../adr/ADR-0018-cycom-product-repositioning.md)

| ✅ In CyCom (ERP) | ❌ Not in CyCom (ERP) |
|---|---|
| Finance: GL, AR, AP, Cash, period close, multi-entity / multi-currency, FX | Payment **capture** / PCI scope (→ CyShop) |
| Accounting: chart of accounts, journals, allocations, intercompany, tax accounting | Consumer storefronts / cart / checkout (→ CyShop) |
| HR: employee master, organization, leave, performance, benefits | Workforce identity / SSO / MFA / session (→ CyIdentity) |
| Payroll: pay calc, deductions, statutory filings, payslips | Notifications (e.g. payslip published) — delivery (→ CyConnect) |
| Procurement: suppliers, RFx, POs, GRNs, three-way match, supplier payments | **Public-sector** e-procurement (statutory tendering, public registers) (→ CyGov) |
| Inventory: items, lots, serials, warehouses, valuation, cycle counts | Clinical pharmaceutical inventory at the ward (→ CyMed) |
| Manufacturing: BoMs, routings, work orders, MRP, shop-floor, costing | OT / SCADA control of plant equipment (out of scope; per-integration ADR) |
| CRM: accounts, contacts, opportunities, pipeline, B2B sales orders | Consumer-transactional orders (→ CyShop OMS) |
| Projects: tasks, timesheets, expenses, project accounting, billing | Clinical project workflows (→ CyMed) |
| Assets: fixed assets, depreciation, maintenance schedules, disposals | Imaging / DICOM assets (→ CyMed + CyIntegration Hub) |
| Quality: plans, inspections, non-conformance, CAPA, supplier quality | Clinical quality programs (→ CyMed) |
| **Documents** (enterprise records: invoices, POs, contracts, employee files, quality records) | Clinical documents (→ CyMed); civic case documents (→ CyGov) |
| **Approvals** workflow engine (PO / expense / journal / contract) | Citizen case approvals (→ CyGov); clinical order approvals (→ CyMed CPOE); message delivery (→ CyConnect) |
| Budgeting: budgets, forecasts, variance, encumbrance, period locking | Cross-product margin / cohort analytics (→ CyData) |
| Contracts: customer + supplier, terms, renewals, obligations, e-sign | Civic / regulatory contracts at country scale (→ CyGov procurement) |
| AR posting from CyShop / CyMed / CyGov / CyConnect billing events | Calling vendor LLM endpoints (→ CyAI) |

### 1.4 CyShop (Consumer Commerce)

| ✅ In CyShop | ❌ Not in CyShop |
|---|---|
| Catalog, merchandising, pricing, promotions | Inventory of clinical pharmaceuticals in a hospital ward (→ CyMed) |
| Cart, checkout, addresses | Patient identity (→ CyIdentity) |
| Payments (PCI scope), tokenization, refunds, chargebacks | Government tender evaluation (→ CyGov e-procurement) |
| Order management, fulfillment, returns | **Enterprise procurement** (supplier POs, GRNs) (→ CyCom Procurement) |
| Multi-seller marketplace (B2B + B2C) | General Ledger, AR/AP postings (→ CyCom Finance) |
| Subscriptions & billing (consumer plans) | Government services / licensing (→ CyGov) |
| Fraud & risk *signals* | Risk **models** (→ CyAI) |
| Tax engine integration & invoicing (consumer-facing) | Order / receipt notification delivery (→ CyConnect) |
| White-label storefronts (incl. for CyGov, CyMed retail) | Civic registers, vital records (→ CyGov) |

### 1.5 CyGov (Government)

| ✅ In CyGov | ❌ Not in CyGov |
|---|---|
| Service catalog & case management | Citizen portal UX (→ CyCitizen) |
| **e-Procurement (public-sector tendering, RFx, contracts)** | **Enterprise procurement** (the tenant buying for itself) (→ CyCom Procurement) |
| Permits & licensing | Identity / eID (→ CyIdentity) |
| Regulatory submissions (in / out) | Hospital reporting **content** (→ CyMed produces; CyGov receives) |
| Fee & fine **assessment** | Fee & fine **payment capture** (→ CyShop); AR posting (→ CyCom Finance) |
| Civic registers (vital / business / property where SoR) | Notifications & IVR (→ CyConnect) |
| Inter-agency document exchange | Inter-product messaging *transport* (→ CyIntegration Hub) |
| Open-data publication (with redaction) | Public-statistics analytics (→ CyData) |
| Officer workflows, queues, decisions | AI inference / models (→ CyAI) |
| Civic case documents | Enterprise back-office documents (→ CyCom Documents); clinical documents (→ CyMed) |

---

## 2. Cross-Product Boundary Disputes — Resolved

These are the recurring "where does X go?" arguments. Each row has one decision.

| Capability | Owner | Why |
|---|---|---|
| **Authoring a patient appointment reminder** | **CyMed** (content) + **CyConnect** (delivery) | CyMed knows the clinical context; CyConnect is the comms platform. |
| **A citizen pays a parking fine online** | **CyGov** (assesses) + **CyShop** (captures) + **CyCom Finance** (AR posting) + **CyConnect** (receipt) | Four-product separation of duty. |
| **Hospital retail pharmacy sells over-the-counter goods** | **CyShop** (storefront, payments, fulfillment) | Commerce belongs in CyShop; CyMed remains clinical. |
| **A clinician messages another clinician about a patient** | **CyConnect** (secure clinician chat) referencing **CyMed** (patient/encounter id) | CyConnect is the channel; CyMed remains the clinical record. |
| **A government regulator receives a hospital's notifiable-disease report** | **CyMed** produces → **CyIntegration Hub** routes → **CyGov** receives | Each product owns its slice. |
| **Marketplace storefront for a government tender catalog (e.g. surplus auctions)** | **CyShop** (storefront / payments) + **CyGov** (legal / contract overlay) | Commerce mechanics in CyShop; statutory layer in CyGov. |
| **AI-suggested coding for a clinical note** | **CyAI** (inference) + **CyMed** (decision, save, audit) | AI assists; CyMed decides. |
| **Audit log of every PHI read** | **Platform audit sink** (immutable), populated by **CyMed** | Audit is platform, not product. |
| **A patient consents to share data with a researcher** | **CyIdentity** (consent record) + **CyMed** (release operation) + **CyData** (de-identification & delivery) | Three-step process owned by three different teams. |
| **A vendor logs into a tendering portal** | **CyIdentity** (`partner` realm) + **CyGov** (procurement UX / logic) | Identity is platform; procurement is CyGov. |
| **A citizen views their personal profile** | **CyCitizen** (renders) + **CyIdentity** (canonical attributes) + **CyGov** (civic data) | Rendering ≠ ownership. |
| **An enterprise tenant raises a purchase order for office supplies** | **CyCom Procurement** | Internal enterprise back-office, not consumer commerce, not public tendering. |
| **An employee submits an expense for approval** | **CyCom Projects** (expense entry) + **CyCom Approvals** (workflow) + **CyConnect** (notification to approver) + **CyCom Finance** (posting) | Workflow + record + delivery cleanly separated. |
| **A B2B sales opportunity becomes a sales order with invoicing** | **CyCom CRM** (opportunity → sales order) + **CyCom Finance** (AR & invoicing) + **CyConnect** (invoice delivery) | B2B is back-office; CyShop is the consumer storefront. |
| **A hospital billing run posts hospital revenue** | **CyMed** (charge capture) → **CyShop** (payment capture) → **CyCom Finance** (AR posting & period close) | Clinical → capture → ledger separation. |
| **An ERP-side approval needs a notification** | **CyCom Approvals** (workflow) + **CyConnect** (notification) | CyConnect delivers; it never owns the workflow. |
| **An enterprise contract is e-signed by a counterparty** | **CyCom Contracts** (record & lifecycle) + **CyIntegration Hub** (e-sign provider) | CyCom owns the contract record; the Hub mediates the e-sign vendor. |

---

## 3. Platform vs Product

Capabilities that are **always platform**, never re-implemented by a product:

| Capability | Provider |
|---|---|
| Identity (authN, federation, MFA, sessions) | CyIdentity |
| Authorization decisions | Platform policy engine (per [ADR-0005](../adr/ADR-0005-identity-access-management-strategy.md)) |
| Audit log (immutable, tamper-evident) | Platform audit sink ([audit_logging_strategy](../security/audit_logging_strategy.md)) |
| Secrets / KMS | Vault + ESO + cloud KMS |
| Service mesh (mTLS, retries, telemetry) | Linkerd (primary) / Istio (fallback) — [ADR-0013](../adr/ADR-0013-service-mesh-strategy.md) |
| Observability (metrics, logs, traces, SLOs) | OTel + Prometheus + Grafana + Loki/Tempo — [ADR-0009](../adr/ADR-0009-observability-strategy.md) |
| API gateway / ingress | Gateway API at the edge |
| Event backbone (Kafka + RabbitMQ) | CyIntegration Hub (operates the brokers) |
| Outbox publishing | Platform pattern operated by CyIntegration Hub |
| Healthcare terminology service | Platform service (per [ADR-0006](../adr/ADR-0006-icd-11-strategy.md)) |
| Analytics lakehouse | CyData |
| AI / ML serving | CyAI |
| **Notifications (SMS / email / push / voice / video / WhatsApp)** | **CyConnect** |
| Payments (PCI scope) | CyShop |
| **Enterprise back-office: GL, AR/AP, HR, Payroll, Procurement, Inventory, Manufacturing, CRM, Projects, Assets, Quality, Documents, Approvals, Budgeting, Contracts** | **CyCom (ERP)** |

---

## 4. "Don't Build This Inside Your Product" Rules

A product PR violating any of these requires an ADR:

1. Don't store secrets or implement crypto — use the platform.
2. Don't implement user login or password handling — call CyIdentity.
3. Don't read another product's DB — call its API or subscribe to its events.
4. **Don't operate SMS gateways, SIP trunks, email infrastructure, or media servers — call CyConnect.**
5. Don't integrate a payment processor — call CyShop.
6. Don't call vendor LLM endpoints directly — call CyAI.
7. Don't build your own audit table — emit to the platform audit sink.
8. Don't build your own analytics warehouse — emit events to CyData.
9. Don't build a custom partner B2B portal — register your APIs with CyIntegration Hub.
10. Don't roll your own observability stack — instrument with OTel.
11. **Don't build a General Ledger, AP/AR sub-ledger, HR / Payroll, enterprise Procurement, Inventory, CRM, Projects, Assets, Quality, Documents, Approvals, Budgeting, or Contracts module inside your product — call CyCom (ERP).**
12. **Don't build a separate ERP approval-workflow engine — use CyCom Approvals; have CyConnect deliver the notification.**

---

## 5. Boundary Change Process

To move a capability between products (or split a product):

1. Propose via PR adding an ADR in `docs/adr/`.
2. Update this matrix and the affected per-product architecture docs in the same PR.
3. Update [`domain_ownership_matrix.md`](domain_ownership_matrix.md) and [`data_ownership_matrix.md`](data_ownership_matrix.md) if affected.
4. Architecture Board approval (Chief Enterprise Architect + at least one impacted Product Architect).
5. Plan migration of code, data, events, contracts; update CODEOWNERS.
