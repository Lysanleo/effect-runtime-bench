import autocannon from "autocannon";
import { spawn, type Subprocess } from "bun";
import type {
	BenchmarkResult,
	EndpointConfig,
	BenchmarkReport,
	ServerSummary,
} from "./types";
import { CONNECTIONS, DURATION, PIPELINING, RESULTS_FILE } from "./constants";

export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const waitForServer = async (
	port: number,
	maxAttempts = 50,
): Promise<boolean> => {
	for (let i = 0; i < maxAttempts; i++) {
		try {
			const response = await fetch(`http://localhost:${port}/api/data`);
			if (response.ok) return true;
		} catch {
			await sleep(500);
		}
	}
	return false;
};

export const startServer = async (
	name: string,
	script: string,
	port: number,
): Promise<Subprocess> => {
	console.log(`\nStarting ${name} server on port ${port}...`);

	const proc = spawn({
		cmd: ["bun", "run", script],
		cwd: process.cwd(),
		stdout: "inherit",
		stderr: "inherit",
	});

	const ready = await waitForServer(port);
	if (!ready) {
		proc.kill();
		throw new Error(`${name} server failed to start`);
	}

	console.log(`${name} server ready!\n`);
	return proc;
};

export const stopServer = (proc: Subprocess) => {
	proc.kill();
};

export const runBenchmark = async (
	server: string,
	port: number,
	config: EndpointConfig,
): Promise<BenchmarkResult> => {
	const url = `http://localhost:${port}${config.endpoint}`;

	const options: autocannon.Options = {
		url,
		connections: CONNECTIONS,
		duration: DURATION,
		pipelining: PIPELINING,
		method: config.method,
		headers: {
			"Content-Type": "application/json",
			Cookie:
				"sessionId=sess_benchmark_test; trackingId=track_benchmark_test; userId=12345",
			...config.headers,
		},
	};

	if (config.method === "POST" && config.body) {
		options.body = JSON.stringify(config.body);
	}

	console.log(`  Running ${config.method} ${config.endpoint}...`);

	const result = await autocannon(options);

	return {
		server,
		endpoint: config.endpoint,
		method: config.method,
		requestsPerSecond: result.requests.average,
		requestsPerMinute: result.requests.average * 60,
		latencyP50: result.latency.p50,
		latencyP99: result.latency.p99,
		latencyMax: result.latency.max,
		totalRequests: result.requests.total,
		throughput: result.throughput.average,
		errors: result.errors,
		timeouts: result.timeouts,
	};
};

export const formatBytes = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} B/s`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB/s`;
};

const calculateServerSummary = (results: BenchmarkResult[]): ServerSummary => {
	const getResults = results.filter((r) => r.method === "GET");
	const postResults = results.filter((r) => r.method === "POST");

	const getTotal = getResults.reduce((sum, r) => sum + r.requestsPerSecond, 0);
	const postTotal = postResults.reduce(
		(sum, r) => sum + r.requestsPerSecond,
		0,
	);

	return {
		totalReqSec: getTotal + postTotal,
		totalThroughput: results.reduce((sum, r) => sum + r.throughput, 0),
		avgP99: results.reduce((sum, r) => sum + r.latencyP99, 0) / results.length,
		totalErrors: results.reduce((sum, r) => sum + r.errors + r.timeouts, 0),
		get: {
			totalReqSec: getTotal,
			avgReqSec: getTotal / getResults.length,
			avgP99:
				getResults.reduce((sum, r) => sum + r.latencyP99, 0) /
				getResults.length,
		},
		post: {
			totalReqSec: postTotal,
			avgReqSec: postTotal / postResults.length,
			avgP99:
				postResults.reduce((sum, r) => sum + r.latencyP99, 0) /
				postResults.length,
		},
	};
};

export const createReport = (
	results: BenchmarkResult[],
	endpointCount: number,
): BenchmarkReport => {
	const effectResults = results.filter((r) => r.server === "Effect");
	const elysiaResults = results.filter((r) => r.server === "Elysia");

	const effectSummary = calculateServerSummary(effectResults);
	const elysiaSummary = calculateServerSummary(elysiaResults);

	const overallWinner =
		effectSummary.totalReqSec > elysiaSummary.totalReqSec ? "Effect" : "Elysia";
	const overallDiff = Math.abs(
		((effectSummary.totalReqSec - elysiaSummary.totalReqSec) /
			Math.min(effectSummary.totalReqSec, elysiaSummary.totalReqSec)) *
			100,
	);

	const latencyWinner =
		effectSummary.avgP99 < elysiaSummary.avgP99 ? "Effect" : "Elysia";
	const latencyDiff = Math.abs(
		((effectSummary.avgP99 - elysiaSummary.avgP99) /
			Math.max(effectSummary.avgP99, elysiaSummary.avgP99)) *
			100,
	);

	return {
		timestamp: new Date().toISOString(),
		config: {
			duration: DURATION,
			connections: CONNECTIONS,
			pipelining: PIPELINING,
			endpointCount,
		},
		results,
		summary: {
			effect: effectSummary,
			elysia: elysiaSummary,
			winner: {
				overall: overallWinner,
				latency: latencyWinner,
				overallDiff,
				latencyDiff,
			},
		},
	};
};

export const saveReport = async (report: BenchmarkReport): Promise<void> => {
	await Bun.write(RESULTS_FILE, JSON.stringify(report, null, 2));
	console.log(`\n📁 Results saved to ${RESULTS_FILE}`);
};

export const loadReport = async (): Promise<BenchmarkReport | null> => {
	try {
		const file = Bun.file(RESULTS_FILE);
		if (await file.exists()) {
			return await file.json();
		}
	} catch {
		return null;
	}
	return null;
};

