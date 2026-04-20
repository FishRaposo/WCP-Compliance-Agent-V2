import { Hono, type Context } from "hono";
import { cors } from "hono/cors";

import { generateWcpDecision } from "./entrypoints/wcp-entrypoint.js";
import { formatApiError, ValidationError } from "./utils/errors.js";
import { isMockMode } from "./utils/mock-responses.js";

async function handleAnalyzeRequest(c: Context) {
  try {
    const body = await c.req.json();
    const { content } = body ?? {};

    if (!content) {
      const error = new ValidationError("Content is required");
      return c.json(formatApiError(error), 400);
    }

    if (typeof content !== "string") {
      const error = new ValidationError("Content must be a string");
      return c.json(formatApiError(error), 400);
    }

    const result = await generateWcpDecision({
      content,
    });

    const requestId = c.req.header("x-request-id") || crypto.randomUUID();

    return c.json({
      ...result,
      requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Error analyzing WCP:", {
      message: error && typeof error === "object" && "message" in error ? String(error.message) : "Unknown error",
      code: error && typeof error === "object" && "code" in error ? String(error.code) : undefined,
      statusCode: error && typeof error === "object" && "statusCode" in error ? Number(error.statusCode) : undefined,
      type: error && typeof error === "object" && "constructor" in error ? String(error.constructor.name) : undefined,
      details: error && typeof error === "object" && "details" in error ? error.details : undefined,
      stack: error && typeof error === "object" && "stack" in error ? String(error.stack) : undefined,
    });

    if (error instanceof SyntaxError) {
      const valError = new ValidationError("Invalid JSON format");
      const formatted = formatApiError(valError);
      return c.json(formatted, 400);
    }

    const formattedError = formatApiError(error);
    return c.json(formattedError, formattedError.error.statusCode as number);
  }
}

export function createApp() {
  const app = new Hono();

  app.use(
    "/*",
    cors({
      origin: (origin) => {
      if (process.env.ALLOWED_ORIGINS) {
        return process.env.ALLOWED_ORIGINS.split(",").includes(origin) ? origin : null;
      }
      const allowed = ["http://localhost:3000", "http://localhost:5173"];
      if (allowed.includes(origin) || /^https:\/\/.*\.vercel\.app$/.test(origin)) {
        return origin;
      }
      return null;
    },
      credentials: true,
    }),
  );

  app.get("/health", (c) => {
    const mockMode = isMockMode();
    return c.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.0.0",
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      mockMode,
      openai: {
        apiKeyConfigured: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'mock',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      },
    });
  });

  // Local dev + production-compatible aliases (frontend calls `/api/analyze`)
  app.post("/analyze", handleAnalyzeRequest);
  app.post("/api/analyze", handleAnalyzeRequest);
  app.get("/api/health", (c) => c.redirect("/health"));

  return app;
}

