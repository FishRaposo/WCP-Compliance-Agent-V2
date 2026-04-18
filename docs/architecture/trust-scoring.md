# Trust Scoring System

Status Label: Implemented

How the WCP Compliance Agent computes trust scores and applies human-review thresholds.

---

## Overview

Every compliance decision receives a **trust score** (0.0–1.0) representing confidence in the decision's correctness. The score is computed from four independent signals, each weighted by importance:

```
trust = 0.35 × deterministicScore
      + 0.25 × classificationConfidence  
      + 0.20 × llmSelfConfidence
      + 0.20 × agreementScore
```

**Purpose**: Identify cases where the automated system might be wrong and flag them for human review.

---

## Trust Score Components

### 1. Deterministic Score (35%)

**What it measures**: Did all Layer 1 checks run cleanly without errors?

**Computation**:
```
deterministicScore = (cleanChecks / totalChecks) × (1 - errorPenalty)

where:
- cleanChecks = checks that completed without throwing
- totalChecks = total checks attempted
- errorPenalty = 0.5 if any check threw, 0 otherwise
```

**Why 35% weight**: Layer 1 is the foundation. If checks fail to run, we cannot trust the decision regardless of what the LLM says.

**Examples**:
- All 5 checks passed cleanly → `deterministicScore = 1.0`
- 4/5 checks passed, 1 errored → `deterministicScore = (4/5) × 0.5 = 0.4`

---

### 2. Classification Confidence (25%)

**What it measures**: How confident are we in the worker classification that determined the DBWD rate?

**Values by tier**:
| Classification Method | Confidence | Rationale |
|------------------------|------------|-----------|
| Exact match | 1.0 | "Electrician" == "Electrician" in DBWD |
| Alias match | 0.90 | "Wireman" mapped to "Electrician" via alias DB |
| Semantic similarity | 0.75 | "Electrical Tech" matched via embeddings |
| Manual override | 0.60 | User explicitly selected classification |
| Unknown / low similarity | 0.30 | Escalated to human for classification |

**Why 25% weight**: Classification errors cascade into wage violations. A misclassified worker gets the wrong DBWD rate, leading to wrong compliance decisions.

**Regulatory basis**: 29 CFR 5.5(a)(3)(i) — workers must be classified according to work actually performed.

---

### 3. LLM Self-Confidence (20%)

**What it measures**: The LLM's own assessment of how confident it is in its verdict.

**Source**: LLM outputs `selfConfidence` field (0.0–1.0) as part of `LLMVerdict`.

**Prompt instruction**:
```
Rate your confidence in this verdict from 0.0 to 1.0, where:
- 1.0 = You are certain, all checks are clear, decision is obvious
- 0.8 = You are confident but one check was borderline
- 0.6 = You are somewhat uncertain, multiple edge cases
- 0.4 = You are uncertain, conflicting signals in the data
- 0.2 = You are guessing, data is ambiguous or contradictory
```

**Why 20% weight**: The LLM's self-assessment correlates with actual accuracy, but we don't fully trust it (hence not 50%+ weight). Combined with other signals, it improves overall prediction.

**Calibration**: Periodically compare `llmSelfConfidence` against actual correctness on golden set. If systematically over/under-confident, adjust with calibration curve.

---

### 4. Agreement Score (20%)

**What it measures**: Does the LLM's verdict align with the deterministic check results?

**Computation**:
```typescript
function computeAgreement(
  verdict: LLMVerdict,
  checks: CheckResult[]
): number {
  // Check severity classification
  const hasCritical = checks.some(c => c.severity === "critical" && !c.passed);
  const hasError = checks.some(c => c.severity === "error" && !c.passed);
  const hasWarning = checks.some(c => c.severity === "warning" && !c.passed);
  
  // Expected verdict based on severity
  let expectedStatus: "Approved" | "Revise" | "Reject";
  if (hasCritical) expectedStatus = "Reject";
  else if (hasError) expectedStatus = "Revise";
  else expectedStatus = "Approved";
  
  // Score based on alignment
  if (verdict.status === expectedStatus) return 1.0;
  
  // Partial credit for adjacent statuses
  if (expectedStatus === "Reject" && verdict.status === "Revise") return 0.5;
  if (expectedStatus === "Revise" && verdict.status === "Approved") return 0.3;
  if (expectedStatus === "Approved" && verdict.status === "Revise") return 0.5;
  
  // Major disagreement
  return 0.0;
}
```

