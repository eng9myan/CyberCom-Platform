# Domain Ownership Matrix

> **Status:** Approved — Program 1, Phase 1.1, updated 2026-06-21 per [ADR-0018](../adr/ADR-0018-cycom-product-repositioning.md) and [ADR-0019](../adr/ADR-0019-cyconnect-communications-platform.md)
> **Owner:** Chief Enterprise Architect
> **Purpose:** Single source of truth for **which product owns which business or platform domain**, with the boundary explicitly named.

> **Change note (2026-06-21):** §3 retitled to **CyConnect** (omnichannel communications); a new **§3b CyCom (Enterprise Back-Office / ERP)** section captures Finance, HR, Procurement, Inventory, Manufacturing, CRM, Projects, Assets, Quality, Documents, Approvals, Budgeting, and Contracts. Other sections updated for boundary clarity.

Each row names a **domain** (a bounded slice of business or platform capability), its **owner** (exactly one), the **other products that participate** as consumers/producers, and the **boundary rule** that prevents overlap.

Legend:

- **Owner** — the single product responsible for the domain's source of truth, behavior, and evolution.
- **Consumers** — products that *use* the domain via APIs or events.
- **Boundary rule** — the explicit "don't overlap" statement.

---

## 1. Platform Domains

| # | Domain | Owner | Consumers | Boundary rule |
|---|---|---|---|---|
| P1 | Authentication (OIDC / OAuth / SAML / WebAuthn) | **CyIdentity** | All products | No product builds login/MFA/sessions. |
| P2 | Identity attributes & realms (workforce / customer / citizen / partner / workload) | **CyIdentity** | All products | Identity attributes are not duplicated in product DBs beyond display cache. |
| P3 | Authorization decisions | **Platform Policy Engine** (OPA/Cedar per ADR-0005) | All products | No inline `if user.role == ...`. |
| P4 | Workload identity (SPIFFE/SVIDs + workload OIDC) | **CyIdentity + Mesh** | All products | Services authenticate to each other via mesh, not shared secrets. |
| P5 | API gateway & ingress | **Platform (Gateway API)** | All products | No per-product public gateways. |
| P6 | Service mesh (mTLS, retries, circuit breakers) | **Platform (Linkerd / Istio)** | All products | No per-product mTLS implementation. |
| P7 | Integration & API management (external) | **CyIntegration Hub** | All products that expose external APIs | No product registers partner integrations directly. |
| P8 | Event backbone (Kafka + RabbitMQ + schema registry) | **CyIntegration Hub** | All products | Brokers are operated centrally; products produce/consume only. |
| P9 | Outbox publishing | **CyIntegration Hub** | All products | Products write outbox rows; the Hub publishes. |
| P10 | Lakehouse, marts, lineage | **CyData** | All products | No product operates its own analytics warehouse. |
| P11 | ML/AI inference, RAG, agents, evals, guardrails | **CyAI** | All products | No product calls vendor LLMs directly. |
| P12 | Secrets management & KMS | **Platform (Vault + ESO + KMS)** | All products | No `.env`-baked secrets; no DIY crypto. |
| P13 | Audit log (immutable, tamper-evident) | **Platform audit sink** | All products | No per-product audit tables. |
| P14 | Observability (metrics, logs, traces, SLOs) | **Platform (OTel + Prom + Grafana)** | All products | No bespoke observability stacks. |
| P15 | Healthcare terminology service (ICD-11, SNOMED, LOINC) | **Platform terminology service** | CyMed, CyData, CyAI, CyGov | One copy of truth; per-tenant overrides allowed. |
| P16 | CI/CD reusable workflows & GitOps | **Platform Engineering** | All repos | One workflow contract per service type. |
| P17 | Tenant lifecycle (control plane) | **CyIdentity control plane + Platform Engineering** | All products | Tenant onboarding/offboarding orchestrates per-product provisioning; no manual side channels. |

---

## 2. Vertical Domains — Healthcare (CyMed)

