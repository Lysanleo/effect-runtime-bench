import {
	generateAnalytics,
	generateBulkCreateResult,
	generateCartData,
	generateCreatedUser,
	generateDataResponse,
	generateOrder,
	generateOrderById,
	generateProcessedItems,
	generateProductById,
	generateProducts,
	generateSearchResults,
	generateSessionData,
	generateSessionId,
	generateStats,
	generateSubmitResponse,
	generateTrackingId,
	generateUserById,
	generateUsers,
} from "./shared";

export interface ResponseCookie {
	readonly name: string;
	readonly value: string;
	readonly maxAge?: number;
	readonly path?: string;
	readonly httpOnly?: boolean;
}

export interface ScenarioResponse<A> {
	readonly body: A;
	readonly cookies?: ReadonlyArray<ResponseCookie>;
}

interface WithDelay {
	readonly delay: number;
}

type CreateUserInput = Parameters<typeof generateCreatedUser>[0];

interface CreateOrderInput {
	readonly items: ReadonlyArray<{
		readonly productId: number;
		readonly quantity: number;
		readonly options?: {
			readonly color?: string;
			readonly size?: string;
		};
	}>;
	readonly shippingAddress: {
		readonly street: string;
		readonly city: string;
		readonly country: string;
		readonly postalCode: string;
	};
	readonly paymentMethod: {
		readonly type: string;
		readonly cardLast4?: string;
	};
	readonly couponCode?: string;
}

interface ProcessInput {
	readonly items: ReadonlyArray<{
		readonly id: string;
		readonly type: string;
		readonly data: unknown;
	}>;
	readonly options?: object;
}

interface SearchInput {
	readonly query: string;
	readonly filters?: {
		readonly category?: string;
		readonly minPrice?: number;
		readonly maxPrice?: number;
		readonly tags?: ReadonlyArray<string>;
	};
}

interface BulkCreateInput {
	readonly items: ReadonlyArray<{
		readonly type: string;
		readonly data: unknown;
	}>;
	readonly options?: object;
}

interface AnalyticsInput {
	readonly startDate: string;
	readonly endDate: string;
	readonly metrics: ReadonlyArray<string>;
	readonly groupBy?: string;
}

interface UpdateCartInput {
	readonly action: string;
}

const response = <A>(
	body: A,
	cookies?: ReadonlyArray<ResponseCookie>,
): ScenarioResponse<A> => ({ body, cookies });

export const getData = (
	input: WithDelay & {
		readonly sessionId: string | null;
		readonly trackingId: string | null;
	},
) => {
	const session = generateSessionData(input.sessionId, input.trackingId);

	return response(
		{
			...generateDataResponse(),
			session,
			timestamp: Date.now(),
			delay: input.delay,
		},
		[
			{
				name: "sessionId",
				value: session.sessionId,
				maxAge: 3600,
				path: "/",
				httpOnly: true,
			},
			{
				name: "trackingId",
				value: session.trackingId,
				maxAge: 31536000,
				path: "/",
			},
			{ name: "lastVisit", value: new Date().toISOString(), path: "/" },
		],
	);
};

export const getUsers = (input: WithDelay) => {
	const users = generateUsers(10);
	return response({
		users,
		total: users.length,
		timestamp: Date.now(),
		delay: input.delay,
	});
};

export const getUserById = (input: WithDelay & { readonly id: string }) =>
	response({
		user: generateUserById(input.id),
		timestamp: Date.now(),
		delay: input.delay,
	});

export const getProducts = (input: WithDelay) => {
	const products = generateProducts(10);
	return response({
		products,
		total: products.length,
		timestamp: Date.now(),
		delay: input.delay,
	});
};

export const getProductById = (input: WithDelay & { readonly id: string }) =>
	response({
		product: generateProductById(input.id),
		timestamp: Date.now(),
		delay: input.delay,
	});

export const getProductsByCategory = (
	input: WithDelay & { readonly category: string },
) => {
	const products = generateProducts(8).map((p) => ({
		...p,
		category: input.category,
	}));
	return response({
		category: input.category,
		products,
		total: products.length,
		timestamp: Date.now(),
		delay: input.delay,
	});
};

export const getStats = (input: WithDelay) =>
	response({
		...generateStats(),
		timestamp: Date.now(),
		delay: input.delay,
	});

export const getOrderById = (input: WithDelay & { readonly id: string }) =>
	response({
		order: generateOrderById(input.id),
		timestamp: Date.now(),
		delay: input.delay,
	});

