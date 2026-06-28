# Deployment Reference

## Infrastructure Layout

```
infrastructure/
  Dockerfile.backend        Multi-stage, non-root, distroless runtime
  Dockerfile.frontend       Next.js frontend container
  docker-compose.yml        Local development stack
  kubernetes/
    base/                   Kubernetes base manifests (Kustomize)
      deployment.yaml
      service.yaml
      serviceaccount.yaml
      namespace.yaml
      kustomization.yaml
    overlays/               Environment-specific patches
      dev/
      stage/
      test/
      prod/
    addons/                 Supporting services
  helm/
    cybercom-platform/
      Chart.yaml
      values.yaml
  terraform/
    main.tf
    variables.tf
    outputs.tf
    modules/
      kubernetes/
      postgresql/
      redis/
    bootstrap/
    github/
  environments/             Environment variable templates
  observability/
    prometheus.yml
    otel-collector.yaml
    grafana/
  scripts/
    postgres/
      init.sql
  github/                   GitHub Actions reusable workflows
```

---

## Local Development

```bash
# Start full stack
docker compose -f infrastructure/docker-compose.yml up -d

# Services started:
# - PostgreSQL 16 on :5432
# - Redis 7 on :6379
# - Kafka (KRaft) on :9092
# - Keycloak 24 on :8080
# - Backend (Django) on :8000
# - Frontend (Next.js) on :3000

# Run migrations
cd backend
python manage.py migrate

# Start backend
gunicorn core.asgi:application --bind 0.0.0.0:8000 --worker-class uvicorn.workers.UvicornWorker

# Start frontend
cd frontend
npm run dev
```

---

## Environment Variables

### Required in Production

```env
# Core
DJANGO_SECRET_KEY=<32+ char secret>
DJANGO_DEBUG=False
ALLOWED_HOSTS=api.cy-com.com
ENVIRONMENT=production
APP_VERSION=2.0.0

# Database
DATABASE_URL=postgresql://user:pass@host:5432/cybercom

# Cache / Celery
REDIS_URL=redis://host:6379/0
CELERY_BROKER_URL=redis://host:6379/1
CELERY_RESULT_BACKEND=redis://host:6379/2

# Kafka
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
KAFKA_SECURITY_PROTOCOL=SASL_SSL
KAFKA_SASL_MECHANISM=SCRAM-SHA-256
KAFKA_SASL_USERNAME=cybercom
KAFKA_SASL_PASSWORD=<secret>

# Identity
CYIDENTITY_ISSUER=https://auth.cy-com.com/realms/cybercom
CYIDENTITY_JWKS_URI=https://auth.cy-com.com/realms/cybercom/protocol/openid-connect/certs
CYIDENTITY_CLIENT_ID=cybercom-backend
JWT_PUBLIC_KEY=<RS256 public key>

# CORS
CORS_ALLOWED_ORIGINS=https://www.cy-com.com,https://app.cy-com.com

# Observability
OTEL_ENABLED=True
OTEL_SERVICE_NAME=cybercom-platform
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317

# Security
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

---

## CI/CD Pipeline

### CI (`.github/workflows/ci.yml`)

Triggered on: PR to `main`, `develop`, `release/*`; push to `main`, `develop`

Jobs:
1. `commitlint` — validates Conventional Commits format
2. `secret-scan` — Gitleaks secret detection
3. `backend-lint` — Ruff lint + mypy typecheck
4. `backend-test` — pytest with PostgreSQL + Redis + Kafka
5. `frontend-lint` — ESLint + TypeScript check
6. `frontend-test` — Vitest unit tests
7. `security-scan` — SAST analysis

Target: ≤15 min p95

### CD (`.github/workflows/cd.yml`)

Triggered on: push to `main`, tags `v*`

Steps:
1. Build Docker image (multi-stage)
2. Sign image with Cosign (SBOM + provenance)
3. Push to GHCR (`ghcr.io/eng9myan/cybercom-backend`)
4. GitOps update — patch Helm values with new image tag
5. Kubernetes deployment via ArgoCD/Flux

---

## Kubernetes Deployment

```bash
# Apply base manifests
kubectl apply -k infrastructure/kubernetes/base/

# Apply environment overlay
kubectl apply -k infrastructure/kubernetes/overlays/prod/

# Helm deploy
helm upgrade --install cybercom-platform infrastructure/helm/cybercom-platform/ \
  --namespace cybercom \
  --values infrastructure/helm/cybercom-platform/values.yaml \
  --values infrastructure/environments/prod/values.yaml
```

---

## Health Checks

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Overall health |
| `GET /health/liveness` | Kubernetes liveness probe |
| `GET /health/readiness` | Kubernetes readiness probe |
| `GET /api/v1/public/health/` | Public API health |

---

## Observability

- **Metrics:** Prometheus scrape at `/metrics`
- **Traces:** OpenTelemetry → OTLP gRPC → Tempo
- **Logs:** JSON structured to stdout → collected by log aggregator
- **Dashboards:** Grafana (`infrastructure/observability/grafana/`)
- **Alerts:** Prometheus alerting rules

---

## Database Management

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Check migration state
python manage.py showmigrations

# PostgreSQL RLS policies applied via RunSQL in migrations
# See: backend/platform/tenant/ migrations
```

---

## Deployment Profiles (Production Variants)

| Profile | Cloud | Notes |
|---------|-------|-------|
| Cloud SaaS | AWS, GCP, Azure, OCI | Shared infrastructure, managed services |
| Private Cloud | Customer cloud account | Dedicated infrastructure, customer-managed |
| Government Cloud | Sovereign cloud / on-premise | Air-gapped capable |
| Hybrid | Mixed | Some services cloud, some on-premise |

Terraform modules: `infrastructure/terraform/modules/`

---

## Disaster Recovery

- **RTO target:** 4 hours
- **RPO target:** 1 hour
- **Database backup:** Continuous WAL archiving + daily snapshots
- **Kafka:** Replicated topics (replication factor 3 in production)
- **Redis:** AOF persistence + replica
- **Object storage:** Cross-region replication
- **Backup verification:** Weekly restore test

---

## Tenant Provisioning

New tenant onboarding flow:
1. `TenantProvisioningService.provision(tenant_config)` in `products/cymed/commercial/`
2. Creates tenant record with UUID
3. Sets up Keycloak realm
4. Applies RLS policies
5. Deploys tenant-specific Kafka topics
6. Seeds edition-based feature flags
7. Applies branding configuration
8. Sends welcome notification
