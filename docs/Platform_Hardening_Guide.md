# Platform Hardening Guide (Program 2.9)

This guide documents security hardening controls, secret store access, and runtime authorization engines on the CyberCom Platform.

---

## 1. Secrets Management (HashiCorp Vault)

To protect operational database passwords, JWT signing keys, and external API credentials, the platform integrates with **HashiCorp Vault**.

### Vault Client Wrapper
The `VaultClient` retrieves keys dynamically on demand. Storage keys and certificates are retrieved using token/approle authentications:
```python
from platform.common.security.vault import VaultClient
secret = VaultClient.get_secret("cybercom/data/database/postgres")
username = secret["username"]
password = secret["password"]
```
Local in-memory fallbacks are used in unit test profiles.

---

## 2. Policy Decoupling (Open Policy Agent - OPA)

Access control rules are written in Rego and evaluated at runtime by **Open Policy Agent (OPA)**.

### Policy Evaluator
The `OPAPolicyEngine` evaluates incoming HTTP requests and microservice contexts:
```python
from platform.common.security.opa import OPAPolicyEngine
allowed = OPAPolicyEngine.evaluate_policy(
    policy_name="clinical/access",
    input_data={
        "action": "write",
        "resource": "patient/medical-records",
        "roles": ["clinician"],
        "break_glass_active": False
    }
)
```

---

## 3. Kubernetes Security Hardening

The platform implements the following hardening baselines:
*   **Cert-Manager:** Automated lifecycle rotation of TLS certificates for ingress hosts.
*   **Kyverno:** Enforces admission control rules (e.g., blocking root containers, requiring read-only root filesystems).
*   **Network Policies:** Strict isolation rules restricting pod-to-pod communications by namespace (e.g. database pods can only be contacted by platform backend pods).
*   **CIS Kubernetes Benchmarks:** Regular automated scans to ensure cluster node hardening.
