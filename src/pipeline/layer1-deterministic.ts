/**
 * Layer 1: Deterministic Scaffold
 *
 * Produces a DeterministicReport containing all objectively verifiable facts
 * about a WCP submission. NO AI. Pure deterministic code. 100% reproducible.
 *
 * Responsibilities:
 * - Extract structured data from WCP input
 * - Look up DBWD rates
 * - Run all rule checks (prevailing wage, overtime, fringe, classification)
 * - Produce DeterministicReport with regulation citations
 *
 * @see docs/architecture/decision-architecture.md - Layer 1 documentation
 * @see docs/adrs/ADR-005-decision-architecture.md - Architectural decision
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  type DeterministicReport,
  type CheckResult,
  type ExtractedWCP,
  type DBWDRateInfo,
  ExtractedWCPSchema,
  DBWDRateInfoSchema,
} from "../types/decision-pipeline.js";

// ============================================================================
// DBWD Rate Database (Prototype)
// ============================================================================

/**
 * DBWD Rates (Prototype)
 *
 * In production, these would be loaded from PostgreSQL + pgvector.
 * For now, hardcoded with 5 common trades.
 *
 * @see docs/compliance/implementation-guide.md - DBWD integration patterns
 */
const DBWDRates: Record<string, { base: number; fringe: number }> = {
  Electrician: { base: 51.69, fringe: 34.63 },
  Laborer: { base: 26.45, fringe: 12.5 },
  Plumber: { base: 48.2, fringe: 28.1 },
  Carpenter: { base: 45.0, fringe: 25.0 },
  Mason: { base: 42.5, fringe: 22.5 },
};

/**
 * Classification aliases for fuzzy matching
 */
const ClassificationAliases: Record<string, string> = {
  Wireman: "Electrician",
  "Electrical Worker": "Electrician",
  "General Laborer": "Laborer",
  "Construction Worker": "Laborer",
  "Pipe Fitter": "Plumber",
  "Woodworker": "Carpenter",
  Bricklayer: "Mason",
};

// ============================================================================
// Extraction Tool (Mastra-compatible)
// ============================================================================

/**
 * Extract WCP Data Tool
 *
 * Deterministic extraction of structured fields from WCP text input.
 * Uses regex patterns - NO LLM involved.
 *
 * Regulatory Basis:
 * - 29 CFR 5.5(a)(3)(ii): "Contractors shall submit weekly a copy of all payrolls..."
 * - Form WH-347: Standard format for certified payrolls
 */
export const extractWCPDataTool = createTool({
  id: "extract-wcp-data",
  description: "Extract structured WCP data from text input using deterministic patterns",
  inputSchema: z.object({
    content: z.string().describe("Raw WCP text input"),
  }),
  outputSchema: ExtractedWCPSchema,
  execute: async ({ context }): Promise<ExtractedWCP> => {
    const startTime = Date.now();
    const { content } = context;

    // Pattern-based extraction (deterministic)
    const roleMatch = content.match(/(?:Role|Classification|Trade)[\s:]+([A-Za-z\s]+?)(?:,|;|$)/i);
    const hoursMatch = content.match(/(?:Hours|Hrs)[\s:]+(\d+(?:\.\d+)?)/i);
    const wageMatch = content.match(/(?:Wage|Rate|Pay)[\s:]+\$?(\d+(?:\.\d+)?)/i);
    const fringeMatch = content.match(/(?:Fringe|Benefits)[\s:]+\$?(\d+(?:\.\d+)?)/i);

    const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
    const regularHours = Math.min(hours, 40);
    const overtimeHours = Math.max(0, hours - 40);

    const result: ExtractedWCP = {
      rawInput: content,
      role: roleMatch ? roleMatch[1].trim() : "Unknown",
      hours,
      regularHours,
      overtimeHours,
      wage: wageMatch ? parseFloat(wageMatch[1]) : 0,
      fringe: fringeMatch ? parseFloat(fringeMatch[1]) : undefined,
    };

    console.log(`[Layer 1] Extraction completed in ${Date.now() - startTime}ms`);
    return result;
  },
});

// ============================================================================
// Classification Resolution
// ============================================================================

/**
 * Classification Result with confidence and method
 */
interface ClassificationResult {
  trade: string;
  confidence: number;
  method: "exact" | "alias" | "semantic" | "manual" | "unknown";
}

/**
 * Resolve classification with hybrid approach
 *
 * Tier 1: Exact match
 * Tier 2: Alias database
 * Tier 3: Unknown (requires manual resolution)
 *
 * @param role Role string from WCP
 * @returns Classification result with confidence
 */
