# Quality Bar

Status Label: Designed / Target

The benchmark that keeps the future system from drifting into vague "good enough" language.

Truth anchors:

- [`../foundation/current-state.md`](../foundation/current-state.md)
- [`../foundation/implemented-vs-target.md`](../foundation/implemented-vs-target.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)

---

## Current bar: proof artifact

Current acceptance criteria for the proof artifact:

| Check | How Measured | Current Status |
|-------|-------------|----------------|
| Build passes | `npm run build` | ✅ Pass |
| Deterministic tests pass | `npm run test:unit` | ✅ Pass |
| Orchestration test passes | `npm run test:integration` | ✅ Pass |
| Documentation honest | Manual review | ✅ All docs have status labels |

This is intentionally minimal. The proof artifact demonstrates the architecture and engineering judgment, not production completeness.

---

## Target production bar

### Accuracy metrics

| Metric | Target | How We Measure | Critical? |
|--------|--------|---------------|-----------|
| **Verdict agreement** | ≥ 90% | % matching human reviewer labels | ✅ Yes |
| **False-approve rate** | < 2% | Violations incorrectly approved / total | ✅ Yes |
| **Citation validity** | ≥ 95% | Citations that are correct / total citations | ✅ Yes |
| **False-reject rate** | < 5% | Compliant cases rejected / total compliant | No |

### Performance metrics

| Metric | Target | Measurement | Critical? |
|--------|--------|-------------|-----------|
| **End-to-end latency P95** | < 5 seconds | Time from API call to response | ✅ Yes |
| **Deterministic layer latency** | < 10ms | Extraction + validation | ✅ Yes |
| **Structured output integrity** | 100% | Valid Zod schema pass rate | ✅ Yes |
| **Retrieval latency P95** | < 500ms | Hybrid search + reranking | No |

### Operational metrics

| Metric | Target | Measurement | Critical? |
|--------|--------|-------------|-----------|
| **Uptime** | 99.9% | API availability | ✅ Yes |
| **Trace completeness** | 100% | Decisions with full trace IDs | ✅ Yes |
| **Cost per decision** | < $0.10 | All-in cost (API, storage, compute) | No |
| **Escalation rate** | < 10% | Low-confidence cases sent to human | No |

### Compliance metrics

| Metric | Target | Critical Threshold | Status |
|--------|--------|-------------------|--------|
| **Violation Detection Rate** | >95% | <90% | 🎯 Target |
| **False-Approve Rate** | <2% | >5% | 🎯 Target |
| **Classification Accuracy** | >90% | <85% | 🎯 Target |
| **Regulatory Citation Rate** | 100% | <95% | 🎯 Target |
| **Audit Replay Success** | 100% | <99% | ✅ Achieved |
| **Decision Traceability** | 100% | <99% | ✅ Achieved |

### Compliance quality gates

| Gate | Check | Failure Action |
|------|-------|----------------|
| Pre-commit | Compliance unit tests pass | Block merge |
| Pre-release | Golden set accuracy ≥ 95% | Block release |
| Post-deploy | Audit trail functional | Rollback |

**Compliance Test Commands:**
```bash
npm run test:calibration        # Golden set evaluation
npm run test:pipeline           # Pipeline discipline tests
npm run lint:pipeline           # Architecture compliance
```

---

## Current vs target comparison

| Metric | Current (Proof) | Target (Production) | Gap |
|--------|-----------------|---------------------|-----|
| Verdict accuracy | N/A (no labeled set) | ≥ 90% | Need golden set |
| False-approve rate | N/A | < 2% | Need adversarial testing |
| Citation validity | N/A | ≥ 95% | Need retrieval pipeline |
| Latency P95 | 245ms | < 5s | ✅ Ahead of target |
| Structured output | 100% (Zod) | 100% | ✅ Met |
| Uptime | N/A (local) | 99.9% | Need infrastructure |
| Trace completeness | 100% | 100% | ✅ Met |
| Cost per decision | $0.001 | < $0.10 | ✅ Well under target |

---

## How we measure

### Verdict agreement

```typescript
// scripts/measure-agreement.ts
async function measureAgreement() {
  const goldenSet = await loadGoldenSet();
  const results = [];
  
  for (const example of goldenSet) {
    const actual = await analyzeWCP(example.input);
    results.push({
      id: example.id,
      expected: example.expected.status,
      actual: actual.status,
      agreed: example.expected.status === actual.status
    });
  }
  
  const agreement = results.filter(r => r.agreed).length / results.length;
  console.log(`Verdict agreement: ${(agreement * 100).toFixed(1)}%`);
  
  return agreement;
}
```

