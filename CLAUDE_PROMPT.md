# 🤖 CLAUDE CODE AUTOMATION PROMPT

## 🎯 MISSION

Set up a complete production-grade CI/CD deployment pipeline for CyberCom Platform and Website on Oracle Cloud Infrastructure (OCI) with automatic deployments, health checks, monitoring, and rollback capabilities.

---

## 📋 REPOSITORIES

- **Platform:** https://github.com/eng9myan/CyberCom-Platform
- **Website:** https://github.com/eng9myan/Cybercom-Website
- **Additional:** CyMed-Claude, Cyshop (deploy as modules)

---

## 🔐 KNOWN VALUES

```
Tenancy OCID:    ocid1.tenancy.oc1..aaaaaaaae3kk67errd7y65ua4ers3hrbe5jwt3er6bcdcur5aqmwu5on7oya
Email:           m.alnsour@outlook.com
OCI Region:      il-jerusalem-1
Domain:          cy-com.com
User GitHub:     eng9myan
```

---

## 📦 WHAT TO BUILD

### 1. OCI INFRASTRUCTURE (Terraform)

**Create these files in `infrastructure/terraform/`:**

#### Core Infrastructure
- [ ] `main.tf` — VCN, compartment, security lists, vault
- [ ] `variables.tf` — All input variables
- [ ] `outputs.tf` — Outputs for downstream systems
- [ ] `versions.tf` — Provider versions

#### Compute & Container Orchestration
- [ ] `oke.tf` — OCI Kubernetes Engine cluster (3 nodes, E4.Flex)
- [ ] `registry.tf` — OCI Container Registry (OCIR)

#### Data & Caching
- [ ] `database.tf` — PostgreSQL database (OCI managed)
- [ ] `redis.tf` — Redis cache (compute instance with auto-setup)

#### Networking & Access
- [ ] `load-balancer.tf` — Public load balancer with SSL
- [ ] `bastion.tf` — Bastion host for SSH access
- [ ] `dns.tf` — OCI DNS zone configuration (if using OCI DNS)

#### Security
- [ ] `kms.tf` — Key management service vault
- [ ] `security.tf` — Security lists and network ACLs

#### Monitoring
- [ ] `monitoring.tf` — OCI monitoring + alarms

#### Templates
- [ ] `terraform.tfvars.example` — Example configuration
- [ ] `.gitignore` — Ignore sensitive files

---

### 2. KUBERNETES MANIFESTS

**Create in `infrastructure/kubernetes/`:**

#### Base Manifests
- [ ] `namespaces.yaml` — dev, staging, prod namespaces
- [ ] `storage-class.yaml` — Persistent volumes
- [ ] `ingress.yaml` — Nginx ingress controller

#### Platform Deployment
- [ ] `platform-deployment.yaml` — Platform backend pods
- [ ] `platform-service.yaml` — Service definition
- [ ] `platform-configmap.yaml` — Environment variables
- [ ] `platform-secrets.yaml` — Secret definitions

#### Website Deployment
- [ ] `website-deployment.yaml` — Website pods
- [ ] `website-service.yaml` — Service definition
- [ ] `website-configmap.yaml` — Environment variables

#### Monitoring
- [ ] `prometheus.yaml` — Prometheus deployment
- [ ] `grafana.yaml` — Grafana dashboards
- [ ] `logging.yaml` — Loki/ELK stack

#### Service Mesh (optional)
- [ ] `istio-setup.yaml` — Service mesh (optional)

---

### 3. HELM CHARTS

**Create in `infrastructure/helm/`:**

- [ ] `Chart.yaml` — Main chart
- [ ] `values.yaml` — Default values
- [ ] `values-dev.yaml` — Dev overrides
- [ ] `values-staging.yaml` — Staging overrides
- [ ] `values-prod.yaml` — Production overrides
- [ ] `templates/deployment.yaml`
- [ ] `templates/service.yaml`
- [ ] `templates/ingress.yaml`
- [ ] `templates/configmap.yaml`
- [ ] `templates/secrets.yaml`
- [ ] `templates/hpa.yaml` — Horizontal pod autoscaler

