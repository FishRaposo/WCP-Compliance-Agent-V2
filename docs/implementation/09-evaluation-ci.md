# Evaluation: CI-Based Frameworks & Regression Detection

Status Label: Designed / Target

Truth anchors:

- [`./INDEX.md`](./INDEX.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)
- [`../evaluation/evaluation-strategy.md`](../evaluation/evaluation-strategy.md)
- [`../evaluation/release-gates.md`](../evaluation/release-gates.md)

## Role in the System

CI-based evaluation ensures every code change, prompt update, or retrieval configuration change is validated before reaching production. It provides automated regression detection, quality benchmarking, and release gating—turning evaluation from a manual process into an engineering requirement.

## WCP Domain Mapping

| Revenue Intelligence Concept | WCP Compliance Equivalent |
|---|---|
| Call transcript QA | WCP submission validation accuracy |
| Rep response scoring | Decision finding accuracy scoring |
| Deal prediction accuracy | Wage violation prediction accuracy |
| Topic coverage | Citation coverage and accuracy |

## Architecture

```mermaid
flowchart TB
    subgraph Trigger["CI Trigger"]
        PR[Pull Request]
        Push[Merge to Main]
        Manual[Manual Trigger]
    end

    subgraph Dataset["Evaluation Dataset"]
        Golden[Golden Submissions]
        Labels[Expert Labels]
        Baseline[Baseline Results]
    end

    subgraph Execution["Test Execution"]
        Parallel[Parallel Workers]
        NewCode[New Code Path]
        BaselineCode[Baseline Code]
    end

    subgraph Metrics["Metrics & Scoring"]
        Accuracy[Factual Accuracy]
        Citation[Citation Quality]
        Calibration[Calibration]
        Latency[Latency]
        Cost[Cost]
    end

    subgraph Gates["Release Gates"]
        Regression[Regression Detection]
        Threshold[Quality Thresholds]
        Decision[Pass/Fail]
    end

    subgraph Reporting["Reporting"]
        PRComment[PR Comment]
        Dashboard[Eval Dashboard]
        Alert[Alert on Failure]
    end

    Trigger --> Execution
    Dataset --> Execution
    Execution --> Metrics --> Gates
    Gates --> Reporting
```

## Evaluation Dataset Schema

