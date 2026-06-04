import {
	EFFECT_PORT,
	ELYSIA_PORT,
	EXPRESS_PORT,
	FASTIFY_PORT,
	HONO_PORT,
	NODE_EFFECT_PORT,
	NODE_EXPRESS_PORT,
	NODE_FASTIFY_PORT,
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
		name: "Express (Bun)",
		command: ["bun", "run", "servers/express-server.ts"],
		port: EXPRESS_PORT,
	},
	{
		name: "Fastify (Bun)",
		command: ["bun", "run", "servers/fastify-server.ts"],
		port: FASTIFY_PORT,
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
		name: "Express (Node)",
		command: ["node", "--import", "tsx", "servers/node-express-server.ts"],
		port: NODE_EXPRESS_PORT,
	},
	{
		name: "Fastify (Node)",
		command: ["node", "--import", "tsx", "servers/node-fastify-server.ts"],
		port: NODE_FASTIFY_PORT,
	},
	{
		name: "Hono + Effect Core (Node)",
		command: ["node", "--import", "tsx", "servers/hono-effect-server.ts"],
		port: NODE_HONO_EFFECT_PORT,
	},
];