**Why 20% weight**: Catches cases where the LLM hallucinates or ignores critical findings. Even if trust components are high, disagreement forces human review.

**Override rule**: `agreementScore === 0` automatically sets `trust.band = "require_human"` regardless of overall trust score.

---

## Trust Bands & Actions

| Trust Range | Band | Action | Human Review Required |
|-------------|------|--------|----------------------|
| `0.85 – 1.00` | **auto** | Auto-decide immediately | No |
| `0.60 – 0.84` | **flag_for_review** | Decide but queue for optional review | Advisory (non-blocking) |
| `0.00 – 0.59` | **require_human** | Block auto-approval, require human review | Yes (blocking) |

### Threshold Rationale

**Upper threshold (0.85)**: 
- Must catch 95%+ of actual errors in production (evaluated on golden set)
- On calibration set, decisions with trust ≥0.85 should have <2% error rate

**Lower threshold (0.60)**:
- Below this, the system is guessing. Multiple components are weak.
- Human review is mandatory; no auto-approval allowed.

**Middle band (0.60–0.84)**:
- System is reasonably confident but not certain
- Decision proceeds but is flagged for later human review
- Allows catching edge cases without blocking throughput

---

## Example Trust Calculations

### Example 1: Clean Case (Auto-Decide)

```typescript
const components = {
  deterministicScore: 1.0,      // All checks passed
  classificationConfidence: 1.0, // Exact match
  llmSelfConfidence: 0.95,      // LLM very confident
  agreementScore: 1.0            // Verdict matches checks
};

// trust = 0.35×1.0 + 0.25×1.0 + 0.20×0.95 + 0.20×1.0
//       = 0.35 + 0.25 + 0.19 + 0.20 = 0.99

// Result: Band "auto", no human review required
```

### Example 2: Borderline Case (Flag for Review)

```typescript
const components = {
  deterministicScore: 1.0,      // All checks passed
  classificationConfidence: 0.75, // Semantic match
  llmSelfConfidence: 0.70,      // LLM somewhat uncertain
  agreementScore: 0.5             // Verdict "Approved" but checks had warnings
};

// trust = 0.35×1.0 + 0.25×0.75 + 0.20×0.70 + 0.20×0.5
//       = 0.35 + 0.1875 + 0.14 + 0.10 = 0.7775

// Result: Band "flag_for_review", queued for optional review
```

### Example 3: Uncertain Case (Require Human)

```typescript
const components = {
  deterministicScore: 0.6,      // Some checks errored
  classificationConfidence: 0.30, // Unknown classification
  llmSelfConfidence: 0.50,      // LLM uncertain
  agreementScore: 0.0             // Verdict "Approved" but critical check failed!
};

// trust = 0.35×0.6 + 0.25×0.30 + 0.20×0.50 + 0.20×0.0
//       = 0.21 + 0.075 + 0.10 + 0.0 = 0.385

// Result: Band "require_human", blocking human review required
// Also: agreementScore === 0 triggers override
```

---

## Calibration Methodology

Trust scores must be **calibrated** to actual correctness. An uncalibrated system may have high trust but still make mistakes.

### Golden Set

A curated set of 20+ WCP cases with known outcomes:
- 5 clean cases (should be Approved)
- 5 violation cases (should be Revise/Reject)
- 5 edge cases (ambiguous classifications, borderline hours)
- 5 adversarial cases (garbage input, missing fields)

### Calibration Process

1. **Run pipeline** on golden set, capture trust scores and decisions
2. **Score correctness**: Did the decision match the known outcome?
3. **Analyze bands**:
   - What % of trust ≥0.85 decisions were correct? (Target: >98%)
   - What % of trust <0.60 decisions were wrong? (Target: >80%)
4. **Adjust weights** if needed (document in ADR)
5. **Adjust thresholds** if bands don't align with correctness

### Calibration Example

Suppose analysis shows:
- Trust 0.85+ → 94% correct (below 98% target)
- Trust 0.70–0.84 → 85% correct
- Trust <0.60 → 75% incorrect (good)

**Adjustment**: Increase `deterministicScore` weight from 35% → 40%, decrease `llmSelfConfidence` from 20% → 15%. Re-run calibration.

