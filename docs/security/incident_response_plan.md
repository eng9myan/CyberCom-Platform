# Incident Response Plan

> **Status:** Approved — Program 0, Phase 0.4
> **Owner:** Chief Security Architect + DevSecOps Architect
> **Activation:** This plan activates the moment a security event is suspected — not when it is confirmed.

---

## 1. Scope & Definitions

- **Event** — any observable security-relevant occurrence (failed login spike, IDS alert, vulnerability disclosure).
- **Incident** — an event (or set of events) that adversely affects, or threatens to affect, the confidentiality, integrity, or availability of CyberCom systems or data.
- **Breach** — an incident with confirmed unauthorized acquisition / access / disclosure of regulated data (PHI/PII/payment/etc.) triggering regulatory notification.

---

## 2. Severity Classification

| Sev | Definition | Examples | Target IR start |
|---|---|---|---|
| **SEV-1** | Critical impact: confirmed/likely breach of regulated data, prod down at platform scale, active intruder | PHI exfiltration, ransomware, IdP compromise | ≤ 15 min |
| **SEV-2** | High impact: significant degradation, scoped data exposure, credential compromise | Tenant cross-leak isolated to one tenant, key compromise | ≤ 30 min |
| **SEV-3** | Moderate: limited scope, no regulated data confirmed | Vulnerable dependency in prod, suspicious admin action | ≤ 2 h |
| **SEV-4** | Low: contained, informational | Phishing report, scanner alert with no exploitation | ≤ 1 business day |

The Incident Commander (IC) may upgrade severity at any time.

---

## 3. Roles

| Role | Responsibility |
|---|---|
| **Incident Commander (IC)** | Single decision-maker for the response. Coordinates roles. |
| **Scribe** | Maintains the timeline in the incident channel and ticket. |
| **Communications Lead** | Internal updates; coordinates external comms via Legal/PR. |
| **Technical Lead(s)** | Investigation, containment, eradication, recovery. |
| **Security Lead** | Forensics, evidence preservation, threat assessment. |
| **Compliance / Privacy Officer** | Regulatory notification clock, scope assessment, BAA contacts. |
| **Legal** | Privilege, contracts, law enforcement liaison. |
| **Executive Sponsor** | Authority for major decisions (shutdowns, public statements). |

On-call rotations defined in `docs/implementation/oncall/` (to be authored when teams form).

---

## 4. Lifecycle (NIST 800-61 aligned)

```
Prepare ──► Detect & Analyze ──► Contain ──► Eradicate ──► Recover ──► Lessons Learned
```

### 4.1 Prepare (continuous)
- Runbooks per playbook (§7) maintained and tested.
- Tabletop exercises quarterly; full simulation annually.
- On-call paging tested weekly.
- Forensic tooling installed and access pre-granted.
- Communications templates pre-approved by Legal.

### 4.2 Detect & Analyze
- Sources: SIEM alerts, audit log anomalies, EDR, WAF, customer reports, partner notifications, public CVE disclosures.
- IC declares incident, opens war-room channel, opens incident ticket, assigns severity, starts the **timeline clock**.
- Initial triage answers: scope, blast radius, regulated data involvement, attacker still active?

### 4.3 Contain
- **Short-term** containment first: revoke credentials, rotate keys, block IPs, isolate hosts, disable affected feature flags, take affected tenant read-only.
- **Long-term** containment: patch, redeploy hardened, rebuild, network segmentation changes.
- Preserve evidence (memory, disk, logs) **before** destructive containment.

### 4.4 Eradicate
- Remove malware, backdoors, attacker accounts, persistence.
- Patch vulnerability across all affected systems.
- Rotate every credential the attacker could have touched (assume worst case).
- Validate via fresh scans, IR-grade.

### 4.5 Recover
- Restore from known-good (backups, signed images).
- Phased re-introduction to traffic; heightened monitoring window 72 h minimum.
- Confirm SLOs and security baselines green before declaring closed.

### 4.6 Lessons Learned
- Blameless post-incident review within **5 business days**.
- Output: root cause(s), corrective actions with owners and due dates, control gaps, ADRs where structural.
- Findings tracked to completion; recurrence is itself an incident.

