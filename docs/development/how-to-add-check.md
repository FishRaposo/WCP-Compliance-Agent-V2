# How to Add a New Validation Check

Status Label: Implemented

Step-by-step guide for adding a new validation check to the WCP Compliance Agent's deterministic layer.

---

## Overview

Adding a check means:
1. Define the check logic in Layer 1
2. Update the types
3. Add unit tests
4. Update documentation
5. (Optional) Add to golden set

**Time estimate**: 1-2 hours for a simple check

---

## Step-by-Step

### Step 1: Plan the Check

Before coding, define:

| Question | Answer |
|----------|--------|
| **What does this check validate?** | e.g., "Work week alignment (Monday-Sunday)" |
| **What regulation enforces this?** | e.g., "29 CFR 5.5(a)(3)(ii)" |
| **What inputs does it need?** | e.g., "hoursByDay: {mon, tue, wed, thu, fri, sat, sun}" |
| **What are pass/fail conditions?** | e.g., "Pass if totalHours = sum(hoursByDay)" |
| **What's the severity?** | `info` / `warning` / `error` / `critical` |

**Example: Work Week Alignment Check**
- Validates that reported hours sum matches total
- Regulation: "Hours must be reported accurately per day"
- Inputs: hoursByDay object, totalHours
- Pass: sum(hoursByDay) === totalHours
- Fail: difference > 0.5 hours
- Severity: `error`

---

### Step 2: Add Types

**File**: `src/types/decision-pipeline.ts`

Add check-specific data to `DeterministicReport`:

```typescript
// Around line 50, add to DeterministicReport
export interface DeterministicReport {
  // ... existing fields
  
  /**
   * Work week alignment check results
   */
  workWeekCheck?: {
    dailyHours: {
      mon: number;
      tue: number;
      wed: number;
      thu: number;
      fri: number;
      sat: number;
      sun: number;
    };
    reportedTotal: number;
    calculatedTotal: number;
    discrepancy: number;
    aligned: boolean;
  };
}
```

Update the Zod schema too:

```typescript
export const DeterministicReportSchema = z.object({
  // ... existing fields
  
  workWeekCheck: z.object({
    dailyHours: z.object({
      mon: z.number(),
      tue: z.number(),
      wed: z.number(),
      thu: z.number(),
      fri: z.number(),
      sat: z.number(),
      sun: z.number(),
    }),
    reportedTotal: z.number(),
    calculatedTotal: z.number(),
    discrepancy: z.number(),
    aligned: z.boolean(),
  }).optional(),
});
```

---

### Step 3: Implement the Check

**File**: `src/pipeline/layer1-deterministic.ts`

Add a new function:

```typescript
/**
 * Check work week alignment
 * Regulation: 29 CFR 5.5(a)(3)(ii) - Accurate daily hour reporting
 */
export function checkWorkWeekAlignment(
  dailyHours: { mon: number; tue: number; wed: number; thu: number; fri: number; sat: number; sun: number },
  reportedTotal: number
): CheckResult {
  const calculatedTotal = Object.values(dailyHours).reduce((a, b) => a + b, 0);
  const discrepancy = Math.abs(calculatedTotal - reportedTotal);
  const aligned = discrepancy < 0.5; // Allow 0.5hr rounding
  
  return {
    id: 'work_week_alignment_001',
    type: 'hours',
    passed: aligned,
    regulation: '29 CFR 5.5(a)(3)(ii)',
    severity: aligned ? 'none' : 'error',
    message: aligned
      ? undefined
      : `DISCREPANCY: Daily sum (${calculatedTotal}) differs from reported (${reportedTotal}) by ${discrepancy.toFixed(2)} hrs`,
    details: {
      dailyHours,
      reportedTotal,
      calculatedTotal,
      discrepancy,
      aligned,
    },
  };
}
```

Update `executeDeterministicScaffold` to call your check:

