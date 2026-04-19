/**
 * Ingestion Router
 *
 * Detects the input type (PDF / CSV / plain text) and routes to the
 * appropriate parser. Returns a normalized list of raw text inputs ready
 * for the Layer 1 extraction pipeline.
 */

import { extractTextFromPDF, PDFIngestionError } from "./pdf-ingestion.js";
import { parseWCPCSV } from "./csv-ingestion.js";

export type IngestionType = "pdf" | "csv" | "text";

export interface IngestionInput {
  /** File contents as Buffer (for PDF/CSV) or string (for plain text) */
  content: Buffer | string;
  /** Optional MIME type hint */
  mimeType?: string;
  /** Optional filename hint */
  fileName?: string;
}

export interface IngestionOutput {
  type: IngestionType;
  /** Array of raw WCP text strings ready for Layer 1 processing */
  textInputs: string[];
  /** Number of records parsed */
  count: number;
  /** Any non-fatal warnings during parsing */
  warnings: string[];
}

/**
 * Detect input type from hints and content sniffing.
 */
function detectType(input: IngestionInput): IngestionType {
  if (input.mimeType) {
    if (input.mimeType.includes("pdf")) return "pdf";
    if (input.mimeType.includes("csv") || input.mimeType.includes("comma-separated")) return "csv";
    if (input.mimeType.includes("text")) return "text";
  }

  if (input.fileName) {
    const lower = input.fileName.toLowerCase();
    if (lower.endsWith(".pdf")) return "pdf";
    if (lower.endsWith(".csv")) return "csv";
  }

  // Content sniffing
  if (Buffer.isBuffer(input.content)) {
    // PDF magic bytes: %PDF
    if (input.content.slice(0, 4).toString("ascii") === "%PDF") return "pdf";
    // Try decoding as text and check for CSV structure
    const text = input.content.toString("utf-8", 0, 200);
    if (text.includes(",") && text.split("\n").length > 1) return "csv";
  }

  return "text";
}

/**
 * Route an ingestion input to the appropriate parser and return normalised text inputs.
 *
 * @param input Ingestion input (file buffer or plain text)
 * @returns Normalized text inputs ready for Layer 1
 */
export async function routeIngestion(input: IngestionInput): Promise<IngestionOutput> {
  const type = detectType(input);
  const warnings: string[] = [];

  switch (type) {
    case "pdf": {
      const buffer = Buffer.isBuffer(input.content)
        ? input.content
        : Buffer.from(input.content as string, "utf-8");

      let pdfResult;
      try {
        pdfResult = await extractTextFromPDF(buffer, input.fileName);
      } catch (err) {
        if (err instanceof PDFIngestionError) {
          return { type, textInputs: [], count: 0, warnings: [err.message] };
        }
        throw err;
      }

      return {
        type,
        textInputs: [pdfResult.rawText],
        count: 1,
        warnings,
      };
    }

    case "csv": {
      const text = Buffer.isBuffer(input.content)
        ? input.content.toString("utf-8")
        : (input.content as string);

      const csvResult = parseWCPCSV(text);

      if (csvResult.errors.length > 0) {
        warnings.push(...csvResult.errors);
      }

      // Each CSV row becomes its own text input using the rawInput property
      return {
        type,
        textInputs: csvResult.rows.map((r) => r.rawInput),
        count: csvResult.rowCount,
        warnings,
      };
    }

    default: {
      const text = Buffer.isBuffer(input.content)
        ? input.content.toString("utf-8")
        : (input.content as string);

      return {
        type: "text",
        textInputs: [text],
        count: 1,
        warnings,
      };
    }
  }
}
