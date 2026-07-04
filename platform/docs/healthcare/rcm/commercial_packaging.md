# Commercial Packaging — CyMed RCM

## Product Editions

### CyMed Revenue Cycle Standard
**Target:** Small-to-medium clinics and ambulatory care facilities

**Includes:**
- Eligibility verification (real-time + batch)
- Insurance management (company, plan, member)
- Healthcare billing (patient accounts, invoices, adjustments)
- Claims management (submission, tracking, status)
- Patient Portal integration (invoices, payment status)

**Licensing:** Per-facility, per-month SaaS

---

### CyMed Revenue Cycle Enterprise
**Target:** Hospitals, multi-specialty groups, healthcare networks

**Includes everything in Standard plus:**
- Preauthorization management with appeal workflow
- Charge capture (auto-generation from all clinical modules)
- Denial management with root cause analysis
- Collections workflow with payment plans
- Contract management (payer contracts, rates, rules)
- Pricing management (price lists, packages, discounts)
- Revenue analytics dashboard
- Payer Portal (external reviewer access)
- Provider Portal RCM integration (auth status, coding assistance)
- CyCom ERP integration via CyIntegrationHub

**Licensing:** Per-facility + per-module, annual contract

---

### CyMed Government Payer Platform
**Target:** National health ministries, government insurance programs, public health schemes

**Includes everything in Enterprise plus:**
- National insurance program management
- Government claims processing (FHIR-native or national standards)
- Public health funding model support
- Air-gapped deployment option
- Multi-lingual UI (Arabic RTL, English)
- Government branding and white-label
- National audit compliance

**Licensing:** Government enterprise agreement, national deployment

---

## White-Label & Deployment Options

| Feature | Standard | Enterprise | Government |
|---------|----------|------------|------------|
| Multi-tenant SaaS | ✓ | ✓ | ✓ |
| Private Cloud | — | ✓ | ✓ |
| On-Premise | — | Optional | ✓ |
| Air-Gapped | — | — | ✓ |
| Custom Branding | — | ✓ | ✓ |
| Government Branding | — | — | ✓ |
| Arabic/RTL | ✓ | ✓ | ✓ |
| National Insurance APIs | — | — | ✓ |

## Commercial Readiness

| Criterion | Status |
|-----------|--------|
| FHIR R4 Compliance | ✓ CoverageEligibilityRequest/Response, Claim, ClaimResponse, Invoice, Account, ExplanationOfBenefit |
| ICD-11 Integration | ✓ Via P2.10 TerminologyService |
| Multi-tenant Architecture | ✓ Row-level tenant isolation |
| CyCom Integration Boundary | ✓ CyIntegrationHub only |
| CyAI Integration | ✓ Advisory — denial prediction, leakage detection, collection risk |
| Patient Portal Integration | ✓ P3.6 |
| Provider Portal Integration | ✓ P3.7 |
| Security (RBAC/ABAC/MFA) | ✓ CyIdentity |
| Audit Trail | ✓ Full action log |
| Air-Gap Capable | ✓ Government edition |
| Arabic RTL | ✓ |

## Competitive Differentiators

| Competitor | CyMed RCM Advantage |
|-----------|-------------------|
| Epic Resolute | Native CyMed clinical integration — no middleware; ICD-11 native vs. ICD-10 |
| Oracle Cerner Revenue Cycle | Sovereign/air-gapped deployment; integrated CyCom ERP as accounting system |
| R1 RCM | Fully owned platform (not outsourced RCM service); patient portal self-service |
| Optum Revenue Cycle | No US market lock-in; Arabic-first, MENA government ready |
| Change Healthcare | No dependency on US clearinghouse ecosystem; direct FHIR R4 payer connectivity |
| TrakCare Financials | Deeper clinical-financial integration (charges auto-generated from orders) |
