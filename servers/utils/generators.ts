import {
	FIRST_NAMES,
	LAST_NAMES,
	DOMAINS,
	PRODUCT_NAMES,
	CATEGORIES,
	COUNTRIES,
	CITIES,
	TAGS,
	STREET_NAMES,
	STREET_TYPES,
	PROFESSIONS,
	THEMES,
	LANGUAGES,
	PRODUCT_VARIANTS,
	MATERIALS,
	COLORS,
	REGIONS,
	CARRIERS,
	ORDER_STATUSES,
	PROCESS_STATUSES,
	WORKERS,
	TRENDS,
	DEVICE_TYPES,
	OS_TYPES,
	BROWSERS,
} from "../constants";
import {
	randomInt,
	randomElement,
	randomElements,
	randomId,
	randomUuid,
	generateSessionId,
	generateTrackingId,
} from "./random";

export const generateAddress = () => ({
	street: `${randomInt(1, 9999)} ${randomElement(STREET_NAMES)} ${randomElement(STREET_TYPES)}`,
	city: randomElement(CITIES),
	country: randomElement(COUNTRIES),
	postalCode: `${randomInt(10000, 99999)}`,
	coordinates: {
		lat: parseFloat((Math.random() * 180 - 90).toFixed(6)),
		lng: parseFloat((Math.random() * 360 - 180).toFixed(6)),
	},
});

export const generateUser = () => {
	const firstName = randomElement(FIRST_NAMES);
	const lastName = randomElement(LAST_NAMES);
	return {
		id: randomId(),
		name: `${firstName} ${lastName}`,
		email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomElement(DOMAINS)}`,
		age: randomInt(18, 65),
		active: Math.random() > 0.3,
		profile: {
			avatar: `https://avatars.example.com/${randomInt(1, 1000)}.jpg`,
			bio: `${randomElement(PROFESSIONS)} with ${randomInt(1, 20)} years of experience`,
			socialLinks: {
				twitter:
					Math.random() > 0.5
						? `@${firstName.toLowerCase()}${randomInt(1, 999)}`
						: null,
				linkedin: `linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
				github:
					Math.random() > 0.3 ? `github.com/${firstName.toLowerCase()}` : null,
			},
		},
		preferences: {
			theme: randomElement(THEMES),
			language: randomElement(LANGUAGES),
			notifications: {
				email: Math.random() > 0.5,
				push: Math.random() > 0.5,
				sms: Math.random() > 0.7,
			},
		},
		address: generateAddress(),
		createdAt: new Date(
			Date.now() - randomInt(1, 365) * 24 * 60 * 60 * 1000,
		).toISOString(),
		lastLogin: new Date(
			Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000,
		).toISOString(),
	};
};

export const generateUsers = (count: number = randomInt(3, 8)) =>
	Array.from({ length: count }, generateUser);

export const generateUserById = (id: string) => {
	const user = generateUser();
	return { ...user, id: parseInt(id) || randomId() };
};

export const generateProduct = () => ({
	id: randomId(),
	sku: `SKU-${randomInt(100000, 999999)}`,
	name: `${randomElement(PRODUCT_NAMES)} ${randomElement(PRODUCT_VARIANTS)}`,
	description: `High-quality ${randomElement(PRODUCT_NAMES).toLowerCase()} designed for ${randomElement(["professionals", "enthusiasts", "beginners", "experts"])}. Features ${randomInt(3, 10)} unique capabilities.`,
	price: parseFloat((Math.random() * 200 + 9.99).toFixed(2)),
	originalPrice: parseFloat((Math.random() * 300 + 49.99).toFixed(2)),
	stock: randomInt(0, 500),
	category: randomElement(CATEGORIES),
	subcategory: `${randomElement(CATEGORIES)} ${randomElement(["Accessories", "Essentials", "Premium", "Basic"])}`,
	tags: randomElements(TAGS, randomInt(1, 4)),
	rating: {
		average: parseFloat((Math.random() * 2 + 3).toFixed(1)),
		count: randomInt(10, 5000),
		distribution: {
			5: randomInt(100, 1000),
			4: randomInt(50, 500),
			3: randomInt(20, 200),
			2: randomInt(5, 50),
			1: randomInt(1, 20),
		},
	},
	images: Array.from({ length: randomInt(2, 5) }, (_, i) => ({
		url: `https://images.example.com/products/${randomInt(1, 10000)}_${i}.jpg`,
		alt: `Product image ${i + 1}`,
		isPrimary: i === 0,
	})),
	specifications: {
		weight: `${(Math.random() * 5 + 0.1).toFixed(2)} kg`,
		dimensions: `${randomInt(5, 50)}x${randomInt(5, 50)}x${randomInt(5, 50)} cm`,
		material: randomElement(MATERIALS),
		color: randomElement(COLORS),
	},
	shipping: {
		freeShipping: Math.random() > 0.5,
		estimatedDays: randomInt(1, 14),
		weight: parseFloat((Math.random() * 5 + 0.5).toFixed(2)),
	},
	createdAt: new Date(
		Date.now() - randomInt(1, 180) * 24 * 60 * 60 * 1000,
	).toISOString(),
});

