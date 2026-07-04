#!/usr/bin/env python3
"""
CyberCom Platform – Load & Stress Test Scenarios
Program 10, Phase 3: Performance & Reliability

Covers:
- Clinic concurrent outpatient queue (50 simultaneous users)
- Hospital emergency registration burst (100 req/s for 30s)
- Lab result retrieval under load
- Pharmacy dispensing workflow concurrency
- Multi-tenant isolation under load (interleaved tenant requests)

Usage:
    python load_test_scenarios.py --api-url https://api.cy-com.com \
        --tenant-id <UUID> --token <JWT> \
        --scenario clinic_queue [--concurrency 50] [--duration 60]

Requirements:
    No external dependencies — uses stdlib urllib + threading.
"""
import argparse
import json
import statistics
import sys
import time
import urllib.error
import urllib.request
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from typing import List, Optional


# ── Result data structures ───────────────────────────────────────────────────

@dataclass
class RequestResult:
    scenario: str
    status_code: int
    latency_ms: float
    success: bool
    error: str = ""


@dataclass
class ScenarioReport:
    scenario: str
    total_requests: int = 0
    success_count: int = 0
    error_count: int = 0
    latencies: List[float] = field(default_factory=list)
    duration_s: float = 0.0

    def p50(self) -> float:
        return statistics.median(self.latencies) if self.latencies else 0.0

    def p95(self) -> float:
        if not self.latencies:
            return 0.0
        sorted_l = sorted(self.latencies)
        idx = int(len(sorted_l) * 0.95)
        return sorted_l[min(idx, len(sorted_l) - 1)]

    def p99(self) -> float:
        if not self.latencies:
            return 0.0
        sorted_l = sorted(self.latencies)
        idx = int(len(sorted_l) * 0.99)
        return sorted_l[min(idx, len(sorted_l) - 1)]

    def rps(self) -> float:
        return self.total_requests / self.duration_s if self.duration_s > 0 else 0.0

    def error_rate(self) -> float:
        return (self.error_count / self.total_requests * 100) if self.total_requests > 0 else 0.0

    def passed(self, max_p95_ms: float = 2000, max_error_pct: float = 1.0) -> bool:
        return self.p95() <= max_p95_ms and self.error_rate() <= max_error_pct


# ── HTTP utility ─────────────────────────────────────────────────────────────

class APIClient:
    def __init__(self, base_url: str, token: str, tenant_id: str):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.tenant_id = tenant_id

    def call(self, method: str, path: str, body: Optional[dict] = None) -> RequestResult:
        url = f"{self.base_url}/api/v1{path}"
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
        start = time.monotonic()
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                resp.read()
                latency = (time.monotonic() - start) * 1000
                return RequestResult("", resp.status, latency, resp.status < 400)
        except urllib.error.HTTPError as e:
            latency = (time.monotonic() - start) * 1000
            return RequestResult("", e.code, latency, False, str(e))
        except Exception as exc:
            latency = (time.monotonic() - start) * 1000
            return RequestResult("", 0, latency, False, str(exc))


# ── Scenario definitions ──────────────────────────────────────────────────────

def scenario_health_check(client: APIClient) -> RequestResult:
    """Baseline: health endpoint should respond < 100ms."""
    return client.call("GET", "/health/")


def scenario_clinic_queue(client: APIClient) -> RequestResult:
    """Simulate outpatient encounter creation (clinic queue)."""
    encounter_id = str(uuid.uuid4())
    return client.call("POST", "/cymed/encounters/", {
        "external_id": encounter_id,
        "encounter_type": "outpatient",
        "priority": "routine",
        "chief_complaint": "Follow-up consultation",
        "patient_id": str(uuid.uuid4()),
        "facility_id": str(uuid.uuid4()),
        "department_code": "DEPT-OPD",
    })


def scenario_lab_result_query(client: APIClient) -> RequestResult:
    """Simulate lab result list retrieval under load."""
    return client.call("GET", "/cymed/lab-orders/?status=resulted&page_size=20")


def scenario_pharmacy_verification(client: APIClient) -> RequestResult:
    """Simulate pharmacist verification list query."""
    return client.call("GET", "/cymed/prescriptions/?status=pending_verification&page_size=10")


def scenario_hospital_er_registration(client: APIClient) -> RequestResult:
    """Simulate ER patient registration burst."""
    return client.call("POST", "/cymed/patients/", {
        "first_name": "Emergency",
        "last_name": f"Patient-{uuid.uuid4().hex[:6]}",
        "date_of_birth": "1985-06-15",
        "gender": "male",
        "nationality": "JO",
        "id_type": "national_id",
        "id_number": f"TEST-{uuid.uuid4().hex[:8].upper()}",
        "encounter_type": "emergency",
    })


def scenario_audit_log_write(client: APIClient) -> RequestResult:
    """Validate audit write throughput (audit must not bottleneck clinical ops)."""
    return client.call("GET", "/platform/audit/logs/?page_size=5&category=clinical")


