# Role Fit: Founding AI Infrastructure Engineer

**For:** Revenue Intelligence Platform Hiring Team  
**Date:** April 18, 2026  
**Candidate:** Vinícius Raposo  
**Repository:** WCP Compliance Agent (Davis-Bacon Payroll Validation)

---

## TL;DR: Why This Repo Proves Fit

This repository demonstrates **exactly** the architectural patterns your role requires—just applied to federal payroll compliance instead of revenue intelligence. The underlying infrastructure principles are identical:

| Your Requirement | What This Repo Shows |
|-----------------|---------------------|
| **Retrieval & context layer** | Three-layer pipeline with deterministic scaffold feeding constrained LLM reasoning |
| **Hybrid search (BM25 + vector + reranking)** | Full architecture spec + stubbed implementation ready for Elasticsearch/pgvector |
| **Tool-use functions** | Layer 1 deterministic tools with Zod-typed contracts and regulation citations |
| **Evaluation pipelines** | CI-based pipeline discipline with AST linting + trust calibration |
| **CI evaluation gates** | `npm run lint:pipeline` enforces architectural constraints via ts-morph |
| **Prompt infrastructure** | Versioning, A/B testing, and per-organization config architecture |
| **Observability (Phoenix/OTel)** | Structured decision payloads with health metrics, audit trails, trace IDs |
| **Entity abstractions** | `CheckResult`, `LLMVerdict`, `TrustScoredDecision` — immutable, typed, traceable |
| **Cost controls** | Token usage tracking, cycle time metrics, confidence-based routing |
| **Deterministic scaffolding** | **The core innovation: Trust-Score architecture** |

---

## The Trust-Score Architecture (Transferable Pattern)

The three-layer decision pipeline is the core innovation—applicable to any high-stakes AI system:

```
Layer 1 (Deterministic) → Layer 2 (LLM Verdict) → Layer 3 (Trust Score)
```

### Layer 1: Deterministic Scaffold
- **Pattern:** Extract structured data using regex/parsers (NO LLM)
- **Compliance Use:** Wage extraction, DBWD rate lookup
- **Revenue Intelligence Use:** CRM entity extraction (Rep, Call, Opportunity), Salesforce ID resolution
- **Code:** `src/pipeline/layer1-deterministic.ts`

### Layer 2: Constrained LLM Verdict
- **Pattern:** LLM reasons over pre-computed findings, FORBIDDEN from recomputation
- **Compliance Use:** Rationale generation citing specific regulation violations
- **Revenue Intelligence Use:** Deal-stage coaching, call transcript analysis with CRM-grounded context
- **Constraint:** `validateReferencedCheckIds()` enforces LLM cannot hallucinate findings
- **Code:** `src/pipeline/layer2-llm-verdict.ts`

### Layer 3: Trust Score + Human Review
- **Pattern:** Compute confidence, route to human if below threshold
- **Compliance Use:** Low-trust payroll decisions → human auditor queue
- **Revenue Intelligence Use:** Low-confidence deal predictions → sales manager review
- **Formula:** Weighted combination of deterministic score, LLM self-confidence, and alignment
- **Code:** `src/pipeline/layer3-trust-score.ts`

---

## Architecture Deep-Dive

### 1. Retrieval & Context Assembly

**What's Implemented:**
- Pattern-based extraction with fallback heuristics
- Hardcoded DBWD rates (5 trades) with fuzzy matching aliases
- Typed contracts: `ExtractedWCP`, `DBWDRateInfo`, `DeterministicReport`

**Architecture Designed (docs/implementation/):**
- Hybrid retrieval: BM25 (Elasticsearch) + vector (pgvector) + cross-encoder reranking
- Metadata filtering: trade, locality, effective date, SAM.gov version
- Citation tracking: every decision cites source documents

**Transfer to Revenue Intelligence:**
- Replace "trade" with "deal stage"
- Replace "locality" with "account industry/region"
- Replace "DBWD rates" with "historical win rates by segment"
- Same hybrid search pattern applies

### 2. Evaluation as Architecture Concern

**What's Implemented:**
- `npm run lint:pipeline` — AST-based architectural enforcement
  - Ensures `Agent.generate()` only called in Layer 2
  - Enforces `TrustScoredDecision` return type
  - Validates `validateReferencedCheckIds()` called
- Trust calibration golden set (6 scenarios)
- 95/101 tests passing (6 fail only due to missing OpenAI API key)

**Architecture Designed:**
- Golden dataset with ground truth labels
- CI gates: pipeline lint → unit tests → integration tests → trust calibration
- Regression detection for prompt/retrieval changes
- Quality bars: >95% violation detection, <2% false-approve rate

**Transfer to Revenue Intelligence:**
- Golden set: labeled deal outcomes with expected coaching recommendations
- CI gates block deployment if precision/recall degrades
- Regression detection for RAG changes

### 3. Entity-Based Abstractions

