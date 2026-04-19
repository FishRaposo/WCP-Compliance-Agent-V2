/**
 * CSV Ingestion
 *
 * Parses a WCP CSV file (e.g., exported WH-347 data) into an array of
 * ExtractedWCP records ready for pipeline processing.
 *
 * Supports flexible column headers: normalises to canonical field names.
 * Skips rows that don't have at minimum a role and wage value.
 */

import { parse } from "csv-parse/sync";
import type { ExtractedWCP } from "../types/decision-pipeline.js";

// ============================================================================
// Column header normalisation map
// ============================================================================

const COLUMN_ALIASES: Record<string, keyof ExtractedWCP> = {
  // Role / Classification
  role: "role",
  classification: "role",
  trade: "role",
  position: "role",
  "trade classification": "role",
  "job classification": "role",

  // Worker name
  name: "workerName",
  worker: "workerName",
  employee: "workerName",
  "worker name": "workerName",
  "employee name": "workerName",

  // Hours
  hours: "hours",
  hrs: "hours",
  "total hours": "hours",
  "hours worked": "hours",

  // Wage
  wage: "wage",
  rate: "wage",
  pay: "wage",
  hourly: "wage",
  "hourly rate": "wage",
  "pay rate": "wage",
  "wage rate": "wage",

  // Fringe
  fringe: "fringe",
  benefits: "fringe",
  "fringe benefits": "fringe",
  "fringe rate": "fringe",

  // Gross pay
  gross: "grossPay",
  "gross pay": "grossPay",
  "total pay": "grossPay",
  "total earnings": "grossPay",

  // Week ending
  "week ending": "weekEnding",
  "week-ending": "weekEnding",
  we: "weekEnding",
  "week end": "weekEnding",

  // Project
  project: "projectId",
  contract: "projectId",
  job: "projectId",
  "project id": "projectId",
  "contract number": "projectId",
};

// ============================================================================
// CSV parsing
// ============================================================================

export interface CSVIngestionResult {
  rows: ExtractedWCP[];
  rowCount: number;
  skipped: number;
  errors: string[];
}

/**
 * Parse a WCP CSV file into ExtractedWCP records.
 *
 * @param csvContent Raw CSV string content
 * @returns Parsed rows with skip/error counts
 */
export function parseWCPCSV(csvContent: string): CSVIngestionResult {
  const errors: string[] = [];
  let skipped = 0;

  let rawRows: Record<string, string>[];
  try {
    rawRows = parse(csvContent, {
      columns: (headers: string[]) => headers.map((h) => h.toLowerCase().trim()),
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];
  } catch (err) {
    return {
      rows: [],
      rowCount: 0,
      skipped: 0,
      errors: [`CSV parse error: ${(err as Error).message}`],
    };
  }

  const rows: ExtractedWCP[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const mapped: Partial<Record<keyof ExtractedWCP, string>> = {};

    // Map columns to canonical names
    for (const [col, value] of Object.entries(raw)) {
      const canonical = COLUMN_ALIASES[col];
      if (canonical && value) {
        mapped[canonical] = value;
      }
    }

    const roleRaw = mapped.role;
    const wageRaw = mapped.wage;

    // Minimum required: role and wage
    if (!roleRaw || !wageRaw) {
      skipped++;
      if (!roleRaw) errors.push(`Row ${i + 2}: missing role/classification column`);
      if (!wageRaw) errors.push(`Row ${i + 2}: missing wage/rate column`);
      continue;
    }

    const wage = parseFloat(wageRaw);
    const hours = mapped.hours ? parseFloat(String(mapped.hours)) : 0;
    const regularHours = Math.min(hours, 40);
    const overtimeHours = Math.max(0, hours - 40);

    if (isNaN(wage)) {
      errors.push(`Row ${i + 2}: invalid wage value "${wageRaw}"`);
      skipped++;
      continue;
    }

    const rawInput = Object.entries(raw).map(([k, v]) => `${k}: ${v}`).join(", ");

    rows.push({
      rawInput,
      workerName: mapped.workerName,
      role: roleRaw.trim(),
      hours,
      regularHours,
      overtimeHours,
      wage,
      fringe: mapped.fringe ? parseFloat(String(mapped.fringe)) : undefined,
      grossPay: mapped.grossPay
        ? parseFloat(String(mapped.grossPay))
        : wage > 0 && hours > 0
          ? parseFloat((wage * regularHours + wage * 1.5 * overtimeHours).toFixed(2))
          : undefined,
      weekEnding: mapped.weekEnding,
      projectId: mapped.projectId,
    });
  }

  return {
    rows,
    rowCount: rows.length,
    skipped,
    errors,
  };
}
