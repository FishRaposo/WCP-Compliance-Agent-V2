/**
 * WCP Agent - Compliance Decision-Making
 *
 * @deprecated This Mastra-based agent is legacy and is being superseded by the three-layer pipeline
 * in src/pipeline/. New code should use the pipeline orchestrator (src/pipeline/orchestrator.ts) instead.
 *
 * LLM-powered agent that processes WCPs and makes compliance decisions.
 * Uses a hybrid approach: deterministic tools for accuracy + LLM for reasoning.
 *
 * Workflow:
 * 1. Extract data using extractWCPTool
 * 2. Validate data using validateWCPTool
 * 3. Make compliance decision (Approved/Revise/Reject)
 * 4. Generate explanation with audit trail
 *
 * @file src/mastra/agents/wcp-agent.ts
 * @see AGENTS.md for agent patterns
 * @see WORKFLOW.md for decision workflows
 * @see CONTEXT.md for architecture overview
 * @see docs/phase-0-out-of-scope.md - Migration plan
 */

// External dependencies
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core";
import { z } from "zod";

// Internal dependencies
import { extractWCPTool, validateWCPTool } from "../tools/wcp-tools.js";
import { WCPDecision, Finding } from "../../types/index.js";
import { getAgentConfig } from "../../config/agent-config.js";

/**
 * Load agent configuration
 */
const agentConfig = getAgentConfig();

/**
 * WCP Decision Schema
 * 
 * Structured output schema for compliance decisions.
 * Ensures type-safe, consistent responses with:
 * - status: Decision outcome (Approved/Revise/Reject)
 * - explanation: Human-readable justification
 * - findings: Array of violations found
 * - trace: Step-by-step reasoning log for auditability
 * - health: Performance and quality metrics
 * 
 * @see WORKFLOW.md - Decision Workflow section
 */
const WCPDecisionSchema = z.object({
  status: z.enum(["Approved", "Revise", "Reject"]),
  explanation: z.string().describe("Human-readable justification citing findings and DBWD"),
  findings: z.array(z.object({ type: z.string(), detail: z.string() })),
  trace: z.array(z.string()).describe("Step-by-step reasoning log"),
  health: z.object({
    cycleTime: z.number().describe("Total processing time in milliseconds"),
    tokenUsage: z.number().describe("Total tokens consumed"),
    validationScore: z.number().describe("Confidence score for data validation (0-1)"),
    confidence: z.number().describe("Overall decision confidence (0-1)"),
  }),
});

/**
 * WCP Agent
 * 
 * Mastra Agent configured for WCP compliance auditing.
 * 
 * Configuration:
 * - Model: Configured via OPENAI_MODEL env var (default: gpt-5-nano)
 * - Tools: extractWCP, validateWCP
 * - Max Steps: Configured via MAX_STEPS env var (default: 3)
 * - Output: Structured JSON (WCPDecisionSchema)
 * 
 * Decision Logic:
 * - Approved: No violations found
 * - Revise: Minor violations (e.g., overtime)
 * - Reject: Major violations (e.g., underpayment, unknown role)
 * 
 * @see CONTEXT.md - Architecture section
 * @see WORKFLOW.md - Decision Workflow section
 */
export const wcpAgent = new Agent({
  name: "wcp-reviewer",
  instructions: [
    "You are a compliance auditor for Weekly Certified Payrolls (WCPs).",
    "Steps: 1. Use extract-wcp tool on input content.",
    "2. Use validate-wcp tool on extracted data.",
    "3. Based on findings, decide: Approved (no issues), Revise (minor fixes), Reject (major violations).",
    "4. Provide explanation citing DBWD rules and findings.",
    "5. Include health metrics: cycleTime (processing time), tokenUsage (tokens consumed), validationScore (0-1), confidence (0-1).",
    "Handle errors gracefully (e.g., unknown role → Reject with note).",
  ],
  model: openai(agentConfig.model),
  tools: { extractWCP: extractWCPTool, validateWCP: validateWCPTool },
});

// Export the schema for use in test script
export { WCPDecisionSchema };
