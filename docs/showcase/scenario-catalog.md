# Scenario Catalog

Status Label: Designed / Target

Comprehensive test scenarios for the WCP Compliance Agent, from happy paths to adversarial edge cases.

Technical anchors:

- [`../architecture/deterministic-validation.md`](../architecture/deterministic-validation.md)
- [`../architecture/retrieval-and-context.md`](../architecture/retrieval-and-context.md)
- [`../evaluation/adversarial-cases.md`](../evaluation/adversarial-cases.md)

---

## Current proof scenarios

These 6 scenarios are implemented and tested in the current proof artifact:

### 1. Valid Electrician Case

**Input:**
```
Role: Electrician
Hours: 40
Wage: $38.50
```

**Expected Result:** ✅ COMPLIANT

**Validation checks:**
- Base rate: $38.50 ≥ $38.50 (LA prevailing) ✅
- No overtime hours ✅

**Decision output:**
```json
{
  "status": "COMPLIANT",
  "explanation": "Wage meets Los Angeles prevailing rate for Electrician ($38.50/hour). No overtime hours recorded.",
  "findings": [],
  "confidence": 0.99
}
```

**Test code:**
```typescript
test('valid electrician case', async () => {
  const result = await analyzeWCP({
    payload: 'Role: Electrician, Hours: 40, Wage: 38.50'
  });
  expect(result.status).toBe('COMPLIANT');
  expect(result.findings).toHaveLength(0);
});
```

---

### 2. Electrician Overtime Case

**Input:**
```
Role: Electrician
Hours: 45 (40 regular + 5 overtime)
Wage: $38.50 base, $57.75 overtime
```

**Expected Result:** ✅ COMPLIANT

**Validation checks:**
- Base rate: $38.50 ≥ $38.50 ✅
- Overtime rate: $57.75 = $38.50 × 1.5 ✅
- Overtime hours correctly flagged ✅

**Decision output:**
```json
{
  "status": "COMPLIANT",
  "explanation": "Base wage and overtime rate comply with Davis-Bacon Act requirements. Overtime correctly calculated at 1.5x base rate.",
  "findings": [
    {
      "check": "overtime_hours",
      "severity": "info",
      "message": "5 overtime hours correctly flagged"
    }
  ],
  "confidence": 0.98
}
```

---

### 3. Electrician Underpayment Case

**Input:**
```
Role: Electrician
Hours: 45
Wage: $35.50 (underpaid)
```

**Expected Result:** ❌ VIOLATION

**Validation checks:**
- Base rate: $35.50 < $38.50 ❌ (-$3.00/hour)
- Overtime rate: $35.50 < $57.75 ❌ (-$22.25/hour)
- Total underpayment: $231.25

**Decision output:**
```json
{
  "status": "VIOLATION",
  "explanation": "Employee is underpaid. Base rate is $3.00 below prevailing wage. Overtime rate is $22.25 below required 1.5x base. Total underpayment: $231.25.",
  "findings": [
    {
      "check": "base_wage",
      "severity": "error",
      "expected": 38.50,
      "actual": 35.50,
      "difference": -3.00
    },
    {
      "check": "overtime_rate",
      "severity": "critical",
      "expected": 57.75,
      "actual": 35.50,
      "difference": -22.25
    }
  ],
  "confidence": 0.98
}
```

**Test code:**
```typescript
test('electrician underpayment', async () => {
  const result = await analyzeWCP({
    payload: 'Role: Electrician, Hours: 45, Wage: 35.50'
  });
  expect(result.status).toBe('VIOLATION');
  expect(result.findings).toContainEqual(
    expect.objectContaining({ check: 'base_wage', severity: 'error' })
  );
});
```

---

### 4. Valid Laborer Case

**Input:**
```
Role: Laborer
Hours: 38
Wage: $28.50
```

**Expected Result:** ✅ COMPLIANT

**Validation:** Wage exceeds LA prevailing rate ($28.00), no overtime.

---

### 5. Laborer Overtime Case

