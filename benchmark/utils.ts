import autocannon from "autocannon";
import { spawn, type Subprocess } from "bun";
import type {
	BenchmarkResult,
	EndpointConfig,
	BenchmarkReport,
	ServerSummary,
	ServerConfig,
} from "./types";
import { DURATION, PIPELINING, RESULTS_FILE } from "./constants";

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
	server: ServerConfig,
): Promise<Subprocess> => {
	console.log(`\nStarting ${server.name} server on port ${server.port}...`);

	const proc = spawn({
		cmd: server.command,
		cwd: process.cwd(),
		stdout: "inherit",
		stderr: "inherit",
	});

	const ready = await waitForServer(server.port);
	if (!ready) {
		proc.kill();
		throw new Error(`${server.name} server failed to start`);
	}

	console.log(`${server.name} server ready!\n`);
	return proc;
};

export const stopServer = (proc: Subprocess) => {
	proc.kill();
};

export const runBenchmark = async (
	server: string,
	port: number,
	config: EndpointConfig,
	connections: number,
): Promise<BenchmarkResult> => {
	const url = `http://localhost:${port}${config.endpoint}`;

	const options: autocannon.Options = {
		url,
		connections,
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
		latencyP90: result.latency.p90,
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
		avgP50: results.reduce((sum, r) => sum + r.latencyP50, 0) / results.length,
		avgP90: results.reduce((sum, r) => sum + r.latencyP90, 0) / results.length,
		avgP99: results.reduce((sum, r) => sum + r.latencyP99, 0) / results.length,
		totalErrors: results.reduce((sum, r) => sum + r.errors + r.timeouts, 0),
		get: {
			totalReqSec: getTotal,
			avgReqSec: getTotal / getResults.length,
			avgP50:
				getResults.reduce((sum, r) => sum + r.latencyP50, 0) /
				getResults.length,
			avgP90:
				getResults.reduce((sum, r) => sum + r.latencyP90, 0) /
				getResults.length,
			avgP99:
				getResults.reduce((sum, r) => sum + r.latencyP99, 0) /
				getResults.length,
		},
		post: {
			totalReqSec: postTotal,
			avgReqSec: postTotal / postResults.length,
			avgP50:
				postResults.reduce((sum, r) => sum + r.latencyP50, 0) /
				postResults.length,
			avgP90:
				postResults.reduce((sum, r) => sum + r.latencyP90, 0) /
				postResults.length,
			avgP99:
				postResults.reduce((sum, r) => sum + r.latencyP99, 0) /
				postResults.length,
		},
	};
};

const getBestBy = (
	summaries: Record<string, ServerSummary>,
	select: (summary: ServerSummary) => number,
	direction: "max" | "min",
) => {
	const ranked = Object.entries(summaries).sort((a, b) =>
		direction === "max"
			? select(b[1]) - select(a[1])
			: select(a[1]) - select(b[1]),
	);

	const [winnerName, winnerSummary] = ranked[0];
	const runnerUpSummary = ranked[1]?.[1] ?? winnerSummary;
	const winnerValue = select(winnerSummary);
	const runnerUpValue = select(runnerUpSummary);
	const denominator =
		direction === "max"
			? Math.min(winnerValue, runnerUpValue)
			: Math.max(winnerValue, runnerUpValue);

	return {
		name: winnerName,
		diff:
			denominator === 0
				? 0
				: Math.abs(((winnerValue - runnerUpValue) / denominator) * 100),
	};
};

