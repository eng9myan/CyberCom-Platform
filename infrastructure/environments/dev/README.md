# Environment: `dev`

> **Status:** Scaffolding — Program 0, Phase 0.5. Content lands in Program 1.

This folder owns the **declared state** of the `dev` environment:

```
dev/
├── terraform/      # Cloud + cluster + addons for dev
├── kubernetes/     # Argo Applications + Helm values per service
├── policies/       # Kyverno / OPA bundles for dev
└── observability/  # Dashboards, alerts, SLOs for dev
```

See:
- [`environment_strategy`](../../../docs/platforms/environment_strategy.md)
- [`gitops_strategy`](../../../docs/platforms/gitops_strategy.md)
- [`kubernetes_strategy`](../../../docs/platforms/kubernetes_strategy.md)