```typescript
export async function executeDeterministicScaffold(
  input: WCPInput
): Promise<DeterministicReport> {
  // ... existing checks
  
  // Add work week check (when we have daily hours)
  const workWeekCheck = input.hoursByDay
    ? checkWorkWeekAlignment(input.hoursByDay, input.hours)
    : undefined;
  
  // Update deterministicScore calculation
  const allChecks = [
    prevailingWageCheck,
    overtimeCheck,
    fringeCheck,
    ...(workWeekCheck ? [workWeekCheck] : []),
  ];
  
  const passedChecks = allChecks.filter(c => c.passed).length;
  const deterministicScore = allChecks.length > 0 
    ? passedChecks / allChecks.length 
    : 0;
  
  return {
    // ... existing fields
    workWeekCheck,
    deterministicScore,
  };
}
```

---

### Step 4: Update Trust Score Calculation

**File**: `src/pipeline/layer3-trust-score.ts`

Your check contributes to the deterministic score, which feeds into trust.

If your check has unique logic that affects trust components, update `computeTrustComponents`:

```typescript
function computeTrustComponents(
  deterministic: DeterministicReport,
  verdict: LLMVerdict
): TrustComponents {
  // ... existing logic
  
  // Add work week alignment to classification confidence
  const workWeekConfidence = deterministic.workWeekCheck?.aligned 
    ? 1.0 
    : 0.5;
  
  const classification = // ... existing calculation
  
  return {
    deterministic: deterministic.deterministicScore,
    classification: classification * workWeekConfidence, // Weight by alignment
    llmSelf: verdict.selfConfidence,
    agreement: computeAgreement(deterministic, verdict),
  };
}
```

---

### Step 5: Add Unit Tests

**File**: `tests/unit/pipeline-contracts.test.ts` (or new file)

```typescript
// tests/unit/work-week-check.test.ts
import { describe, it, expect } from 'vitest';
import { checkWorkWeekAlignment } from '../../src/pipeline/layer1-deterministic';

describe('checkWorkWeekAlignment', () => {
  it('should pass when daily hours sum matches total', () => {
    const dailyHours = { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 };
    const result = checkWorkWeekAlignment(dailyHours, 40);
    
    expect(result.passed).toBe(true);
    expect(result.severity).toBe('none');
    expect(result.details?.calculatedTotal).toBe(40);
    expect(result.details?.discrepancy).toBe(0);
  });
  
  it('should fail when discrepancy exceeds threshold', () => {
    const dailyHours = { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 };
    const result = checkWorkWeekAlignment(dailyHours, 45); // Wrong total
    
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('error');
    expect(result.message).toContain('DISCREPANCY');
  });
  
  it('should allow small rounding differences', () => {
    const dailyHours = { mon: 7.5, tue: 8, wed: 8, thu: 8, fri: 8.5, sat: 0, sun: 0 };
    const result = checkWorkWeekAlignment(dailyHours, 40);
    
    expect(result.passed).toBe(true); // 40.0 vs 40, within 0.5
  });
  
  it('should cite correct regulation', () => {
    const dailyHours = { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 };
    const result = checkWorkWeekAlignment(dailyHours, 40);
    
    expect(result.regulation).toBe('29 CFR 5.5(a)(3)(ii)');
  });
});
```

Run tests:

```bash
npm run test:unit -- work-week-check
```

---

### Step 6: Update Documentation

#### A. Update `current-state.md`

**File**: `docs/foundation/current-state.md`

Add your check to the list:

```markdown
### Layer 1: Deterministic Scaffold

- `extractWCPDataTool` extracts `role`, `hours`, `wage` from text input.
- `checkPrevailingWage` validates base wage against DBWD rates.
- `checkOvertime` validates overtime calculations.
- `checkWorkWeekAlignment` ✅ NEW — validates daily hours sum to total.
```

#### B. Update `traceability-matrix.md`

**File**: `docs/compliance/traceability-matrix.md`

Add regulation-to-check mapping:

