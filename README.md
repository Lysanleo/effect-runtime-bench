# Effect vs Elysia vs Hono HTTP Server Performance Benchmark

A performance comparison between Effect TS HTTP server, Elysia.js, and Hono. The main benchmark compares Bun runtime servers with Node.js runtime servers where adapters are available. Features complex request/response bodies, dynamic routes, and cookie-based session handling.

## Setup

```bash
bun install
```

## Project Structure

```
├── benchmark/
│   ├── constants.ts        # Benchmark config (duration, connections, ports, results file)
│   ├── endpoints.ts        # Endpoint configs with randomized request bodies
│   ├── runner.ts           # Main benchmark orchestration script
│   ├── stress.ts           # Extreme stress test (200 → 2k connections)
│   ├── types.ts            # TypeScript interfaces (BenchmarkResult, BenchmarkReport)
│   └── utils.ts            # Utilities (server management, results saving/printing)
├── servers/
│   ├── constants.ts        # Data arrays (names, categories, etc.)
│   ├── effect-server.ts    # Effect HTTP server on Bun (port 3000)
│   ├── elysia-server.ts    # Elysia HTTP server (port 3001)
│   ├── hono-server.ts      # Hono HTTP server on Bun (port 3002)
│   ├── node-effect-server.ts # Effect HTTP server on Node.js (port 3100)
│   ├── node-hono-server.ts # Hono HTTP server on Node.js (port 3102)
│   ├── shared.ts           # Re-exports all server utilities
│   └── utils/
│       ├── generators.ts   # Data generator functions
│       └── random.ts       # Random utilities (uses crypto.randomUUID())
├── benchmark-results.json  # Benchmark output (gitignored)
├── stress-results.json     # Stress test output (gitignored)
├── package.json
└── tsconfig.json
```

## Endpoints

All servers implement identical endpoints with complex request/response handling:

### GET Endpoints

| Endpoint                           | Description                                      |
|------------------------------------|--------------------------------------------------|
| `/api/data`                        | Returns JSON with session data (sets cookies)    |
| `/api/users`                       | Returns list of users with nested profile data   |
| `/api/users/:id`                   | Returns single user by ID (dynamic route)        |
| `/api/products`                    | Returns list of products with specs & images     |
| `/api/products/:id`                | Returns single product by ID (dynamic route)     |
| `/api/categories/:category/products` | Returns products by category (dynamic route)   |
| `/api/stats`                       | Returns server statistics with nested metrics    |
| `/api/orders/:id`                  | Returns order by ID (dynamic route)              |
| `/api/cart`                        | Returns cart data based on session cookie        |

### POST Endpoints

| Endpoint        | Body Schema                                      | Description                           |
|-----------------|--------------------------------------------------|---------------------------------------|
| `/api/submit`   | `{ data: string }`                               | Basic data submission                 |
| `/api/users`    | Complex user object with profile, preferences, address | Creates user, sets session cookies |
| `/api/orders`   | Multi-item order with shipping, payment, coupon  | Creates order, reads session cookies  |
| `/api/process`  | Array of items with type, id, data + options     | Batch item processing                 |
| `/api/search`   | Query + filters + pagination + sort              | Product search with facets            |
| `/api/bulk`     | Array of typed items + options                   | Bulk create operations                |
| `/api/analytics`| Date range + metrics array + filters             | Analytics data generation             |
| `/api/cart`     | Action + items array with options                | Cart updates with session handling    |

### Cookie Handling

The servers implement full cookie-based session management:
- **sessionId**: HTTP-only session cookie (1 hour TTL)
- **trackingId**: Persistent tracking cookie (1 year TTL)
- **userId**: User identification after registration
- **lastVisit**, **lastSearch**, **lastOrderAt**: Activity tracking
- **cartUpdated**, **cartCleared**: Cart state indicators

## Running the Benchmark

Run the full stress test benchmark suite:

```bash
bun run benchmark
```

This will:
1. Start each server and hammer all 17 endpoints simultaneously
2. Compare Effect (Bun), Elysia (Bun), Hono (Bun), Effect (Node), and Hono (Node)
3. Save results to `benchmark-results.json`
4. Display detailed comparison tables with results

Node.js coverage currently includes Effect and Hono. Elysia remains Bun-only in this repo.

### Results File

Benchmark results are automatically saved to `benchmark-results.json` (gitignored) with:
- Timestamp of the run
- Configuration used (duration, connections, pipelining)
- Detailed results for each endpoint
- Summary statistics for all servers
- Winner determination

## Stress Test (Push to the Limit)

Run an extreme stress test that gradually ramps up connections:

```bash
bun run stress
```

This will:
1. Ramp connections from **200 → 2,000** over **2 phases** (`1,100`, `2,000`)
2. Test **ALL 17 endpoints sequentially**, 4 seconds each
3. Run Effect, Elysia, Hono on Bun and Effect, Hono on Node separately
4. Detect breaking points where errors exceed 10% of connections or p99 > 5 seconds
5. Save results to `stress-results.json`

### Stress Test Output

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                     🔥 STRESS TEST - PUSH TO THE LIMIT 🔥                         ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║  Servers: Effect (Bun), Elysia (Bun), Hono (Bun), Effect (Node), Hono (Node)
║  Phases: 2 phases × 17 endpoints × 4s = ~2 min per server
║  Connections: 200 → 2000
║  Endpoints: ALL 17 endpoints tested sequentially per phase
╚═══════════════════════════════════════════════════════════════════════════════════╝

