import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

import { generateWcpDecision } from "./entrypoints/wcp-entrypoint.js";
import { formatApiError, ValidationError } from "./utils/errors.js";

async function handleAnalyzeRequest(c: any) {
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
      maxSteps: parseInt(process.env.AGENT_MAX_STEPS || "3", 10),
    });

    const requestId = c.req.header("x-request-id") || crypto.randomUUID();

    return c.json({
      ...result,
      requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error analyzing WCP:", {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      type: error.constructor.name,
      details: error.details,
      stack: error.stack,
    });

    if (error instanceof SyntaxError) {
      const valError = new ValidationError("Invalid JSON format");
      const formatted = formatApiError(valError);
      return c.json(formatted, 400);
    }

    const formattedError = formatApiError(error);
    return c.json(formattedError, formattedError.error.statusCode as any);
  }
}

export function createApp() {
  const app = new Hono();

  // Add security headers (X-XSS-Protection, X-Frame-Options, X-Content-Type-Options, etc.)
  app.use("*", secureHeaders());

  app.use(
    "/*",
    cors({
      origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
      credentials: true,
    }),
  );

  app.get("/health", (c) => {
    return c.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.0.0",
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      openai: {
        apiKeyConfigured: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'mock',
        model: process.env.OPENAI_MODEL || 'gpt-5-nano',
      },
    });
  });

  // Local dev + production-compatible aliases (frontend calls `/api/analyze`)
  app.post("/analyze", handleAnalyzeRequest);
  app.post("/api/analyze", handleAnalyzeRequest);
  app.get("/api/health", (c) => c.redirect("/health"));

  return app;
}

