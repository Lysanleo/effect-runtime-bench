import { describe, expect, test } from "bun:test";
import { createReport } from "./utils";
import type { BenchmarkResult } from "./types";

const result = (
	server: string,
	method: "GET" | "POST",
	requestsPerSecond: number,
	latencyP50: number,
	latencyP90: number,
	latencyP99: number,
): BenchmarkResult => ({
	server,
	endpoint: method === "GET" ? "/api/data" : "/api/submit",
	method,
	requestsPerSecond,
	requestsPerMinute: requestsPerSecond * 60,
	latencyP50,
	latencyP90,
	latencyP99,
	latencyMax: latencyP99,
	totalRequests: requestsPerSecond * 10,
	throughput: 1024,
	errors: 0,
	timeouts: 0,
});

describe("createReport", () => {
	test("summarizes p50, p90, and p99 latency by server", () => {
		const report = createReport(
			[
				result("A", "GET", 100, 10, 20, 30),
				result("A", "POST", 200, 30, 40, 50),
			],
			2,
			1000,
		);

		expect(report.summary.servers.A.avgP50).toBe(20);
		expect(report.summary.servers.A.avgP90).toBe(30);
		expect(report.summary.servers.A.avgP99).toBe(40);
		expect(report.summary.servers.A.get.avgP90).toBe(20);
		expect(report.summary.servers.A.post.avgP90).toBe(40);
	});
});
