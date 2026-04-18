# Observability and Operations

Status Label: Designed / Target

How we monitor, debug, and operate the WCP Compliance Agent at scale.

Truth anchors:

- [`../foundation/current-state.md`](../foundation/current-state.md)
- [`../foundation/implemented-vs-target.md`](../foundation/implemented-vs-target.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)

---

## Current state

The current repo exposes a small operational posture through:

- **Health endpoint data**: Basic availability checks
- **Typed errors**: Structured error taxonomy
- **Runtime health metadata**: Latency, model availability
- **Logging dependencies**: Pino for structured logging

### Current observability code

```typescript
// src/entrypoints/wcp-entrypoint.ts
export async function generateWcpDecision(input: WCPInput): Promise<WCPDecision> {
  const traceId = generateTraceId();
  const startTime = Date.now();
  
  try {
    // Extraction
    const extractStart = Date.now();
    const extracted = await extractWCPTool.execute(input);
    logger.info({
      traceId,
      stage: 'extraction',
      duration: Date.now() - extractStart,
      success: true,
    });
    
    // Validation
    const validateStart = Date.now();
    const validation = await validateWCPTool.execute(extracted);
    logger.info({
      traceId,
      stage: 'validation',
      duration: Date.now() - validateStart,
      findingCount: validation.findings.length,
    });
    
    return {
      ...validation,
      trace: {
        requestId: traceId,
        timestamp: new Date().toISOString(),
        totalDuration: Date.now() - startTime,
      },
      health: {
        modelAvailable: true,
        latencyMs: Date.now() - startTime,
      },
    };
    
  } catch (error) {
    const typedError = normalizeError(error);
    logger.error({
      traceId,
      stage: typedError.stage,
      error: typedError.toJSON(),
      duration: Date.now() - startTime,
    });
    throw typedError;
  }
}
```

---

## Target observability model

### Tracing with OpenTelemetry

End-to-end distributed tracing for the entire request lifecycle:

```typescript
// Target implementation (planned)
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('wcp-compliance-agent');

export async function analyzeWCPWithTracing(input: WCPInput): Promise<WCPDecision> {
  return tracer.startActiveSpan('analyze-wcp', async (span) => {
    try {
      span.setAttribute('request.role', input.role);
      span.setAttribute('request.locality', input.locality);
      
      // Extraction span
      const extracted = await tracer.startActiveSpan('extraction', async (extractSpan) => {
        const result = await extractWCPTool.execute(input);
        extractSpan.setAttribute('extracted.role', result.role);
        extractSpan.setAttribute('extracted.hours', result.hours);
        extractSpan.end();
        return result;
      });
      
      // Validation span
      const validation = await tracer.startActiveSpan('validation', async (validateSpan) => {
        const result = await validateWCPTool.execute(extracted);
        validateSpan.setAttribute('validation.findings', result.findings.length);
        validateSpan.setAttribute('validation.status', result.status);
        validateSpan.end();
        return result;
      });
      
      // Retrieval span
      const evidence = await tracer.startActiveSpan('retrieval', async (retrieveSpan) => {
        const result = await retrieveEvidence(extracted);
        retrieveSpan.setAttribute('retrieval.documents', result.length);
        retrieveSpan.setAttribute('retrieval.latency', result.latencyMs);
        retrieveSpan.end();
        return result;
      });
      
      // Decision span
      const decision = await tracer.startActiveSpan('decision', async (decisionSpan) => {
        const result = await generateDecision(validation, evidence);
        decisionSpan.setAttribute('decision.status', result.status);
        decisionSpan.setAttribute('decision.confidence', result.confidence);
        decisionSpan.end();
        return result;
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      
      return decision;
      
    } catch (error) {
      span.recordException(error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error.message 
      });
      span.end();
      throw error;
    }
  });
}
```

### Trace visualization (Phoenix-style)

Target: Web-based trace inspection similar to Phoenix or LangSmith:

