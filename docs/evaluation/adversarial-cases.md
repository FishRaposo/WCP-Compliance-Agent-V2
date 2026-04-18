# Adversarial Cases

Status Label: Planned / Future

Edge cases and failure modes that expose whether the system is truly production-minded or only built for happy-path demos.

Truth anchors:

- [`../foundation/current-state.md`](../foundation/current-state.md)
- [`../foundation/implemented-vs-target.md`](../foundation/implemented-vs-target.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)

---

## Why adversarial testing matters

Production systems fail on edge cases, not happy paths. These tests expose:

- **Robustness**: Does the system degrade gracefully?
- **Safety**: Does it avoid dangerous false approvals?
- **Observability**: Can we detect and diagnose failures?
- **Recovery**: Can we fix issues and replay decisions?

---

## Core adversarial categories

### 1. OCR failures and low-quality scans

**The scenario**: A scanned PDF has poor resolution, handwriting, or skew.

**Example input**:
```
Role: Electr[cian  (smudged)
Hours: 4~  (unclear if 40 or 45)
Wage: 35.0_  (last digit illegible)
```

**Expected system behavior**:
```json
{
  "status": "REVISION_NEEDED",
  "explanation": "Unable to clearly read: role (smudged), hours (illegible digit), wage (missing last digit). Please upload a clearer scan or enter data manually.",
  "findings": [
    {
      "check": "ocr_quality",
      "severity": "warning",
      "confidence": 0.45,
      "message": "Low OCR confidence on role field"
    }
  ],
  "confidence": 0.45
}
```

**Why this matters**: High-stakes decisions from poor data lead to liability. Better to ask for clarification than guess.

**Test case**:
```typescript
// tests/adversarial/ocr.test.ts
test('low OCR confidence triggers revision', async () => {
  const result = await analyzeWCP({
    payload: "Role: Electr[cian, Hours: 4~, Wage: 35.0_",
    ocrConfidence: { role: 0.45, hours: 0.30, wage: 0.60 }
  });
  
  expect(result.status).toBe('REVISION_NEEDED');
  expect(result.findings).toContainEqual(
    expect.objectContaining({ check: 'ocr_quality' })
  );
});
```

---

### 2. Partial or missing signatures

**The scenario**: WCP report is complete except supervisor signature is missing.

**Example input**:
```
Role: Electrician
Hours: 40
Wage: 38.50
Signature: _______________ (blank)
```

**Expected system behavior**:
```json
{
  "status": "REVISION_NEEDED",
  "explanation": "Wage data appears compliant, but supervisor signature is required for legal validity. Please obtain signature and resubmit.",
  "findings": [
    {
      "check": "signature",
      "severity": "error",
      "present": false,
      "field": "supervisor_signature"
    },
    {
      "check": "base_wage",
      "severity": "info",
      "message": "Would be compliant if signed"
    }
  ],
  "confidence": 0.85
}
```

**Why this matters**: An unsigned WCP is not legally valid even if math is correct. The system must catch this.

---

### 3. Contradictory totals across daily and weekly records

**The scenario**: Daily hours sum to 43, but weekly total shows 40.

**Example input**:
```
Monday: 8 hours
Tuesday: 9 hours
Wednesday: 8 hours
Thursday: 9 hours
Friday: 9 hours
---
Total Weekly Hours: 40  (should be 43)
```

**Expected system behavior**:
```json
{
  "status": "REVISION_NEEDED",
  "explanation": "Arithmetic error detected: daily hours sum to 43, but weekly total reports 40. Please correct the discrepancy.",
  "findings": [
    {
      "check": "arithmetic",
      "severity": "error",
      "type": "total_mismatch",
      "dailySum": 43,
      "weeklyTotal": 40,
      "difference": 3
    }
  ],
  "confidence": 0.99
}
```

**Why this matters**: Data integrity errors indicate either fraud or mistakes. Either way, human review required.

---

### 4. Job title synonym drift

**The scenario**: Worker is listed as "Wireman" but DBWD only lists "Electrician".

**Example input**:
```
Role: Wireman
Hours: 40
Wage: 38.50
```