### Frequency
- **Weekly** during Phase 02 (MVP development)
- **Monthly** during Phase 03 (showcase)
- **Quarterly** in Phase 05 (maintenance)
- **Immediately** after any pipeline code change

---

## Failure Modes

### High Trust, Wrong Decision (False Negative)

**Symptom**: Trust score 0.90, but decision should have been Reject.

**Likely causes**:
1. Missing check in Layer 1 (deterministic score inflated)
2. LLM hallucinating agreement (verdict doesn't reference actual checks)
3. Classification confidence too high (wrong tier used)

**Response**:
- Add case to golden set
- Review Layer 1 check coverage
- Investigate why LLM ignored critical finding
- Recalibrate if pattern

### Low Trust, Correct Decision (False Positive)

**Symptom**: Trust score 0.55, but decision was actually correct.

**Likely causes**:
1. Overly conservative thresholds
2. Check errors that didn't affect outcome
3. LLM under-confidence

**Response**:
- Tweak threshold (0.60 → 0.55) if pattern consistent
- Fix check error handling
- Recalibrate LLM self-confidence

### Disagreement Override Flooding Queue

**Symptom**: 30%+ of cases hitting `require_human` due to agreementScore === 0.

**Likely causes**:
1. LLM prompt not grounding correctly
2. Severity classification in checks mismatches LLM interpretation
3. Verdict status mapping off

**Response**:
- Review `referencedCheckIds` in verdicts (are they valid?)
- Tune severity → status mapping
- Retrain/calibrate LLM on edge cases

---

## Implementation

### Source Files

- `src/pipeline/layer3-trust-score.ts` — Trust computation
- `src/types/decision-pipeline.ts` — Type definitions
- `tests/eval/trust-calibration.test.ts` — Calibration test

### Key Function

```typescript
// src/pipeline/layer3-trust-score.ts
export function computeTrustScore(
  report: DeterministicReport,
  verdict: LLMVerdict
): TrustScore {
  const components = {
    deterministic: report.deterministicScore,
    classification: report.classificationConfidence,
    llmSelf: verdict.selfConfidence,
    agreement: computeAgreement(verdict, report.checks)
  };
  
  const score = 
    0.35 * components.deterministic +
    0.25 * components.classification +
    0.20 * components.llmSelf +
    0.20 * components.agreement;
  
  // Override: disagreement forces human review
  const band = components.agreement === 0.0 
    ? "require_human"
    : score >= 0.85 ? "auto"
    : score >= 0.60 ? "flag_for_review"
    : "require_human";
  
  return {
    score,
    components,
    band,
    reasons: generateReasons(components, band)
  };
}
```

### Test Validation

```typescript
// tests/unit/trust-score.test.ts
expect(computeTrustScore({
  deterministicScore: 1.0,
  classificationConfidence: 1.0,
  // ...
}, {
  selfConfidence: 0.95,
  status: "Approved",
  // ...
}).band).toBe("auto");
```

---

## Regulatory Compliance

Trust scoring directly supports:

| Requirement | How Trust Scoring Helps |
|-------------|------------------------|
| **Copeland Act (40 U.S.C. § 3145)** | Low-trust cases require human review, creating accountable decision trail |
| **29 CFR 5.5(a)(3)** | Suspect cases escalated rather than auto-approved |
| **Audit readiness** | Trust components explain why a decision was (or wasn't) escalated |
| **Due diligence** | Demonstrates reasonable effort to prevent automated errors |

---

## Changing the Formula

**Rule**: Any change to weights or thresholds requires:
1. Update this document
2. Update ADR-005 with amendment
3. Re-run calibration test
4. Golden set must still pass
5. 2-week bake-in period before merge

**History**:
| Date | Change | Rationale |
|------|--------|-----------|
| 2026-04-17 | Initial weights (35/25/20/20) | Baseline from heuristic analysis |

---

## Related Documents

- `docs/architecture/decision-architecture.md` — Three-layer doctrine
- `docs/architecture/human-review-workflow.md` — Queue mechanics
- `docs/adrs/ADR-005-decision-architecture.md` — Original decision record
- `src/types/decision-pipeline.ts` — Type definitions
- `tests/eval/trust-calibration.test.ts` — Calibration procedure
