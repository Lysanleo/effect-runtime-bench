import { serve } from "@hono/node-server";
import { app } from "./hono-server";

const PORT = 3102;

serve({ fetch: app.fetch, port: PORT }, () => {
	console.log(`Hono Node server running at http://localhost:${PORT}`);
});
