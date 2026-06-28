# Customer Implementation Guide

**Version:** 1.0
**Date:** 2026-06-28
**Audience:** CyberCom Implementation Team, System Integrators, Implementation Partners

---

## Overview

This guide defines CyberCom's repeatable implementation methodology — the CyberCom Activate Framework — for deploying CyMed products at hospitals, clinics, laboratories, imaging centers, and pharmacies.

CyberCom Activate is managed through the `products/implementation/` module, which tracks every implementation project, milestone, task, checklist item, and issue in the platform itself.

---

## CyberCom Activate Framework

### Phases

```
Discovery → Design → Build → Test → Cutover → Go-Live → Hypercare → Close
```

| Phase | Duration (typical) | Owner |
|-------|-------------------|-------|
| Discovery | 2–4 weeks | Implementation Lead + Customer |
| Design | 2–3 weeks | Solution Architect + CMIO |
| Build | 2–6 weeks | Implementation Team |
| Test | 2–4 weeks | QA + Clinical Validators |
| Cutover | 3–5 days | Implementation Lead + IT |
| Go-Live | Day 1 | All teams on site |
| Hypercare | 2–4 weeks | Hypercare team |
| Close | 1 week | Customer Success |

---

## Phase 1 — Discovery

### Discovery Checklist — All Facilities

- [ ] Signed contract and Data Processing Agreement received
- [ ] Primary point of contact identified (IT lead, clinical lead, executive sponsor)
- [ ] Current system landscape documented (existing HIS, LIS, RIS, PACS, ERP)
- [ ] Number of users per role documented
- [ ] Languages required (English, Arabic, other)
- [ ] Number of facilities and departments documented
- [ ] Regulatory requirements identified (HIPAA, local health authority)
- [ ] Drug interaction database vendor identified (Pharmacy deployments)
- [ ] Go-live target date agreed
- [ ] CyberCom edition confirmed (Basic, Professional, Enterprise)
- [ ] Modules to deploy confirmed per phase
- [ ] Network architecture documented (cloud/private/hybrid)
- [ ] Data migration scope defined (what data, from what systems, how many years)
- [ ] Integration requirements listed (lab interfaces, PACS, insurance clearinghouse, etc.)

### Discovery Checklist — Hospital

- [ ] Number of beds documented
- [ ] Departments and specialties listed
- [ ] Operating rooms count and type
- [ ] ICU beds and type documented
- [ ] Emergency volume (visits/day) documented
- [ ] Current ADT system identified
- [ ] Nursing documentation current system identified
- [ ] OR scheduling current system identified
- [ ] Current billing system identified
- [ ] Lab interface vendor identified (HL7/LIS)
- [ ] Imaging/PACS vendor identified

### Discovery Checklist — Clinic

- [ ] Number of physicians and specialties
- [ ] Daily appointment volume
- [ ] Current practice management system
- [ ] Telemedicine requirement (yes/no)
- [ ] Insurance payers to configure
- [ ] Prescription electronic transmission requirement
- [ ] Lab orders routing (internal lab or external)

### Discovery Checklist — Laboratory

- [ ] Analyzer models and vendors listed
- [ ] HL7 interface capability confirmed per analyzer
- [ ] Test menu documented (all tests to be in LIS)
- [ ] LOINC mapping strategy confirmed
- [ ] Auto-verification rules scope defined
- [ ] Critical value thresholds per test to be configured
- [ ] Reference lab interfaces required
- [ ] Blood bank scope confirmed
- [ ] QC system current process documented

### Discovery Checklist — Imaging Center

- [ ] Modality types (CT, MRI, X-ray, US, Mammography, Nuclear Medicine)
- [ ] Existing PACS vendor and version
- [ ] DICOM conformance statement from each modality
- [ ] Radiologist count and subspecialties
- [ ] Teleradiology requirement
- [ ] Referring provider integration requirement
- [ ] Report distribution method (fax, portal, HL7)

### Discovery Checklist — Pharmacy

- [ ] Dispensing volume (prescriptions/day)
- [ ] Formulary size (number of drugs)
- [ ] Drug interaction database vendor decision
- [ ] Controlled substance regulations (local requirements)
- [ ] Automated dispensing cabinets (ADC) vendor and model
- [ ] Clinical pharmacy services scope
- [ ] Inventory management current system
- [ ] Procurement integration requirement

---

## Phase 2 — Infrastructure Checklist

