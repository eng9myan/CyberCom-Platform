# Audit Logging Strategy

> **Status:** Approved — Program 0, Phase 0.4
> **Owner:** Compliance Architect + DevSecOps Architect

Audit logs are the legally and operationally significant record of **who did what to which resource, when, from where, and why**. They are distinct from operational logs.

---

## 1. Principles

1. **Tamper-evident.** Append-only, integrity-checked, replicated.
2. **Complete.** Every privileged action and every access to regulated data is recorded.
3. **Structured.** Machine-parsable; canonical schema; stable field names.
4. **Privacy-preserving.** No raw PHI/PII in audit message bodies; identifiers + minimum-necessary context only.
5. **Long-lived.** Retention aligned to legal/regulatory requirement, not application convenience.
6. **Independently observable.** Audit log is reviewable without access to the application database.

---

## 2. Operational vs Audit Logs

| Property | Operational | Audit |
|---|---|---|
| Purpose | Debug, observe, alert | Accountability, compliance, forensics |
| Mutability | Rotated, sampled | Immutable, complete |
| Retention | 30 d hot / 1 y cold | 6 y (HIPAA), 7+ y for finance, longer per jurisdiction |
| Access | Engineering | SecOps + Compliance + Auditors |
| Sampling | Allowed | **Never** |
| Schema | Service-defined | Canonical (this doc) |

Operational logs MAY reference audit event IDs but MUST NOT replicate them.

---

## 3. Canonical Audit Event Schema

JSON, one event per line:

```json
{
  "event_id": "01JZ9V4D7H8K1Q2W3E4R5T6Y7U",   // ULID/UUIDv7
  "ts": "2026-06-21T14:32:11.184Z",            // RFC 3339 UTC
  "schema_version": "1.0",
  "service": "cymed-patient",
  "service_version": "1.4.2",
  "env": "prod",
  "category": "data_access",                   // see §4
  "action": "patient.read",                    // dot.case verb
  "outcome": "success",                        // success | denied | error
  "severity": "info",                          // info | notice | warn | high | critical
  "actor": {
    "type": "user",                            // user | service | system
    "id": "user_01J...",                       // stable identifier
    "tenant_id": "tenant_01J...",
    "session_id": "sess_01J...",
    "auth_method": "webauthn+mfa",
    "roles": ["clinician"],
    "device_id": "dev_01J..."
  },
  "resource": {
    "type": "patient",
    "id": "pt_01J...",
    "tenant_id": "tenant_01J...",
    "data_class": "PHI"
  },
  "context": {
    "purpose": "treatment",                    // treatment | payment | operations | emergency | research
    "ip": "203.0.113.42",
    "user_agent": "CyMed/1.4 (iOS 18.1)",
    "correlation_id": "01JZ9V...",
    "trace_id": "00-...-...-01",
    "request_id": "req_01J..."
  },
  "change": {                                  // present for writes
    "fields": ["address.city"],
    "before_hash": "sha256:...",               // hash, NOT plaintext
    "after_hash": "sha256:..."
  },
  "policy": {
    "id": "policy.patient.read.v3",
    "decision": "allow",
    "obligations": ["mask:ssn"]
  },
  "integrity": {
    "prev_hash": "sha256:...",                 // hash chain for tamper detection
    "hash": "sha256:...",
    "signed_by": "kid:audit-signing-2026-q2"
  }
}
```

**Rules:**
- `actor.id`, `resource.id`, `tenant_id` are opaque stable identifiers — not names, not PHI.
- `change` carries hashes, never plaintext PHI/PII; full before/after stored encrypted in a separate, restricted store when required.
- Every event signed and chained (`prev_hash → hash`) for tamper evidence.

---

## 4. Categories (what MUST be audited)

