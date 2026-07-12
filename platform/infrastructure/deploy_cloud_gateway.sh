#!/usr/bin/env bash
#
# deploy_cloud_gateway.sh — Phase 7 Hybrid Edge cloud-side deploy.
#
# Scope note: the real production SaaS deployment (multi-tenant, HA) runs on
# OCI Kubernetes Engine per platform/OCI_Architecture_Report.md -- that's a
# separate, much larger pipeline (OKE node pools, load balancer, managed
# PostgreSQL HA) and is not what this script does. This script is the
# simpler single-Compute-instance path appropriate for a per-hospital
# "Hybrid Edge" cloud-side deployment: it deploys the SAME Django+Next.js
# stack (there is no separate "gateway" microservice -- see
# hybrid_sync_worker.py's header comment) to one OCI Compute VM and fronts
# it with nginx+TLS on the hospital's subdomain.
#
# Cloud provider: Oracle Cloud Infrastructure (OCI), not AWS -- matches
# platform/OCI_Architecture_Report.md and this project's established
# deployment target. Ubuntu Compute images on OCI use the `ubuntu` user by
# default (Canonical's official OCI marketplace images), same as AWS EC2's
# convention, so that part of the original ask carries over unchanged.
#
# Usage:
#   OCI_INSTANCE_IP=x.x.x.x DEPLOY_DOMAIN=hospital.cy-com.com \
#   SSH_KEY_PATH=~/.ssh/oci_instance_key ./deploy_cloud_gateway.sh
#
# Requires: the instance already exists (OCI Compute instance provisioning
# itself -- VCN, subnet, security list -- is infrastructure-as-code territory
# per OCI_Architecture_Report.md, not a one-shot bash script) and its public
# IP is reachable over SSH with the given key. Nothing here is executed
# automatically -- run it yourself once these are filled in for real.

set -euo pipefail

# ── Required configuration (fail fast if unset, never silently guess) ──────
: "${OCI_INSTANCE_IP:?Set OCI_INSTANCE_IP to the target Compute instance's public IP}"
: "${DEPLOY_DOMAIN:?Set DEPLOY_DOMAIN to the domain this deployment serves, e.g. hospital.cy-com.com}"
: "${SSH_KEY_PATH:?Set SSH_KEY_PATH to the private key for the instance's ubuntu user}"

SSH_USER="${SSH_USER:-ubuntu}"
GIT_REPO="${GIT_REPO:-https://github.com/eng9myan/CyberCom-Platform.git}"
GIT_BRANCH="${GIT_BRANCH:-develop}"
REMOTE_DIR="${REMOTE_DIR:-/opt/cybercom}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:?Set LETSENCRYPT_EMAIL for TLS certificate registration}"

SSH="ssh -i ${SSH_KEY_PATH} -o StrictHostKeyChecking=accept-new ${SSH_USER}@${OCI_INSTANCE_IP}"

echo "==> Deploying ${GIT_BRANCH} to ${DEPLOY_DOMAIN} (${OCI_INSTANCE_IP})"

# ── 1. Pull latest code ─────────────────────────────────────────────────────
$SSH bash -s <<REMOTE
set -euo pipefail
if [ ! -d "${REMOTE_DIR}/.git" ]; then
  sudo mkdir -p "${REMOTE_DIR}"
  sudo chown "\$(whoami):\$(whoami)" "${REMOTE_DIR}"
  git clone --branch "${GIT_BRANCH}" "${GIT_REPO}" "${REMOTE_DIR}"
else
  cd "${REMOTE_DIR}"
  git fetch origin "${GIT_BRANCH}"
  git checkout "${GIT_BRANCH}"
  git reset --hard "origin/${GIT_BRANCH}"
fi
REMOTE

# ── 2. Build containers (backend, frontend, celery worker + beat) ──────────
# Real production env vars (DB password, DJANGO_SECRET_KEY, tax-provider
# credentials, etc.) must already exist as a .env file at
# ${REMOTE_DIR}/platform/.env.production on the instance -- never generated
# or guessed by this script. docker compose --env-file picks it up.
$SSH bash -s <<REMOTE
set -euo pipefail
cd "${REMOTE_DIR}/platform"
if [ ! -f .env.production ]; then
  echo "FATAL: platform/.env.production is missing on the instance." >&2
  echo "Create it with real production secrets before running this script again." >&2
  exit 1
fi
docker compose -f infrastructure/docker-compose.yml \\
  --env-file .env.production \\
  build backend frontend celery-worker celery-beat
docker compose -f infrastructure/docker-compose.yml \\
  --env-file .env.production \\
  up -d backend frontend celery-worker celery-beat postgres redis
REMOTE

# ── 3. Run migrations ────────────────────────────────────────────────────────
$SSH bash -c "cd '${REMOTE_DIR}/platform' && docker compose -f infrastructure/docker-compose.yml exec -T backend python manage.py migrate --noinput"

# ── 4. nginx reverse proxy + TLS, bound to the real domain ─────────────────
# Config is built LOCALLY (single-quoted heredoc, so nginx's own $host/
# $remote_addr variables are never touched by local or remote shell
# expansion) with only DEPLOY_DOMAIN substituted via a placeholder swap,
# then piped over SSH as-is -- avoids the classic nested-heredoc quoting
# trap where local, remote, and nginx all want to expand the same `$`.
NGINX_CONF=$(cat <<'NGINX_TEMPLATE'
server {
    listen 80;
    server_name __DEPLOY_DOMAIN__;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_TEMPLATE
)
NGINX_CONF="${NGINX_CONF//__DEPLOY_DOMAIN__/${DEPLOY_DOMAIN}}"

$SSH "sudo apt-get update -qq && sudo apt-get install -y -qq nginx certbot python3-certbot-nginx"
printf '%s\n' "${NGINX_CONF}" | $SSH "sudo tee /etc/nginx/sites-available/cybercom >/dev/null"
$SSH "sudo ln -sf /etc/nginx/sites-available/cybercom /etc/nginx/sites-enabled/cybercom && sudo nginx -t && sudo systemctl reload nginx"
$SSH "sudo certbot --nginx -d '${DEPLOY_DOMAIN}' --non-interactive --agree-tos -m '${LETSENCRYPT_EMAIL}' --redirect"

echo "==> Deployed. Verify: https://${DEPLOY_DOMAIN}/health and https://${DEPLOY_DOMAIN}/api/v1/... "
echo "==> Celery beat is running the Phase 7 offline-tax-queue retry every 5 minutes (see CELERY_BEAT_SCHEDULE)."
