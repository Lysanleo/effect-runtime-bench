import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
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

const PORT = 3002;

export const app = new Hono();

app.get("/api/data", async (c) => {
	const sessionId = getCookie(c, "sessionId") ?? null;
	const trackingId = getCookie(c, "trackingId") ?? null;

	const delay = randomDelay();
	await sleep(delay);

	const sessionData = generateSessionData(sessionId, trackingId);

	setCookie(c, "sessionId", sessionData.sessionId, {
		maxAge: 3600,
		path: "/",
		httpOnly: true,
	});
	setCookie(c, "trackingId", sessionData.trackingId, {
		maxAge: 31536000,
		path: "/",
	});
	setCookie(c, "lastVisit", new Date().toISOString(), { path: "/" });

	return c.json({
		...generateDataResponse(),
		session: sessionData,
		timestamp: Date.now(),
		delay,
	});
});

app.get("/api/users", async (c) => {
	const delay = randomDelay();
	await sleep(delay);
	const users = generateUsers(10);
	return c.json({
		users,
		total: users.length,
		timestamp: Date.now(),
		delay,
	});
});

app.get("/api/users/:id", async (c) => {
	const delay = randomDelay();
	await sleep(delay);
	return c.json({
		user: generateUserById(c.req.param("id")),
		timestamp: Date.now(),
		delay,
	});
});

app.get("/api/products", async (c) => {
	const delay = randomDelay();
	await sleep(delay);
	const products = generateProducts(10);
	return c.json({
		products,
		total: products.length,
		timestamp: Date.now(),
		delay,
	});
});

app.get("/api/products/:id", async (c) => {
	const delay = randomDelay();
	await sleep(delay);
	return c.json({
		product: generateProductById(c.req.param("id")),
		timestamp: Date.now(),
		delay,
	});
});

app.get("/api/categories/:category/products", async (c) => {
	const category = decodeURIComponent(c.req.param("category"));
	const delay = randomDelay();
	await sleep(delay);
	const products = generateProducts(8).map((p) => ({ ...p, category }));

	return c.json({
		category,
		products,
		total: products.length,
		timestamp: Date.now(),
		delay,
	});
});

app.get("/api/stats", async (c) => {
	const delay = randomDelay();
	await sleep(delay);
	return c.json({
		...generateStats(),
		timestamp: Date.now(),
		delay,
	});
});

app.get("/api/orders/:id", async (c) => {
	const delay = randomDelay();
	await sleep(delay);
	return c.json({
		order: generateOrderById(c.req.param("id")),
		timestamp: Date.now(),
		delay,
	});
});

app.get("/api/cart", async (c) => {
	const sessionId = getCookie(c, "sessionId") ?? generateSessionId();

	const delay = randomDelay();
	await sleep(delay);

	setCookie(c, "sessionId", sessionId, {
		maxAge: 3600,
		path: "/",
		httpOnly: true,
	});

	return c.json({
		cart: generateCartData(sessionId),
		timestamp: Date.now(),
		delay,
	});
});

app.post("/api/submit", async (c) => {
	const body = (await c.req.json()) as { data: string };
	const delay = randomDelay();
	await sleep(delay);
	return c.json({
		...generateSubmitResponse(body.data),
		timestamp: Date.now(),
		delay,
	});
});

app.post("/api/users", async (c) => {
	const body = (await c.req.json()) as Parameters<typeof generateCreatedUser>[0];
	const delay = randomDelay();
	await sleep(delay);

	const newSessionId = generateSessionId();
	const newTrackingId = generateTrackingId();

	setCookie(c, "sessionId", newSessionId, {
		maxAge: 3600,
		path: "/",
		httpOnly: true,
	});
	setCookie(c, "trackingId", newTrackingId, { maxAge: 31536000, path: "/" });
	setCookie(c, "userId", String(Math.floor(Math.random() * 100000)), {
		maxAge: 31536000,
		path: "/",
	});

	return c.json({
		message: "User created successfully",
		user: generateCreatedUser(body),
		timestamp: Date.now(),
		delay,
	});
});

app.post("/api/orders", async (c) => {
	const sessionId = getCookie(c, "sessionId") ?? null;
	const userId = getCookie(c, "userId") ?? null;
	const body = (await c.req.json()) as Parameters<typeof generateOrder>[0];
	const delay = randomDelay();
	await sleep(delay);

	setCookie(c, "lastOrderAt", new Date().toISOString(), { path: "/" });
	setCookie(c, "cartCleared", "true", { maxAge: 60, path: "/" });

	return c.json({
		message: "Order created successfully",
		order: generateOrder(body),
		session: { sessionId, userId },
		timestamp: Date.now(),
		delay,
	});
});

app.post("/api/process", async (c) => {
	const body = (await c.req.json()) as {
		items: Parameters<typeof generateProcessedItems>[0];
		options?: object;
	};
	const delay = randomDelay();
	await sleep(delay);
	return c.json({
		message: "Items processed successfully",
		processedCount: body.items.length,
		options: body.options || {},
		results: generateProcessedItems(body.items),
		timestamp: Date.now(),
		delay,
	});
});

app.post("/api/search", async (c) => {
	const sessionId = getCookie(c, "sessionId") ?? generateSessionId();
	const body = (await c.req.json()) as {
		query: string;
		filters?: Parameters<typeof generateSearchResults>[1];
	};
	const delay = randomDelay();
	await sleep(delay);

	setCookie(c, "lastSearch", encodeURIComponent(body.query), { path: "/" });
	setCookie(c, "sessionId", sessionId, {
		maxAge: 3600,
		path: "/",
		httpOnly: true,
	});

	return c.json({
		...generateSearchResults(body.query, body.filters || {}),
		timestamp: Date.now(),
		delay,
	});
});

app.post("/api/bulk", async (c) => {
	const body = (await c.req.json()) as {
		items: Parameters<typeof generateBulkCreateResult>[0];
		options?: object;
	};
	const delay = randomDelay();
	await sleep(delay);
	return c.json({
		...generateBulkCreateResult(body.items),
		options: body.options || {},
		timestamp: Date.now(),
		delay,
	});
});

app.post("/api/analytics", async (c) => {
	const trackingId = getCookie(c, "trackingId") ?? generateTrackingId();
	const body = (await c.req.json()) as Parameters<typeof generateAnalytics>[0];
	const delay = randomDelay();
	await sleep(delay);

	setCookie(c, "trackingId", trackingId, { maxAge: 31536000, path: "/" });
	setCookie(c, "analyticsViewed", new Date().toISOString(), { path: "/" });

	return c.json({
		...generateAnalytics(body),
		trackingId,
		timestamp: Date.now(),
		delay,
	});
});

app.post("/api/cart", async (c) => {
	const sessionId = getCookie(c, "sessionId") ?? generateSessionId();
	const body = (await c.req.json()) as { action: string };
	const delay = randomDelay();
	await sleep(delay);

	setCookie(c, "sessionId", sessionId, {
		maxAge: 3600,
		path: "/",
		httpOnly: true,
	});
	setCookie(c, "cartUpdated", new Date().toISOString(), { path: "/" });

	return c.json({
		action: body.action,
		cart: generateCartData(sessionId),
		timestamp: Date.now(),
		delay,
	});
});

if ("Bun" in globalThis) {
	Bun.serve({
		port: PORT,
		fetch: app.fetch,
	});

	console.log(`Hono server running at http://localhost:${PORT}`);
}