```typescript
// src/evaluation/dataset.ts

import { z } from 'zod';

/**
 * Single evaluation case
 */
export const EvalCaseSchema = z.object({
  caseId: z.string(),
  
  // Input
  submission: z.object({
    id: z.string(),
    rawData: z.unknown(), // Full submission payload
    type: z.enum(['weekly', 'monthly', 'final', 'amendment']),
    expectedTrades: z.array(z.string()).optional(),
    expectedLocality: z.string().optional(),
  }),
  
  // Expected outputs (ground truth)
  expected: z.object({
    outcome: z.enum(['approved', 'rejected', 'deferred']),
    findings: z.array(z.object({
      type: z.string(),
      severity: z.enum(['critical', 'warning', 'info']),
      description: z.string(),
      affectedWorkers: z.array(z.string()).optional(),
    })),
    requiredCitations: z.array(z.string()).optional(), // Document IDs that should be cited
    confidence: z.number().min(0).max(1).optional(),
  }),
  
  // Metadata
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  category: z.enum([
    'arithmetic_error',
    'missing_classification',
    'underpayment',
    'overtime_violation',
    'complete_and_correct',
    'edge_case',
  ]),
  addedBy: z.string(),
  addedAt: z.date(),
  
  // Versioning
  goldenVersion: z.string().default('v1'),
  reviewStatus: z.enum(['pending', 'approved', 'disputed']).default('approved'),
});

export type EvalCase = z.infer<typeof EvalCaseSchema>;

/**
 * Evaluation dataset
 */
export const EvalDatasetSchema = z.object({
  datasetId: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  cases: z.array(EvalCaseSchema),
  
  // Dataset splits
  splits: z.object({
    train: z.array(z.string()), // caseIds
    validation: z.array(z.string()),
    test: z.array(z.string()),
  }),
  
  // Statistics
  stats: z.object({
    totalCases: z.number().int(),
    byOutcome: z.record(z.number().int()),
    byCategory: z.record(z.number().int()),
    byDifficulty: z.record(z.number().int()),
  }),
});

export type EvalDataset = z.infer<typeof EvalDatasetSchema>;

/**
 * Evaluation result for a single case
 */
export const EvalResultSchema = z.object({
  caseId: z.string(),
  runId: z.string(),
  
  // Timing
  startTime: z.date(),
  endTime: z.date(),
  durationMs: z.number().int(),
  
  // Actual output
  actual: z.object({
    outcome: z.enum(['approved', 'rejected', 'deferred']),
    findings: z.array(z.object({
      type: z.string(),
      severity: z.enum(['critical', 'warning', 'info']),
      description: z.string(),
    })),
    citations: z.array(z.string()),
    confidence: z.number(),
    rawOutput: z.string().optional(),
  }),
  
  // Scores
  scores: z.object({
    outcomeAccuracy: z.number().min(0).max(1),
    findingPrecision: z.number().min(0).max(1),
    findingRecall: z.number().min(0).max(1),
    findingF1: z.number().min(0).max(1),
    citationPrecision: z.number().min(0).max(1),
    citationRecall: z.number().min(0).max(1),
    citationCoverage: z.number().min(0).max(1),
    confidenceCalibration: z.number().min(0).max(1),
    latencyMs: z.number().int(),
    costUsd: z.number(),
  }),
  
  // Comparison to expected
  match: z.object({
    outcomeCorrect: z.boolean(),
    criticalFindingsCorrect: z.boolean(),
    allFindingsCorrect: z.boolean(),
    citationsAdequate: z.boolean(),
  }),
  
  // Error details
  errors: z.array(z.object({
    type: z.string(),
    message: z.string(),
    expected: z.unknown(),
    actual: z.unknown(),
  })).optional(),
});

export type EvalResult = z.infer<typeof EvalResultSchema>;

/**
 * Full evaluation run results
 */
export const EvalRunSchema = z.object({
  runId: z.string(),
  datasetId: z.string(),
  datasetVersion: z.string(),
  
  // What was tested
  codeVersion: z.string(), // git commit hash
  promptVersion: z.string().optional(),
  corpusVersion: z.string().optional(),
  config: z.record(z.unknown()),
  
  // Timing
  startedAt: z.date(),
  completedAt: z.date(),
  
  // Results
  results: z.array(EvalResultSchema),
  
  // Aggregates
  aggregate: z.object({
    totalCases: z.number().int(),
    passedCases: z.number().int(),
    failedCases: z.number().int(),
    
    meanScores: z.object({
      outcomeAccuracy: z.number(),
      findingF1: z.number(),
      citationCoverage: z.number(),
      confidenceCalibration: z.number(),
    }),
    
    latency: z.object({
      mean: z.number(),
      p50: z.number(),
      p95: z.number(),
      p99: z.number(),
    }),
    
    cost: z.object({
      totalUsd: z.number(),
      meanPerCase: z.number(),
    }),
  }),
  
  // Comparison to baseline
  baselineComparison: z.object({
    baselineRunId: z.string(),
    regressionDetected: z.boolean(),
    improvements: z.array(z.string()),
    regressions: z.array(z.string()),
  }).optional(),
  
  // Gate result
  gateResult: z.object({
    passed: z.boolean(),
    reason: z.string().optional(),
    failedChecks: z.array(z.string()),
  }),
});

export type EvalRun = z.infer<typeof EvalRunSchema>;
```

## Scoring Rubrics

