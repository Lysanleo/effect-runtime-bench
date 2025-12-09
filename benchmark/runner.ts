import type { BenchmarkResult } from "./types";
import {
	DURATION,
	CONNECTIONS,
	PIPELINING,
	EFFECT_PORT,
	ELYSIA_PORT,
} from "./constants";
import { createEndpoints } from "./endpoints";
import {
	sleep,
	startServer,
	stopServer,
	runBenchmark,
	createReport,
	saveReport,
	printResults,
} from "./utils";

const main = async () => {
	const endpoints = createEndpoints();
	const totalConnections = CONNECTIONS * endpoints.length;
	const getEndpoints = endpoints.filter((e) => e.method === "GET").length;
	const postEndpoints = endpoints.filter((e) => e.method === "POST").length;

	console.log(
		"╔═════════════════════════════════════════════════════════════════════════════════════════╗",
	);
	console.log(
		"║         Effect vs Elysia HTTP Server Performance Benchmark (STRESS TEST)               ║",
	);
	console.log(
		"╠═════════════════════════════════════════════════════════════════════════════════════════╣",
	);
	console.log(
		`║  Duration: ${DURATION} seconds per test                                                          ║`,
	);
	console.log(
		`║  Connections: ${CONNECTIONS} per endpoint (${totalConnections.toLocaleString()} total concurrent)                                 ║`,
	);
	console.log(
		`║  Pipelining: ${PIPELINING} requests per connection                                                   ║`,
	);
	console.log(
		`║  Endpoints: ${endpoints.length} (${getEndpoints} GET + ${postEndpoints} POST) with random params                           ║`,
	);
	console.log(
		`║  Simulated delay: 50-300ms per request                                                   ║`,
	);
	console.log(
		`║  Features: Complex bodies, cookies, session handling                                     ║`,
	);
	console.log(
		`║  Mode: ALL endpoints running simultaneously (DDoS style)                                 ║`,
	);
	console.log(
		"╚═════════════════════════════════════════════════════════════════════════════════════════╝",
	);

	const results: BenchmarkResult[] = [];

	console.log("\n" + "-".repeat(90));
	console.log("BENCHMARKING EFFECT SERVER");
	console.log("-".repeat(90));

	const effectProc = await startServer(
		"Effect",
		"servers/effect-server.ts",
		EFFECT_PORT,
	);

	try {
		const effectResults = await Promise.all(
			endpoints.map((config) => runBenchmark("Effect", EFFECT_PORT, config)),
		);
		results.push(...effectResults);
	} finally {
		stopServer(effectProc);
		await sleep(2000);
	}

	console.log("\n" + "-".repeat(90));
	console.log("BENCHMARKING ELYSIA SERVER");
	console.log("-".repeat(90));

	const elysiaEndpoints = createEndpoints();
	const elysiaProc = await startServer(
		"Elysia",
		"servers/elysia-server.ts",
		ELYSIA_PORT,
	);

	try {
		const elysiaResults = await Promise.all(
			elysiaEndpoints.map((config) =>
				runBenchmark("Elysia", ELYSIA_PORT, config),
			),
		);
		results.push(...elysiaResults);
	} finally {
		stopServer(elysiaProc);
	}

	const report = createReport(results, endpoints.length);
	await saveReport(report);
	printResults(report);
};

main().catch(console.error);
