#!/usr/bin/env python3
"""
Enforce real TOTP MFA on the CyberCom Keycloak realm.

Why Keycloak and not Django: platform/cyidentity/models.py's UserProfile
docstring is explicit that "authoritative credential and authentication
state lives in Keycloak" -- this app is a control-plane mirror. Hand-rolling
TOTP verification in Django (pyotp + a custom enrollment UI) would create a
second, divergent source of MFA truth alongside Keycloak's own login flow.
The correct fix is to turn on Keycloak's native, already-audited OTP
support and make it a required action, then have the Django side reflect
that state rather than re-implement it.

This script is idempotent -- safe to re-run. It:
  1. Sets the realm's OTP policy (TOTP, 6 digits, 30s period, SHA1 -- the
     RFC 6238 defaults every authenticator app expects).
  2. Enables and defaults the CONFIGURE_TOTP required action, so every user
     without an enrolled authenticator is forced through Keycloak's own
     hosted enrollment screen (QR code + verification) on next login.

Usage:
    python configure_mfa.py
Environment:
    KEYCLOAK_BASE_URL   default http://localhost:8080
    KEYCLOAK_REALM      default cybercom
    KEYCLOAK_ADMIN_USER default admin
    KEYCLOAK_ADMIN_PASS default admin
"""

import os
import sys

import httpx

BASE_URL = os.environ.get("KEYCLOAK_BASE_URL", "http://localhost:8080")
REALM = os.environ.get("KEYCLOAK_REALM", "cybercom")
ADMIN_USER = os.environ.get("KEYCLOAK_ADMIN_USER", "admin")
ADMIN_PASS = os.environ.get("KEYCLOAK_ADMIN_PASS", "admin")


def get_admin_token(client: httpx.Client) -> str:
    resp = client.post(
        f"{BASE_URL}/realms/master/protocol/openid-connect/token",
        data={
            "grant_type": "password",
            "client_id": "admin-cli",
            "username": ADMIN_USER,
            "password": ADMIN_PASS,
        },
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def configure_otp_policy(client: httpx.Client, token: str) -> None:
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get(f"{BASE_URL}/admin/realms/{REALM}", headers=headers)
    resp.raise_for_status()
    realm = resp.json()

    realm.update(
        {
            "otpPolicyType": "totp",
            "otpPolicyAlgorithm": "HmacSHA1",
            "otpPolicyDigits": 6,
            "otpPolicyPeriod": 30,
            "otpPolicyLookAheadWindow": 1,
            "otpPolicyInitialCounter": 0,
        }
    )
    put_resp = client.put(f"{BASE_URL}/admin/realms/{REALM}", headers=headers, json=realm)
    put_resp.raise_for_status()
    print(f"[ok] OTP policy set on realm '{REALM}': TOTP / 6 digits / 30s / SHA1")


def enable_configure_totp_required_action(client: httpx.Client, token: str) -> None:
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get(
        f"{BASE_URL}/admin/realms/{REALM}/authentication/required-actions",
        headers=headers,
    )
    resp.raise_for_status()
    actions = resp.json()

    for action in actions:
        if action["alias"] != "CONFIGURE_TOTP":
            continue
        if action["enabled"] and action["defaultAction"]:
            print("[ok] CONFIGURE_TOTP already enabled and default -- no change needed")
            return
        action["enabled"] = True
        action["defaultAction"] = True
        put_resp = client.put(
            f"{BASE_URL}/admin/realms/{REALM}/authentication/required-actions/CONFIGURE_TOTP",
            headers=headers,
            json=action,
        )
        put_resp.raise_for_status()
        print("[ok] CONFIGURE_TOTP required action enabled and set as default for new users")
        return

    print("[warn] CONFIGURE_TOTP required action not found on this realm", file=sys.stderr)


def main() -> None:
    with httpx.Client(timeout=10) as client:
        token = get_admin_token(client)
        configure_otp_policy(client, token)
        enable_configure_totp_required_action(client, token)


if __name__ == "__main__":
    main()
