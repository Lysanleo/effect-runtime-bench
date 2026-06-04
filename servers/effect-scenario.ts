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

export type {
	ResponseCookie,
	ScenarioResponse as EffectScenarioResponse,
} from "./scenario";

const withDelay = Effect.gen(function* () {
	const delay = randomDelay();
	yield* Effect.sleep(`${delay} millis`);
	return delay;
});

export const getData = (input: {
	readonly sessionId: string | null;
	readonly trackingId: string | null;
}) =>
	Effect.gen(function* () {
		const delay = yield* withDelay;
		return Scenario.getData({ ...input, delay });
	});

export const getUsers = Effect.gen(function* () {
	const delay = yield* withDelay;
	return Scenario.getUsers({ delay });
});

export const getUserById = (id: string) =>
	Effect.gen(function* () {
		const delay = yield* withDelay;
		return Scenario.getUserById({ id, delay });
	});

export const getProducts = Effect.gen(function* () {
	const delay = yield* withDelay;
	return Scenario.getProducts({ delay });
});

export const getProductById = (id: string) =>
	Effect.gen(function* () {
		const delay = yield* withDelay;
		return Scenario.getProductById({ id, delay });
	});

export const getProductsByCategory = (category: string) =>
	Effect.gen(function* () {
		const delay = yield* withDelay;
		return Scenario.getProductsByCategory({ category, delay });
	});

export const getStats = Effect.gen(function* () {
	const delay = yield* withDelay;
	return Scenario.getStats({ delay });
});

export const getOrderById = (id: string) =>
	Effect.gen(function* () {
		const delay = yield* withDelay;
		return Scenario.getOrderById({ id, delay });
	});

export const getCart = (input: { readonly sessionId: string | null }) =>
	Effect.gen(function* () {
		const delay = yield* withDelay;
		return Scenario.getCart({ ...input, delay });
	});

export const postSubmit = (body: unknown) =>
	Effect.gen(function* () {
		const parsed = yield* Schema.decodeUnknownEffect(SubmitBody)(body);
		const delay = yield* withDelay;
		return Scenario.postSubmit({ body: parsed, delay });
	});

export const postCreateUser = (body: unknown) =>
	Effect.gen(function* () {
		const parsed = yield* Schema.decodeUnknownEffect(CreateUserBody)(body);
		const delay = yield* withDelay;
		return Scenario.postCreateUser({ body: parsed, delay });
	});

export const postCreateOrder = (input: {
	readonly body: unknown;
	readonly sessionId: string | null;
	readonly userId: string | null;
}) =>
	Effect.gen(function* () {
		const parsed = yield* Schema.decodeUnknownEffect(CreateOrderBody)(input.body);
		const delay = yield* withDelay;
		return Scenario.postCreateOrder({
			body: parsed,
			sessionId: input.sessionId,
			userId: input.userId,
			delay,
		});
	});

export const postProcess = (body: unknown) =>
	Effect.gen(function* () {
		const parsed = yield* Schema.decodeUnknownEffect(ProcessBody)(body);
		const delay = yield* withDelay;
		return Scenario.postProcess({ body: parsed, delay });
	});

export const postSearch = (input: {
	readonly body: unknown;
	readonly sessionId: string | null;
}) =>
	Effect.gen(function* () {
		const parsed = yield* Schema.decodeUnknownEffect(SearchBody)(input.body);
		const delay = yield* withDelay;
		return Scenario.postSearch({
			body: parsed,
			sessionId: input.sessionId,
			delay,
		});
	});

export const postBulkCreate = (body: unknown) =>
	Effect.gen(function* () {
		const parsed = yield* Schema.decodeUnknownEffect(BulkCreateBody)(body);
		const delay = yield* withDelay;
		return Scenario.postBulkCreate({ body: parsed, delay });
	});

export const postAnalytics = (input: {
	readonly body: unknown;
	readonly trackingId: string | null;
}) =>
	Effect.gen(function* () {
		const parsed = yield* Schema.decodeUnknownEffect(AnalyticsBody)(input.body);
		const delay = yield* withDelay;
		return Scenario.postAnalytics({
			body: parsed,
			trackingId: input.trackingId,
			delay,
		});
	});

export const postUpdateCart = (input: {
	readonly body: unknown;
	readonly sessionId: string | null;
}) =>
	Effect.gen(function* () {
		const parsed = yield* Schema.decodeUnknownEffect(UpdateCartBody)(input.body);
		const delay = yield* withDelay;
		return Scenario.postUpdateCart({
			body: parsed,
			sessionId: input.sessionId,
			delay,
		});
	});
