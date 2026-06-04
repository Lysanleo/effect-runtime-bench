import { describe, expect, test } from "bun:test";
import { SERVER_CONFIGS } from "./server-configs";

describe("SERVER_CONFIGS", () => {
	test("registers Express and Fastify benchmark targets", () => {
		const names = SERVER_CONFIGS.map((server) => server.name);

		expect(names).toContain("Express (Bun)");
		expect(names).toContain("Fastify (Bun)");
		expect(names).toContain("Express (Node)");
		expect(names).toContain("Fastify (Node)");
	});
});
