# Pilot Go-Live Plan

**Version:** 1.0
**Date:** 2026-06-28
**Target:** First CyberCom customer deployments

---

## Pilot Strategy

Deploy five concurrent pilots, one per product type:
1. One Clinic (lowest complexity — first to go live)
2. One Laboratory
3. One Imaging Center
4. One Pharmacy
5. One Hospital (highest complexity — last to go live)

This sequencing allows the implementation team to build capability incrementally. Clinic goes live first. Hospital goes live last, with lessons from all other pilots applied.

---

## Recommended Timeline

```
Month 1:     Clinic Discovery + Design
Month 2:     Clinic Build + Test
Month 2:     Lab Discovery + Design (parallel)
Month 3:     CLINIC GO-LIVE
Month 3:     Lab Build + Test
Month 3:     Imaging + Pharmacy Discovery (parallel)
Month 4:     LAB GO-LIVE
Month 4:     Imaging + Pharmacy Build + Test
Month 4:     Hospital Discovery + Design
Month 5:     IMAGING GO-LIVE
Month 5:     PHARMACY GO-LIVE
Month 5-6:   Hospital Build + Test
Month 7:     HOSPITAL GO-LIVE
```

---

## Pilot 1 — Clinic

### Target: Single-Specialty Clinic (e.g., General Practice or Cardiology)

**Scope:** CyMed Clinic Edition
- Appointments
- Consultations
- Triage and Queue
- e-Prescriptions
- Basic billing (charge capture)
- Patient Portal

**Infrastructure:**
```
Cloud: OCI (Oracle Cloud) preferred (existing Terraform module)
Environment: Dedicated staging → production
Users: 5–20 physicians, 10–30 nurses/receptionists
Daily volume: 50–200 encounters
```

**Deployment Package:**

```bash
# 1. Provision infrastructure
terraform apply -var-file=environments/pilot-clinic.tfvars

# 2. Deploy
helm upgrade --install cybercom-clinic ./infrastructure/helm/cybercom-platform/ \
  --namespace cybercom-pilot-clinic \
  -f infrastructure/environments/pilot/clinic.yaml

# 3. Apply migrations
kubectl exec deploy/cybercom-backend -- python manage.py migrate

# 4. Seed demo data (optional for training environment)
kubectl exec deploy/cybercom-backend -- python manage.py seed_clinic_demo \
  --tenant-id <UUID> --mode training

# 5. Create tenant and configure
python scripts/provisioning/provision_tenant.py \
  --name "Pilot Clinic" \
  --edition professional \
  --modules clinic,patient_portal
```

**Demo Data Package:**

Training environment pre-loaded with:
- 500 anonymized patient records
- 50 provider records
- 2,000 historical appointments
- 200 historical encounters with notes and orders
- 50 prescription records
- Lab and imaging order history

Data seed script: `python manage.py seed_clinic_demo --tenant-id <UUID>`

**Validation Scripts:**

```bash
# Verify all workflows operational
python scripts/validation/validate_clinic.py --tenant-id <UUID>

# Output: 
# ✓ Patient registration: PASS
# ✓ Appointment booking: PASS
# ✓ Queue management: PASS
# ✓ Consultation workflow: PASS
# ✓ Prescription generation: PASS
# ✓ Drug interaction check: PASS
# ✓ Billing charge capture: PASS
# ✓ Notifications: PASS
```

**UAT Package:**
- UAT scenarios from `Clinical_Validation_Package.md` sections: PH-01, NU-02, REG-01, BILL-01
- Sign-off forms
- Training completion verification

**Go-Live Checklist:**
- [ ] Infrastructure verified
- [ ] Data migration completed and validated
- [ ] All users trained and certified
- [ ] UAT completed with 100% P0 pass
- [ ] Integrations tested (insurance clearinghouse, SMS, email)
- [ ] Drug interaction database seeded (if pharmacy in scope)
- [ ] Rollback procedure confirmed with IT lead
- [ ] Go/No-Go meeting with medical director and IT lead
- [ ] Hypercare team assigned

