# Python Standards

> **Status:** Approved — Program 0, Phase 0.3
> **Owner:** Principal Engineer (Backend)
> **Applies to:** All Python services in CyberCom (default: Django on PostgreSQL).

Extends [`coding_standards.md`](coding_standards.md). In any conflict, this document wins for Python code.

---

## 1. Versions & Toolchain

| Tool | Version |
|---|---|
| Python | **3.12.x** (LTS-stable); 3.13 evaluated per project |
| Package manager | **Poetry** (preferred) or `uv`; `pip-tools` only for legacy |
| Formatter | **`ruff format`** (Black-compatible) |
| Linter | **`ruff`** (replaces flake8, isort, pyupgrade, etc.) |
| Type checker | **`mypy --strict`** |
| Test runner | **`pytest`** + `pytest-cov`, `pytest-django`, `pytest-asyncio` |
| Security | `bandit`, `pip-audit`, `safety` |
| Pre-commit | **`pre-commit`** mandatory |

`pyproject.toml` is the single source of truth. No `setup.py`.

---

## 2. Naming

- Modules / packages: `snake_case`.
- Classes, exceptions: `PascalCase`.
- Functions, variables: `snake_case`.
- Constants: `UPPER_SNAKE_CASE`.
- Private: leading `_`. Name-mangling `__` only when truly needed.
- Test files: `test_*.py`; test functions: `test_*`; classes: `Test*` (no `__init__`).

---

## 3. Folder Layout (Django service)

```
<service>/
├── pyproject.toml
├── README.md
├── manage.py
├── src/
│   └── <service_name>/
│       ├── __init__.py
│       ├── settings/
│       │   ├── base.py
│       │   ├── dev.py
│       │   ├── prod.py
│       │   └── test.py
│       ├── urls.py
│       ├── asgi.py
│       ├── wsgi.py
│       └── apps/
│           └── <bounded_context>/
│               ├── __init__.py
│               ├── apps.py
│               ├── models.py        # ORM (infrastructure)
│               ├── domain/          # Pure domain (no Django imports)
│               ├── application/     # Use cases
│               ├── api/
│               │   ├── serializers.py
│               │   ├── views.py
│               │   └── urls.py
│               ├── migrations/
│               └── tests/
└── tests/                            # cross-app tests
```

**Rule:** `domain/` MUST NOT import from `django.*` or any ORM. Use cases depend on repository interfaces, not Django QuerySets directly.

---

## 4. Django Conventions

- **Settings:** split per environment; load secrets from env (12-factor); use `django-environ` or `pydantic-settings`.
- **Apps:** one Django app per bounded context, not per model.
- **Models:** abstract `BaseModel` with `id: UUIDField(primary_key=True, default=uuid4)`, `created_at`, `updated_at`, `created_by`, `updated_by`, `is_deleted`, `deleted_at`, `tenant_id`. See [`database_standards.md`](database_standards.md).
- **Managers:** custom managers exclude soft-deleted rows by default; provide `.all_with_deleted()`.
- **Migrations:** always reviewed; never edited after merge; data migrations separated from schema migrations.
- **Forms:** prefer DRF serializers for APIs; forms only for admin/internal UIs.
- **Admin:** read-only by default in production; mutations gated by permission.
- **Signals:** discouraged; explicit calls preferred. If used, document in module docstring.
- **Async:** use Django 5 async views where I/O-bound; ORM async APIs where stable.

---

## 5. DRF (REST) Conventions

- ViewSets over function views for resources.
- Serializers split: `Read*Serializer`, `Write*Serializer`.
- Filtering via `django-filter`; pagination via custom paginator (see [`api_standards.md`](api_standards.md)).
- Permissions via dedicated classes; never inline `if user.is_…`.
- Throttling configured per scope.
- OpenAPI via `drf-spectacular`; spec committed under `<service>/openapi/`.

---

## 6. Type Hints

- **All public functions and methods MUST be fully type-annotated.**
- `mypy --strict` is required CI; new code may not introduce `# type: ignore` without a comment explaining why.
- Prefer `TypedDict`, `Protocol`, `Literal`, `Annotated` over `Any`.
- Use `from __future__ import annotations` in libraries.

---

## 7. Error Handling

- Define a domain exception hierarchy per app:
  ```python
  class CymedError(Exception): ...
  class PatientNotFoundError(CymedError): ...
  ```
- DRF: custom exception handler maps domain exceptions → standard error envelope (see [`api_standards.md`](api_standards.md)).
- Never `except Exception:` without re-raise or explicit, logged justification.

---

## 8. Logging & Observability

- Use `structlog` configured to emit JSON in production.
- Bind context: `log = log.bind(tenant_id=…, trace_id=…)`.
- OpenTelemetry via `opentelemetry-instrumentation-django` + `-psycopg`.
- Sentry (or equivalent) for unhandled exceptions.

---

## 9. Concurrency

- I/O-bound → async views, `httpx.AsyncClient`, async ORM where stable.
- CPU-bound → `concurrent.futures.ProcessPoolExecutor` or offload to Celery workers.
- Background jobs → **Celery** with Redis or RabbitMQ broker; periodic tasks via Celery Beat.
- Never block the event loop in async code (`time.sleep`, sync DB calls).

---

## 10. Testing

- `pytest` only. `unittest` permitted only for Django internals.
- Use `pytest-django` fixtures (`db`, `client`, `rf`).
- Factories via `factory_boy` (no hand-written fixtures for models).
- `pytest-cov` enforces coverage thresholds from [`coding_standards.md`](coding_standards.md) §10.
- Marks: `@pytest.mark.unit`, `@pytest.mark.integration`, `@pytest.mark.e2e`, `@pytest.mark.slow`.

---

## 11. Performance

- Use `select_related` / `prefetch_related` to avoid N+1.
- `django-silk` or `nplusone` in dev to detect query smells.
- Use `iterator()` for large querysets.
- Add DB indexes proactively for `tenant_id`, FK columns, and frequent filter/sort fields.

---

## 12. Forbidden / Discouraged

- `from x import *` (forbidden).
- Mutable default arguments.
- Bare `except:`.
- `print()` in non-script code.
- Patching `os.environ` in tests (use fixtures).
- `eval` / `exec`.
- Pickling untrusted data.

---

## 13. Pre-commit (mandatory)

```yaml
# .pre-commit-config.yaml (excerpt)
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    hooks: [{id: ruff}, {id: ruff-format}]
  - repo: https://github.com/pre-commit/mirrors-mypy
    hooks: [{id: mypy, args: ["--strict"]}]
  - repo: https://github.com/PyCQA/bandit
    hooks: [{id: bandit, args: ["-q", "-r", "src"]}]
  - repo: https://github.com/python-poetry/poetry
    hooks: [{id: poetry-check}, {id: poetry-lock}]
```
