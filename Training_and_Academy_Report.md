# Training and Academy Report

**Version:** 1.0
**Date:** 2026-06-28
**Platform:** CyberCom Academy (`products/academy/`)

---

## Overview

CyberCom Academy is the integrated learning management system built into the CyberCom Platform. All training content, assessments, and certifications are managed through the Academy module (`products/academy/models.py`).

The Academy data model includes: `Course`, `CourseModule`, `ContentItem`, `Enrollment`, `Progress`, `Assessment`, `Certificate`.

This report defines the curriculum for each user role required for customer deployments.

---

## Training Methodology

### Delivery Modes

| Mode | Use Case |
|------|---------|
| Self-paced e-learning (Academy) | Standard training for all roles |
| Instructor-led (virtual) | Complex workflows, clinical roles |
| On-site hands-on | Go-live and hypercare training |
| Video tutorials | Quick reference, feature updates |
| Certification exam | Role-specific proficiency validation |

### Completion Requirements

All users must complete required training before go-live access is granted.

CyberCom system generates completion certificates automatically via the Academy module when assessment scores meet the threshold.

---

## Curriculum by Role

---

### 1. System Administrator

**Target audience:** IT staff responsible for managing the CyberCom platform
**Duration:** 16 hours
**Certification:** CyberCom System Administrator Certification

| Module | Duration | Format | Topics |
|--------|---------|--------|--------|
| Platform Architecture Overview | 2h | Video + Document | Services, components, infrastructure |
| User and Role Management | 2h | Lab | Creating users, assigning roles, MFA setup |
| Tenant Configuration | 2h | Lab | Branding, feature flags, deployment profiles |
| Integration Configuration | 2h | Lab | CyIntegrationHub, HL7, DICOM, REST connectors |
| Monitoring and Alerting | 2h | Document + Lab | Prometheus, Grafana, alert thresholds |
| Backup and Recovery | 2h | Document + Lab | Backup procedures, restore testing |
| Security Operations | 2h | Document + Lab | Audit logs, access review, security incidents |
| Troubleshooting Guide | 2h | Document + Lab | Common issues, log analysis, escalation |

**Certification exam:** 50 questions, 80% pass threshold
**Recertification:** Annual

---

### 2. Hospital Administrator

**Target audience:** Hospital operations managers, department heads
**Duration:** 8 hours
**Certification:** CyberCom Healthcare Administrator Certification

| Module | Duration | Format | Topics |
|--------|---------|--------|--------|
| Platform Navigation | 1h | Video | Login, workspace, navigation |
| Patient Management | 1h | Lab | Registration, search, record management |
| Department Configuration | 1h | Lab | Departments, beds, service lines |
| Scheduling and Capacity | 1h | Lab | Calendar management, capacity reports |
| Reporting and Analytics | 2h | Lab | Standard reports, dashboards |
| Staff Management | 1h | Lab | Provider directory, schedules |
| Revenue Cycle Overview | 1h | Document | Billing workflow, payer configuration |

---

### 3. Clinic Administrator

**Target audience:** Clinic managers, practice administrators
**Duration:** 6 hours

| Module | Duration | Format | Topics |
|--------|---------|--------|--------|
| Platform Navigation | 1h | Video | |
| Appointment Scheduling | 1h | Lab | Calendar, appointment types, capacity |
| Patient Registration | 1h | Lab | Registration workflow, insurance |
| Queue Management | 1h | Lab | Triage, queue, status management |
| Reporting | 1h | Lab | Clinic performance reports |
| Configuration | 1h | Lab | Specialties, forms, templates |

---

### 4. Pharmacy Manager

**Target audience:** Chief pharmacist, pharmacy supervisor
**Duration:** 10 hours
**Certification:** CyberCom Pharmacy Manager Certification

| Module | Duration | Format | Topics |
|--------|---------|--------|--------|
| Pharmacy Overview | 1h | Video | Architecture, integration points |
| Formulary Management | 2h | Lab | Adding drugs, formulary tiers, alternatives |
| Drug Interaction Configuration | 2h | Lab | Interaction rule import, severity configuration |
| Dispensing Workflow | 2h | Lab | Prescription receipt, verification, dispensing |
| Inventory Management | 1h | Lab | Stock levels, reorder points, CyCom bridge |
| Reports and Analytics | 1h | Lab | Dispensing reports, interaction reports |
| Controlled Substances | 1h | Document + Lab | Regulatory workflow, reporting |

**Certification exam:** 40 questions, 85% pass threshold (higher due to patient safety impact)

---

### 5. Laboratory Manager

**Target audience:** Laboratory director, quality manager
**Duration:** 10 hours
**Certification:** CyberCom Laboratory Manager Certification

| Module | Duration | Format | Topics |
|--------|---------|--------|--------|
| LIS Overview | 1h | Video | Architecture, HL7 interfaces |
| Test Catalog Management | 2h | Lab | Adding tests, LOINC mapping, reference ranges |
| Critical Value Configuration | 1h | Lab | Thresholds, notification rules |
| Auto-Verification Rules | 2h | Lab | Rule setup, testing, exception handling |
| QC Management | 2h | Lab | Lot entry, Levey-Jennings, rule violations |
| Reports and TAT | 1h | Lab | TAT reports, productivity metrics |
| Analyzer Interface | 1h | Lab | HL7 interface monitoring |

