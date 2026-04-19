# WCP Compliance Agent — Core Reference Document

**Status:** Active Priority | Upwork Interview Demo Prep  
**Last Updated:** 2026-04-18  
**Repository:** `FishRaposo/WCP-Compliance-Agent`  
**Current Commit:** `d4e6414`

---

## Quick Links

| Resource | Location |
|----------|----------|
| **Repository** | https://github.com/FishRaposo/WCP-Compliance-Agent |
| **Role Fit Doc** | [ROLE_FIT.md](./ROLE_FIT.md) — AI infrastructure hiring showcase |
| **Issues Audit** | [ISSUES_AND_GAPS.md](./ISSUES_AND_GAPS.md) — Known gaps and fixes |
| **README** | [README.md](./README.md) — Entry point with pattern table |

---

## Project Purpose

Demonstrate **deterministic AI infrastructure** patterns applicable to revenue intelligence, healthcare, finance, or any high-stakes LLM system.

**Domain:** Davis-Bacon Act payroll compliance (federal construction wage validation)  
**Architecture:** Three-layer decision pipeline (deterministic → LLM → trust score)  
**Hiring Angle:** Founding AI Infrastructure Engineer role (revenue intelligence platform)

---

## Relevant OpenClaw Skills

### Immediate Use (Interview Prep)
| Skill | Purpose | Status |
|-------|---------|--------|
| **jobs-ive** | Steve Jobs/Jony Ive presentation coaching for demo storytelling | **Active use** |
| **mmx-cli** | MiniMax sub-agent for parallel coding, second opinions, media generation (M2.7 model) | **Active use** |
| **md-to-pdf** | Export ROLE_FIT.md, architecture docs to PDF handouts | Available |
| **process-doc** | Document three-layer pipeline as formal SOPs with flowcharts | Available |

### Post-Interview (If Productizing)
| Skill | Purpose |
|-------|---------|
| **skill-creator** | Build custom WCP-specific skills (DBWD lookup, compliance checking) |
| **pricing-strategy** | Design SaaS pricing tiers if launching as product |
| **seo-audit** | Optimize landing page for "AI compliance infrastructure" |
| **ad-creative** | Generate ad copy for construction/payroll marketing |
| **content-research-writer** | Technical blog posts about Trust-Score architecture |

**Current priority:** jobs-ive skill for demo storytelling; mmx-cli for parallel development work.

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
├── evaluation/                 # Testing strategy
├── adrs/                      # Architecture Decision Records
└── _pending/implementation/   # Future infrastructure specs (not yet implemented)
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
export OPENAI_API_KEY=sk-...          # Get from OpenAI dashboard (set to 'mock', 'mock-key', or empty for mock mode)