```typescript
// src/evaluation/scoring.ts

import { EvalCase, EvalResult } from './dataset';

export interface ScoringFunction {
  name: string;
  description: string;
  calculate(expected: EvalCase['expected'], actual: EvalResult['actual']): number;
}

/**
 * Outcome accuracy: exact match
 */
export const outcomeAccuracyScorer: ScoringFunction = {
  name: 'outcome_accuracy',
  description: 'Exact match on decision outcome (approved/rejected/deferred)',
  calculate(expected, actual) {
    return expected.outcome === actual.outcome ? 1.0 : 0.0;
  },
};

/**
 * Finding F1: balance of precision and recall
 */
export const findingF1Scorer: ScoringFunction = {
  name: 'finding_f1',
  description: 'F1 score for findings (considers type and severity)',
  calculate(expected, actual) {
    // Normalize findings to comparable format
    const normalizeFinding = (f: { type: string; severity: string }) => 
      `${f.type}:${f.severity}`;
    
    const expectedSet = new Set(expected.findings.map(normalizeFinding));
    const actualSet = new Set(actual.findings.map(normalizeFinding));
    
    // Calculate intersection
    const intersection = new Set(
      [...expectedSet].filter(x => actualSet.has(x))
    );
    
    const precision = actualSet.size > 0 
      ? intersection.size / actualSet.size 
      : 0;
    const recall = expectedSet.size > 0 
      ? intersection.size / expectedSet.size 
      : 1; // If no expected findings, recall is 1 if we found nothing
    
    if (precision + recall === 0) return 0;
    return (2 * precision * recall) / (precision + recall);
  },
};

/**
 * Critical findings: all critical expected must be found
 */
export const criticalFindingScorer: ScoringFunction = {
  name: 'critical_findings',
  description: 'All critical severity findings must be detected',
  calculate(expected, actual) {
    const expectedCritical = new Set(
      expected.findings
        .filter(f => f.severity === 'critical')
        .map(f => f.type)
    );
    
    const actualCritical = new Set(
      actual.findings
        .filter(f => f.severity === 'critical')
        .map(f => f.type)
    );
    
    // All expected critical must be in actual
    for (const critical of expectedCritical) {
      if (!actualCritical.has(critical)) {
        return 0.0; // Missing critical finding is a complete failure
      }
    }
    
    return 1.0;
  },
};

/**
 * Citation coverage: did we cite the required documents?
 */
export const citationCoverageScorer: ScoringFunction = {
  name: 'citation_coverage',
  description: 'Percentage of required citations that were actually cited',
  calculate(expected, actual) {
    if (!expected.requiredCitations || expected.requiredCitations.length === 0) {
      return 1.0; // No requirements = automatic pass
    }
    
    const citedSet = new Set(actual.citations);
    const found = expected.requiredCitations.filter(c => citedSet.has(c));
    
    return found.length / expected.requiredCitations.length;
  },
};

/**
 * Citation precision: did we cite documents that are actually relevant?
 */
export const citationPrecisionScorer: ScoringFunction = {
  name: 'citation_precision',
  description: 'Percentage of citations that were in the required set',
  calculate(expected, actual) {
    if (actual.citations.length === 0) {
      return expected.requiredCitations?.length === 0 ? 1.0 : 0.0;
    }
    
    if (!expected.requiredCitations) {
      // No requirements - assume all citations are valid
      return 1.0;
    }
    
    const requiredSet = new Set(expected.requiredCitations);
    const relevant = actual.citations.filter(c => requiredSet.has(c));
    
    return relevant.length / actual.citations.length;
  },
};

/**
 * Confidence calibration: are confidence scores accurate?
 */
export const confidenceCalibrationScorer: ScoringFunction = {
  name: 'confidence_calibration',
  description: 'Confidence score should correlate with accuracy',
  calculate(expected, actual) {
    // Simple calibration: high confidence when correct, low when wrong
    const outcomeCorrect = expected.outcome === actual.outcome;
    
    if (outcomeCorrect) {
      // Should have high confidence when correct
      return actual.confidence;
    } else {
      // Should have low confidence when wrong
      return 1.0 - actual.confidence;
    }
  },
};

/**
 * Full scoring pipeline
 */
export function scoreResult(
  evalCase: EvalCase,
  actual: EvalResult['actual'],
  latencyMs: number,
  costUsd: number
): EvalResult['scores'] {
  const expected = evalCase.expected;
  
  return {
    outcomeAccuracy: outcomeAccuracyScorer.calculate(expected, actual),
    findingPrecision: findingF1Scorer.calculate(expected, actual), // Simplified
    findingRecall: findingF1Scorer.calculate(expected, actual), // Simplified
    findingF1: findingF1Scorer.calculate(expected, actual),
    citationPrecision: citationPrecisionScorer.calculate(expected, actual),
    citationRecall: citationCoverageScorer.calculate(expected, actual),
    citationCoverage: citationCoverageScorer.calculate(expected, actual),
    confidenceCalibration: confidenceCalibrationScorer.calculate(expected, actual),
    latencyMs,
    costUsd,
  };
}
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/evaluation.yml

name: Evaluation

on:
  pull_request:
    branches: [main]
    paths:
      - 'src/**'
      - 'docs/prompts/**'
      - '.github/workflows/evaluation.yml'
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      dataset:
        description: 'Dataset to use'
        default: 'wcp-golden'
      full:
        description: 'Run full evaluation (not just smoke test)'
        type: boolean
        default: false

jobs:
  evaluate:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: wcp_test
        ports:
          - 5432:5432
      redis:
        image: redis:7
        ports:
          - 6379:6379
      elasticsearch:
        image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
        env:
          discovery.type: single-node
          xpack.security.enabled: false
        ports:
          - 9200:9200
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Setup test database
        run: |
          npx ts-node scripts/setup-test-db.ts
      
      - name: Run evaluation
        id: eval
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/wcp_test
          REDIS_URL: redis://localhost:6379
          ELASTICSEARCH_NODE: http://localhost:9200
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          DATASET: ${{ github.event.inputs.dataset || 'wcp-golden' }}
          FULL_EVAL: ${{ github.event.inputs.full || 'false' }}
        run: |
          npm run eval:ci -- --dataset=$DATASET --full=$FULL_EVAL --output=eval-results.json
      
      - name: Check gates
        id: gates
        run: |
          npx ts-node scripts/check-eval-gates.ts eval-results.json
      
      - name: Compare to baseline
        run: |
          npx ts-node scripts/compare-to-baseline.ts eval-results.json
      
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: eval-results
          path: eval-results.json
      
      - name: PR comment
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('eval-results.json', 'utf8'));
            
            const body = `## Evaluation Results
            
            | Metric | Score | Threshold | Status |
            |--------|-------|-----------|--------|
            | Outcome Accuracy | ${(results.aggregate.meanScores.outcomeAccuracy * 100).toFixed(1)}% | 90% | ${results.aggregate.meanScores.outcomeAccuracy >= 0.9 ? '✅' : '❌'} |
            | Finding F1 | ${(results.aggregate.meanScores.findingF1 * 100).toFixed(1)}% | 85% | ${results.aggregate.meanScores.findingF1 >= 0.85 ? '✅' : '❌'} |
            | Citation Coverage | ${(results.aggregate.meanScores.citationCoverage * 100).toFixed(1)}% | 80% | ${results.aggregate.meanScores.citationCoverage >= 0.8 ? '✅' : '❌'} |
            | P95 Latency | ${results.aggregate.latency.p95}ms | 2000ms | ${results.aggregate.latency.p95 <= 2000 ? '✅' : '❌'} |
            | Total Cost | $${results.aggregate.cost.totalUsd.toFixed(2)} | - | - |
            
            ${results.gateResult.passed ? '✅ **All gates passed**' : '❌ **Gates failed**: ' + results.gateResult.failedChecks.join(', ')}
            
            <details>
            <summary>Full Results</summary>
            
            \`\`\`json
            ${JSON.stringify(results.aggregate, null, 2)}
            \`\`\`
            </details>
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
```