```
Trace: trace-abc123
Duration: 1.2s
─────────────────────────────────

analyze-wcp [1.2s]
├─ extraction [45ms]
│  ├─ regex.match_role [2ms]
│  └─ regex.match_hours [1ms]
├─ validation [12ms]
│  ├─ rate.lookup [3ms]
│  └─ arithmetic.check [1ms]
├─ retrieval [650ms]
│  ├─ bm25.search [120ms]
│  ├─ vector.search [280ms]
│  ├─ fusion [5ms]
│  └─ cross_encoder.rerank [240ms]
└─ decision [420ms]
   ├─ prompt.render [5ms]
   ├─ llm.call [400ms]
   └─ schema.validate [15ms]
```

### Metrics collection

```typescript
// Target metrics (planned)
import { metrics, ValueType } from '@opentelemetry/api';

const meter = metrics.getMeter('wcp-compliance-agent');

// Latency histogram
const latencyHistogram = meter.createHistogram('wcp.decision.latency', {
  description: 'End-to-end decision latency',
  unit: 'ms',
  valueType: ValueType.INT,
});

// Counter for verdicts
const verdictCounter = meter.createCounter('wcp.decision.verdicts', {
  description: 'Count of decisions by verdict',
  valueType: ValueType.INT,
});

// Gauge for confidence
const confidenceGauge = meter.createObservableGauge('wcp.decision.confidence', {
  description: 'Average decision confidence',
  valueType: ValueType.DOUBLE,
});

// UpDownCounter for cost tracking
const costCounter = meter.createUpDownCounter('wcp.decision.cost_usd', {
  description: 'Running cost of decisions',
  valueType: ValueType.DOUBLE,
});

// Usage in code
export async function analyzeWCP(input: WCPInput): Promise<WCPDecision> {
  const startTime = Date.now();
  
  const decision = await runAnalysis(input);
  
  // Record metrics
  latencyHistogram.record(Date.now() - startTime, {
    status: decision.status,
    model: decision.trace.modelVersion,
  });
  
  verdictCounter.add(1, {
    verdict: decision.status,
    locality: input.locality,
  });
  
  costCounter.add(decision.trace.costUsd || 0);
  
  return decision;
}
```

### Target metrics dashboard

| Metric | Type | Alert Threshold | Purpose |
|--------|------|-----------------|---------|
| `wcp.decision.latency` | Histogram | P95 > 5s | Performance monitoring |
| `wcp.decision.verdicts` | Counter | N/A | Volume tracking |
| `wcp.decision.confidence` | Gauge | Avg < 0.8 | Quality indicator |
| `wcp.decision.cost_usd` | Counter | Daily > $100 | Budget monitoring |
| `wcp.retrieval.latency` | Histogram | P95 > 500ms | Search performance |
| `wcp.schema_failures` | Counter | > 0.1% | Output quality |
| `wcp.errors` | Counter | Rate > 1% | Error tracking |

---

## Structured logging

### Log format

```typescript
// Target structured logs (JSON)
{
  "timestamp": "2024-01-15T10:30:00.123Z",
  "level": "info",
  "traceId": "trace-abc123",
  "requestId": "req-xyz789",
  "service": "wcp-compliance-agent",
  "version": "1.2.3",
  "stage": "validation",
  "message": "Validation completed",
  "attributes": {
    "role": "Electrician",
    "locality": "LA",
    "findings": 2,
    "duration_ms": 12,
    "model_version": "gpt-4o-mini",
    "prompt_version": "wcp-v1.2",
    "corpus_version": "dbwd-2024-q1"
  }
}
```

### Log levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `DEBUG` | Detailed internal state | "Regex matched role: Electrician" |
| `INFO` | Normal operations | "Validation completed, 2 findings" |
| `WARN` | Degraded but functioning | "Low OCR confidence, requesting revision" |
| `ERROR` | Functional failures | "LLM call failed, retrying" |
| `FATAL` | System unavailability | "Database connection lost" |

---

## Operational workflows

### Replay a decision from trace ID