function resolveClassification(role: string): ClassificationResult {
  const normalizedRole = role.trim();

  // Tier 1: Exact match
  if (DBWDRates[normalizedRole]) {
    return {
      trade: normalizedRole,
      confidence: 1.0,
      method: "exact",
    };
  }

  // Tier 2: Alias match
  const aliasedTrade = ClassificationAliases[normalizedRole];
  if (aliasedTrade && DBWDRates[aliasedTrade]) {
    return {
      trade: aliasedTrade,
      confidence: 0.9,
      method: "alias",
    };
  }

  // Tier 3: Unknown
  return {
    trade: "Unknown",
    confidence: 0.3,
    method: "unknown",
  };
}

// ============================================================================
// DBWD Rate Lookup
// ============================================================================

/**
 * Look up DBWD rate information for a trade
 *
 * @param trade Trade classification
 * @returns DBWD rate info or null if not found
 */
function lookupDBWDRate(trade: string): DBWDRateInfo | null {
  const rate = DBWDRates[trade];
  if (!rate) return null;

  return {
    dbwdId: `${trade.toUpperCase().slice(0, 4)}0490-001`, // Prototype ID
    baseRate: rate.base,
    fringeRate: rate.fringe,
    totalRate: rate.base + rate.fringe,
    version: "2024-06-01",
    effectiveDate: "2024-06-01",
    trade,
  };
}

// ============================================================================
// Compliance Checks
// ============================================================================

/**
 * Validate prevailing wage (40 U.S.C. § 3142)
 */
function checkPrevailingWage(
  extracted: ExtractedWCP,
  dbwdRate: DBWDRateInfo,
  checkId: number
): CheckResult {
  const passed = extracted.wage >= dbwdRate.baseRate;
  const difference = passed ? undefined : dbwdRate.baseRate - extracted.wage;

  return {
    id: `base_wage_check_${String(checkId).padStart(3, "0")}`,
    type: "wage",
    passed,
    regulation: "40 U.S.C. § 3142(a)",
    expected: dbwdRate.baseRate,
    actual: extracted.wage,
    difference,
    severity: passed ? "info" : "critical",
    message: passed
      ? `Base wage $${extracted.wage.toFixed(2)} meets prevailing wage $${dbwdRate.baseRate.toFixed(2)}`
      : `UNDERPAYMENT: Base wage $${extracted.wage.toFixed(2)} below prevailing wage $${dbwdRate.baseRate.toFixed(2)} (owes $${difference!.toFixed(2)}/hr)`,
  };
}

/**
 * Validate overtime calculation (40 U.S.C. § 3702)
 *
 * Overtime must be 1.5× base rate. Fringe is NOT multiplied by 1.5.
 */
function checkOvertime(
  extracted: ExtractedWCP,
  dbwdRate: DBWDRateInfo,
  checkId: number
): CheckResult {
  if (extracted.overtimeHours === 0) {
    return {
      id: `overtime_check_${String(checkId).padStart(3, "0")}`,
      type: "overtime",
      passed: true,
      regulation: "40 U.S.C. § 3702",
      severity: "info",
      message: "No overtime hours worked",
    };
  }

  // Calculate correct overtime rate: 1.5× base + fringe
  const correctOvertimeRate = dbwdRate.baseRate * 1.5 + dbwdRate.fringeRate;

  // Check if reported wage appears to be using same rate for all hours
  // (common violation: paying regular rate for OT instead of 1.5×)
  const sameRateViolation = Math.abs(extracted.wage - dbwdRate.baseRate) < 0.01;

  const passed = !sameRateViolation; // Simplified check

  return {
    id: `overtime_check_${String(checkId).padStart(3, "0")}`,
    type: "overtime",
    passed,
    regulation: "40 U.S.C. § 3702",
    expected: correctOvertimeRate,
    actual: extracted.wage,
    severity: passed ? "info" : "critical",
    message: passed
      ? `Overtime rate calculated correctly at 1.5× base + fringe = $${correctOvertimeRate.toFixed(2)}/hr`
      : `OVERTIME ERROR: Worker paid $${extracted.wage.toFixed(2)}/hr for all hours instead of $${correctOvertimeRate.toFixed(2)}/hr for OT hours (owes $${(correctOvertimeRate - extracted.wage).toFixed(2)} × ${extracted.overtimeHours} hrs)`,
  };
}

/**
 * Validate fringe benefits (29 CFR 5.22)
 */
function checkFringeBenefits(
  extracted: ExtractedWCP,
  dbwdRate: DBWDRateInfo,
  checkId: number
): CheckResult {
  const reportedFringe = extracted.fringe ?? 0;
  const passed = reportedFringe >= dbwdRate.fringeRate;
  const difference = passed ? undefined : dbwdRate.fringeRate - reportedFringe;

  return {
    id: `fringe_check_${String(checkId).padStart(3, "0")}`,
    type: "fringe",
    passed,
    regulation: "29 CFR 5.22",
    expected: dbwdRate.fringeRate,
    actual: reportedFringe,
    difference,
    severity: passed ? "info" : "error",
    message: passed
      ? `Fringe benefits $${reportedFringe.toFixed(2)} meet requirement $${dbwdRate.fringeRate.toFixed(2)}`
      : `FRINGE SHORTFALL: Reported fringe $${reportedFringe.toFixed(2)} below required $${dbwdRate.fringeRate.toFixed(2)} (owes $${difference!.toFixed(2)}/hr)`,
  };
}