```markdown
| Regulation | Implementation | Check ID |
|------------|----------------|----------|
| 29 CFR 5.5(a)(3)(ii) | `checkWorkWeekAlignment` | work_week_alignment_001 |
```

#### C. Update ADR if needed

If your check reveals a gap in ADR-003, add a note:

**File**: `docs/adrs/ADR-003-deterministic-validation.md`

```markdown
## Validation Coverage

| Check | Regulation | Status |
|-------|------------|--------|
| Base wage | 40 U.S.C. § 3142 | ✅ Implemented |
| Overtime | 40 U.S.C. § 3702 | ✅ Implemented |
| Work week alignment | 29 CFR 5.5(a)(3)(ii) | ✅ Implemented |
```

---

### Step 7: Run Full Verification

```bash
# 1. TypeScript
npm run typecheck

# 2. Lint
npm run lint

# 3. Unit tests
npm run test:unit

# 4. Integration tests
npm run test:integration

# 5. Pipeline lint (critical!)
npm run lint:pipeline

# 6. Calibration tests
npm run test:calibration
```

All must pass before merging.

---

### Step 8: (Optional) Add to Golden Set

If your check catches important violations, add an example to the golden set.

**File**: `tests/eval/trust-calibration.test.ts`

```typescript
{
  id: 'work-week-misalignment',
  input: {
    content: 'Role: Electrician, Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Total: 45',
    // Should catch: reported 45 but daily sum is 40
  },
  expected: {
    finalStatus: 'Reject',
    requiredChecks: ['work_week_alignment_001'],
    minTrustScore: 0.3,
  },
  tags: ['hours', 'compliance'],
},
```

---

## Checklist

Before submitting:

- [ ] Check logic implemented in `layer1-deterministic.ts`
- [ ] Types updated in `decision-pipeline.ts`
- [ ] Zod schema updated
- [ ] Trust score updated (if needed)
- [ ] Unit tests added and passing
- [ ] `current-state.md` updated
- [ ] `traceability-matrix.md` updated
- [ ] `npm run lint:pipeline` passes
- [ ] All tests pass

---

## Example: Complete New Check

Here's a complete example: **Signature Presence Check**

### 1. Types

```typescript
// src/types/decision-pipeline.ts
export interface DeterministicReport {
  signatureCheck?: {
    hasSignature: boolean;
    signerName?: string;
    dateSigned?: string;
  };
}
```

### 2. Implementation

```typescript
// src/pipeline/layer1-deterministic.ts
export function checkSignaturePresence(
  wcpText: string
): CheckResult {
  const signaturePattern = /Signed:\s*(\w+\s+\w+)/i;
  const datePattern = /Date:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/;
  
  const hasSignature = signaturePattern.test(wcpText);
  const hasDate = datePattern.test(wcpText);
  
  return {
    id: 'signature_presence_001',
    type: 'completeness',
    passed: hasSignature && hasDate,
    regulation: '29 CFR 5.5(a)(3)(iii)',
    severity: hasSignature ? 'none' : 'critical',
    message: !hasSignature
      ? 'MISSING: Certification signature required'
      : undefined,
    details: {
      hasSignature,
      hasDate,
      signerName: wcpText.match(signaturePattern)?.[1],
      dateSigned: wcpText.match(datePattern)?.[1],
    },
  };
}
```

### 3. Tests

```typescript
// tests/unit/signature-check.test.ts
describe('checkSignaturePresence', () => {
  it('should detect present signature', () => {
    const text = 'Signed: John Doe\nDate: 01/15/2024';
    const result = checkSignaturePresence(text);
    
    expect(result.passed).toBe(true);
    expect(result.details?.signerName).toBe('John Doe');
  });
  
  it('should reject missing signature', () => {
    const text = 'Worker: Jane Smith'; // No signature
    const result = checkSignaturePresence(text);
    
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('critical');
  });
});
```

---

**Last Updated**: 2026-04-17
