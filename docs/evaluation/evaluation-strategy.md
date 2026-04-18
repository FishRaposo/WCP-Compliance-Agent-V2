# Evaluation Strategy

Status Label: Designed / Target

How we test the WCP Compliance Agent, from unit tests to production golden sets.

Truth anchors:

- [`../foundation/current-state.md`](../foundation/current-state.md)
- [`../foundation/implemented-vs-target.md`](../foundation/implemented-vs-target.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)

---

## Current state: proof-oriented testing

The current repo has unit and integration tests that validate:

- **Deterministic extraction behavior**: Regex patterns extract correct values
- **Deterministic validation behavior**: Rate comparisons are exact
- **Orchestration seam correctness**: Entrypoint wires components properly

This is a strong starting point for an infra-focused proof artifact, but it is not yet a full evaluation platform.

### Current test example

```typescript
// tests/unit/test_wcp_tools.test.ts
describe('WCP Tools', () => {
  test('should extract WCP data from text', async () => {
    const result = await extractWCPTool.execute({
      payload: 'Role: Electrician, Hours: 45, Wage: 35.50'
    });
    
    expect(result.role).toBe('Electrician');
    expect(result.hours).toBe(45);
    expect(result.wage).toBe(35.50);
  });
  
  test('should validate wage compliance', async () => {
    const result = await validateWCPTool.execute({
      role: 'Electrician',
      hours: 45,
      wage: 35.50
    });
    
    expect(result.status).toBe('VIOLATION');
    expect(result.findings).toHaveLength(2);
    expect(result.findings[0].check).toBe('base_wage');
  });
});
```

---

## Target evaluation strategy

### Golden set

A labeled dataset of at least 100 WCP examples with:

- **Input**: Raw WCP text, PDF, or structured data
- **Expected verdict**: COMPLIANT | VIOLATION | REVISION_NEEDED
- **Expected findings**: Specific violations with codes
- **Expected citations**: DBWD references that should appear
- **Confidence threshold**: Minimum acceptable confidence for auto-approval

### Example golden set entry

```json
{
  "id": "gold-001",
  "name": "electrician_underpayment_overtime",
  "input": {
    "payload": "Role: Electrician, Hours: 45, Wage: 35.50"
  },
  "expected": {
    "status": "VIOLATION",
    "findings": [
      {
        "check": "base_wage",
        "severity": "error",
        "expected": 38.50,
        "actual": 35.50
      },
      {
        "check": "overtime_rate",
        "severity": "critical",
        "expected": 57.75,
        "actual": 35.50
      }
    ],
    "citations": ["DBWD_ELECTRICIAN_LA_2024"],
    "confidence": { "min": 0.95, "max": 1.0 }
  },
  "metadata": {
    "difficulty": "standard",
    "domain": "electrical",
    "locality": "LA",
    "tags": ["overtime", "underpayment"]
  }
}
```

---

## Evaluation dimensions

| Dimension | Metric | Target | Measurement |
|-----------|--------|--------|-------------|
| **Verdict accuracy** | % agreement with labeled set | ≥ 90% | Exact match on status field |
| **False-approve rate** | Violations marked as compliant | < 2% | Critical safety metric |
| **Citation validity** | % of citations that are correct | ≥ 95% | Human review sample |
| **Latency** | P95 response time | < 5s | End-to-end API timing |
| **Schema integrity** | % valid structured outputs | 100% | Zod validation pass rate |
| **Retrieval quality** | MRR @ top-3 | ≥ 0.7 | Manual relevance judgment |

---

## Compliance Testing

**Purpose**: Ensure system correctly enforces Davis-Bacon Act requirements

**Regulatory Basis**: 29 CFR Part 3 (Labor standards enforcement), 40 U.S.C. § 3142 (Prevailing wage)

### Compliance Evaluation Dimensions