export const generateProducts = (count: number = randomInt(3, 8)) =>
	Array.from({ length: count }, generateProduct);

export const generateProductById = (id: string) => {
	const product = generateProduct();
	return { ...product, id: parseInt(id) || randomId() };
};

export const generateStats = () => ({
	activeUsers: randomInt(100, 5000),
	requestsToday: randomInt(10000, 500000),
	avgResponseTime: randomInt(50, 800),
	errorRate: parseFloat((Math.random() * 5).toFixed(2)),
	uptime: parseFloat((99 + Math.random()).toFixed(3)),
	cpuUsage: randomInt(10, 90),
	memoryUsage: randomInt(20, 85),
	bandwidth: {
		incoming: `${randomInt(100, 1000)} MB/s`,
		outgoing: `${randomInt(50, 500)} MB/s`,
	},
	database: {
		connections: randomInt(10, 100),
		queryTime: randomInt(1, 50),
		cacheHitRate: parseFloat((Math.random() * 30 + 70).toFixed(1)),
	},
	queues: {
		pending: randomInt(0, 1000),
		processing: randomInt(0, 100),
		completed: randomInt(10000, 100000),
		failed: randomInt(0, 100),
	},
});

export const generateDataResponse = () => ({
	message: "Data fetched successfully",
	requestId: `req_${randomId()}`,
	version: `v${randomInt(1, 5)}.${randomInt(0, 9)}.${randomInt(0, 20)}`,
	region: randomElement(REGIONS),
});

export const generateCreatedUser = (data: {
	name: string;
	email: string;
	password?: string;
	profile?: { bio?: string; avatar?: string };
	preferences?: { theme?: string; language?: string };
	address?: { street?: string; city?: string; country?: string };
}) => ({
	id: randomId(),
	name: data.name,
	email: data.email,
	profile: {
		bio: data.profile?.bio || "",
		avatar:
			data.profile?.avatar ||
			`https://avatars.example.com/${randomInt(1, 1000)}.jpg`,
		socialLinks: { twitter: null, linkedin: null, github: null },
	},
	preferences: {
		theme: data.preferences?.theme || "auto",
		language: data.preferences?.language || "en",
		notifications: { email: true, push: true, sms: false },
	},
	address: data.address
		? { ...generateAddress(), ...data.address }
		: generateAddress(),
	createdAt: new Date().toISOString(),
	verified: false,
	role: "user",
	tokens: {
		accessToken: `at_${randomUuid()}`,
		refreshToken: `rt_${randomUuid()}`,
		expiresIn: 3600,
	},
});