---

### 4. GITHUB ACTIONS WORKFLOWS

**Create in `.github/workflows/`:**

#### CI/CD Workflows
- [ ] `lint.yml` — Linting (ESLint, Prettier, Python flake8)
- [ ] `test.yml` — Unit & integration tests
- [ ] `security-scan.yml` — SAST/DAST security scanning
- [ ] `dependency-check.yml` — Dependency vulnerability scanning
- [ ] `docker-build.yml` — Build Docker images
- [ ] `sbom.yml` — Software Bill of Materials generation
- [ ] `image-signing.yml` — Image signing with cosign
- [ ] `push-registry.yml` — Push to OCIR
- [ ] `deploy-dev.yml` — Deploy to dev on PR merge
- [ ] `deploy-staging.yml` — Deploy to staging on tag
- [ ] `deploy-prod.yml` — Deploy to prod (manual approval)
- [ ] `health-check.yml` — Post-deployment health checks
- [ ] `rollback.yml` — Rollback automation
- [ ] `notifications.yml` — Slack/email notifications

#### Infrastructure Workflows
- [ ] `terraform-plan.yml` — Terraform plan on PR
- [ ] `terraform-apply.yml` — Terraform apply (manual approval)
- [ ] `terraform-destroy.yml` — Terraform destroy (emergency only)

#### Scheduled Workflows
- [ ] `backup.yml` — Database backups (daily)
- [ ] `security-audit.yml` — Security audit (weekly)
- [ ] `performance-test.yml` — Performance tests (weekly)

---

### 5. DOCKER CONFIGURATIONS

**Create in repository roots:**

#### Platform Repository
- [ ] `backend/Dockerfile` — Python/Node backend image
- [ ] `backend/.dockerignore`
- [ ] `frontend/Dockerfile` — React/Vue frontend image
- [ ] `frontend/.dockerignore`
- [ ] `docker-compose.yml` — Local development

#### Website Repository
- [ ] `Dockerfile` — Static site + Nginx
- [ ] `.dockerignore`
- [ ] `docker-compose.yml`

---

### 6. DEPLOYMENT SCRIPTS & UTILITIES

**Create in `scripts/`:**

- [ ] `deploy.sh` — Main deployment orchestrator
- [ ] `health-check.sh` — Health check endpoint validation
- [ ] `rollback.sh` — Rollback automation
- [ ] `setup-oci-cli.sh` — OCI CLI installation
- [ ] `setup-kubectl.sh` — Kubectl configuration
- [ ] `setup-helm.sh` — Helm installation
- [ ] `setup-oci-user.sh` — OCI user creation automation
- [ ] `generate-kubeconfig.sh` — Generate kubeconfig from OKE
- [ ] `migrate-database.sh` — Database migration runner
- [ ] `setup-ssl.sh` — SSL certificate setup
- [ ] `monitoring-setup.sh` — Prometheus/Grafana setup

---

### 7. CONFIGURATION & ENVIRONMENT FILES

**Create in repository roots:**

#### Platform
- [ ] `.env.example` — Example environment variables
- [ ] `config/` — Configuration files
  - [ ] `database.config.js`
  - [ ] `cache.config.js`
  - [ ] `auth.config.js`
  - [ ] `logging.config.js`

#### Website
- [ ] `.env.example` — Example environment variables
- [ ] `config/` — Configuration files
  - [ ] `api-client.config.js` — API consumption config

---

### 8. DOCUMENTATION

**Create in `docs/deployment/`:**

