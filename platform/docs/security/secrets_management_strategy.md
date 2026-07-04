# Secrets Management Strategy

> **Status:** Approved — Program 0, Phase 0.4
> **Owner:** DevSecOps Architect

A secret is any value whose disclosure would compromise security: passwords, tokens, API keys, signing keys, encryption keys, TLS private keys, database credentials, webhook signing secrets, etc.

---

## 1. Principles

1. **Single source of truth.** All secrets live in a managed secret store. Never in code, env files, container images, or AI prompts.
2. **Short-lived over static.** Generate on demand; rotate frequently; revoke instantly.
3. **Identity-based access.** Workloads and humans authenticate to the store; no shared secrets to fetch secrets.
4. **Auditable.** Every read/write/rotation logged with actor, purpose, and outcome.
5. **Encrypted everywhere.** At rest (KMS), in transit (TLS), and in process memory where supported (mlock, zeroize).

---

## 2. Tooling

| Layer | Tool |
|---|---|
| Secret store | **HashiCorp Vault** (preferred) or cloud-native (AWS Secrets Manager / Azure Key Vault / GCP Secret Manager) — selected per environment |
| KMS / HSM | Cloud KMS with HSM-backed keys for crypto roots |
| K8s integration | **External Secrets Operator (ESO)** — syncs Vault → K8s Secret resources |
| Workload identity | **SPIRE/SPIFFE** in mesh; **GitHub OIDC → cloud role** for CI |
| Local dev | Vault dev server or `.env.example` placeholders only |
| Detection | **Gitleaks** (pre-commit + CI) + GitHub native secret scanning + push protection |

---

## 3. Categories & Rotation

| Category | Examples | Max age | Rotation |
|---|---|---|---|
| **Crypto keys (data)** | KMS data-encryption keys | 30 days | Automatic |
| **Crypto keys (signing)** | JWT signing keys (kid rotation) | 30 days | Automatic |
| **TLS certificates** | Edge, mesh, internal | 30–90 days | cert-manager + ACME / private CA |
| **Database credentials** | Service DB user/password | 24 h | Dynamic via Vault DB engine |
| **Service-to-service tokens** | Short-lived JWT | ≤ 5 min | Per request |
| **Workforce access tokens** | OAuth access | ≤ 15 min | Per request |
| **API keys for partners** | External integrations | 90 days | Self-service portal + automation |
| **Cloud IAM credentials** | Long-lived cloud keys | **Forbidden** | Use workload identity instead |
| **CI/CD credentials** | Registry, deploy | n/a (use OIDC) | n/a |
| **Webhook signing secrets** | HMAC keys | 180 days | Manual with rotation tool |

---

## 4. Workload Pattern (Kubernetes)

```
Vault  ◄──(auth: K8s ServiceAccount JWT)──  External Secrets Operator
   │                                                  │
   │ (issues short-lived dynamic creds)               │
   ▼                                                  ▼
  DB                                          K8s Secret (projected)
                                                      │
                                                      ▼
                                                   Pod (file mount)
```

Rules:
- Secrets injected as **file mounts**, not env vars, where possible (env vars leak into crash dumps and child processes).
- Pods run as non-root; secret files mode `0400`.
- `automountServiceAccountToken: false` unless required.
- Audit Vault leases; alarm on long-running leases.

---

## 5. CI/CD Pattern

- GitHub Actions authenticates to cloud via **OIDC** to assume a short-lived role.
- No long-lived cloud keys in repo secrets.
- Workflow-scoped GitHub `secrets` reserved for: registry tokens (where OIDC unavailable), Slack/PagerDuty webhooks.
- Secret scanning + **push protection** enabled at the org.
- A failed Gitleaks scan blocks the PR.
- Any disclosed secret is rotated **immediately**, not when the PR is fixed.

---

## 6. Application Pattern

- Apps read secrets at startup and on rotation events (Vault Agent template / ESO update).
- Apps zeroize secret buffers when feasible (`secrets` crate / `cryptography` `SecureBytes` / `mlock`).
- Apps never log secrets; structured logger has a redaction filter for known fields (`password`, `token`, `authorization`, `cookie`, `set-cookie`, `api_key`).
- Apps fail closed if a required secret is missing.

---

## 7. Human Access

- Engineers do **not** read production secrets routinely.
- Break-the-glass via PAM (see [`identity_access_strategy.md`](identity_access_strategy.md) §6): request → approval → time-boxed → recorded.
- Read access is per-secret, per-environment; never `*` or wildcard.
- Quarterly access review of secret namespaces.

---

## 8. Detection & Response

- **Pre-commit:** Gitleaks runs locally.
- **Push protection:** GitHub blocks pushes containing known secret patterns.
- **Repository scan:** weekly historical scan; rewrites discouraged — rotate the secret instead.
- **Telemetry:** Vault audit log → SIEM; alerts on:
  - Excessive reads of high-sensitivity secrets.
  - Reads from unusual networks/identities.
  - Failed authN bursts.
- **Compromise response:** see [`incident_response_plan.md`](incident_response_plan.md). Default playbook = rotate, invalidate sessions, audit lineage, notify if PHI/PII implicated.

---

## 9. Backups

- Vault snapshots encrypted with KMS-managed keys; stored in immutable object storage; replicated cross-region.
- Restore drills quarterly with full secret-engine validation.
- Backups never written to laptops or shared drives.

---

## 10. Forbidden

- Committing `.env` or any file containing real secrets.
- Hard-coded credentials in code, comments, test fixtures, or example payloads.
- Long-lived cloud access keys.
- Shared secrets across environments (dev ≠ staging ≠ prod).
- Decrypting production secrets to a local workstation.
- Pasting secrets into chats, tickets, screenshots, or AI prompts.