export const generateOrder = (data: {
	items: Array<{
		productId: number;
		quantity: number;
		options?: { color?: string; size?: string };
	}>;
	shippingAddress: {
		street: string;
		city: string;
		country: string;
		postalCode: string;
	};
	paymentMethod: { type: string; cardLast4?: string };
	couponCode?: string;
}) => {
	const items = data.items.map((item) => {
		const unitPrice = parseFloat((Math.random() * 100 + 9.99).toFixed(2));
		return {
			productId: item.productId,
			quantity: item.quantity,
			options: item.options || {},
			unitPrice,
			subtotal: parseFloat((unitPrice * item.quantity).toFixed(2)),
			product: {
				name: `${randomElement(PRODUCT_NAMES)} ${randomElement(["Pro", "Plus", "Lite"])}`,
				sku: `SKU-${randomInt(100000, 999999)}`,
				image: `https://images.example.com/products/${randomInt(1, 10000)}.jpg`,
			},
		};
	});
	const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
	const discount = data.couponCode ? subtotal * 0.1 : 0;
	const shipping = subtotal > 100 ? 0 : 9.99;
	const tax = (subtotal - discount) * 0.08;
	const total = subtotal - discount + shipping + tax;

	return {
		id: randomId(),
		orderNumber: `ORD-${randomInt(100000, 999999)}`,
		items,
		summary: {
			subtotal: parseFloat(subtotal.toFixed(2)),
			discount: parseFloat(discount.toFixed(2)),
			shipping: parseFloat(shipping.toFixed(2)),
			tax: parseFloat(tax.toFixed(2)),
			total: parseFloat(total.toFixed(2)),
		},
		shippingAddress: data.shippingAddress,
		paymentMethod: {
			type: data.paymentMethod.type,
			cardLast4: data.paymentMethod.cardLast4 || "****",
			transactionId: `txn_${randomUuid()}`,
		},
		couponCode: data.couponCode || null,
		status: "confirmed",
		estimatedDelivery: new Date(
			Date.now() + randomInt(3, 10) * 24 * 60 * 60 * 1000,
		)
			.toISOString()
			.split("T")[0],
		tracking: {
			carrier: randomElement(CARRIERS),
			trackingNumber: `${randomInt(1000000000, 9999999999)}`,
			url: `https://tracking.example.com/${randomInt(1000000000, 9999999999)}`,
		},
		createdAt: new Date().toISOString(),
	};
};

export const generateOrderById = (id: string) => ({
	id: parseInt(id) || randomId(),
	orderNumber: `ORD-${randomInt(100000, 999999)}`,
	items: Array.from({ length: randomInt(1, 5) }, () => ({
		productId: randomId(),
		quantity: randomInt(1, 5),
		unitPrice: parseFloat((Math.random() * 100 + 9.99).toFixed(2)),
		product: {
			name: `${randomElement(PRODUCT_NAMES)} ${randomElement(["Pro", "Plus", "Lite"])}`,
			sku: `SKU-${randomInt(100000, 999999)}`,
		},
	})),
	status: randomElement(ORDER_STATUSES),
	total: parseFloat((Math.random() * 500 + 20).toFixed(2)),
	createdAt: new Date(
		Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000,
	).toISOString(),
});

export const generateProcessedItems = (
	items: Array<{ id: string; type: string; data: unknown }>,
) =>
	items.map((item) => ({
		id: item.id,
		type: item.type,
		inputData: item.data,
		status: randomElement(PROCESS_STATUSES),
		processingTime: randomInt(10, 200),
		outputSize: randomInt(100, 10000),
		checksum: Math.random().toString(36).substring(2, 10),
		metadata: {
			processedAt: new Date().toISOString(),
			processor: randomElement(WORKERS),
			version: `v${randomInt(1, 3)}.${randomInt(0, 9)}`,
		},
		result: {
			success: Math.random() > 0.1,
			transformations: randomInt(1, 10),
			warnings:
				Math.random() > 0.7
					? [
							`Warning: ${randomElement(["deprecated field", "missing optional data", "truncated content"])}`,
						]
					: [],
		},
	}));

export const generateSubmitResponse = (data: string) => ({
	message: "Data submitted successfully",
	received: data,
	processedBytes: data.length * randomInt(1, 4),
	queuePosition: randomInt(1, 100),
	estimatedProcessingTime: randomInt(100, 5000),
});

