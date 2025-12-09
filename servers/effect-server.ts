import {
	HttpRouter,
	HttpServer,
	HttpServerResponse,
	HttpServerRequest,
	Headers,
} from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer, Schema } from "effect";
import {
	randomDelay,
	generateDataResponse,
	generateUsers,
	generateUserById,
	generateProducts,
	generateProductById,
	generateStats,
	generateSubmitResponse,
	generateCreatedUser,
	generateOrder,
	generateOrderById,
	generateProcessedItems,
	generateSearchResults,
	generateBulkCreateResult,
	generateAnalytics,
	generateSessionData,
	generateCartData,
	generateSessionId,
	generateTrackingId,
} from "./shared";

const PORT = 3000;

const getCookieValue = (
	cookieHeader: string | undefined,
	name: string,
): string | null => {
	if (!cookieHeader) return null;
	const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
	return match ? match[1] : null;
};

const buildCookieHeaders = (
	cookies: Array<{
		name: string;
		value: string;
		maxAge?: number;
		path?: string;
		httpOnly?: boolean;
	}>,
) => {
	return cookies.map((c) => {
		let cookie = `${c.name}=${c.value}`;
		if (c.maxAge) cookie += `; Max-Age=${c.maxAge}`;
		if (c.path) cookie += `; Path=${c.path}`;
		if (c.httpOnly) cookie += `; HttpOnly`;
		return cookie;
	});
};

const getDataHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const headers = request.headers;
	const cookieHeader = headers.cookie;
	const sessionId = getCookieValue(cookieHeader, "sessionId");
	const trackingId = getCookieValue(cookieHeader, "trackingId");

	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);

	const sessionData = generateSessionData(sessionId, trackingId);
	const cookies = buildCookieHeaders([
		{
			name: "sessionId",
			value: sessionData.sessionId,
			maxAge: 3600,
			path: "/",
			httpOnly: true,
		},
		{
			name: "trackingId",
			value: sessionData.trackingId,
			maxAge: 31536000,
			path: "/",
		},
		{ name: "lastVisit", value: new Date().toISOString(), path: "/" },
	]);

	return yield* HttpServerResponse.json(
		{
			...generateDataResponse(),
			session: sessionData,
			timestamp: Date.now(),
			delay,
		},
		{ headers: Headers.fromInput({ "Set-Cookie": cookies.join(", ") }) },
	);
});

const getUsersHandler = Effect.gen(function* () {
	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);
	const users = generateUsers(10);
	return yield* HttpServerResponse.json({
		users,
		total: users.length,
		timestamp: Date.now(),
		delay,
	});
});

const getUserByIdHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const url = new URL(request.url, "http://localhost");
	const id = url.pathname.split("/").pop() || "0";

	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);

	return yield* HttpServerResponse.json({
		user: generateUserById(id),
		timestamp: Date.now(),
		delay,
	});
});

const getProductsHandler = Effect.gen(function* () {
	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);
	const products = generateProducts(10);
	return yield* HttpServerResponse.json({
		products,
		total: products.length,
		timestamp: Date.now(),
		delay,
	});
});

const getProductByIdHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const url = new URL(request.url, "http://localhost");
	const id = url.pathname.split("/").pop() || "0";

	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);

	return yield* HttpServerResponse.json({
		product: generateProductById(id),
		timestamp: Date.now(),
		delay,
	});
});

const getProductsByCategoryHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const url = new URL(request.url, "http://localhost");
	const pathParts = url.pathname.split("/");
	const category = decodeURIComponent(pathParts[pathParts.length - 2] || "");

	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);
	const products = generateProducts(8).map((p) => ({ ...p, category }));

	return yield* HttpServerResponse.json({
		category,
		products,
		total: products.length,
		timestamp: Date.now(),
		delay,
	});
});

const getStatsHandler = Effect.gen(function* () {
	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);
	return yield* HttpServerResponse.json({
		...generateStats(),
		timestamp: Date.now(),
		delay,
	});
});

const getOrderByIdHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const url = new URL(request.url, "http://localhost");
	const id = url.pathname.split("/").pop() || "0";

	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);

	return yield* HttpServerResponse.json({
		order: generateOrderById(id),
		timestamp: Date.now(),
		delay,
	});
});

const getCartHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const headers = request.headers;
	const cookieHeader = headers.cookie;
	const sessionId =
		getCookieValue(cookieHeader, "sessionId") || generateSessionId();

	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);

	const cookies = buildCookieHeaders([
		{
			name: "sessionId",
			value: sessionId,
			maxAge: 3600,
			path: "/",
			httpOnly: true,
		},
	]);

	return yield* HttpServerResponse.json(
		{ cart: generateCartData(sessionId), timestamp: Date.now(), delay },
		{ headers: Headers.fromInput({ "Set-Cookie": cookies.join(", ") }) },
	);
});

const SubmitBody = Schema.Struct({
	data: Schema.String,
});

const postSubmitHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const body = yield* request.json;
	const parsed = yield* Schema.decodeUnknown(SubmitBody)(body);
	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);
	return yield* HttpServerResponse.json({
		...generateSubmitResponse(parsed.data),
		timestamp: Date.now(),
		delay,
	});
});

const CreateUserBody = Schema.Struct({
	name: Schema.String,
	email: Schema.String,
	password: Schema.String,
	profile: Schema.optional(
		Schema.Struct({
			bio: Schema.optional(Schema.String),
			avatar: Schema.optional(Schema.String),
		}),
	),
	preferences: Schema.optional(
		Schema.Struct({
			theme: Schema.optional(Schema.String),
			language: Schema.optional(Schema.String),
		}),
	),
	address: Schema.optional(
		Schema.Struct({
			street: Schema.optional(Schema.String),
			city: Schema.optional(Schema.String),
			country: Schema.optional(Schema.String),
		}),
	),
});

const postCreateUserHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const body = yield* request.json;
	const parsed = yield* Schema.decodeUnknown(CreateUserBody)(body);
	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);

	const newSessionId = generateSessionId();
	const newTrackingId = generateTrackingId();
	const cookies = buildCookieHeaders([
		{
			name: "sessionId",
			value: newSessionId,
			maxAge: 3600,
			path: "/",
			httpOnly: true,
		},
		{ name: "trackingId", value: newTrackingId, maxAge: 31536000, path: "/" },
		{
			name: "userId",
			value: String(Math.floor(Math.random() * 100000)),
			maxAge: 31536000,
			path: "/",
		},
	]);

	return yield* HttpServerResponse.json(
		{
			message: "User created successfully",
			user: generateCreatedUser(parsed),
			timestamp: Date.now(),
			delay,
		},
		{ headers: Headers.fromInput({ "Set-Cookie": cookies.join(", ") }) },
	);
});

const CreateOrderBody = Schema.Struct({
	items: Schema.Array(
		Schema.Struct({
			productId: Schema.Number,
			quantity: Schema.Number,
			options: Schema.optional(
				Schema.Struct({
					color: Schema.optional(Schema.String),
					size: Schema.optional(Schema.String),
				}),
			),
		}),
	),
	shippingAddress: Schema.Struct({
		street: Schema.String,
		city: Schema.String,
		country: Schema.String,
		postalCode: Schema.String,
	}),
	paymentMethod: Schema.Struct({
		type: Schema.String,
		cardLast4: Schema.optional(Schema.String),
	}),
	couponCode: Schema.optional(Schema.String),
});

const postCreateOrderHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const headers = request.headers;
	const cookieHeader = headers.cookie;
	const sessionId = getCookieValue(cookieHeader, "sessionId");
	const userId = getCookieValue(cookieHeader, "userId");

	const body = yield* request.json;
	const parsed = yield* Schema.decodeUnknown(CreateOrderBody)(body);
	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);

	const cookies = buildCookieHeaders([
		{ name: "lastOrderAt", value: new Date().toISOString(), path: "/" },
		{ name: "cartCleared", value: "true", maxAge: 60, path: "/" },
	]);

	return yield* HttpServerResponse.json(
		{
			message: "Order created successfully",
			order: generateOrder({
				...parsed,
				items: parsed.items.map((item) => ({
					...item,
					options: item.options ? { ...item.options } : undefined,
				})),
			}),
			session: { sessionId, userId },
			timestamp: Date.now(),
			delay,
		},
		{ headers: Headers.fromInput({ "Set-Cookie": cookies.join(", ") }) },
	);
});

const ProcessBody = Schema.Struct({
	items: Schema.Array(
		Schema.Struct({
			id: Schema.String,
			type: Schema.String,
			data: Schema.Unknown,
		}),
	),
	options: Schema.optional(
		Schema.Struct({
			parallel: Schema.optional(Schema.Boolean),
			validate: Schema.optional(Schema.Boolean),
			transform: Schema.optional(Schema.Boolean),
		}),
	),
});

const postProcessHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const body = yield* request.json;
	const parsed = yield* Schema.decodeUnknown(ProcessBody)(body);
	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);
	return yield* HttpServerResponse.json({
		message: "Items processed successfully",
		processedCount: parsed.items.length,
		options: parsed.options || {},
		results: generateProcessedItems(Array.from(parsed.items)),
		timestamp: Date.now(),
		delay,
	});
});

const SearchBody = Schema.Struct({
	query: Schema.String,
	filters: Schema.optional(
		Schema.Struct({
			category: Schema.optional(Schema.String),
			minPrice: Schema.optional(Schema.Number),
			maxPrice: Schema.optional(Schema.Number),
			tags: Schema.optional(Schema.Array(Schema.String)),
		}),
	),
	pagination: Schema.optional(
		Schema.Struct({
			page: Schema.optional(Schema.Number),
			perPage: Schema.optional(Schema.Number),
		}),
	),
	sort: Schema.optional(
		Schema.Struct({
			field: Schema.optional(Schema.String),
			order: Schema.optional(Schema.String),
		}),
	),
});

const postSearchHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const headers = request.headers;
	const cookieHeader = headers.cookie;
	const sessionId =
		getCookieValue(cookieHeader, "sessionId") || generateSessionId();

	const body = yield* request.json;
	const parsed = yield* Schema.decodeUnknown(SearchBody)(body);
	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);

	const cookies = buildCookieHeaders([
		{ name: "lastSearch", value: encodeURIComponent(parsed.query), path: "/" },
		{
			name: "sessionId",
			value: sessionId,
			maxAge: 3600,
			path: "/",
			httpOnly: true,
		},
	]);

	const filters = parsed.filters
		? {
				...parsed.filters,
				tags: parsed.filters.tags ? [...parsed.filters.tags] : undefined,
			}
		: {};

	return yield* HttpServerResponse.json(
		{
			...generateSearchResults(parsed.query, filters),
			timestamp: Date.now(),
			delay,
		},
		{ headers: Headers.fromInput({ "Set-Cookie": cookies.join(", ") }) },
	);
});

const BulkCreateBody = Schema.Struct({
	items: Schema.Array(
		Schema.Struct({
			type: Schema.String,
			data: Schema.Unknown,
		}),
	),
	options: Schema.optional(
		Schema.Struct({
			stopOnError: Schema.optional(Schema.Boolean),
			validate: Schema.optional(Schema.Boolean),
			dryRun: Schema.optional(Schema.Boolean),
		}),
	),
});

const postBulkCreateHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const body = yield* request.json;
	const parsed = yield* Schema.decodeUnknown(BulkCreateBody)(body);
	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);
	return yield* HttpServerResponse.json({
		...generateBulkCreateResult(Array.from(parsed.items)),
		options: parsed.options || {},
		timestamp: Date.now(),
		delay,
	});
});

