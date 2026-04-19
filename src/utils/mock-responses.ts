/**
 * Mock API Response Generator
 * 
 * Generates realistic WCP decision responses for testing without an OpenAI API key.
 * Uses deterministic logic based on the extracted WCP data.
 */

// DBWD base rates (same as in wcp-tools.ts)
const DBWD_RATES = {
  "Electrician": { base: 51.69, fringe: 34.63 },
  "Laborer": { base: 26.45, fringe: 12.50 }
};

/**
 * Generate a mock WCP decision based on the extracted data
 */
export function generateMockWcpDecision(input: string) {
  // Extract data using the same logic as extractWCPTool
  const roleMatch = input.match(/role[:\s]+(\w+)/i);
  const hoursMatch = input.match(/hours[:\s]+(\d+(?:\.\d+)?)/i);
  const wageMatch = input.match(/wage[:\s]+\$?(\d+(?:\.\d+)?)/i);
  
  const role = roleMatch ? roleMatch[1] : 'UNKNOWN';
  const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
  const wage = wageMatch ? parseFloat(wageMatch[1]) : 0;
  
  // Normalize role to title case for case-insensitive matching
  const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  const validRole = normalizedRole in DBWD_RATES;
  
  // Determine violations
  const violations = [];
  let status: 'Approved' | 'Revise' | 'Reject' = 'Approved';
  
  if (!validRole) {
    status = 'Reject';
    violations.push({ type: 'Invalid Role', detail: `Unknown role: ${role}. Must be Electrician or Laborer.` });
  } else {
    const dbwdRate = DBWD_RATES[normalizedRole as keyof typeof DBWD_RATES];
    
    // Check underpayment
    if (wage < dbwdRate.base) {
      status = 'Reject';
      violations.push({ type: 'Underpay', detail: `Wage $${wage}/hr is below DBWD base rate of $${dbwdRate.base}/hr for ${role}.` });
    }
    
    // Check overtime
    if (hours > 40) {
      if (status !== 'Reject') {
        status = 'Revise';
      }
      violations.push({ type: 'Overtime', detail: `Hours ${hours} exceeds 40 hours/week. Overtime pay should be 1.5x base rate for hours over 40.` });
    }
  }
  
  // Generate explanation based on status
  let explanation = '';
  switch (status) {
    case 'Approved':
      explanation = `This WCP is approved. The ${role} role is valid, hours (${hours}) are within limits, and wage ($${wage}/hr) meets or exceeds the DBWD base rate of $${DBWD_RATES[normalizedRole as keyof typeof DBWD_RATES].base}/hr.`;
      break;
    case 'Revise':
      explanation = `This WCP requires revision. The ${role} role and wage are valid, but there are overtime violations that need to be addressed.`;
      break;
    case 'Reject':
      explanation = `This WCP is rejected due to compliance violations that must be corrected.`;
      break;
  }
  
  // Generate findings
  const findings = violations.length > 0 ? violations : [];
  
  // Generate audit trace
  const trace = [
    'Step 1: Extracted WCP data from input',
    'Step 2: Validated role against DBWD rates',
    'Step 3: Checked wage compliance',
    'Step 4: Checked overtime requirements',
    'Step 5: Generated compliance decision'
  ];
  
  // Return the decision
  return {
    status,
    explanation,
    findings,
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
