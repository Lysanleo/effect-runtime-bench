import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { HttpServer } from "effect/unstable/http";
import { Layer } from "effect";
import { effectHttpApp } from "./effect-http-routes";

const PORT = 3000;

const app = effectHttpApp.pipe(
	HttpServer.withLogAddress,
	Layer.provide(BunHttpServer.layer({ port: PORT })),
);

BunRuntime.runMain(Layer.launch(app));
