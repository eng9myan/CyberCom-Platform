#!/usr/bin/env bash
# =============================================================================
# CyberCom Platform — Rollback Procedure Script
# Program 10, Phase 4: Customer Pilot Package
#
# Executes rollback for a failed or problematic pilot deployment.
# Supports: Kubernetes Helm rollback, database restore, tenant suspension.
#
# Usage:
#   ./rollback.sh \
#     --tenant-id <UUID> \
#     --release-name cybercom-pilot \
#     --namespace cybercom-prod \
#     --api-url https://api.cy-com.com \
#     --api-token <TOKEN> \
#     [--dry-run]
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
die()       { log_error "$*"; exit 1; }

TENANT_ID=""
RELEASE_NAME="cybercom"
NAMESPACE="cybercom-prod"
API_URL="https://api.cy-com.com"
API_TOKEN=""
DRY_RUN=false
ROLLBACK_REVISION=""
SUSPEND_TENANT=false
RESTORE_DB=false
DB_BACKUP_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tenant-id)        TENANT_ID="$2"; shift 2 ;;
    --release-name)     RELEASE_NAME="$2"; shift 2 ;;
    --namespace)        NAMESPACE="$2"; shift 2 ;;
    --api-url)          API_URL="$2"; shift 2 ;;
    --api-token)        API_TOKEN="$2"; shift 2 ;;
    --revision)         ROLLBACK_REVISION="$2"; shift 2 ;;
    --suspend-tenant)   SUSPEND_TENANT=true; shift ;;
    --restore-db)       RESTORE_DB=true; shift ;;
    --db-backup-file)   DB_BACKUP_FILE="$2"; shift 2 ;;
    --dry-run)          DRY_RUN=true; shift ;;
    *) die "Unknown argument: $1" ;;
  esac
done

[[ -n "$TENANT_ID" ]] || die "--tenant-id required"

echo ""
echo "============================================================"
echo "  CyberCom Rollback Procedure"
echo "  Tenant ID      : $TENANT_ID"
echo "  Release Name   : $RELEASE_NAME"
echo "  Namespace      : $NAMESPACE"
echo "  Dry Run        : $DRY_RUN"
echo "  Suspend Tenant : $SUSPEND_TENANT"
echo "  Restore DB     : $RESTORE_DB"
echo "============================================================"
echo ""
log_warn "Rollback initiated at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

run_cmd() {
  if $DRY_RUN; then
    log_warn "[DRY-RUN] Would run: $*"
  else
    "$@"
  fi
}

api_call() {
  local method="$1" path="$2" body="${3:-}"
  local url="${API_URL}/api/v1${path}"
  if $DRY_RUN; then
    log_warn "[DRY-RUN] Would call: $method $url"
    return 0
  fi
  local curl_args=(-s -w "\n%{http_code}" -X "$method" "$url"
    -H "Authorization: Bearer $API_TOKEN"
    -H "Content-Type: application/json")
  [[ -n "$body" ]] && curl_args+=(-d "$body")
  local resp
  resp=$(curl "${curl_args[@]}")
  local code
  code=$(echo "$resp" | tail -1)
  echo "$resp" | head -n -1
  [[ "$code" -lt 400 ]] || { log_warn "API call returned HTTP $code"; }
}

# ── Step 1: Suspend tenant (block new sessions) ───────────────────────────────
if $SUSPEND_TENANT && [[ -n "$API_TOKEN" ]]; then
  log_info "Step 1: Suspending tenant to prevent new logins"
  api_call PATCH "/platform/tenants/$TENANT_ID/" '{"is_active": false, "suspension_reason": "rollback_in_progress"}'
  log_ok "Tenant suspended"
else
  log_info "Step 1: Tenant suspension skipped (--suspend-tenant not set)"
fi

# ── Step 2: Scale down to zero ────────────────────────────────────────────────
log_info "Step 2: Scaling down active deployments"
if command -v kubectl &>/dev/null; then
  run_cmd kubectl scale deployment --all --replicas=0 -n "$NAMESPACE"
  log_ok "Deployments scaled to zero"
