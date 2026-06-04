export interface BenchmarkResult {
	server: string;
	endpoint: string;
	method: string;
	requestsPerSecond: number;
	requestsPerMinute: number;
	latencyP50: number;
	latencyP99: number;
	latencyMax: number;
	totalRequests: number;
	throughput: number;
	errors: number;
	timeouts: number;
}

export interface EndpointConfig {
	endpoint: string;
	method: "GET" | "POST";
	body?: object;
	headers?: Record<string, string>;
}

export interface ServerConfig {
	name: string;
	command: string[];
	port: number;
}

export interface BenchmarkReport {
	timestamp: string;
	config: {
		duration: number;
		connections: number;
		pipelining: number;
		endpointCount: number;
	};
	results: BenchmarkResult[];
	summary: {
		servers: Record<string, ServerSummary>;
		winner: {
			overall: string;
			latency: string;
			overallDiff: number;
			latencyDiff: number;
		};
	};
}

export interface ServerSummary {
	totalReqSec: number;
	totalThroughput: number;
	avgP99: number;
	totalErrors: number;
	get: {
		totalReqSec: number;
		avgReqSec: number;
		avgP99: number;
	};
	post: {
		totalReqSec: number;
		avgReqSec: number;
		avgP99: number;
	};
}
