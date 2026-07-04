# Environment: `prod`

> **Status:** Scaffolding — Program 0, Phase 0.5. Content lands in Program 1.

This folder owns the **declared state** of the `prod` environment:

```
prod/
├── terraform/      # Cloud + cluster + addons for prod
├── kubernetes/     # Argo Applications + Helm values per service
├── policies/       # Kyverno / OPA bundles for prod
└── observability/  # Dashboards, alerts, SLOs for prod
```

See:
- [`environment_strategy`](../../../docs/platforms/environment_strategy.md)
- [`gitops_strategy`](../../../docs/platforms/gitops_strategy.md)
- [`kubernetes_strategy`](../../../docs/platforms/kubernetes_strategy.md)
