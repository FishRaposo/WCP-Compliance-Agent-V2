/**
 * Mock API Response Generator
 *
 * Generates realistic WCP decision responses for testing without an OpenAI API key.
 * Uses deterministic logic based on the extracted WCP data.
 */

// Inline corpus for mock mode — loads from dbwd-corpus.json when available
// In production, this would load from the database via retrieval service
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { lookupRate } from "../services/dbwd-retrieval.js";

/**
 * Generate a mock WCP decision based on the extracted data.
 * Uses the same DBWD retrieval service as Layer 1 for consistency.
 */
export function generateMockWcpDecision(input: string) {
  const roleMatch = input.match(/role[:\s]+(\w[\w\s]*)/i);
  const hoursMatch = input.match(/hours[:\s]+(\d+(?:\.\d+)?)/i);
  const wageMatch = input.match(/wage[:\s]+\$?(\d+(?:\.\d+)?)/i);
  const fringeMatch = input.match(/fringe[:\s]+\$?(\d+(?:\.\d+)?)/i);
  const grossPayMatch = input.match(/gross\s*pay[:\s]+\$?(\d+(?:\.\d+)?)/i);

  const role = roleMatch ? roleMatch[1].trim() : 'UNKNOWN';
  const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
  const wage = wageMatch ? parseFloat(wageMatch[1]) : 0;
  const fringe = fringeMatch ? parseFloat(fringeMatch[1]) : null;
  const grossPay = grossPayMatch ? parseFloat(grossPayMatch[1]) : null;

  // Use the same retrieval service as Layer 1 for consistency
  const dbwdRate = lookupRate(role);

  const violations = [];
  let status: 'Approved' | 'Revise' | 'Reject' = 'Approved';

  if (!dbwdRate) {
    status = 'Reject';
    violations.push({ type: 'Invalid Role', detail: `Unknown role: ${role}. Not found in DBWD database.` });
  } else {
    const tradeName = dbwdRate.trade;

    if (wage < dbwdRate.baseRate) {
      status = 'Reject';
      violations.push({ type: 'Underpay', detail: `Wage $${wage}/hr is below DBWD base rate of $${dbwdRate.baseRate}/hr for ${tradeName}.` });
    }

    if (fringe !== null && fringe < dbwdRate.fringeRate) {
      if (status === 'Approved') status = 'Revise';
      violations.push({ type: 'Fringe Shortfall', detail: `Fringe $${fringe}/hr is below DBWD required fringe $${dbwdRate.fringeRate}/hr for ${tradeName}.` });
    }

    if (hours > 40) {
      const regularHrs = Math.min(hours, 40);
      const overtimeHrs = hours - 40;
      const correctGross = regularHrs * dbwdRate.baseRate + overtimeHrs * dbwdRate.baseRate * 1.5;
      const reportedGross = grossPay ?? (wage * hours);
      const otCorrect = reportedGross >= correctGross - 0.01;
      if (!otCorrect) {
        if (status !== 'Reject') status = 'Revise';
        violations.push({ type: 'Overtime', detail: `OT underpaid: reported gross $${reportedGross.toFixed(2)} vs required $${correctGross.toFixed(2)}.` });
      }
    }
  }

  let explanation = '';
  switch (status) {
    case 'Approved':
      explanation = `This WCP is approved. The ${role} role is valid, hours (${hours}) are within limits, and wage ($${wage}/hr) meets or exceeds the DBWD base rate.`;
      break;
    case 'Revise':
      explanation = `This WCP requires revision. The ${role} role and wage are valid, but there are compliance violations that need to be addressed.`;
      break;
    case 'Reject':
      explanation = `This WCP is rejected due to compliance violations that must be corrected.`;
      break;
  }

  const trace = [
    'Step 1: Extracted WCP data from input',
    'Step 2: Validated role against DBWD rates',
    'Step 3: Checked wage compliance',
    'Step 4: Checked overtime requirements',
    'Step 5: Generated compliance decision'
  ];

  return {
    status,
    explanation,
    findings: violations,
    trace,
    requestId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    timestamp: new Date().toISOString()
  };
}

/**
 * Check if mock mode is enabled
 */
export function isMockMode(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return key === 'mock' || key === 'mock-key' || key === 'test-api-key' || !key || key === '';
}