| Dimension | Metric | Target | Measurement |
|-----------|--------|--------|-------------|
| **Violation Detection Rate** | % of violations correctly identified | >95% | Golden set labeled violations |
| **False-Approve Rate** | % of violations incorrectly approved | <2% | Critical safety metric |
| **Classification Accuracy** | % of correct worker classifications | >90% | Manual review of classifications |
| **Regulatory Citation Precision** | % of findings with correct citations | 100% | Audit of citation validity |
| **Audit Trail Completeness** | % of decisions with full trace | 100% | Automated trace validation |
| **Replay Accuracy** | % of decisions replaying identically | 100% | Version-locked replay test |

### Compliance Test Surfaces

1. **Deterministic Validation Rules**
   - Prevailing wage validation (40 U.S.C. § 3142)
   - Overtime calculation (40 U.S.C. § 3702)
   - Fringe benefit compliance (29 CFR 5.22)
   - Classification resolution (29 CFR 5.5)

2. **Classification Resolution**
   - Exact match validation
   - Alias resolution accuracy
   - Confidence threshold calibration
   - Human escalation triggers

3. **Overtime Calculations**
   - 40-hour threshold detection
   - 1.5× base rate calculation
   - Fringe exclusion from multiplier
   - Same-rate-for-all-hours error detection

4. **Audit Trail Completeness**
   - Trace ID generation
   - Decision immutability
   - Replay capability
   - 7-year retention compliance

### Compliance Golden Set Examples

```typescript
{
  id: "compliance-001",
  input: { role: "Electrician", hours: 40, wage: 35.50 },
  expected: {
    status: "VIOLATION",
    findings: [{
      check: "base_wage",
      regulation: "40 U.S.C. § 3142(a)",
      expected: 38.50,
      actual: 35.50,
      shortfall: 3.00
    }],
    citations: ["40 U.S.C. § 3142(a)"]
  }
}
```

### Compliance Testing Commands

```bash
# Run compliance-specific tests
npm run test:calibration        # Golden set evaluation
npm run test:pipeline           # Unit + integration tests
npm run lint:pipeline           # Architecture compliance

# Generate compliance report
npm run report:compliance       # Full compliance metrics
```

---

## Evaluation surfaces

### 1. Deterministic rule tests

```typescript
// tests/deterministic/rules.test.ts
describe('Deterministic Rules', () => {
  test.each([
    { role: 'Electrician', wage: 38.50, expected: 'COMPLIANT' },
    { role: 'Electrician', wage: 35.50, expected: 'VIOLATION' },
    { role: 'Laborer', wage: 28.50, expected: 'COMPLIANT' },
    { role: 'Laborer', wage: 27.00, expected: 'VIOLATION' },
  ])('$role at $wage → $expected', ({ role, wage, expected }) => {
    const result = validateRate(role, wage, 'LA');
    expect(result.status).toBe(expected);
  });
});
```

### 2. Retrieval evaluation

```typescript
// tests/evaluation/retrieval.test.ts
describe('Retrieval Quality', () => {
  const retrievalCases = [
    {
      query: "Electrician rates Los Angeles",
      expectedDocs: ["DBWD_ELECTRICIAN_LA_2024"],
      minRank: 1
    },
    {
      query: "Wireman prevailing wage", // Synonym test
      expectedDocs: ["DBWD_ELECTRICIAN_LA_2024"],
      minRank: 3
    }
  ];
  
  test.each(retrievalCases)('retrieves $expectedDocs', async (testCase) => {
    const results = await retriever.retrieve(testCase.query);
    const ranks = testCase.expectedDocs.map(doc => 
      results.findIndex(r => r.docId === doc)
    );
    expect(Math.min(...ranks)).toBeLessThanOrEqual(testCase.minRank);
  });
});
```

### 3. Decision output evaluation

```typescript
// tests/evaluation/decisions.test.ts
describe('Decision Quality', () => {
  test('explanation matches findings', async () => {
    const result = await analyzeWCP({
      payload: "Role: Electrician, Hours: 45, Wage: 35.50"
    });
    
    // Explanation should mention specific numbers
    expect(result.explanation).toContain('35.50');
    expect(result.explanation).toContain('38.50');
    
    // Confidence should reflect finding severity
    expect(result.confidence).toBeLessThan(1.0);
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});
```

### 4. Adversarial cases

