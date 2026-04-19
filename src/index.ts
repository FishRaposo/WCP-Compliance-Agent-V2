/**
 * Basic Test Script
 * 
 * Simple test script for quick validation of the WCP AI Agent.
 * Demonstrates the core workflow: extract → validate → decide.
 * 
 * Usage:
 *   npm run test
 *   # or
 *   ts-node --esm src/index.ts
 * 
 * For a comprehensive showcase with multiple scenarios, use:
 *   npm run showcase
 * 
 * @file src/index.ts
 * @see README.md - For showcase demo and quick start instructions
 * @see showcase/README.md - Showcase folder documentation
 */

// Internal dependencies
import { generateWcpDecision } from "./entrypoints/wcp-entrypoint.js";
import { validateEnvironmentOrExit } from "./utils/env-validator.js";
import { formatApiError } from "./utils/errors.js";

// Validate environment before starting
validateEnvironmentOrExit();

/**
 * Main execution function
 * 
 * Workflow:
 * 1. Process a test WCP input
 * 2. Display structured decision output
 * 3. Handle errors gracefully
 */
(async () => {
  try {
    // Test WCP input: Electrician with 45 hours (overtime) and $50 wage
    // Expected: Revise/Reject status due to overtime (>40 hours) and underpayment (<$51.69)
    const fakeWCP = "Role: Electrician, Hours: 45, Wage: $50";

    console.log("Processing WCP:", fakeWCP);
    console.log("...\n");

    // Generate compliance decision using the three-layer pipeline
    // Layer 1: Deterministic extraction and validation
    // Layer 2: LLM verdict with reasoning
    // Layer 3: Trust score and human review flag
    const decision = await generateWcpDecision({
      content: fakeWCP,
    });

    // Display structured decision output
    console.log("\n=== DECISION OUTPUT ===\n");
    console.log("Trace ID:", decision.traceId);
    console.log("Final Status:", decision.finalStatus);
    console.log("Trust Score:", decision.trust.score.toFixed(2), `(${decision.trust.band})`);
    console.log("Human Review Required:", decision.humanReview.required ? "YES" : "No");
    
    console.log("\n--- Layer 1: Deterministic Report ---");
    console.log("Role:", decision.deterministic.extracted.role);
    console.log("Hours:", decision.deterministic.extracted.hours);
    console.log("Wage:", decision.deterministic.extracted.wage);
    console.log("DBWD Rate:", decision.deterministic.dbwdRate.baseRate, "+", decision.deterministic.dbwdRate.fringeRate, "fringe");
    console.log("Checks Performed:", decision.deterministic.checks.length);
    
    const failedChecks = decision.deterministic.checks.filter(c => !c.passed);
    if (failedChecks.length > 0) {
      console.log("\nFailed Checks:");
      for (const check of failedChecks) {
        console.log(`  - [${check.id}] ${check.type}: ${check.message}`);
        console.log(`    Regulation: ${check.regulation}`);
        if (check.expected !== undefined && check.actual !== undefined) {
          console.log(`    Expected: ${check.expected}, Actual: ${check.actual}`);
        }
      }
    }
    
    console.log("\n--- Layer 2: LLM Verdict ---");
    console.log("Status:", decision.verdict.status);
    console.log("Rationale:", decision.verdict.rationale);
    console.log("Self-Confidence:", (decision.verdict.selfConfidence * 100).toFixed(0) + "%");
    console.log("Referenced Checks:", decision.verdict.referencedCheckIds.join(", "));
    
    console.log("\n--- Layer 3: Trust Score ---");
    console.log("Score Components:");
    console.log("  - Deterministic:", decision.trust.components.deterministic.toFixed(2));
    console.log("  - Classification:", decision.trust.components.classification.toFixed(2));
    console.log("  - LLM Self:", decision.trust.components.llmSelf.toFixed(2));
    console.log("  - Agreement:", decision.trust.components.agreement.toFixed(2));
    
    if (decision.humanReview.required) {
      console.log("\n--- Human Review Queue ---");
      console.log("Status:", decision.humanReview.status);
      console.log("Queued At:", decision.humanReview.queuedAt);
    }
    
    console.log("\n--- Audit Trail ---");
    for (const event of decision.auditTrail) {
      console.log(`  [${event.timestamp}] ${event.stage}: ${event.event}`);
    }
    
    // Health metrics (backward compatible)
    console.log("\n--- Health Metrics ---");
    console.log("Cycle Time:", decision.health?.cycleTime, "ms");
    console.log("Token Usage:", decision.health?.tokenUsage);
    console.log("Validation Score:", decision.health?.validationScore?.toFixed(2));
    console.log("Confidence:", decision.health?.confidence?.toFixed(2));

    console.log("\n=== END OF DECISION ===\n");
    
    // Exit with success code for CI/CD
    process.exit(0);
  } catch (error: unknown) {
    // Structured error handling with proper error formatting
    const formattedError = formatApiError(error);
    
    console.error("\n❌ Error occurred while processing WCP:");
    console.error(`Error Code: ${formattedError.error.code}`);
    console.error(`Message: ${formattedError.error.message}`);
    
    // Show details if available
    if (error && typeof error === 'object' && 'details' in error) {
      console.error("\nDetails:", error.details);
    }
    
    // Exit with error code for CI/CD
    process.exit(1);
  }
})();
