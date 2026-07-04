# Kubernetes

> Implements [`kubernetes_strategy`](../../docs/platforms/kubernetes_strategy.md).

- `base/` — common manifests (namespaces, default NetworkPolicies, RBAC).
- `overlays/` — environment-specific Kustomize overlays where Helm isn't enough.
- `addons/` — Argo CD, Argo Rollouts, ESO, cert-manager, Kyverno, OTel Operator, Falco, Velero, etc.
