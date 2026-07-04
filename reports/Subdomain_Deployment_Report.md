# Subdomain Deployment Report (Phase 0)

**Status:** Skeleton in place. Not yet deployed/tested against a live cluster or DNS.

## Repo assembly

`Final-Cybercom` (this repo) now contains:
- `platform/` — `eng9myan/CyberCom-Platform` imported via `git subtree` (squashed), branch `develop`. Backs Products 1–5 (Hospital, Clinic, Pharmacy, Laboratory, Imaging) and Product 7 (CyCom ERP) from one Django backend + one Next.js frontend.
- `cyshop/` — `eng9myan/Cyshop` imported via `git subtree` (squashed), branch `develop`. Backs Product 6 (CyShop), its own Django + Next.js + Caddy stack, deployed separately from the `platform/` k8s cluster.
- `reports/` — this mission's deliverables.

Subtree import (not copy-paste) was used so future fixes can be pushed back upstream to the source repos with `git subtree push` if needed, and history is preserved.

## How subdomain routing works

**Six subdomains, one Next.js deployment** (`platform/frontend`): `hospital`, `clinic`, `pharmacy`, `laboratory`, `imaging`, `erp` .cy-com.com. All six already exist as path-based routes under `platform/frontend/src/app/{hospital,clinic,pharmacy,laboratory,imaging,erp}/`. Added `platform/frontend/middleware.ts`: reads the `Host` header, maps the subdomain to its route prefix, and rewrites `/` and deep links onto that prefix — so each subdomain looks and behaves like its own standalone app while it's really one deployment. No duplicate frontend builds, no duplicate routing logic.

**One shared API**, `api.cy-com.com`, backs all six — matches the existing `ALLOWED_HOSTS=api.cy-com.com` value already in `AI/DEPLOYMENT.md`.

**`cyshop.cy-com.com` is separate on purpose.** Cyshop already ships its own reverse proxy (`cyshop/Caddyfile`) that auto-provisions TLS and does path-based routing between its own frontend/backend containers, driven by a `PUBLIC_DOMAIN` env var — it is not part of the Kubernetes cluster the other six run on. No code change needed there: set `PUBLIC_DOMAIN=cyshop.cy-com.com` in its deploy environment and point DNS at that host.

## What was added

- `platform/frontend/middleware.ts` — subdomain → route rewrite for the six shared-deployment products.
- `platform/frontend/src/app/api/health/route.ts` — health endpoint (frontend had none; needed for the new k8s readiness/liveness probes).
- `platform/infrastructure/kubernetes/base/deployment-frontend.yaml` + `service-frontend.yaml` — the frontend had no k8s manifests at all before this (only the Django backend did). Mirrors the backend's existing pattern (non-root, read-only FS, topology spread, probes).
- `platform/infrastructure/kubernetes/base/ingress.yaml` — routes the six `*.cy-com.com` hosts + `api.cy-com.com` to the two services above. `cyshop.cy-com.com` is deliberately excluded (see above) with a comment explaining why.
- `kustomization.yaml` updated to include all three new files.

## Still open (not done in this pass, flagged not hidden)

- **No prod/stage/dev Kubernetes overlay content exists yet** (`environments/{prod,stage,dev}/kubernetes/` are empty placeholders — pre-existing gap, not introduced here). CORS_ALLOWED_ORIGINS in the backend configmap will need the six frontend origins + `cyshop.cy-com.com` added when that overlay is populated (Release 2.2 in `AI/ROADMAP.md`, outside this mission's product-build scope).
- **cert-manager ClusterIssuer** referenced in `ingress.yaml` (`letsencrypt-prod`) is assumed, not verified to exist in-cluster.
- **DNS** for the seven subdomains is not configured — needs zone access for `cy-com.com` (external blocker, flagged per mission rules, not attempted).
- **Demo tenants + demo users** per product — not part of Phase 0; scheduled per-product in Phases 1–7.
- Not tested against a running cluster this session (no cluster access) — this is infra-as-code only, unverified live.

## Verdict

**READY WITH EXTERNAL BLOCKERS** — routing skeleton is code-complete and consistent with existing platform conventions. Blocked on: DNS access for `cy-com.com`, a live cluster to apply manifests against, and cert-manager/issuer confirmation. Proceeding to Phase 1 (Hospital).