| Category | Examples |
|---|---|
| `authentication` | Login success/failure, MFA challenge, password change, session create/revoke |
| `authorization` | Policy decision (allow/deny), role grant/revoke, JIT elevation |
| `data_access` | Read of PHI/PII/Confidential records, exports, prints, downloads |
| `data_mutation` | Create/update/delete of regulated records |
| `clinical` | Chart open, order placed, prescription, break-the-glass, eMAR |
| `financial` | Posting, payment, refund, ledger correction |
| `admin` | Tenant config, user/role change, policy change, feature flag flip |
| `security` | Key rotation, secret read by human, firewall/policy change |
| `integration` | Inbound/outbound message receipt, replay, signature verify |
| `consent` | Consent grant/withdraw, purpose-binding change |
| `lifecycle` | Account create, suspend, delete, data export, erasure |
| `system` | Deploy, rollback, schema migration, backup, restore |

---

## 5. Tamper Evidence & Integrity

- **Append-only sink.** Object storage with **Object Lock / Worm** (compliance mode) for the cold tier.
- **Hash chain** per (service, day) partition; chain head signed daily and published to an internal transparency log.
- **Digital signatures** on each event (Ed25519, key per signer with `kid`).
- **Independent verifier** job nightly recomputes hashes and validates signatures; failures page on-call.
- **Cross-region replication** to a separate account/subscription/project with **no shared admin**.

---

## 6. Storage & Retention

| Tier | Medium | Latency | Default retention |
|---|---|---|---|
| Hot | OpenSearch / SIEM | seconds | 90 days |
| Warm | Cloud-managed log store | minutes | 1 year |
| Cold | Object storage (Object Lock) | hours | 6 years (HIPAA), 7 years (finance), longer per jurisdiction |

Retention overridden by:
- **Legal hold** — pauses deletion for affected scope.
- **Sector regulation** — e.g. national archives, pharma traceability.
- **Tenant configuration** — only upward, never below baseline.

---

## 7. Access to Audit Data

- Read access: SecOps, Compliance, named Auditors. Engineering has **no standing access**.
- All access to audit storage is itself audited (meta-audit).
- Queries scoped to tenant for auditors representing a tenant.
- Export requires ticket + dual approval.

---

## 8. Privacy Controls

- Audit body MUST NOT contain plaintext PHI/PII. Only stable identifiers + class tags.
- Free-text fields (e.g. `notes`) are forbidden in audit events.
- Where context requires PHI/PII (e.g. SAR fulfillment), it is stored in a **separate** encrypted store joined by `event_id`, accessible only with explicit privacy-officer approval.
- Right-to-erasure does **not** erase audit events (legal requirement) but erases the joined PII payload — leaving the audit trail intact.

---

## 9. Operational Logging Rules (to keep audit clean)

- Operational logs MUST redact: passwords, tokens, cookies, full request bodies for PHI/PII endpoints, query parameters known to carry IDs.
- Use a redaction library with a maintained allow/deny list.
- Operational log retention is short (≤ 1 year); not a substitute for audit.

---

## 10. SIEM & Detection

- Audit events streamed to SIEM in real time.
- Detection rules (sample):
  - Mass read of PHI by one actor in short window.
  - Break-the-glass without subsequent review within 24 h.
  - Policy denials spike per tenant.
  - Export from new device/IP for privileged role.
  - Off-hours admin action without change ticket.
- Detections page on-call per severity.

---

## 11. Compliance Mapping

| Reg / Standard | Clause | Met by |
|---|---|---|
| HIPAA §164.312(b) | Audit controls | This strategy + immutable sink |
| HIPAA §164.308(a)(1)(ii)(D) | Information system activity review | SIEM + nightly verifier |
| GDPR Art. 30 | Records of processing | Audit + DPO export tooling |
| GDPR Art. 32 | Integrity & confidentiality | Hash chain + signing |
| ISO 27001 A.8.15 | Logging | Canonical schema + retention |
| SOC 2 CC7.2 | System monitoring | SIEM detection rules |
| NIST 800-53 AU family | Audit & Accountability | This whole document |
| PCI DSS 10 | Track & monitor access | Same controls; finance modules |

---

## 12. Forbidden

- Writing PHI/PII into audit event bodies.
- Deleting audit events (use legal hold + retention, never `DELETE`).
- Editing audit events post-write.
- Disabling audit logging in any environment that handles real customer/tenant identities.
- Replaying audit events as operational triggers (audit is observation, not control).