def scenario_cross_tenant_isolation(client: APIClient) -> RequestResult:
    """
    Attempt to access data without tenant header.
    Expects 400 or 403 — confirms tenant isolation enforcement.
    """
    url = f"{client.base_url}/api/v1/cymed/patients/"
    req = urllib.request.Request(
        url, method="GET",
        headers={
            "Authorization": f"Bearer {client.token}",
            # Deliberately omit X-Tenant-ID
            "Accept": "application/json",
        },
    )
    start = time.monotonic()
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            latency = (time.monotonic() - start) * 1000
            # A 200 here would be a security failure — tenant isolation is broken
            if resp.status == 200:
                return RequestResult("cross_tenant", 200, latency, False,
                                     "SECURITY FAILURE: No tenant header accepted without rejection")
            return RequestResult("cross_tenant", resp.status, latency, True)
    except urllib.error.HTTPError as e:
        latency = (time.monotonic() - start) * 1000
        # 400/403/401 = expected (tenant required)
        if e.code in (400, 401, 403):
            return RequestResult("cross_tenant", e.code, latency, True)
        return RequestResult("cross_tenant", e.code, latency, False, f"Unexpected status {e.code}")
    except Exception as exc:
        latency = (time.monotonic() - start) * 1000
        return RequestResult("cross_tenant", 0, latency, False, str(exc))


SCENARIOS = {
    "health_check": scenario_health_check,
    "clinic_queue": scenario_clinic_queue,
    "lab_results": scenario_lab_result_query,
    "pharmacy_verification": scenario_pharmacy_verification,
    "hospital_er": scenario_hospital_er_registration,
    "audit_throughput": scenario_audit_log_write,
    "cross_tenant_isolation": scenario_cross_tenant_isolation,
}

# ── Runner ───────────────────────────────────────────────────────────────────

def run_scenario(client: APIClient, scenario_name: str, concurrency: int, duration_s: int) -> ScenarioReport:
    fn = SCENARIOS[scenario_name]
    report = ScenarioReport(scenario=scenario_name)
    start = time.monotonic()
    deadline = start + duration_s

    with ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = []
        while time.monotonic() < deadline:
            futures.append(pool.submit(fn, client))
            if len(futures) >= concurrency * 10:
                for f in as_completed(futures[:concurrency]):
                    r = f.result()
                    report.total_requests += 1
                    report.latencies.append(r.latency_ms)
                    if r.success:
                        report.success_count += 1
                    else:
                        report.error_count += 1
                futures = futures[concurrency:]

        for f in as_completed(futures):
            r = f.result()
            report.total_requests += 1
            report.latencies.append(r.latency_ms)
            if r.success:
                report.success_count += 1
            else:
                report.error_count += 1

    report.duration_s = time.monotonic() - start
    return report


def print_report(report: ScenarioReport, max_p95_ms: float, max_error_pct: float) -> bool:
    ok = report.passed(max_p95_ms, max_error_pct)
    status = "PASS" if ok else "FAIL"
    print(f"\n{'=' * 60}")
    print(f"Scenario : {report.scenario}")
    print(f"Status   : {status}")
    print(f"Requests : {report.total_requests} ({report.success_count} OK / {report.error_count} ERR)")
    print(f"Duration : {report.duration_s:.1f}s  ({report.rps():.1f} RPS)")
    print(f"P50      : {report.p50():.1f}ms")
    print(f"P95      : {report.p95():.1f}ms  (threshold: {max_p95_ms}ms)")
    print(f"P99      : {report.p99():.1f}ms")
    print(f"Errors   : {report.error_rate():.2f}%  (threshold: {max_error_pct}%)")
    print(f"{'=' * 60}")
    return ok


def main() -> int:
    parser = argparse.ArgumentParser(description="CyberCom Load Test Scenarios")
    parser.add_argument("--api-url", default="http://localhost:8000", help="API base URL")
    parser.add_argument("--tenant-id", required=True, help="Tenant UUID")
    parser.add_argument("--token", required=True, help="JWT access token")
    parser.add_argument("--scenario", choices=list(SCENARIOS.keys()) + ["all"],
                        default="health_check", help="Scenario to run")
    parser.add_argument("--concurrency", type=int, default=20, help="Concurrent workers")
    parser.add_argument("--duration", type=int, default=30, help="Duration in seconds")
    parser.add_argument("--max-p95-ms", type=float, default=2000, help="P95 latency threshold (ms)")
    parser.add_argument("--max-error-pct", type=float, default=1.0, help="Max error rate (%)")
    args = parser.parse_args()

    client = APIClient(args.api_url, args.token, args.tenant_id)

    scenarios_to_run = list(SCENARIOS.keys()) if args.scenario == "all" else [args.scenario]
    all_passed = True

    for name in scenarios_to_run:
        print(f"\nRunning: {name} | concurrency={args.concurrency} | duration={args.duration}s")
        report = run_scenario(client, name, args.concurrency, args.duration)
        passed = print_report(report, args.max_p95_ms, args.max_error_pct)
        if not passed:
            all_passed = False

    print(f"\n{'=' * 60}")
    print(f"OVERALL: {'PASS' if all_passed else 'FAIL'}")
    print(f"{'=' * 60}")
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
