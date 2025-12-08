const firstNames = [
	"Alice",
	"Bob",
	"Charlie",
	"Diana",
	"Eve",
	"Frank",
	"Grace",
	"Henry",
	"Ivy",
	"Jack",
];
const lastNames = [
	"Smith",
	"Johnson",
	"Williams",
	"Brown",
	"Jones",
	"Garcia",
	"Miller",
	"Davis",
	"Rodriguez",
	"Martinez",
];
const domains = [
	"example.com",
	"test.org",
	"demo.net",
	"sample.io",
	"mock.dev",
];
const productNames = [
	"Widget",
	"Gadget",
	"Gizmo",
	"Device",
	"Tool",
	"Module",
	"Component",
	"Unit",
	"System",
	"Kit",
];
const itemTypes = [
	"document",
	"image",
	"video",
	"audio",
	"archive",
	"spreadsheet",
	"presentation",
	"code",
	"data",
	"config",
];

const randomInt = (min: number, max: number) =>
	Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = <T>(arr: T[]): T =>
	arr[Math.floor(Math.random() * arr.length)];
const randomId = () => randomInt(1000, 99999);

export const randomDelay = () => randomInt(100, 500);

export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const generateUser = () => {
	const firstName = randomElement(firstNames);
	const lastName = randomElement(lastNames);
	return {
		id: randomId(),
		name: `${firstName} ${lastName}`,
		email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomElement(domains)}`,
		age: randomInt(18, 65),
		active: Math.random() > 0.3,
	};
};

export const generateUsers = (count: number = randomInt(3, 8)) => {
	return Array.from({ length: count }, generateUser);
};

export const generateProduct = () => ({
	id: randomId(),
	name: `${randomElement(productNames)} ${randomElement(["Pro", "Plus", "Lite", "Max", "Mini"])}`,
	price: parseFloat((Math.random() * 200 + 9.99).toFixed(2)),
	stock: randomInt(0, 500),
	category: randomElement([
		"Electronics",
		"Home",
		"Office",
		"Outdoor",
		"Sports",
	]),
	rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
});

export const generateProducts = (count: number = randomInt(3, 8)) => {
	return Array.from({ length: count }, generateProduct);
};

export const generateStats = () => ({
	activeUsers: randomInt(100, 5000),
	requestsToday: randomInt(10000, 500000),
	avgResponseTime: randomInt(50, 800),
	errorRate: parseFloat((Math.random() * 5).toFixed(2)),
	uptime: parseFloat((99 + Math.random()).toFixed(3)),
	cpuUsage: randomInt(10, 90),
	memoryUsage: randomInt(20, 85),
});

export const generateDataResponse = () => ({
	message: "Data fetched successfully",
	requestId: `req_${randomId()}`,
	version: `v${randomInt(1, 5)}.${randomInt(0, 9)}.${randomInt(0, 20)}`,
	region: randomElement([
		"us-east-1",
		"us-west-2",
		"eu-west-1",
		"ap-southeast-1",
	]),
});

export const generateCreatedUser = (name: string, email: string) => ({
	id: randomId(),
	name,
	email,
	createdAt: new Date().toISOString(),
	verified: false,
	role: randomElement(["user", "admin", "moderator"]),
});

export const generateOrder = (productId: number, quantity: number) => {
	const unitPrice = parseFloat((Math.random() * 100 + 9.99).toFixed(2));
	return {
		id: randomId(),
		productId,
		quantity,
		unitPrice,
		total: parseFloat((unitPrice * quantity).toFixed(2)),
		status: randomElement(["pending", "processing", "confirmed"]),
		estimatedDelivery: new Date(
			Date.now() + randomInt(1, 7) * 24 * 60 * 60 * 1000,
		)
			.toISOString()
			.split("T")[0],
	};
};

export const generateProcessedItems = (items: string[]) => {
	return items.map((item) => ({
		item,
		status: randomElement(["processed", "validated", "transformed"]),
		processingTime: randomInt(10, 200),
		outputSize: randomInt(100, 10000),
		checksum: Math.random().toString(36).substring(2, 10),
	}));
};

export const generateSubmitResponse = (data: string) => ({
	message: "Data submitted successfully",
	received: data,
	processedBytes: data.length * randomInt(1, 4),
	queuePosition: randomInt(1, 100),
	estimatedProcessingTime: randomInt(100, 5000),
});
