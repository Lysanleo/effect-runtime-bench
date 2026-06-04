import autocannon from "autocannon";
import { createEndpoints } from "./endpoints";
import { SERVER_CONFIGS } from "./server-configs";
import type { EndpointConfig } from "./types";
import { sleep, startServer, stopServer } from "./utils";

const PHASES = 2;
const DURATION_PER_ENDPOINT = 4;
const START_CONNECTIONS = 200;
const END_CONNECTIONS = 2000;

const CONNECTION_STEPS = Array.from({ length: PHASES }, (_, i) => {
	const progress = (i + 1) / PHASES;
	return Math.round(
		START_CONNECTIONS + (END_CONNECTIONS - START_CONNECTIONS) * progress,
	);
});

interface StressResult {
	phase: number;
	connections: number;
	endpoint: string;
	method: string;
	requestsPerSecond: number;
	latencyP50: number;
	latencyP99: number;
	latencyMax: number;
	errors: number;
	timeouts: number;
}

interface StressReport {
	timestamp: string;
	server: string;
	totalDuration: number;
	phases: number;
	connectionSteps: number[];
	results: StressResult[];
	summary: {
		avgReqSec: number;
		maxReqSec: number;
		maxConnections: number;
		breakingPoint: number | null;
		avgLatencyP99AtMax: number;
		totalErrors: number;
	};
}

const runStressPhase = async (
	port: number,
	connections: number,
	endpoint: EndpointConfig,
	duration: number,
): Promise<Omit<StressResult, "phase" | "connections" | "endpoint" | "method">> => {
	const url = `http://localhost:${port}${endpoint.endpoint}`;

	const options: autocannon.Options = {
		url,
		connections,
		duration,
		pipelining: 1,
		method: endpoint.method,
		headers: {
			"Content-Type": "application/json",
			Cookie: "sessionId=sess_stress_test; trackingId=track_stress_test",
		},
	};

	if (endpoint.method === "POST" && endpoint.body) {
		options.body = JSON.stringify(endpoint.body);
	}

	const result = await autocannon(options);

	return {
		requestsPerSecond: result.requests.average,
		latencyP50: result.latency.p50,
		latencyP99: result.latency.p99,
		latencyMax: result.latency.max,
		errors: result.errors,
		timeouts: result.timeouts,
	};
};