---

## Pilot 2 — Laboratory

### Target: Commercial Laboratory or Hospital Lab (50–500 tests/day)

**Scope:** CyMed Laboratory Edition
- Orders and Accessioning
- Results
- Microbiology
- Quality Control
- Analytics

**Key Pre-Requisites:**
- Lab director available for critical value threshold configuration
- LOINC mapping completed and validated
- HL7 interface from at least one analyzer confirmed and tested

**Deployment Package:**

```bash
helm upgrade --install cybercom-lab ./infrastructure/helm/cybercom-platform/ \
  --namespace cybercom-pilot-lab \
  -f infrastructure/environments/pilot/laboratory.yaml
```

**Lab-Specific Configuration Script:**

```bash
# Import test catalog (LOINC mapped)
python scripts/migration/run_migration.py \
  --entity lab_catalog \
  --input lab_catalog_loinc_mapped.csv \
  --tenant-id <UUID>

# Configure critical value thresholds
python scripts/config/set_critical_values.py \
  --config critical_values.json \
  --tenant-id <UUID>

# Configure auto-verification rules
python scripts/config/set_autoverification_rules.py \
  --config autoverification_rules.json \
  --tenant-id <UUID>
```

**Analyzer Interface Test:**

```bash
# Send test HL7 ORM and verify order appears
python scripts/integration/test_hl7_interface.py \
  --interface analyzer-1 \
  --test-order-file test_order_cbc.hl7 \
  --tenant-id <UUID>
```

**Go-Live Checklist:**
- [ ] Test catalog imported and validated by lab director
- [ ] Critical value thresholds configured and tested
- [ ] Auto-verification rules configured and tested
- [ ] Analyzer HL7 interfaces tested and working
- [ ] Critical value notification tested (alert received by physician)
- [ ] Lab staff training complete
- [ ] UAT completed (LAB-01 scenario)
- [ ] QC lot setup verified

---

## Pilot 3 — Imaging Center

### Target: Radiology Center (1–4 modalities)

**Scope:** CyMed Imaging Edition
- Orders and Scheduling
- DICOM PACS Gateway
- Modality Worklist
- Radiology Reporting
- Analytics

**Key Pre-Requisite:**
- DICOM conformance statement from each modality
- Existing PACS vendor cooperation for C-STORE/C-FIND testing

**Deployment Package:**

```bash
helm upgrade --install cybercom-imaging ./infrastructure/helm/cybercom-platform/ \
  --namespace cybercom-pilot-imaging \
  -f infrastructure/environments/pilot/imaging.yaml
```

**DICOM Gateway Verification:**

```bash
# DICOM Echo test
dcmecho -c CYBERCOM imaging-server:11112

# Send test DICOM study
dcmsend -aet MODALITY_AET -aec CYBERCOM imaging-server:11112 test_study.dcm

# Verify image received and linked to patient
python scripts/integration/verify_dicom_receipt.py --study-uid <UID> --tenant-id <UUID>
```

**Go-Live Checklist:**
- [ ] DICOM C-STORE working from all modalities
- [ ] Modality worklist (MWL) working on all modalities
- [ ] PACS gateway connectivity verified
- [ ] Critical finding notification tested
- [ ] Radiologist signature workflow tested
- [ ] Report distribution tested (fax/portal/HL7)
- [ ] Staff training complete
- [ ] UAT completed (RAD-01 scenario)

---

## Pilot 4 — Pharmacy

### Target: Single-Site Pharmacy (Hospital or Retail)

**Scope:** CyMed Pharmacy Edition
- Prescriptions and Dispensing
- Drug Interactions
- Formulary
- Inventory Bridge (CyCom)

**Critical Pre-Requisite:**
Drug interaction rule database must be licensed and loaded before any live patient use.

**Deployment Package:**

