# Developer Setup Guide

> CyberCom Platform 2.0 — Bootstrap foundation onboarding.

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Python | 3.12+ | [python.org](https://python.org) |
| Node.js | 20 LTS | [nodejs.org](https://nodejs.org) |
| Docker Desktop | 4.28+ | [docker.com](https://docker.com) |
| Git | 2.40+ | [git-scm.com](https://git-scm.com) |
| pre-commit | 3.7+ | `pip install pre-commit` |

## 1. Clone & Configure

```bash
git clone https://github.com/eng9myan/CyberCom-Platform.git
cd CyberCom-Platform

# Install root deps (commitlint etc.)
npm install

# Install pre-commit hooks
pre-commit install
pre-commit install --hook-type commit-msg
```

## 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env.local
# Edit .env.local with your values
```

## 3. Start Infrastructure

```bash
# From repo root — starts Postgres, Redis, Kafka, Keycloak, OTel, Prometheus, Grafana
docker compose up -d postgres redis kafka keycloak otel-collector prometheus grafana

# Wait for Postgres
docker compose exec postgres pg_isready -U postgres

# Run migrations
cd backend
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

## 4. Run Backend

```bash
cd backend
python manage.py runserver 8000
```

Health check: http://localhost:8000/health
API docs: http://localhost:8000/api/docs/

## 5. Frontend Setup

```bash
cd frontend
npm install
cp ../.env.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_CYIDENTITY_ISSUER=http://localhost:8080/realms/cybercom

npm run dev
```

Frontend: http://localhost:3000

## 6. Services Reference

| Service | URL | Credentials |
|---|---|---|
| Backend API | http://localhost:8000 | — |
| API Docs | http://localhost:8000/api/docs/ | — |
| Django Admin | http://localhost:8000/admin/ | superuser |
| Frontend | http://localhost:3000 | — |
| Keycloak | http://localhost:8080 | admin / admin |
| Prometheus | http://localhost:9090 | — |
| Grafana | http://localhost:3001 | admin / admin |
| Kafka | localhost:9092 | — |
| PostgreSQL | localhost:5432 | postgres / postgres |
| Redis | localhost:6379 | — |

## 7. Running Tests

```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm run test

# Frontend E2E
cd frontend && npx playwright install && npm run test:e2e
```

## 8. Branch Strategy

Follow [docs/governance/git_strategy.md](../governance/git_strategy.md):

- `main` — always releasable, protected
- `develop` — integration branch
- `feat/<slug>` — feature branches from `develop`
- `fix/<slug>` — bug fixes
- `release/<version>` — release stabilization

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/).

## 9. ADR Reference

All architecture decisions are in [docs/adr/](../adr/).
ADR-0001 defines the tech stack. ADR-0034 finalizes backend language policy.
