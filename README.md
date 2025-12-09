# Effect vs Elysia HTTP Server Performance Benchmark

A performance comparison between Effect TS HTTP server (@effect/platform-bun) and Elysia.js, both running on Bun runtime. Features complex request/response bodies, dynamic routes, and cookie-based session handling.

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
│   ├── stress.ts           # Extreme stress test (100 → 20k connections)
│   ├── types.ts            # TypeScript interfaces (BenchmarkResult, BenchmarkReport)
│   └── utils.ts            # Utilities (server management, results saving/printing)
├── servers/
│   ├── constants.ts        # Data arrays (names, categories, etc.)
│   ├── effect-server.ts    # Effect HTTP server (port 3000)
│   ├── elysia-server.ts    # Elysia HTTP server (port 3001)
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

Both servers implement identical endpoints with complex request/response handling:

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
1. Start the Effect server and hammer all 17 endpoints simultaneously
2. Stop the Effect server
3. Start the Elysia server and hammer all 17 endpoints simultaneously
4. Save results to `benchmark-results.json`
5. Display detailed comparison tables with results

### Results File

Benchmark results are automatically saved to `benchmark-results.json` (gitignored) with:
- Timestamp of the run
- Configuration used (duration, connections, pipelining)
- Detailed results for each endpoint
- Summary statistics for both servers
- Winner determination

## Stress Test (Push to the Limit)

Run an extreme stress test that gradually ramps up connections:

```bash
bun run stress
```

This will:
1. Ramp connections from **10 → 100** over **5 phases**
2. Test **ALL 17 endpoints sequentially**, 4 seconds each
3. ~5 minutes per server (~10 min total)
4. Detect breaking points where errors spike or p99 > 5 seconds
5. Save results to `stress-results.json`

### Stress Test Output

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                     🔥 STRESS TEST - PUSH TO THE LIMIT 🔥                         ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║  Phases: 5 phases × 17 endpoints × 4s = ~6 min per server
║  Connections: 10 → 100
║  Endpoints: ALL 17 endpoints tested sequentially per phase
╚═══════════════════════════════════════════════════════════════════════════════════╝

[█░░░░] Phase 1/5: 28 connections
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
║         Effect vs Elysia HTTP Server Performance Benchmark (STRESS TEST)               ║
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
  Effect:  XXXX req/sec | XX.X KB/s | avg p99: XXXms | 0 errors
  Elysia:  XXXX req/sec | XX.X KB/s | avg p99: XXXms | 0 errors

  OVERALL WINNER: [Effect/Elysia] (+X.X%)
  LATENCY WINNER: [Effect/Elysia] (X.X% lower p99)

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
- **@effect/platform** - Effect platform abstractions
- **@effect/platform-bun** - Bun-specific Effect platform implementation
- **@effect/schema** - Schema validation for Effect
- **elysia** - Elysia.js web framework
- **autocannon** - HTTP benchmarking tool
