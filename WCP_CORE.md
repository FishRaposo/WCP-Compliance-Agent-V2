# WCP Compliance Agent — Core Reference Document

**Status:** Active Priority | Upwork Interview Demo Prep  
**Last Updated:** 2026-04-18  
**Repository:** `FishRaposo/WCP-Compliance-Agent`  
**Current Commit:** `fd3503a`

---

## Quick Links

| Resource | Location |
|----------|----------|
| **Repository** | https://github.com/FishRaposo/WCP-Compliance-Agent |
| **Role Fit Doc** | [ROLE_FIT.md](./ROLE_FIT.md) — AI infrastructure hiring showcase |
| **Issues Audit** | [ISSUES_AND_GAPS.md](./ISSUES_AND_GAPS.md) — Known gaps and fixes |
| **README** | [README.md](./README.md) — Entry point with pattern table |
| **Local Path** | `/root/.openclaw/workspace/_repos/WCP-Compliance-Agent/` |

---

## Project Purpose

Demonstrate **deterministic AI infrastructure** patterns applicable to revenue intelligence, healthcare, finance, or any high-stakes LLM system.

**Domain:** Davis-Bacon Act payroll compliance (federal construction wage validation)  
**Architecture:** Three-layer decision pipeline (deterministic → LLM → trust score)  
**Hiring Angle:** Founding AI Infrastructure Engineer role (revenue intelligence platform)

---

## Architecture Overview

### Three-Layer Decision Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: Deterministic Scaffold                            │
│  • Pattern-based extraction (NO LLM)                         │
│  • DBWD rate lookup (hardcoded: 5 trades)                    │
│  • Rule validation (prevailing wage, overtime, fringe)       │
│  • Output: DeterministicReport with CheckResults             │
│  Code: src/pipeline/layer1-deterministic.ts                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: LLM Verdict (Constrained)                          │
│  • Reasoning over Layer 1 findings ONLY                     │
│  • FORBIDDEN from recomputation or re-lookup                │
│  • MUST cite specific check IDs from Layer 1                │
│  • Output: LLMVerdict with rationale + citations            │
│  Code: src/pipeline/layer2-llm-verdict.ts                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: Trust Score + Human Review                        │
│  • Compute confidence: weighted component score              │
│  • Route to human review if score < 0.60                     │
│  • Output: TrustScoredDecision with full audit trail         │
│  Code: src/pipeline/layer3-trust-score.ts                     │
└─────────────────────────────────────────────────────────────┘
```

### Key Types (Entity Abstractions)

```typescript
// Core contract — immutable, typed, traceable
interface TrustScoredDecision {
  traceId: string;                    // Unique decision ID
  deterministic: DeterministicReport; // Layer 1 output
  verdict: LLMVerdict;                // Layer 2 output
  trust: {
    score: number;                    // 0.0-1.0
    components: {
      deterministic: number;
      classification: number;
      llmSelf: number;
      agreement: number;
    };
    band: "auto" | "require_human";   // Routing decision
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
    cycleTime: number;                // ms
    tokenUsage: number;               // cost tracking
    validationScore: number;
    confidence: number;
  };
}
```

---

## Current State

### What's Working

| Component | Status | Notes |
|-----------|--------|-------|
| **Build** | ✅ Passes | `npm run build` exits 0 |
| **TypeScript** | ✅ No errors | All type checks pass |
| **Three-layer pipeline** | ✅ Implemented | Full orchestration working |
| **Deterministic Layer 1** | ✅ Functional | Regex extraction + hardcoded rates |
| **LLM Layer 2** | ✅ Functional | Requires valid OpenAI API key |
| **Trust Layer 3** | ✅ Functional | Scoring + human review queue |
| **Audit trail** | ✅ Complete | Full event logging |
| **API server** | ✅ Ready | Hono server on localhost:3000 |
| **Unit tests** | ✅ 95/95 pass | Pipeline contracts, trust scoring |
| **Integration tests** | ⚠️ Need API key | Fail with 401 (expected without key) |
| **Hybrid retrieval** | ❌ Stubbed | Architecture designed, not implemented |
| **PDF/CSV ingestion** | ❌ Not implemented | Text input only |

### Known Gaps (See ISSUES_AND_GAPS.md for details)

1. **Needs OpenAI API key** for full demo (integration tests fail without it)
2. **Hybrid retrieval stubbed** — docs exist, code throws `Not implemented`
3. **5 hardcoded trades** — Electrician, Laborer, Plumber, Carpenter, Mason
4. **Text-only input** — No PDF/OCR/CSV ingestion
5. **No audit persistence** — In-memory only (no PostgreSQL)

---

## Running the Demo

### Prerequisites
```bash
# 1. Get OpenAI API key from https://platform.openai.com/account/api-keys
export OPENAI_API_KEY=sk-your-key-here

# 2. Install dependencies
npm install

# 3. Build (should pass)
npm run build

# 4. Start dev server
npm run dev
# Server starts on http://localhost:3000
```

### Test the Pipeline
```bash
# Health check
curl http://localhost:3000/health

# Analyze a compliant submission (should approve)
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "Role: Electrician, Hours: 40, Wage: $52"}'