**Input:**
```
Role: Laborer
Hours: 42
Wage: $28.00 base, $42.00 overtime
```

**Expected Result:** ✅ COMPLIANT

**Validation:** Regular and overtime rates both meet requirements.

---

### 6. Laborer Underpayment Case

**Input:**
```
Role: Laborer
Hours: 40
Wage: $27.00 (below $28.00 prevailing)
```

**Expected Result:** ❌ VIOLATION

**Validation:** Base wage $1.00 below minimum prevailing rate.

---

## Target showcase scenarios

These 8 scenarios demonstrate production-ready capabilities planned for future phases:

### 7. Missing Signature

**Scenario**: Wage data is valid, but supervisor signature is missing.

**Input:**
```
Role: Electrician
Hours: 40
Wage: $38.50
Signature: __________ (blank)
```

**Expected Result:** ⚠️ REVISION_NEEDED

**Why this matters**: Unsigned WCP is not legally valid, even if math is correct.

**System behavior**:
- Detect missing signature field
- Flag as business rule violation
- Request resubmission with signature

---

### 8. Arithmetic Mismatch

**Scenario**: Daily hours sum to 43, but weekly total shows 40.

**Input:**
```
Monday: 9 hours
Tuesday: 9 hours
Wednesday: 8 hours
Thursday: 9 hours
Friday: 8 hours
Total Weekly Hours: 40  (should be 43)
```

**Expected Result:** ⚠️ REVISION_NEEDED

**Why this matters**: Data integrity errors suggest fraud or mistakes requiring human review.

---

### 9. Ambiguous Job Title (Alias Resolution)

**Scenario**: Worker listed as "Wireman" (synonym for Electrician).

**Input:**
```
Role: Wireman
Hours: 40
Wage: $38.50
```

**Expected Result:** ✅ COMPLIANT (with mapping note)

**System behavior**:
- "Wireman" not in rate table
- Query trade alias database
- Map to "Electrician" with 90% confidence
- Proceed with validation
- Note alias mapping in decision

**Why this matters**: Real-world job titles vary. System must resolve synonyms without guessing.

---

### 10. Locality Mismatch

**Scenario**: Project is in San Francisco, but LA rates used.

**Input:**
```
Project Location: San Francisco
Reported Locality: Los Angeles
Role: Electrician
Wage: $38.50
```

**Expected Result:** ❌ VIOLATION

**System behavior**:
- Detect project location vs reported locality mismatch
- Note SF rate ($42.50) vs reported rate ($38.50)
- Flag $4.00/hour underpayment
- Cite correct SF determination

**Why this matters**: Wrong locality = wrong rate = compliance failure.

---

### 11. Low-Confidence Retrieval

**Scenario**: Multiple DBWD sections match with similar scores.

**Input:**
```
Role: Electrical Supervisor
Hours: 40
Wage: $45.00
```

**Retrieval results**:
```
1. "Electrician, Master" - score: 0.82
2. "Electrical Foreman" - score: 0.80
3. "Electrical Supervisor" - score: 0.78 (but rare term)
```

**Expected Result:** ⚠️ REVISION_NEEDED

**System behavior**:
- Top retrieval scores within 0.05 of each other
- Confidence below 0.80 threshold
- Escalate to human for classification
- Present candidate matches

**Why this matters**: When retrieval is ambiguous, system must escalate, not guess.

---

### 12. Conflicting Deterministic and Model

**Scenario**: Deterministic validation passes, but LLM suggests apprentice classification.

**Input:**
```
Role: Electrician
Hours: 40
Wage: $38.50
Context: "First-year trainee working under supervision"
```

**Expected Result:** ⚠️ REVISION_NEEDED

**System behavior**:
- Deterministic: Wage matches Electrician rate ✅
- LLM: Context suggests Apprentice classification (lower rate)
- Conflict detected
- Confidence reduced to 0.65
- Escalate to human review

**Why this matters**: When deterministic and probabilistic disagree, human judgment is safest.

---

### 13. OCR-Degraded Scanned Report

