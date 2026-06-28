#!/usr/bin/env python3
"""
CyberCom Clinic Validation Script
Validates all clinic workflows are operational post-deployment.

Usage:
    python validate_clinic.py --tenant-id <UUID> --api-url https://api.cy-com.com --api-token <token>
"""
import argparse
import json
import sys
import uuid
import urllib.request
import urllib.error
from datetime import datetime, date, timedelta
from typing import Tuple

PASS = "PASS"
FAIL = "FAIL"
SKIP = "SKIP"


class Validator:
    def __init__(self, api_url: str, token: str, tenant_id: str):
        self.api_url = api_url.rstrip("/")
        self.token = token
        self.tenant_id = tenant_id
        self.results = []

    def _call(self, method: str, path: str, body: dict = None) -> Tuple[int, dict]:
        url = f"{self.api_url}{path}"
        data = json.dumps(body).encode() if body else None
        req = urllib.request.Request(
            url, data=data, method=method,
            headers={
                "Authorization": f"Bearer {self.token}",
                "X-Tenant-ID": self.tenant_id,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(req) as resp:
                return resp.status, json.loads(resp.read())
        except urllib.error.HTTPError as e:
            body_text = e.read().decode()
            return e.code, {"error": body_text}

    def check(self, name: str, status: str, detail: str = "") -> None:
        icon = "✓" if status == PASS else ("⚠" if status == SKIP else "✗")
        print(f"  {icon} {name}: {status}" + (f" — {detail}" if detail else ""))
        self.results.append({"check": name, "status": status, "detail": detail})

    def run(self) -> bool:
        print(f"\nCyberCom Clinic Validation")
        print(f"Tenant: {self.tenant_id}")
        print(f"API: {self.api_url}")
        print(f"Time: {datetime.utcnow().isoformat()}")
        print("-" * 50)

        # 1. Health check
        print("\n[1] Health Checks")
        status, body = self._call("GET", "/health/readiness")
        self.check("API health", PASS if status == 200 else FAIL, f"HTTP {status}")

        status, _ = self._call("GET", "/api/v1/public/health/")
        self.check("Public API health", PASS if status == 200 else FAIL, f"HTTP {status}")

        # 2. Patient registration
        print("\n[2] Patient Registration")
        patient_payload = {
            "mrn": f"TEST-{uuid.uuid4().hex[:8].upper()}",
            "first_name": "Validation",
            "last_name": "Patient",
            "date_of_birth": "1980-06-15",
            "gender": "male",
            "phone_mobile": "+962791000000",
        }
        status, body = self._call("POST", "/api/v1/cymed/patients/", patient_payload)
        patient_id = body.get("id")
        self.check("Create patient", PASS if status == 201 and patient_id else FAIL, f"HTTP {status}")

        if patient_id:
            status, body = self._call("GET", f"/api/v1/cymed/patients/{patient_id}/")
            self.check("Retrieve patient", PASS if status == 200 else FAIL, f"HTTP {status}")

        # 3. Appointment booking
        print("\n[3] Appointment Scheduling")
        appt_payload = {
            "patient_id": patient_id,
            "appointment_date": (date.today() + timedelta(days=1)).isoformat(),
            "appointment_time": "09:00",
            "appointment_type": "new",
            "specialty": "general_practice",
        }
        status, body = self._call("POST", "/api/v1/cymed/clinic/appointments/", appt_payload)
        appointment_id = body.get("id")
        self.check("Create appointment", PASS if status == 201 and appointment_id else FAIL, f"HTTP {status}")

        # 4. Queue management
        print("\n[4] Queue Management")
        status, body = self._call("GET", "/api/v1/cymed/clinic/queues/today/")
        self.check("View today's queue", PASS if status == 200 else FAIL, f"HTTP {status}")

        # 5. Consultation
        print("\n[5] Consultation Workflow")
        encounter_payload = {
            "patient_id": patient_id,
            "encounter_type": "outpatient",
            "chief_complaint": "Validation test encounter",
        }
        status, body = self._call("POST", "/api/v1/cymed/encounters/", encounter_payload)
        encounter_id = body.get("id")
        self.check("Create encounter", PASS if status == 201 else FAIL, f"HTTP {status}")

        # 6. Drug interaction check
        print("\n[6] Clinical Safety")
        status, body = self._call("POST", "/api/v1/cymed/pharmacy/drug-interactions/check/", {
            "drug_codes": ["rxnorm:10582", "rxnorm:41493"],
            "patient_id": patient_id,
        })
        self.check("Drug interaction check", PASS if status in [200, 201] else FAIL, f"HTTP {status}")

        # 7. Notifications
        print("\n[7] Notifications")
        status, body = self._call("GET", "/api/v1/platform/notifications/channels/")
        self.check("Notification channels", PASS if status == 200 else FAIL, f"HTTP {status}")

        # 8. Audit trail
        print("\n[8] Audit Trail")
        status, body = self._call("GET", f"/api/v1/platform/audit/?resource_type=Patient&limit=5")
        self.check("Audit log accessible", PASS if status == 200 else FAIL, f"HTTP {status}")

        # Summary
        print("\n" + "=" * 50)
        passed = sum(1 for r in self.results if r["status"] == PASS)
        failed = sum(1 for r in self.results if r["status"] == FAIL)
        total = len(self.results)
        print(f"Results: {passed}/{total} passed, {failed} failed")

        if failed == 0:
            print("✓ ALL CHECKS PASSED — Clinic is operational")
        else:
            print(f"✗ {failed} CHECK(S) FAILED — Review failures before go-live")

        return failed == 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate CyberCom clinic deployment")
    parser.add_argument("--tenant-id", required=True, help="Tenant UUID")
    parser.add_argument("--api-url", default="http://localhost:8000", help="Platform API URL")
    parser.add_argument("--api-token", required=True, help="Admin API token")
    args = parser.parse_args()

    try:
        uuid.UUID(args.tenant_id)
    except ValueError:
        print(f"ERROR: Invalid tenant-id: {args.tenant_id}", file=sys.stderr)
        sys.exit(1)

    validator = Validator(args.api_url, args.api_token, args.tenant_id)
    success = validator.run()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