const runStressTest = async (
	serverName: string,
	port: number,
): Promise<StressReport> => {
	const endpoints = createEndpoints();
	const results: StressResult[] = [];
	let breakingPoint: number | null = null;

	const estimatedDuration = PHASES * endpoints.length * DURATION_PER_ENDPOINT;

	console.log(`\n${"═".repeat(100)}`);
	console.log(`🔥 STRESS TEST: ${serverName.toUpperCase()} SERVER`);
	console.log(`${"═".repeat(100)}`);
	console.log(
		`📊 Ramping from ${START_CONNECTIONS} to ${END_CONNECTIONS} connections`,
	);
	console.log(
		`📈 ${PHASES} phases × ${endpoints.length} endpoints × ${DURATION_PER_ENDPOINT}s = ~${Math.round(estimatedDuration / 60)} min`,
	);
	console.log(`⚡ Pipelining: 1 request per connection\n`);

	for (let phase = 0; phase < PHASES; phase++) {
		const connections = CONNECTION_STEPS[phase];
		const progressBar = "█".repeat(phase + 1) + "░".repeat(PHASES - phase - 1);

		console.log(
			`\n[${progressBar}] Phase ${phase + 1}/${PHASES}: ${connections.toLocaleString()} connections`,
		);

		let phaseReqSec = 0;
		let phaseErrors = 0;
		let phaseP99Total = 0;

		for (const endpoint of endpoints) {
			process.stdout.write(
				`  ${endpoint.method.padEnd(4)} ${endpoint.endpoint.slice(0, 35).padEnd(35)}`,
			);

			try {
				const phaseResult = await runStressPhase(
					port,
					connections,
					endpoint,
					DURATION_PER_ENDPOINT,
				);
				const result = {
					phase: phase + 1,
					connections,
					endpoint: endpoint.endpoint,
					method: endpoint.method,
					...phaseResult,
				};

				results.push(result);

				phaseReqSec += phaseResult.requestsPerSecond;
				phaseErrors += phaseResult.errors + phaseResult.timeouts;
				phaseP99Total += phaseResult.latencyP99;

				const errors = phaseResult.errors + phaseResult.timeouts;
				if (errors > 0) {
					console.log(
						` ⚠️  ${phaseResult.requestsPerSecond.toFixed(0).padStart(6)} req/s | p99: ${phaseResult.latencyP99.toFixed(0).padStart(5)}ms | ${errors} errors`,
					);
				} else {
					console.log(
						` ✅ ${phaseResult.requestsPerSecond.toFixed(0).padStart(6)} req/s | p99: ${phaseResult.latencyP99.toFixed(0).padStart(5)}ms`,
					);
				}

				if (
					breakingPoint === null &&
					(errors > connections * 0.1 || phaseResult.latencyP99 > 5000)
				) {
					breakingPoint = connections;
					console.log(
						`     ⛔ Breaking point detected at ${connections.toLocaleString()} connections!`,
					);
				}
			} catch {
				console.log(" ❌ Failed");
				results.push({
					phase: phase + 1,
					connections,
					endpoint: endpoint.endpoint,
					method: endpoint.method,
					requestsPerSecond: 0,
					latencyP50: 0,
					latencyP99: 0,
					latencyMax: 0,
					errors: connections,
					timeouts: 0,
				});
				phaseErrors += connections;
				if (breakingPoint === null) {
					breakingPoint = connections;
				}
			}
		}

		const avgReqSec = phaseReqSec / endpoints.length;
		const avgP99 = phaseP99Total / endpoints.length;
		console.log(
			`  📊 Phase avg: ${avgReqSec.toFixed(0)} req/s | avg p99: ${avgP99.toFixed(0)}ms | ${phaseErrors} errors`,
		);
	}

	const maxReqSecResult = results.reduce(
		(max, r) => (r.requestsPerSecond > max.requestsPerSecond ? r : max),
		results[0],
	);
	const lastPhaseResults = results.filter((r) => r.phase === PHASES);
	const avgLatencyP99AtMax =
		lastPhaseResults.reduce((sum, r) => sum + r.latencyP99, 0) /
		lastPhaseResults.length;
	const avgReqSec =
		results.reduce((sum, r) => sum + r.requestsPerSecond, 0) / results.length;

	return {
		timestamp: new Date().toISOString(),
		server: serverName,
		totalDuration: estimatedDuration,
		phases: PHASES,
		connectionSteps: CONNECTION_STEPS,
		results,
		summary: {
			avgReqSec,
			maxReqSec: maxReqSecResult.requestsPerSecond,
			maxConnections: END_CONNECTIONS,
			breakingPoint,
			avgLatencyP99AtMax,
			totalErrors: results.reduce((sum, r) => sum + r.errors + r.timeouts, 0),
		},
	};
};

const winnerBy = (
	reports: Record<string, StressReport>,
	select: (report: StressReport) => number,
	direction: "max" | "min",
) => {
	const ranked = Object.entries(reports).sort((a, b) =>
		direction === "max"
			? select(b[1]) - select(a[1])
			: select(a[1]) - select(b[1]),
	);
	const [winner, winnerReport] = ranked[0];
	const runnerUpReport = ranked[1]?.[1] ?? winnerReport;
	const winnerValue = select(winnerReport);
	const runnerUpValue = select(runnerUpReport);
	const denominator =
		direction === "max"
			? Math.min(winnerValue, runnerUpValue)
			: Math.max(winnerValue, runnerUpValue);

	return {
		winner,
		diff:
			denominator === 0
				? 0
				: Math.abs(((winnerValue - runnerUpValue) / denominator) * 100),
	};
};

const phaseStats = (report: StressReport, phase: number) => {
	const phaseResults = report.results.filter((r) => r.phase === phase);
	return {
		avgReqSec:
			phaseResults.reduce((sum, r) => sum + r.requestsPerSecond, 0) /
			phaseResults.length,
		avgP99:
			phaseResults.reduce((sum, r) => sum + r.latencyP99, 0) /
			phaseResults.length,
	};
};