```typescript
// tests/evaluation/adversarial.test.ts
describe('Adversarial Handling', () => {
  test('handles malformed input gracefully', async () => {
    const result = await analyzeWCP({
      payload: "Role: UnknownJob, Hours: abc, Wage: xyz"
    });
    
    expect(result.status).toBe('REVISION_NEEDED');
    expect(result.findings).toContainEqual(
      expect.objectContaining({ check: 'parse_error' })
    );
  });
  
  test('handles edge case: exactly 40 hours', async () => {
    const result = await analyzeWCP({
      payload: "Role: Electrician, Hours: 40, Wage: 38.50"
    });
    
    // 40 hours = no overtime, should be compliant
    expect(result.status).toBe('COMPLIANT');
    expect(result.findings).not.toContainEqual(
      expect.objectContaining({ check: 'overtime_hours' })
    );
  });
});
```

### 5. Regression runs

```yaml
# .github/workflows/evaluation.yml
name: Evaluation Gates

on:
  pull_request:
    paths:
      - 'src/**'
      - 'prompts/**'
      - 'corpus/**'

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run golden set
        run: npm run test:golden
        
      - name: Check quality gates
        run: |
          # Verdict accuracy ≥ 90%
          # False-approve rate < 2%
          # Citation validity ≥ 95%
          npm run test:gates
```

---

## CI evaluation workflow

```yaml
# .github/workflows/ci-evaluation.yml
name: CI Evaluation

on: [pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:unit

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:integration

  golden-set:
    runs-on: ubuntu-latest
    env:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:golden
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: golden-set-results
          path: ./eval-results.json

  quality-gates:
    needs: golden-set
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Download results
        uses: actions/download-artifact@v3
        with:
          name: golden-set-results
      - name: Check gates
        run: |
          node scripts/check-gates.js \
            --accuracy 0.90 \
            --false-approve 0.02 \
            --citations 0.95
```

---

## Evaluation tooling

### Test runner

```bash
# Run all tests
npm test

# Run specific suites
npm run test:unit          # Deterministic logic
npm run test:integration   # API endpoints
npm run test:golden        # Golden set validation
npm run test:adversarial   # Edge cases
npm run test:retrieval     # Search quality

# Run with coverage
npm run test:coverage

# Run in CI mode (stricter)
MOCK_MODE=true npm test
```

### Golden set management

```bash
# Add new golden case
npm run golden:add -- --name="new_case" --input="..." --expected="..."

# Run golden set and update baselines
npm run golden:run -- --update

# Compare against baseline
npm run golden:diff
```

---

## Design principle

> **Evals are not a report card after launch. They are part of the deployment contract.**

Every code change that affects:
- Extraction logic
- Validation rules
- Prompt templates
- Retrieval configuration
- Model selection

Must pass the evaluation gates before merging.

---

## How to add a new test case

1. **Identify the scenario**: What edge case or failure mode?

2. **Create the input**: Raw text, PDF, or structured data

3. **Define expected output**: Verdict, findings, citations

4. **Add to appropriate suite**:
   - `tests/unit/` - Deterministic logic
   - `tests/integration/` - API flows
   - `tests/golden/` - Labeled dataset
   - `tests/adversarial/` - Edge cases

5. **Run the test**: `npm test -- tests/golden/my-case.test.ts`

6. **Document the case**: Add to this doc with rationale

---

## Target evaluation metrics (production)

| Metric | Current | 6-Month Target | 12-Month Target |
|--------|---------|----------------|-----------------|
| Verdict accuracy | N/A (no golden set) | 85% | 90%+ |
| False-approve rate | N/A | < 5% | < 2% |
| Citation validity | N/A | 90% | 95%+ |
| Avg latency | 245ms | < 2s | < 1s |
| Cost per decision | $0.001 | $0.005 | $0.003 |
| Test coverage | 60% | 80% | 85%+ |

---

## Related documentation

- [Quality Bar](./quality-bar.md) - Production acceptance criteria
- [Release Gates](./release-gates.md) - CI/CD quality checks
- [Adversarial Cases](./adversarial-cases.md) - Edge case testing
- [Implementation: Evaluation Framework](../implementation/10-ci-evaluation.md)

---

*Last updated: January 2024*
