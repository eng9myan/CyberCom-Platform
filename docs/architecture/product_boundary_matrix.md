# Product Boundary Matrix

> **Status:** Approved — Program 1, Phase 1.1
> **Owner:** Chief Enterprise Architect
> **Purpose:** Settle, in one place, **what belongs in which product** and what each one explicitly does **not** do — so feature debates have a single source of truth.

This matrix is **normative**. A new capability that does not fit cleanly into one product requires either (a) an ADR placing it, or (b) extension of the relevant product's scope via PR.

---

## 1. Per-Product "In / Out" Summary

### 1.1 CyMed (Healthcare)

| ✅ In CyMed | ❌ Not in CyMed |
|---|---|
| Patient registration, encounters, ADT | Customer identity & login (→ CyIdentity) |
| Clinical orders (CPOE), eMAR, results | Patient bill payment (→ CyShop) |
| Pharmacy (clinical: formulary, dispensing) | Retail pharmacy fulfillment & checkout (→ CyShop) |
| Lab, imaging worklists, blood bank | PACS image storage; carrier delivery (→ via CyIntegration Hub) |
| Nursing care, scheduling, beds, OR | SMS/email/push to patients (→ CyCom) |
| Charge capture, ICD-11 coding | Invoicing & receipts (→ CyShop) |
| Consent (clinical purpose-of-use) | Identity consent capture (→ CyIdentity) |
| Break-the-glass + post-review | Audit log storage (→ Platform audit sink) |
| Population-level clinical insights *use* | Population-level clinical analytics *store* (→ CyData) |
| Clinical decision authority | Model serving / inference (→ CyAI) |

### 1.2 CyCom (Communications)

| ✅ In CyCom | ❌ Not in CyCom |
|---|---|
| Channel adapters (SMS/email/push/voice/video/RCS) | Authoring of clinical/financial/civic content (→ producing product) |
| Templates & locales | Domain identities (→ CyIdentity) |
| Consent & channel preferences | Identity consent (→ CyIdentity) |
| Conversation store & threading | Long-term analytical conversation analytics (→ CyData) |
| Voice IVR, SIP, recording | Customer billing for premium traffic (→ CyShop captures the charge) |
| Video call sessions & recording | Video clinical interpretation (→ CyMed) |
| Contact center (queues, agents, supervisors) | Hospital/clinical workflows that *happen to need calls* (→ CyMed initiates, CyCom delivers) |
| Agent Assist *embedding* | Agent Assist *models* (→ CyAI) |
| Jurisdictional suppression (TCPA/CASL/ePrivacy) | Cross-product reporting on engagement (→ CyData) |

### 1.3 CyShop (Commerce)

| ✅ In CyShop | ❌ Not in CyShop |
|---|---|
| Catalog, merchandising, pricing, promotions | Inventory of clinical pharmaceuticals in a hospital ward (→ CyMed) |
| Cart, checkout, addresses | Patient identity (→ CyIdentity) |
| Payments (PCI scope), tokenization, refunds, chargebacks | Government tender evaluation (→ CyGov e-procurement) |
| Order management, fulfillment, returns | Order/receipt notifications (→ CyCom) |
| Multi-seller marketplace (B2B + B2C) | Government services / licensing (→ CyGov) |
| Subscriptions & billing | SaaS metering for the platform itself (→ Platform billing — separate ADR) |
| Fraud & risk *signals* | Risk **models** (→ CyAI) |
| Tax engine integration & invoicing | Cross-product margin / cohort analytics (→ CyData) |
| White-label storefronts (incl. for CyGov, CyMed retail) | Civic registers, vital records (→ CyGov) |

### 1.4 CyGov (Government)

