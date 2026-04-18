/**
 * Decision Pipeline Orchestrator
 *
 * Composes the three-layer decision pipeline:
 * Layer 1 (Deterministic) → Layer 2 (LLM Verdict) → Layer 3 (Trust Score + Human Review)
 *
 * This is the ONLY valid entry point for generating compliance decisions.
 * Bypassing this orchestrator violates the architecture and will fail CI.
 *
 * @see docs/architecture/decision-architecture.md - Three-layer doctrine
 * @see docs/adrs/ADR-005-decision-architecture.md - Architectural decision
 */

import { v4 as uuidv4 } from "uuid";
import { layer1Deterministic } from "./layer1-deterministic.js";
import { layer2LLMVerdict } from "./layer2-llm-verdict.js";
import { layer3TrustScore } from "./layer3-trust-score.js";
import { humanReviewQueue } from "../services/human-review-queue.js";
import type { TrustScoredDecision } from "../types/decision-pipeline.js";

// ============================================================================
// Pipeline Input
// ============================================================================

/**
 * Input for the decision pipeline
 */
export interface DecisionPipelineInput {
  /** Raw WCP text content */
  content: string;

  /** Optional trace ID (generated if not provided) */
  traceId?: string;

  /** Optional DBWD version to use (default: latest) */
  dbwdVersion?: string;
}

// ============================================================================
// Pipeline Orchestrator
// ============================================================================

/**
 * Execute the three-layer decision pipeline
 *
 * This is the ONLY way to produce a TrustScoredDecision.
 * All other paths are considered bugs.
 *
 * Pipeline flow:
 * 1. Layer 1: Deterministic scaffold (extract, lookup, check)
 * 2. Layer 2: LLM verdict (reasoning over Layer 1 findings)
 * 3. Layer 3: Trust score + human review flag
 * 4. Enqueue to human review if required
 *
 * @param input Pipeline input
 * @returns TrustScoredDecision with full audit trail
 */
