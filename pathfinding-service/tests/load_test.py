"""
Load testing script for the NexusFlow Pathfinding API.

Simulates concurrent requests to validate throughput
and response time under stadium-scale load (50,000+ users).

Usage:
    python tests/load_test.py

Requires the pathfinding-service to be running on localhost:8080.
"""

import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List
from urllib.request import Request, urlopen
from urllib.error import URLError
import json


API_BASE_URL = "http://localhost:8080"
TOTAL_REQUESTS = 200
MAX_WORKERS = 50


def send_route_request() -> float:
    """
    Sends a single POST /route request and returns the response time in ms.
    Raises RuntimeError on non-200 responses.
    """
    payload = json.dumps({
        "start_node": "ENTRANCE_A",
        "end_node": "SEATING_A",
        "accessible_mode": False,
    }).encode("utf-8")

    req = Request(
        f"{API_BASE_URL}/route",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    start = time.perf_counter()
    try:
        with urlopen(req, timeout=10) as response:
            if response.status != 200:
                raise RuntimeError(f"Non-200 status: {response.status}")
    except URLError as exc:
        raise RuntimeError(f"Request failed: {exc}") from exc

    elapsed_ms = (time.perf_counter() - start) * 1000
    return elapsed_ms


def run_load_test() -> None:
    """Executes the load test with concurrent workers and prints a summary."""
    print(f"Running load test: {TOTAL_REQUESTS} requests, {MAX_WORKERS} workers")
    print("-" * 60)

    latencies: List[float] = []
    errors: int = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(send_route_request) for _ in range(TOTAL_REQUESTS)]

        for future in as_completed(futures):
            try:
                latency = future.result()
                latencies.append(latency)
            except RuntimeError:
                errors += 1

    successful = len(latencies)
    print(f"Completed: {successful}/{TOTAL_REQUESTS} successful ({errors} errors)")

    if latencies:
        print(f"  Mean latency:   {statistics.mean(latencies):.1f} ms")
        print(f"  Median latency: {statistics.median(latencies):.1f} ms")
        print(f"  P95 latency:    {sorted(latencies)[int(0.95 * len(latencies))]:.1f} ms")
        print(f"  Max latency:    {max(latencies):.1f} ms")
        print(f"  Throughput:     {successful / (sum(latencies) / 1000):.0f} req/s")


if __name__ == "__main__":
    run_load_test()
