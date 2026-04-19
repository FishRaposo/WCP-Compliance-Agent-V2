/**
 * PDF Ingestion
 *
 * Extracts raw text from a PDF buffer using pdf-parse, then feeds it through
 * the standard Layer 1 extraction pipeline.
 *
 * Limitations (Phase 02):
 * - Text PDFs only (no OCR). Scanned PDFs return empty text.
 * - Encrypted/password-protected PDFs raise an IngestionError.
 * - OCR fallback is planned for Phase 05-B.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfParse: (buffer: Buffer, options?: Record<string, unknown>) => Promise<{ text: string; numpages: number; info: Record<string, unknown> }> = require("pdf-parse");

export interface PDFIngestionResult {
  rawText: string;
  pageCount: number;
  extractedAt: string;
  fileName?: string;
}

export class PDFIngestionError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "PDFIngestionError";
  }
}

/**
 * Extract text from a PDF buffer.
 *
 * @param buffer PDF file contents as a Buffer
 * @param fileName Optional filename for logging
 * @returns Extracted text and metadata
 */
export async function extractTextFromPDF(
  buffer: Buffer,
  fileName?: string
): Promise<PDFIngestionResult> {
  try {
    const data = await pdfParse(buffer);

    if (!data.text || data.text.trim().length === 0) {
      throw new PDFIngestionError(
        "PDF appears to be image-only or encrypted — no text extracted. " +
        "OCR support is planned for Phase 05-B."
      );
    }

    return {
      rawText: data.text,
      pageCount: data.numpages,
      extractedAt: new Date().toISOString(),
      fileName,
    };
  } catch (err) {
    if (err instanceof PDFIngestionError) throw err;

    const msg = (err as Error).message ?? String(err);

    if (msg.includes("encrypted") || msg.includes("password")) {
      throw new PDFIngestionError(
        "PDF is encrypted or password-protected and cannot be processed.",
        err as Error
      );
    }

    throw new PDFIngestionError(`Failed to parse PDF: ${msg}`, err as Error);
  }
}