**Certification exam:** 40 questions, 85% pass threshold

---

### 6. Radiology Manager

**Target audience:** Chief radiologist, radiology department head
**Duration:** 8 hours
**Certification:** CyberCom Radiology Manager Certification

| Module | Duration | Format | Topics |
|--------|---------|--------|--------|
| RIS Overview | 1h | Video | Architecture, DICOM integration |
| Modality Configuration | 2h | Lab | DICOM worklist, C-STORE setup |
| Report Template Management | 2h | Lab | Structured report templates |
| Critical Finding Workflow | 1h | Lab | Configuration and testing |
| Analytics and Reports | 1h | Lab | Volume, TAT, radiologist productivity |
| PACS Integration | 1h | Lab | Connectivity verification |

---

### 7. Finance Users

**Target audience:** Finance managers, billing specialists, accounts team
**Duration:** 8 hours

| Module | Duration | Format | Topics |
|--------|---------|--------|--------|
| Revenue Cycle Overview | 1h | Video | RCM workflow, key concepts |
| Charge Capture | 1h | Lab | Charge posting, CPT codes |
| Insurance and Eligibility | 1h | Lab | Payer configuration, eligibility checks |
| Claims Management | 2h | Lab | Claim creation, submission, tracking |
| Denial Management | 1h | Lab | Denial codes, appeals |
| Collections | 1h | Lab | Patient statements, payment plans |
| Financial Reports | 1h | Lab | AR aging, revenue analytics |

---

### 8. Clinicians (Physicians)

**Target audience:** Attending physicians, consultants, residents
**Duration:** 6 hours
**Certification:** CyberCom Clinician Certification

| Module | Duration | Format | Topics |
|--------|---------|--------|--------|
| Clinician Workspace | 1h | Video + Lab | Login, patient lists, workspace navigation |
| Patient Record Access | 1h | Lab | Finding patients, viewing history, demographics |
| Clinical Documentation | 1h | Lab | SOAP notes, consultation notes, templates |
| Order Entry | 1h | Lab | Lab orders, imaging orders, medication orders |
| e-Prescribing | 1h | Lab | Prescriptions, drug interactions, formulary |
| Discharge and Follow-up | 1h | Lab | Discharge summary, follow-up scheduling, referrals |

**Important:** Drug interaction scenario must be demonstrated live with clinical trainer.

---

### 9. IT Support

**Target audience:** Hospital/clinic IT helpdesk
**Duration:** 12 hours

| Module | Duration | Format | Topics |
|--------|---------|--------|--------|
| Platform Architecture | 2h | Document | Component overview for support |
| Common User Issues | 2h | Document + Lab | Login issues, password reset, access problems |
| Performance Issues | 2h | Document | Slow system checklist, escalation |
| Integration Troubleshooting | 2h | Lab | HL7, DICOM, API connectivity |
| Log Analysis | 2h | Lab | Reading logs, finding errors |
| Escalation Procedures | 1h | Document | What to escalate, how to escalate |
| Support Ticket Process | 1h | Lab | Ticket creation, severity classification |

---

## Academy Content Structure (in Platform)

Content is managed via the Academy module. Each course maps to:
- `Course` record with `code`, `product_area`, `target_audience`, `level`
- `CourseModule` records (ordered modules)
- `ContentItem` records per module (video, document, quiz, lab)
- `Assessment` for certification exam
- `Certificate` issued on passing

**Creating a course:**
```python
from products.academy.models import Course, CourseModule, ContentItem

course = Course.objects.create(
    title="CyMed Pharmacy Manager Certification",
    code="CYMED-PHARM-MGR-001",
    product_area="cymed",
    target_audience="administrator",
    level="intermediate",
    duration_hours=10,
    tenant_id=<UUID>,
)
```

---

## Training Delivery for Pilot Implementation

### Recommended Schedule for Clinic Pilot

| Week | Activity |
|------|---------|
| Week -4 | System Administrator training (IT team) |
| Week -3 | Administrator training (clinic manager) |
| Week -2 | Physician and nursing training (key users) |
| Week -1 | Finance and billing training |
| Week -1 | Super-user refresher training |
| Go-Live week | On-site support, hands-on assistance |
| Week +1 | Reinforcement training, FAQs |

### Training Completion Gate

**No user receives production credentials until their training certification is issued by the Academy.**

The implementation lead verifies training completion report from Academy before granting production access.

---

## Certification Summary

| Certification | Required Before Go-Live | Pass Threshold |
|--------------|------------------------|----------------|
| System Administrator | IT Lead only | 80% |
| Hospital/Clinic Administrator | Admin team | 80% |
| Pharmacy Manager | Chief Pharmacist | 85% |
| Laboratory Manager | Lab Director | 85% |
| Radiology Manager | Chief Radiologist | 80% |
| Clinician | All prescribing physicians | 80% |
| Finance | Billing team | 80% |
| IT Support | IT helpdesk | 80% |