const AnalyticsBody = Schema.Struct({
	startDate: Schema.String,
	endDate: Schema.String,
	metrics: Schema.Array(Schema.String),
	groupBy: Schema.optional(Schema.String),
	filters: Schema.optional(
		Schema.Struct({
			region: Schema.optional(Schema.String),
			platform: Schema.optional(Schema.String),
			userSegment: Schema.optional(Schema.String),
		}),
	),
});

const postAnalyticsHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const headers = request.headers;
	const cookieHeader = headers.cookie;
	const trackingId =
		getCookieValue(cookieHeader, "trackingId") || generateTrackingId();

	const body = yield* request.json;
	const parsed = yield* Schema.decodeUnknown(AnalyticsBody)(body);
	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);

	const cookies = buildCookieHeaders([
		{ name: "trackingId", value: trackingId, maxAge: 31536000, path: "/" },
		{ name: "analyticsViewed", value: new Date().toISOString(), path: "/" },
	]);

	return yield* HttpServerResponse.json(
		{
			...generateAnalytics({
				...parsed,
				metrics: [...parsed.metrics],
			}),
			trackingId,
			timestamp: Date.now(),
			delay,
		},
		{ headers: Headers.fromInput({ "Set-Cookie": cookies.join(", ") }) },
	);
});

const UpdateCartBody = Schema.Struct({
	action: Schema.String,
	items: Schema.optional(
		Schema.Array(
			Schema.Struct({
				productId: Schema.Number,
				quantity: Schema.Number,
				options: Schema.optional(
					Schema.Struct({
						color: Schema.optional(Schema.String),
						size: Schema.optional(Schema.String),
					}),
				),
			}),
		),
	),
});

const postUpdateCartHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const headers = request.headers;
	const cookieHeader = headers.cookie;
	const sessionId =
		getCookieValue(cookieHeader, "sessionId") || generateSessionId();

	const body = yield* request.json;
	const parsed = yield* Schema.decodeUnknown(UpdateCartBody)(body);
	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);

	const cookies = buildCookieHeaders([
		{
			name: "sessionId",
			value: sessionId,
			maxAge: 3600,
			path: "/",
			httpOnly: true,
		},
		{ name: "cartUpdated", value: new Date().toISOString(), path: "/" },
	]);

	return yield* HttpServerResponse.json(
		{
			action: parsed.action,
			cart: generateCartData(sessionId),
			timestamp: Date.now(),
			delay,
		},
		{ headers: Headers.fromInput({ "Set-Cookie": cookies.join(", ") }) },
	);
});

const router = HttpRouter.empty.pipe(
	HttpRouter.get("/api/data", getDataHandler),
	HttpRouter.get("/api/users", getUsersHandler),
	HttpRouter.get("/api/users/:id", getUserByIdHandler),
	HttpRouter.get("/api/products", getProductsHandler),
	HttpRouter.get("/api/products/:id", getProductByIdHandler),
	HttpRouter.get(
		"/api/categories/:category/products",
		getProductsByCategoryHandler,
	),
	HttpRouter.get("/api/stats", getStatsHandler),
	HttpRouter.get("/api/orders/:id", getOrderByIdHandler),
	HttpRouter.get("/api/cart", getCartHandler),
	HttpRouter.post("/api/submit", postSubmitHandler),
	HttpRouter.post("/api/users", postCreateUserHandler),
	HttpRouter.post("/api/orders", postCreateOrderHandler),
	HttpRouter.post("/api/process", postProcessHandler),
	HttpRouter.post("/api/search", postSearchHandler),
	HttpRouter.post("/api/bulk", postBulkCreateHandler),
	HttpRouter.post("/api/analytics", postAnalyticsHandler),
	HttpRouter.post("/api/cart", postUpdateCartHandler),
);

const app = router.pipe(
	HttpServer.serve(),
	HttpServer.withLogAddress,
	Layer.provide(BunHttpServer.layer({ port: PORT })),
);

BunRuntime.runMain(Layer.launch(app));