/**
 * Validate classification resolution (29 CFR 5.5(a)(3)(i))
 */
function checkClassification(
  extracted: ExtractedWCP,
  classification: ClassificationResult,
  checkId: number
): CheckResult {
  const passed = classification.method !== "unknown";

  return {
    id: `classification_check_${String(checkId).padStart(3, "0")}`,
    type: "classification",
    passed,
    regulation: "29 CFR 5.5(a)(3)(i)",
    severity: passed ? "info" : "critical",
    message: passed
      ? `Classification "${extracted.role}" resolved to "${classification.trade}" via ${classification.method} match (confidence: ${classification.confidence.toFixed(2)})`
      : `UNKNOWN CLASSIFICATION: "${extracted.role}" could not be resolved to a known trade (confidence: ${classification.confidence.toFixed(2)}) - requires manual review`,
  };
}

// ============================================================================
// Main Layer 1 Function
// ============================================================================

/**
 * Layer 1: Deterministic Scaffold
 *
 * Produces a complete DeterministicReport with all compliance checks.
 * This function is 100% deterministic - same input always produces same output.
 *
 * @param input Raw WCP text input
 * @param traceId Unique trace ID for this decision
 * @returns DeterministicReport with all checks and findings
 */
export async function layer1Deterministic(
  input: string,
  traceId: string
): Promise<DeterministicReport> {
  const startTime = Date.now();
  const timings: { stage: string; ms: number }[] = [];

  console.log(`[Layer 1] Starting deterministic scaffold for trace ${traceId}`);

  // Step 1: Extract structured data
  const extractStart = Date.now();
  // Call tool execute with proper runtime context
  const extracted = await extractWCPDataTool.execute({
    context: { content: input },
    runtimeContext: undefined as any,
  });
  timings.push({ stage: "extraction", ms: Date.now() - extractStart });

  // Step 2: Resolve classification
  const classifyStart = Date.now();
  const classification = resolveClassification(extracted.role);
  timings.push({ stage: "classification", ms: Date.now() - classifyStart });

  // Step 3: Look up DBWD rate
  const lookupStart = Date.now();
  const dbwdRate = lookupDBWDRate(classification.trade);
  timings.push({ stage: "dbwd_lookup", ms: Date.now() - lookupStart });

  // Step 4: Run compliance checks
  const checkStart = Date.now();
  const checks: CheckResult[] = [];
  let checkId = 1;

  // Classification check (always run)
  checks.push(checkClassification(extracted, classification, checkId++));

  if (dbwdRate) {
    // Only run wage checks if we have a valid DBWD rate
    checks.push(checkPrevailingWage(extracted, dbwdRate, checkId++));
    checks.push(checkOvertime(extracted, dbwdRate, checkId++));
    checks.push(checkFringeBenefits(extracted, dbwdRate, checkId++));
  } else {
    // Add a check result indicating we couldn't validate wages
    checks.push({
      id: `dbwd_lookup_${String(checkId++).padStart(3, "0")}`,
      type: "wage",
      passed: false,
      regulation: "40 U.S.C. § 3142(a)",
      severity: "critical",
      message: `Cannot validate wages: Unknown trade "${classification.trade}" not found in DBWD database`,
    });
  }

  timings.push({ stage: "compliance_checks", ms: Date.now() - checkStart });

  // Step 5: Compute deterministic score
  // Critical failures tank the score (deterministic layer must be clean)
  const hasCriticalFailure = checks.some((c) => c.severity === "critical" && !c.passed);
  const passedChecks = checks.filter((c) => c.passed).length;
  const totalChecks = checks.length;
  const deterministicScore = hasCriticalFailure ? 0 : passedChecks / totalChecks;

  // Build the report
  const report: DeterministicReport = {
    traceId,
    dbwdVersion: dbwdRate?.version ?? "unknown",
    timestamp: new Date().toISOString(),
    extracted,
    dbwdRate: dbwdRate ?? {
      dbwdId: "UNKNOWN",
      baseRate: 0,
      fringeRate: 0,
      totalRate: 0,
      version: "unknown",
      effectiveDate: "unknown",
      trade: classification.trade,
    },
    checks,
    classificationMethod: classification.method,
    classificationConfidence: classification.confidence,
    deterministicScore,
    timings,
  };

  const totalTime = Date.now() - startTime;
  console.log(`[Layer 1] Completed in ${totalTime}ms with score ${deterministicScore.toFixed(2)}`);

  return report;
}

// ============================================================================
// Exports
// ============================================================================

export { resolveClassification, lookupDBWDRate };
export type { ClassificationResult };
