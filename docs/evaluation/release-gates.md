# Release Gates

Status Label: Planned / Future

Quality checks that must pass before code changes can be merged or deployed.

Truth anchors:

- [`../foundation/current-state.md`](../foundation/current-state.md)
- [`../foundation/implemented-vs-target.md`](../foundation/implemented-vs-target.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)

---

## Why release gates matter

Release gates prevent:
- Quality regressions from reaching production
- Silent failures in critical paths
- Undetected prompt/retrieval/model drift
- Broken deployments without rollback plans

**Principle**: *Quality is checked automatically, not assumed.*

---

## Gate categories

### 1. Prompt or model change gates

Triggered when:
- `prompts/**/*.md` modified
- Model version configuration changed
- Agent orchestration logic updated

**Required checks**:

```yaml
schema_output_pass_rate:
  description: "LLM outputs must match Zod schema"
  threshold: ">= 0.99"
  test: "npm run test:schema-validation"

false_approve_rate:
  description: "Safety: violations must not be approved"
  threshold: "< 0.02"
  test: "npm run test:false-approve-gate"

latency_regression:
  description: "No significant latency increase"
  threshold: "< 1.2x baseline"
  test: "npm run test:latency-regression"

citation_validity:
  description: "Citations must remain accurate"
  threshold: ">= 0.95"
  test: "npm run test:citations"
```

**Example CI configuration**:

```yaml
# .github/workflows/prompt-change-gate.yml
name: Prompt Change Gate

on:
  pull_request:
    paths:
      - 'prompts/**'
      - 'src/mastra/agents/**'
      - 'config/model-version.yaml'

jobs:
  schema-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:golden
      - name: Check schema pass rate
        run: |
          PASS_RATE=$(cat eval-results.json | jq '.schemaPassRate')
          if (( $(echo "$PASS_RATE < 0.99" | bc -l) )); then
            echo "Schema pass rate $PASS_RATE below threshold 0.99"
            exit 1
          fi

  safety-gate:
    needs: schema-gate
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:false-approve
      - name: Check false-approve rate
        run: |
          FAR=$(cat eval-results.json | jq '.falseApproveRate')
          if (( $(echo "$FAR >= 0.02" | bc -l) )); then
            echo "False-approve rate $FAR exceeds threshold 0.02"
            exit 1
          fi
```

---

### 2. Retrieval change gates

Triggered when:
- `corpus/` files modified
- Retrieval configuration updated
- Embedding model changed
- Reranking logic updated

**Required checks**:

```yaml
retrieval_quality:
  description: "Retrieval quality on golden set"
  threshold: "MRR >= 0.70 or no degradation"
  test: "npm run test:retrieval-quality"

synonym_handling:
  description: "Job title synonyms still resolve"
  threshold: ">= 0.90 accuracy"
  test: "npm run test:synonyms"

ambiguous_cases:
  description: "Ambiguous queries handled properly"
  threshold: "escalation rate stable"
  test: "npm run test:ambiguous"

corpus_versioning:
  description: "Corpus versions trackable"
  threshold: "100% traceable"
  test: "npm run test:corpus-versions"
```

**Example test**:

```typescript
// tests/gates/retrieval.test.ts
describe('Retrieval Change Gate', () => {
  test('retrieval quality holds on golden set', async () => {
    const results = await evaluateRetrieval(goldenSet);
    const mrr = calculateMRR(results);
    
    expect(mrr).toBeGreaterThanOrEqual(0.70);
  });
  
  test('no degradation on synonym cases', async () => {
    const baseline = await loadBaseline('synonym-accuracy');
    const current = await evaluateSynonyms();
    
    // Allow 5% degradation max
    expect(current.accuracy).toBeGreaterThanOrEqual(
      baseline.accuracy * 0.95
    );
  });
});
```

---

### 3. Rule change gates

Triggered when:
- `src/mastra/tools/wcp-tools.ts` modified
- Rate tables updated
- Validation logic changed

**Required checks**:

```yaml
deterministic_tests:
  description: "All deterministic tests pass"
  threshold: "100%"
  test: "npm run test:unit"

severity_logic:
  description: "Severity assignments unchanged"
  threshold: "no drift"
  test: "npm run test:severity-drift"

replay_validation:
  description: "Sample decisions replay correctly"
  threshold: ">= 0.95 match"
  test: "npm run test:replay"
```

**Example replay test**:

```typescript
// tests/gates/replay.test.ts
describe('Rule Change Gate', () => {
  test('sample decisions replay correctly', async () => {
    // Load 50 recent production decisions
    const sample = await loadDecisionSample(50);
    
    for (const decision of sample) {
      // Replay with new code
      const replayed = await replayDecision(decision.traceId);
      
      // Should match original (or improve)
      expect(replayed.status).toBe(decision.status);
      expect(replayed.findings).toEqual(decision.findings);
    }
  });
});
```

---

### 5. Pipeline discipline gates

Triggered when:
- `src/pipeline/**/*.ts` modified
- `src/entrypoints/wcp-entrypoint.ts` modified
- `src/types/decision-pipeline.ts` modified

**Required checks**:

```yaml
pipeline_architecture:
  description: "Three-layer architecture enforced"
  threshold: "0 violations"
  test: "npm run lint:pipeline"

pipeline_contracts:
  description: "Type contracts validate correctly"
  threshold: "100% pass"
  test: "npm run test:pipeline-contracts"

trust_calibration:
  description: "Trust scores correlate with accuracy"
  threshold: ">= 95% detection rate, <2% false-approve"
  test: "npm run test:calibration"

integration_coverage:
  description: "End-to-end pipeline scenarios pass"
  threshold: "100% of 6 core scenarios"
  test: "npm run test:pipeline-integration"
```

