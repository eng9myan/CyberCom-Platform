#!/usr/bin/env bash
# =============================================================================
# CyberCom Platform — Pilot Deployment Script
# Program 10, Phase 4: Customer Pilot Package
#
# Supports: hospital | clinic | laboratory | imaging | pharmacy
#
# Usage:
#   ./deploy_pilot.sh \
#     --facility-type clinic \
#     --tenant-name "Al-Noor Medical Centre" \
#     --tenant-slug "al-noor-clinic" \
#     --admin-email "admin@al-noor-clinic.jo" \
#     --edition clinic \
#     --api-url https://api.cy-com.com \
#     --api-token <CYBERCOM_ADMIN_TOKEN> \
#     [--dry-run]
# =============================================================================
set -euo pipefail

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
die()       { log_error "$*"; exit 1; }

# ── Argument parsing ──────────────────────────────────────────────────────────
FACILITY_TYPE=""
TENANT_NAME=""
TENANT_SLUG=""
ADMIN_EMAIL=""
EDITION=""
API_URL="https://api.cy-com.com"
API_TOKEN=""
DRY_RUN=false
DEMO_DATA=true
LOCALE="en"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --facility-type)   FACILITY_TYPE="$2"; shift 2 ;;
    --tenant-name)     TENANT_NAME="$2"; shift 2 ;;
    --tenant-slug)     TENANT_SLUG="$2"; shift 2 ;;
    --admin-email)     ADMIN_EMAIL="$2"; shift 2 ;;
    --edition)         EDITION="$2"; shift 2 ;;
    --api-url)         API_URL="$2"; shift 2 ;;
    --api-token)       API_TOKEN="$2"; shift 2 ;;
    --locale)          LOCALE="$2"; shift 2 ;;
    --no-demo-data)    DEMO_DATA=false; shift ;;
    --dry-run)         DRY_RUN=true; shift ;;
    *) die "Unknown argument: $1" ;;
  esac
done

# ── Validate inputs ───────────────────────────────────────────────────────────
[[ -n "$FACILITY_TYPE" ]] || die "--facility-type required (hospital|clinic|laboratory|imaging|pharmacy)"
[[ -n "$TENANT_NAME" ]]   || die "--tenant-name required"
[[ -n "$TENANT_SLUG" ]]   || die "--tenant-slug required"
[[ -n "$ADMIN_EMAIL" ]]   || die "--admin-email required"
[[ -n "$API_TOKEN" ]]     || die "--api-token required"

VALID_TYPES="hospital clinic laboratory imaging pharmacy"
echo "$VALID_TYPES" | grep -qw "$FACILITY_TYPE" || die "Invalid --facility-type: $FACILITY_TYPE"

# Infer edition from facility type if not specified
if [[ -z "$EDITION" ]]; then
  case "$FACILITY_TYPE" in
    hospital)    EDITION="hospital" ;;
    clinic)      EDITION="clinic" ;;
    laboratory)  EDITION="laboratory" ;;
    imaging)     EDITION="imaging" ;;
    pharmacy)    EDITION="pharmacy" ;;
  esac
fi

echo ""
echo "============================================================"
echo "  CyberCom Pilot Deployment"
echo "  Facility Type : $FACILITY_TYPE"
echo "  Tenant Name   : $TENANT_NAME"
echo "  Tenant Slug   : $TENANT_SLUG"
echo "  Edition       : $EDITION"
echo "  Admin Email   : $ADMIN_EMAIL"
echo "  API URL       : $API_URL"
echo "  Demo Data     : $DEMO_DATA"
echo "  Dry Run       : $DRY_RUN"
echo "============================================================"
echo ""

# ── API helpers ───────────────────────────────────────────────────────────────
api_call() {
  local method="$1" path="$2" body="${3:-}"
  local url="${API_URL}/api/v1${path}"
  local curl_args=(-s -w "\n%{http_code}" -X "$method" "$url"
    -H "Authorization: Bearer $API_TOKEN"
    -H "Content-Type: application/json"
    -H "Accept: application/json")
  [[ -n "$body" ]] && curl_args+=(-d "$body")
  if $DRY_RUN; then
    log_warn "[DRY-RUN] Would call: $method $url"
    echo '{"id":"00000000-0000-0000-0000-000000000000","status":"dry_run"}\n200'
    return 0
  fi
  curl "${curl_args[@]}"
}

check_response() {
  local name="$1" response="$2"
  local http_code body
  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | head -n -1)
  if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
    log_ok "$name: HTTP $http_code"
    echo "$body"
  else
    log_error "$name failed: HTTP $http_code"
    echo "$body" >&2
    die "Deployment aborted at: $name"
  fi
}

# ── Phase 1: Pre-flight checks ────────────────────────────────────────────────
log_info "Step 1/8: Pre-flight checks"

HEALTH_RESP=$(api_call GET /health/)
if ! $DRY_RUN; then
  HEALTH_CODE=$(echo "$HEALTH_RESP" | tail -1)
  [[ "$HEALTH_CODE" == "200" ]] || die "Platform health check failed (HTTP $HEALTH_CODE)"
fi
log_ok "Platform health check passed"