export const generateSearchResults = (
	query: string,
	filters: {
		category?: string;
		minPrice?: number;
		maxPrice?: number;
		tags?: string[];
	},
) => {
	const count = randomInt(5, 20);
	const products = generateProducts(count);
	const filteredProducts = products.filter((p) => {
		if (filters.category && p.category !== filters.category)
			return Math.random() > 0.5;
		if (filters.minPrice && p.price < filters.minPrice) return false;
		if (filters.maxPrice && p.price > filters.maxPrice) return false;
		return true;
	});

	return {
		query,
		filters,
		results: filteredProducts.map((p) => ({
			...p,
			relevanceScore: parseFloat((Math.random() * 0.5 + 0.5).toFixed(3)),
			highlights: [`...${query}...`, `matching ${randomElement(TAGS)}`],
		})),
		pagination: {
			page: 1,
			perPage: 20,
			total: randomInt(count, count * 10),
			totalPages: randomInt(1, 10),
		},
		facets: {
			categories: CATEGORIES.map((c) => ({
				name: c,
				count: randomInt(1, 100),
			})),
			priceRanges: [
				{ range: "0-50", count: randomInt(10, 100) },
				{ range: "50-100", count: randomInt(10, 100) },
				{ range: "100-200", count: randomInt(5, 50) },
				{ range: "200+", count: randomInt(1, 20) },
			],
			tags: TAGS.map((t) => ({ name: t, count: randomInt(1, 50) })),
		},
		suggestions: [`${query} pro`, `${query} plus`, `best ${query}`],
	};
};

export const generateBulkCreateResult = (
	items: Array<{ type: string; data: unknown }>,
) => ({
	processed: items.length,
	successful: items.length - randomInt(0, Math.floor(items.length * 0.1)),
	failed: randomInt(0, Math.floor(items.length * 0.1)),
	results: items.map((item, index) => ({
		index,
		type: item.type,
		success: Math.random() > 0.1,
		id: randomId(),
		error:
			Math.random() > 0.9
				? randomElement([
						"Validation failed",
						"Duplicate entry",
						"Invalid data",
					])
				: null,
	})),
	summary: {
		duration: randomInt(100, 5000),
		avgTimePerItem: randomInt(10, 100),
	},
});

export const generateAnalytics = (params: {
	startDate: string;
	endDate: string;
	metrics: string[];
	groupBy?: string;
}) => {
	const days = randomInt(7, 30);
	const dataPoints = Array.from({ length: days }, (_, i) => {
		const date = new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000)
			.toISOString()
			.split("T")[0];
		const metrics: Record<string, number> = {};
		params.metrics.forEach((m) => {
			metrics[m] = randomInt(100, 10000);
		});
		return { date, metrics };
	});

	return {
		params,
		data: dataPoints,
		summary: params.metrics.reduce(
			(acc, m) => {
				const values = dataPoints.map((d) => d.metrics[m]);
				acc[m] = {
					total: values.reduce((a, b) => a + b, 0),
					average: parseFloat(
						(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
					),
					min: Math.min(...values),
					max: Math.max(...values),
					trend: randomElement(TRENDS),
					changePercent: parseFloat((Math.random() * 40 - 20).toFixed(2)),
				};
				return acc;
			},
			{} as Record<
				string,
				{
					total: number;
					average: number;
					min: number;
					max: number;
					trend: string;
					changePercent: number;
				}
			>,
		),
		generatedAt: new Date().toISOString(),
	};
};

export const generateSessionData = (
	sessionId: string | null,
	trackingId: string | null,
) => ({
	sessionId: sessionId || generateSessionId(),
	trackingId: trackingId || generateTrackingId(),
	isNewSession: !sessionId,
	isNewVisitor: !trackingId,
	visitCount: randomInt(1, 100),
	lastVisit: sessionId
		? new Date(Date.now() - randomInt(1, 60) * 60 * 1000).toISOString()
		: null,
	deviceInfo: {
		type: randomElement(DEVICE_TYPES),
		os: randomElement(OS_TYPES),
		browser: randomElement(BROWSERS),
	},
});

export const generateCartData = (sessionId: string) => ({
	sessionId,
	cartId: `cart_${randomUuid()}`,
	items: Array.from({ length: randomInt(1, 5) }, () => ({
		productId: randomId(),
		quantity: randomInt(1, 3),
		price: parseFloat((Math.random() * 100 + 9.99).toFixed(2)),
		addedAt: new Date(Date.now() - randomInt(1, 60) * 60 * 1000).toISOString(),
	})),
	totals: {
		subtotal: parseFloat((Math.random() * 300 + 20).toFixed(2)),
		estimatedTax: parseFloat((Math.random() * 30 + 2).toFixed(2)),
		estimatedShipping: parseFloat((Math.random() * 15).toFixed(2)),
	},
	expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
});
