/**
 * Layer 2: LLM Verdict
 *
 * LLM reasoning over the deterministic report from Layer 1.
 * FORBIDDEN from recomputing values - must reference Layer 1 check IDs.
 *
 * Responsibilities:
 * - Accept DeterministicReport as input
 * - Generate LLM verdict with reasoning
 * - Enforce that verdict cites specific check IDs from report
 * - Capture full reasoning trace for audit
 *
 * @see docs/architecture/decision-architecture.md - Layer 2 documentation
 * @see docs/adrs/ADR-005-decision-architecture.md - Architectural decision
 */

import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core";
import { z } from "zod";
import {
  type DeterministicReport,
  type LLMVerdict,
  LLMVerdictSchema,
  validateReferencedCheckIds,
} from "../types/decision-pipeline.js";
import { generateMockWcpDecision, isMockMode } from "../utils/mock-responses.js";

// ============================================================================
// LLM Agent Configuration
// ============================================================================

/**
 * WCP Verdict Agent
 *
 * Specialized agent for Layer 2 reasoning.
 * Uses tight prompt constraints to prevent recomputation.
 */
const wcpVerdictAgent = new Agent({
  name: "wcp-verdict-agent",
  instructions: [
    "You are a compliance auditor reviewing a pre-computed WCP (Weekly Certified Payroll) compliance report.",
    "",
    "CRITICAL CONSTRAINT: You MUST NOT recompute wages, overtime, or fringe benefits.",
    "You MUST NOT look up DBWD rates yourself.",
    "You MUST NOT perform any arithmetic calculations.",
    "",
    "Your ONLY job is to:",
    "1. Review the findings in the provided DeterministicReport",
    "2. Decide: Approved (no violations), Revise (minor violations), or Reject (major violations)",
    "3. Provide rationale that references SPECIFIC check IDs from the report",
    "4. Cite the relevant regulations (40 U.S.C. § 3142, 40 U.S.C. § 3702, etc.)",
    "",
    "OUTPUT REQUIREMENTS:",
    "- status: Must be 'Approved', 'Revise', or 'Reject'",
    "- rationale: Human-readable explanation citing check IDs",
    "- referencedCheckIds: Array of check IDs you referenced (MUST be non-empty, MUST be valid IDs from report)",
    "- selfConfidence: Your confidence in this verdict (0.0-1.0)",
    "- reasoningTrace: Your step-by-step reasoning process",
    "",
    "VIOLATION HANDLING:",
    "- Critical violations (underpayment, unknown classification) → Reject",
    "- Error-level violations (fringe shortfall) → Revise",
    "- Warnings only → Revise or Approved depending on severity",
    "",
    "Remember: The arithmetic is already done. You are a REVIEWER, not a CALCULATOR.",
  ],
  model: openai("gpt-4o-mini"), // Using smaller model for cost efficiency
});

// ============================================================================
// Input/Output Schemas
// ============================================================================

/**
 * Input schema for Layer 2
 */
const Layer2InputSchema = z.object({
  report: z.object({
    traceId: z.string(),
    dbwdVersion: z.string(),
    timestamp: z.string(),
    extracted: z.object({
      rawInput: z.string(),
      role: z.string(),
      hours: z.number(),
      regularHours: z.number().optional(),
      overtimeHours: z.number().optional(),
      wage: z.number(),
      fringe: z.number().optional(),
    }),
    dbwdRate: z.object({
      dbwdId: z.string(),
      baseRate: z.number(),
      fringeRate: z.number(),
      totalRate: z.number(),
      version: z.string(),
      effectiveDate: z.string(),
      trade: z.string(),
    }),
    checks: z.array(
      z.object({
        id: z.string(),
        type: z.enum(["wage", "overtime", "fringe", "classification", "deduction"]),
        passed: z.boolean(),
        regulation: z.string(),
        expected: z.number().optional(),
        actual: z.number().optional(),
        difference: z.number().optional(),
        severity: z.enum(["info", "warning", "error", "critical"]),
        message: z.string(),
      })
    ),
    classificationMethod: z.enum(["exact", "alias", "semantic", "manual", "unknown"]),
    classificationConfidence: z.number(),
    deterministicScore: z.number(),
  }),
});

/**
 * Raw LLM output schema (before validation)
 */
const RawLLMOutputSchema = z.object({
  status: z.enum(["Approved", "Revise", "Reject"]),
  rationale: z.string(),
  referencedCheckIds: z.array(z.string()),
  citations: z.array(
    z.object({
      statute: z.string(),
      description: z.string(),
      dbwdId: z.string().optional(),
    })
  ),
  selfConfidence: z.number().min(0).max(1),
  reasoningTrace: z.string(),
});