**Enforcement**:
- AST-based linting prevents direct LLM calls outside Layer 2
- Schema validation ensures TrustScoredDecision is only output type
- Golden set evaluation catches trust score miscalibration
- CI fails if any layer is bypassed

---

### 6. Operational gates

Triggered on every deployment:

**Required checks**:

```yaml
dashboards:
  description: "Monitoring dashboards accessible"
  check: "curl $DASHBOARD_URL/health"
  threshold: "HTTP 200"

alerts:
  description: "Alerting pipelines functional"
  check: "send-test-alert"
  threshold: "delivered within 30s"

cost_thresholds:
  description: "Cost per decision within budget"
  threshold: "< $0.10"
  check: "npm run check:cost"

rollback:
  description: "Rollback path documented and tested"
  check: "kubectl rollout history"
  threshold: "previous revision available"
```

---

## Full CI/CD gate pipeline

```yaml
# .github/workflows/release-gates.yml
name: Release Gates

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # Phase 1: Code quality
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: npm run lint:pipeline

  # Phase 2: Unit tests
  unit-tests:
    needs: lint-and-typecheck
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:unit

  # Phase 3: Integration tests
  integration-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:integration

  # Phase 4: Golden set evaluation
  golden-set:
    needs: integration-tests
    runs-on: ubuntu-latest
    env:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    steps:
      - run: npm run test:golden
      - uses: actions/upload-artifact@v3
        with:
          name: golden-results
          path: eval-results.json

  # Phase 5: Quality gates
  quality-gates:
    needs: golden-set
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: golden-results
      - name: Schema gate
        run: node scripts/check-gate.js --metric=schemaPassRate --min=0.99
      - name: False-approve gate
        run: node scripts/check-gate.js --metric=falseApproveRate --max=0.02
      - name: Accuracy gate
        run: node scripts/check-gate.js --metric=accuracy --min=0.90

  # Phase 6: Staging deployment
  deploy-staging:
    needs: quality-gates
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - run: npm run deploy:staging

  # Phase 7: Smoke tests
  smoke-tests:
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:smoke -- --env=staging

  # Phase 8: Production deployment
  deploy-production:
    needs: smoke-tests
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: npm run deploy:prod
```

---

## Gate failure procedures

### If a gate fails

1. **Block the merge/deploy** - No exceptions for safety gates
2. **Notify the team** - Slack/email alert with details
3. **Preserve artifacts** - Evaluation results, logs, traces
4. **Diagnose** - Identify root cause from logs
5. **Fix or revert** - Either fix the issue or revert the change
6. **Re-run gates** - All gates must pass before proceeding

### Safety gate failures (critical)

If false-approve rate ≥ 2% or schema pass rate < 99%:

```bash
# Immediate actions
echo "CRITICAL: Safety gate failed"
echo "Blocking deployment"
echo "Alerting on-call engineer"
echo "Preserving evaluation artifacts"

# Required before retry
- Root cause analysis documented
- Fix implemented and tested
- Code review from senior engineer
- All gates re-passed
```

### Performance gate failures (warning)

If latency regression > 20% but < 50%:

```bash
# Warning actions
echo "WARNING: Performance regression detected"
echo "Requires explicit approval to proceed"

# Can proceed with approval if:
- Regression is expected (new feature)
- Mitigation plan documented
- Performance follow-up ticket created
```

---

## Gate result artifacts

Every gate run produces:

```
eval-results/
├── timestamp.txt
├── git-commit.txt
├── unit-tests/
│   ├── results.json
│   └── coverage.html
├── golden-set/
│   ├── results.json
│   ├── accuracy-report.md
│   └── false-approve-analysis.md
├── performance/
│   ├── latency-baseline.json
│   ├── latency-current.json
│   └── regression-report.md
└── gates/
    ├── pass-fail.json
    └── decision-log.md
```

---

## Rollback triggers

Auto-rollback if post-deploy monitoring detects:

```yaml
auto_rollback_triggers:
  error_rate_spike:
    threshold: "> 5x baseline for 5 minutes"
    action: "immediate rollback"
    
  latency_spike:
    threshold: "P95 > 10s for 3 minutes"
    action: "immediate rollback"
    
  false_approve_spike:
    threshold: "> 3% in sample of 100 decisions"
    action: "immediate rollback + halt deploys"
    
  schema_failure_spike:
    threshold: "> 1% invalid outputs"
    action: "immediate rollback"
```

---

## Gate check scripts

```javascript
// scripts/check-gate.js
const fs = require('fs');

function checkGate(metric, threshold, comparison) {
  const results = JSON.parse(fs.readFileSync('eval-results.json'));
  const value = results[metric];
  
  let passed;
  if (comparison === 'min') {
    passed = value >= threshold;
  } else if (comparison === 'max') {
    passed = value <= threshold;
  }
  
  console.log(`${metric}: ${value} (threshold: ${comparison} ${threshold})`);
  console.log(`Result: ${passed ? 'PASS' : 'FAIL'}`);
  
  process.exit(passed ? 0 : 1);
}

const [, , metricArg, thresholdArg] = process.argv;
checkGate(metricArg, parseFloat(thresholdArg), 'min');
```

---

## Related documentation

- [Evaluation Strategy](./evaluation-strategy.md) - How we test
- [Quality Bar](./quality-bar.md) - Acceptance criteria
- [Adversarial Cases](./adversarial-cases.md) - Edge case testing
- [Decision Architecture Doctrine](../architecture/decision-architecture.md) - Three-layer pipeline
- [Trust Scoring](../architecture/trust-scoring.md) - Trust score formula and calibration
- [Pipeline Discipline CI](../../.github/workflows/pipeline-discipline.yml) - CI workflow

---

*Last updated: January 2024*