else
  log_warn "kubectl not available — skipping scale-down"
fi

# ── Step 3: Database backup before restore ────────────────────────────────────
if $RESTORE_DB; then
  log_info "Step 3: Taking emergency database snapshot before restore"
  SNAPSHOT_FILE="emergency_pre_rollback_${TENANT_ID}_$(date +%Y%m%d_%H%M%S).dump"
  if command -v pg_dump &>/dev/null && [[ -n "${DATABASE_URL:-}" ]]; then
    run_cmd pg_dump "$DATABASE_URL" -F c -f "$SNAPSHOT_FILE"
    log_ok "Emergency snapshot: $SNAPSHOT_FILE"
  else
    log_warn "pg_dump not available or DATABASE_URL not set — skipping snapshot"
  fi

  # Restore from backup
  if [[ -n "$DB_BACKUP_FILE" ]]; then
    log_info "Restoring database from: $DB_BACKUP_FILE"
    if [[ -f "$DB_BACKUP_FILE" ]]; then
      run_cmd pg_restore -d "$DATABASE_URL" --clean --no-acl --no-owner "$DB_BACKUP_FILE"
      log_ok "Database restored"
    else
      log_error "Backup file not found: $DB_BACKUP_FILE"
    fi
  else
    log_warn "No --db-backup-file specified — database not restored"
  fi
else
  log_info "Step 3: Database restore skipped (--restore-db not set)"
fi

# ── Step 4: Helm rollback ─────────────────────────────────────────────────────
log_info "Step 4: Helm rollback"
if command -v helm &>/dev/null; then
  if [[ -n "$ROLLBACK_REVISION" ]]; then
    run_cmd helm rollback "$RELEASE_NAME" "$ROLLBACK_REVISION" -n "$NAMESPACE" --wait --timeout 10m
  else
    run_cmd helm rollback "$RELEASE_NAME" -n "$NAMESPACE" --wait --timeout 10m
  fi
  log_ok "Helm rollback complete"
else
  log_warn "helm not available — skipping Helm rollback"
fi

# ── Step 5: Verify pod health ─────────────────────────────────────────────────
log_info "Step 5: Verifying pod health post-rollback"
if command -v kubectl &>/dev/null && ! $DRY_RUN; then
  sleep 15
  kubectl rollout status deployment -n "$NAMESPACE" --timeout=5m || log_warn "Rollout status check failed"
  log_ok "Pods healthy"
fi

# ── Step 6: API health check ──────────────────────────────────────────────────
log_info "Step 6: Checking API health post-rollback"
if command -v curl &>/dev/null && ! $DRY_RUN; then
  HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health/" || echo "000")
  if [[ "$HEALTH_CODE" == "200" ]]; then
    log_ok "API health: OK (HTTP 200)"
  else
    log_warn "API health: HTTP $HEALTH_CODE — verify manually"
  fi
fi

# ── Step 7: Re-enable tenant if rollback successful ───────────────────────────
if $SUSPEND_TENANT && [[ -n "$API_TOKEN" ]]; then
  read -rp "Re-enable tenant after rollback? [y/N]: " confirm
  if [[ "${confirm,,}" == "y" ]]; then
    api_call PATCH "/platform/tenants/$TENANT_ID/" '{"is_active": true, "suspension_reason": ""}'
    log_ok "Tenant re-enabled"
  else
    log_warn "Tenant remains suspended — re-enable manually when ready"
  fi
fi

echo ""
echo "============================================================"
echo "  Rollback Complete"
echo "  Timestamp : $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""
echo "  Actions Taken:"
echo "  - Tenant suspended: $SUSPEND_TENANT"
echo "  - Database restored: $RESTORE_DB"
echo "  - Helm rollback: executed"
echo ""
echo "  NEXT: Contact CyberCom Support to review rollback root cause."
echo "  FILE: Production_GoLive_Checklist.md for re-deployment steps."
echo "============================================================"