**Expected system behavior** (with alias mapping):
```json
{
  "status": "COMPLIANT",
  "explanation": "Job title 'Wireman' mapped to 'Electrician' via trade alias database. Wage meets prevailing rate.",
  "findings": [
    {
      "check": "alias_mapping",
      "severity": "info",
      "input": "Wireman",
      "mapped": "Electrician",
      "confidence": 0.90
    },
    {
      "check": "base_wage",
      "severity": "info",
      "expected": 38.50,
      "actual": 38.50
    }
  ],
  "citations": [
    {
      "source": "DBWD_ELECTRICIAN_LA_2024",
      "alias_source": "TRADE_ALIAS_DB"
    }
  ],
  "confidence": 0.90
}
```

**Why this matters**: Real-world job titles vary. The system must resolve synonyms without guessing.

---

### 5. Locality mismatches

**The scenario**: Report says "Los Angeles" but worker actually worked in San Francisco (different prevailing rates).

**Example input**:
```
Project Location: San Francisco
Reported Locality: Los Angeles
Role: Electrician
Wage: $38.50
```

**Expected system behavior**:
```json
{
  "status": "REVISION_NEEDED",
  "explanation": "Locality mismatch: Project is in San Francisco (SF prevailing rate: $42.50), but report uses Los Angeles rate ($38.50). Worker is underpaid by $4.00/hour for SF locality.",
  "findings": [
    {
      "check": "locality",
      "severity": "critical",
      "reported": "Los Angeles",
      "actual": "San Francisco",
      "reportedRate": 38.50,
      "correctRate": 42.50,
      "underpayment": 4.00
    }
  ],
  "confidence": 0.95
}
```

**Why this matters**: Locality determines rate. Wrong locality = wrong decision.

---

### 6. Stale corpus versions

**The scenario**: DBWD determination was updated last month, but system has old rates cached.

**System state**:
```
System corpus version: DBWD_2023_Q4
Latest DBWD version: DBWD_2024_Q1
Change: Electrician rate increased $38.50 → $40.00
```

**Example input**:
```
Role: Electrician
Hours: 40
Wage: $39.00  (was compliant, now underpaid)
```

**Expected system behavior**:
```json
{
  "status": "VIOLATION",
  "explanation": "Warning: System corpus is outdated (2023 Q4, latest is 2024 Q1). Based on latest rates, wage is $1.00 below new prevailing rate of $40.00. Please update corpus and re-run analysis.",
  "findings": [
    {
      "check": "base_wage",
      "severity": "error",
      "expected": 40.00,
      "actual": 39.00,
      "corpusVersion": "DBWD_2023_Q4",
      "latestVersion": "DBWD_2024_Q1"
    },
    {
      "check": "corpus_staleness",
      "severity": "warning",
      "daysStale": 45,
      "message": "Corpus is 45 days old"
    }
  ],
  "confidence": 0.88
}
```

**Why this matters**: Regulations change. The system must track its own knowledge freshness.

---

### 7. Retrieval conflicts (multiple plausible DBWD sections)

**The scenario**: Query "Electrical worker rates" matches both "Electrician" and "Electrical Apprentice" with similar scores.

**Retrieval results**:
```
1. Electrician: score=0.85, rate=$38.50
2. Electrical Apprentice: score=0.82, rate=$28.00
```

**Expected system behavior**:
```json
{
  "status": "REVISION_NEEDED",
  "explanation": "Ambiguous job classification: retrieved multiple possible matches (Electrician, Electrical Apprentice). Please specify exact job title or provide additional context.",
  "findings": [
    {
      "check": "retrieval_conflict",
      "severity": "warning",
      "candidates": [
        { "role": "Electrician", "confidence": 0.85, "rate": 38.50 },
        { "role": "Electrical Apprentice", "confidence": 0.82, "rate": 28.00 }
      ],
      "topScoreDiff": 0.03
    }
  ],
  "confidence": 0.50
}
```

**Why this matters**: When retrieval is ambiguous, the system must escalate, not pick randomly.

---

### 8. Deterministic / model disagreement

**The scenario**: Deterministic layer says "compliant" but LLM says "violation" based on nuanced interpretation.