## Gate Configuration

```typescript
// src/evaluation/gates.ts

import { EvalRun } from './dataset';

export interface QualityGate {
  name: string;
  description: string;
  check(run: EvalRun): { passed: boolean; reason?: string };
}

export const defaultGates: QualityGate[] = [
  {
    name: 'outcome_accuracy',
    description: 'Outcome accuracy must be >= 90%',
    check(run) {
      const score = run.aggregate.meanScores.outcomeAccuracy;
      const threshold = 0.9;
      return {
        passed: score >= threshold,
        reason: score >= threshold ? undefined : `Score ${score.toFixed(3)} < ${threshold}`,
      };
    },
  },
  {
    name: 'finding_f1',
    description: 'Finding F1 score must be >= 85%',
    check(run) {
      const score = run.aggregate.meanScores.findingF1;
      const threshold = 0.85;
      return {
        passed: score >= threshold,
        reason: score >= threshold ? undefined : `Score ${score.toFixed(3)} < ${threshold}`,
      };
    },
  },
  {
    name: 'critical_findings',
    description: 'All critical findings must be detected',
    check(run) {
      // Check individual cases for critical finding misses
      const criticalMisses = run.results.filter(r => {
        const expectedCritical = r.expected?.findings?.filter(
          f => f.severity === 'critical'
        ) || [];
        const actualCritical = r.actual?.findings?.filter(
          f => f.severity === 'critical'
        ) || [];
        
        // Check if any expected critical is missing
        return expectedCritical.some(ef => 
          !actualCritical.some(af => af.type === ef.type)
        );
      });
      
      return {
        passed: criticalMisses.length === 0,
        reason: criticalMisses.length > 0 
          ? `${criticalMisses.length} cases missed critical findings` 
          : undefined,
      };
    },
  },
  {
    name: 'latency_p95',
    description: 'P95 latency must be <= 2000ms',
    check(run) {
      const p95 = run.aggregate.latency.p95;
      const threshold = 2000;
      return {
        passed: p95 <= threshold,
        reason: p95 <= threshold ? undefined : `P95 ${p95}ms > ${threshold}ms`,
      };
    },
  },
  {
    name: 'cost_budget',
    description: 'Mean cost per case must be <= $0.50',
    check(run) {
      const meanCost = run.aggregate.cost.meanPerCase;
      const threshold = 0.50;
      return {
        passed: meanCost <= threshold,
        reason: meanCost <= threshold ? undefined : `Cost $${meanCost.toFixed(4)} > $${threshold}`,
      };
    },
  },
  {
    name: 'no_regression',
    description: 'No regression vs baseline',
    check(run) {
      if (!run.baselineComparison) {
        return { passed: true }; // No baseline to compare
      }
      
      return {
        passed: !run.baselineComparison.regressionDetected,
        reason: run.baselineComparison.regressionDetected
          ? `Regressions: ${run.baselineComparison.regressions.join(', ')}`
          : undefined,
      };
    },
  },
];

export function checkGates(run: EvalRun, gates: QualityGate[] = defaultGates): {
  passed: boolean;
  failedChecks: string[];
  reason?: string;
} {
  const results = gates.map(g => ({ name: g.name, ...g.check(run) }));
  const failed = results.filter(r => !r.passed);
  
  return {
    passed: failed.length === 0,
    failedChecks: failed.map(f => f.name),
    reason: failed.length > 0 
      ? failed.map(f => `${f.name}: ${f.reason}`).join('; ')
      : undefined,
  };
}
```

