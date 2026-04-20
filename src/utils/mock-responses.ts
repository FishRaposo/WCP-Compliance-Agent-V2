/**
 * Mock API Response Generator
 *
 * Generates realistic WCP decision responses for testing without an OpenAI API key.
 * Uses deterministic logic based on the extracted WCP data.
 */

import { IN_MEMORY_CORPUS } from "../retrieval/hybrid-retriever.js";

/**
 * Generate a mock WCP decision based on the extracted data
 */
export function generateMockWcpDecision(input: string) {
  const roleMatch = input.match(/role[:\s]+(\w[\w\s]*)/i);
  const hoursMatch = input.match(/hours[:\s]+(\d+(?:\.\d+)?)/i);
  const wageMatch = input.match(/wage[:\s]+\$?(\d+(?:\.\d+)?)/i);

  const role = roleMatch ? roleMatch[1].trim() : 'UNKNOWN';
  const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
  const wage = wageMatch ? parseFloat(wageMatch[1]) : 0;

  // Case-insensitive corpus lookup
  const corpusEntry = Object.entries(IN_MEMORY_CORPUS).find(
    ([key]) => key.toLowerCase() === role.toLowerCase()
  );

  const violations = [];
  let status: 'Approved' | 'Revise' | 'Reject' = 'Approved';

  if (!corpusEntry) {
    status = 'Reject';
    const knownTrades = Object.keys(IN_MEMORY_CORPUS).join(', ');
    violations.push({ type: 'Invalid Role', detail: `Unknown role: ${role}. Known trades: ${knownTrades}.` });
  } else {
    const [tradeName, dbwdRate] = corpusEntry;

    if (wage < dbwdRate.base) {
      status = 'Reject';
      violations.push({ type: 'Underpay', detail: `Wage $${wage}/hr is below DBWD base rate of $${dbwdRate.base}/hr for ${tradeName}.` });
    }

    if (hours > 40) {
      if (status !== 'Reject') status = 'Revise';
      violations.push({ type: 'Overtime', detail: `Hours ${hours} exceeds 40 hours/week. Overtime pay should be 1.5x base rate for hours over 40.` });
    }
  }

  let explanation = '';
  switch (status) {
    case 'Approved':
      explanation = `This WCP is approved. The ${role} role is valid, hours (${hours}) are within limits, and wage ($${wage}/hr) meets or exceeds the DBWD base rate.`;
      break;
    case 'Revise':
      explanation = `This WCP requires revision. The ${role} role and wage are valid, but there are overtime violations that need to be addressed.`;
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
    requestId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