| # | Domain | Owner | Consumers | Boundary rule |
|---|---|---|---|---|
| H1 | Patient master & local MPI | **CyMed** | CyCitizen (linkage via CyIdentity), CyData | Cross-product patient identity is via CyIdentity; CyMed owns local clinical MPI. |
| H2 | Encounters & ADT (admit/discharge/transfer) | **CyMed** | CyConnect (notifications), CyData | CyMed is the system of record for clinical events. |
| H3 | Electronic Health Record (problems, allergies, vitals, observations) | **CyMed** | CyData (analytics), CyAI (RAG/inference) | No clinical fields outside CyMed. |
| H4 | CPOE & CDS Hooks | **CyMed** | CyAI (CDS suggestions in) | CyAI suggests; CyMed decides. |
| H5 | eMAR (medication administration) | **CyMed** | CyConnect (alerts), CyData | Administration record stays in CyMed. |
| H6 | Pharmacy (clinical: formulary, dispensing) | **CyMed** | CyShop (retail / over-the-counter), CyIntegration Hub (NCPDP) | Retail pharmacy commerce ≠ clinical pharmacy. |
| H7 | Lab orders & results, microbiology, blood bank | **CyMed** | CyIntegration Hub (HL7 v2), CyData | External labs flow through the Hub. |
| H8 | Imaging worklists & study references | **CyMed** | CyIntegration Hub (DICOMweb) | Pixel data flows through DICOM via Hub; CyMed holds references. |
| H9 | Scheduling (clinic / OR / equipment) | **CyMed** | CyConnect (reminders), CyCitizen (patient view) | CyMed owns availability and rules. |
| H10 | Bed & ward management, infection control | **CyMed** | CyData | Only CyMed knows clinical state for beds. |
| H11 | Clinical pathways (maternity, peds, oncology, ICU) | **CyMed** | CyAI (decision support) | Pathways are templated workflows in CyMed. |
| H12 | Charge capture & ICD-11 coding | **CyMed** | CyShop (payment capture), CyCom Finance (AR posting), CyData | Coding is clinical; capture is CyShop; ledger is CyCom Finance. |
| H13 | Clinical consent & break-the-glass | **CyMed** | CyIdentity (identity-level consent), Platform audit | Two consent layers, owned separately. |
| H14 | Public-health reporting (notifiable diseases, immunizations) | **CyMed** produces → CyIntegration Hub → **CyGov** receives | — | Each product owns its slice. |

---

## 3. Horizontal Domains — Communications (CyConnect)

| # | Domain | Owner | Consumers | Boundary rule |
|---|---|---|---|---|
| C1 | Channel adapters (SMS / MMS / RCS / email / push / WhatsApp) | **CyConnect** | All products | No product runs its own SMS gateway or email infra. |
| C2 | Voice (SIP / IVR / recording / TTS / STT) | **CyConnect** | CyMed, CyShop, CyGov, CyCom (ERP) | No product runs its own SIP infrastructure. |
| C3 | Video (real-time, telehealth, webinars) | **CyConnect** | CyMed (telehealth), CyGov (hearings) | CyMed owns clinical context; CyConnect owns the call. |
| C4 | Templates & locales | **CyConnect** | All producing products | Producing product supplies content; CyConnect owns the template engine. |
| C5 | Channel preferences, opt-in/out, suppression | **CyConnect** | All products | Single source of contactability. |
| C6 | Delivery tracking & receipts | **CyConnect** | CyData (analytics) | No product tracks DLRs separately. |
| C7 | Conversation store & threading | **CyConnect** | CyData (metadata indexing) | No product stores its own message archives. |
| C8 | Contact center (queues, agents, supervisors) | **CyConnect** | All products with support needs | CyConnect is the contact-center platform. |
| C9 | Agent assist (UI embedding) | **CyConnect** | CyAI (models) | CyConnect embeds; CyAI infers. |
| C10 | Compliance suppression (TCPA / CASL / GDPR / ePrivacy) | **CyConnect** | All producing products | Hard gate; cannot be bypassed. |
| C11 | Notification delivery for ERP approvals, payslips, invoices, statements | **CyConnect** | **CyCom (ERP)** | CyCom owns the workflow / document; CyConnect delivers. |

---

## 3b. Horizontal Domains — Enterprise Back-Office / ERP (CyCom)

Per [ADR-0018](../adr/ADR-0018-cycom-product-repositioning.md). Each module is a bounded context; cross-context relationships are documented in [`cycom_architecture`](../platforms/cycom_architecture.md) §4.