## Regression Detection

```typescript
// src/evaluation/regression.ts

import { EvalRun } from './dataset';

export interface RegressionReport {
  detected: boolean;
  regressions: string[];
  improvements: string[];
  details: Array<{
    metric: string;
    baseline: number;
    current: number;
    delta: number;
    deltaPercent: number;
    significant: boolean;
  }>;
}

export function detectRegression(
  current: EvalRun,
  baseline: EvalRun,
  thresholds: {
    absoluteDelta: number; // e.g., 0.05 (5 percentage points)
    relativeDelta: number; // e.g., 0.10 (10% relative change)
  } = { absoluteDelta: 0.05, relativeDelta: 0.10 }
): RegressionReport {
  const metrics = [
    { name: 'outcome_accuracy', current: current.aggregate.meanScores.outcomeAccuracy, baseline: baseline.aggregate.meanScores.outcomeAccuracy },
    { name: 'finding_f1', current: current.aggregate.meanScores.findingF1, baseline: baseline.aggregate.meanScores.findingF1 },
    { name: 'citation_coverage', current: current.aggregate.meanScores.citationCoverage, baseline: baseline.aggregate.meanScores.citationCoverage },
    { name: 'latency_p95', current: current.aggregate.latency.p95, baseline: baseline.aggregate.latency.p95 },
  ];
  
  const regressions: string[] = [];
  const improvements: string[] = [];
  const details = metrics.map(m => {
    const delta = m.current - m.baseline;
    const deltaPercent = m.baseline !== 0 ? delta / m.baseline : 0;
    
    // For latency, lower is better (invert logic)
    const isBetter = m.name === 'latency_p95' ? delta < 0 : delta > 0;
    const isSignificant = Math.abs(delta) >= thresholds.absoluteDelta || 
                          Math.abs(deltaPercent) >= thresholds.relativeDelta;
    
    if (isSignificant) {
      if (isBetter) {
        improvements.push(`${m.name}: ${(deltaPercent * 100).toFixed(1)}% improvement`);
      } else {
        regressions.push(`${m.name}: ${(deltaPercent * 100).toFixed(1)}% regression`);
      }
    }
    
    return {
      metric: m.name,
      baseline: m.baseline,
      current: m.current,
      delta,
      deltaPercent,
      significant: isSignificant,
    };
  });
  
  return {
    detected: regressions.length > 0,
    regressions,
    improvements,
    details,
  };
}
```

