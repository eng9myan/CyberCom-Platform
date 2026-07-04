# Policies

> Implements parts of [`kubernetes_strategy`](../../docs/platforms/kubernetes_strategy.md), [`identity_access_strategy`](../../docs/security/identity_access_strategy.md), and [`gitops_strategy`](../../docs/platforms/gitops_strategy.md).

- Kyverno / OPA Gatekeeper bundles for admission control (signed images, baseline security, label requirements).
- OPA Rego (or Cedar) policies for application authorization (post-PoC per [ADR-0005](../../docs/adr/ADR-0005-identity-access-management-strategy.md)).
