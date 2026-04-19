/**
 * Unit tests for CSV ingestion
 */

import { describe, it, expect } from "vitest";
import { parseWCPCSV } from "../../src/ingestion/csv-ingestion.js";

describe("parseWCPCSV", () => {
  it("parses a minimal valid CSV", () => {
    const csv = `role,wage,hours\nElectrician,51.69,40\nLaborer,26.45,40`;
    const result = parseWCPCSV(csv);
    expect(result.rowCount).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.rows[0].role).toBe("Electrician");
    expect(result.rows[0].wage).toBe(51.69);
    expect(result.rows[0].hours).toBe(40);
  });

  it("normalises column header aliases", () => {
    const csv = `classification,hourly rate,hours worked,fringe benefits\nPlumber,48.20,40,28.10`;
    const result = parseWCPCSV(csv);
    expect(result.rowCount).toBe(1);
    expect(result.rows[0].role).toBe("Plumber");
    expect(result.rows[0].wage).toBe(48.2);
    expect(result.rows[0].fringe).toBe(28.1);
  });

  it("skips rows missing role column and records error", () => {
    const csv = `wage,hours\n51.69,40`;
    const result = parseWCPCSV(csv);
    expect(result.rowCount).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("skips rows missing wage column and records error", () => {
    const csv = `role,hours\nElectrician,40`;
    const result = parseWCPCSV(csv);
    expect(result.rowCount).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it("skips rows with invalid wage value", () => {
    const csv = `role,wage,hours\nElectrician,not-a-number,40`;
    const result = parseWCPCSV(csv);
    expect(result.rowCount).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.errors.some((e) => e.includes("invalid wage"))).toBe(true);
  });

  it("computes regularHours and overtimeHours", () => {
    const csv = `role,wage,hours\nElectrician,51.69,50`;
    const result = parseWCPCSV(csv);
    expect(result.rows[0].regularHours).toBe(40);
    expect(result.rows[0].overtimeHours).toBe(10);
  });

  it("computes grossPay when not provided", () => {
    const csv = `role,wage,hours\nElectrician,51.69,40`;
    const result = parseWCPCSV(csv);
    // 40 regular hours * 51.69 = 2067.60
    expect(result.rows[0].grossPay).toBeCloseTo(2067.6, 1);
  });

  it("uses provided grossPay from 'gross pay' column", () => {
    const csv = `role,wage,hours,gross pay\nElectrician,51.69,40,2500`;
    const result = parseWCPCSV(csv);
    expect(result.rows[0].grossPay).toBe(2500);
  });

  it("parses worker name and week ending", () => {
    const csv = `role,wage,hours,worker name,week ending\nCarpenter,45.00,40,John Smith,2024-06-07`;
    const result = parseWCPCSV(csv);
    expect(result.rows[0].workerName).toBe("John Smith");
    expect(result.rows[0].weekEnding).toBe("2024-06-07");
  });

  it("returns errors array for invalid CSV structure", () => {
    const csv = `not,valid\x00\x01csv`;
    const result = parseWCPCSV(csv);
    // Should not throw — errors in errors array
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it("handles empty CSV", () => {
    const result = parseWCPCSV("");
    expect(result.rowCount).toBe(0);
    expect(result.skipped).toBe(0);
  });

  it("handles CSV with only header row", () => {
    const csv = `role,wage,hours`;
    const result = parseWCPCSV(csv);
    expect(result.rowCount).toBe(0);
  });
});