## Running Evaluations

```bash
# Run full evaluation
npm run eval -- --dataset=wcp-golden --output=results.json

# Run smoke test (fast subset)
npm run eval:smoke

# Run with specific code version
npm run eval -- --dataset=wcp-golden --code-version=abc123

# Compare to baseline
npm run eval:compare -- --current=results-new.json --baseline=results-main.json

# Check gates
npm run eval:gates -- --results=results.json
```

## Integration Points

| Existing File | Integration |
|---|---|
| `.github/workflows/evaluation.yml` | CI workflow definition |
| `src/evaluation/` | New directory with all eval code |
| `src/mastra/agents/wcp-agent.ts` | Agent instrumented for eval recording |
| `datasets/` | Golden dataset storage (JSON or DB) |

## Trade-offs

| Decision | Rationale |
|---|---|
| **Full eval on every PR vs smoke test** | Smoke test (10 cases) on PR, full eval (100+ cases) on main merge. Balance of speed vs coverage. |
| **Stored results vs recalc baseline** | Store baseline results, compare directly. Faster than re-running baseline. |
| **Automatic gate failure vs manual review** | Automatic for clear regressions, manual review required for edge cases. Configurable per gate. |
| **Synthetic vs real submissions** | Synthetic for initial testing, graduate to anonymized real submissions for production eval. |

## Implementation Phasing

### Phase 1: Dataset & Scoring
- Define dataset format
- Build 20-50 initial test cases
- Implement scoring functions

### Phase 2: Execution Framework
- Eval runner with parallel execution
- Result recording and aggregation
- Gate checking

### Phase 3: CI Integration
- GitHub Actions workflow
- PR commenting
- Baseline comparison

### Phase 4: Advanced Features
- Regression detection
- Cost tracking in eval
- Performance profiling
