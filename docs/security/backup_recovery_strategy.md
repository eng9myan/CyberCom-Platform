# Backup & Recovery Strategy

> **Status:** Approved — Program 0, Phase 0.4
> **Owner:** DevSecOps Architect + Platform Architect

Backups protect against loss and corruption; they are also a primary control against ransomware. A backup that has not been tested is not a backup.

---

## 1. Principles

1. **3-2-1-1-0.** At least 3 copies, on 2 different media, 1 off-site, 1 **immutable / offline-equivalent**, with **0** errors from regular restore tests.
2. **Encrypted always.** At rest with KMS-managed keys; in transit with TLS 1.3.
3. **Isolated trust.** Backup account/subscription/project distinct from primary; **no shared admin** with prod.
4. **Tested.** Restore drills on a schedule; results signed off by DevOps Architect.
5. **Right-sized.** RTO/RPO targets per tier; over-investing in cold tiers is waste, under-investing in hot tiers is risk.

---

## 2. Recovery Tiers

| Tier | Examples | RTO | RPO |
|---|---|---|---|
| **Tier 1 — Mission critical** | CyIdentity, audit log, CyMed clinical, billing | ≤ 1 h | ≤ 5 min |
| **Tier 2 — Business critical** | ERP modules, CyData warehouse hot tier, CyCom | ≤ 4 h | ≤ 1 h |
| **Tier 3 — Standard** | Marketing site, internal tools | ≤ 24 h | ≤ 24 h |
| **Tier 4 — Best effort** | Sandboxes, ephemeral envs | n/a | n/a |

Each service's `README.md` declares its tier. Capacity, monitoring, and on-call follow tier.

---

## 3. What Is Backed Up

| Data | Method | Frequency | Retention |
|---|---|---|---|
| PostgreSQL (per service) | Daily full + continuous WAL archiving (PITR) | Continuous | 30 d hot, 1 y cold (regulated: per law) |
| Object storage | Versioning + cross-region replication; lifecycle to cold | Continuous | Per data class |
| Redis (persistent variants) | Daily snapshot + AOF | Daily | 7 d (cache rarely needs more) |
| Kafka topics (retained log) | Tiered storage / mirror to cold | Continuous | Per topic policy |
| Search (OpenSearch) | Snapshots | Daily | 30 d (rebuild from source where possible) |
| Vault / secrets | Encrypted snapshots | Daily | 90 d + per request |
| Container images & artifacts | Registry replication; signed | Per build | Per release retention |
| Source code | GitHub + clone-grade mirror to neutral store | Continuous | Permanent |
| Infrastructure state | Terraform state with versioning + locking | Continuous | Permanent |
| Audit log (cold tier) | Object-lock (compliance mode) | Continuous | 6+ years |
| Configurations (K8s, Helm, policies) | GitOps repo + cluster state snapshots | Per change | 1 y |
| Workforce / customer identity store (CyIdentity) | Vendor + own encrypted export | Daily | 1 y |

---

## 4. Storage & Immutability

- Backups stored in **separate cloud account** (or subscription/project) with break-glass-only human access.
- **Object Lock / WORM in compliance mode** for audit + Tier-1 backups (cannot be deleted before retention).
- **KMS keys** for backups are separate from primary KMS keys; rotated independently.
- **Geographic redundancy:** at least one copy in a different region/jurisdiction (subject to data-residency constraints).
- **Air-gapped / offline-equivalent** copy for the most critical data sets (Tier-1 + audit) via tape/cold service.

---

## 5. Backup Operations

- All backup jobs **monitored**; failures page within 30 minutes.
- Backups **measured** — every successful backup records: size, duration, source LSN/timestamp, target object, KMS key, checksum.
- **Integrity verification** on every backup (checksum match) and weekly **random restore validation**.
- **No backups to laptops or shared drives. Ever.**

---

## 6. Restore Operations

- Each tier has a **runbook** (in `docs/implementation/runbooks/`) with concrete commands and validation steps.
- Restore drills:
  - Tier 1: **quarterly**, signed off; one drill per year is a full DR (region loss) simulation.
  - Tier 2: **semi-annually**.
  - Tier 3: **annually**.
- Drill outcomes recorded; any RTO/RPO miss is a SEV-3 minimum.
- Restore validation includes: data integrity (row counts, hashes), schema version, secrets present, audit chain intact, smoke tests pass.

---

## 7. Disaster Recovery (DR) Strategies

| Strategy | When | Target services |
|---|---|---|
| **Multi-region active/active** | Tier 1 with strict RTO | CyIdentity, CyMed core, billing |
| **Active/passive (warm)** | Tier 1/2 where active/active is cost-prohibitive | Most platform services |
| **Pilot light** | Tier 2/3 | Long-tail services |
| **Backup & restore** | Tier 3/4 | Internal/marketing tools |

Selection is per service via ADR, balancing RTO/RPO against cost and compliance.

---

## 8. Ransomware Resistance

- **Immutable** backups (Object Lock compliance mode) — cannot be deleted, even by root.
- **Separate trust domain** for backup account/keys.
- **Offline / air-gapped** copy for Tier 1 + audit log.
- **Backup credentials** scoped to *write-only* on primary; reads happen from the recovery account.
- **Honey-token files** in backup buckets to detect unauthorized access.
- **Periodic recovery from immutable copy** verified end-to-end.

---

## 9. Right-to-Erasure vs Backups

- GDPR/HIPAA erasure requests apply to **operational systems immediately**.
- Backup-resident copies expire under the retention schedule; we do **not** restore deleted subjects on recovery.
- Process documented in `docs/security/erasure-procedure.md` (to be authored), including attestation to data subject.

---

## 10. Cross-Tenant / Tenant-Specific Restore

- Restores **must not** affect other tenants.
- Per-tenant restore tooling required for Tier 1 services holding tenant-isolated data; tested at onboarding.
- Tenant-initiated restore requests handled via support runbook with verification and audit.

---

## 11. Documentation Requirements

Every Tier 1/2 service must publish, in its repo, a `RECOVERY.md` with:
- Tier, RTO, RPO
- Backup sources and schedules
- Restore procedure (commands, validation)
- DR strategy (multi-region/active-passive/etc.)
- Last drill date and outcome
- Owner and on-call

CI fails for Tier 1/2 services missing `RECOVERY.md`.

---

## 12. Metrics

- Backup success rate (target ≥ 99.9%)
- Restore drill on-time rate (target 100%)
- RTO / RPO achieved vs target
- Immutable-copy coverage (% of Tier 1 data)
- Backup-key rotation on-time rate

Reviewed monthly by DevOps Architect; quarterly with Compliance.

---

## 13. Forbidden

- Backups stored unencrypted.
- Backups in the same account as the source with the same admin trust.
- Mutable backups for Tier 1 / audit data.
- Restoring untrusted artifacts (always validate signature and checksum).
- Skipping a restore drill because "we recently restored for an incident" — drills test the documented procedure, not ad-hoc heroics.
