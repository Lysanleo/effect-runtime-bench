import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Layer } from "effect";
import { createServer } from "node:http";
import { HttpServer } from "effect/unstable/http";
import { effectHttpApp } from "./effect-http-routes";

const PORT = 3100;

const app = effectHttpApp.pipe(
	HttpServer.withLogAddress,
	Layer.provide(NodeHttpServer.layer(() => createServer(), { port: PORT })),
);

NodeRuntime.runMain(Layer.launch(app));