| # | Domain | Owner | Consumers | Boundary rule |
|---|---|---|---|---|
| E1 | Finance — GL, sub-ledgers (AR/AP/Cash), multi-entity / multi-currency, period close, FX | **CyCom Finance** | CyShop (capture events), CyMed (charge capture), CyGov (fee events), CyData | All ledger posting is CyCom; capture stays in CyShop; revenue events stay in producers. |
| E2 | Accounting — chart of accounts, journals, allocations, intercompany, tax accounting | **CyCom Accounting** | CyCom Finance, CyData | Immutable journals; corrections via offsetting entries. |
| E3 | HR — employee master, organization, positions, leave, performance, benefits | **CyCom HR** | CyIdentity (identity attributes), CyCom Payroll, CyData | Identity attributes (login, MFA, role claims) stay in CyIdentity; HR-record attributes (comp, leave, performance) in CyCom HR. |
| E4 | Payroll — pay calc, deductions, garnishments, statutory filings, payslips | **CyCom Payroll** | CyConnect (payslip delivery), CyIntegration Hub (statutory bodies), CyData | Statutory filings via Hub; payslip delivery via CyConnect. |
| E5 | Procurement — suppliers, RFx, POs, GRNs, three-way match, supplier payments | **CyCom Procurement** | CyCom Finance, CyCom Approvals, CyCom Inventory, CyIntegration Hub | **Enterprise** procurement only; **public-sector** tendering is CyGov (G3). |
| E6 | Inventory — items, lots, serials, warehouses, stock moves, valuation, cycle counts | **CyCom Inventory** | CyCom Manufacturing, CyShop (where retail SKUs share masters), CyData | Hospital ward clinical inventory remains in CyMed; consumer SKUs in CyShop catalog. |
| E7 | Manufacturing — BoMs, routings, work orders, MRP, shop-floor, costing | **CyCom Manufacturing** | CyCom Inventory, CyCom Quality, CyCom Finance | Plant OT / SCADA control out of scope (per-integration ADR). |
| E8 | CRM — accounts, contacts, opportunities, pipeline, B2B sales orders | **CyCom CRM** | CyCom Finance (AR), CyConnect (campaigns under consent), CyData | B2B opportunities and sales orders are CyCom; consumer-storefront orders are CyShop OMS. |
| E9 | Projects — projects, tasks, timesheets, expenses, project accounting, billing | **CyCom Projects** | CyCom HR (employees), CyCom Finance, CyCom Approvals, CyData | Clinical project workflows are CyMed; civic case workflows are CyGov. |
| E10 | Assets — fixed assets, depreciation, maintenance schedules, disposals | **CyCom Assets** | CyCom Finance, CyCom Manufacturing (maintenance), CyData | Clinical imaging / DICOM assets remain in CyMed + Hub. |
| E11 | Quality — quality plans, inspections, non-conformance, CAPA, supplier quality | **CyCom Quality** | CyCom Manufacturing, CyCom Procurement | Clinical quality programs are CyMed. |
| E12 | Documents — enterprise records (invoices, POs, contracts, employee files, quality records) | **CyCom Documents** | All ERP modules; CyIntegration Hub (e-sign vendors) | **Not** clinical documents (CyMed); **not** civic case documents (CyGov). |
| E13 | Approvals — workflow engine for ERP approvals (PO / expense / journal / contract) | **CyCom Approvals** | All ERP modules; CyConnect (delivery of notifications) | CyConnect delivers; CyCom owns workflow. Case approvals → CyGov; clinical approvals → CyMed. |
| E14 | Budgeting — budgets, forecasts, variance, encumbrance, period locking | **CyCom Budgeting** | CyCom Finance, CyCom Procurement, CyCom Projects, CyData | Period locks enforced into Finance / Procurement / Projects. |
| E15 | Contracts — customer + supplier contracts, terms, renewals, obligations, e-signature | **CyCom Contracts** | CyCom Procurement, CyCom CRM, CyIntegration Hub (e-sign), CyConnect (reminders) | Civic / regulatory contracts at country scale stay in CyGov procurement. |

---

## 4. Horizontal Domains — Commerce (CyShop)

| # | Domain | Owner | Consumers | Boundary rule |
|---|---|---|---|---|
| S1 | Catalog & merchandising | **CyShop** | Storefront tenants | One catalog system. |
| S2 | Cart & checkout | **CyShop** | Storefront tenants | No bespoke carts. |
| S3 | Payments (PCI scope), tokenization, refunds, chargebacks | **CyShop** | CyMed (patient billing capture), CyGov (fee capture), CyConnect (premium-traffic billing) → **CyCom Finance** posts AR | All payments capture through CyShop; AR / revenue recognition is CyCom Finance. |
| S4 | Order management & fulfillment | **CyShop** | Carriers (via CyIntegration Hub) | Consumer OMS is CyShop; **enterprise procurement orders** stay in CyCom Procurement. |
| S5 | Multi-seller marketplace (B2B + B2C consumer storefronts) | **CyShop** | Sellers, storefront tenants | Marketplace mechanics are CyShop; **enterprise back-office purchasing** is CyCom Procurement. |
| S6 | Subscriptions & billing (consumer) | **CyShop** | SaaS-style consumers | Consumer subscription billing is CyShop; **enterprise B2B billing** is CyCom Finance (sales order → invoice → AR). |
| S7 | Tax & compliance (consumer invoicing) | **CyShop** | Consumer charge producers | Consumer invoices/tax are CyShop; **B2B invoicing & tax accounting** is CyCom Finance. |
| S8 | Fraud & risk signals | **CyShop** | CyAI (models), CyData | CyShop captures signals; CyAI scores. |
| S9 | White-label storefronts | **CyShop** | CyGov (public storefronts), CyMed retail | Storefronts are a CyShop offering. |

