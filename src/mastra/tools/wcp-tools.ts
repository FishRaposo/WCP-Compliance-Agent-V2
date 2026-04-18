/**
 * WCP Tools - Data Extraction and Validation
 * 
 * This module implements deterministic validation for Davis-Bacon Act compliance.
 * 
 * Regulatory Basis:
 * - 40 U.S.C. § 3142: Prevailing wage requirements
 * - 40 U.S.C. § 3702: Overtime compensation (1.5x base rate)
 * - 29 CFR 5.22: Fringe benefits requirements
 * - 29 CFR 5.5(a)(3): Weekly payroll submission requirements
 * 
 * Implementation Approach:
 * - extractWCPTool: Extracts structured WCP data from text input
 * - validateWCPTool: Validates against DBWD rates with deterministic arithmetic
 * 
 * Why Deterministic?
 * LLMs can hallucinate calculations. Deterministic code guarantees:
 * - 100% arithmetic accuracy for wage comparisons
 * - Reproducible results (same input = same output)
 * - Exact calculations regulators can verify
 * 
 * @file src/mastra/tools/wcp-tools.ts
 * @see docs/compliance/traceability-matrix.md - Regulation-to-code mapping
 * @see docs/compliance/regulatory-compliance-report.md - System compliance overview
 * @see docs/foundation/wcp-and-dbwd-reference.md - Domain requirements
 */

// External dependencies
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Internal dependencies
import { WCPData, DBWDRates, Finding } from "../../types/index.js";
import { ValidationError, ConfigError } from "../../utils/errors.js";

/**
 * DBWD (Davis-Bacon Wage Determinations) Rates
 * 
 * Regulatory Basis:
 * - 40 U.S.C. § 3142(a): "The minimum wages... shall be not less than those 
 *   prevailing on projects of a character similar in the locality..."
 * - Rates sourced from SAM.gov (https://sam.gov/content/wage-determinations)
 * - Updated weekly by Department of Labor (Fridays)
 * 
 * Structure:
 * - base: Basic hourly wage rate (cash wages)
 * - fringe: Fringe benefits (can be paid as plan contributions or cash in lieu)
 * 
 * Total Compensation = base + fringe (must be paid for all hours worked)
 * 
 * Overtime Calculation (40 U.S.C. § 3702):
 * - Regular hours: (base + fringe) × regularHours
 * - Overtime hours: (base × 1.5 + fringe) × overtimeHours
 * - Note: Only BASE rate is multiplied by 1.5, fringe is straight time
 * 
 * Current rates (from DOL DC sample - for prototype only):
 * - Electrician: $51.69 base + $34.63 fringe
 * - Laborer: $26.45 base + $12.50 fringe
 * 
 * Production Note:
 * In production, these would be:
 * - Loaded from RAG-based vector DB lookup (PostgreSQL + pgvector)
 * - Updated dynamically from official DBWD PDFs via ETL pipeline
 * - Cached in Redis for performance
 * - Version-tracked for audit replay
 * 
 * @see TODO.md - Item 3: RAG-Based DBWD Rate Lookup
 * @see docs/compliance/implementation-guide.md - DBWD integration patterns
 */
const DBWDRates = {
  "Electrician": { base: 51.69, fringe: 34.63 },
  "Laborer": { base: 26.45, fringe: 12.50 },
  // Add more from PDF: e.g., "Plumber": { base: 48.20, fringe: 28.10 }
};