```bash
helm upgrade --install cybercom-pharmacy ./infrastructure/helm/cybercom-platform/ \
  --namespace cybercom-pilot-pharmacy \
  -f infrastructure/environments/pilot/pharmacy.yaml

# Load formulary
python scripts/migration/run_migration.py \
  --entity pharmacy_catalog \
  --input formulary.csv \
  --tenant-id <UUID>

# Load drug interaction rules (from licensed database)
python scripts/migration/load_interaction_rules.py \
  --source micromedex_export.json \
  --tenant-id <UUID>
```

**Drug Interaction Test:**

```bash
# Test known interaction pair
python scripts/validation/test_drug_interaction.py \
  --drug1 rxnorm:10582 \
  --drug2 rxnorm:41493 \
  --expected-severity severe \
  --tenant-id <UUID>
```

**Go-Live Checklist:**
- [ ] **Drug interaction database licensed and loaded** (CRITICAL)
- [ ] Formulary configured and validated by pharmacist
- [ ] Drug interaction alerts tested with known pairs
- [ ] Allergy alert tested
- [ ] Dispensing workflow tested end-to-end
- [ ] Controlled substance workflow tested
- [ ] Inventory bridge with CyCom tested
- [ ] Staff training complete
- [ ] UAT completed (PH-PHARM-01, PH-PHARM-02 scenarios)
- [ ] Pharmacist sign-off obtained

---

## Pilot 5 — Hospital

### Target: Community Hospital (50–200 beds)

**Scope:** Full CyMed Suite
- Hospital (ADT, Inpatient, Emergency, Nursing, Bed Management)
- Clinic (Outpatient)
- Laboratory (Internal lab)
- Imaging (Radiology)
- Pharmacy (Hospital pharmacy)
- Patient Portal
- Provider Portal
- Revenue Cycle

**Deployment Note:** Deploy in phases within the hospital. Start with outpatient clinic, then add inpatient, then ancillary services.

**Hospital-Specific Configuration:**

```bash
# Configure hospital structure
python scripts/config/setup_hospital.py \
  --config hospital_structure.json \  # wards, beds, departments, ORs, ICU
  --tenant-id <UUID>

# Configure bed types and locations
python scripts/config/setup_beds.py \
  --beds-config beds.csv \
  --tenant-id <UUID>
```

**Hospital Go-Live Checklist:**
- [ ] All clinic pilot prerequisites met
- [ ] All lab pilot prerequisites met
- [ ] All imaging pilot prerequisites met
- [ ] All pharmacy pilot prerequisites met
- [ ] ADT workflow tested (admission, discharge, transfer)
- [ ] Emergency department workflow tested
- [ ] ICU workflow tested
- [ ] OR scheduling tested
- [ ] Bed management board tested
- [ ] All clinical staff trained (physicians, nurses, pharmacy, lab, radiology, admin, billing)
- [ ] All integrations tested (lab interfaces, PACS, insurance)
- [ ] Data migration completed and validated
- [ ] UAT with 100% P0 pass (all 11 scenarios from Clinical Validation Package)
- [ ] Medical director sign-off
- [ ] IT director sign-off
- [ ] Executive sponsor sign-off
- [ ] Rollback procedure confirmed
- [ ] Hypercare team on-site

---

## Hypercare Support

All pilots receive:
- 2 weeks minimum hypercare
- On-site support for first 3 days post go-live
- Daily issue triage calls
- Emergency hotline for P0 issues (response < 1 hour)
- P1 issue response < 4 hours
- P2 issue response < 1 business day

---

## Pilot Success Metrics

At hypercare exit, measure:

| Metric | Target |
|--------|--------|
| System uptime | > 99.5% |
| API response p95 | < 200ms |
| User adoption rate | > 80% of trained users active |
| Support ticket resolution | P0: < 1h, P1: < 4h, P2: < 1 day |
| Clinical workflow completion rate | > 95% (no abandonment mid-workflow) |
| Data accuracy | > 99% record accuracy vs source |
| User satisfaction score | > 4/5 |
