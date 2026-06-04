import { Elysia, t } from "elysia";
import {
	randomDelay,
	sleep,
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

const PORT = 3001;

const cookieValue = (value: unknown): string | null =>
	typeof value === "string" ? value : null;

const app = new Elysia()
	.get("/api/data", async ({ cookie, set }) => {
		const sessionId = cookieValue(cookie.sessionId?.value);
		const trackingId = cookieValue(cookie.trackingId?.value);

		const delay = randomDelay();
		await sleep(delay);

		const sessionData = generateSessionData(sessionId, trackingId);

		cookie.sessionId.set({
			value: sessionData.sessionId,
			maxAge: 3600,
			path: "/",
			httpOnly: true,
		});
		cookie.trackingId.set({
			value: sessionData.trackingId,
			maxAge: 31536000,
			path: "/",
		});
		cookie.lastVisit.set({
			value: new Date().toISOString(),
			path: "/",
		});

		return {
			...generateDataResponse(),
			session: sessionData,
			timestamp: Date.now(),
			delay,
		};
	})
	.get("/api/users", async () => {
		const delay = randomDelay();
		await sleep(delay);
		const users = generateUsers(10);
		return {
			users,
			total: users.length,
			timestamp: Date.now(),
			delay,
		};
	})
	.get("/api/users/:id", async ({ params }) => {
		const delay = randomDelay();
		await sleep(delay);
		return {
			user: generateUserById(params.id),
			timestamp: Date.now(),
			delay,
		};
	})
	.get("/api/products", async () => {
		const delay = randomDelay();
		await sleep(delay);
		const products = generateProducts(10);
		return {
			products,
			total: products.length,
			timestamp: Date.now(),
			delay,
		};
	})
	.get("/api/products/:id", async ({ params }) => {
		const delay = randomDelay();
		await sleep(delay);
		return {
			product: generateProductById(params.id),
			timestamp: Date.now(),
			delay,
		};
	})
	.get("/api/categories/:category/products", async ({ params }) => {
		const delay = randomDelay();
		await sleep(delay);
		const products = generateProducts(8).map((p) => ({
			...p,
			category: decodeURIComponent(params.category),
		}));
		return {
			category: decodeURIComponent(params.category),
			products,
			total: products.length,
			timestamp: Date.now(),
			delay,
		};
	})
	.get("/api/stats", async () => {
		const delay = randomDelay();
		await sleep(delay);
		return {
			...generateStats(),
			timestamp: Date.now(),
			delay,
		};
	})
	.get("/api/orders/:id", async ({ params }) => {
		const delay = randomDelay();
		await sleep(delay);
		return {
			order: generateOrderById(params.id),
			timestamp: Date.now(),
			delay,
		};
	})
	.get("/api/cart", async ({ cookie }) => {
		const sessionId =
			cookieValue(cookie.sessionId?.value) || generateSessionId();

		const delay = randomDelay();
		await sleep(delay);

		cookie.sessionId.set({
			value: sessionId,
			maxAge: 3600,
			path: "/",
			httpOnly: true,
		});

		return {
			cart: generateCartData(sessionId),
			timestamp: Date.now(),
			delay,
		};
	})
	.post(
		"/api/submit",
		async ({ body }) => {
			const delay = randomDelay();
			await sleep(delay);
			return {
				...generateSubmitResponse(body.data),
				timestamp: Date.now(),
				delay,
			};
		},
		{
			body: t.Object({
				data: t.String(),
			}),
		},
	)
	.post(
		"/api/users",
		async ({ body, cookie }) => {
			const delay = randomDelay();
			await sleep(delay);

			const newSessionId = generateSessionId();
			const newTrackingId = generateTrackingId();

			cookie.sessionId.set({
				value: newSessionId,
				maxAge: 3600,
				path: "/",
				httpOnly: true,
			});
			cookie.trackingId.set({
				value: newTrackingId,
				maxAge: 31536000,
				path: "/",
			});
			cookie.userId.set({
				value: String(Math.floor(Math.random() * 100000)),
				maxAge: 31536000,
				path: "/",
			});

			return {
				message: "User created successfully",
				user: generateCreatedUser(body),
				timestamp: Date.now(),
				delay,
			};
		},
		{
			body: t.Object({
				name: t.String(),
				email: t.String(),
				password: t.String(),
				profile: t.Optional(
					t.Object({
						bio: t.Optional(t.String()),
						avatar: t.Optional(t.String()),
					}),
				),
				preferences: t.Optional(
					t.Object({
						theme: t.Optional(t.String()),
						language: t.Optional(t.String()),
					}),
				),
				address: t.Optional(
					t.Object({
						street: t.Optional(t.String()),
						city: t.Optional(t.String()),
						country: t.Optional(t.String()),
					}),
				),
			}),
		},
	)
	.post(
		"/api/orders",
		async ({ body, cookie }) => {
			const sessionId = cookieValue(cookie.sessionId?.value);
			const userId = cookieValue(cookie.userId?.value);

			const delay = randomDelay();
			await sleep(delay);

			cookie.lastOrderAt.set({
				value: new Date().toISOString(),
				path: "/",
			});
			cookie.cartCleared.set({
				value: "true",
				maxAge: 60,
				path: "/",
			});

			return {
				message: "Order created successfully",
				order: generateOrder(body),
				session: { sessionId, userId },
				timestamp: Date.now(),
				delay,
			};
		},
		{
			body: t.Object({
				items: t.Array(
					t.Object({
						productId: t.Number(),
						quantity: t.Number(),
						options: t.Optional(
							t.Object({
								color: t.Optional(t.String()),
								size: t.Optional(t.String()),
							}),
						),
					}),
				),
				shippingAddress: t.Object({
					street: t.String(),
					city: t.String(),
					country: t.String(),
					postalCode: t.String(),
				}),
				paymentMethod: t.Object({
					type: t.String(),
					cardLast4: t.Optional(t.String()),
				}),
				couponCode: t.Optional(t.String()),
			}),
		},
	)
	.post(
		"/api/process",
		async ({ body }) => {
			const delay = randomDelay();
			await sleep(delay);
			return {
				message: "Items processed successfully",
				processedCount: body.items.length,
				options: body.options || {},
				results: generateProcessedItems(body.items),
				timestamp: Date.now(),
				delay,
			};
		},
		{
			body: t.Object({
				items: t.Array(
					t.Object({
						id: t.String(),
						type: t.String(),
						data: t.Unknown(),
					}),
				),
				options: t.Optional(
					t.Object({
						parallel: t.Optional(t.Boolean()),
						validate: t.Optional(t.Boolean()),
						transform: t.Optional(t.Boolean()),
					}),
				),
			}),
		},
	)
	.post(
		"/api/search",
		async ({ body, cookie }) => {
			const sessionId =
				cookieValue(cookie.sessionId?.value) || generateSessionId();

			const delay = randomDelay();
			await sleep(delay);

			cookie.lastSearch.set({
				value: encodeURIComponent(body.query),
				path: "/",
			});
			cookie.sessionId.set({
				value: sessionId,
				maxAge: 3600,
				path: "/",
				httpOnly: true,
			});

			return {
				...generateSearchResults(body.query, body.filters || {}),
				timestamp: Date.now(),
				delay,
			};
		},
		{
			body: t.Object({
				query: t.String(),
				filters: t.Optional(
					t.Object({
						category: t.Optional(t.String()),
						minPrice: t.Optional(t.Number()),
						maxPrice: t.Optional(t.Number()),
						tags: t.Optional(t.Array(t.String())),
					}),
				),
				pagination: t.Optional(
					t.Object({
						page: t.Optional(t.Number()),
						perPage: t.Optional(t.Number()),
					}),
				),
				sort: t.Optional(
					t.Object({
						field: t.Optional(t.String()),
						order: t.Optional(t.String()),
					}),
				),
			}),
		},
	)
	.post(
		"/api/bulk",
		async ({ body }) => {
			const delay = randomDelay();
			await sleep(delay);
			return {
				...generateBulkCreateResult(body.items),
				options: body.options || {},
				timestamp: Date.now(),
				delay,
			};
		},
		{
			body: t.Object({
				items: t.Array(
					t.Object({
						type: t.String(),
						data: t.Unknown(),
					}),
				),
				options: t.Optional(
					t.Object({
						stopOnError: t.Optional(t.Boolean()),
						validate: t.Optional(t.Boolean()),
						dryRun: t.Optional(t.Boolean()),
					}),
				),
			}),
		},
	)
	.post(
		"/api/analytics",
		async ({ body, cookie }) => {
			const trackingId =
				cookieValue(cookie.trackingId?.value) || generateTrackingId();

			const delay = randomDelay();
			await sleep(delay);

			cookie.trackingId.set({
				value: trackingId,
				maxAge: 31536000,
				path: "/",
			});
			cookie.analyticsViewed.set({
				value: new Date().toISOString(),
				path: "/",
			});

			return {
				...generateAnalytics(body),
				trackingId,
				timestamp: Date.now(),
				delay,
			};
		},
		{
			body: t.Object({
				startDate: t.String(),
				endDate: t.String(),
				metrics: t.Array(t.String()),
				groupBy: t.Optional(t.String()),
				filters: t.Optional(
					t.Object({
						region: t.Optional(t.String()),
						platform: t.Optional(t.String()),
						userSegment: t.Optional(t.String()),
					}),
				),
			}),
		},
	)
	.post(
		"/api/cart",
		async ({ body, cookie }) => {
			const sessionId =
				cookieValue(cookie.sessionId?.value) || generateSessionId();

			const delay = randomDelay();
			await sleep(delay);

			cookie.sessionId.set({
				value: sessionId,
				maxAge: 3600,
				path: "/",
				httpOnly: true,
			});
			cookie.cartUpdated.set({
				value: new Date().toISOString(),
				path: "/",
			});

			return {
				action: body.action,
				cart: generateCartData(sessionId),
				timestamp: Date.now(),
				delay,
			};
		},
		{
			body: t.Object({
				action: t.String(),
				items: t.Optional(
					t.Array(
						t.Object({
							productId: t.Number(),
							quantity: t.Number(),
							options: t.Optional(
								t.Object({
									color: t.Optional(t.String()),
									size: t.Optional(t.String()),
								}),
							),
						}),
					),
				),
			}),
		},
	)
	.listen(PORT);

console.log(`Elysia server running at http://localhost:${PORT}`);