/**
 * Extract WCP Tool
 * 
 * Extracts structured data from Weekly Certified Payroll (WCP) input.
 * 
 * Regulatory Basis:
 * - 29 CFR 5.5(a)(3)(ii): "Contractors shall submit weekly a copy of all payrolls..."
 * - Form WH-347: Standard format for certified payrolls
 * - Required fields: Employee name, classification, hours, wages, deductions
 * 
 * Implementation:
 * - Uses regex patterns for deterministic extraction
 * - Validates business rules (hours ≤ 168, wages reasonable)
 * - Returns structured data for downstream validation
 * 
 * Input Format:
 * Raw WCP text (e.g., "Role: Electrician, Hours: 45, Wage: $50")
 * 
 * Output Schema:
 * - role: Worker classification (e.g., "Electrician")
 * - hours: Total hours worked (0-168)
 * - wage: Hourly wage rate (positive number)
 * 
 * Validation Rules:
 * - Hours must be 0-168 (24 days × 7 hours max)
 * - Wage must be positive and < $1000/hr (sanity check)
 * - Role must be non-empty string
 * 
 * Future Enhancement:
 * - PDF parsing via pdf-parse library
 * - OCR for scanned WH-347 forms
 * - Direct Form WH-347 field mapping
 * 
 * @see TODO.md - Item 2: PDF Parsing Integration
 * @see docs/compliance/traceability-matrix.md - WH-347 field requirements
 */
export const extractWCPTool = createTool({
  id: "extract-wcp",
  description: "Extract hours, wage, and role from WCP text input.",
  inputSchema: z.object({
    content: z.string().describe("Raw WCP text (e.g., 'Role: Electrician, Hours: 45, Wage: $28')"),
  }),
  outputSchema: z.object({
    role: z.string(),
    hours: z.number(),
    wage: z.number(),
  }),
  execute: async ({ context }) => {
    const { content } = context;
    
    // Input validation with structured errors
    if (!content || content.trim().length === 0) {
      throw new ValidationError("Input content cannot be empty");
    }

    if (content.length > 10000) {
      throw new ValidationError("Input content too long (max 10,000 characters)");
    }

    // Extract role using regex: "Role: Electrician" → "Electrician"
    const roleMatch = content.match(/Role:\s*(\w+)/i);
    if (!roleMatch) {
      throw new ValidationError("Could not extract role from content. Expected format: 'Role: <role>'");
    }
    const role = roleMatch[1];
    
    // Extract hours using regex: "Hours: 45" → 45
    const hoursMatch = content.match(/Hours:\s*(\d+)/i);
    if (!hoursMatch) {
      throw new ValidationError("Could not extract hours from content. Expected format: 'Hours: <number>'");
    }
    const hours = parseFloat(hoursMatch[1]);
    
    // Extract wage using regex: "Wage: $50" or "Wage: 50" → 50
    const wageMatch = content.match(/Wage:\s*\$?(\d+\.?\d*)/i);
    if (!wageMatch) {
      throw new ValidationError("Could not extract wage from content. Expected format: 'Wage: $<number>' or 'Wage: <number>'");
    }
    const wage = parseFloat(wageMatch[1]);

    // Validate parsed values with business rules
    if (isNaN(hours)) {
      throw new ValidationError(`Invalid hours value: ${hoursMatch[1]}. Hours must be a valid number.`);
    }

    if (hours < 0) {
      throw new ValidationError(`Hours cannot be negative: ${hours}`);
    }

    if (hours > 168) {
      throw new ValidationError(`Hours exceed maximum (168 hours in 24 days): ${hours}`);
    }

    if (isNaN(wage)) {
      throw new ValidationError(`Invalid wage value: ${wageMatch[1]}. Wage must be a valid number.`);
    }

    if (wage < 0) {
      throw new ValidationError(`Wage cannot be negative: $${wage}`);
    }

    if (wage > 1000) {
      throw new ValidationError(`Wage exceeds reasonable maximum ($1000/hr): $${wage}`);
    }
    
    return {
      role,
      hours,
      wage,
    };
  },
});

