# Disaster Recovery Report — CyberCom Platform

**Date:** 2026-06-28  
**Author:** Chief DevOps Engineer, Principal SRE  
**Project:** CyberCom Platform  

---

## 1. Objectives: RTO & RPO

Our Disaster Recovery (DR) plan is designed to minimize data loss and restore services quickly on Oracle Cloud Infrastructure (OCI):
- **Recovery Time Objective (RTO):** < 4 hours (target timeline to restore full operational services).
- **Recovery Point Objective (RPO):** < 1 hour (maximum acceptable data age lost during disaster).

---

## 2. Replication & Backup Copy Strategy

The architecture supports multiple protection layers:
- **Active-Standby DB System:** Real-time streaming replication across two Availability Domains within the primary region.
- **WAL Archiving:** Write-Ahead Logs (WAL) are shipped to OCI Object Storage every 5 minutes.
- **Cross-Region Replication:** Automated copy scripts clone base backups and WAL archives from the primary region (`me-dubai-1`) to the secondary DR region (`eu-frankfurt-1`) every hour.

---

## 3. Disaster Recovery Runbook Procedures

We have fully automated the DR workflows via the [dr_procedures.sh](file:///d:/Cybercom%20Final/CyberCom-Platform/scripts/dr/dr_procedures.sh) script:

### Step 1: Health Evaluation
Monitors standby lag and connection status:
```bash
bash scripts/dr/dr_procedures.sh
```

### Step 2: Automated Base Backup Generation
Generates a point-in-time recovery (PITR) base snapshot and switches WAL archives.

### Step 3: Offsite Archiving
Uploads and replicates the backup to the secondary region.

### Step 4: Dry-Run Restore Validation
Restores the backup file onto a temporary validation cluster to verify that database tables and schemas are intact.

### Step 5: Failover Activation
Promotes the standby replica database node to primary status and reroutes service bindings:
```bash
bash scripts/dr/dr_procedures.sh --trigger-failover
```