[█░] Phase 1/2: 1,100 connections
  GET  /api/data                            ✅    158 req/s | p99:   300ms
  GET  /api/users                           ✅    159 req/s | p99:   300ms
  POST /api/users                           ⚠️    145 req/s | p99:   312ms | 2 errors
  📊 Phase avg: 152 req/s | avg p99: 287ms | 2 errors
```

## Running Individual Servers

To run servers manually for testing:

```bash
# Effect server (port 3000)
bun run effect:start

# Elysia server (port 3001)
bun run elysia:start

# Hono server (port 3002)
bun run hono:start

# Effect server on Node.js (port 3100)
bun run node-effect:start

# Hono server on Node.js (port 3102)
bun run node-hono:start
```

## Benchmark Configuration

The benchmark is configured in `benchmark/constants.ts`:

| Parameter    | Value                                |
|--------------|--------------------------------------|
| Duration     | 10 seconds per endpoint              |
| Connections  | 50 per endpoint (850 total)          |
| Pipelining   | 1 request per connection             |

### Randomized Parameters

Every benchmark run generates fresh random data using `crypto.randomUUID()`:

**Dynamic route parameters:**
- User IDs: `/api/users/:id` with random numeric IDs
- Product IDs: `/api/products/:id` with random numeric IDs
- Order IDs: `/api/orders/:id` with random numeric IDs
- Categories: `/api/categories/:category/products` with random category names

**Request bodies:**
- **User creation**: Random names, emails (UUID-based), preferences
- **Order creation**: Random product IDs, quantities, colors, sizes, coupon codes
- **Process**: Random UUIDs for item IDs, varying dimensions and durations
- **Search**: Random search queries, price ranges, pagination settings
- **Analytics**: Random date ranges, metric combinations, filter options
- **Bulk operations**: Random user/product data with UUID-based emails

## Sample Benchmark Output

```
╔═════════════════════════════════════════════════════════════════════════════════════════╗
║      Effect vs Elysia vs Hono HTTP Server Performance Benchmark (STRESS TEST)          ║
╠═════════════════════════════════════════════════════════════════════════════════════════╣
║  Duration: 10 seconds per test                                                          ║
║  Connections: 50 per endpoint (850 total concurrent)                                    ║
║  Pipelining: 1 requests per connection                                                  ║
║  Endpoints: 17 (9 GET + 8 POST) with random params                                      ║
║  Simulated delay: 50-300ms per request                                                  ║
║  Features: Complex bodies, cookies, session handling                                    ║
║  Mode: ALL endpoints running simultaneously (DDoS style)                                ║
╚═════════════════════════════════════════════════════════════════════════════════════════╝

============================================================================================================================================
BENCHMARK RESULTS - ALL ENDPOINTS (STRESS TEST MODE)
============================================================================================================================================

┌─────────────┬──────────┬─────────────────────────────────┬────────────┬────────────┬────────────┬────────────┬────────┐
│ Server      │ Method   │ Endpoint                        │ Req/sec    │ p50 (ms)   │ p99 (ms)   │ Throughput │ Errors │
├─────────────┼──────────┼─────────────────────────────────┼────────────┼────────────┼────────────┼────────────┼────────┤
│ Effect      │ GET      │ /api/data                       │        XXX │        XXX │        XXX │    XXX B/s │      0 │
│ Effect      │ GET      │ /api/users                      │        XXX │        XXX │        XXX │    XXX B/s │      0 │
│ ...         │ ...      │ ...                             │        ... │        ... │        ... │        ... │    ... │
└─────────────┴──────────┴─────────────────────────────────┴────────────┴────────────┴────────────┴────────────┴────────┘

============================================================================================================================================
OVERALL SUMMARY
============================================================================================================================================

Combined throughput (17 endpoints hammered simultaneously):
  Effect (Bun):   XXXX req/sec | XX.X KB/s | avg p99: XXXms | 0 errors
  Elysia (Bun):   XXXX req/sec | XX.X KB/s | avg p99: XXXms | 0 errors
  Hono (Bun):     XXXX req/sec | XX.X KB/s | avg p99: XXXms | 0 errors
  Effect (Node):  XXXX req/sec | XX.X KB/s | avg p99: XXXms | 0 errors
  Hono (Node):    XXXX req/sec | XX.X KB/s | avg p99: XXXms | 0 errors

  OVERALL WINNER: [Effect/Elysia/Hono] (+X.X%)
  LATENCY WINNER: [Effect/Elysia/Hono] (X.X% lower p99)

============================================================================================================================================
```

## Metrics Collected

- Requests per second (average)
- Requests per minute
- Latency p50 (median)
- Latency p99 (99th percentile)
- Latency max
- Total requests handled
- Throughput (bytes/sec)
- Errors and timeouts

Results are grouped by:
- Individual endpoint performance
- GET vs POST method comparison
- Overall server throughput and latency

## Dependencies

- **effect** - Effect TS core library
- **@effect/platform-bun** - Bun-specific Effect platform implementation
- **@effect/platform-node** - Node.js-specific Effect platform implementation
- **elysia** - Elysia.js web framework
- **hono** - Hono web framework
- **@hono/node-server** - Hono Node.js adapter
- **autocannon** - HTTP benchmarking tool