export const printResults = (report: BenchmarkReport) => {
	const { results, summary, config } = report;

	console.log("\n" + "=".repeat(140));
	console.log("BENCHMARK RESULTS - ALL ENDPOINTS (STRESS TEST MODE)");
	console.log("=".repeat(140));
	console.log(`📅 Run: ${new Date(report.timestamp).toLocaleString()}`);

	console.log(
		"\n┌─────────────┬──────────┬─────────────────────────────────┬────────────┬────────────┬────────────┬────────────┬────────┐",
	);
	console.log(
		"│ Server      │ Method   │ Endpoint                        │ Req/sec    │ p50 (ms)   │ p99 (ms)   │ Throughput │ Errors │",
	);
	console.log(
		"├─────────────┼──────────┼─────────────────────────────────┼────────────┼────────────┼────────────┼────────────┼────────┤",
	);

	for (const r of results) {
		const errors = r.errors + r.timeouts;
		console.log(
			`│ ${r.server.padEnd(11)} │ ${r.method.padEnd(8)} │ ${r.endpoint.slice(0, 31).padEnd(31)} │ ${r.requestsPerSecond.toFixed(0).padStart(10)} │ ${r.latencyP50.toFixed(0).padStart(10)} │ ${r.latencyP99.toFixed(0).padStart(10)} │ ${formatBytes(r.throughput).padStart(10)} │ ${String(errors).padStart(6)} │`,
		);
	}

	console.log(
		"└─────────────┴──────────┴─────────────────────────────────┴────────────┴────────────┴────────────┴────────────┴────────┘",
	);

	console.log("\n" + "=".repeat(140));
	console.log("SUMMARY BY ENDPOINT TYPE");
	console.log("=".repeat(140));

	const effectGetResults = results.filter(
		(r) => r.server === "Effect" && r.method === "GET",
	);
	const effectPostResults = results.filter(
		(r) => r.server === "Effect" && r.method === "POST",
	);

	console.log(`\nGET Endpoints (${effectGetResults.length} endpoints):`);
	console.log(
		`  Effect:  ${summary.effect.get.totalReqSec.toFixed(0).padStart(8)} total req/sec | ${summary.effect.get.avgReqSec.toFixed(0).padStart(6)} avg/endpoint | p99: ${summary.effect.get.avgP99.toFixed(0)}ms`,
	);
	console.log(
		`  Elysia:  ${summary.elysia.get.totalReqSec.toFixed(0).padStart(8)} total req/sec | ${summary.elysia.get.avgReqSec.toFixed(0).padStart(6)} avg/endpoint | p99: ${summary.elysia.get.avgP99.toFixed(0)}ms`,
	);
	const getWinner =
		summary.effect.get.totalReqSec > summary.elysia.get.totalReqSec
			? "Effect"
			: "Elysia";
	const getDiff = Math.abs(
		((summary.effect.get.totalReqSec - summary.elysia.get.totalReqSec) /
			Math.min(
				summary.effect.get.totalReqSec,
				summary.elysia.get.totalReqSec,
			)) *
			100,
	);
	console.log(`  Winner: ${getWinner} (+${getDiff.toFixed(1)}%)`);

	console.log(`\nPOST Endpoints (${effectPostResults.length} endpoints):`);
	console.log(
		`  Effect:  ${summary.effect.post.totalReqSec.toFixed(0).padStart(8)} total req/sec | ${summary.effect.post.avgReqSec.toFixed(0).padStart(6)} avg/endpoint | p99: ${summary.effect.post.avgP99.toFixed(0)}ms`,
	);
	console.log(
		`  Elysia:  ${summary.elysia.post.totalReqSec.toFixed(0).padStart(8)} total req/sec | ${summary.elysia.post.avgReqSec.toFixed(0).padStart(6)} avg/endpoint | p99: ${summary.elysia.post.avgP99.toFixed(0)}ms`,
	);
	const postWinner =
		summary.effect.post.totalReqSec > summary.elysia.post.totalReqSec
			? "Effect"
			: "Elysia";
	const postDiff = Math.abs(
		((summary.effect.post.totalReqSec - summary.elysia.post.totalReqSec) /
			Math.min(
				summary.effect.post.totalReqSec,
				summary.elysia.post.totalReqSec,
			)) *
			100,
	);
	console.log(`  Winner: ${postWinner} (+${postDiff.toFixed(1)}%)`);

	console.log("\n" + "=".repeat(140));
	console.log("OVERALL SUMMARY");
	console.log("=".repeat(140));

	console.log(
		`\nCombined throughput (${config.endpointCount} endpoints hammered simultaneously):`,
	);
	console.log(
		`  Effect:  ${summary.effect.totalReqSec.toFixed(0).padStart(8)} req/sec | ${formatBytes(summary.effect.totalThroughput).padStart(12)} | avg p99: ${summary.effect.avgP99.toFixed(0)}ms | ${summary.effect.totalErrors} errors`,
	);
	console.log(
		`  Elysia:  ${summary.elysia.totalReqSec.toFixed(0).padStart(8)} req/sec | ${formatBytes(summary.elysia.totalThroughput).padStart(12)} | avg p99: ${summary.elysia.avgP99.toFixed(0)}ms | ${summary.elysia.totalErrors} errors`,
	);

	console.log(
		`\n  🏆 OVERALL WINNER: ${summary.winner.overall} (+${summary.winner.overallDiff.toFixed(1)}%)`,
	);
	console.log(
		`  ⚡ LATENCY WINNER: ${summary.winner.latency} (${summary.winner.latencyDiff.toFixed(1)}% lower p99)`,
	);

	console.log("\n" + "=".repeat(140));
};
