#!/usr/bin/env python3
"""
CyberCom Platform — Production Readiness Validation
Program 10, Phase 6: Operational Readiness

Validates all production readiness criteria:
- API health and response latency
- Database connectivity and migration state
- Celery worker and queue health
- Redis cache connectivity
- Audit trail operational
- License verification active
- Rate limiting enforced
- Security headers present
- Monitoring endpoint (Prometheus) accessible
- Backup agent active (DR validation)

Usage:
    python validate_production_readiness.py \
        --api-url https://api.cy-com.com \
        --token <JWT> \
        --tenant-id <UUID> \
        [--prometheus-url https://metrics.cy-com.com]
"""
import argparse
import json
import sys
import time
import urllib.request
import urllib.error
from typing import Optional


PASS = "PASS"
FAIL = "FAIL"
WARN = "WARN"
SKIP = "SKIP"


class ReadinessChecker:
    def __init__(self, api_url: str, token: str, tenant_id: str,
                 prometheus_url: Optional[str] = None, verbose: bool = False):
        self.api = api_url.rstrip("/")
        self.token = token
        self.tenant_id = tenant_id
        self.prometheus_url = prometheus_url
        self.verbose = verbose
        self.results: list = []

    def _call(self, method: str, url: str, body=None, headers: Optional[dict] = None) -> tuple:
        default_headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Tenant-ID": self.tenant_id,
            "Accept": "application/json",
        }
        if headers:
            default_headers.update(headers)
        if body:
            default_headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode() if body else None
        req = urllib.request.Request(url, data=data, method=method, headers=default_headers)
        start = time.monotonic()
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return resp.status, json.loads(resp.read()), (time.monotonic() - start) * 1000, dict(resp.headers)
        except urllib.error.HTTPError as e:
            try:
                body_text = json.loads(e.read())
            except Exception:
                body_text = {}
            return e.code, body_text, (time.monotonic() - start) * 1000, dict(e.headers)
        except Exception as exc:
            return 0, {"error": str(exc)}, (time.monotonic() - start) * 1000, {}

    def check(self, name: str, status: str, detail: str = "") -> None:
        icons = {PASS: "✓", FAIL: "✗", WARN: "⚠", SKIP: "○"}
        icon = icons.get(status, "?")
        line = f"  {icon} [{status}] {name}"
        if detail and (self.verbose or status in (FAIL, WARN)):
            line += f"\n         → {detail}"
        print(line)
        self.results.append({"name": name, "status": status})

    # ── Health & Connectivity ─────────────────────────────────────────────────

    def check_api_health(self):
        code, body, latency_ms, _ = self._call("GET", f"{self.api}/health/")
        if code == 200:
            db_ok = body.get("database", "ok") in ("ok", True, "connected")
            cache_ok = body.get("cache", "ok") in ("ok", True, "connected")
            self.check("API health endpoint", PASS, f"{latency_ms:.0f}ms")
            self.check("Database connectivity", PASS if db_ok else FAIL,
                       body.get("database", "unknown"))
            self.check("Cache (Redis) connectivity", PASS if cache_ok else FAIL,
                       body.get("cache", "unknown"))
        else:
            self.check("API health endpoint", FAIL, f"HTTP {code}: {json.dumps(body)[:100]}")
            self.check("Database connectivity", SKIP, "Health endpoint failed")
            self.check("Cache (Redis) connectivity", SKIP, "Health endpoint failed")

        if latency_ms > 2000:
            self.check("API health response time (<2s)", FAIL, f"{latency_ms:.0f}ms")
        elif latency_ms > 500:
            self.check("API health response time (<2s)", WARN, f"{latency_ms:.0f}ms — degraded")
        else:
            self.check("API health response time (<2s)", PASS, f"{latency_ms:.0f}ms")

    def check_celery_health(self):
        code, body, _, _ = self._call("GET", f"{self.api}/health/workers/")
        if code == 200:
            workers = body.get("workers", {})
            active = sum(1 for w in workers.values() if isinstance(w, list))
            self.check("Celery workers active", PASS if active > 0 else FAIL,
                       f"{active} worker(s) active")
        elif code == 404:
            self.check("Celery workers active", SKIP, "Worker health endpoint not found")
        else:
            self.check("Celery workers active", WARN, f"HTTP {code}")

    def check_migration_state(self):
        code, body, _, _ = self._call("GET", f"{self.api}/health/migrations/")
        if code == 200:
            pending = body.get("pending_migrations", 0)
            if pending == 0:
                self.check("Database migrations", PASS, "All migrations applied")
            else:
                self.check("Database migrations", FAIL, f"{pending} pending migrations")
        elif code == 404:
            self.check("Database migrations", SKIP, "Migration health endpoint not exposed")
        else:
            self.check("Database migrations", WARN, f"HTTP {code}")

    # ── Security ──────────────────────────────────────────────────────────────

    def check_security_headers(self):
        code, _, _, headers = self._call("GET", f"{self.api}/health/")
        required_headers = {
            "Strict-Transport-Security": "HSTS",
            "X-Content-Type-Options": "X-Content-Type-Options",
            "X-Frame-Options": "X-Frame-Options",
            "Content-Security-Policy": "CSP",
        }
        for header, label in required_headers.items():
            present = any(k.lower() == header.lower() for k in headers)
            self.check(f"Security header: {label}", PASS if present else WARN,
                       f"{'present' if present else 'missing — add in reverse proxy config'}")

    def check_rate_limiting(self):
        """Verify rate limiting triggers after burst."""
        url = f"{self.api}/api/v1/cymed/patients/"
        burst_headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Tenant-ID": self.tenant_id,
            "Accept": "application/json",
        }
        rate_limit_triggered = False
        for _ in range(15):
            try:
                req = urllib.request.Request(url, method="GET", headers=burst_headers)
                with urllib.request.urlopen(req, timeout=5) as resp:
                    if resp.status == 429:
                        rate_limit_triggered = True
                        break
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    rate_limit_triggered = True
                    break
            except Exception:
                break
        self.check("Rate limiting (429 on burst)", PASS if rate_limit_triggered else WARN,
                   "Triggered" if rate_limit_triggered else "Not triggered in 15 requests — verify rate_limit.py config")

    def check_tenant_isolation_enforced(self):
        """Request without tenant header must be rejected."""
        url = f"{self.api}/api/v1/cymed/patients/"
        req = urllib.request.Request(
            url, method="GET",
            headers={"Authorization": f"Bearer {self.token}", "Accept": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    self.check("Tenant isolation enforcement", FAIL,
                               "CRITICAL: API accepted request without X-Tenant-ID header")
                else:
                    self.check("Tenant isolation enforcement", PASS, f"HTTP {resp.status}")
        except urllib.error.HTTPError as e:
            if e.code in (400, 401, 403):
                self.check("Tenant isolation enforcement", PASS, f"HTTP {e.code} (correct)")
            else:
                self.check("Tenant isolation enforcement", WARN, f"HTTP {e.code}")
        except Exception as exc:
            self.check("Tenant isolation enforcement", WARN, str(exc))

    def check_audit_trail(self):
        code, body, _, _ = self._call("GET", f"{self.api}/api/v1/platform/audit/logs/?page_size=1")
        if code == 200:
            count = body.get("count", 0)
            self.check("Audit trail operational", PASS, f"{count} total entries")
        elif code == 403:
            self.check("Audit trail operational", WARN, "Access denied — verify admin role")
        else:
            self.check("Audit trail operational", FAIL, f"HTTP {code}")

    # ── Commercial ────────────────────────────────────────────────────────────

    def check_license_active(self):
        code, body, _, _ = self._call(
            "GET", f"{self.api}/api/v1/commercial-readiness/licenses/?status=active"
        )
        if code == 200:
            count = body.get("count", 0)
            self.check("Active license present", PASS if count > 0 else FAIL,
                       f"{count} active license(s)")
        else:
            self.check("Active license present", WARN, f"HTTP {code}")

    # ── Observability ─────────────────────────────────────────────────────────

    def check_prometheus_metrics(self):
        if not self.prometheus_url:
            self.check("Prometheus metrics endpoint", SKIP, "--prometheus-url not provided")
            return
        url = f"{self.prometheus_url}/metrics"
        req = urllib.request.Request(url, method="GET", headers={"Accept": "text/plain"})
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                body = resp.read().decode()
                has_django = "django_" in body
                has_gunicorn = "gunicorn_" in body
                self.check("Prometheus /metrics accessible", PASS)
                self.check("Django metrics exported", PASS if has_django else WARN,
                           "django_* metrics present" if has_django else "No django_* metrics found")
                self.check("Gunicorn metrics exported", PASS if has_gunicorn else WARN,
                           "gunicorn_* metrics present" if has_gunicorn else "No gunicorn_* metrics")
        except Exception as exc:
            self.check("Prometheus /metrics accessible", FAIL, str(exc))

    def check_backup_agent(self):
        code, body, _, _ = self._call("GET", f"{self.api}/health/backup/")
        if code == 200:
            last_backup = body.get("last_backup_at", "unknown")
            self.check("Backup agent active", PASS, f"Last backup: {last_backup}")
        elif code == 404:
            self.check("Backup agent active", SKIP, "Backup health endpoint not exposed")
        else:
            self.check("Backup agent active", WARN, f"HTTP {code}")

    # ── Run All ───────────────────────────────────────────────────────────────

    def run(self) -> bool:
        print("\n=== CyberCom Production Readiness Validation ===\n")

        print("[ Health & Connectivity ]")
        self.check_api_health()
        self.check_celery_health()
        self.check_migration_state()

        print("\n[ Security ]")
        self.check_security_headers()
        self.check_rate_limiting()
        self.check_tenant_isolation_enforced()
        self.check_audit_trail()

        print("\n[ Commercial ]")
        self.check_license_active()

        print("\n[ Observability ]")
        self.check_prometheus_metrics()
        self.check_backup_agent()

        total = len(self.results)
        passed = sum(1 for r in self.results if r["status"] == PASS)
        warned = sum(1 for r in self.results if r["status"] == WARN)
        failed = sum(1 for r in self.results if r["status"] == FAIL)
        skipped = sum(1 for r in self.results if r["status"] == SKIP)

        print(f"\n{'=' * 60}")
        print(f"  Production Readiness: {passed}/{total} passed")
        print(f"  Warnings: {warned}  |  Failures: {failed}  |  Skipped: {skipped}")
        if failed == 0 and warned == 0:
            print(f"\n  ✓ READY FOR PRODUCTION DEPLOYMENT")
        elif failed == 0:
            print(f"\n  ⚠ CONDITIONALLY READY — resolve {warned} warning(s) before go-live")
        else:
            print(f"\n  ✗ NOT READY — resolve {failed} failure(s) before go-live")
        print(f"{'=' * 60}")
        return failed == 0


def main() -> int:
    parser = argparse.ArgumentParser(description="CyberCom Production Readiness Validation")
    parser.add_argument("--api-url", default="http://localhost:8000")
    parser.add_argument("--token", required=True)
    parser.add_argument("--tenant-id", required=True)
    parser.add_argument("--prometheus-url")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    checker = ReadinessChecker(
        args.api_url, args.token, args.tenant_id, args.prometheus_url, args.verbose
    )
    passed = checker.run()
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
