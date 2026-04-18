# Decision Engine

Status Label: Structurally Implemented, Data Stubbed

The decision engine orchestrates compliance decisions through the three-layer pipeline (deterministic → LLM → trust score). It enforces that every decision is explainable, auditable, and reproducible.

---

## Purpose

The decision engine is responsible for:
- Orchestrating the three-layer decision pipeline
- Enforcing architectural constraints (no layer bypassing)
- Providing the primary interface: `generateWcpDecision()`
- Ensuring all decisions include audit trail and health metrics

---

## Current State

### Implementation

The decision engine is implemented in the three-layer pipeline architecture:

**Files:**
- `src/pipeline/orchestrator.ts` — Pipeline composer and main entry
- `src/pipeline/layer1-deterministic.ts` — Deterministic scaffold
- `src/pipeline/layer2-llm-verdict.ts` — LLM verdict layer
- `src/pipeline/layer3-trust-score.ts` — Trust scoring and human review
- `src/entrypoints/wcp-entrypoint.ts` — Public API interface

### Key Interfaces

```typescript
// src/entrypoints/wcp-entrypoint.ts
export async function generateWcpDecision(args: {
  content: string;
  traceId?: string;
}): Promise<TrustScoredDecision>

// src/pipeline/orchestrator.ts
export async function executeDecisionPipeline(
  input: DecisionPipelineInput
): Promise<TrustScoredDecision>
```

### Current Capabilities

✅ **Three-layer pipeline structure**
- Layer 1: Extract, validate, run deterministic checks
- Layer 2: Generate LLM verdict with reasoning
- Layer 3: Compute trust score, route to human review if needed

✅ **Schema-bound outputs**
- `TrustScoredDecision` type enforces consistent structure
- Zod schemas validate at runtime

✅ **Health metrics preserved**
- `cycleTime`, `tokenUsage`, `validationScore`, `confidence`
- Backward compatible with original WCPDecision

✅ **Audit trail**
- Every decision has unique `traceId`
- Full decision path logged
- Replay capability (re-run same inputs → same outputs)

🔲 **Stubbed components**
- DBWD rates: Hardcoded for 2 roles (Electrician, Laborer)
- Human review queue: In-memory only (no persistence)

### Code Example

```typescript
// Using the decision engine
import { generateWcpDecision } from './entrypoints/wcp-entrypoint';

const decision = await generateWcpDecision({
  content: 'Role: Electrician, Hours: 45, Wage: 35.50'
});

// decision structure:
{
  traceId: 'wcp-20240115-abc123',
  finalStatus: 'Reject',
  deterministic: {
    extracted: { role: 'Electrician', hours: 45, wage: 35.50 },
    checks: [/* wage check, overtime check */],
    deterministicScore: 0.5
  },
  verdict: {
    status: 'Reject',
    rationale: 'Worker underpaid by $3.00/hr',
    selfConfidence: 0.95
  },
  trust: {
    score: 0.45,
    band: 'require_human',
    components: { /* 0.35/0.25/0.20/0.20 breakdown */ }
  },
  health: {
    cycleTime: 245,
    tokenUsage: 150,
    validationScore: 0.5,
    confidence: 0.45
  }
}
```

---

## Target State

### Enhanced Decision Contract

The target decision engine will support:

```typescript
interface EnhancedDecision {
  // Current fields...
  
  // New: Multi-employee support
  employees: EmployeeDecision[];
  
  // New: Aggregated project-level findings
  projectFindings: ProjectFinding[];
  
  // New: Confidence calibration
  calibrationMetrics: {
    predictedAccuracy: number;
    historicalAccuracy: number;
    drift: number;
  };
}
```

### Target Capabilities

| Feature | Current | Target |
|---------|---------|--------|
| Single employee | ✅ | ✅ |
| Multi-employee batch | 🔲 | ✅ |
| Real-time confidence | ✅ | ✅ |
| Calibration tracking | 🔲 | ✅ |
| A/B prompt testing | 🔲 | ✅ |
| Cost optimization | 🔲 | ✅ |

---

## Three-Layer Pipeline Integration

The decision engine IS the orchestrator of the three-layer pipeline:

