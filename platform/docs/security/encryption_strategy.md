# Encryption Strategy

> **Status:** Approved — Program 0, Phase 0.4
> **Owner:** Chief Security Architect

Encryption is mandatory in transit and at rest across all CyberCom systems. Field-level encryption is used for the highest data classes.

---

## 1. Principles

1. **Vetted crypto only.** Use language-standard libraries (PyCryptodome/cryptography, WebCrypto, libsodium, BoringSSL). **Never roll your own.**
2. **Modern, agile algorithms.** AEAD (AES-256-GCM / ChaCha20-Poly1305); SHA-256/SHA-3; Ed25519 / ECDSA-P256; RSA-3072+ only where required for interop.
3. **Crypto agility.** Key IDs (`kid`), algorithm identifiers, and versioning baked into payload metadata to enable rotation/migration without breakage.
4. **Centralized key management.** Cloud KMS (HSM-backed) is the trust root; no raw key material in app process beyond the minimum window.
5. **Encrypt by default.** Opt-out requires an ADR and risk acceptance.

---

## 2. Encryption in Transit

| Channel | Protocol | Notes |
|---|---|---|
| Public clients ↔ Edge | **TLS 1.3** (TLS 1.2 deprecated, removed by Q4) | HSTS preload; OCSP stapling |
| Edge ↔ Application zone | TLS 1.3 + mTLS where supported | Gateway terminates public TLS, re-encrypts |
| Service ↔ Service (mesh) | **mTLS** via service mesh (SPIRE-issued SVIDs) | Default deny outside mesh |
| Application ↔ DB / cache / broker | TLS 1.3 with cert pinning where feasible | Connection strings include `sslmode=verify-full` |
| Cross-region replication | TLS 1.3 + KMS-encrypted payloads | Network ACLs restrict source/dest |
| Outbound to partners | TLS 1.3; mTLS preferred | Pinned to partner CA |
| Email | Opportunistic TLS minimum; MTA-STS where applicable | DMARC/DKIM/SPF enforced |

- **Cipher policy:** TLS 1.3 cipher suites only (`TLS_AES_128_GCM_SHA256`, `TLS_AES_256_GCM_SHA384`, `TLS_CHACHA20_POLY1305_SHA256`).
- **Forbidden:** TLS ≤ 1.1, RC4, 3DES, MD5/SHA-1 (for signatures), static RSA key exchange.
- **Certificate management:** cert-manager + ACME (Let's Encrypt / ZeroSSL) for public; private CA for internal; rotation 30–90 days.

---

## 3. Encryption at Rest

| Layer | Mechanism | Key |
|---|---|---|
| Disk / block storage | Cloud-native (EBS/Disk) AES-256 | CMK per environment |
| Database (PostgreSQL) | Storage-level + optional `pgcrypto` for columns | CMK; per-tenant CMK for regulated tenants |
| Object storage (S3-compatible) | SSE-KMS (no SSE-S3) | CMK; per-bucket policy |
| Backups & snapshots | Encrypted with separate backup CMK; immutable object-lock | Backup CMK |
| Caches (Redis) | At-rest encryption enabled; TLS for transit | CMK |
| Kafka / queues | Topic-level encryption where supported; envelope at producer otherwise | CMK |
| Search (OpenSearch) | At-rest enabled | CMK |
| Container images & artifacts | Registry-managed AES-256; image signatures via Sigstore/cosign | Registry CMK |
| Secrets store (Vault) | Vault transit + KMS unseal | KMS root |
| Logs (hot/cold) | Encrypted at rest | CMK |
| Workstation disks | Full-disk encryption mandatory (FileVault / BitLocker / LUKS) | TPM-bound |

---

## 4. Field-Level Encryption (Application-Side)

Required for **Restricted** data class fields (per `database_standards.md` §13):

- Examples: national ID, MRN, payment instrument PAN, prescription notes (configurable), DNA results.
- Pattern: **envelope encryption** with KMS — DEK per record, wrapped by tenant CMK, stored alongside ciphertext.
- AEAD (AES-256-GCM) with random 96-bit nonce; nonce stored with ciphertext.
- Searchable? Use deterministic encryption only for exact-match needs **with risk acceptance**; otherwise tokenize.
- Plaintext minimized in memory; cleared (zeroize) after use.

Stored payload schema:
```
{
  "v": 1,
  "alg": "AES-256-GCM",
  "kid": "tenant:abc:dek:42",
  "nonce": "<b64>",
  "ct": "<b64>",
  "aad": { "tenant_id": "...", "resource": "..." }
}
```

---

## 5. Key Management

- **Root of trust:** cloud KMS with HSM (FIPS 140-2/3 Level 3).
- **CMK** (customer-managed key) per environment; per-tenant for regulated tenants.
- **DEK** generated per record (envelope); cached briefly in memory.
- **Key rotation:**
  - CMK: every 365 days; old versions retained for decrypt-only.
  - DEK: per-record, immutable after issue.
  - JWT signing keys: every 30 days via `kid` rotation; overlap window for validation.
- **Key access:** least privilege via KMS policies; usage logged.
- **Key destruction:** scheduled deletion with 30-day waiting period; tombstoned, not immediate.
- **BYOK / HYOK** supported for sovereign and regulated tenants per ADR.
- **PKI:** offline root CA; intermediate online; short-lived leaf certs.

---

## 6. Hashing & MAC

- Password hashing: **Argon2id** (preferred) or bcrypt (cost ≥ 12). Never MD5/SHA-1/plain SHA-256.
- Token hashing: SHA-256 with salt; HMAC-SHA-256 for shared-secret MACs.
- File integrity: SHA-256 / SHA-3; signed where authenticity matters.
- Webhook signing: HMAC-SHA-256 with rotating shared secret; replay protection via timestamp + nonce window.

---

## 7. Randomness

- Use OS CSPRNG (`secrets`, `crypto.randomBytes`, `getrandom`). Never `random`/`Math.random` for security.
- Nonces non-repeating per key (GCM constraint); prefer random 96-bit nonces with counter fallback for high-rate streams.

---

## 8. Crypto in CI/CD

- Container images and provenance signed with **Sigstore/cosign** (keyless via OIDC).
- SBOM signed.
- Release artifacts checksummed (SHA-256) and signed; checksums published on the GitHub Release.
- Verify signatures at admission (admission controller / policy engine, e.g. Kyverno / Connaisseur).

---

## 9. Cryptographic Inventory

- Maintained as `docs/security/crypto-inventory.md` (to be authored in Phase 1).
- Lists every use of crypto: purpose, algorithm, library, key source, rotation, owner.
- Reviewed quarterly. Drives migration when an algorithm is deprecated.

---

## 10. Post-Quantum Readiness

- Track NIST PQC standardization (ML-KEM/Kyber, ML-DSA/Dilithium, SLH-DSA).
- Design protocols crypto-agile (algorithm IDs in payloads, versioned negotiation).
- Inventory long-lived signed artifacts and plan migration window.

---

## 11. Forbidden

- DIY crypto, including DIY MAC, KDF, or AEAD.
- TLS < 1.2 anywhere; TLS 1.2 anywhere new.
- Static IVs/nonces.
- ECB mode.
- Storing keys alongside ciphertext under the same access scope.
- Logging plaintext sensitive data after decryption.