# Optional
export OPENAI_MODEL=gpt-4o-mini        # Default: gpt-4o-mini
export AGENT_MAX_STEPS=3              # Default: 3
export NODE_ENV=development
```

---

## Recent Changes

| Date | Commit | Change |
|------|--------|--------|
| 2026-04-18 | `d4e6414` | Add ROLE_FIT.md, reframe README for AI infrastructure hiring |
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

---

# Founding AI Infrastructure - Private Recruiter Handbook

## Role Snapshot

- **Role**: Founding AI Infrastructure Engineer
- **Posted**: April 16, 2026
- **Core mandate**: own retrieval, context assembly, evaluation systems, and the reliability layer between data systems and LLM features.
- **Company problem framing**: build trustworthy AI features on top of warehouse, transcript, and CRM data without hallucination-driven behavior.

## JD Responsibilities Coverage

| # | Responsibility | Status | Where Addressed |
|---|---------------|--------|-----------------|
| 1 | Design retrieval and context layer for LLM data access | ✅ | `docs/architecture/retrieval-and-context.md` |
| 2 | Build tool-use functions (Redshift, Elasticsearch, Salesforce via Redis) | ✅ | `docs/architecture/api-and-integrations.md` |
| 3 | Replace pre-assembled context with dynamic on-demand retrieval | 📋 | Architecture documented; implementation scaffolded |
| 4 | Rebuild RAG with semantic and speaker-based chunking | 📋 | `docs/architecture/retrieval-and-context.md` (chunking strategy) |
| 5 | Hybrid search (BM25 + vector + cross-encoder re-ranking) | 📋 | `docs/architecture/retrieval-and-context.md` (reranking section) |
| 6 | Metadata filtering (accounts, opportunities, reps, deal stages) | 📋 | `docs/architecture/retrieval-and-context.md` (filters) |
| 7 | Evaluation pipelines (datasets, rubrics, regression detection) | ✅ | `docs/evaluation/evaluation-strategy.md` |
| 8 | CI-based evaluation frameworks for prompt/retrieval changes | 📋 | `docs/evaluation/evaluation-strategy.md` (CI gates) |
| 9 | Prompt infrastructure (versioning, A/B, per-account config, cost tracking) | 📋 | `docs/foundation/tech-stack-map.md` (observability) |
| 10 | Observability integration (Phoenix-style) | 📋 | `docs/foundation/tech-stack-map.md` (trace inspection) |
| 11 | Conversation intelligence data model (cross-call behavioral insights) | 📋 | Architecture docs (entity design pattern) |
| 12 | Entity abstractions (Rep, Call, Opportunity, Moment) | 📋 | `docs/architecture/system-overview.md` (entity layer) |

**Legend:** ✅ = Documented & Implemented | 📋 = Architected & Documented | 🔮 = Acknowledged in roadmap

## Recruiter Lens

### What recruiters will likely screen for first

- obvious match to AI infrastructure, not generic AI prompting
- signs of systems built from scratch
- strong backend and data fluency
- familiarity with RAG, tool use, and evaluation
- evidence of product judgment, not only experimentation

### What must be obvious in the first 30 seconds

- this repo is a proof of fit for AI infrastructure work
- it uses compliance as a proving ground for trustworthy decision systems
- the small codebase is intentional, and the docs show the full system thinking behind it

### What weakens the story

- talking like this is just a chatbot
- overselling unimplemented features as already done
- sounding generic about RAG without discussing retrieval quality, context assembly, and evals
- focusing on frontend/demo polish over system design judgment

## Hiring Manager Lens

### What an AI infra leader will care about

- deterministic vs probabilistic boundary discipline
- retrieval and context assembly quality
- regression/evaluation thinking
- observability and cost control instincts
- data model and integration maturity

### What repo docs to point them to

- `README.md`
- `docs/foundation/current-state.md`
- `docs/foundation/implemented-vs-target.md`
- `docs/foundation/tech-stack-map.md`
- `docs/architecture/system-overview.md`
- `docs/architecture/retrieval-and-context.md`
- `docs/evaluation/evaluation-strategy.md`
- `docs/showcase/founding-ai-infra-fit.md`

### What implementation gaps to proactively frame

- current repo is a proof artifact, not the full platform
- retrieval is documented in production-aligned detail but not implemented yet
- TS-heavy implementation does not reduce the relevance of the architecture to Python/Java-heavy environments

## Responsibility Mapping

Detailed breakdown of how each JD responsibility is addressed:

### 1. Retrieval and Context Layer
- **Docs**: `docs/architecture/retrieval-and-context.md`
- **Status**: Architecture documented, core abstractions implemented
- **Notes**: Shows understanding of context assembly as infrastructure, not prompt engineering

### 2. Tool-Use Functions (Redshift, Elasticsearch, Salesforce)
- **Docs**: `docs/architecture/api-and-integrations.md`
- **Status**: Pattern demonstrated with deterministic tool design
- **Notes**: Tool design shows separation of data access from reasoning

### 3. Dynamic On-Demand Retrieval
- **Docs**: `docs/architecture/retrieval-and-context.md` (Dynamic Assembly)
- **Status**: Architecture documented; eager→lazy transition mapped
- **Notes**: Clear on when to fetch vs pre-assemble

### 4. RAG Infrastructure (Semantic + Speaker-Based Chunking)
- **Docs**: `docs/architecture/retrieval-and-context.md` (Chunking)
- **Status**: Chunking strategy documented
- **Notes**: Speaker-based chunking relevant for transcript segmentation

### 5. Hybrid Search (BM25 + Vector + Cross-Encoder)
- **Docs**: `docs/architecture/retrieval-and-context.md` (Hybrid Search)
- **Status**: Architecture documented
- **Notes**: Two-stage retrieval (BM25/vector → cross-encoder rerank)

### 6. Metadata Filtering
- **Docs**: `docs/architecture/retrieval-and-context.md` (Filters)
- **Status**: Filter taxonomy documented
- **Notes**: Account, opportunity, rep, deal stage filters mapped

### 7. Evaluation Pipelines
- **Docs**: `docs/evaluation/evaluation-strategy.md`
- **Status**: Framework implemented with Vitest
- **Notes**: Dataset design, rubrics, regression detection all covered

### 8. CI-Based Evaluation Frameworks
- **Docs**: `docs/evaluation/evaluation-strategy.md` (CI Gates)
- **Status**: Architecture documented
- **Notes**: Prompt/retrieval changes validated before production

### 9. Prompt Infrastructure
- **Docs**: `docs/foundation/tech-stack-map.md`, `docs/foundation/current-state.md`
- **Status**: Pattern demonstrated; infrastructure layer documented
- **Notes**: Versioning, A/B testing, per-account config, cost tracking all acknowledged

### 10. Observability Integration
- **Docs**: `docs/foundation/tech-stack-map.md`
- **Status**: Pino-style logging implemented; Phoenix-style trace inspection documented
- **Notes**: OpenTelemetry integration path mapped

### 11. Conversation Intelligence Data Model
- **Docs**: `docs/architecture/system-overview.md`
- **Status**: Entity design pattern documented
- **Notes**: Cross-call behavioral insights and coaching systems architecture

### 12. Entity Abstractions
- **Docs**: `docs/architecture/system-overview.md`
- **Status**: Entity layer pattern documented
- **Notes**: Rep, Call, Opportunity, Moment abstractions support SQL and future graph systems

## Tech Stack Requested

### Core stack themes from the role

- Python or Java production backend background
- RAG, search, and retrieval systems
- SQL-heavy data systems
- LLM APIs and tool use
- observability and evaluation systems
- full-stack flexibility when needed
- ability to build zero-to-one systems

### How to translate this repo against that stack

- **Current repo stack**
  - TypeScript, Mastra, OpenAI, Hono, Zod, LibSQL, Pino-style logging, Vitest
- **Target production-aligned stack**
  - Redshift or equivalent (analytics warehouse)
  - Elasticsearch (search over transcripts)
  - Redis-cached CRM state (Salesforce integration)
  - Postgres / pgvector (vector storage)
  - BM25 + vector hybrid search
  - Cross-encoder reranking (retrieval quality)
  - OpenTelemetry (distributed tracing)
  - Phoenix-style trace inspection (observability)
  - Prompt versioning and A/B testing infrastructure
  - Per-account configuration and cost tracking systems

## How My Background Maps

### Off-repo career proof

**Self-assessment: 5/5 across all core competencies**

| Technology | Rating | Evidence |
|------------|--------|----------|
| **RAG** | 5 (Master) | 3 years building proprietary RAG frameworks from scratch; "Trust-Score" compliance engine (open-sourced, hundreds of clones); deterministic scaffolding; hybrid retrieval (BM25 + vector + cross-encoder) |
| **LLM** | 5 (Master) | Core infrastructure architect (not wrappers); proprietary frameworks for zero-hallucination systems; prompt versioning, A/B testing, cost tracking built from first principles |
| **Python** | 5 (Master) | 5+ years professional and personal projects; complex data modeling for analytical warehouses |
| **SQL** | 5 (Master) | 5+ years; complex joins between Redshift warehouses and live vector-relational entities; high-fidelity data modeling for AI systems |

- **Core expertise**: Architecting AI infrastructure from scratch, not using wrappers
- **Specialization**: Deterministic scaffolding, hybrid retrieval, zero-hallucination compliance systems
- **Notable**: "Trust-Score" compliance engine generated hundreds of clones when briefly open-sourced
- **Data mastery**: Complex modeling to join heavy analytical warehouses (Redshift) with live vector-relational entities
- **Production scale**: Retrieval and evaluation systems in real-world operational contexts
- **Optimization focus**: Cost/performance tuning for production AI systems

### Repo proof

- deterministic scaffolding
- schema-bound outputs
- bounded orchestration
- traceability
- clear retrieval and evaluation architecture

### Where each is stronger

- **Background is stronger** on real-world scale, operational complexity, and business outcomes
- **Repo is stronger** on clarity, inspectability, and showing design thinking in a concise artifact

### How to talk about each honestly

- background proves I have done this in real environments
- repo proves I can explain and package the system thinking clearly

## Project Alignment: What Needs to Reflect This Expertise

The current repo is a **documentation-heavy proof artifact** (by design). To make it actually reflect the 5/5 expertise level, the following would need implementation:

### Critical Gaps to Close

| Area | Current State | Required to Match Expertise |
|------|---------------|----------------------------|
| **Hybrid Retrieval** | Documented only | Working implementation of BM25 + vector + cross-encoder pipeline |
| **Vector Store** | Documented only | pgvector integration with embeddings, HNSW indexing, corpus versioning |
| **Prompt Infrastructure** | Documented only | Working prompt registry, versioning, A/B test routing |
| **CI Evaluation** | Vitest unit tests | Full eval framework with golden dataset, regression detection, quality gates |
| **Observability** | Pino logging | OTel tracing + Phoenix integration for LLM inspection |
| **Cost Tracking** | Documented only | Per-call cost accounting, budget enforcement |
| **Entity Model** | Documented only | Working SQL schema + repositories for Contractor/Project/Submission/Decision |

### Honest Framing for Recruiters

**What to say:**
- "This repo demonstrates architectural thinking at the infrastructure level"
- "The documentation proves I know how to build these systems from scratch"
- "I have production implementations of all these patterns - see my Trust-Score engine"
- "The gap between docs and code is intentional for inspectability, not a capability gap"

**What not to say:**
- Don't claim the retrieval pipeline is already built
- Don't imply the hybrid search is implemented
- Don't suggest the prompt infrastructure is running

### Differentiation Strategy

Most candidates will have:
- LangChain/LlamaIndex wrapper experience (3/5 or 4/5)
- Toy RAG demos (2/5 or 3/5)
- Basic Python scripting (3/5)

This profile has:
- **5/5 in all four dimensions** - rare combination
- **Core infrastructure** not wrapper usage
- **Production regulatory systems** (compliance domain)
- **Deterministic scaffolding** expertise

**Lead with the self-assessment in the first 30 seconds**, then immediately point to the Trust-Score engine and the comprehensive implementation docs as proof.

## How This Repo Proves Fit

### Doc-by-doc mapping

- `README.md`: quick framing and proof posture
- `docs/foundation/current-state.md`: honest implemented evidence
- `docs/foundation/implemented-vs-target.md`: maturity and architectural honesty
- `docs/foundation/tech-stack-map.md`: direct translation to requested stack (includes prompt infrastructure, Phoenix observability)
- `docs/architecture/retrieval-and-context.md`: strongest retrieval/context fit signal (includes speaker-based chunking, hybrid search, cross-encoder reranking, metadata filtering)
- `docs/architecture/api-and-integrations.md`: data-system and tool-use signal (Redshift, Elasticsearch, Salesforce patterns)
- `docs/evaluation/evaluation-strategy.md`: eval infrastructure signal (CI-based evaluation frameworks)
- `docs/architecture/system-overview.md`: entity abstractions and conversation intelligence data model
- `docs/showcase/founding-ai-infra-fit.md`: recruiter-friendly public fit summary

### File-by-file code mapping

- `src/entrypoints/wcp-entrypoint.ts`: orchestration boundary
- `src/mastra/tools/wcp-tools.ts`: deterministic logic
- `src/mastra/agents/wcp-agent.ts`: schema-bound decision layer
- `src/app.ts`: service/API boundary
- `src/utils/errors.ts`: production-minded failure modeling
- `tests/unit/test_wcp_tools.test.ts`: deterministic verification
- `tests/integration/test_wcp_integration.test.ts`: orchestration seam validation

## Talking Points

### Recruiter version

- This repo is a compact showcase for trustworthy AI infrastructure.
- It uses payroll compliance as a proving ground for retrieval, evals, and traceable decisions.
- The code is intentionally small, but the architecture and documentation show the full production system clearly.

### Hiring-manager version

- I separate correctness-critical logic from model reasoning by design.
- I treat retrieval/context assembly as infrastructure, not prompt tuning.
- I think about evaluation, traceability, and operational controls before scaling surface area.

### Deep technical version

- deterministic validation emits the factual substrate
- retrieval should be metadata-filtered, hybrid (BM25 + vector), reranked (cross-encoder), and citation-aware
- speaker-based chunking for transcript context assembly
- prompt infrastructure enables versioning, A/B testing, and per-account configuration
- decision synthesis should be schema-bound and confidence-routed
- replayable traces and CI evals are part of the release contract
- Phoenix-style observability integrated into AI workflows
- entity abstractions (Rep, Call, Opportunity, Moment) support cross-call behavioral insights

## Likely Objections

### "This is still a proof artifact"

Response:
- Correct. That is intentional.
- The point is to make the system thinking inspectable and credible without pretending the platform is complete.

### "Stack mismatch because the repo is TS-heavy"

Response:
- The role's core challenges are architectural, not language-specific.
- The docs explicitly map the current stack to the target production stack they care about.

### "Limited current retrieval implementation"

Response:
- Also true.
- The repo proves I know where retrieval belongs in the architecture and how to operationalize it, rather than pretending a toy vector search equals infra maturity.

## What To Emphasize

- deterministic scaffolding
- traceability and auditability
- evaluation discipline
- retrieval/context architecture
- production instincts under ambiguity
- architectural honesty

## What Not To Say

- do not say this is a complete production system
- do not call this "prompt engineering" work
- do not talk as if the value is mainly the demo
- do not imply the static rate logic equals the full retrieval layer
- do not lead with the UI or toy scenarios

## Interview Prep

### System design questions to expect

- how would you evolve this from toy payloads to real document ingestion?
- how would you build retrieval over wage and transcript/CRM data?
- how would you prevent regressions in prompts or retrieval?
- how would you design human-review routing?
- how would you monitor false approvals?
- how would you implement speaker-based chunking for call transcripts?
- how would you set up cross-encoder reranking in a hybrid search pipeline?
- how would you design a CI-based evaluation framework for prompt changes?
- how would you build prompt versioning, A/B testing, and per-account configuration?
- how would you integrate Phoenix-style observability into AI workflows?
- how would you design entity abstractions (Rep, Call, Opportunity, Moment) for conversation intelligence?

### Stories and examples to prepare

- a system-from-scratch story
- a retrieval or context-quality story (include speaker-based chunking if relevant)
- a hybrid search with reranking story
- an eval or regression-prevention story (include CI-based eval frameworks)
- a cost/latency optimization story (include prompt infrastructure and cost tracking)
- a production incident or operational debugging story
- a conversation intelligence or entity modeling story

### Questions to ask them

- what currently generates the most trust failures in your AI features?
- how are retrieval and context assembly handled today?
- what does your current eval loop look like?
- how do you track cost, latency, and user trust degradation?
- what data systems are the hardest to ground model behavior against?

### Architecture whiteboard framing

- start with data sources
- show deterministic preprocessing and normalization
- show retrieval and metadata filters
- show bounded decision synthesis
- end with traces, evals, and release gates

## Application Ops

- **Availability**: full-time, 40h/week
- **Start timeline**: ASAP
- **Comp notes**: keep flexible, but anchor on infrastructure ownership and impact

### Tailoring checklist before outreach or interview

1. Re-read the JD and align examples to retrieval, evals, and systems ownership.
2. Make sure the first docs linked are `README`, `current-state`, `implemented-vs-target`, `tech-stack-map`, and `founding-ai-infra-fit`.
3. Prepare one short and one deep explanation for why compliance is the right proving ground.
4. Be ready to explain the language mismatch honestly and confidently.
5. Avoid overstating what the repo implements today.