# Analyze a violation (should reject + require human review)
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "Role: Electrician, Hours: 45, Wage: $35"}'
```

### Expected Output Structure
```json
{
  "traceId": "wcp-20260418-XXXX",
  "finalStatus": "Reject",
  "deterministic": {
    "extracted": { "role": "Electrician", "hours": 45, "wage": 35 },
    "dbwdRate": { "baseRate": 51.69, "fringeRate": 34.63 },
    "checks": [
      { "id": "base_wage_001", "passed": false, "severity": "critical", ... },
      { "id": "overtime_001", "passed": false, "severity": "error", ... }
    ]
  },
  "verdict": {
    "status": "Reject",
    "rationale": "Underpayment detected...",
    "referencedCheckIds": ["base_wage_001", "overtime_001"],
    "selfConfidence": 0.95
  },
  "trust": {
    "score": 0.28,
    "band": "require_human",
    "components": { "deterministic": 0.3, "classification": 0.5, "llmSelf": 0.95, "agreement": 0.0 }
  },
  "humanReview": { "required": true, "status": "pending", "queuedAt": "2026-04-18T..." },
  "auditTrail": [...],
  "health": { "cycleTime": 245, "tokenUsage": 150, "validationScore": 0.3, "confidence": 0.28 }
}
```

---

## Interview Talking Points

### The Pitch (30 seconds)
> "I built a three-layer decision architecture where LLMs are constrained by deterministic scaffolding. Layer 1 extracts and validates using only deterministic code—no hallucination. Layer 2 reasons over those findings but cannot recompute. Layer 3 scores trust and routes low-confidence decisions to human review. This creates 100% auditable AI decisions with full traceability—critical for compliance, but the pattern applies to revenue intelligence, healthcare, any high-stakes domain."

### Key Patterns to Highlight

1. **Deterministic Scaffolding**
   - "I don't trust LLMs with arithmetic or lookups. Layer 1 does that deterministically."
   - "The LLM is a reviewer, not a calculator."

2. **Constraint Enforcement**
   - "Layer 2 MUST cite specific check IDs from Layer 1. We validate this at runtime."
   - "The LLM cannot hallucinate findings—it can only reason over pre-computed data."

3. **Trust Score Routing**
   - "Not all LLM outputs are equal. We compute a 4-component trust score."
   - "Below 0.60? Mandatory human review. Above 0.85? Auto-approve."

4. **CI-Based Evaluation**
   - "We lint the architecture with ts-morph AST analysis."
   - "`Agent.generate()` can only be called in Layer 2—anywhere else is a CI failure."

5. **Transfer to Revenue Intelligence**
   - "Replace 'trade' with 'deal stage', 'DBWD rates' with 'historical win rates'."
   - "Same three-layer pattern: deterministic CRM extraction → constrained LLM coaching → trust score routing."

### Demo Flow (5 minutes)
1. **Show the three-layer output** — deterministic findings → LLM rationale → trust score
2. **Show the audit trail** — every decision is traceable end-to-end
3. **Show error handling** — API failure gracefully degrades to human review
4. **Reference the architecture docs** — hybrid retrieval, evaluation gates, observability

### If They Ask About Gaps
> "This is intentionally an architecture showcase, not a production product. The hybrid retrieval is stubbed because I wanted to prove I can design the full system—from BM25 + vector search to cross-encoder reranking—without spending weeks on Elasticsearch setup. The core innovation is the three-layer trust architecture, which is fully implemented and working."

---

## File Structure

```
src/
├── pipeline/                    # Three-layer architecture
│   ├── layer1-deterministic.ts  # Extraction, validation (NO LLM)
│   ├── layer2-llm-verdict.ts    # Constrained LLM reasoning
│   ├── layer3-trust-score.ts    # Confidence + human review
│   └── orchestrator.ts          # Composes all three layers
├── types/
│   └── decision-pipeline.ts     # Typed contracts
├── entrypoints/
│   └── wcp-entrypoint.ts        # Public API
├── utils/
│   ├── errors.ts               # Typed error taxonomy
│   ├── mock-responses.ts      # Fallback for offline dev
│   └── env-validator.ts       # Config validation
docs/
├── architecture/               # System design
├── implementation/            # Infrastructure specs (retrieval, eval, observability)
├── evaluation/                 # Testing strategy
└── adrs/                      # Architecture Decision Records
ROLE_FIT.md                   # ← START HERE for hiring context
ISSUES_AND_GAPS.md            # Known issues and fix priority
README.md                     # Entry point
```

---

## Commands Reference

```bash
# Development
npm install           # Install dependencies
npm run build         # TypeScript compile (must pass)
npm run dev           # Start dev server with hot reload
npm run serve         # Start built server

# Testing
npm test              # Full test suite (needs OPENAI_API_KEY)
npm run test:unit     # Unit tests only (95 pass)
npm run test:pipeline # Critical pipeline tests
npm run test:calibration # Trust calibration golden set

# Quality
npm run lint:pipeline # AST-based architectural enforcement
```

---

## Environment Variables

```bash
# Required
export OPENAI_API_KEY=sk-...          # Get from OpenAI dashboard

# Optional
export OPENAI_MODEL=gpt-4o-mini       # Default: gpt-4o-mini
export AGENT_MAX_STEPS=3              # Default: 3
export MOCK_MODE=false                # Use mock responses if true
export NODE_ENV=development
```

---

## Recent Changes

| Date | Commit | Change |
|------|--------|--------|
| 2026-04-18 | `fd3503a` | Add ROLE_FIT.md, reframe README for AI infrastructure hiring |
| 2026-04-18 | `daffc8d` | Fix TypeScript errors (app.ts, index.ts, layer2-llm-verdict.ts) |
| 2026-04-18 | `6cccbb2` | Add ISSUES_AND_GAPS.md audit document |
| 2026-04-18 | `a765e4f` | Previous: Documentation and standards |

---

## Open Questions

- [ ] Get valid OpenAI API key for full demo
- [ ] Prepare 5-minute demo script for interview
- [ ] Review ROLE_FIT.md talking points
- [ ] Test API endpoints respond correctly with real key

---

*This document is the single source of truth for WCP project state. All other projects are paused. Focus: Upwork interview demo prep.*