- [ ] Cloud account provisioned (AWS/GCP/Azure/OCI or private)
- [ ] Kubernetes cluster created (version 1.28+)
- [ ] PostgreSQL 16 instance provisioned with production settings
- [ ] Redis 7 cluster provisioned
- [ ] Kafka cluster provisioned (3 brokers minimum for production)
- [ ] Keycloak 24 deployed and production realm created
- [ ] HashiCorp Vault deployed and secrets seeded
- [ ] DNS records created (`app.customer.com`, `auth.customer.com`, `api.customer.com`)
- [ ] SSL/TLS certificates issued and configured
- [ ] Load balancer configured
- [ ] CDN configured for static assets
- [ ] Backup policy configured (database + object storage)
- [ ] Monitoring configured (Prometheus + Grafana alerts)
- [ ] Log aggregation configured
- [ ] Network security groups / firewall rules applied
- [ ] VPN or private network for admin access
- [ ] Helm deployment completed (`helm upgrade --install`)
- [ ] Health endpoints verified (`/health/liveness`, `/health/readiness`)
- [ ] All environment variables set and verified
- [ ] Database migrations applied

---

## Phase 3 — Data Migration Checklist

- [ ] Data migration scope agreed and signed off
- [ ] Source data extracts received
- [ ] Data quality assessment completed
- [ ] Data mapping document approved by customer
- [ ] Staging migration run completed (not in production)
- [ ] Validation queries run on migrated data
- [ ] Clinical data validated by clinical lead
- [ ] Patient duplicates resolved
- [ ] Active patient records migrated and verified
- [ ] Provider directory migrated and verified
- [ ] Historical data migration scope confirmed (how many years)
- [ ] Financial data migration verified with finance team
- [ ] Insurance data migration verified
- [ ] Production migration rehearsal completed
- [ ] Rollback procedure confirmed

See `Migration_Toolkit_Guide.md` for detailed tools and procedures.

---

## Phase 4 — Integration Checklist

- [ ] All integration requirements from Discovery confirmed
- [ ] Integration partner contacts identified
- [ ] HL7 interface engine configured (if applicable)
- [ ] Lab analyzer interfaces tested (HL7 ORM/ORU)
- [ ] PACS integration tested (DICOM C-STORE, C-FIND, MWL)
- [ ] Insurance clearinghouse connectivity tested
- [ ] SMS gateway configured and tested
- [ ] Email SMTP configured and tested
- [ ] Payment gateway configured and tested (if applicable)
- [ ] SSO/LDAP integration configured and tested (if applicable)
- [ ] National patient index integration tested (if required)
- [ ] Electronic prescribing integration tested (if applicable)

See `Migration_Toolkit_Guide.md` — Integration section.

---

## Phase 5 — Configuration Guide

### Tenant Setup

1. Create tenant record via API or admin panel
2. Configure Keycloak realm for tenant (use realm import template)
3. Set edition (Basic/Professional/Enterprise)
4. Configure feature flags per edition
5. Configure branding (logo, color scheme, name)
6. Configure deployment profile (cloud/private/government)

### Clinical Configuration

1. **Formulary:** Import drug formulary (CSV template available)
2. **Drug interaction rules:** Seed from licensed clinical database
3. **ICD-11 terminology:** Configured via TerminologyService (pre-seeded)
4. **LOINC test mappings:** Import lab test catalog with LOINC codes
5. **Critical value thresholds:** Configure per test per lab
6. **Specialty configuration:** Set up specialties, departments, service lines
7. **Provider directory:** Import providers with credentials and specialties
8. **Bed types and locations:** Configure ward, ICU, ER bed layout

### User and Role Setup

1. Import users via CSV or LDAP sync
2. Assign roles per department and function
3. Configure MFA policy per user type
4. Set session timeout per role sensitivity
5. Configure Break Glass policy

### Notification Configuration

1. SMS gateway credentials
2. Email SMTP credentials
3. Push notification certificates
4. Alert thresholds (critical lab, critical imaging, medication alerts)
5. Escalation chains

---

## Phase 6 — UAT Plan

### UAT Principles

- Customer clinical staff lead UAT — not CyberCom implementation team
- Each workflow has defined acceptance criteria
- No go-live until all P0 and P1 scenarios pass
- Documented sign-off required from clinical lead and department heads

### UAT Environments

- UAT runs on dedicated staging environment with production-equivalent data (anonymized)
- Never run UAT on production environment
- Production migration happens after UAT sign-off

### UAT Scenario Structure

Each UAT scenario contains:
- Scenario ID
- User role performing the test
- Preconditions
- Steps
- Expected result
- Actual result
- Pass/Fail
- Tester name
- Date

See `Clinical_Validation_Package.md` for full scenario library by product.

### UAT Exit Criteria

| Priority | Requirement |
|----------|------------|
| P0 — Blocker | 100% pass — no go-live until resolved |
| P1 — Critical | 95%+ pass — remaining must have workaround documented |
| P2 — Important | 80%+ pass — defects logged for post go-live fix |
| P3 — Minor | Tracked in backlog |

---

## Phase 7 — Go-Live Checklist

