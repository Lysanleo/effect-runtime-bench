const numberFromEnv = (name: string, fallback: number) => {
	const value = Number(process.env[name]);
	return Number.isFinite(value) && value > 0 ? Math.ceil(value) : fallback;
};

const optionalNumberFromEnv = (name: string) => {
	const value = Number(process.env[name]);
	return Number.isFinite(value) && value > 0 ? Math.ceil(value) : undefined;
};

export const DURATION = numberFromEnv("BENCHMARK_DURATION", 10);
export const CONNECTIONS = numberFromEnv("BENCHMARK_CONNECTIONS", 50);
export const TOTAL_CONNECTIONS = optionalNumberFromEnv(
	"BENCHMARK_TOTAL_CONNECTIONS",
);
export const PIPELINING = numberFromEnv("BENCHMARK_PIPELINING", 1);

export const resolveConnections = (endpointCount: number) =>
	TOTAL_CONNECTIONS
		? Math.max(1, Math.ceil(TOTAL_CONNECTIONS / endpointCount))
		: CONNECTIONS;

export const EFFECT_PORT = 3000;
export const ELYSIA_PORT = 3001;
export const HONO_PORT = 3002;
export const EXPRESS_PORT = 3003;
export const FASTIFY_PORT = 3004;
export const NODE_EFFECT_PORT = 3100;
export const NODE_HONO_PORT = 3102;
export const NODE_HONO_EFFECT_PORT = 3103;
export const NODE_EXPRESS_PORT = 3104;
export const NODE_FASTIFY_PORT = 3105;

export const RESULTS_FILE = "benchmark-results.json";
