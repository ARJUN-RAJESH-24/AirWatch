#!/usr/bin/env python3
"""
AirWatch Performance Benchmarking Suite
Evaluates API throughput, latency distribution (mean, p50, p95, p99),
concurrency scaling, and database query efficiency against genuine CPCB datasets.
"""

import argparse
import json
import statistics
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib.request
import urllib.error

ENDPOINTS = [
    ("Health Baseline", "/health"),
    ("System Metadata", "/api/v1/metadata"),
    ("Data Telemetry Status", "/api/v1/data-status"),
    ("Kerala Stations Directory", "/api/v1/stations?state=Kerala"),
    ("Paginated Observations", "/api/v1/observations?limit=50"),
    ("Kerala PM2.5 Trends", "/api/v1/analytics/trends?pollutant=PM2.5&station_code=KL008"),
    ("NAAQS Exceedance Analysis", "/api/v1/analytics/exceedances?state=Kerala"),
]

def make_request(base_url: str, path: str):
    url = f"{base_url.rstrip('/')}{path}"
    start = time.perf_counter()
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "AirWatch-Benchmark/1.0", "Accept": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            return True, resp.status, elapsed_ms, len(data)
    except Exception as e:
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        return False, getattr(e, 'code', 500), elapsed_ms, 0

def run_benchmark_for_endpoint(base_url: str, label: str, path: str, concurrency: int, total_requests: int):
    latencies = []
    success_count = 0
    fail_count = 0
    total_bytes = 0

    wall_start = time.perf_counter()

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(make_request, base_url, path) for _ in range(total_requests)]
        for f in as_completed(futures):
            ok, status, latency_ms, size_bytes = f.result()
            latencies.append(latency_ms)
            total_bytes += size_bytes
            if ok and status == 200:
                success_count += 1
            else:
                fail_count += 1

    wall_time = time.perf_counter() - wall_start
    rps = total_requests / wall_time if wall_time > 0 else 0
    latencies.sort()

    mean_lat = statistics.mean(latencies) if latencies else 0
    p50_lat = statistics.median(latencies) if latencies else 0
    p95_idx = int(len(latencies) * 0.95)
    p99_idx = int(len(latencies) * 0.99)
    p95_lat = latencies[min(p95_idx, len(latencies) - 1)] if latencies else 0
    p99_lat = latencies[min(p99_idx, len(latencies) - 1)] if latencies else 0

    return {
        "label": label,
        "path": path,
        "concurrency": concurrency,
        "total_requests": total_requests,
        "success_count": success_count,
        "fail_count": fail_count,
        "error_rate_pct": round((fail_count / total_requests) * 100.0, 2),
        "wall_time_sec": round(wall_time, 3),
        "requests_per_sec": round(rps, 1),
        "mean_latency_ms": round(mean_lat, 2),
        "p50_latency_ms": round(p50_lat, 2),
        "p95_latency_ms": round(p95_lat, 2),
        "p99_latency_ms": round(p99_lat, 2),
        "min_latency_ms": round(min(latencies), 2) if latencies else 0,
        "max_latency_ms": round(max(latencies), 2) if latencies else 0,
        "total_payload_kb": round(total_bytes / 1024.0, 1),
    }

def main():
    parser = argparse.ArgumentParser(description="AirWatch Performance Benchmark Suite")
    parser.add_argument("--url", default="http://localhost:3001", help="Base URL of Axum backend")
    parser.add_argument("--concurrency", type=int, default=10, help="Concurrent workers")
    parser.add_argument("--requests", type=int, default=50, help="Requests per endpoint")
    parser.add_argument("--output", default="benchmark_results.json", help="Output JSON path")
    args = parser.parse_args()

    print("================================================================================")
    print("             AirWatch Production Performance & Load Benchmark Suite            ")
    print("================================================================================")
    print(f"Target Server : {args.url}")
    print(f"Concurrency   : {args.concurrency} concurrent client threads")
    print(f"Requests/Path : {args.requests} requests")
    print("--------------------------------------------------------------------------------")

    results = []
    print(f"{'Endpoint':<28} | {'RPS':>7} | {'Mean (ms)':>9} | {'p95 (ms)':>9} | {'p99 (ms)':>9} | {'Errors':>7}")
    print("-" * 80)

    for label, path in ENDPOINTS:
        res = run_benchmark_for_endpoint(args.url, label, path, args.concurrency, args.requests)
        results.append(res)
        print(f"{label:<28} | {res['requests_per_sec']:>7.1f} | {res['mean_latency_ms']:>9.2f} | {res['p95_latency_ms']:>9.2f} | {res['p99_latency_ms']:>9.2f} | {res['error_rate_pct']:>6.1f}%")

    print("-" * 80)
    print(f"Saving structured experiment results to {args.output}...")
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            "base_url": args.url,
            "concurrency": args.concurrency,
            "requests_per_endpoint": args.requests,
            "results": results
        }, f, indent=2)

    print("Benchmark run complete successfully.")

if __name__ == "__main__":
    main()
