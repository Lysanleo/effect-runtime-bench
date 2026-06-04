import express, { type Request, type Response } from "express";
import { randomDelay, sleep } from "./shared";
import * as Scenario from "./scenario";

const PORT = Number(process.env.PORT ?? 3003);

const app = express();

app.use(express.json());

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

const applyCookies = (
	res: Response,
	cookies?: ReadonlyArray<Scenario.ResponseCookie>,
) => {
	for (const cookie of cookies ?? []) {
		res.cookie(cookie.name, cookie.value, {
			maxAge: cookie.maxAge ? cookie.maxAge * 1000 : undefined,
			path: cookie.path,
			httpOnly: cookie.httpOnly,
		});
	}
};

const sendScenario = <A>(
	res: Response,
	result: Scenario.ScenarioResponse<A>,
) => {
	applyCookies(res, result.cookies);
	res.json(result.body);
};

const withDelay = async () => {
	const delay = randomDelay();
	await sleep(delay);
	return delay;
};

const cookie = (req: Request, name: string) =>
	parseCookies(req.headers.cookie)[name] ?? null;

app.get("/api/data", async (req, res) => {
	const delay = await withDelay();
	sendScenario(
		res,
		Scenario.getData({
			sessionId: cookie(req, "sessionId"),
			trackingId: cookie(req, "trackingId"),
			delay,
		}),
	);
});

app.get("/api/users", async (_req, res) => {
	const delay = await withDelay();
	sendScenario(res, Scenario.getUsers({ delay }));
});

app.get("/api/users/:id", async (req, res) => {
	const delay = await withDelay();
	sendScenario(res, Scenario.getUserById({ id: req.params.id, delay }));
});

app.get("/api/products", async (_req, res) => {
	const delay = await withDelay();
	sendScenario(res, Scenario.getProducts({ delay }));
});

app.get("/api/products/:id", async (req, res) => {
	const delay = await withDelay();
	sendScenario(res, Scenario.getProductById({ id: req.params.id, delay }));
});

app.get("/api/categories/:category/products", async (req, res) => {
	const delay = await withDelay();
	sendScenario(
		res,
		Scenario.getProductsByCategory({
			category: decodeURIComponent(req.params.category),
			delay,
		}),
	);
});

app.get("/api/stats", async (_req, res) => {
	const delay = await withDelay();
	sendScenario(res, Scenario.getStats({ delay }));
});

app.get("/api/orders/:id", async (req, res) => {
	const delay = await withDelay();
	sendScenario(res, Scenario.getOrderById({ id: req.params.id, delay }));
});

app.get("/api/cart", async (req, res) => {
	const delay = await withDelay();
	sendScenario(
		res,
		Scenario.getCart({
			sessionId: cookie(req, "sessionId"),
			delay,
		}),
	);
});

app.post("/api/submit", async (req, res) => {
	const delay = await withDelay();
	sendScenario(res, Scenario.postSubmit({ body: req.body, delay }));
});

app.post("/api/users", async (req, res) => {
	const delay = await withDelay();
	sendScenario(res, Scenario.postCreateUser({ body: req.body, delay }));
});

app.post("/api/orders", async (req, res) => {
	const delay = await withDelay();
	sendScenario(
		res,
		Scenario.postCreateOrder({
			body: req.body,
			sessionId: cookie(req, "sessionId"),
			userId: cookie(req, "userId"),
			delay,
		}),
	);
});

app.post("/api/process", async (req, res) => {
	const delay = await withDelay();
	sendScenario(res, Scenario.postProcess({ body: req.body, delay }));
});

app.post("/api/search", async (req, res) => {
	const delay = await withDelay();
	sendScenario(
		res,
		Scenario.postSearch({
			body: req.body,
			sessionId: cookie(req, "sessionId"),
			delay,
		}),
	);
});

app.post("/api/bulk", async (req, res) => {
	const delay = await withDelay();
	sendScenario(res, Scenario.postBulkCreate({ body: req.body, delay }));
});

app.post("/api/analytics", async (req, res) => {
	const delay = await withDelay();
	sendScenario(
		res,
		Scenario.postAnalytics({
			body: req.body,
			trackingId: cookie(req, "trackingId"),
			delay,
		}),
	);
});

app.post("/api/cart", async (req, res) => {
	const delay = await withDelay();
	sendScenario(
		res,
		Scenario.postUpdateCart({
			body: req.body,
			sessionId: cookie(req, "sessionId"),
			delay,
		}),
	);
});

app.listen(PORT, () => {
	console.log(`Express server running at http://localhost:${PORT}`);
});