# ── Phase 2: Tenant provisioning ─────────────────────────────────────────────
log_info "Step 2/8: Provisioning tenant"
TENANT_RESP=$(api_call POST /platform/tenants/ "{
  \"name\": \"$TENANT_NAME\",
  \"slug\": \"$TENANT_SLUG\",
  \"is_active\": true,
  \"locale\": \"$LOCALE\",
  \"timezone\": \"Asia/Amman\",
  \"metadata\": {
    \"pilot_deployment\": true,
    \"facility_type\": \"$FACILITY_TYPE\",
    \"edition\": \"$EDITION\"
  }
}")
TENANT_ID=$(check_response "Tenant provisioning" "$TENANT_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "dry-run-tenant")

# ── Phase 3: License activation ───────────────────────────────────────────────
log_info "Step 3/8: Activating pilot license"
LICENSE_RESP=$(api_call POST /commercial-readiness/licenses/ "{
  \"license_type\": \"pilot\",
  \"license_scope\": \"single_tenant\",
  \"product_code\": \"cymed_${EDITION}\",
  \"edition\": \"$EDITION\",
  \"issued_to\": \"$TENANT_NAME\",
  \"issued_to_email\": \"$ADMIN_EMAIL\",
  \"max_users\": 50,
  \"max_facilities\": 1,
  \"licensed_features\": [\"core\", \"${FACILITY_TYPE}\", \"rcm\", \"patient_portal\"],
  \"licensed_modules\": [\"${EDITION}\"],
  \"status\": \"active\",
  \"auto_renew\": false,
  \"notes\": \"Pilot deployment — 90-day evaluation\"
}")
check_response "License activation" "$LICENSE_RESP" > /dev/null

# ── Phase 4: Admin user provisioning ─────────────────────────────────────────
log_info "Step 4/8: Provisioning admin user"
ADMIN_RESP=$(api_call POST /platform/users/ "{
  \"email\": \"$ADMIN_EMAIL\",
  \"first_name\": \"System\",
  \"last_name\": \"Administrator\",
  \"tenant_id\": \"$TENANT_ID\",
  \"roles\": [\"tenant_admin\"],
  \"send_invitation\": true,
  \"force_mfa\": true,
  \"locale\": \"$LOCALE\"
}")
check_response "Admin user provisioning" "$ADMIN_RESP" > /dev/null

# ── Phase 5: Feature flags ────────────────────────────────────────────────────
log_info "Step 5/8: Configuring feature flags for $EDITION edition"
FEATURES=()
case "$FACILITY_TYPE" in
  hospital)
    FEATURES=("inpatient" "emergency" "icu" "operating_room" "lab" "imaging" "pharmacy" "rcm" "workforce")
    ;;
  clinic)
    FEATURES=("outpatient" "appointments" "emr" "lab_orders" "imaging_orders" "pharmacy" "rcm" "patient_portal")
    ;;
  laboratory)
    FEATURES=("lab_reception" "specimen_processing" "result_entry" "auto_verification" "critical_alerts" "loinc_coding")
    ;;
  imaging)
    FEATURES=("modality_worklist" "dicom_viewer" "radiology_reporting" "teleradiology" "icd11_coding")
    ;;
  pharmacy)
    FEATURES=("dispensing" "drug_interactions" "allergy_checks" "medication_reconciliation" "clinical_pharmacy" "inventory")
    ;;
esac

for feature in "${FEATURES[@]}"; do
  FF_RESP=$(api_call POST /commercial-readiness/feature-flags/ "{
    \"flag_code\": \"${EDITION}_${feature}\",
    \"flag_name\": \"${feature}\",
    \"is_active\": true,
    \"tenant_id\": \"$TENANT_ID\"
  }")
  # Non-fatal if flag already exists (409 idempotent)
  FF_CODE=$(echo "$FF_RESP" | tail -1)
  if [[ "$FF_CODE" -ge 200 && "$FF_CODE" -lt 300 ]] || [[ "$FF_CODE" == "409" ]]; then
    log_ok "Feature flag: $feature"
  else
    log_warn "Feature flag $feature: HTTP $FF_CODE (non-fatal)"
  fi
done

# ── Phase 6: Demo data seeding ────────────────────────────────────────────────
if $DEMO_DATA; then
  log_info "Step 6/8: Seeding demo data"
  SEED_RESP=$(api_call POST /platform/admin/seed-demo/ "{
    \"tenant_id\": \"$TENANT_ID\",
    \"facility_type\": \"$FACILITY_TYPE\",
    \"edition\": \"$EDITION\"
  }")
  check_response "Demo data seeding" "$SEED_RESP" > /dev/null
else
  log_info "Step 6/8: Skipping demo data (--no-demo-data)"
fi

# ── Phase 7: Validation ───────────────────────────────────────────────────────
log_info "Step 7/8: Running post-deployment validation"
VALIDATE_SCRIPT="$(dirname "$0")/../validation/validate_clinic.py"
if [[ -f "$VALIDATE_SCRIPT" ]] && ! $DRY_RUN; then
  python3 "$VALIDATE_SCRIPT" \
    --tenant-id "$TENANT_ID" \
    --api-url "$API_URL" \
    --api-token "$API_TOKEN" \
    --facility-type "$FACILITY_TYPE" \
    || log_warn "Validation script reported issues — review before go-live"
else
  log_warn "Validation script not run (dry-run or not found)"
fi

# ── Phase 8: Summary ──────────────────────────────────────────────────────────
log_info "Step 8/8: Deployment complete"
echo ""
echo "============================================================"
echo "  CyberCom Pilot Deployment Complete"
echo ""
echo "  Tenant ID     : $TENANT_ID"
echo "  Facility Type : $FACILITY_TYPE"
echo "  Edition       : $EDITION"
echo "  Admin Portal  : https://portal.cy-com.com"
echo "  Admin Email   : $ADMIN_EMAIL"
echo ""
echo "  Next Steps:"
echo "  1. Admin will receive invitation email with temporary password"
echo "  2. MFA enrollment required on first login"
echo "  3. Complete configuration checklist in Production_GoLive_Checklist.md"
echo "  4. Run UAT script: scripts/pilot/uat_scenarios.py"
echo "  5. Schedule hypercare call within 48h of go-live"
echo "============================================================"