// ============================================================================
// Prompt Construction
// ============================================================================

/**
 * Build the Layer 2 prompt from a DeterministicReport
 *
 * Includes all findings pre-formatted so LLM can reason over them.
 */
function buildLayer2Prompt(report: DeterministicReport): string {
  const checksList = report.checks
    .map(
      (check) => `
[${check.id}] ${check.type.toUpperCase()} - ${check.passed ? "PASS" : "FAIL"} (${check.severity})
Regulation: ${check.regulation}
${check.expected !== undefined ? `Expected: $${check.expected.toFixed(2)}` : ""}
${check.actual !== undefined ? `Actual: $${check.actual.toFixed(2)}` : ""}
${check.difference !== undefined ? `Difference: $${check.difference.toFixed(2)}` : ""}
Message: ${check.message}
`
    )
    .join("\n");

  return `
# WCP Compliance Report

## Worker Information
- Role: ${report.extracted.role}
- Hours: ${report.extracted.hours} (Regular: ${report.extracted.regularHours ?? 0}, OT: ${report.extracted.overtimeHours ?? 0})
- Wage: $${report.extracted.wage.toFixed(2)}/hr
- Fringe: $${(report.extracted.fringe ?? 0).toFixed(2)}/hr
- Classification Method: ${report.classificationMethod} (confidence: ${(report.classificationConfidence * 100).toFixed(0)}%)

## DBWD Rate Used
- Trade: ${report.dbwdRate.trade}
- DBWD ID: ${report.dbwdRate.dbwdId}
- Base Rate: $${report.dbwdRate.baseRate.toFixed(2)}
- Fringe Rate: $${report.dbwdRate.fringeRate.toFixed(2)}
- Version: ${report.dbwdRate.version}

## Compliance Checks Performed
${checksList}

## Deterministic Score
${(report.deterministicScore * 100).toFixed(0)}% of checks ran cleanly.

---

# Your Task

Based on the compliance report above, make a compliance decision.

**REMEMBER**: All calculations are already done. You are reviewing the findings, not doing math.

1. Review each check result
2. Decide: Approved (no violations), Revise (minor violations), or Reject (major violations)
3. Provide rationale citing specific check IDs
4. Rate your confidence (0.0-1.0)

Your output MUST include referencedCheckIds - list the [check_id] values you cite in your rationale.
`;
}

// ============================================================================
// Main Layer 2 Function
// ============================================================================

/**
 * Layer 2: LLM Verdict
 *
 * Produces an LLMVerdict by reasoning over the DeterministicReport.
 * Enforces that the verdict references check IDs from the report.
 *
 * @param report DeterministicReport from Layer 1
 * @returns LLMVerdict with reasoning and citations
 */