- [ ] `00-OVERVIEW.md` — Architecture overview
- [ ] `01-OCI-USER-SETUP.md` — OCI user creation guide
- [ ] `02-GITHUB-SECRETS-SETUP.md` — GitHub secrets configuration
- [ ] `03-INFRASTRUCTURE-SETUP.md` — Terraform deployment guide
- [ ] `04-KUBERNETES-SETUP.md` — Kubernetes configuration
- [ ] `05-GITHUB-ACTIONS-SETUP.md` — CI/CD configuration
- [ ] `06-DEPLOY-PLATFORM.md` — Platform deployment procedure
- [ ] `07-DEPLOY-WEBSITE.md` — Website deployment procedure
- [ ] `08-HEALTH-CHECKS.md` — Health check procedures
- [ ] `09-MONITORING.md` — Monitoring and logging setup
- [ ] `10-ROLLBACK.md` — Rollback procedures
- [ ] `11-DISASTER-RECOVERY.md` — DR procedures
- [ ] `12-DNS-SSL.md` — DNS and SSL configuration
- [ ] `13-GO-LIVE-CHECKLIST.md` — Pre-production checklist
- [ ] `14-TROUBLESHOOTING.md` — Common issues and fixes
- [ ] `ARCHITECTURE.md` — System architecture diagrams (ASCII art)

---

### 9. API CLIENT & INTEGRATION

**Create in Website repository:**

- [ ] `src/api/client.js` — API client with axios/fetch
- [ ] `src/api/endpoints.js` — API endpoint definitions
- [ ] `src/api/auth.js` — Authentication logic
- [ ] `src/hooks/useApi.js` — React hook for API calls
- [ ] `src/services/health-check.js` — Health check service

---

### 10. MONITORING & LOGGING

**Create in `infrastructure/monitoring/`:**

- [ ] `prometheus-rules.yml` — Prometheus alert rules
- [ ] `prometheus-config.yml` — Prometheus configuration
- [ ] `grafana-dashboards/` — Dashboard definitions
  - [ ] `kubernetes-cluster.json`
  - [ ] `platform-metrics.json`
  - [ ] `website-metrics.json`
  - [ ] `database-metrics.json`
- [ ] `loki-config.yml` — Loki configuration (log aggregation)
- [ ] `alerts.yml` — Alert definitions

---

## 🔄 IMPLEMENTATION SEQUENCE

1. **Phase 1: Infrastructure** (Day 1)
   - Create Terraform files
   - Deploy OCI infrastructure
   - Create OKE cluster

2. **Phase 2: Container & Registry** (Day 2)
   - Create Dockerfiles
   - Set up OCIR
   - Test builds locally

3. **Phase 3: Kubernetes** (Day 2)
   - Create Kubernetes manifests
   - Create Helm charts
   - Test deployments

4. **Phase 4: CI/CD Pipelines** (Day 3)
   - Create GitHub Actions workflows
   - Test on develop branch
   - Test on main branch

5. **Phase 5: Integration** (Day 3)
   - Connect Website to Platform APIs
   - Set up API client in Website
   - Configure health checks

6. **Phase 6: Monitoring & Logging** (Day 4)
   - Deploy Prometheus/Grafana
   - Set up Loki for logs
   - Create dashboards

7. **Phase 7: Documentation & Testing** (Day 4)
   - Generate all documentation
   - Create go-live checklist
   - Perform security audit

---

## 🎯 DEPLOYMENT ARCHITECTURE

```
GitHub Repositories
        ↓
    Push to main
        ↓
GitHub Actions Workflow
    ├─ Lint & Type Check
    ├─ Unit Tests
    ├─ Integration Tests
    ├─ Security Scan
    ├─ Dependency Check
    ├─ Docker Build
    ├─ SBOM Generation
    ├─ Image Signing
    ├─ Push to OCIR
    └─ Deploy to OKE
        ├─ Run Database Migrations
        ├─ Deploy Platform Pod
        ├─ Deploy Website Pod
        ├─ Health Checks
        └─ Notifications
            ├─ Slack
            └─ Email

OKE Cluster
    ├─ Namespaces: dev, staging, prod
    ├─ Platform Service
    ├─ Website Service
    ├─ Ingress Controller
    ├─ Prometheus (Monitoring)
    ├─ Grafana (Dashboards)
    └─ Loki (Logging)

Load Balancer
    ├─ www.cy-com.com → Website
    ├─ api.cy-com.com → Platform
    ├─ health.cy-com.com → Portal
    └─ ... (other subdomains)

Database (PostgreSQL)
    └─ Automated backups

Redis Cache
    └─ Session management

Vault (KMS)
    └─ Secrets encryption
```

