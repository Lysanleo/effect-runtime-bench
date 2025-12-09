import autocannon from "autocannon";
import { spawn, type Subprocess } from "bun";
import { EFFECT_PORT, ELYSIA_PORT } from "./constants";
import { createEndpoints } from "./endpoints";
import type { EndpointConfig } from "./types";

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
		maxReqSec: number;
		maxConnections: number;
		breakingPoint: number | null;
		avgLatencyP99AtMax: number;
		totalErrors: number;
	};
}

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

const startServer = async (
	name: string,
	script: string,
	port: number,
): Promise<Subprocess> => {
	console.log(`\n🚀 Starting ${name} server on port ${port}...`);

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

	console.log(`✅ ${name} server ready!\n`);
	return proc;
};

const stopServer = (proc: Subprocess) => {
	proc.kill();
};

const runStressPhase = async (
	port: number,
	connections: number,
	endpoint: EndpointConfig,
	duration: number,
): Promise<{
	requestsPerSecond: number;
	latencyP50: number;
	latencyP99: number;
	latencyMax: number;
	errors: number;
	timeouts: number;
}> => {
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

				results.push({
					phase: phase + 1,
					connections,
					endpoint: endpoint.endpoint,
					method: endpoint.method,
					...phaseResult,
				});

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
				console.log(` ❌ Failed`);
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

	return {
		timestamp: new Date().toISOString(),
		server: serverName,
		totalDuration: estimatedDuration,
		phases: PHASES,
		connectionSteps: CONNECTION_STEPS,
		results,
		summary: {
			maxReqSec: maxReqSecResult.requestsPerSecond,
			maxConnections: END_CONNECTIONS,
			breakingPoint,
			avgLatencyP99AtMax,
			totalErrors: results.reduce((sum, r) => sum + r.errors + r.timeouts, 0),
		},
	};
};

const printStressReport = (
	effectReport: StressReport,
	elysiaReport: StressReport,
	endpointCount: number,
) => {
	console.log(`\n${"═".repeat(100)}`);
	console.log("📊 STRESS TEST RESULTS COMPARISON");
	console.log(`${"═".repeat(100)}`);

	console.log("\n┌──────────────────┬────────────────┬────────────────┐");
	console.log("│ Metric           │ Effect         │ Elysia         │");
	console.log("├──────────────────┼────────────────┼────────────────┤");

	const effectAvgReq =
		effectReport.results.reduce((sum, r) => sum + r.requestsPerSecond, 0) /
		effectReport.results.length;
	const elysiaAvgReq =
		elysiaReport.results.reduce((sum, r) => sum + r.requestsPerSecond, 0) /
		elysiaReport.results.length;

	console.log(
		`│ Avg Req/sec      │ ${effectAvgReq.toFixed(0).padStart(14)} │ ${elysiaAvgReq.toFixed(0).padStart(14)} │`,
	);
	console.log(
		`│ Max Single Req/s │ ${effectReport.summary.maxReqSec.toFixed(0).padStart(14)} │ ${elysiaReport.summary.maxReqSec.toFixed(0).padStart(14)} │`,
	);
	console.log(
		`│ Breaking Point   │ ${(effectReport.summary.breakingPoint?.toLocaleString() || "None").padStart(14)} │ ${(elysiaReport.summary.breakingPoint?.toLocaleString() || "None").padStart(14)} │`,
	);
	console.log(
		`│ P99 at Max Load  │ ${(effectReport.summary.avgLatencyP99AtMax.toFixed(0) + "ms").padStart(14)} │ ${(elysiaReport.summary.avgLatencyP99AtMax.toFixed(0) + "ms").padStart(14)} │`,
	);
	console.log(
		`│ Total Errors     │ ${effectReport.summary.totalErrors.toLocaleString().padStart(14)} │ ${elysiaReport.summary.totalErrors.toLocaleString().padStart(14)} │`,
	);
	console.log("└──────────────────┴────────────────┴────────────────┘");

	console.log(`\n📈 Performance by Phase (${endpointCount} endpoints each):`);
	console.log(
		"┌───────┬─────────────┬─────────────────────────────┬─────────────────────────────┐",
	);
	console.log(
		"│ Phase │ Connections │ Effect (req/s | p99)        │ Elysia (req/s | p99)        │",
	);
	console.log(
		"├───────┼─────────────┼─────────────────────────────┼─────────────────────────────┤",
	);

	for (let phase = 1; phase <= PHASES; phase++) {
		const effectPhase = effectReport.results.filter((r) => r.phase === phase);
		const elysiaPhase = elysiaReport.results.filter((r) => r.phase === phase);

		const effectAvgReq =
			effectPhase.reduce((sum, r) => sum + r.requestsPerSecond, 0) /
			effectPhase.length;
		const effectAvgP99 =
			effectPhase.reduce((sum, r) => sum + r.latencyP99, 0) /
			effectPhase.length;
		const elysiaAvgReq =
			elysiaPhase.reduce((sum, r) => sum + r.requestsPerSecond, 0) /
			elysiaPhase.length;
		const elysiaAvgP99 =
			elysiaPhase.reduce((sum, r) => sum + r.latencyP99, 0) /
			elysiaPhase.length;

		const connections = CONNECTION_STEPS[phase - 1];

		console.log(
			`│ ${String(phase).padStart(5)} │ ${connections.toLocaleString().padStart(11)} │ ${effectAvgReq.toFixed(0).padStart(12)} | ${(effectAvgP99.toFixed(0) + "ms").padStart(12)} │ ${elysiaAvgReq.toFixed(0).padStart(12)} | ${(elysiaAvgP99.toFixed(0) + "ms").padStart(12)} │`,
		);
	}

	console.log(
		"└───────┴─────────────┴─────────────────────────────┴─────────────────────────────┘",
	);

	const effectWins = effectAvgReq > elysiaAvgReq;
	const winner = effectWins ? "Effect" : "Elysia";
	const diff = Math.abs(
		((effectAvgReq - elysiaAvgReq) / Math.min(effectAvgReq, elysiaAvgReq)) *
			100,
	);

	console.log(
		`\n🏆 STRESS TEST WINNER: ${winner} (+${diff.toFixed(1)}% avg throughput)`,
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
║  Phases: ${PHASES} phases × ${endpoints.length} endpoints × ${DURATION_PER_ENDPOINT}s = ~${estimatedMinutes} min per server
║  Connections: ${START_CONNECTIONS} → ${END_CONNECTIONS}
║  Endpoints: ALL ${endpoints.length} endpoints tested sequentially per phase
╚═══════════════════════════════════════════════════════════════════════════════════╝
`);

	let effectReport: StressReport;
	let elysiaReport: StressReport;

	const effectProc = await startServer(
		"Effect",
		"servers/effect-server.ts",
		EFFECT_PORT,
	);
	try {
		effectReport = await runStressTest("Effect", EFFECT_PORT);
	} finally {
		stopServer(effectProc);
		await sleep(3000);
	}

	const elysiaProc = await startServer(
		"Elysia",
		"servers/elysia-server.ts",
		ELYSIA_PORT,
	);
	try {
		elysiaReport = await runStressTest("Elysia", ELYSIA_PORT);
	} finally {
		stopServer(elysiaProc);
	}

	printStressReport(effectReport, elysiaReport, endpoints.length);

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
		},
		effect: effectReport,
		elysia: elysiaReport,
	};

	await Bun.write(
		"stress-results.json",
		JSON.stringify(combinedReport, null, 2),
	);
	console.log("📁 Results saved to stress-results.json");
};

main().catch(console.error);
