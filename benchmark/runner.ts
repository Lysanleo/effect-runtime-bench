import type { BenchmarkResult } from "./types";
import { DURATION, CONNECTIONS, PIPELINING } from "./constants";
import { createEndpoints } from "./endpoints";
import { SERVER_CONFIGS } from "./server-configs";
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
		"║      Effect vs Elysia vs Hono HTTP Server Performance Benchmark (STRESS TEST)          ║",
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

	for (const server of SERVER_CONFIGS) {
		console.log("\n" + "-".repeat(90));
		console.log(`BENCHMARKING ${server.name.toUpperCase()} SERVER`);
		console.log("-".repeat(90));

		const serverEndpoints = createEndpoints();
		const proc = await startServer(server);

		try {
			const serverResults = await Promise.all(
				serverEndpoints.map((config) =>
					runBenchmark(server.name, server.port, config),
				),
			);
			results.push(...serverResults);
		} finally {
			stopServer(proc);
			await sleep(2000);
		}
	}

	const report = createReport(results, endpoints.length);
	await saveReport(report);
	printResults(report);
};

main().catch(console.error);
