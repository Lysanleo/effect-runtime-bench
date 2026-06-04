import {
	Headers,
	HttpRouter,
	HttpServerRequest,
	HttpServerResponse,
} from "effect/unstable/http";
import { Effect, Schema } from "effect";
import {
	AnalyticsBody,
	BulkCreateBody,
	CreateOrderBody,
	CreateUserBody,
	ProcessBody,
	SearchBody,
	SubmitBody,
	UpdateCartBody,
} from "./effect-schemas";
import { randomDelay } from "./shared";
import * as Scenario from "./scenario";

const withDelay = Effect.gen(function* () {
	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);
	return delay;
});

const buildCookieHeaders = (cookies: ReadonlyArray<Scenario.ResponseCookie>) =>
	cookies.map((c) => {
		let cookie = `${c.name}=${c.value}`;
		if (c.maxAge) cookie += `; Max-Age=${c.maxAge}`;
		if (c.path) cookie += `; Path=${c.path}`;
		if (c.httpOnly) cookie += `; HttpOnly`;
		return cookie;
	});

const jsonResponse = <A>(result: Scenario.ScenarioResponse<A>) => {
	if (result.cookies?.length) {
		return HttpServerResponse.json(result.body, {
			headers: Headers.fromInput({
				"Set-Cookie": buildCookieHeaders(result.cookies).join(", "),
			}),
		});
	}

	return HttpServerResponse.json(result.body);
};

const getRequestId = (request: HttpServerRequest.HttpServerRequest) => {
	const url = new URL(request.url, "http://localhost");
	return url.pathname.split("/").pop() || "0";
};

const getDataHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const delay = yield* withDelay;

	return yield* jsonResponse(
		Scenario.getData({
			sessionId: request.cookies.sessionId ?? null,
			trackingId: request.cookies.trackingId ?? null,
			delay,
		}),
	);
});

const getUsersHandler = Effect.gen(function* () {
	const delay = yield* withDelay;
	return yield* jsonResponse(Scenario.getUsers({ delay }));
});

const getUserByIdHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const delay = yield* withDelay;
	return yield* jsonResponse(
		Scenario.getUserById({ id: getRequestId(request), delay }),
	);
});

const getProductsHandler = Effect.gen(function* () {
	const delay = yield* withDelay;
	return yield* jsonResponse(Scenario.getProducts({ delay }));
});

const getProductByIdHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const delay = yield* withDelay;
	return yield* jsonResponse(
		Scenario.getProductById({ id: getRequestId(request), delay }),
	);
});

const getProductsByCategoryHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const url = new URL(request.url, "http://localhost");
	const pathParts = url.pathname.split("/");
	const category = decodeURIComponent(pathParts[pathParts.length - 2] || "");
	const delay = yield* withDelay;

	return yield* jsonResponse(
		Scenario.getProductsByCategory({ category, delay }),
	);
});

const getStatsHandler = Effect.gen(function* () {
	const delay = yield* withDelay;
	return yield* jsonResponse(Scenario.getStats({ delay }));
});

const getOrderByIdHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const delay = yield* withDelay;
	return yield* jsonResponse(
		Scenario.getOrderById({ id: getRequestId(request), delay }),
	);
});

const getCartHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const delay = yield* withDelay;

	return yield* jsonResponse(
		Scenario.getCart({
			sessionId: request.cookies.sessionId ?? null,
			delay,
		}),
	);
});

const postSubmitHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const body = yield* request.json;
	const parsed = yield* Schema.decodeUnknownEffect(SubmitBody)(body);
	const delay = yield* withDelay;
	return yield* jsonResponse(Scenario.postSubmit({ body: parsed, delay }));
});

const postCreateUserHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const body = yield* request.json;
	const parsed = yield* Schema.decodeUnknownEffect(CreateUserBody)(body);
	const delay = yield* withDelay;
	return yield* jsonResponse(Scenario.postCreateUser({ body: parsed, delay }));
});

const postCreateOrderHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const body = yield* request.json;
	const parsed = yield* Schema.decodeUnknownEffect(CreateOrderBody)(body);
	const delay = yield* withDelay;

	return yield* jsonResponse(
		Scenario.postCreateOrder({
			body: parsed,
			sessionId: request.cookies.sessionId ?? null,
			userId: request.cookies.userId ?? null,
			delay,
		}),
	);
});

const postProcessHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const body = yield* request.json;
	const parsed = yield* Schema.decodeUnknownEffect(ProcessBody)(body);
	const delay = yield* withDelay;
	return yield* jsonResponse(Scenario.postProcess({ body: parsed, delay }));
});

const postSearchHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const body = yield* request.json;
	const parsed = yield* Schema.decodeUnknownEffect(SearchBody)(body);
	const delay = yield* withDelay;

	return yield* jsonResponse(
		Scenario.postSearch({
			body: parsed,
			sessionId: request.cookies.sessionId ?? null,
			delay,
		}),
	);
});

const postBulkCreateHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const body = yield* request.json;
	const parsed = yield* Schema.decodeUnknownEffect(BulkCreateBody)(body);
	const delay = yield* withDelay;
	return yield* jsonResponse(Scenario.postBulkCreate({ body: parsed, delay }));
});

const postAnalyticsHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const body = yield* request.json;
	const parsed = yield* Schema.decodeUnknownEffect(AnalyticsBody)(body);
	const delay = yield* withDelay;

	return yield* jsonResponse(
		Scenario.postAnalytics({
			body: parsed,
			trackingId: request.cookies.trackingId ?? null,
			delay,
		}),
	);
});

const postUpdateCartHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const body = yield* request.json;
	const parsed = yield* Schema.decodeUnknownEffect(UpdateCartBody)(body);
	const delay = yield* withDelay;

	return yield* jsonResponse(
		Scenario.postUpdateCart({
			body: parsed,
			sessionId: request.cookies.sessionId ?? null,
			delay,
		}),
	);
});

export const effectHttpRoutes = HttpRouter.addAll([
	HttpRouter.route("GET", "/api/data", getDataHandler),
	HttpRouter.route("GET", "/api/users", getUsersHandler),
	HttpRouter.route("GET", "/api/users/:id", getUserByIdHandler),
	HttpRouter.route("GET", "/api/products", getProductsHandler),
	HttpRouter.route("GET", "/api/products/:id", getProductByIdHandler),
	HttpRouter.route(
		"GET",
		"/api/categories/:category/products",
		getProductsByCategoryHandler,
	),
	HttpRouter.route("GET", "/api/stats", getStatsHandler),
	HttpRouter.route("GET", "/api/orders/:id", getOrderByIdHandler),
	HttpRouter.route("GET", "/api/cart", getCartHandler),
	HttpRouter.route("POST", "/api/submit", postSubmitHandler),
	HttpRouter.route("POST", "/api/users", postCreateUserHandler),
	HttpRouter.route("POST", "/api/orders", postCreateOrderHandler),
	HttpRouter.route("POST", "/api/process", postProcessHandler),
	HttpRouter.route("POST", "/api/search", postSearchHandler),
	HttpRouter.route("POST", "/api/bulk", postBulkCreateHandler),
	HttpRouter.route("POST", "/api/analytics", postAnalyticsHandler),
	HttpRouter.route("POST", "/api/cart", postUpdateCartHandler),
]);

export const effectHttpApp = HttpRouter.serve(effectHttpRoutes, {
	disableLogger: true,
});