---

## 🔐 SECRETS REQUIRED

These must be added to GitHub Secrets:

### OCI Credentials (both repos)
- [ ] `OCI_REGION` = `il-jerusalem-1`
- [ ] `OCI_TENANCY_OCID` = `ocid1.tenancy.oc1..aaaaaaaae3kk67errd7y65ua4ers3hrbe5jwt3er6bcdcur5aqmwu5on7oya`
- [ ] `OCI_USER_OCID` = (create OCI user first)
- [ ] `OCI_FINGERPRINT` = (from API key)
- [ ] `OCI_PRIVATE_KEY` = (base64 encoded)

### Application Secrets (Platform repo only)
- [ ] `DATABASE_PASSWORD` = (strong random password)
- [ ] `JWT_SECRET` = (random 32+ char string)
- [ ] `REDIS_URL` = (auto-generated)
- [ ] `NEXT_PUBLIC_API_URL` = `https://api.cy-com.com`

---

## ⚠️ CRITICAL NOTES

1. **Never commit secrets** — Always use GitHub Secrets
2. **Terraform state** — Store in OCI Object Storage (encrypted)
3. **SSL certificates** — Use OCI Certificate Manager (free, auto-renewal)
4. **Database backups** — Automated daily to Object Storage
5. **Health checks** — Implement `/health` endpoint on all services
6. **Rollback strategy** — Keep last 5 versions of deployments
7. **Monitoring** — Alert on pod crashes, CPU > 80%, memory > 85%
8. **Logging** — Centralize all logs to Loki for searching
9. **DNS** — Use OCI DNS or route53 (update CNAME records)
10. **Disaster Recovery** — Test monthly, RTO: 1 hour, RPO: 15 minutes

---

## 📊 EXPECTED DEPLOYMENT FLOW

### Develop Branch
```
git push origin develop
    ↓
GitHub Actions (lint, test)
    ↓
✅ Auto-deploy to dev environment
    ↓
Health checks
    ↓
Slack notification
```

### Main Branch
```
git push origin main
    ↓
GitHub Actions (full CI pipeline)
    ↓
✅ Auto-deploy to staging
    ↓
Smoke tests
    ↓
Slack notification (approval required for prod)
```

### Production Release
```
git tag v1.0.0
    ↓
GitHub Actions
    ↓
Manual approval in GitHub
    ↓
✅ Deploy to production
    ↓
Health checks
    ↓
Smoke tests
    ↓
Slack notification with deployment report
```

---

## ✅ SUCCESS CRITERIA

✅ Terraform creates full infrastructure without errors
✅ OKE cluster is operational with 3+ nodes
✅ OCIR registry has platform & website images
✅ PostgreSQL database accepts connections
✅ Redis cache is operational
✅ Load balancer routes to OKE services
✅ Health checks pass on all services
✅ GitHub Actions workflows execute successfully
✅ Website successfully calls Platform APIs
✅ SSL certificates configured for all domains
✅ Monitoring dashboards display metrics
✅ Logs aggregated in Loki
✅ Rollback tested and working
✅ All documentation generated and complete
✅ Security scan passes with 0 critical issues

---

## 🚀 START HERE

**Step 1:** Create OCI User (manual — 5 min)
**Step 2:** Generate API Key (manual — 2 min)
**Step 3:** Add GitHub Secrets (manual — 5 min)
**Step 4:** Run this prompt with Claude Code
**Step 5:** Review generated code
**Step 6:** Commit to GitHub
**Step 7:** Run Terraform to deploy
**Step 8:** Trigger GitHub Actions
**Step 9:** Verify deployments
**Step 10:** Go live!

---

## 📞 SUPPORT

**Questions about this prompt?** Ask Claude Code:
- "What does [file] do?"
- "How do I modify [file] for [scenario]?"
- "What's the rollback procedure for [component]?"
- "How do I add [new service/feature]?"

**Need help troubleshooting?** Check `docs/deployment/14-TROUBLESHOOTING.md`
