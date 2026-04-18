# Deterministic Validation

Status Label: Structurally Implemented, Data Stubbed

Deterministic validation ensures arithmetic and policy correctness through code, not LLM reasoning. This layer provides the factual substrate for all compliance decisions.

---

## Purpose

Deterministic validation guarantees:
- **Arithmetic accuracy**: 100% correct wage calculations
- **Regulatory compliance**: Every check cites specific law
- **Reproducibility**: Same inputs → Same outputs
- **Auditability**: Every check logged with values and citations

---

## Current State

### Implementation

**File**: `src/pipeline/layer1-deterministic.ts`

Current checks (3 total):

| Check ID | Type | Regulation | Status |
|----------|------|------------|--------|
| `base_wage_001` | Wage | 40 U.S.C. § 3142 | ✅ Implemented |
| `overtime_rate_001` | Overtime | 40 U.S.C. § 3702 | ✅ Implemented |
| `fringe_benefits_001` | Fringe | 40 U.S.C. § 3142 | ✅ Implemented |

### Code Structure

```typescript
// src/pipeline/layer1-deterministic.ts

export interface CheckResult {
  id: string;              // Unique check identifier
  type: 'wage' | 'hours' | 'fringe' | 'classification';
  passed: boolean;
  regulation: string;      // e.g., "40 U.S.C. § 3142(a)"
  severity: 'none' | 'info' | 'warning' | 'error' | 'critical';
  message?: string;        // Human-readable failure description
  details?: unknown;       // Check-specific data
}

// Main validation functions
export function checkPrevailingWage(
  wage: number,
  role: string,
  locality: string
): CheckResult;

export function checkOvertime(
  hours: number,
  regularRate: number,
  overtimeRate: number
): CheckResult;

export function checkFringeBenefits(
  reportedFringe: number,
  role: string,
  locality: string
): CheckResult;
```

### Example Check Implementation

```typescript
export function checkPrevailingWage(
  wage: number,
  role: string,
  locality: string
): CheckResult {
  // Hardcoded lookup (stub - real implementation uses DBWD database)
  const prevailingRate = getHardcodedRate(role, locality);
  
  const passed = wage >= prevailingRate.base;
  const difference = wage - prevailingRate.base;
  
  return {
    id: 'base_wage_001',
    type: 'wage',
    passed,
    regulation: '40 U.S.C. § 3142(a)',
    severity: passed ? 'none' : 'critical',
    message: passed ? undefined : `UNDERPAYMENT: $${Math.abs(difference).toFixed(2)}/hr shortfall`,
    details: {
      wage,
      prevailingWage: prevailingRate.base,
      difference,
      role,
      locality,
      effectiveDate: prevailingRate.effectiveDate,
      wdNumber: prevailingRate.wdNumber, // DBWD reference
    },
  };
}
```

### DBWD Rate Lookup (Stubbed)

```typescript
// src/mastra/tools/wcp-tools.ts

const HARD_CODED_RATES: Record<string, DBWDRate> = {
  'Electrician': {
    baseRate: 38.50,
    fringeRate: 8.50,
    locality: 'LOS_ANGELES_CA',
    effectiveDate: '2024-01-01',
    wdNumber: 'WD-2024-001',
  },
  'Laborer': {
    baseRate: 28.00,
    fringeRate: 7.25,
    locality: 'LOS_ANGELES_CA',
    effectiveDate: '2024-01-01',
    wdNumber: 'WD-2024-001',
  },
};

export function lookupDBWDRate(role: string): DBWDRate {
  const rate = HARD_CODED_RATES[role];
  if (!rate) {
    throw new RateLookupError(`No rate found for role: ${role}`);
  }
  return rate;
}
```

---

## Target State

### Full Validation Coverage

Target: 12+ checks covering all Davis-Bacon Act requirements

| Domain | Check ID | Regulation | Priority |
|--------|----------|------------|----------|
| **Wage** | | | |
| Base wage | `base_wage_001` | 40 U.S.C. § 3142 | P0 |
| Overtime rate | `overtime_rate_001` | 40 U.S.C. § 3702 | P0 |
| Fringe benefits | `fringe_benefits_001` | 40 U.S.C. § 3142 | P0 |
| **Hours** | | | |
| Daily/weekly sum | `work_week_alignment_001` | 29 CFR 5.5(a)(3)(ii) | P1 |
| Overtime hours (>40) | `overtime_hours_001` | 40 U.S.C. § 3702 | P1 |
| **Classification** | | | |
| Role recognition | `role_classification_001` | 29 CFR 5.5(a)(3)(i) | P1 |
| Apprentice ratio | `apprentice_ratio_001` | 29 CFR 5.5(a)(4) | P2 |
| **Completeness** | | | |
| Signature presence | `signature_presence_001` | 29 CFR 5.5(a)(3)(iii) | P1 |
| Required fields | `field_completeness_001` | 29 CFR 5.5(a)(3) | P1 |
| **Arithmetic** | | | |
| Gross pay calculation | `gross_pay_calc_001` | 40 U.S.C. § 3142 | P0 |
| Daily totals sum | `daily_sum_check_001` | 29 CFR 5.5(a)(3)(ii) | P1 |

### Check Severity Levels

```typescript
type Severity = 'none' | 'info' | 'warning' | 'error' | 'critical';

const SEVERITY_DEFINITIONS = {
  none: 'Check passed, no issue',
  info: 'Informational, no action needed',
  warning: 'Minor issue, should be fixed',
  error: 'Violation, requires correction',
  critical: 'Serious violation, immediate action required',
};
```

Routing based on severity:
- `critical` → Always escalate to human review
- `error` → Flag for review if trust score < 0.85
- `warning` → Document, may flag
- `info` → Log only

