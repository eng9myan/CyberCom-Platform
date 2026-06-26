# =============================================================
# CyberCom Platform - Backend Image (ARM64 / VM.Standard.A1.Flex)
# Multi-stage build. Python 3.12 slim. Runs as non-root.
# Build context: ./backend
# =============================================================

# ---- Stage 1: builder ----
FROM --platform=linux/arm64 python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && /opt/venv/bin/pip install -r requirements.txt

# ---- Stage 2: runtime ----
FROM --platform=linux/arm64 python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    ENVIRONMENT=production \
    LOG_LEVEL=INFO

# Runtime OS deps (libpq for psycopg, curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 cybercom \
    && useradd --system --uid 1001 --gid cybercom --home /app cybercom

COPY --from=builder /opt/venv /opt/venv

WORKDIR /app
COPY . /app

RUN mkdir -p /app/logs /app/staticfiles \
    && chown -R cybercom:cybercom /app

USER cybercom

EXPOSE 8000

# Container-level healthcheck (compose also defines one)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

# Gunicorn + Uvicorn workers (ASGI). Override CMD per-service in compose.
CMD ["gunicorn", "platform.api.main:app", \
     "--workers", "3", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--timeout", "60"]