```
generateWcpDecision()
    ↓
executeDecisionPipeline()
    ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Deterministic Scaffold                         │
│   executeDeterministicScaffold()                        │
│   - Extract WCP data                                    │
│   - Lookup DBWD rates                                   │
│   - Run compliance checks                               │
│   ↓                                                     │
│ DeterministicReport {                                   │
│   extracted, checks, deterministicScore                 │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 2: LLM Verdict                                    │
│   generateLLMVerdict()                                    │
│   - Review DeterministicReport                            │
│   - Generate Approved/Revise/Reject                       │
│   - Cite specific check IDs                               │
│   ↓                                                       │
│ LLMVerdict {                                              │
│   status, rationale, referencedCheckIds[], citations[]  │
│ }                                                         │
└───────────────────────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────────────────────┐
│ Layer 3: Trust Score + Human Review                       │
│   computeTrustScore()                                     │
│   - Calculate 0.35/0.25/0.20/0.20 components              │
│   - Apply thresholds (≥0.85, 0.60-0.84, <0.60)          │
│   - Route to human review if needed                       │
│   ↓                                                       │
│ TrustScoredDecision {                                     │
│   ...all layers, auditTrail, health                     │
│ }                                                         │
└───────────────────────────────────────────────────────────┘
```

**Critical Constraint**: The decision engine enforces that Layer 2 CANNOT bypass Layer 1 findings. It must reference check IDs, not recompute.

---

## Confidence Routing

Current routing logic:

```typescript
// src/pipeline/layer3-trust-score.ts
function applyTrustThresholds(trustScore: number): RoutingDecision {
  if (trustScore >= 0.85) {
    return { action: 'auto_decide', reviewRequired: false };
  } else if (trustScore >= 0.60) {
    return { action: 'flag_for_review', reviewRequired: false };
  } else {
    return { action: 'require_human', reviewRequired: true };
  }
}
```

Rules:
- **Auto-decide** (≥0.85): Complete evidence, high agreement, clear decision
- **Flag** (0.60-0.84): Minor ambiguity, acceptable risk
- **Require human** (<0.60): Low confidence, conflict, or critical violation

---

## Design Principles

1. **Model is synthesis layer, not system of record**
   - The LLM interprets findings, doesn't create them
   - All facts come from deterministic Layer 1

2. **Decisions must be explainable**
   - Every decision cites specific regulations
   - Check IDs link to deterministic validation
   - Audit trail captures full reasoning

3. **Decisions must be reproducible**
   - Same inputs → Same outputs (deterministic layers)
   - Version-locked decisions (corpus versions recorded)
   - Replay capability for disputes

4. **Decisions must be defensible**
   - Regulatory citations for every finding
   - 7-year audit trail retention
   - Human escalation for edge cases

---

## Error Handling

The decision engine handles errors at each layer:

```typescript
// Layer 1 errors (deterministic)
if (extractionFailed) {
  return createErrorDecision('EXTRACTION_FAILED', error);
}

// Layer 2 errors (LLM)
if (llmTimeout) {
  return createErrorDecision('LLM_TIMEOUT', error);
}

// Layer 3 errors (trust computation)
if (trustCalculationError) {
  return createErrorDecision('TRUST_ERROR', error);
}
```

All error decisions include:
- Error code and message
- Partial results from completed layers
- Fallback status (typically "Pending Human Review")
- Health metrics (with error indicators)

---

## Performance Characteristics

| Metric | Target | Current |
|--------|--------|---------|
| End-to-end latency | <500ms | ~250ms |
| Layer 1 (deterministic) | <10ms | <1ms |
| Layer 2 (LLM) | <400ms | ~200ms |
| Layer 3 (trust) | <5ms | <1ms |

---

## Related Documentation

- [Decision Architecture Doctrine](./decision-architecture.md) — Full three-layer doctrine
- [Trust Scoring](./trust-scoring.md) — Hybrid formula details
- [Human Review Workflow](./human-review-workflow.md) — Queue and routing
- [ADR-005: Three-Layer Architecture](../adrs/ADR-005-decision-architecture.md) — Architectural decision
- [Implementation: Pipeline](../implementation/INDEX.md) — Code-level guides

---

**Last Updated**: 2026-04-17
