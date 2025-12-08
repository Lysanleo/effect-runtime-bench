# Effect vs Elysia HTTP Server Performance Benchmark

A performance comparison between Effect TS HTTP server (@effect/platform-bun) and Elysia.js, both running on Bun runtime.

## Setup

```bash
bun install
```

## Project Structure

```
├── servers/
│   ├── effect-server.ts    # Effect HTTP server (port 3000)
│   ├── elysia-server.ts    # Elysia HTTP server (port 3001)
│   └── shared.ts           # Shared utilities and data generators
├── benchmark/
│   └── runner.ts           # Benchmark orchestration script
├── package.json
└── tsconfig.json
```

## Endpoints

Both servers implement identical endpoints:

| Method | Endpoint       | Description                                      |
|--------|----------------|--------------------------------------------------|
| GET    | /api/data      | Returns JSON with request metadata               |
| GET    | /api/users     | Returns a list of generated users (3-8 items)    |
| GET    | /api/products  | Returns a list of generated products (3-8 items) |
| GET    | /api/stats     | Returns server statistics                        |
| POST   | /api/submit    | Accepts `{ data: string }`, returns processed response |
| POST   | /api/users     | Creates user with `{ name, email }`, returns created user |
| POST   | /api/orders    | Creates order with `{ productId, quantity }`, returns order details |
| POST   | /api/process   | Processes items array `{ items: string[] }`, returns results |

All endpoints include a simulated processing delay of 100-500ms.

## Running the Benchmark

Run the full benchmark suite:

```bash
bun run benchmark
```

This will:
1. Start the Effect server and run stress tests on all 8 endpoints simultaneously
2. Stop the Effect server
3. Start the Elysia server and run stress tests on all 8 endpoints simultaneously
4. Display detailed comparison tables with results

## Running Individual Servers

To run servers manually for testing:

```bash
# Effect server (port 3000)
bun run effect:start

# Elysia server (port 3001)
bun run elysia:start
```

## Benchmark Configuration

- Duration: 10 seconds per endpoint
- Concurrent connections: 100 per endpoint (800 total)
- Simulated work delay: 100-500ms random per request
- Mode: All 8 endpoints hammered simultaneously (DDoS style)

## Metrics Collected

- Requests per second (average)
- Requests per minute
- Latency p50 (median)
- Latency p99
- Total requests handled
- Error count

Results are grouped by:
- Individual endpoint performance
- GET vs POST method comparison
- Overall server throughput

## Dependencies

- **effect** - Effect TS core library
- **@effect/platform** - Effect platform abstractions
- **@effect/platform-bun** - Bun-specific Effect platform implementation
- **@effect/schema** - Schema validation for Effect
- **elysia** - Elysia.js web framework
- **autocannon** - HTTP benchmarking tool
