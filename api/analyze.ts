/**
 * Vercel Serverless Function — POST /api/analyze
 *
 * BYOK model: reads X-OpenAI-Key header and uses it for this request only.
 * Falls back to OPENAI_API_KEY env var, then to mock mode if neither is set.
 *
 * The key is NEVER logged, stored, or forwarded anywhere except to OpenAI.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS — allow the showcase frontend
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-OpenAI-Key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed", statusCode: 405 } });
  }

  // BYOK: read per-request key from header, fall back to env var
  const byokKey = req.headers["x-openai-key"];
  const keyToUse = (Array.isArray(byokKey) ? byokKey[0] : byokKey) || process.env.OPENAI_API_KEY || "";

  // Override env for this invocation (Vercel serverless = single-tenant per request)
  process.env.OPENAI_API_KEY = keyToUse;

  const { content } = req.body ?? {};

  if (!content || typeof content !== "string") {
    return res.status(400).json({
      error: { message: "content is required and must be a string", statusCode: 400 },
    });
  }

  try {
    // Dynamic import keeps cold-start lean and avoids top-level env read
    const { generateWcpDecision } = await import("../dist/entrypoints/wcp-entrypoint.js");
    const result = await generateWcpDecision({ content });
    return res.status(200).json({
      ...result,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      mockMode: !keyToUse || ["mock", "mock-key", "test-api-key"].includes(keyToUse),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ error: { message, statusCode: 500 } });
  }
}