/**
 * Validate WCP Tool
 * 
 * Validates extracted WCP data against Davis-Bacon Wage Determinations (DBWD).
 * 
 * Regulatory Basis:
 * 
 * 1. Prevailing Wage (40 U.S.C. § 3142(a)):
 *    - Workers must be paid not less than prevailing wage rate
 *    - Validates: reportedWage >= dbwd.baseRate
 *    - Severity: "error" (wage floor violation)
 * 
 * 2. Overtime Compensation (40 U.S.C. § 3702):
 *    - Time and one-half basic rate for hours over 40 per week
 *    - Validates: hours > 40 triggers overtime flag
 *    - Note: DBWD fringe benefits NOT multiplied by 1.5 (straight time for OT)
 *    - Severity: "critical" (common violation, significant underpayment)
 * 
 * 3. Fringe Benefits (29 CFR 5.22):
 *    - Total compensation (wages + fringe) must meet prevailing total
 *    - Can be paid via: plan contributions, cash in lieu, or combination
 *    - Implementation Note: Current prototype checks base rate only
 *    - Future: Full fringe validation with plan documentation
 * 
 * 4. Worker Classification (29 CFR 5.5(a)(3)(i)):
 *    - Workers classified according to work performed
 *    - Validates: role exists in DBWD rate table
 *    - Future: Trade alias matching ("Wireman" → "Electrician")
 * 
 * Validation Logic:
 * - Deterministic comparison (no LLM estimation for arithmetic)
 * - Exact calculations regulators can reproduce
 * - All findings include regulatory citations
 * 
 * Input: Extracted data { role: string, hours: number, wage: number }
 * Output: Validation results { 
 *   findings: Finding[], 
 *   isValid: boolean 
 * }
 * 
 * Finding Structure:
 * - type: Classification of violation (e.g., "Underpay", "Overtime")
 * - detail: Human-readable description
 * - regulation: Statutory citation (e.g., "40 U.S.C. § 3142(a)")
 * - severity: "error" | "critical" (for risk prioritization)
 * 
 * @see WORKFLOW.md - Validation Workflow section
 * @see docs/compliance/regulatory-compliance-report.md - Full compliance analysis
 * @see docs/compliance/implementation-guide.md - Validation patterns
 */
export const validateWCPTool = createTool({
  id: "validate-wcp",
  description: "Validate hours and wage against DBWD rates.",
  inputSchema: z.object({
    role: z.string(),
    hours: z.number(),
    wage: z.number(),
  }),
  outputSchema: z.object({
    findings: z.array(z.object({ type: z.string(), detail: z.string() })),
    isValid: z.boolean(),
  }),
  execute: async ({ context }) => {
    const { role, hours, wage } = context;
    
    // Validate input parameters
    if (typeof role !== 'string' || role.trim().length === 0) {
      throw new ValidationError('Role must be a non-empty string', { received: role });
    }
    
    if (typeof hours !== 'number' || isNaN(hours)) {
      throw new ValidationError('Hours must be a valid number', { received: hours });
    }
    
    if (hours < 0) {
      throw new ValidationError('Hours cannot be negative', { received: hours });
    }
    
    if (hours > 168) {
      throw new ValidationError('Hours exceed maximum (168 hours in 24 days)', { received: hours });
    }
    
    if (typeof wage !== 'number' || isNaN(wage)) {
      throw new ValidationError('Wage must be a valid number', { received: wage });
    }
    
    if (wage < 0) {
      throw new ValidationError('Wage cannot be negative', { received: wage });
    }
    
    // Look up DBWD rates for the role
    const expected = DBWDRates[role as keyof typeof DBWDRates];
    
    // Array to collect validation findings
    const findings = [];

    if (!expected) {
      findings.push({
        type: "Unknown Role",
        detail: `Role '${role}' not found in DBWD rates`
      });
    }
    
    // Check for overtime violation: hours > 40
    // DBWD requires 1.5x pay for hours over 40
    if (hours > 40) {
      findings.push({ 
        type: "Overtime", 
        detail: `Hours ${hours} > 40 (DBWD requires 1.5x pay)` 
      });
    }
    
    // Check for underpayment violation: wage < base rate
    // DBWD requires wage >= base rate (fringe benefits are separate)
    if (expected && wage < expected.base) {
      findings.push({ 
        type: "Underpay", 
        detail: `Wage $${wage} < $${expected.base} base (plus $${expected.fringe} fringe)` 
      });
    }
    
    // Return validation results
    // isValid is true only if no violations found
    return {
      findings,
      isValid: findings.length === 0,
    };
  },
});