### False-approve rate

```typescript
// scripts/measure-false-approves.ts
function calculateFalseApproveRate(results: EvaluationResult[]) {
  const violations = results.filter(r => r.expected === 'VIOLATION');
  const falseApproves = violations.filter(r => r.actual === 'COMPLIANT');
  
  return falseApproves.length / violations.length;
}

// Target: < 2%
// This is the most dangerous failure mode
```

### Citation validity

```typescript
// scripts/measure-citations.ts
async function measureCitationValidity(sample: Decision[]) {
  // Sample 100 decisions
  // Human review: is each citation correct?
  const reviewed = await humanReview(sample);
  
  const validCitations = reviewed.filter(r => r.citationCorrect).length;
  const totalCitations = reviewed.reduce((sum, r) => sum + r.citations.length, 0);
  
  return validCitations / totalCitations;
}
```

### Latency

```typescript
// Performance monitoring
const start = Date.now();
const result = await analyzeWCP(input);
const latency = Date.now() - start;

// Log for aggregation
logger.info({
  metric: 'latency_ms',
  value: latency,
  endpoint: '/api/analyze',
  traceId: result.trace.requestId
});
```

---

## Quality gates

### Pre-merge gates (CI/CD)

```yaml
# Must pass before merging
- unit_tests_pass: true
- integration_tests_pass: true
- build_succeeds: true
- no_type_errors: true
- lint_passes: true
```

### Pre-release gates (staging)

```yaml
# Must pass before production deploy
- golden_set_accuracy >= 0.90
- false_approve_rate < 0.02
- citation_validity >= 0.95
- latency_p95 < 5000
- no_severity_regressions: true
```

### Production gates (monitoring)

```yaml
# Continuous monitoring
- uptime >= 0.999
- error_rate < 0.001
- latency_p95 < 5000
- cost_per_decision < 0.10
```

---

## How to run quality checks locally

```bash
# Run all quality checks
npm run quality:check

# Run specific checks
npm run quality:accuracy      # Golden set evaluation
npm run quality:performance   # Latency benchmarks
npm run quality:coverage      # Test coverage

# Generate quality report
npm run quality:report > quality-report.md
```

---

## Quality tracking over time

### Dashboard metrics (target)

| Week | Accuracy | False-Approve | Latency P95 | Status |
|------|----------|---------------|-------------|--------|
| W1 | 75% | 8% | 2.1s | 🔴 Below target |
| W2 | 82% | 5% | 1.8s | 🟡 Improving |
| W3 | 88% | 3% | 1.5s | 🟡 Near target |
| W4 | 91% | 1.8% | 1.2s | ✅ Target met |

### Quality regression alerts

```typescript
// Alert if metrics drop
if (current.accuracy < previous.accuracy * 0.95) {
  alert('Accuracy regression detected');
}

if (current.falseApproveRate > 0.02) {
  alert('False-approve rate exceeded threshold');
}
```

---

## Quality bar enforcement

### Code review checklist

- [ ] Does this change affect accuracy? If yes, run golden set
- [ ] Does this change affect latency? If yes, run benchmarks
- [ ] Does this change affect citations? If yes, run validity check
- [ ] Are there new edge cases? Add to adversarial tests
- [ ] Documentation updated with new behavior

### Release decision matrix

| Quality Check | Met | Action |
|---------------|-----|--------|
| Accuracy ≥ 90% | ✅ | Proceed |
| Accuracy ≥ 90% | ❌ | Investigate, fix, re-run |
| False-approve < 2% | ✅ | Proceed |
| False-approve < 2% | ❌ | Block release |
| Latency P95 < 5s | ✅ | Proceed |
| Latency P95 < 5s | ❌ | Degrade gracefully, warn |

---

## What this document is for

This is the **benchmark doc** that:

1. **Prevents drift**: Clear numbers prevent "good enough" creep
2. **Enables comparison**: Current vs target vs competitor benchmarks
3. **Guides priorities**: Metrics below target get attention first
4. **Demonstrates rigor**: Shows production-minded thinking to recruiters

---

## Related documentation

- [Evaluation Strategy](./evaluation-strategy.md) - How we test
- [Release Gates](./release-gates.md) - CI/CD quality checks
- [Adversarial Cases](./adversarial-cases.md) - Edge case quality
- [Implemented vs Target](../foundation/implemented-vs-target.md) - Capability gaps

---

*Last updated: January 2024*