export async function layer2LLMVerdict(report: DeterministicReport): Promise<LLMVerdict> {
  const startTime = Date.now();
  console.log(`[Layer 2] Starting LLM verdict for trace ${report.traceId}`);

  // Check mock mode
  if (isMockMode()) {
    console.log("[Layer 2] Mock mode active - using mock verdict");
    const mockDecision = generateMockWcpDecision(report.extracted.rawInput);

    // Convert mock decision to LLMVerdict format
    const verdict: LLMVerdict = {
      traceId: report.traceId,
      status: mockDecision.status as "Approved" | "Revise" | "Reject",
      rationale: mockDecision.explanation,
      referencedCheckIds: report.checks.map((c) => c.id), // Reference all checks in mock mode
      citations: [
        {
          statute: "40 U.S.C. § 3142",
          description: "Prevailing wage requirements",
        },
      ],
      selfConfidence: 0.95, // Mock is deterministic, high confidence
      reasoningTrace: "Mock mode - deterministic reasoning based on findings",
      tokenUsage: 0, // No tokens used in mock mode
      model: "mock",
      timestamp: new Date().toISOString(),
    };

    console.log(`[Layer 2] Mock verdict completed in ${Date.now() - startTime}ms`);
    return verdict;
  }

  // Build prompt
  const prompt = buildLayer2Prompt(report);

  try {
    // Call LLM agent
    const response = await wcpVerdictAgent.generate([
      { role: "user", content: prompt },
    ]);

    // Parse and validate output
    let rawOutput: z.infer<typeof RawLLMOutputSchema>;
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response.text);
      rawOutput = RawLLMOutputSchema.parse(parsed);
    } catch {
      // Fallback: try to extract from text using simple heuristics
      console.log("[Layer 2] Could not parse JSON, using fallback parsing");
      rawOutput = extractVerdictFromText(response.text, report);
    }

    // Validate referenced check IDs
    const validation = validateReferencedCheckIds(
      {
        ...rawOutput,
        traceId: report.traceId,
        tokenUsage: response.usage?.totalTokens ?? 0,
        model: "gpt-4o-mini",
        timestamp: new Date().toISOString(),
      },
      report
    );

    if (!validation.valid) {
      console.warn(
        `[Layer 2] Invalid referencedCheckIds: ${validation.missing.join(", ")}`
      );
      // Fallback: reference all failed checks
      rawOutput.referencedCheckIds = report.checks
        .filter((c) => !c.passed)
        .map((c) => c.id);
    }

    // Ensure at least one check is referenced
    if (rawOutput.referencedCheckIds.length === 0) {
      rawOutput.referencedCheckIds = [report.checks[0]?.id ?? "unknown"];
    }

    // Build final verdict
    const verdict: LLMVerdict = {
      traceId: report.traceId,
      status: rawOutput.status,
      rationale: rawOutput.rationale,
      referencedCheckIds: rawOutput.referencedCheckIds,
      citations: rawOutput.citations,
      selfConfidence: rawOutput.selfConfidence,
      reasoningTrace: rawOutput.reasoningTrace,
      tokenUsage: response.usage?.totalTokens ?? 0,
      model: "gpt-4o-mini",
      timestamp: new Date().toISOString(),
    };

    // Final schema validation
    LLMVerdictSchema.parse(verdict);

    console.log(
      `[Layer 2] Verdict completed in ${Date.now() - startTime}ms: ${verdict.status} (confidence: ${(
        verdict.selfConfidence * 100
      ).toFixed(0)}%)`
    );

    return verdict;
  } catch (error) {
    console.error("[Layer 2] Error generating verdict:", error);

    // Fallback: create a conservative verdict that requires human review
    const fallbackVerdict: LLMVerdict = {
      traceId: report.traceId,
      status: "Reject",
      rationale: `LLM verdict generation failed: ${error instanceof Error ? error.message : "Unknown error"}. Conservatively rejecting pending human review.`,
      referencedCheckIds: report.checks.map((c) => c.id),
      citations: [
        {
          statute: "Error",
          description: "LLM generation failure",
        },
      ],
      selfConfidence: 0.0,
      reasoningTrace: "Fallback due to LLM error",
      tokenUsage: 0,
      model: "error-fallback",
      timestamp: new Date().toISOString(),
    };

    return fallbackVerdict;
  }
}

// ============================================================================
// Fallback Text Extraction
// ============================================================================

/**
 * Extract verdict from unstructured text (fallback when JSON parsing fails)
 *
 * Uses simple heuristics - not perfect but better than crashing.
 */
function extractVerdictFromText(
  text: string,
  report: DeterministicReport
): z.infer<typeof RawLLMOutputSchema> {
  const lowerText = text.toLowerCase();

  // Determine status from keywords
  let status: "Approved" | "Revise" | "Reject" = "Revise"; // Default conservative
  if (lowerText.includes("reject") || lowerText.includes("violation")) {
    status = "Reject";
  } else if (lowerText.includes("approved") || lowerText.includes("compliant")) {
    status = "Approved";
  }

  // Extract confidence (look for patterns like "confidence: 0.85" or "85%")
  const confidenceMatch = text.match(/confidence[:\s]+(\d+\.?\d*)/i);
  const selfConfidence = confidenceMatch
    ? Math.min(1, Math.max(0, parseFloat(confidenceMatch[1])))
    : 0.5;

  // Find referenced check IDs (look for check IDs in text)
  const checkIdPattern = /check[_-]?(?:\d{3}|\w+)/gi;
  const foundIds = text.match(checkIdPattern) ?? [];
  const validIds = report.checks.map((c) => c.id);
  const referencedCheckIds = foundIds
    .map((id) => id.toLowerCase().replace(/[_-]/g, "_"))
    .filter((id) => validIds.includes(id));

  return {
    status,
    rationale: text.slice(0, 500), // First 500 chars as rationale
    referencedCheckIds: referencedCheckIds.length > 0 ? referencedCheckIds : [validIds[0] ?? "unknown"],
    citations: [
      {
        statute: "40 U.S.C. § 3142",
        description: "Prevailing wage requirements",
      },
    ],
    selfConfidence,
    reasoningTrace: text,
  };
}

// ============================================================================
// Exports
// ============================================================================

export { wcpVerdictAgent, buildLayer2Prompt };