```typescript
// Target replay capability (planned)
export async function replayDecision(traceId: string): Promise<ReplayResult> {
  // 1. Fetch original trace
  const trace = await loadTrace(traceId);
  
  // 2. Re-run with same configuration
  const config = {
    modelVersion: trace.modelVersion,
    promptVersion: trace.promptVersion,
    corpusVersion: trace.corpusVersion,
  };
  
  // 3. Execute analysis
  const replayed = await analyzeWCP(trace.requestPayload, config);
  
  // 4. Compare results
  const diff = compareDecisions(trace.originalDecision, replayed);
  
  return {
    traceId,
    original: trace.originalDecision,
    replayed,
    diff,
    match: diff.status === 'identical',
  };
}

// Usage
const replay = await replayDecision('trace-abc123');
console.log(replay.match ? 'Identical' : 'Different');
console.log(replay.diff.explanation);
```

### Compare results before/after changes

```bash
# Run golden set before change
npm run golden:baseline -- --tag=before-prompt-update

# Apply change (e.g., new prompt version)
# ... make changes ...

# Run golden set after change
npm run golden:run -- --tag=after-prompt-update

# Compare results
npm run golden:diff -- --baseline=before --current=after

# Output:
# Changed: 5 decisions
# - 3 improvements (higher confidence)
# - 2 regressions (lower accuracy)
# Recommendation: Review before deploying
```

### Monitor latency and cost drift

```typescript
// Target monitoring (planned)
import { compareMetrics } from './monitoring';

const weekAgo = await getMetrics({ since: '7d' });
const today = await getMetrics({ since: '1h' });

const drift = compareMetrics(weekAgo, today);

if (drift.latency.p95 > 1.2) {
  alert('Latency regression: P95 increased 20%');
}

if (drift.cost.avg > 1.5) {
  alert('Cost spike: Average cost increased 50%');
}

if (drift.accuracy < 0.95) {
  alert('Accuracy degradation: Below 95% of baseline');
}
```

### Detect corpus regressions after DBWD updates

```typescript
// Target corpus monitoring (planned)
export async function validateCorpusUpdate(
  oldVersion: string,
  newVersion: string
): Promise<CorpusValidationResult> {
  // Run golden set against both versions
  const oldResults = await runGoldenSet(oldVersion);
  const newResults = await runGoldenSet(newVersion);
  
  // Compare
  const diff = compareResults(oldResults, newResults);
  
  if (diff.accuracyDelta < -0.02) {
    return {
      valid: false,
      reason: 'Accuracy dropped > 2%',
      diff,
    };
  }
  
  if (diff.falseApproveRate > 0.02) {
    return {
      valid: false,
      reason: 'False-approve rate exceeds threshold',
      diff,
    };
  }
  
  return { valid: true, diff };
}
```

---

## Alerting rules

### PagerDuty-style alerts

```yaml
# Target alerting configuration
alerts:
  high_latency:
    condition: "wcp.decision.latency:p95 > 5000"
    duration: "5m"
    severity: "warning"
    
  critical_latency:
    condition: "wcp.decision.latency:p95 > 10000"
    duration: "3m"
    severity: "critical"
    page: true
    
  error_spike:
    condition: "rate(wcp.errors[5m]) > 0.01"
    duration: "5m"
    severity: "warning"
    
  false_approve_spike:
    condition: "wcp.false_approve_rate > 0.02"
    duration: "10m"
    severity: "critical"
    page: true
    
  schema_failures:
    condition: "wcp.schema_failures > 0"
    duration: "1m"
    severity: "critical"
    page: true
    
  cost_spike:
    condition: "wcp.decision.cost_usd:sum[1h] > $10"
    duration: "1h"
    severity: "warning"
```

---

## Dashboard mockup