export const createReport = (
	results: BenchmarkResult[],
	endpointCount: number,
	connections: number,
): BenchmarkReport => {
	const serverNames = [...new Set(results.map((r) => r.server))];
	const servers = Object.fromEntries(
		serverNames.map((server) => [
			server,
			calculateServerSummary(results.filter((r) => r.server === server)),
		]),
	);
	const overall = getBestBy(servers, (summary) => summary.totalReqSec, "max");
	const latency = getBestBy(servers, (summary) => summary.avgP99, "min");

	return {
		timestamp: new Date().toISOString(),
		config: {
			duration: DURATION,
			connections,
			totalConnections: connections * endpointCount,
			pipelining: PIPELINING,
			endpointCount,
		},
		results,
		summary: {
			servers,
			winner: {
				overall: overall.name,
				latency: latency.name,
				overallDiff: overall.diff,
				latencyDiff: latency.diff,
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

	const serverSummaries = Object.entries(summary.servers);
	const getEndpointCount = results.filter(
		(r) => r.server === serverSummaries[0]?.[0] && r.method === "GET",
	).length;
	const postEndpointCount = results.filter(
		(r) => r.server === serverSummaries[0]?.[0] && r.method === "POST",
	).length;

	console.log(`\nGET Endpoints (${getEndpointCount} endpoints):`);
	for (const [server, serverSummary] of serverSummaries) {
		console.log(
			`  ${server.padEnd(7)} ${serverSummary.get.totalReqSec.toFixed(0).padStart(8)} total req/sec | ${serverSummary.get.avgReqSec.toFixed(0).padStart(6)} avg/endpoint | p99: ${serverSummary.get.avgP99.toFixed(0)}ms`,
		);
	}
	const getWinner = getBestBy(summary.servers, (s) => s.get.totalReqSec, "max");
	console.log(`  Winner: ${getWinner.name} (+${getWinner.diff.toFixed(1)}%)`);

	console.log(`\nPOST Endpoints (${postEndpointCount} endpoints):`);
	for (const [server, serverSummary] of serverSummaries) {
		console.log(
			`  ${server.padEnd(7)} ${serverSummary.post.totalReqSec.toFixed(0).padStart(8)} total req/sec | ${serverSummary.post.avgReqSec.toFixed(0).padStart(6)} avg/endpoint | p99: ${serverSummary.post.avgP99.toFixed(0)}ms`,
		);
	}
	const postWinner = getBestBy(
		summary.servers,
		(s) => s.post.totalReqSec,
		"max",
	);
	console.log(`  Winner: ${postWinner.name} (+${postWinner.diff.toFixed(1)}%)`);

	console.log("\n" + "=".repeat(140));
	console.log("OVERALL SUMMARY");
	console.log("=".repeat(140));

	console.log(
		`\nCombined throughput (${config.endpointCount} endpoints hammered simultaneously):`,
	);
	console.log(
		"┌───────────────────────────┬────────────┬────────┬────────┬────────┬────────┐",
	);
	console.log(
		"│ Target                    │ Req/s      │ p50    │ p90    │ p99    │ Errors │",
	);
	console.log(
		"├───────────────────────────┼────────────┼────────┼────────┼────────┼────────┤",
	);
	for (const [server, serverSummary] of serverSummaries) {
		console.log(
			`│ ${server.slice(0, 25).padEnd(25)} │ ${serverSummary.totalReqSec.toFixed(0).padStart(10)} │ ${`${serverSummary.avgP50.toFixed(0)}ms`.padStart(6)} │ ${`${serverSummary.avgP90.toFixed(0)}ms`.padStart(6)} │ ${`${serverSummary.avgP99.toFixed(0)}ms`.padStart(6)} │ ${String(serverSummary.totalErrors).padStart(6)} │`,
		);
	}
	console.log(
		"└───────────────────────────┴────────────┴────────┴────────┴────────┴────────┘",
	);

	console.log(
		`\n  🏆 OVERALL WINNER: ${summary.winner.overall} (+${summary.winner.overallDiff.toFixed(1)}%)`,
	);
	console.log(
		`  ⚡ LATENCY WINNER: ${summary.winner.latency} (${summary.winner.latencyDiff.toFixed(1)}% lower p99)`,
	);

	console.log("\n" + "=".repeat(140));
};
