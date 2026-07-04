# Local Development Guide

## Daily Workflow

### Start Services

```bash
# Start all infra (from repo root)
docker compose up -d

# Or selectively
docker compose up -d postgres redis kafka
```

### Backend Development

```bash
cd backend
source .venv/bin/activate

# Run dev server with auto-reload
python manage.py runserver

# Create a new Django migration after model changes
python manage.py makemigrations <app_label>
python manage.py migrate

# Open Django shell
python manage.py shell_plus  # or shell
```

### Frontend Development

```bash
cd frontend
npm run dev        # Next.js with hot reload
npm run typecheck  # TypeScript check
npm run lint       # ESLint
```

### Testing

```bash
# Backend — run all tests
cd backend && pytest

# Backend — run only unit tests (no DB)
cd backend && pytest -m unit

# Backend — run with coverage
cd backend && pytest --cov=. --cov-report=html

# Frontend — unit tests
cd frontend && npm run test:watch

# Frontend — coverage
cd frontend && npm run test:coverage
```

## Common Tasks

### Adding a New Platform App

1. Create app directory: `backend/platform/<new_app>/`
2. Add `__init__.py`, `apps.py`, `models.py`, `views.py`, `urls.py`, `serializers.py`, `admin.py`, `tests/`
3. Register in `settings.py` under `PLATFORM_APPS`
4. Run `python manage.py makemigrations <app_label>`
5. Add URL pattern in `core/urls.py`

### Adding a Kafka Event

1. Define schema in `shared/events/` (JSON Schema + Python dataclass)
2. Extend `DomainEvent` base class in `shared/events/base_event.py`
3. Publish via `OutboxEvent` model (transactional outbox pattern)
4. Add Avro schema to schema registry

### Adding a New API Endpoint

1. Create serializer in `serializers.py`
2. Create view in `views.py` (use DRF generics)
3. Register URL in `urls.py`
4. Add OpenAPI decorator (`@extend_schema`) for documentation
5. Write tests in `tests/`

## Code Quality

```bash
# Python — lint + format
cd backend
ruff check . --fix
ruff format .
mypy .

# TypeScript — lint + format
cd frontend
npm run lint
npx prettier --write .
```

## Secrets Management

- Never put real secrets in source control
- Use `.env.local` for local development (gitignored)
- Production uses HashiCorp Vault via K8s ServiceAccount auth
- See [docs/security/secrets_management_strategy.md](../security/secrets_management_strategy.md)

## Observability

- Traces: OTel → Tempo → Grafana (http://localhost:3001)
- Metrics: OTel → Prometheus → Grafana
- Logs: stdout → JSON → log collector
- Set `OTEL_ENABLED=true` and `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317` to enable
