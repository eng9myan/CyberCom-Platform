# Infrastructure

> **Status:** Scaffolding — Program 0, Phase 0.5. Implementation begins in Program 1.

This tree holds **all platform infrastructure as code** for CyberCom: IaC, GitOps manifests, Kubernetes addons, Helm charts, observability definitions, and policy bundles.

## Layout

```
infrastructure/
├── github/             # GitHub Actions reusable workflows + GitHub org/repo IaC
│   └── workflows/      # ci.yml, release.yml, terraform.yml, … (specs in workflows/README.md)
├── terraform/          # Cloud + cluster modules + per-env roots
│   ├── bootstrap/      # One-time: state backends, OIDC trust, KMS roots
│   ├── modules/        # Reusable modules (network, kubernetes-cluster, postgres, …)
│   └── github/         # GitHub org/repos/branch protection/teams (Terraform)
├── kubernetes/         # Raw K8s manifests for shared resources (base/overlays/addons)
│   ├── base/
│   ├── overlays/
│   └── addons/
├── environments/       # Per-environment composition (dev/test/stage/prod)
│   ├── dev/
│   ├── test/
│   ├── stage/
│   └── prod/
├── gitops/             # Argo CD apps + ApplicationSets + platform addons
├── helm/               # Internal Helm chart library (cybercom-service, …)
├── observability/      # Dashboards, alert rules, SLO definitions
└── policies/           # OPA / Kyverno bundles per environment
```

## References

- [`docs/platforms/platform_engineering_baseline.md`](../docs/platforms/platform_engineering_baseline.md)
- [`docs/platforms/terraform_strategy.md`](../docs/platforms/terraform_strategy.md)
- [`docs/platforms/gitops_strategy.md`](../docs/platforms/gitops_strategy.md)
- [`docs/platforms/kubernetes_strategy.md`](../docs/platforms/kubernetes_strategy.md)
- [`docs/platforms/environment_strategy.md`](../docs/platforms/environment_strategy.md)
- [`docs/platforms/observability_strategy.md`](../docs/platforms/observability_strategy.md)
- [`docs/implementation/cicd_baseline.md`](../docs/implementation/cicd_baseline.md)
- [`infrastructure/github/workflows/README.md`](github/workflows/README.md) — workflow specs
