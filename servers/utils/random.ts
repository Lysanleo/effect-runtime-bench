export const randomInt = (min: number, max: number) =>
	Math.floor(Math.random() * (max - min + 1)) + min;

export const randomElement = <T>(arr: T[]): T =>
	arr[Math.floor(Math.random() * arr.length)];

export const randomElements = <T>(arr: T[], count: number): T[] => {
	const shuffled = [...arr].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, count);
};

export const randomId = () => randomInt(1000, 99999);

export const randomUuid = () => crypto.randomUUID();

export const randomDelay = () => randomInt(50, 300);

export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const generateSessionId = () => `sess_${randomUuid()}`;

export const generateTrackingId = () => `track_${randomUuid()}`;