### T-5 Days

- [ ] Final production infrastructure verification
- [ ] Final data migration completed and verified
- [ ] All integrations verified in production
- [ ] Go/No-Go meeting completed with all stakeholders
- [ ] Rollback decision criteria documented

### T-1 Day

- [ ] Production environment health check passed
- [ ] All user accounts active and tested
- [ ] All integrations active and tested
- [ ] On-call team briefed
- [ ] Command center established (war room or virtual)
- [ ] Hypercare team briefed and on standby
- [ ] Go-live communication sent to all users
- [ ] Cutover checklist signed off

### Go-Live Day

- [ ] Legacy system set to read-only mode
- [ ] Final data delta migration completed
- [ ] CyberCom set to live mode
- [ ] First patients registered and processed
- [ ] First lab orders processed
- [ ] First prescriptions processed
- [ ] All workflows spot-checked by clinical lead
- [ ] Go-live declared at agreed time
- [ ] Command center active for 12 hours

### T+1 Day

- [ ] Volume review meeting
- [ ] Issue log reviewed and prioritized
- [ ] P0 issues resolved or workarounds in place
- [ ] Hypercare team deployed

---

## Phase 8 — Rollback Plan

### Rollback Triggers

- P0 patient safety issue in live system
- Data corruption detected
- System unavailability > 30 minutes with no ETA
- Go/No-Go decision reversed by clinical or executive lead

### Rollback Procedure

1. Declare rollback — implementation lead and executive sponsor sign off
2. Restore legacy system to active mode
3. `helm rollback cybercom-platform <previous-revision>`
4. Verify health endpoints
5. Notify all users
6. Document all data entered in CyberCom since go-live (to be re-entered after fix)
7. Root cause analysis within 48 hours
8. Reschedule go-live

---

## Phase 9 — Hypercare Plan

### Duration

Standard: 2 weeks
Complex (hospital): 4 weeks
Recommended minimum: 10 business days of on-site support

### Hypercare Team Composition

- 1 Implementation Lead (on-site or virtual)
- 1 Clinical Trainer (on-site)
- 1 Technical Support Engineer (on-call)
- 1 Customer Success Manager (regular check-ins)

### Hypercare Activities

**Daily:**
- Issue triage call (15 min)
- Review new issues raised
- Patch critical issues same day
- Monitor system metrics (performance, errors)

**Weekly:**
- Volume and performance review
- Training reinforcement sessions
- Issue backlog prioritization with customer
- Status report to executive sponsor

### Hypercare Exit Criteria

- No P0 open issues
- No P1 open issues without agreed resolution date
- P2 issues logged in backlog with dates
- Customer IT team can handle routine operations independently
- On-call support transitioned to standard support SLA
- Customer sign-off on hypercare exit

---

## Implementation by Facility Type

### Typical Timeline

| Facility | Fast Track | Standard | Complex |
|---------|-----------|---------|---------|
| Single clinic | 4 weeks | 8 weeks | 12 weeks |
| Multi-site clinic chain | 8 weeks | 16 weeks | 24 weeks |
| Small hospital (<200 beds) | 12 weeks | 20 weeks | 30 weeks |
| Large hospital (200+ beds) | 20 weeks | 32 weeks | 52 weeks |
| Laboratory | 6 weeks | 12 weeks | 20 weeks |
| Imaging center | 6 weeks | 12 weeks | 16 weeks |
| Pharmacy (single) | 4 weeks | 8 weeks | 12 weeks |
| Pharmacy chain | 8 weeks | 16 weeks | 24 weeks |

### Recommended First Implementation

**Start with a single-specialty clinic.** Reasons:
- Lowest integration complexity
- Fastest time to value
- Allows team to build implementation muscle
- Forms reference case for hospital sales
- Clinic workflow is a subset of hospital workflow

---

## Staffing Model

| Project Size | Implementation Lead | Solution Architect | Clinical Trainer | Technical Engineer |
|-------------|--------------------|--------------------|------------------|--------------------|
| Small clinic | 1 (part-time) | 1 (shared) | 1 (part-time) | 1 (shared) |
| Large clinic | 1 | 1 | 1 | 1 |
| Small hospital | 1 | 1 | 2 | 1 |
| Large hospital | 1–2 | 2 | 3–4 | 2 |
| Laboratory | 1 | 1 (LIS focus) | 1 | 1 |

---

## Related Documents

- `Migration_Toolkit_Guide.md` — Data migration tools and procedures
- `Clinical_Validation_Package.md` — UAT scenarios and clinical sign-off forms
- `Training_and_Academy_Report.md` — Training curriculum and Academy content
- `Pilot_GoLive_Plan.md` — First pilot deployment plan
- `Customer_Success_Playbook.md` — Post go-live customer success