---

## 5. Vertical Domains — Government (CyGov)

| # | Domain | Owner | Consumers | Boundary rule |
|---|---|---|---|---|
| G1 | Service catalog (government services) | **CyGov** | CyCitizen (renders), CyData | Services are CyGov, even if other products are invoked downstream. |
| G2 | Case management & workflow | **CyGov** | CyCitizen (case status), CyConnect (notices) | CyGov owns SLAs and decisions. |
| G3 | **e-Procurement (public-sector tendering, RFx, contracts)** | **CyGov** | Vendors, CyShop only when public storefronts | **Public-sector** tendering only. **Enterprise procurement** (the tenant buying for itself) is **CyCom Procurement** (E5). |
| G4 | Permits & licensing | **CyGov** | CyCitizen (lookup), CyData | Registers projected to read APIs. |
| G5 | Regulatory submissions (in/out) | **CyGov** | CyIntegration Hub (transport), CyMed (producer of clinical submissions) | Each plays its slice. |
| G6 | Fee & fine **assessment** | **CyGov** | CyShop (capture), **CyCom Finance** (AR posting), CyConnect (notice), CyCitizen (status) | Assessment ≠ capture ≠ ledger. |
| G7 | Civic registers (vital / business / property) | **CyGov** (where chosen as SoR) | CyIdentity (identity claims), CyCitizen | Append-only with cryptographic attestation. |
| G8 | Inter-agency exchange | **CyGov** | CyIntegration Hub (transport) | CyGov owns envelopes & policy; Hub moves bytes. |
| G9 | Public records & open data | **CyGov** | CyData (publication), CyCitizen | Redaction owned by CyGov. |
| G10 | Compliance engine (jurisdictional rules) | **CyGov** | CyConnect (suppression), CyShop (taxes), CyMed (clinical reporting rules), CyCom (statutory payroll / tax filings) | Jurisdictional logic centralized here. |

---

## 6. Citizen-Facing Domain (CyCitizen)

CyCitizen is the **citizen face** for CyGov services; it is not a system of record for any business domain.

| # | Domain | Owner | Consumers | Boundary rule |
|---|---|---|---|---|
| Z1 | Citizen portal experience | **CyCitizen** | Citizens | Renders other products' data; stores none of it as SoR. |
| Z2 | Civic engagement (feedback, polls) | **CyCitizen** | CyGov (cases), CyData | Only engagement data lives here. |
| Z3 | eID enrollment flows (front-end) | **CyCitizen** | CyIdentity (SoR) | UI only; truth in CyIdentity. |
| Z4 | Service discovery & wayfinding | **CyCitizen** | CyGov (catalog) | UI + nav; catalog in CyGov. |

---

## 7. Cross-Cutting Domains

| # | Domain | Owner | Consumers | Boundary rule |
|---|---|---|---|---|
| X1 | Consent (identity-level) | **CyIdentity** | All products | Identity consent layer is CyIdentity. |
| X2 | Consent (purpose-bound clinical) | **CyMed** | Platform policy engine | Clinical purpose layer is CyMed. |
| X3 | Consent (contactability — channel preferences, opt-in/out, quiet hours) | **CyConnect** | All producing products | Contactability is CyConnect's compliance layer. |
| X4 | Internationalization & localization | **Platform UX standards** + per-product templates | All products | Common patterns; per-product content. |
| X5 | Accessibility (WCAG 2.2 AA baseline) | **Platform UX standards** | All UI surfaces | One baseline; per-product compliance. |
| X6 | Cost attribution & quotas | **Platform** | All products | One billing/cost view across products. |
| X7 | Separation of duties (SoD) controls (creator ≠ approver ≠ poster ≠ payer) | **Platform policy engine + CyCom Approvals** | All ERP-touching workflows | First-class control; CI tests verify SoD policies per tenant. |

---

## 8. Change Process

Same as the [Product Boundary Matrix](product_boundary_matrix.md) §5: any change to ownership requires an ADR plus updates to this matrix, the boundary matrix, the data ownership matrix, and the affected product architecture docs in a single PR.
