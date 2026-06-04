import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { randomDelay, sleep } from "./shared";
import * as Scenario from "./scenario";

const PORT = Number(process.env.PORT ?? 3004);

const app = Fastify({ logger: false });

const buildCookieHeaders = (cookies: ReadonlyArray<Scenario.ResponseCookie>) =>
	cookies.map((cookie) => {
		let header = `${cookie.name}=${cookie.value}`;
		if (cookie.maxAge) header += `; Max-Age=${cookie.maxAge}`;
		if (cookie.path) header += `; Path=${cookie.path}`;
		if (cookie.httpOnly) header += "; HttpOnly";
		return header;
	});

const applyCookies = (
	reply: FastifyReply,
	cookies?: ReadonlyArray<Scenario.ResponseCookie>,
) => {
	if (cookies?.length) {
		reply.header("Set-Cookie", buildCookieHeaders(cookies));
	}
};

const sendScenario = <A>(
	reply: FastifyReply,
	result: Scenario.ScenarioResponse<A>,
) => {
	applyCookies(reply, result.cookies);
	return reply.send(result.body);
};

const withDelay = async () => {
	const delay = randomDelay();
	await sleep(delay);
	return delay;
};

const parseCookies = (header: string | undefined) =>
	Object.fromEntries(
		(header ?? "")
			.split(";")
			.map((part) => part.trim())
			.filter(Boolean)
			.map((part) => {
				const [name, ...value] = part.split("=");
				return [name, decodeURIComponent(value.join("="))];
			}),
	);

const cookie = (request: FastifyRequest, name: string) =>
	parseCookies(request.headers.cookie)[name] ?? null;

app.get("/api/data", async (request, reply) => {
	const delay = await withDelay();
	return sendScenario(
		reply,
		Scenario.getData({
			sessionId: cookie(request, "sessionId"),
			trackingId: cookie(request, "trackingId"),
			delay,
		}),
	);
});

app.get("/api/users", async (_request, reply) => {
	const delay = await withDelay();
	return sendScenario(reply, Scenario.getUsers({ delay }));
});

app.get<{ Params: { id: string } }>("/api/users/:id", async (request, reply) => {
	const delay = await withDelay();
	return sendScenario(
		reply,
		Scenario.getUserById({ id: request.params.id, delay }),
	);
});

app.get("/api/products", async (_request, reply) => {
	const delay = await withDelay();
	return sendScenario(reply, Scenario.getProducts({ delay }));
});

app.get<{ Params: { id: string } }>(
	"/api/products/:id",
	async (request, reply) => {
		const delay = await withDelay();
		return sendScenario(
			reply,
			Scenario.getProductById({ id: request.params.id, delay }),
		);
	},
);

app.get<{ Params: { category: string } }>(
	"/api/categories/:category/products",
	async (request, reply) => {
		const delay = await withDelay();
		return sendScenario(
			reply,
			Scenario.getProductsByCategory({
				category: decodeURIComponent(request.params.category),
				delay,
			}),
		);
	},
);

app.get("/api/stats", async (_request, reply) => {
	const delay = await withDelay();
	return sendScenario(reply, Scenario.getStats({ delay }));
});

app.get<{ Params: { id: string } }>("/api/orders/:id", async (request, reply) => {
	const delay = await withDelay();
	return sendScenario(
		reply,
		Scenario.getOrderById({ id: request.params.id, delay }),
	);
});

app.get("/api/cart", async (request, reply) => {
	const delay = await withDelay();
	return sendScenario(
		reply,
		Scenario.getCart({ sessionId: cookie(request, "sessionId"), delay }),
	);
});

app.post("/api/submit", async (request, reply) => {
	const delay = await withDelay();
	return sendScenario(
		reply,
		Scenario.postSubmit({
			body: request.body as Parameters<typeof Scenario.postSubmit>[0]["body"],
			delay,
		}),
	);
});

app.post("/api/users", async (request, reply) => {
	const delay = await withDelay();
	return sendScenario(
		reply,
		Scenario.postCreateUser({
			body: request.body as Parameters<typeof Scenario.postCreateUser>[0]["body"],
			delay,
		}),
	);
});

app.post("/api/orders", async (request, reply) => {
	const delay = await withDelay();
	return sendScenario(
		reply,
		Scenario.postCreateOrder({
			body: request.body as Parameters<typeof Scenario.postCreateOrder>[0]["body"],
			sessionId: cookie(request, "sessionId"),
			userId: cookie(request, "userId"),
			delay,
		}),
	);
});

app.post("/api/process", async (request, reply) => {
	const delay = await withDelay();
	return sendScenario(
		reply,
		Scenario.postProcess({
			body: request.body as Parameters<typeof Scenario.postProcess>[0]["body"],
			delay,
		}),
	);
});

app.post("/api/search", async (request, reply) => {
	const delay = await withDelay();
	return sendScenario(
		reply,
		Scenario.postSearch({
			body: request.body as Parameters<typeof Scenario.postSearch>[0]["body"],
			sessionId: cookie(request, "sessionId"),
			delay,
		}),
	);
});

app.post("/api/bulk", async (request, reply) => {
	const delay = await withDelay();
	return sendScenario(
		reply,
		Scenario.postBulkCreate({
			body: request.body as Parameters<typeof Scenario.postBulkCreate>[0]["body"],
			delay,
		}),
	);
});

app.post("/api/analytics", async (request, reply) => {
	const delay = await withDelay();
	return sendScenario(
		reply,
		Scenario.postAnalytics({
			body: request.body as Parameters<typeof Scenario.postAnalytics>[0]["body"],
			trackingId: cookie(request, "trackingId"),
			delay,
		}),
	);
});

app.post("/api/cart", async (request, reply) => {
	const delay = await withDelay();
	return sendScenario(
		reply,
		Scenario.postUpdateCart({
			body: request.body as Parameters<typeof Scenario.postUpdateCart>[0]["body"],
			sessionId: cookie(request, "sessionId"),
			delay,
		}),
	);
});

await app.listen({ port: PORT });
console.log(`Fastify server running at http://localhost:${PORT}`);