**Example**:
```
Input: "Role: Electrician, Hours: 40, Wage: 38.50"
Deterministic result: COMPLIANT (matches rate table)
LLM interpretation: "Worker appears to be apprentice-level based on context, should be paid apprentice rate"
```

**Expected system behavior**:
```json
{
  "status": "REVISION_NEEDED",
  "explanation": "Conflict detected: deterministic check passed (wage matches Electrician rate), but context suggests worker may be apprentice-level. Human review recommended.",
  "findings": [
    {
      "check": "base_wage",
      "severity": "info",
      "deterministicResult": "COMPLIANT",
      "modelResult": "VIOLATION",
      "modelReason": "Context suggests apprentice classification"
    },
    {
      "check": "deterministic_model_conflict",
      "severity": "warning",
      "deterministicConfidence": 0.99,
      "modelConfidence": 0.72
    }
  ],
  "confidence": 0.65
}
```

**Why this matters**: When deterministic and probabilistic disagree, human judgment is safest.

---

### 9. Malformed uploads and missing attachments

**The scenario**: API call references attachment "payroll_week1.pdf" but file is missing.

**Example input**:
```json
{
  "payload": "See attached payroll document",
  "attachments": ["payroll_week1.pdf"]
}
```

**System state**: File payroll_week1.pdf not found in storage

**Expected system behavior**:
```json
{
  "status": "REVISION_NEEDED",
  "explanation": "Referenced attachment 'payroll_week1.pdf' not found. Please upload the payroll document or provide data in text format.",
  "findings": [
    {
      "check": "attachment_missing",
      "severity": "error",
      "attachmentId": "payroll_week1.pdf",
      "referenced": true,
      "found": false
    }
  ],
  "confidence": 0.00
}
```

**Why this matters**: References to missing data must be caught immediately, not fail silently.

---

## Adversarial test suite structure

```
tests/adversarial/
├── ocr.test.ts              # Low-quality scans, handwriting
├── signatures.test.ts       # Missing, partial, forged signatures
├── arithmetic.test.ts       # Mismatched totals, rounding errors
├── aliases.test.ts          # Job title synonyms, drift
├── locality.test.ts         # Wrong locality, jurisdictional issues
├── corpus.test.ts           # Stale data, version mismatches
├── retrieval.test.ts        # Ambiguous matches, low confidence
├── conflict.test.ts         # Deterministic vs model disagreement
├── uploads.test.ts          # Malformed files, missing attachments
└── fuzz.test.ts            # Random input injection
```

---

## Running adversarial tests

```bash
# Run all adversarial tests
npm run test:adversarial

# Run specific category
npm run test:adversarial -- --grep="ocr"
npm run test:adversarial -- --grep="signatures"

# Generate adversarial report
npm run test:adversarial -- --reporter=json > adversarial-report.json
```

---

## What these tests prove

| Category | What It Proves |
|----------|---------------|
| OCR failures | System degrades gracefully with bad input |
| Missing signatures | System validates business rules, not just math |
| Arithmetic errors | System catches data integrity issues |
| Job title drift | System handles real-world variation |
| Locality mismatches | System validates context, not just payload |
| Stale corpus | System tracks its own knowledge limitations |
| Retrieval conflicts | System escalates when uncertain |
| Model disagreement | System knows when it doesn't know |
| Malformed uploads | System validates input completeness |

---

## Failure mode severity matrix

| Failure Mode | Severity | Auto-Action | Human Review |
|-------------|----------|-------------|--------------|
| OCR low confidence | Warning | Request clarification | Optional |
| Missing signature | Error | Request resubmission | Required |
| Arithmetic mismatch | Error | Request correction | Required |
| Stale corpus | Warning | Alert + continue | Monitor |
| Retrieval conflict | Warning | Escalate to human | Required |
| Model disagreement | Warning | Escalate to human | Required |
| Missing attachment | Error | Request upload | Required |

---

## Related documentation

- [Evaluation Strategy](./evaluation-strategy.md) - Testing framework
- [Quality Bar](./quality-bar.md) - Acceptance criteria
- [Release Gates](./release-gates.md) - CI quality checks

---

*Last updated: January 2024*