---

## 5. Communication

- **Internal channel:** dedicated incident channel per incident; no DMs for decisions.
- **Cadence:** SEV-1 updates every 30 min; SEV-2 every hour; SEV-3 each business half-day.
- **External:** drafted by Comms Lead, reviewed by Legal, approved by Executive Sponsor.
- **Customers:** status page + email per contract; do not speculate on cause until verified.
- **Regulators:** see §6.
- **Law enforcement:** via Legal only.

---

## 6. Regulatory & Contractual Notification

The Compliance / Privacy Officer owns the notification clock. Clocks start at **awareness**, not at confirmation.

| Regulation | Trigger | Clock |
|---|---|---|
| **GDPR Art. 33** | Personal data breach | **72 h** to supervisory authority |
| **GDPR Art. 34** | High risk to data subjects | "Without undue delay" to subjects |
| **HIPAA §164.404** | Unsecured PHI breach | **≤ 60 days** to subjects; HHS per scope |
| **HIPAA §164.408** | > 500 individuals | HHS + media without unreasonable delay |
| **State laws (US)** | Per state | Tracked in compliance register |
| **Sector regs (MOH, central banks, telecom)** | Per jurisdiction | Tracked in compliance register |
| **Customer BAAs / DPAs** | Per contract | Tracked per tenant |

Documentation requirements: nature, categories & approximate number of records, consequences, measures taken, contact, mitigations.

---

## 7. Standard Playbooks

Maintained as `docs/security/playbooks/<name>.md` (to be authored). Phase 0.4 establishes the catalog:

1. **Stolen / leaked credential** (workforce or customer).
2. **Compromised secret / API key** (rotation + lineage audit).
3. **PHI/PII exposure** (logs, exports, screenshots).
4. **Ransomware on workstation / server**.
5. **Suspected IdP compromise**.
6. **Insider misuse / unauthorized access**.
7. **Third-party / vendor compromise**.
8. **Vulnerability with active exploitation (zero-day)**.
9. **DDoS / availability attack**.
10. **Cross-tenant data leak** (e.g. RLS misconfig).
11. **Backup compromise / failed restore**.
12. **Supply-chain compromise** (dependency, base image, build pipeline).
13. **AI-assistant misuse / data exfiltration via prompts**.

Each playbook contains: triggers, severity guidance, immediate containment, evidence to collect, communication, regulatory triggers, recovery steps, post-incident actions.

---

## 8. Evidence Handling

- Preserve **before** changing: memory captures, disk images, logs, audit events.
- Chain of custody recorded in the incident ticket.
- Encrypted evidence store with restricted access.
- Retention: until matter closed + applicable statute of limitations.
- Coordination with Legal under privilege where appropriate.

---

## 9. Tooling

| Function | Tool (target) |
|---|---|
| SIEM | Per ADR (e.g. Elastic, Splunk, Sumo) |
| EDR / CWP | Per ADR |
| Runtime container security | Falco |
| Forensic capture | GRR / native cloud snapshots |
| Ticketing | GitHub Issues (private repo) or Jira |
| Paging | PagerDuty / Opsgenie |
| War-room | Slack / Teams dedicated channel |
| Status page | Statuspage / Better Stack |

---

## 10. Backups & Recovery Integration

Recovery uses paths defined in [`backup_recovery_strategy.md`](backup_recovery_strategy.md). IR-grade recovery prefers immutable, off-account, KMS-isolated backups.

---

## 11. Metrics

- MTTD (mean time to detect)
- MTTA (mean time to acknowledge)
- MTTC (mean time to contain)
- MTTR (mean time to recover)
- % incidents with post-mortem completed on time
- Recurrence rate
- Notification on-time rate

Reviewed monthly by Security; quarterly with Executive Sponsor.

---

## 12. Plan Maintenance

- Reviewed at least annually and after each SEV-1/SEV-2.
- All changes via PR with `security` label; approved by Chief Security Architect.
- Versioned in git; printed copies discouraged (rapid drift).