| ✅ In CyGov | ❌ Not in CyGov |
|---|---|
| Service catalog & case management | Citizen portal UX (→ CyCitizen) |
| e-Procurement (tendering, RFx, contracts) | Consumer commerce (→ CyShop) |
| Permits & licensing | Identity / eID (→ CyIdentity) |
| Regulatory submissions (in/out) | Hospital reporting **content** (→ CyMed produces; CyGov receives) |
| Fee & fine **assessment** | Fee & fine **payment** (→ CyShop) |
| Civic registers (vital / business / property where SoR) | Notifications & IVR (→ CyCom) |
| Inter-agency document exchange | Inter-product messaging *transport* (→ CyIntegration Hub) |
| Open-data publication (with redaction) | Public-statistics analytics (→ CyData) |
| Officer workflows, queues, decisions | AI inference / models (→ CyAI) |

---

## 2. Cross-Product Boundary Disputes — Resolved

These are the recurring "where does X go?" arguments. Each row has one decision.

| Capability | Owner | Why |
|---|---|---|
| **Authoring a patient appointment reminder** | **CyMed** (content) + **CyCom** (delivery) | CyMed knows the clinical context; CyCom is the messaging system of record. |
| **A citizen pays a parking fine online** | **CyGov** (assesses) + **CyShop** (captures) + **CyCom** (receipt) | Separation of duty: legal assessment, payment processing, communication. |
| **Hospital retail pharmacy sells over-the-counter goods** | **CyShop** (storefront, payments, fulfillment) | Commerce belongs in CyShop; CyMed remains clinical. |
| **A clinician messages another clinician about a patient** | **CyCom** (secure clinician chat) referencing **CyMed** (patient/encounter id) | CyCom is the channel; CyMed remains the clinical record. |
| **A government regulator receives a hospital's notifiable-disease report** | **CyMed** produces, **CyIntegration Hub** routes, **CyGov** receives | Each product owns its slice. |
| **Marketplace storefront for a government tender catalog (e.g. surplus auctions)** | **CyShop** (storefront / payments) + **CyGov** (legal/contract overlay) | Commerce mechanics in CyShop; statutory layer in CyGov. |
| **AI-suggested coding for a clinical note** | **CyAI** (inference) + **CyMed** (decision, save, audit) | AI assists; CyMed decides. |
| **Audit log of every PHI read** | **Platform audit sink** (immutable), populated by **CyMed** | Audit is platform, not product. |
| **A patient consents to share data with a researcher** | **CyIdentity** (consent record) + **CyMed** (release operation) + **CyData** (de-identification & delivery) | Three-step process owned by three different teams. |
| **A vendor logs into a tendering portal** | **CyIdentity** (`partner` realm), **CyGov** (procurement UX/logic) | Identity is platform; procurement is CyGov. |
| **A citizen views their personal profile** | **CyCitizen** (renders), **CyIdentity** (canonical attributes), **CyGov** (civic data) | Rendering ≠ ownership. |

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
| Notifications (SMS/email/push/voice/video) | CyCom |
| Payments (PCI scope) | CyShop |

---

## 4. "Don't Build This Inside Your Product" Rules

A product PR violating any of these requires an ADR:

1. Don't store secrets or implement crypto — use the platform.
2. Don't implement user login or password handling — call CyIdentity.
3. Don't read another product's DB — call its API or subscribe to its events.
4. Don't operate SMS gateways, SIP trunks, or media servers — call CyCom.
5. Don't integrate a payment processor — call CyShop.
6. Don't call vendor LLM endpoints directly — call CyAI.
7. Don't build your own audit table — emit to the platform audit sink.
8. Don't build your own analytics warehouse — emit events to CyData.
9. Don't build a custom partner B2B portal — register your APIs with CyIntegration Hub.
10. Don't roll your own observability stack — instrument with OTel.

---

## 5. Boundary Change Process

To move a capability between products (or split a product):

1. Propose via PR adding an ADR in `docs/adr/`.
2. Update this matrix and the affected per-product architecture docs in the same PR.
3. Update [`domain_ownership_matrix.md`](domain_ownership_matrix.md) and [`data_ownership_matrix.md`](data_ownership_matrix.md) if affected.
4. Architecture Board approval (Chief Enterprise Architect + at least one impacted Product Architect).
5. Plan migration of code, data, events, contracts; update CODEOWNERS.