**Scenario**: Low-quality scan with smudged text.

**Input:** (scanned PDF)
```
Role: Elec[r[cian  (illegible)
Hours: 4~  (unclear: 40 or 45?)
Wage: 38._0  (last digit smudged)
```

**Expected Result:** ⚠️ REVISION_NEEDED

**System behavior**:
- OCR confidence scores: role=0.45, hours=0.30, wage=0.60
- All below 0.70 threshold
- Request clearer scan or manual entry
- Do not guess missing data

**Why this matters**: High-stakes decisions from poor data lead to liability.

---

### 14. Replayed Decision with Trace

**Scenario**: Regulator requests replay of decision from 6 months ago.

**Request:**
```
Trace ID: trace-2024-06-15-abc123
Replay with current configuration
```

**Expected Result:** Decision output with comparison

**System behavior**:
- Fetch original trace from archive
- Extract request payload and configuration
- Re-run analysis with current code/models
- Compare to original decision
- Report any differences

**Why this matters**: Audit requirement—regulators must verify decisions months later.

---

## Test coverage matrix

| Scenario | Phase | Type | Priority | Implemented |
|----------|-------|------|----------|-------------|
| Valid Electrician | Current | Happy path | Critical | ✅ |
| Electrician Overtime | Current | Happy path | Critical | ✅ |
| Electrician Underpayment | Current | Violation | Critical | ✅ |
| Valid Laborer | Current | Happy path | High | ✅ |
| Laborer Overtime | Current | Happy path | High | ✅ |
| Laborer Underpayment | Current | Violation | High | ✅ |
| Missing Signature | Phase 2 | Business rule | High | 🔲 |
| Arithmetic Mismatch | Phase 2 | Data integrity | High | 🔲 |
| Job Title Alias | Phase 2 | Ambiguity | Medium | 🔲 |
| Locality Mismatch | Phase 2 | Context | High | 🔲 |
| Low-Confidence Retrieval | Phase 2 | Uncertainty | Critical | 🔲 |
| Deterministic/Model Conflict | Phase 3 | Edge case | Medium | 🔲 |
| OCR Degraded | Phase 3 | Input quality | Medium | 🔲 |
| Replay with Trace | Phase 3 | Audit | Medium | 🔲 |

---

## Why this matters

A full showcase should not only show happy-path correctness. It should demonstrate the platform's behavior when:

- **Evidence is incomplete** - Missing signatures, blank fields
- **Data is conflicting** - Arithmetic mismatches, locality errors
- **Confidence is low** - Ambiguous retrieval, model disagreement
- **Input is degraded** - OCR errors, poor scans
- **Audit is required** - Trace replay, decision reconstruction

These scenarios prove the system is **production-minded**, not just **demo-optimized**.

---

## Try these scenarios

### Quick test (local)

```bash
# Start server
npm run dev

# Test valid case
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"payload": "Role: Electrician, Hours: 40, Wage: 38.50"}'

# Test violation case
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"payload": "Role: Electrician, Hours: 45, Wage: 35.50"}'
```

### Automated test suite

```bash
# Run all implemented scenarios
npm test

# Run with coverage report
npm run test:coverage

# Specific scenario
npm test -- --testNamePattern="electrician"
```

---

## Edge case severity levels

| Severity | Description | Examples | Action |
|----------|-------------|----------|--------|
| **Critical** | Safety/legal risk | False approval of underpayment | Block + alert |
| **Error** | Compliance violation | Underpayment, missing docs | Reject + notify |
| **Warning** | Needs attention | Low confidence, minor issues | Flag for review |
| **Info** | For awareness | Overtime hours logged | Log only |

---

## Related documentation

- [Adversarial Cases](../evaluation/adversarial-cases.md) - Detailed failure mode analysis
- [Case Study](./case-study.md) - Concrete examples with performance data
- [Demo Walkthrough](../demo-walkthrough.md) - What users see for each scenario
- [Evaluation Strategy](../evaluation/evaluation-strategy.md) - How scenarios become tests

---

*Last updated: January 2024*
