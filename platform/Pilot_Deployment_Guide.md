# Pilot Deployment Guide — CyberCom Platform
**Program 10, Phase 4 — Customer Pilot Package**  
**Date:** 2026-06-29  
**Audience:** Implementation Engineers, Customer IT Teams

---

## Overview

This guide covers end-to-end pilot deployment for all five CyberCom facility types: Hospital, Clinic, Laboratory, Imaging Center, and Pharmacy.

Estimated deployment time per facility:
- Small clinic: 4–6 hours
- Hospital: 1–2 days
- Full network: 3–5 days

---

## Prerequisites

### Infrastructure Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 8 vCPU | 16 vCPU |
| RAM | 16 GB | 32 GB |
| Storage | 200 GB SSD | 500 GB NVMe |
| PostgreSQL | 14+ | 15+ |
| Redis | 6.2+ | 7.0+ |
| Kubernetes | 1.27+ | 1.29+ |
| Helm | 3.12+ | 3.14+ |

### Access Requirements

- [ ] `kubectl` configured with cluster admin or `cybercom-deployer` role
- [ ] `helm` 3.12+
- [ ] CyberCom Docker Registry credentials
- [ ] API token with `platform_admin` scope
- [ ] DNS entries for `api.`, `portal.`, `fhir.` subdomains
- [ ] TLS certificates (Let's Encrypt or corporate CA)
- [ ] SMTP credentials for notification emails
- [ ] HashiCorp Vault address and token (or disable Vault for dev pilot)

### License

- [ ] CyberCom license file or license key obtained from CyberCom sales
- [ ] Product codes enabled in license match facility type features

---

## Step 1: Pre-Flight Validation

```bash
# Run pre-flight checks
./scripts/pilot/deploy_pilot.sh \
  --tenant-id "$(uuidgen)" \
  --facility-type clinic \
  --dry-run
```

Review output for any missing dependencies.

---

## Step 2: Deploy Infrastructure

### Option A — Kubernetes (Production Pilot)

```bash
# Add CyberCom Helm repo
helm repo add cybercom https://charts.cy-com.com
helm repo update

# Create namespace
kubectl create namespace cybercom-prod

# Install with values file
helm install cybercom cybercom/cybercom-platform \
  --namespace cybercom-prod \
  --values infrastructure/helm/values/pilot.yaml \
  --wait --timeout 15m
```

### Option B — Docker Compose (Dev/Demo Pilot)

```bash
cd infrastructure/docker
docker compose -f docker-compose.pilot.yml up -d
```

---

## Step 3: Run Deployment Script

```bash
# Hospital deployment
./scripts/pilot/deploy_pilot.sh \
  --tenant-id "<UUID>" \
  --tenant-name "Al-Rashidi General Hospital" \
  --tenant-subdomain "alrashidi" \
  --tenant-country "JO" \
  --facility-type hospital \
  --api-url https://api.cy-com.com \
  --api-token "<ADMIN_TOKEN>" \
  --license-key "<LICENSE_KEY>"

# Clinic deployment
./scripts/pilot/deploy_pilot.sh \
  --tenant-id "<UUID>" \
  --tenant-name "Sunshine Medical Clinic" \
  --facility-type clinic \
  --api-url https://api.cy-com.com \
  --api-token "<ADMIN_TOKEN>" \
  --license-key "<LICENSE_KEY>"
```

The script performs:
1. Pre-flight dependency checks
2. Tenant provisioning
3. License activation
4. Admin user creation
5. Feature flag configuration (per facility type)
6. Demo data population
7. Post-deployment validation

---

## Step 4: Feature Configuration by Facility Type

### Hospital
```
Features enabled: inpatient, emergency, icu, outpatient, surgery, pharmacy, 
                  laboratory, imaging, radiology, nursing_station, 
                  drug_interaction_engine, break_glass, telemedicine
```

### Clinic
```
Features enabled: outpatient, appointments, prescription, laboratory, 
                  drug_interaction_engine, telemedicine, patient_portal
```

### Laboratory
```
Features enabled: specimen_management, lab_results, critical_value_alerts, 
                  loinc_coding, hl7_oru_interface, lis_interface
```

### Imaging Center
```
Features enabled: imaging_orders, dicom_mwl, dicom_viewer, radiology_reporting, 
                  icd11_coding, teleradiology
```

### Pharmacy
```
Features enabled: prescription_dispensing, drug_interaction_engine, 
                  drug_allergy_check, medication_reconciliation, 
                  controlled_substance_tracking, formulary_management
```

---

## Step 5: Integration Configuration

### HL7 v2 Interface

```bash
# Configure HL7 interface engine (example with Mirth Connect)
# Edit: infrastructure/integrations/hl7/mirth-channel-config.xml
# - Set receiving host: localhost:2575
# - Set sending host: <HIS/LIS hostname>:2575
# - Message types: ADT^A01, ADT^A03, ORU^R01, ORM^O01
```

### DICOM

```bash
# Configure DICOM server
# Edit: infrastructure/integrations/dicom/dicom-config.json
# {
#   "aet": "CYBERCOM",
#   "host": "0.0.0.0",
#   "port": 11112,
#   "worklist_aet": "CYBERCOM_MWL"
# }
```

### FHIR

```bash
# FHIR base URL is auto-configured at: /fhir/R4/
# Validate: python scripts/validation/validate_fhir_import.py \
#   --fhir-base https://api.cy-com.com/fhir/R4 \
#   --token <TOKEN> --tenant-id <UUID>
```

---

## Step 6: User Acceptance Testing

```bash
# Run UAT scenarios
python scripts/pilot/uat_scenarios.py \
  --api-url https://api.cy-com.com \
  --tenant-id "<UUID>" \
  --token "<PILOT_ADMIN_TOKEN>" \
  --facility-type hospital \
  --verbose

# Run all facility types
python scripts/pilot/uat_scenarios.py \
  --api-url https://api.cy-com.com \
  --tenant-id "<UUID>" \
  --token "<PILOT_ADMIN_TOKEN>" \
  --facility-type all
```

---

## Step 7: Production Readiness Check

```bash
python scripts/validation/validate_production_readiness.py \
  --api-url https://api.cy-com.com \
  --token "<ADMIN_TOKEN>" \
  --tenant-id "<UUID>" \
  --prometheus-url https://metrics.cy-com.com
```

All checks must PASS or WARN before go-live. FAIL = blocker.

---

## Rollback Procedure

If a deployment fails and must be reverted:

```bash
./scripts/pilot/rollback.sh \
  --tenant-id "<UUID>" \
  --release-name cybercom \
  --namespace cybercom-prod \
  --api-url https://api.cy-com.com \
  --api-token "<ADMIN_TOKEN>" \
  --suspend-tenant \
  --dry-run   # Remove this flag to execute
```

See `Production_GoLive_Checklist.md` for re-deployment steps after rollback.

---

## Hypercare Plan (First 30 Days)

| Period | CyberCom Support Level | Response SLA |
|--------|----------------------|--------------|
| Days 1–7 (Go-Live Week) | On-site / dedicated Slack channel | Critical: 30min |
| Days 8–14 | Remote daily check-in | Critical: 1hr |
| Days 15–30 | Remote on-demand | Critical: 2hr |
| Day 31+ | Standard SLA | Per contract |

### Escalation Path

1. **L1**: Customer super-user
2. **L2**: CyberCom Customer Success (Slack / ticket)
3. **L3**: CyberCom Engineering On-Call
4. **L4**: CyberCom CIO / CTO (P1 incidents only)

---

## Training Material Locations

| Audience | Material | Location |
|----------|---------|---------|
| Administrators | Platform Administration Guide | `docs/admin-guide/` |
| Clinicians | Clinical Workflow Guide | `docs/clinical-guide/` |
| Lab Staff | Laboratory Module Guide | `docs/lab-guide/` |
| Pharmacists | Pharmacy Module Guide | `docs/pharmacy-guide/` |
| IT Staff | Infrastructure & Integration Guide | `docs/it-guide/` |
| All Users | Quick Start Video Series | Portal `/training` section |

---

## Contact

| Role | Contact |
|------|---------|
| Implementation Lead | implementation@cy-com.com |
| Customer Success | success@cy-com.com |
| Security Incidents | security@cy-com.com |
| 24/7 On-Call | +962-800-CYBERCOM |
