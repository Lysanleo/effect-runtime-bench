import {
	HttpRouter,
	HttpServer,
	HttpServerResponse,
	HttpServerRequest,
} from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer, Schema } from "effect";
import {
	randomDelay,
	generateDataResponse,
	generateUsers,
	generateProducts,
	generateStats,
	generateSubmitResponse,
	generateCreatedUser,
	generateOrder,
	generateProcessedItems,
} from "./shared";

const PORT = 3000;

const getDataHandler = Effect.gen(function* () {
	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);
	return yield* HttpServerResponse.json({
		...generateDataResponse(),
		timestamp: Date.now(),
		delay,
	});
});

const getUsersHandler = Effect.gen(function* () {
	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);
	const users = generateUsers();
	return yield* HttpServerResponse.json({
		users,
		total: users.length,
		timestamp: Date.now(),
		delay,
	});
});

const getProductsHandler = Effect.gen(function* () {
	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);
	const products = generateProducts();
	return yield* HttpServerResponse.json({
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
});

const postCreateUserHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const body = yield* request.json;
	const parsed = yield* Schema.decodeUnknown(CreateUserBody)(body);
	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);
	return yield* HttpServerResponse.json({
		message: "User created successfully",
		user: generateCreatedUser(parsed.name, parsed.email),
		timestamp: Date.now(),
		delay,
	});
});

const CreateOrderBody = Schema.Struct({
	productId: Schema.Number,
	quantity: Schema.Number,
});

const postCreateOrderHandler = Effect.gen(function* () {
	const request = yield* HttpServerRequest.HttpServerRequest;
	const body = yield* request.json;
	const parsed = yield* Schema.decodeUnknown(CreateOrderBody)(body);
	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);
	return yield* HttpServerResponse.json({
		message: "Order created successfully",
		order: generateOrder(parsed.productId, parsed.quantity),
		timestamp: Date.now(),
		delay,
	});
});

const ProcessBody = Schema.Struct({
	items: Schema.Array(Schema.String),
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
		results: generateProcessedItems(Array.from(parsed.items)),
		timestamp: Date.now(),
		delay,
	});
});

const router = HttpRouter.empty.pipe(
	HttpRouter.get("/api/data", getDataHandler),
	HttpRouter.get("/api/users", getUsersHandler),
	HttpRouter.get("/api/products", getProductsHandler),
	HttpRouter.get("/api/stats", getStatsHandler),
	HttpRouter.post("/api/submit", postSubmitHandler),
	HttpRouter.post("/api/users", postCreateUserHandler),
	HttpRouter.post("/api/orders", postCreateOrderHandler),
	HttpRouter.post("/api/process", postProcessHandler),
);

const app = router.pipe(
	HttpServer.serve(),
	HttpServer.withLogAddress,
	Layer.provide(BunHttpServer.layer({ port: PORT })),
);

BunRuntime.runMain(Layer.launch(app));
