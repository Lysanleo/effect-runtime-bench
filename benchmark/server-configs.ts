import {
	EFFECT_PORT,
	ELYSIA_PORT,
	HONO_PORT,
	NODE_EFFECT_PORT,
	NODE_HONO_EFFECT_PORT,
	NODE_HONO_PORT,
} from "./constants";
import type { ServerConfig } from "./types";

export const SERVER_CONFIGS: ServerConfig[] = [
	{
		name: "Effect (Bun)",
		command: ["bun", "run", "servers/effect-server.ts"],
		port: EFFECT_PORT,
	},
	{
		name: "Elysia (Bun)",
		command: ["bun", "run", "servers/elysia-server.ts"],
		port: ELYSIA_PORT,
	},
	{
		name: "Hono (Bun)",
		command: ["bun", "run", "servers/hono-server.ts"],
		port: HONO_PORT,
	},
	{
		name: "Effect (Node)",
		command: ["node", "--import", "tsx", "servers/node-effect-server.ts"],
		port: NODE_EFFECT_PORT,
	},
	{
		name: "Hono (Node)",
		command: ["node", "--import", "tsx", "servers/node-hono-server.ts"],
		port: NODE_HONO_PORT,
	},
	{
		name: "Hono + Effect Core (Node)",
		command: ["node", "--import", "tsx", "servers/hono-effect-server.ts"],
		port: NODE_HONO_EFFECT_PORT,
	},
];