export const getCart = (
	input: WithDelay & { readonly sessionId: string | null },
) => {
	const sessionId = input.sessionId ?? generateSessionId();

	return response(
		{ cart: generateCartData(sessionId), timestamp: Date.now(), delay: input.delay },
		[
			{
				name: "sessionId",
				value: sessionId,
				maxAge: 3600,
				path: "/",
				httpOnly: true,
			},
		],
	);
};

export const postSubmit = (
	input: WithDelay & { readonly body: { readonly data: string } },
) =>
	response({
		...generateSubmitResponse(input.body.data),
		timestamp: Date.now(),
		delay: input.delay,
	});

export const postCreateUser = (
	input: WithDelay & { readonly body: CreateUserInput },
) => {
	const sessionId = generateSessionId();
	const trackingId = generateTrackingId();

	return response(
		{
			message: "User created successfully",
			user: generateCreatedUser(input.body),
			timestamp: Date.now(),
			delay: input.delay,
		},
		[
			{
				name: "sessionId",
				value: sessionId,
				maxAge: 3600,
				path: "/",
				httpOnly: true,
			},
			{ name: "trackingId", value: trackingId, maxAge: 31536000, path: "/" },
			{
				name: "userId",
				value: String(Math.floor(Math.random() * 100000)),
				maxAge: 31536000,
				path: "/",
			},
		],
	);
};

export const postCreateOrder = (
	input: WithDelay & {
		readonly body: CreateOrderInput;
		readonly sessionId: string | null;
		readonly userId: string | null;
	},
) =>
	response(
		{
			message: "Order created successfully",
			order: generateOrder({
				...input.body,
				items: input.body.items.map((item) => ({
					...item,
					options: item.options ? { ...item.options } : undefined,
				})),
			}),
			session: { sessionId: input.sessionId, userId: input.userId },
			timestamp: Date.now(),
			delay: input.delay,
		},
		[
			{ name: "lastOrderAt", value: new Date().toISOString(), path: "/" },
			{ name: "cartCleared", value: "true", maxAge: 60, path: "/" },
		],
	);

export const postProcess = (
	input: WithDelay & { readonly body: ProcessInput },
) =>
	response({
		message: "Items processed successfully",
		processedCount: input.body.items.length,
		options: input.body.options || {},
		results: generateProcessedItems(Array.from(input.body.items)),
		timestamp: Date.now(),
		delay: input.delay,
	});

export const postSearch = (
	input: WithDelay & {
		readonly body: SearchInput;
		readonly sessionId: string | null;
	},
) => {
	const sessionId = input.sessionId ?? generateSessionId();
	const filters = input.body.filters
		? {
				...input.body.filters,
				tags: input.body.filters.tags
					? Array.from(input.body.filters.tags)
					: undefined,
			}
		: {};

	return response(
		{
			...generateSearchResults(input.body.query, filters),
			timestamp: Date.now(),
			delay: input.delay,
		},
		[
			{ name: "lastSearch", value: encodeURIComponent(input.body.query), path: "/" },
			{
				name: "sessionId",
				value: sessionId,
				maxAge: 3600,
				path: "/",
				httpOnly: true,
			},
		],
	);
};

export const postBulkCreate = (
	input: WithDelay & { readonly body: BulkCreateInput },
) =>
	response({
		...generateBulkCreateResult(Array.from(input.body.items)),
		options: input.body.options || {},
		timestamp: Date.now(),
		delay: input.delay,
	});

export const postAnalytics = (
	input: WithDelay & {
		readonly body: AnalyticsInput;
		readonly trackingId: string | null;
	},
) => {
	const trackingId = input.trackingId ?? generateTrackingId();

	return response(
		{
			...generateAnalytics({
				...input.body,
				metrics: Array.from(input.body.metrics),
			}),
			trackingId,
			timestamp: Date.now(),
			delay: input.delay,
		},
		[
			{ name: "trackingId", value: trackingId, maxAge: 31536000, path: "/" },
			{ name: "analyticsViewed", value: new Date().toISOString(), path: "/" },
		],
	);
};

export const postUpdateCart = (
	input: WithDelay & {
		readonly body: UpdateCartInput;
		readonly sessionId: string | null;
	},
) => {
	const sessionId = input.sessionId ?? generateSessionId();

	return response(
		{
			action: input.body.action,
			cart: generateCartData(sessionId),
			timestamp: Date.now(),
			delay: input.delay,
		},
		[
			{
				name: "sessionId",
				value: sessionId,
				maxAge: 3600,
				path: "/",
				httpOnly: true,
			},
			{ name: "cartUpdated", value: new Date().toISOString(), path: "/" },
		],
	);
};
