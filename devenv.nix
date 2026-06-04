{ pkgs, lib, config, inputs, ... }:

{
  packages = [
    pkgs.bun
    pkgs.git
    pkgs.nodejs_24
  ];

  tasks = {
    "deps:install".exec = "bun install";
    "check:type".exec = "bunx tsc --noEmit";
    "app:effect".exec = "bun run effect:start";
    "app:elysia".exec = "bun run elysia:start";
    "app:hono".exec = "bun run hono:start";
    "app:node-effect".exec = "bun run node-effect:start";
    "app:node-hono".exec = "bun run node-hono:start";
    "app:node-hono-effect".exec = "bun run node-hono-effect:start";
    "bench:run".exec = "bun run benchmark";
    "bench:stress".exec = "bun run stress";
  };

  enterTest = ''
    bun --version
    node --version
    bun install --frozen-lockfile
    bunx tsc --noEmit
  '';
}
