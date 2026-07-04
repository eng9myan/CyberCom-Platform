#!/usr/bin/env python3
"""
CyberCom Load & Concurrency Benchmark Runner
Executes concurrent request loads against APIs and measures response times.

Usage:
    python benchmark.py --url http://localhost:8000/health --concurrency 20 --requests 200
"""
import argparse
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor


def run_request(url: str, headers: dict) -> float:
    req = urllib.request.Request(url, headers=headers)
    start_time = time.monotonic()
    try:
        with urllib.request.urlopen(req) as resp:
            resp.read()
            return time.monotonic() - start_time
    except urllib.error.HTTPError as e:
        return time.monotonic() - start_time
    except Exception:
        return -1.0


def main():
    parser = argparse.ArgumentParser(description="CyberCom Performance Benchmark")
    parser.add_argument("--url", default="http://localhost:8000/health", help="API URL to test")
    parser.add_argument("--concurrency", type=int, default=10, help="Number of concurrent threads")
    parser.add_argument("--requests", type=int, default=100, help="Total requests to execute")
    parser.add_argument("--token", default="", help="Optional JWT auth token")
    args = parser.parse_args()

    headers = {
        "User-Agent": "CyberCom-Benchmark/1.0",
    }
    if args.token:
        headers["Authorization"] = f"Bearer {args.token}"

    print(f"==========================================================")
    print(f" Starting CyberCom Performance Benchmarks")
    print(f" Target URL:   {args.url}")
    print(f" Concurrency:  {args.concurrency}")
    print(f" Total Load:   {args.requests} requests")
    print(f"==========================================================")

    latencies = []
    failed_requests = 0

    start_wall = time.monotonic()
    with ThreadPoolExecutor(max_workers=args.concurrency) as executor:
        futures = [executor.submit(run_request, args.url, headers) for _ in range(args.requests)]
        for fut in futures:
            latency = fut.result()
            if latency < 0:
                failed_requests += 1
            else:
                latencies.append(latency)
    total_time = time.monotonic() - start_wall

    if not latencies:
        print("Error: All benchmark requests failed.")
        return

    latencies.sort()
    count = len(latencies)
    avg_latency = sum(latencies) / count
    p50 = latencies[int(count * 0.50)]
    p90 = latencies[int(count * 0.90)]
    p95 = latencies[int(count * 0.95)]
    p99 = latencies[int(count * 0.99)]
    rps = count / total_time

    print(f"\nResults:")
    print(f"  Requests/sec (RPS):  {rps:.2f}")
    print(f"  Total Duration:      {total_time:.3f} seconds")
    print(f"  Success Count:       {count}/{args.requests}")
    print(f"  Failed Count:        {failed_requests}")
    print(f"\nLatency Percentiles:")
    print(f"  Average:             {avg_latency * 1000:.2f} ms")
    print(f"  50th Percentile:     {p50 * 1000:.2f} ms")
    print(f"  90th Percentile:     {p90 * 1000:.2f} ms")
    print(f"  95th Percentile:     {p95 * 1000:.2f} ms")
    print(f"  99th Percentile:     {p99 * 1000:.2f} ms")
    print(f"==========================================================")


if __name__ == "__main__":
    main()
