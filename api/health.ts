/**
 * Vercel Serverless Function — GET /api/health
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const key = process.env.OPENAI_API_KEY || "";
  const mockMode = !key || ["mock", "mock-key", "test-api-key", ""].includes(key);

  return res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.6.0",
    environment: process.env.NODE_ENV || "production",
    mockMode,
    byok: true,
    openai: {
      apiKeyConfigured: !mockMode,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    },
  });
}