### Overview dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  WCP Compliance Agent - Last 24 Hours                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Decisions: 1,247    │    Latency P95: 2.3s    │   Uptime: 99.9%  │
│  Compliant: 923      │    Latency P50: 1.8s    │   Errors: 0.1%   │
│  Violations: 312     │    Latency P99: 4.1s    │   Cost: $12.47  │
│  Revisions: 12       │                         │                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Confidence Distribution          │   Model Distribution        │
│  ████████████ 0.9-1.0: 68%      │   gpt-4o-mini: 95%         │
│  ██████ 0.8-0.9: 28%            │   gpt-4o: 5%               │
│  ██ 0.7-0.8: 3%                 │                              │
│  ░ 0.0-0.7: 1%                  │                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Recent Traces                                              │
│  trace-abc123  [2.1s]  COMPLIANT   0.95 conf   10:30:00     │
│  trace-def456  [1.8s]  VIOLATION   0.98 conf   10:29:45     │
│  trace-ghi789  [3.2s]  REVISION    0.72 conf   10:29:12     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Trace detail view

```
Trace: trace-abc123
Started: 2024-01-15T10:30:00Z
Duration: 2.1s
Status: success

Timeline:
10:30:00.000  → Request received
10:30:00.050  → Extraction started
10:30:00.052  → Extraction complete (2ms)
10:30:00.053  → Validation started
10:30:00.065  → Validation complete (12ms)
10:30:00.066  → Retrieval started
10:30:00.720  → Retrieval complete (654ms)
10:30:00.721  → Decision started
10:30:02.100  → LLM response received (1.4s)
10:30:02.115  → Schema validation complete (15ms)
10:30:02.120  → Response sent

Logs:
[INFO] Extraction: role=Electrician, hours=40
[INFO] Validation: 0 findings, status=COMPLIANT
[INFO] Retrieval: 3 documents retrieved
[INFO] Decision: confidence=0.95, tokens=450
```

---

## Cost tracking

### Per-decision cost breakdown

```typescript
// Target cost tracking (planned)
interface DecisionCost {
  traceId: string;
  timestamp: string;
  
  llm: {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
  
  retrieval: {
    esQueries: number;
    vectorQueries: number;
    costUsd: number;
  };
  
  storage: {
    documentSizeBytes: number;
    retentionDays: number;
    costUsd: number;
  };
  
  total: {
    costUsd: number;
    latencyMs: number;
  };
}

// Example cost breakdown
const exampleCost: DecisionCost = {
  traceId: 'trace-abc123',
  timestamp: '2024-01-15T10:30:00Z',
  llm: {
    inputTokens: 320,
    outputTokens: 130,
    costUsd: 0.00225,
  },
  retrieval: {
    esQueries: 2,
    vectorQueries: 1,
    costUsd: 0.0001,
  },
  storage: {
    documentSizeBytes: 150000,
    retentionDays: 2555, // 7 years
    costUsd: 0.00005,
  },
  total: {
    costUsd: 0.0024,
    latencyMs: 2100,
  },
};
```

### Cost optimization alerts

```yaml
cost_alerts:
  daily_budget:
    threshold: "$50/day"
    action: "alert + review"
    
  per_decision:
    threshold: "$0.05/decision"
    action: "alert + optimize"
    
  model_upgrade:
    condition: "gpt-4 usage > 10%"
    action: "review for downgrade to gpt-4o-mini"
```

---

## Current vs target comparison

| Capability | Current | Target | Gap |
|------------|---------|--------|-----|
| **Tracing** | Console logs | OpenTelemetry spans | Need OTel setup |
| **Metrics** | Basic latency | Full histograms + counters | Need monitoring stack |
| **Dashboards** | None | Phoenix-style trace viewer | Need UI development |
| **Alerting** | None | PagerDuty integration | Need alert configuration |
| **Replay** | None | Full trace replay | Need trace storage |
| **Cost tracking** | Manual estimates | Per-decision breakdown | Need cost attribution |
| **Log aggregation** | Local files | Centralized (Datadog/CloudWatch) | Need log shipping |

---

## Related documentation

- [Data Model](./data-model.md) - Persistence schema
- [System Overview](./system-overview.md) - Architecture context
- [Evaluation Strategy](../evaluation/evaluation-strategy.md) - Quality monitoring
- [Quality Bar](../evaluation/quality-bar.md) - Target metrics

---

*Last updated: January 2024*