**What's Implemented:**
```typescript
// Core entities (immutable, typed, traceable)
interface CheckResult {
  id: string;                    // "base_wage_check_001"
  type: "wage" | "overtime" | "fringe" | "classification";
  passed: boolean;
  regulation: string;            // "40 U.S.C. § 3142(a)"
  expected?: number;
  actual?: number;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
}

interface LLMVerdict {
  traceId: string;
  status: "Approved" | "Revise" | "Reject";
  rationale: string;
  referencedCheckIds: string[];    // MUST reference Layer 1 checks
  citations: Array<{statute: string, description: string}>;
  selfConfidence: number;
  reasoningTrace: string;
  tokenUsage: number;
  model: string;
  timestamp: string;
}

interface TrustScoredDecision {
  traceId: string;
  deterministic: DeterministicReport;
  verdict: LLMVerdict;
  trust: {
    score: number;                // 0.0-1.0
    components: {
      deterministic: number;
      classification: number;
      llmSelf: number;
      agreement: number;
    };
    band: "auto" | "require_human";
    reasons: string[];
  };
  humanReview: {
    required: boolean;
    status: "pending" | "not_required" | "completed";
    queuedAt?: string;
  };
  auditTrail: Array<{
    timestamp: string;
    stage: "layer1" | "layer2" | "layer3" | "final";
    event: string;
    details?: Record<string, unknown>;
  }>;
  finalStatus: "Approved" | "Revise" | "Reject" | "Pending Human Review";
  finalizedAt: string;
  health?: {
    cycleTime: number;           // ms
    tokenUsage: number;
    validationScore: number;
    confidence: number;
  };
}
```

**Transfer to Revenue Intelligence:**
```typescript
// Same pattern, different domain
interface CallMoment {
  id: string;
  type: "pricing_discussion" | "competitor_mention" | "next_steps";
  timestamp: number;
  confidence: number;
  repId: string;                 // Immutable Salesforce ID
  opportunityId: string;         // Immutable Salesforce ID
}

interface DealCoachingVerdict {
  traceId: string;
  opportunityId: string;
  stage: string;
  riskFactors: Array<{type: string, severity: string, evidence: string}>;
  recommendations: string[];
  confidence: number;
  humanReviewRequired: boolean;
}
```

### 4. Observability & Cost Tracking

**What's Implemented:**
- Every decision includes: `cycleTime`, `tokenUsage`, `validationScore`, `confidence`
- Structured logging per layer with timestamps
- Human review queue tracking

**Architecture Designed:**
- OpenTelemetry integration (spans per layer)
- Phoenix tracing for LLM calls
- Cost attribution per decision
- Performance dashboards

---

## Production Readiness Evidence

### CI/CD Discipline
```yaml
# .github/workflows/pipeline-discipline.yml
1. Pipeline lint (AST checks)
2. Pipeline tests (must pass)
3. Trust calibration (golden set)
4. Coverage reporting
```

### Error Handling
- Graceful degradation: API failure → mock mode → human review queue
- Typed error taxonomy: `ValidationError`, `ExternalApiError`, `RateLimitError`
- Fallback decisions with full audit trail

### Testing Strategy
- 95 unit tests (pipeline contracts, trust scoring, tools)
- Integration tests (end-to-end pipeline)
- Trust calibration (golden scenario validation)

---

## Why Compliance → Revenue Intelligence Works

Both domains require:

1. **Deterministic grounding** — CRM data (opps, accounts) is your "DBWD rates"
2. **Attributable evidence** — Every recommendation cites source call/transcript
3. **Explicit failure modes** — Unknown deal stage = flag for human review
4. **Context selection** — Which calls/documents matter for this prediction?
5. **False positive sensitivity** — Wrong coaching > no coaching (deferral pattern)

The WCP repo proves I can design systems where:
- LLMs are **constrained** by deterministic scaffolding
- Decisions are **traceable** end-to-end
- Quality is **gated** in CI, not hoped for in production
- Costs are **tracked** and **optimized**

---

## Quick Validation

```bash
# Clone and build
git clone https://github.com/FishRaposo/WCP-Compliance-Agent.git
cd WCP-Compliance-Agent
npm install
npm run build  # ✅ Compiles successfully

# Set API key for full demo
export OPENAI_API_KEY=sk-your-key
npm run dev    # Starts on localhost:3000

# Test the pipeline
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "Role: Electrician, Hours: 45, Wage: $50"}'
```

**Expected output:** Trust-scored decision with deterministic findings, LLM rationale, and human review flag.

---

## Repository Structure

```
src/
├── pipeline/               # Three-layer decision architecture
│   ├── layer1-deterministic.ts    # Extraction, DBWD lookup, rule checks
│   ├── layer2-llm-verdict.ts      # Constrained LLM reasoning
│   ├── layer3-trust-score.ts      # Confidence routing
│   └── orchestrator.ts            # Composes all three layers
├── types/
│   └── decision-pipeline.ts       # Typed contracts (the entity layer)
├── entrypoints/
│   └── wcp-entrypoint.ts          # Public API surface
docs/
├── architecture/          # System design docs
├── implementation/        # Infrastructure specs (retrieval, eval, observability)
├── evaluation/            # Testing strategy
└── adrs/                  # Architecture Decision Records
tests/
├── unit/                  # Pipeline contracts, trust scoring
├── integration/           # End-to-end decision flow
└── eval/                  # Trust calibration golden set
```

---

## Contact

**Vinícius Raposo**  
GitHub: @FishRaposo  
Email: [Your email]  

---

*This repository is a deliberate architecture showcase. The patterns demonstrated—deterministic scaffolding, trust scoring, CI-based evaluation—are directly transferable to revenue intelligence, healthcare, finance, or any high-stakes AI system requiring reliability and auditability.*