export async function executeDecisionPipeline(
  input: DecisionPipelineInput
): Promise<TrustScoredDecision> {
  const traceId = input.traceId ?? generateTraceId();
  const startTime = Date.now();

  console.log(`\n[Pipeline] Starting decision pipeline for trace ${traceId}`);
  console.log(`[Pipeline] Input length: ${input.content.length} chars`);

  try {
    // ======================================================================
    // Layer 1: Deterministic Scaffold
    // ======================================================================
    console.log(`\n[Pipeline] === LAYER 1: Deterministic Scaffold ===`);
    const report = await layer1Deterministic(input.content, traceId);

    console.log(
      `[Pipeline] Layer 1 complete: ${report.checks.length} checks, score: ${report.deterministicScore.toFixed(2)}`
    );

    // Log check results summary
    const failedChecks = report.checks.filter((c) => !c.passed);
    if (failedChecks.length > 0) {
      console.log(`[Pipeline] Failed checks:`);
      for (const check of failedChecks) {
        console.log(`  - [${check.id}] ${check.type}: ${check.message.slice(0, 100)}`);
      }
    }

    // ======================================================================
    // Layer 2: LLM Verdict
    // ======================================================================
    console.log(`\n[Pipeline] === LAYER 2: LLM Verdict ===`);
    const verdict = await layer2LLMVerdict(report);

    console.log(
      `[Pipeline] Layer 2 complete: ${verdict.status} (confidence: ${(verdict.selfConfidence * 100).toFixed(0)}%)`
    );
    console.log(`[Pipeline] Referenced checks: ${verdict.referencedCheckIds.join(", ")}`);
    console.log(`[Pipeline] Rationale: ${verdict.rationale.slice(0, 150)}...`);

    // ======================================================================
    // Layer 3: Trust Score + Human Review
    // ======================================================================
    console.log(`\n[Pipeline] === LAYER 3: Trust Score + Human Review ===`);
    const decision = layer3TrustScore(report, verdict);

    console.log(
      `[Pipeline] Layer 3 complete: trust=${decision.trust.score.toFixed(2)}, band=${decision.trust.band}`
    );
    console.log(
      `[Pipeline] Human review: ${decision.humanReview.required ? "REQUIRED" : "not required"} (${decision.humanReview.status})`
    );

    // ======================================================================
    // Human Review Queue (if required)
    // ======================================================================
    if (decision.humanReview.required) {
      console.log(`\n[Pipeline] === ENQUEUING FOR HUMAN REVIEW ===`);
      try {
        await humanReviewQueue.enqueue(decision);
        console.log(`[Pipeline] Successfully enqueued for human review`);
      } catch (error) {
        // Log but don't fail - decision is still valid
        console.error(`[Pipeline] Failed to enqueue for review:`, error);
        decision.auditTrail.push({
          timestamp: new Date().toISOString(),
          stage: "layer3",
          event: "enqueued",
          details: {
            error: error instanceof Error ? error.message : "Unknown error",
            note: "Enqueue failed but decision is valid",
          },
        });
      }
    }

    // ======================================================================
    // Finalize
    // ======================================================================
    const totalTime = Date.now() - startTime;
    console.log(`\n[Pipeline] === COMPLETE ===`);
    console.log(`[Pipeline] Trace: ${decision.traceId}`);
    console.log(`[Pipeline] Final status: ${decision.finalStatus}`);
    console.log(`[Pipeline] Total time: ${totalTime}ms`);
    console.log(`[Pipeline] Audit trail: ${decision.auditTrail.length} events`);

    // Add health metrics for backward compatibility with original health checks
    const decisionWithHealth: TrustScoredDecision = {
      ...decision,
      health: {
        cycleTime: totalTime,
        tokenUsage: decision.verdict.tokenUsage,
        validationScore: decision.deterministic.deterministicScore,
        confidence: decision.trust.score,
      },
    };

    return decisionWithHealth;
  } catch (error) {
    console.error(`\n[Pipeline] FATAL ERROR in trace ${traceId}:`, error);

    // Create a fallback decision that requires human review
    const fallbackDecision: TrustScoredDecision = {
      traceId,
      deterministic: {
        traceId,
        dbwdVersion: "error",
        timestamp: new Date().toISOString(),
        extracted: {
          rawInput: input.content,
          role: "Unknown",
          hours: 0,
          wage: 0,
        },
        dbwdRate: {
          dbwdId: "ERROR",
          baseRate: 0,
          fringeRate: 0,
          totalRate: 0,
          version: "error",
          effectiveDate: "error",
          trade: "Unknown",
        },
        checks: [
          {
            id: "pipeline_error_001",
            type: "classification",
            passed: false,
            regulation: "Error",
            severity: "critical",
            message: `Pipeline execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        classificationMethod: "unknown",
        classificationConfidence: 0,
        deterministicScore: 0,
        timings: [],
      },
      verdict: {
        traceId,
        status: "Reject",
        rationale: `Pipeline execution failed. Conservatively rejecting pending human review. Error: ${error instanceof Error ? error.message : "Unknown"}`,
        referencedCheckIds: ["pipeline_error_001"],
        citations: [
          {
            statute: "Error",
            description: "Pipeline failure",
          },
        ],
        selfConfidence: 0,
        reasoningTrace: "Error fallback",
        tokenUsage: 0,
        model: "error-fallback",
        timestamp: new Date().toISOString(),
      },
      trust: {
        score: 0,
        components: {
          deterministic: 0,
          classification: 0,
          llmSelf: 0,
          agreement: 0,
        },
        band: "require_human",
        reasons: ["Pipeline execution failed - human review required"],
      },
      humanReview: {
        required: true,
        status: "pending",
        queuedAt: new Date().toISOString(),
      },
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          stage: "layer1",
          event: "check_completed",
          details: { error: error instanceof Error ? error.message : "Unknown" },
        },
        {
          timestamp: new Date().toISOString(),
          stage: "final",
          event: "finalized",
          details: { fallback: true, error: true },
        },
      ],
      finalStatus: "Pending Human Review",
      finalizedAt: new Date().toISOString(),
      health: {
        cycleTime: Date.now() - startTime,
        tokenUsage: 0,
        validationScore: 0,
        confidence: 0,
      },
    };

    // Try to enqueue the error decision
    try {
      await humanReviewQueue.enqueue(fallbackDecision);
    } catch (enqueueError) {
      console.error(`[Pipeline] Failed to enqueue error decision:`, enqueueError);
    }

    return fallbackDecision;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique trace ID
 *
 * Format: wcp-{date}-{random}
 */
function generateTraceId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `wcp-${date}-${random}`;
}

// ============================================================================
// Exports
// ============================================================================

export { generateTraceId };
