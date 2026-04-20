import { serve } from "@hono/node-server";
import { validateEnvironmentOrExit } from "./utils/env-validator.js";
import { createApp } from "./app.js";

// Validate environment before starting server
validateEnvironmentOrExit();

const app = createApp();

const port = parseInt(process.env.PORT || '3000', 10);
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
