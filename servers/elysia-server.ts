import { Elysia, t } from "elysia";
import {
	randomDelay,
	sleep,
	generateDataResponse,
	generateUsers,
	generateProducts,
	generateStats,
	generateSubmitResponse,
	generateCreatedUser,
	generateOrder,
	generateProcessedItems,
} from "./shared";

const PORT = 3001;

const app = new Elysia()
	.get("/api/data", async () => {
		const delay = randomDelay();
		await sleep(delay);
		return {
			...generateDataResponse(),
			timestamp: Date.now(),
			delay,
		};
	})
	.get("/api/users", async () => {
		const delay = randomDelay();
		await sleep(delay);
		const users = generateUsers();
		return {
			users,
			total: users.length,
			timestamp: Date.now(),
			delay,
		};
	})
	.get("/api/products", async () => {
		const delay = randomDelay();
		await sleep(delay);
		const products = generateProducts();
		return {
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
		async ({ body }) => {
			const delay = randomDelay();
			await sleep(delay);
			return {
				message: "User created successfully",
				user: generateCreatedUser(body.name, body.email),
				timestamp: Date.now(),
				delay,
			};
		},
		{
			body: t.Object({
				name: t.String(),
				email: t.String(),
			}),
		},
	)
	.post(
		"/api/orders",
		async ({ body }) => {
			const delay = randomDelay();
			await sleep(delay);
			return {
				message: "Order created successfully",
				order: generateOrder(body.productId, body.quantity),
				timestamp: Date.now(),
				delay,
			};
		},
		{
			body: t.Object({
				productId: t.Number(),
				quantity: t.Number(),
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
				results: generateProcessedItems(body.items),
				timestamp: Date.now(),
				delay,
			};
		},
		{
			body: t.Object({
				items: t.Array(t.String()),
			}),
		},
	)
	.listen(PORT);

console.log(`Elysia server running at http://localhost:${PORT}`);
