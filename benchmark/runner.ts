import autocannon from "autocannon";
import { spawn, type Subprocess } from "bun";

interface BenchmarkResult {
	server: string;
	endpoint: string;
	method: string;
	requestsPerSecond: number;
	requestsPerMinute: number;
	latencyP50: number;
	latencyP99: number;
	totalRequests: number;
	errors: number;
}

interface EndpointConfig {
	endpoint: string;
	method: "GET" | "POST";
	body?: object;
}

const DURATION = 10;
const CONNECTIONS = 100;

const EFFECT_PORT = 3000;
const ELYSIA_PORT = 3001;

const ENDPOINTS: EndpointConfig[] = [
	{ endpoint: "/api/data", method: "GET" },
	{ endpoint: "/api/users", method: "GET" },
	{ endpoint: "/api/products", method: "GET" },
	{ endpoint: "/api/stats", method: "GET" },
	{
		endpoint: "/api/submit",
		method: "POST",
		body: { data: "benchmark-payload" },
	},
	{
		endpoint: "/api/users",
		method: "POST",
		body: { name: "Test User", email: "test@example.com" },
	},
	{
		endpoint: "/api/orders",
		method: "POST",
		body: { productId: 1, quantity: 5 },
	},
	{
		endpoint: "/api/process",
		method: "POST",
		body: { items: ["item1", "item2", "item3"] },
	},
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForServer = async (
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

const runBenchmark = async (
	server: string,
	port: number,
	config: EndpointConfig,
): Promise<BenchmarkResult> => {
	const url = `http://localhost:${port}${config.endpoint}`;

	const options: autocannon.Options = {
		url,
		connections: CONNECTIONS,
		duration: DURATION,
		method: config.method,
		headers: {
			"Content-Type": "application/json",
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
		totalRequests: result.requests.total,
		errors: result.errors,
	};
};

const startServer = async (
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

const stopServer = (proc: Subprocess) => {
	proc.kill();
};

const printResults = (results: BenchmarkResult[]) => {
	console.log("\n" + "=".repeat(110));
	console.log("BENCHMARK RESULTS - ALL ENDPOINTS");
	console.log("=".repeat(110));

	const effectResults = results.filter((r) => r.server === "Effect");
	const elysiaResults = results.filter((r) => r.server === "Elysia");

	console.log(
		"\n┌─────────────┬──────────┬────────────────┬────────────────┬────────────┬────────────┬──────────────┬────────┐",
	);
	console.log(
		"│ Server      │ Method   │ Endpoint       │ Req/sec (avg)  │ Req/min    │ Latency p50│ Latency p99  │ Errors │",
	);
	console.log(
		"├─────────────┼──────────┼────────────────┼────────────────┼────────────┼────────────┼──────────────┼────────┤",
	);

	for (const r of results) {
		console.log(
			`│ ${r.server.padEnd(11)} │ ${r.method.padEnd(8)} │ ${r.endpoint.padEnd(14)} │ ${r.requestsPerSecond.toFixed(2).padStart(14)} │ ${r.requestsPerMinute.toFixed(0).padStart(10)} │ ${(r.latencyP50 + "ms").padStart(10)} │ ${(r.latencyP99 + "ms").padStart(12)} │ ${String(r.errors).padStart(6)} │`,
		);
	}

	console.log(
		"└─────────────┴──────────┴────────────────┴────────────────┴────────────┴────────────┴──────────────┴────────┘",
	);

	console.log("\n" + "=".repeat(110));
	console.log("SUMMARY BY METHOD");
	console.log("=".repeat(110));

	const effectGetResults = effectResults.filter((r) => r.method === "GET");
	const effectPostResults = effectResults.filter((r) => r.method === "POST");
	const elysiaGetResults = elysiaResults.filter((r) => r.method === "GET");
	const elysiaPostResults = elysiaResults.filter((r) => r.method === "POST");

	const effectGetTotal = effectGetResults.reduce(
		(sum, r) => sum + r.requestsPerSecond,
		0,
	);
	const effectPostTotal = effectPostResults.reduce(
		(sum, r) => sum + r.requestsPerSecond,
		0,
	);
	const elysiaGetTotal = elysiaGetResults.reduce(
		(sum, r) => sum + r.requestsPerSecond,
		0,
	);
	const elysiaPostTotal = elysiaPostResults.reduce(
		(sum, r) => sum + r.requestsPerSecond,
		0,
	);

	const effectGetAvg = effectGetTotal / effectGetResults.length;
	const effectPostAvg = effectPostTotal / effectPostResults.length;
	const elysiaGetAvg = elysiaGetTotal / elysiaGetResults.length;
	const elysiaPostAvg = elysiaPostTotal / elysiaPostResults.length;

	console.log("\nGET Endpoints (4 endpoints running simultaneously):");
	console.log(
		`  Effect:  ${effectGetTotal.toFixed(2)} total req/sec | ${effectGetAvg.toFixed(2)} avg per endpoint`,
	);
	console.log(
		`  Elysia:  ${elysiaGetTotal.toFixed(2)} total req/sec | ${elysiaGetAvg.toFixed(2)} avg per endpoint`,
	);
	const getWinner = effectGetTotal > elysiaGetTotal ? "Effect" : "Elysia";
	const getDiff = Math.abs(
		((effectGetTotal - elysiaGetTotal) /
			Math.min(effectGetTotal, elysiaGetTotal)) *
			100,
	);
	console.log(`  Winner: ${getWinner} (+${getDiff.toFixed(1)}%)`);

	console.log("\nPOST Endpoints (4 endpoints running simultaneously):");
	console.log(
		`  Effect:  ${effectPostTotal.toFixed(2)} total req/sec | ${effectPostAvg.toFixed(2)} avg per endpoint`,
	);
	console.log(
		`  Elysia:  ${elysiaPostTotal.toFixed(2)} total req/sec | ${elysiaPostAvg.toFixed(2)} avg per endpoint`,
	);
	const postWinner = effectPostTotal > elysiaPostTotal ? "Effect" : "Elysia";
	const postDiff = Math.abs(
		((effectPostTotal - elysiaPostTotal) /
			Math.min(effectPostTotal, elysiaPostTotal)) *
			100,
	);
	console.log(`  Winner: ${postWinner} (+${postDiff.toFixed(1)}%)`);

	console.log("\n" + "=".repeat(110));
	console.log("OVERALL SUMMARY");
	console.log("=".repeat(110));

	const effectTotalReqSec = effectGetTotal + effectPostTotal;
	const elysiaTotalReqSec = elysiaGetTotal + elysiaPostTotal;
	const effectTotalErrors = effectResults.reduce((sum, r) => sum + r.errors, 0);
	const elysiaTotalErrors = elysiaResults.reduce((sum, r) => sum + r.errors, 0);

	console.log("\nCombined throughput (8 endpoints hammered simultaneously):");
	console.log(
		`  Effect:  ${effectTotalReqSec.toFixed(2)} req/sec | ${(effectTotalReqSec * 60).toFixed(0)} req/min | ${effectTotalErrors} errors`,
	);
	console.log(
		`  Elysia:  ${elysiaTotalReqSec.toFixed(2)} req/sec | ${(elysiaTotalReqSec * 60).toFixed(0)} req/min | ${elysiaTotalErrors} errors`,
	);

	const overallWinner =
		effectTotalReqSec > elysiaTotalReqSec ? "Effect" : "Elysia";
	const overallDiff = Math.abs(
		((effectTotalReqSec - elysiaTotalReqSec) /
			Math.min(effectTotalReqSec, elysiaTotalReqSec)) *
			100,
	);
	console.log(
		`\n  OVERALL WINNER: ${overallWinner} (+${overallDiff.toFixed(1)}%)`,
	);

	console.log("\n" + "=".repeat(110));
};

const main = async () => {
	const totalConnections = CONNECTIONS * ENDPOINTS.length;

	console.log(
		"╔═══════════════════════════════════════════════════════════════════════╗",
	);
	console.log(
		"║       Effect vs Elysia HTTP Server Performance Benchmark              ║",
	);
	console.log(
		"╠═══════════════════════════════════════════════════════════════════════╣",
	);
	console.log(
		`║  Duration: ${DURATION} seconds per test                                        ║`,
	);
	console.log(
		`║  Connections: ${CONNECTIONS} per endpoint (${totalConnections} total concurrent)                    ║`,
	);
	console.log(
		`║  Endpoints: ${ENDPOINTS.length} (${ENDPOINTS.filter((e) => e.method === "GET").length} GET + ${ENDPOINTS.filter((e) => e.method === "POST").length} POST)                                           ║`,
	);
	console.log(
		`║  Simulated delay: 100-500ms per request                                ║`,
	);
	console.log(
		`║  Mode: ALL endpoints running simultaneously (DDoS style)              ║`,
	);
	console.log(
		"╚═══════════════════════════════════════════════════════════════════════╝",
	);

	const results: BenchmarkResult[] = [];

	console.log("\n" + "-".repeat(70));
	console.log("BENCHMARKING EFFECT SERVER");
	console.log("-".repeat(70));

	const effectProc = await startServer(
		"Effect",
		"servers/effect-server.ts",
		EFFECT_PORT,
	);

	try {
		const effectResults = await Promise.all(
			ENDPOINTS.map((config) => runBenchmark("Effect", EFFECT_PORT, config)),
		);
		results.push(...effectResults);
	} finally {
		stopServer(effectProc);
		await sleep(1000);
	}

	console.log("\n" + "-".repeat(70));
	console.log("BENCHMARKING ELYSIA SERVER");
	console.log("-".repeat(70));

	const elysiaProc = await startServer(
		"Elysia",
		"servers/elysia-server.ts",
		ELYSIA_PORT,
	);

	try {
		const elysiaResults = await Promise.all(
			ENDPOINTS.map((config) => runBenchmark("Elysia", ELYSIA_PORT, config)),
		);
		results.push(...elysiaResults);
	} finally {
		stopServer(elysiaProc);
	}

	printResults(results);
};

main().catch(console.error);
