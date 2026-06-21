# Terraform

> Implements [`terraform_strategy`](../../docs/platforms/terraform_strategy.md).

- `bootstrap/` — one-time: state backends, OIDC trust, KMS roots (apply via PAM).
- `modules/` — reusable modules (network, kubernetes-cluster, postgres, object-storage, kms, observability, github-repo, github-branch-protection).
- `github/` — GitHub org, teams, repos, branch protection as code (per [`branch_protection_strategy`](../../docs/governance/branch_protection_strategy.md)).