---

## Design Rules

### Rule 1: No Math in LLM

**WRONG**: Ask LLM "Is $35.50/hr enough for an Electrician?"

**RIGHT**: Code calculates: `35.50 < 38.50` → Check fails

```typescript
// Deterministic (correct)
const check = checkPrevailingWage(35.50, 'Electrician', 'LA');
// Result: { passed: false, difference: -3.00 }

// LLM only explains the result
const explanation = await generateExplanation(check);
// "The worker is underpaid by $3.00/hr..."
```

### Rule 2: Every Check Has a Regulation

Every `CheckResult` must include:
```typescript
regulation: '40 U.S.C. § 3142(a)'
```

This enables:
- Audit trail completeness
- Regulatory traceability
- Citation in decision explanations

### Rule 3: Check IDs Are Immutable

Once a check is deployed, its ID never changes:
- `base_wage_001` → Always base wage check
- `overtime_rate_001` → Always overtime rate check

This enables:
- Historical analysis
- Regression detection
- LLM citation verification

### Rule 4: Fail Fast, Fail Loud

If deterministic validation can't run:
```typescript
if (!rate) {
  throw new RateLookupError(`No DBWD rate for ${role}`);
  // Escalates to human review
}
```

Never silently pass with missing data.

---

## Check Output Format

Standard `CheckResult` structure:

```typescript
{
  id: 'base_wage_001',
  type: 'wage',
  passed: false,
  regulation: '40 U.S.C. § 3142(a)',
  severity: 'critical',
  message: 'UNDERPAYMENT: $3.00/hr shortfall',
  details: {
    // Check-specific data
    wage: 35.50,
    prevailingWage: 38.50,
    difference: -3.00,
    weeklyShortfall: -135.00, // 45 hours × $3.00
    
    // DBWD reference
    wdNumber: 'WD-2024-001',
    effectiveDate: '2024-01-01',
    locality: 'LOS_ANGELES_CA',
  },
}
```

---

## Integration with Three-Layer Pipeline

Deterministic validation is **Layer 1**:

```
WCP Input
    ↓
Layer 1: Deterministic Scaffold
    ├── Extract: role, hours, wage
    ├── Lookup: DBWD prevailing rate
    └── Check: wage, overtime, fringe
    ↓
DeterministicReport {
    extracted: {...},
    checks: [CheckResult, CheckResult, ...],
    deterministicScore: 0.67 // 2/3 passed
}
    ↓
Layer 2: LLM Verdict (reasons over findings)
    ↓
Layer 3: Trust Score (0.35 × deterministicScore + ...)
```

**Key Constraint**: Layer 2 CANNOT recompute. It must reference check IDs from Layer 1.

---

## Testing

### Unit Tests

Every check has comprehensive unit tests:

```typescript
// tests/unit/wage-check.test.ts
describe('checkPrevailingWage', () => {
  it('should pass when wage >= prevailing', () => {
    const result = checkPrevailingWage(40.00, 'Electrician', 'LA');
    expect(result.passed).toBe(true);
    expect(result.severity).toBe('none');
  });
  
  it('should fail when wage < prevailing', () => {
    const result = checkPrevailingWage(35.00, 'Electrician', 'LA');
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('critical');
    expect(result.message).toContain('UNDERPAYMENT');
  });
  
  it('should cite correct regulation', () => {
    const result = checkPrevailingWage(35.00, 'Electrician', 'LA');
    expect(result.regulation).toBe('40 U.S.C. § 3142(a)');
  });
  
  it('should calculate weekly shortfall', () => {
    const result = checkPrevailingWage(35.00, 'Electrician', 'LA');
    expect(result.details?.weeklyShortfall).toBe(-135.00);
  });
});
```

### Integration Tests

End-to-end validation scenarios:

```typescript
// tests/integration/validation.test.ts
describe('WCP Validation Scenarios', () => {
  it('should catch underpayment violation', async () => {
    const decision = await analyzeWCP({
      content: 'Role: Electrician, Hours: 40, Wage: 35.50'
    });
    
    const wageCheck = decision.deterministic.checks.find(
      c => c.id === 'base_wage_001'
    );
    
    expect(wageCheck?.passed).toBe(false);
    expect(decision.finalStatus).toBe('Reject');
  });
});
```

---

## Adding New Checks

See [How to Add a Check](../development/how-to-add-check.md) for step-by-step guide.

Quick checklist:
1. Add check function to `layer1-deterministic.ts`
2. Update `CheckResult` type if needed
3. Add regulation citation
4. Write unit tests
5. Update `current-state.md`
6. Update `traceability-matrix.md`

---

## Why This Matters

Moving correctness-critical logic into deterministic systems:

1. **Guarantees accuracy**: Arithmetic is exact, not probabilistic
2. **Enables audit**: Every calculation is logged with inputs
3. **Supports regulation**: Citations link to specific laws
4. **Improves LLM outputs**: Model reasons over facts, doesn't guess
5. **Reduces costs**: No token spend on math the LLM might get wrong

This is production AI infrastructure judgment: deterministic for correctness, LLM for synthesis.

---

## Related Documentation

- [How to Add a Check](../development/how-to-add-check.md) — Step-by-step guide
- [ADR-003: Deterministic Validation](../adrs/ADR-003-deterministic-validation.md) — Architectural decision
- [Traceability Matrix](../compliance/traceability-matrix.md) — Regulation mapping
- [Layer 1 Implementation](../../src/pipeline/layer1-deterministic.ts) — Source code
- [Decision Architecture](./decision-architecture.md) — Three-layer doctrine

---

**Last Updated**: 2026-04-17