const printStressReport = (
	reports: Record<string, StressReport>,
	endpointCount: number,
) => {
	const serverNames = Object.keys(reports);
	const serverWidth = Math.max(
		"Server".length,
		...serverNames.map((server) => server.length),
	);
	const separator = `┌${"─".repeat(serverWidth + 2)}┬─────────────┬─────────────┬────────────────┬─────────────┬──────────────┐`;
	const header = `│ ${"Server".padEnd(serverWidth)} │ Avg Req/sec │ Max Req/sec │ Breaking Point │ P99 MaxLoad │ Total Errors │`;
	const divider = `├${"─".repeat(serverWidth + 2)}┼─────────────┼─────────────┼────────────────┼─────────────┼──────────────┤`;
	const footer = `└${"─".repeat(serverWidth + 2)}┴─────────────┴─────────────┴────────────────┴─────────────┴──────────────┘`;

	console.log(`\n${"═".repeat(100)}`);
	console.log("📊 STRESS TEST RESULTS COMPARISON");
	console.log(`${"═".repeat(100)}`);

	console.log(`\n${separator}`);
	console.log(header);
	console.log(divider);

	for (const server of serverNames) {
		const report = reports[server];
		console.log(
			`│ ${server.padEnd(serverWidth)} │ ${report.summary.avgReqSec.toFixed(0).padStart(11)} │ ${report.summary.maxReqSec.toFixed(0).padStart(11)} │ ${(report.summary.breakingPoint?.toLocaleString() || "None").padStart(14)} │ ${(report.summary.avgLatencyP99AtMax.toFixed(0) + "ms").padStart(11)} │ ${report.summary.totalErrors.toLocaleString().padStart(12)} │`,
		);
	}

	console.log(footer);

	console.log(`\n📈 Performance by Phase (${endpointCount} endpoints each):`);
	for (let phase = 1; phase <= PHASES; phase++) {
		console.log(
			`\nPhase ${phase} (${CONNECTION_STEPS[phase - 1].toLocaleString()} connections)`,
		);
		for (const server of serverNames) {
			const stats = phaseStats(reports[server], phase);
			console.log(
				`  ${server.padEnd(serverWidth)} ${stats.avgReqSec.toFixed(0).padStart(6)} req/s | p99 ${stats.avgP99.toFixed(0).padStart(5)}ms`,
			);
		}
	}

	const throughput = winnerBy(reports, (r) => r.summary.avgReqSec, "max");
	const latency = winnerBy(reports, (r) => r.summary.avgLatencyP99AtMax, "min");

	console.log(
		`\n🏆 THROUGHPUT WINNER: ${throughput.winner} (+${throughput.diff.toFixed(1)}% avg throughput)`,
	);
	console.log(
		`⚡ LATENCY WINNER: ${latency.winner} (${latency.diff.toFixed(1)}% lower p99 at max load)`,
	);
	console.log(`${"═".repeat(100)}\n`);
};

const main = async () => {
	const endpoints = createEndpoints();
	const estimatedDuration = PHASES * endpoints.length * DURATION_PER_ENDPOINT;
	const estimatedMinutes = Math.round(estimatedDuration / 60);

	console.log(`
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                     🔥 STRESS TEST - PUSH TO THE LIMIT 🔥                          ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║  Servers: ${SERVER_CONFIGS.map((server) => server.name).join(", ")}
║  Phases: ${PHASES} phases × ${endpoints.length} endpoints × ${DURATION_PER_ENDPOINT}s = ~${estimatedMinutes} min per server
║  Connections: ${START_CONNECTIONS} → ${END_CONNECTIONS}
║  Endpoints: ALL ${endpoints.length} endpoints tested sequentially per phase
╚═══════════════════════════════════════════════════════════════════════════════════╝
`);

	const reports: Record<string, StressReport> = {};

	for (const server of SERVER_CONFIGS) {
		const proc = await startServer(server);
		try {
			reports[server.name] = await runStressTest(server.name, server.port);
		} finally {
			stopServer(proc);
			await sleep(3000);
		}
	}

	printStressReport(reports, endpoints.length);

	const combinedReport = {
		timestamp: new Date().toISOString(),
		type: "stress-test",
		config: {
			totalDuration: estimatedDuration,
			phases: PHASES,
			durationPerEndpoint: DURATION_PER_ENDPOINT,
			startConnections: START_CONNECTIONS,
			endConnections: END_CONNECTIONS,
			pipelining: 1,
			connectionSteps: CONNECTION_STEPS,
			endpointCount: endpoints.length,
			servers: SERVER_CONFIGS.map((server) => server.name),
		},
		servers: reports,
		// Keep top-level keys for older ad-hoc result readers.
		effect: reports["Effect (Bun)"],
		elysia: reports["Elysia (Bun)"],
		hono: reports["Hono (Bun)"],
		nodeEffect: reports["Effect (Node)"],
		nodeHono: reports["Hono (Node)"],
	};

	await Bun.write("stress-results.json", JSON.stringify(combinedReport, null, 2));
	console.log("📁 Results saved to stress-results.json");
};

main().catch(console.error);
