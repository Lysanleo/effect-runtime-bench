import { serve } from "@hono/node-server";
import { Cause, Exit, type Effect } from "effect";
import { Hono, type Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { EffectCoreRuntime } from "./effect-runtime";
import type { EffectScenarioResponse, ResponseCookie } from "./effect-scenario";
import * as EffectScenario from "./effect-scenario";

const PORT = 3103;

const app = new Hono();

const applyCookies = (c: Context, cookies?: ReadonlyArray<ResponseCookie>) => {
	for (const cookie of cookies ?? []) {
		setCookie(c, cookie.name, cookie.value, {
			maxAge: cookie.maxAge,
			path: cookie.path,
			httpOnly: cookie.httpOnly,
		});
	}
};

const runEffectScenario = async <A>(
	c: Context,
	program: Effect.Effect<EffectScenarioResponse<A>, unknown, never>,
) => {
	try {
		const exit = await EffectCoreRuntime.runPromiseExit(program, {
			signal: c.req.raw.signal,
		});

		if (Exit.isFailure(exit)) {
			if (Cause.hasInterruptsOnly(exit.cause)) {
				return new Response(null, { status: 499 });
			}

			console.error(Cause.pretty(exit.cause));
			return c.json({ error: "Internal Server Error" }, 500);
		}

		const result = exit.value;
		applyCookies(c, result.cookies);
		return c.json(result.body);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Internal Server Error" }, 500);
	}
};

app.get("/api/data", (c) =>
	runEffectScenario(
		c,
		EffectScenario.getData({
			sessionId: getCookie(c, "sessionId") ?? null,
			trackingId: getCookie(c, "trackingId") ?? null,
		}),
	),
);

app.get("/api/users", (c) => runEffectScenario(c, EffectScenario.getUsers));

app.get("/api/users/:id", (c) =>
	runEffectScenario(c, EffectScenario.getUserById(c.req.param("id"))),
);

app.get("/api/products", (c) =>
	runEffectScenario(c, EffectScenario.getProducts),
);

app.get("/api/products/:id", (c) =>
	runEffectScenario(c, EffectScenario.getProductById(c.req.param("id"))),
);

app.get("/api/categories/:category/products", (c) =>
	runEffectScenario(
		c,
		EffectScenario.getProductsByCategory(c.req.param("category")),
	),
);

app.get("/api/stats", (c) => runEffectScenario(c, EffectScenario.getStats));

app.get("/api/orders/:id", (c) =>
	runEffectScenario(c, EffectScenario.getOrderById(c.req.param("id"))),
);

app.get("/api/cart", (c) =>
	runEffectScenario(
		c,
		EffectScenario.getCart({ sessionId: getCookie(c, "sessionId") ?? null }),
	),
);

app.post("/api/submit", async (c) =>
	runEffectScenario(c, EffectScenario.postSubmit(await c.req.json())),
);

app.post("/api/users", async (c) =>
	runEffectScenario(c, EffectScenario.postCreateUser(await c.req.json())),
);

app.post("/api/orders", async (c) =>
	runEffectScenario(
		c,
		EffectScenario.postCreateOrder({
			body: await c.req.json(),
			sessionId: getCookie(c, "sessionId") ?? null,
			userId: getCookie(c, "userId") ?? null,
		}),
	),
);

app.post("/api/process", async (c) =>
	runEffectScenario(c, EffectScenario.postProcess(await c.req.json())),
);

app.post("/api/search", async (c) =>
	runEffectScenario(
		c,
		EffectScenario.postSearch({
			body: await c.req.json(),
			sessionId: getCookie(c, "sessionId") ?? null,
		}),
	),
);

app.post("/api/bulk", async (c) =>
	runEffectScenario(c, EffectScenario.postBulkCreate(await c.req.json())),
);

app.post("/api/analytics", async (c) =>
	runEffectScenario(
		c,
		EffectScenario.postAnalytics({
			body: await c.req.json(),
			trackingId: getCookie(c, "trackingId") ?? null,
		}),
	),
);

app.post("/api/cart", async (c) =>
	runEffectScenario(
		c,
		EffectScenario.postUpdateCart({
			body: await c.req.json(),
			sessionId: getCookie(c, "sessionId") ?? null,
		}),
	),
);

const server = serve({ fetch: app.fetch, port: PORT }, () => {
	console.log(`Hono + Effect Core Node server running at http://localhost:${PORT}`);
});

const shutdown = () => {
	server.close(() => {
		EffectCoreRuntime.dispose().finally(() => process.exit(0));
	});
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
