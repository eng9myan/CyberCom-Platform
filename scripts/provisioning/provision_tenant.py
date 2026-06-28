#!/usr/bin/env python3
"""
CyberCom Tenant Provisioning Script
Creates and configures a new tenant via the Platform API.

Usage:
    python provision_tenant.py \
        --name "General Hospital" \
        --edition professional \
        --modules clinic,hospital,laboratory \
        --api-url https://api.cy-com.com \
        --api-token <admin-token>
"""
import argparse
import json
import sys
import urllib.request
import urllib.error
from datetime import datetime

VALID_EDITIONS = ["basic", "professional", "enterprise", "government"]

MODULE_MAP = {
    "clinic": "products.cymed.clinic",
    "hospital": "products.cymed.hospital",
    "laboratory": "products.cymed.laboratory",
    "imaging": "products.cymed.imaging",
    "pharmacy": "products.cymed.pharmacy",
    "patient_portal": "products.cymed.patient_portal",
    "provider_portal": "products.cymed.provider_portal",
    "rcm": "products.cymed.rcm",
    "population_health": "products.cymed.population_health",
    "cycom": "products.cycom",
    "cygov": "products.cygov",
}


def api_call(api_url: str, token: str, method: str, path: str, body: dict = None) -> dict:
    url = f"{api_url.rstrip('/')}{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body_text = e.read().decode()
        print(f"HTTP {e.code} {e.reason}: {body_text}", file=sys.stderr)
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Provision a new CyberCom tenant")
    parser.add_argument("--name", required=True, help="Customer/tenant name")
    parser.add_argument("--edition", required=True, choices=VALID_EDITIONS, help="Product edition")
    parser.add_argument("--modules", required=True, help="Comma-separated module list")
    parser.add_argument("--api-url", default="http://localhost:8000", help="Platform API URL")
    parser.add_argument("--api-token", required=True, help="Admin API token")
    parser.add_argument("--contact-email", default="", help="Primary contact email")
    parser.add_argument("--language", default="en", help="Default language (en/ar)")
    parser.add_argument("--timezone", default="UTC", help="Timezone")
    parser.add_argument("--deployment-profile", default="cloud", help="Deployment profile")
    args = parser.parse_args()

    modules = [m.strip() for m in args.modules.split(",") if m.strip()]
    unknown_modules = [m for m in modules if m not in MODULE_MAP]
    if unknown_modules:
        print(f"ERROR: Unknown modules: {unknown_modules}", file=sys.stderr)
        print(f"Valid: {list(MODULE_MAP.keys())}", file=sys.stderr)
        sys.exit(1)

    print(f"Provisioning tenant: {args.name}")
    print(f"Edition: {args.edition}")
    print(f"Modules: {modules}")

    payload = {
        "name": args.name,
        "edition": args.edition,
        "modules": modules,
        "contact_email": args.contact_email,
        "default_language": args.language,
        "timezone": args.timezone,
        "deployment_profile": args.deployment_profile,
        "provisioned_at": datetime.utcnow().isoformat(),
    }

    result = api_call(args.api_url, args.api_token, "POST", "/api/v1/admin/tenants/", payload)

    print("\nTenant provisioned successfully:")
    print(f"  Tenant ID:  {result.get('id')}")
    print(f"  Name:       {result.get('name')}")
    print(f"  Edition:    {result.get('edition')}")
    print(f"  Status:     {result.get('status')}")
    print(f"\nNext steps:")
    print(f"  1. Configure Keycloak realm for tenant ID: {result.get('id')}")
    print(f"  2. Import users and assign roles")
    print(f"  3. Run data migration if applicable")
    print(f"  4. Verify health: GET /api/v1/admin/tenants/{result.get('id')}/health/")


if __name__ == "__main__":
    main()
