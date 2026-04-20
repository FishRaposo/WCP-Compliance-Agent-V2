import { Hono, type Context } from "hono";
import { cors } from "hono/cors";

import { generateWcpDecision } from "./entrypoints/wcp-entrypoint.js";
import { formatApiError, ValidationError } from "./utils/errors.js";
import { isMockMode } from "./utils/mock-responses.js";
import { extractTextFromPDF, PDFIngestionError } from "./ingestion/pdf-ingestion.js";
import { parseCSVBuffer, csvToWCPInputs } from "./ingestion/csv-ingestion.js";
import { listDecisions } from "./services/audit-persistence.js";
import { createJob, getJob, updateJob } from "./services/job-queue.js";
import { childLogger } from "./utils/logger.js";

const log = childLogger("App");

function formattedStatusCode(err: unknown): 400 | 422 | 500 {
  if (err && typeof err === "object" && "statusCode" in err) {
    const code = Number((err as { statusCode: unknown }).statusCode);
    if (code === 400 || code === 422) return code;
  }
  return 500;
}

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
    log.error({
      err: error,
    }, "Error analyzing WCP");

    if (error instanceof SyntaxError) {
      const valError = new ValidationError("Invalid JSON format");
      const formatted = formatApiError(valError);
      return c.json(formatted, 400);
    }

    const formattedError = formatApiError(error);
    return c.json(formattedError, formattedError.error.statusCode as 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 503);
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

  // M2: PDF ingestion endpoint
  app.post("/api/analyze-pdf", async (c: Context) => {
    try {
      const body = await c.req.parseBody();
      const file = body["file"] as File | undefined;
      if (!file) {
        return c.json(formatApiError(new ValidationError("No file uploaded (field name: file)")), 400);
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const pdfResult = await extractTextFromPDF(buffer, file.name ?? "upload.pdf");
      const decision = await generateWcpDecision({ content: pdfResult.text });
      return c.json({ ...decision, pdfMeta: { pageCount: pdfResult.pageCount, fileName: pdfResult.fileName, sizeBytes: pdfResult.sizeBytes } });
    } catch (err) {
      if (err instanceof PDFIngestionError) {
        return c.json(formatApiError(new ValidationError(err.message)), 422);
      }
      log.error({ err }, "PDF analysis error");
      return c.json(formatApiError(err), formattedStatusCode(err));
    }
  });

  // M3: CSV bulk ingestion endpoint
  app.post("/api/analyze-csv", async (c: Context) => {
    try {
      const body = await c.req.parseBody();
      const file = body["file"] as File | undefined;
      if (!file) {
        return c.json(formatApiError(new ValidationError("No file uploaded (field name: file)")), 400);
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const csvResult = parseCSVBuffer(buffer, file.name ?? "upload.csv");
      const inputs = csvToWCPInputs(csvResult);
      if (inputs.length === 0) {
        return c.json(formatApiError(new ValidationError("CSV file contains no processable rows")), 422);
      }
      const decisions = await Promise.all(inputs.map((content) => generateWcpDecision({ content })));
      return c.json({ decisions, csvMeta: { rowCount: csvResult.rowCount, fileName: csvResult.fileName, parseErrors: csvResult.errors } });
    } catch (err) {
      log.error({ err }, "CSV analysis error");
      return c.json(formatApiError(err), formattedStatusCode(err));
    }
  });

  // M1: Audit query endpoint
  app.get("/api/decisions", async (c: Context) => {
    const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10), 200);
    const decisions = await listDecisions(limit);
    return c.json({ decisions, count: decisions.length });
  });

  // M8: Async job endpoints
  app.post("/api/jobs", async (c: Context) => {
    try {
      const body = await c.req.json();
      const { content } = body ?? {};
      if (!content || typeof content !== "string") {
        return c.json(formatApiError(new ValidationError("content (string) is required")), 400);
      }
      const jobId = await createJob(content);
      // Fire-and-forget: run pipeline asynchronously
      (async () => {
        try {
          const result = await generateWcpDecision({ content });
          await updateJob(jobId, "completed", result);
        } catch (err) {
          await updateJob(jobId, "failed", undefined, err instanceof Error ? err.message : String(err));
        }
      })();
      return c.json({ jobId, status: "pending" }, 202);
    } catch (err) {
      log.error({ err }, "Failed to create job");
      return c.json(formatApiError(err), 500);
    }
  });

  app.get("/api/jobs/:jobId", async (c: Context) => {
    const { jobId } = c.req.param();
    const job = await getJob(jobId);
    if (!job) {
      return c.json(formatApiError(new ValidationError(`Job ${jobId} not found`)), 404);
    }
    return c.json(job);
  });

  return app;
}

