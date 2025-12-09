import type { EndpointConfig } from "./types";

const randomInt = (min: number, max: number) =>
	Math.floor(Math.random() * (max - min + 1)) + min;

const randomUuid = () => crypto.randomUUID();

const randomUserId = () => randomInt(1000, 99999);
const randomProductId = () => randomInt(1000, 99999);
const randomOrderId = () => randomInt(1000, 99999);
const randomCategory = () =>
	["Electronics", "Home", "Office", "Outdoor", "Sports", "Gaming"][
		randomInt(0, 5)
	];

export const createEndpoints = (): EndpointConfig[] => [
	{ endpoint: "/api/data", method: "GET" },
	{ endpoint: "/api/users", method: "GET" },
	{ endpoint: `/api/users/${randomUserId()}`, method: "GET" },
	{ endpoint: "/api/products", method: "GET" },
	{ endpoint: `/api/products/${randomProductId()}`, method: "GET" },
	{
		endpoint: `/api/categories/${randomCategory()}/products`,
		method: "GET",
	},
	{ endpoint: "/api/stats", method: "GET" },
	{ endpoint: `/api/orders/${randomOrderId()}`, method: "GET" },
	{ endpoint: "/api/cart", method: "GET" },
	{
		endpoint: "/api/submit",
		method: "POST",
		body: {
			data: `benchmark-payload-${randomUuid()}`,
		},
	},
	{
		endpoint: "/api/users",
		method: "POST",
		body: {
			name: `Test User ${randomInt(1, 1000)}`,
			email: `user-${randomUuid()}@example.com`,
			password: `securePassword${randomInt(100, 999)}!`,
			profile: {
				bio: `Developer with ${randomInt(1, 20)} years of experience`,
				avatar: `https://example.com/avatar-${randomInt(1, 1000)}.jpg`,
			},
			preferences: {
				theme: ["dark", "light", "auto"][randomInt(0, 2)],
				language: ["en", "es", "fr", "de"][randomInt(0, 3)],
			},
			address: {
				street: `${randomInt(1, 9999)} Main Street`,
				city: ["New York", "Los Angeles", "Chicago", "Houston"][
					randomInt(0, 3)
				],
				country: "USA",
			},
		},
	},
	{
		endpoint: "/api/orders",
		method: "POST",
		body: {
			items: [
				{
					productId: randomProductId(),
					quantity: randomInt(1, 5),
					options: {
						color: ["blue", "red", "black", "white"][randomInt(0, 3)],
						size: ["S", "M", "L", "XL"][randomInt(0, 3)],
					},
				},
				{
					productId: randomProductId(),
					quantity: randomInt(1, 3),
					options: { color: ["green", "yellow"][randomInt(0, 1)] },
				},
				{ productId: randomProductId(), quantity: randomInt(1, 10) },
			],
			shippingAddress: {
				street: `${randomInt(1, 9999)} Oak Avenue`,
				city: ["Los Angeles", "San Francisco", "Seattle"][randomInt(0, 2)],
				country: "USA",
				postalCode: `${randomInt(10000, 99999)}`,
			},
			paymentMethod: {
				type: ["credit_card", "debit_card", "paypal"][randomInt(0, 2)],
				cardLast4: `${randomInt(1000, 9999)}`,
			},
			couponCode: Math.random() > 0.5 ? `SAVE${randomInt(5, 30)}` : undefined,
		},
	},
	{
		endpoint: "/api/process",
		method: "POST",
		body: {
			items: [
				{
					id: randomUuid(),
					type: "document",
					data: {
						content: `Sample document content ${randomInt(1, 1000)}`,
						format: ["pdf", "docx", "txt"][randomInt(0, 2)],
					},
				},
				{
					id: randomUuid(),
					type: "image",
					data: {
						url: `https://example.com/image-${randomInt(1, 10000)}.jpg`,
						width: randomInt(800, 1920),
						height: randomInt(600, 1080),
					},
				},
				{
					id: randomUuid(),
					type: "video",
					data: {
						url: `https://example.com/video-${randomInt(1, 10000)}.mp4`,
						duration: randomInt(30, 600),
					},
				},
				{
					id: randomUuid(),
					type: "data",
					data: {
						records: Array.from({ length: randomInt(3, 10) }, () =>
							randomInt(1, 100),
						),
						schema: `v${randomInt(1, 5)}`,
					},
				},
			],
			options: {
				parallel: Math.random() > 0.5,
				validate: Math.random() > 0.3,
				transform: Math.random() > 0.5,
			},
		},
	},
	{
		endpoint: "/api/search",
		method: "POST",
		body: {
			query: [
				"wireless headphones",
				"gaming keyboard",
				"laptop stand",
				"usb hub",
				"monitor arm",
			][randomInt(0, 4)],
			filters: {
				category: randomCategory(),
				minPrice: randomInt(10, 50),
				maxPrice: randomInt(100, 500),
				tags: [["featured", "bestseller"], ["new", "sale"], ["trending"]][
					randomInt(0, 2)
				],
			},
			pagination: {
				page: randomInt(1, 5),
				perPage: [10, 20, 50][randomInt(0, 2)],
			},
			sort: {
				field: ["price", "rating", "name", "createdAt"][randomInt(0, 3)],
				order: ["asc", "desc"][randomInt(0, 1)],
			},
		},
	},
	{
		endpoint: "/api/bulk",
		method: "POST",
		body: {
			items: [
				{
					type: "user",
					data: {
						name: `User ${randomInt(1, 100)}`,
						email: `user${randomUuid()}@test.com`,
					},
				},
				{
					type: "user",
					data: {
						name: `User ${randomInt(1, 100)}`,
						email: `user${randomUuid()}@test.com`,
					},
				},
				{
					type: "product",
					data: {
						name: `Product ${randomInt(1, 100)}`,
						price: randomInt(10, 200) + 0.99,
					},
				},
				{
					type: "product",
					data: {
						name: `Product ${randomInt(1, 100)}`,
						price: randomInt(10, 200) + 0.99,
					},
				},
				{
					type: "order",
					data: { userId: randomUserId(), productId: randomProductId() },
				},
			],
			options: {
				stopOnError: Math.random() > 0.5,
				validate: Math.random() > 0.3,
				dryRun: Math.random() > 0.8,
			},
		},
	},
	{
		endpoint: "/api/analytics",
		method: "POST",
		body: {
			startDate: `2024-${String(randomInt(1, 6)).padStart(2, "0")}-01`,
			endDate: `2024-${String(randomInt(7, 12)).padStart(2, "0")}-${randomInt(1, 28)}`,
			metrics: [
				["pageViews", "uniqueVisitors", "bounceRate"],
				["conversions", "revenue", "avgOrderValue"],
				[
					"pageViews",
					"uniqueVisitors",
					"bounceRate",
					"avgSessionDuration",
					"conversions",
				],
			][randomInt(0, 2)],
			groupBy: ["day", "week", "month"][randomInt(0, 2)],
			filters: {
				region: ["North America", "Europe", "Asia Pacific"][randomInt(0, 2)],
				platform: ["web", "mobile", "desktop"][randomInt(0, 2)],
				userSegment: ["premium", "standard", "new"][randomInt(0, 2)],
			},
		},
	},
	{
		endpoint: "/api/cart",
		method: "POST",
		body: {
			action: ["add", "update", "remove"][randomInt(0, 2)],
			items: [
				{
					productId: randomProductId(),
					quantity: randomInt(1, 5),
					options: {
						color: ["black", "white", "blue"][randomInt(0, 2)],
						size: ["S", "M", "L", "XL"][randomInt(0, 3)],
					},
				},
				{ productId: randomProductId(), quantity: randomInt(1, 3) },
			],
		},
	},
];

export const ENDPOINTS: EndpointConfig[] = createEndpoints();
