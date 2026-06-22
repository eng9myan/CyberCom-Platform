# Disaster Recovery Guide

This document defines recovery time objectives, database replication architectures, and failover/restoration checklists for the platform.

---

## 1. DR Objectives (RTO & RPO)

The platform enforces strict Recovery Time Objective (RTO) and Recovery Point Objective (RPO) targets to prevent data loss or clinical operations downtime:

*   **Recovery Time Objective (RTO):** < 1 minute (for automated failovers).
*   **Recovery Point Objective (RPO):** < 1 second (for database replication).

---

## 2. Multi-Region Replication Architecture

To support these objectives, the platform is deployed in active-active multi-region configurations:

*   **Database Replication:** Configures PostgreSQL active-active replication using **pglogical**. This synchronizes tenant data in real time between `me-central-1` (Primary region) and `me-central-2` (DR region).
*   **KMS Keys Replication:** Vault secret caches and cryptographic signing keys are mirrored across regions automatically.
*   **Kafka MirrorMaker:** Replicates events across Kafka clusters in both regions.

---

## 3. DR Failover Checklist

In the event of a primary region outage:

1.  **Dns Switch:** DNS routing (via Cloudflare/Route53 latency routing) automatically shifts traffic to `me-central-2` within 10 seconds.
2.  **Verify Database Health:** Connect to the `me-central-2` database and confirm the replication lag is 0.
3.  **Active Sessions Retention:** Since Keycloak sessions are replicated, users should not be logged out during failover.
4.  **Audit Failover:** Check the platform operations dashboard under the **Operations** tab, and verify that the replication status is active.

---

## 4. Backup & Restoration Checklist

For database recovery from backups:

1.  **Stop Inbound Traffic:** Block API access to prevent write conflicts during restoration.
2.  **Retrieve Backup:** Download the last database snapshot from secure GCS buckets.
3.  **Validate Integrity:** Run the backup validation test script to ensure zero file corruption.
4.  **Execute PG Restore:** Run `pg_restore` onto the target database cluster.
5.  **WAL Replay:** Apply archived Write-Ahead Logs to sync up to the point of failure.
6.  **Verify RLS:** Verify that PostgreSQL row-level security (RLS) policies are active and that no cross-tenant records are exposed.
7.  **Re-enable Inbound Traffic:** Restore DNS and API routing.
