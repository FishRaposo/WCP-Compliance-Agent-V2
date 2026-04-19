# Phase 02: MVP

> **This file is preserved for reference detail.**
> The single authoritative release plan is **[RELEASE_PLAN.md](./RELEASE_PLAN.md)**.
> Phase 02 plans are in the [Phase 02 section](./RELEASE_PLAN.md#phase-02-mvp--in-progress) of that document.

Status Label: Designed / Target

**Duration**: Weeks 5-12 (8 weeks)  
**Effort**: 15-20 hrs/week  
**Dependencies**: Phase 01 complete (architecture aligned, testing operational)  
**Exit Gate**: Working hybrid retrieval, real WCP decisions, 11-field extraction

---

## Objectives

1. **Implement hybrid retrieval pipeline**: BM25 + vector search + cross-encoder reranking (documented but stubbed)
2. **Build vector storage infrastructure**: pgvector with HNSW indexing and corpus versioning
3. **Expand data extraction**: From 3 fields to full 11-field WCP data model
4. **Implement prompt infrastructure**: Registry, versioning, basic A/B testing framework
5. **Create CI evaluation framework**: Golden dataset, regression detection, quality gates
6. **✅ Implement compliance layer**: Deterministic validation, audit trail, regulatory citations

---

## Exit Gate Criteria

All must be true to proceed to Phase 03:

- [ ] Hybrid retrieval working end-to-end (not stubbed)
  - [ ] BM25 search via Elasticsearch
  - [ ] Vector search via pgvector
  - [ ] Cross-encoder reranking functional
  - [ ] Combined pipeline integrated with agent
- [ ] Real (non-mock) WCP processing
  - [ ] PDF ingestion functional
  - [ ] CSV ingestion functional
  - [ ] 11-field data extraction working
- [ ] Prompt infrastructure operational
  - [ ] Prompt registry with PostgreSQL backend
  - [ ] Version resolution working
  - [ ] Basic experiment assignment functional
- [ ] CI evaluation framework
  - [ ] Golden dataset (50+ labeled submissions)
  - [ ] GitHub Actions workflow
  - [ ] Quality gates defined
- [ ] Expanded DBWD coverage
  - [ ] 10+ roles in configuration (not hardcoded)
  - [ ] Dynamic rate loading
- [x] **Three-layer validation pipeline operational**
  - [x] Layer 1: Deterministic scaffold (extraction, DBWD lookup, rule checks)
  - [x] Layer 2: LLM verdict (reasoning over findings, check ID citation)
  - [x] Layer 3: Trust score + human review (0.35/0.25/0.20/0.20 formula)
  - [x] Orchestrator composing all layers
  - [x] CI enforcement: `npm run lint:pipeline` passes
  - [x] Trust calibration: >95% detection, <2% false-approve

---

## Key Deliverables

### 1. Hybrid Retrieval Pipeline

**Status**: Designed / Target — Documented but stubbed

**Architecture**:
```
Query
  ├── BM25 (Elasticsearch) ──┐
  │   Keyword matching      │
  │   Fuzzy match tolerance  │
  └── Vector (pgvector) ─────┼──► Reciprocal Rank Fusion ──► Cross-Encoder ──► Results
      Semantic similarity   │      Combine scores          Re-rank top 20
      HNSW index            │      Deduplicate
```

**Current State**:
- 🔲 BM25: Not implemented
- 🔲 Vector search: Not implemented
- 🔲 Cross-encoder: Not implemented
- 🔲 Fusion algorithm: Documented only

**Target State**:
- BM25 hits + Vector hits → RRF scoring → Cross-encoder reranking → Top-K results
- MRR @ 1 > 0.6 on test queries
- Latency P95 < 300ms

**Documentation**:
- [x] Implementation guide exists: `docs/implementation/05-retrieval-hybrid-rerank.md`
- [x] ADR-002 documents the approach

**Time Estimate**: 20 hours

---

### 2. Vector Storage Infrastructure

**Status**: Designed / Target

**Technology Stack**:
- PostgreSQL + pgvector extension
- HNSW index for fast similarity search
- OpenAI text-embedding-3-small for embeddings (1536-dim)
- Vector dimension: 1536
- Distance metric: Cosine similarity

**Schema**:
```sql
CREATE TABLE wage_determination_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wd_id VARCHAR(50) NOT NULL,           -- SAM.gov WD number
    job_title VARCHAR(200) NOT NULL,
    locality VARCHAR(100),
    wage_rate DECIMAL(10,2),
    fringe_rate DECIMAL(10,2),
    effective_date DATE,
    embedding VECTOR(1536),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON wage_determination_vectors 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

**Current State**:
- 🔲 No database setup
- 🔲 No vector storage
- 🔲 No embeddings generated

**Documentation**:
- [x] Implementation guide: `docs/implementation/04-vector-pgvector.md`

**Time Estimate**: 12 hours

---

### 3. Full 11-Field Data Extraction

**Status**: Designed / Target

**Current WCP Schema** (3 fields):
```typescript
interface WCPData {
  role: string;     // Worker classification
  hours: number;    // Total hours worked
  wage: number;     // Hourly wage rate
}
```

**Target WCP Report Schema** (11 fields):
```typescript
interface WCPReport {
  // Worker identification
  workerName: string;
  socialSecurityLast4: string;  // Masked for privacy
  
  // Classification
  role: string;
  tradeCode: string;           // DBWD trade classification
  localityCode: string;          // County/locality code
  
  // Hours
  hoursByDay: {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
  };
  totalHours: number;
  
  // Wage components
  baseRate: number;            // Straight time rate
  overtimeRate: number;        // 1.5x base
  fringeRate: number;        // Fringe benefits per hour
  totalRate: number;         // base + fringe
  
  // Pay calculation
  grossPay: number;            // (straight_hours × base) + (ot_hours × ot_rate) + (all_hours × fringe)
}
```

**Current State**:
- ✅ Regex extraction for role/hours/wage
- 🔲 PDF ingestion
- 🔲 CSV parsing
- 🔲 OCR fallback
- 🔲 Field validation

**Documentation**:
- [x] Implementation guide: `docs/implementation/10-entity-data-model.md`

**Time Estimate**: 16 hours

---

### 4. Three-Layer Validation Pipeline

**Status**: Structurally Implemented, Data Stubbed

**Architecture**:
```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Deterministic Scaffold (NO AI)                    │
│  - Extract: Regex-based WCP data extraction                  │
│  - Lookup: DBWD rate retrieval                             │
│  - Check: Wage, overtime, fringe validation                │
│  - Output: DeterministicReport                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: LLM Verdict (Reasoning ONLY)                      │
│  - Review: DeterministicReport findings                   │
│  - Decide: Approved / Revise / Reject                       │
│  - Cite: Reference specific check IDs                       │
│  - Constraint: MUST NOT recompute values                   │
│  - Output: LLMVerdict                                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Trust Score + Human Review (Governance)        │
│  - Compute: trust = 0.35×det + 0.25×class + 0.20×llm + 0.20×agree │
│  - Threshold: ≥0.85 auto, 0.60-0.84 flag, <0.60 require_human │
│  - Enqueue: Low-trust to human review queue               │
│  - Audit: Full decision trail                              │
│  - Output: TrustScoredDecision                             │
└─────────────────────────────────────────────────────────────┘
```

**What Exists**:
- ✅ All three layers implemented (`src/pipeline/layer1-*.ts`, `layer2-*.ts`, `layer3-*.ts`)
- ✅ Orchestrator (`src/pipeline/orchestrator.ts`)
- ✅ Trust scoring with hybrid formula
- ✅ Human review queue stub (in-memory)
- ✅ CI enforcement (`npm run lint:pipeline`)
- ✅ Calibration tests (`npm run test:calibration`)

**What Uses Hardcoded Data**:
- 🔲 DBWD rates (only Electrician, Laborer hardcoded)
- 🔲 Human review queue (no persistence)

**Trust Formula**:
```
trust = 0.35 × deterministic_score
      + 0.25 × classification_confidence
      + 0.20 × llm_self_confidence
      + 0.20 × agreement_score
```

**Thresholds**:
- ≥0.85: Auto-decide
- 0.60–0.84: Flag for review
- <0.60: Require human review

**Documentation**:
- [x] Decision architecture doctrine: `docs/architecture/decision-architecture.md`
- [x] Trust scoring: `docs/architecture/trust-scoring.md`
- [x] Human review workflow: `docs/architecture/human-review-workflow.md`

**Time Estimate**: 16 hours (already complete — structural implementation done)

---

### 5. Prompt Infrastructure

**Status**: Designed / Target

**Components**:
- Prompt registry (PostgreSQL-backed)
- Version resolution (per-org overrides, experiment assignment)
- A/B testing framework

**Current State**:
- 🔲 No prompt registry
- 🔲 No versioning
- 🔲 No experiments

**Documentation**:
- [x] Implementation guide: `docs/implementation/07-prompt-infrastructure.md`

**Time Estimate**: 20 hours

---

### 6. CI Evaluation Framework

**Status**: Designed / Target

**Components**:
- Golden dataset (50+ labeled WCP submissions)
- Automated evaluation pipeline (GitHub Actions)
- Quality gates (accuracy, false-approve rate, latency)

**Current State**:
- ✅ Unit tests (Vitest)
- ✅ Integration tests
- ✅ Calibration tests (22 golden examples)
- 🔲 GitHub Actions workflow
- 🔲 Regression detection
- 🔲 Release gates

**Golden Set Requirements**:
- 50–100 labeled examples
- Cover all violation types (underpay, overtime, fringe, classification)
- Include edge cases (unknown roles, ambiguous hours)
- Ground truth labeled by domain expert

**Quality Gates**:
| Gate | Threshold | Block Release? |
|------|-----------|----------------|
| Verdict accuracy | ≥ 90% | Yes |
| False-approve rate | < 2% | Yes |
| Schema pass rate | ≥ 99% | Yes |
| Latency regression | < 1.5x baseline | Warning |

**Documentation**:
- [x] Evaluation strategy: `docs/evaluation/evaluation-strategy.md`
- [x] Quality bar: `docs/evaluation/quality-bar.md`

**Time Estimate**: 16 hours

---

## Success Criteria

| Deliverable | Status | Time (Est) |
|-------------|--------|------------|
| Hybrid retrieval | 🔲 Not started | 20h |
| Vector storage | 🔲 Not started | 12h |
| 11-field extraction | 🔲 Not started | 16h |
| **Three-layer pipeline** | ✅ Complete | 16h ✓ |
| Prompt infrastructure | 🔲 Not started | 20h |
| CI evaluation | 🔄 Partial | 16h |

---

## Critical Path

```
Vector Storage (pgvector)
    ↓
Hybrid Retrieval (BM25 + vector + rerank)
    ↓
11-Field Extraction (PDF/CSV ingestion)
    ↓
CI Evaluation (GitHub Actions, golden set)
    ↓
Phase 03: Showcase
```

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| pgvector setup complexity | Medium | High | Use Supabase free tier; test locally first |
| PDF extraction accuracy | High | Medium | Start with CSV; add PDF later; use mock WCPs for testing |
| Golden set labeling time | Medium | High | Prioritize 50 high-quality over 100 mediocre |
| OpenAI costs | Medium | Medium | Use mock mode for development; cache embeddings |

---

## Next Actions

1. **Set up PostgreSQL + pgvector** (local or Supabase)
2. **Create DBWD corpus ETL** (SAM.gov → embeddings)
3. **Implement BM25 search** (Elasticsearch or Meilisearch)
4. **Build PDF ingestion pipeline** (OCR fallback)
5. **Expand WCP schema** from 3 → 11 fields
6. **Create GitHub Actions workflow** for tests
7. **Build golden dataset** (50+ labeled examples)

---

**Last Updated**: 2026-04-17  
**Status**: Phase 01 complete, ready for Phase 02 execution
