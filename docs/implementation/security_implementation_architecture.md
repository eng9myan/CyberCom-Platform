# Security Implementation Architecture

This document defines the cryptographic standards, authentication handshakes, access policy implementations, break-glass workflows, and audit validation pipelines for the CyberCom platform.

---

## 1. Authentication & MFA (FIDO2 / WebAuthn)

*   **IdP Integration:** `CyIdentity` manages the user directories. Applications execute standard OAuth 2.1 authorization code grant flows with PKCE (Proof Key for Code Exchange).
*   **WebAuthn Passkeys:** For high-risk clinical and financial actions, the application invokes the browser FIDO2 API:
    ```javascript
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    });
    ```
*   **Token Verification:** API gateways cache JWKS public key JSON arrays from `CyIdentity` endpoints and validate signatures locally in memory, keeping JWT validation times sub-millisecond.

---

## 2. Authorization Engine (OPA / Rego)

Access policies are defined declaratively in **Rego** files and executed locally inside services using **Open Policy Agent (OPA)** sidecar containers:

```rego
package play.authorization

default allow = false

# Allow clinical doctors to read patient records
allow {
    input.user.role == "doctor"
    input.action == "read"
    input.resource.type == "patient_record"
    # ABAC: Doctor must be physically present in the clinic IP subnet
    ip_in_range(input.request.ip, "10.240.0.0/16")
}
```

---

## 3. Dynamic Secrets Management (HashiCorp Vault)

To eliminate hardcoded database credentials:
1.  **Identity:** Backend microservice pods authenticate to Vault using their Kubernetes ServiceAccount token.
2.  **Dynamic Role:** Vault generates a dynamic PostgreSQL user login with a 1-hour lease window:
    ```json
    {
      "db_user": "v-kubernetes-cymed-r18a928",
      "db_pass": "A8s29aJ@921"
    }
    ```
3.  **Rotation:** The application pod monitors lease expiration and requests credential renewal automatically before the token expires.

---

## 4. Clinical Break-Glass Code Pathway

In emergency settings, physicians override standard ABAC blocks:
*   **Audit Payload:** The break-glass API request requires the target patient UUIDv7, the physician's credentials, and a reason string.
*   **Immediate Alert:** The engine logs the override to pgAudit and triggers an event to Kafka:
    `cybercom.cymed.breakglass.invoked`
*   **Time-Bound Revocation:** A Redis cache registers the emergency access key with a 120-minute time-to-live (TTL). Once the TTL expires, the local cache entry is cleared, and standard ABAC policies resume.

---

## 5. Immutable Auditing and pgAudit

*   **Database Auditing:** The `pgAudit` extension is enabled on all production databases, capturing DDL commands and access to sensitive tables (e.g., PHI, General Ledger).
*   **Tamper-Evident Hashing:** Log streams are piped directly to the immutable WORM sink. Each log entry contains a SHA-256 cryptographic hash of its payload chained to the preceding entry’s hash, preventing silent record deletion or editing.

---

## 6. Revision History

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-06-21 | 1.0 | Initial Security Implementation Architecture | Enterprise Architect |
