# Phase 02: MVP

> ⚠️ **DEPRECATED** — See [`docs/roadmap/RELEASE_PLAN.md`](../docs/roadmap/RELEASE_PLAN.md) for the current unified release plan.

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
- [ ] **Three-layer validation pipeline operational**
  - [ ] Layer 1: Deterministic scaffold (extraction, DBWD lookup, rule checks)
  - [ ] Layer 2: LLM verdict (reasoning over findings, check ID citation)
  - [ ] Layer 3: Trust score + human review (0.35/0.25/0.20/0.20 formula)
  - [ ] Orchestrator composing all layers
  - [ ] CI enforcement: `npm run lint:pipeline` passes
  - [ ] Trust calibration: >95% detection, <2% false-approve

## Key Deliverables

### 1. Hybrid Retrieval Pipeline

**Current State**: `throw new Error('Not implemented - retrieval pipeline required')` [src: 05-retrieval-hybrid-rerank.md:560]

**Target State**:
```typescript
// Working retrieval tool
export const retrieveEvidenceTool = createTool({
  id: "retrieve-evidence",
  execute: async ({ query, tradeCode, localityCode }) => {
    // 1. Hybrid search (BM25 + vector)
    const candidates = await hybridSearch({ query, filters: { tradeCode, localityCode } });
    // 2. Cross-encoder reranking
    const ranked = await rerankCandidates(query, candidates);
    return { evidence: ranked.slice(0, 10) };
  },
});
```

**Tasks**:
- [ ] Set up Elasticsearch cluster (managed or Docker)
- [ ] Create index mappings for policy documents
- [ ] Build BM25 search interface
- [ ] Set up PostgreSQL + pgvector (Supabase or local)
  - [ ] Install pgvector extension
  - [ ] Create embeddings table with HNSW index
  - [ ] Build vector repository class
- [ ] Set up embedding service (OpenAI text-embedding-3)
- [ ] Build cross-encoder integration (sentence-transformers or API)
- [ ] Combine into hybrid pipeline
- [ ] Integrate with WCP agent

**Time Estimate**: 24 hours (3 hours × 8 sub-tasks)

### 2. Vector Storage Infrastructure

**Current State**: Documented but stubbed [src: 04-vector-pgvector.md]

**Target State**:
```sql
-- Working pgvector schema
CREATE TABLE corpus_embeddings (
    embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id VARCHAR(100) NOT NULL,
    corpus_version_id VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),  -- OpenAI text-embedding-3-small
    metadata JSONB
);
CREATE INDEX idx_embeddings_vector ON corpus_embeddings 
    USING hnsw (embedding vector_cosine_ops);
```

**Tasks**:
- [ ] Provision PostgreSQL with pgvector
  - Option A: Supabase (free tier, managed)
  - Option B: Docker locally
  - Option C: AWS RDS (if credits available)
- [ ] Create schema migration system
- [ ] Build embedding service wrapper
- [ ] Implement chunk ingestion pipeline
- [ ] Add corpus versioning support
- [ ] Build similarity search with filters

**Time Estimate**: 12 hours

### 3. Document Processing (PDF/CSV)

**Current State**: Text extraction only [src: _archive/TODO.md:98]

**Target State**:
```typescript
export const extractWCPTool = createTool({
  id: "extract-wcp",
  inputSchema: z.object({
    content: z.union([z.string(), z.instanceof(Buffer)]), // Text or PDF
    format: z.enum(["text", "pdf", "csv"]).default("text"),
  }),
  // Extracts full 11-field WCP data
});
```

**Tasks**:
- [ ] Install `pdf-parse` package
- [ ] Build PDF text extraction pipeline
  - [ ] Text extraction
  - [ ] Metadata extraction
  - [ ] Table detection (for payroll data)
- [ ] Install `csv-parser` or `papaparse`
- [ ] Build CSV parsing with column mapping
- [ ] Handle various CSV formats
- [ ] Add error handling for corrupted files
- [ ] Write tests for each format

**Time Estimate**: 16 hours

### 4. Full 11-Field Data Extraction

**Current State**: 3 fields (role, hours, wage) [src: src/types/index.ts:25]

**Target State**:
```typescript
export interface WCPReport {
  // Existing
  role: string;
  hours: number;
  wage: number;
  // New fields
  workerName: string;
  tradeCode: string;
  localityCode: string;
  hoursByDay: { mon: number; tue: number; /* ... */ };
  baseRate: number;
  fringeRate: number;
  projectName: string;
  subcontractor: string;
  signaturePresent: boolean;
}
```

**Tasks**:
- [ ] Update TypeScript interfaces
- [ ] Update Zod validation schemas
- [ ] Enhance regex patterns for new fields
- [ ] Add LLM-based extraction fallback
- [ ] Implement field validation logic
- [ ] Handle multiple employees per WCP
- [ ] Test with sample documents

**Time Estimate**: 12 hours

### 5. Prompt Infrastructure

**Current State**: Schema defined, no implementation [src: 07-prompt-infrastructure.md:486]

**Target State**:
```typescript
// Working prompt registry
export class PostgresPromptRegistry implements PromptRegistry {
  async resolve(promptId: string, context: ResolutionContext): Promise<ResolvedPrompt> {
    // 1. Check org overrides
    // 2. Check running experiments
    // 3. Return resolved prompt with version info
  }
}
```

**Tasks**:
- [ ] Create PostgreSQL schema for prompts
  - [ ] prompts table
  - [ ] prompt_versions table
  - [ ] prompt_experiments table
  - [ ] org_prompt_config table
- [ ] Build prompt registry service
- [ ] Implement version resolution logic
- [ ] Add experiment assignment (deterministic hashing)
- [ ] Create A/B test management API
- [ ] Integrate with WCP agent

**Time Estimate**: 20 hours

### 6. Three-Layer Validation Pipeline

**Current State**: Documented in ADR-005, partial implementation

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Deterministic Scaffold (NO AI)                      │
│  - Extract: Regex-based WCP data extraction                  │
│  - Lookup: DBWD rate retrieval                               │
│  - Check: Wage, overtime, fringe validation                  │
│  - Output: DeterministicReport                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: LLM Verdict (Reasoning ONLY)                      │
│  - Review: DeterministicReport findings                     │
│  - Decide: Approved / Revise / Reject                       │
│  - Cite: Reference specific check IDs                       │
│  - Constraint: MUST NOT recompute values                   │
│  - Output: LLMVerdict                                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Trust Score + Human Review (Governance)          │
│  - Compute: trust = 0.35×det + 0.25×class + 0.20×llm + 0.20×agree │
│  - Threshold: ≥0.85 auto, 0.60-0.84 flag, <0.60 require_human │
│  - Enqueue: Low-trust to human review queue                 │
│  - Audit: Full decision trail                               │
│  - Output: TrustScoredDecision                              │
└─────────────────────────────────────────────────────────────┘
```

**Target State**:
- All three layers operational end-to-end
- `executeDecisionPipeline()` is the ONLY valid entry point
- Trust score correctly correlates with accuracy
- Human review queue functional (stub or real)
- CI enforcement: `npm run lint:pipeline` passes

**Tasks**:
- [ ] Finalize Layer 1 deterministic scaffold
- [ ] Implement Layer 2 LLM verdict with constraint enforcement
- [ ] Build Layer 3 trust score computation
- [ ] Create human review queue service
- [ ] Build orchestrator to compose all three layers
- [ ] Implement CI lint script for architecture enforcement
- [ ] Add trust calibration golden set tests

**Time Estimate**: 16 hours

### 7. CI Evaluation Framework

**Current State**: Strategy documented, no implementation [src: docs/evaluation/]

**Target State**:
```yaml
# .github/workflows/evaluation.yml
- name: Run Evaluation
  run: npm run eval:ci -- --dataset=wcp-golden
- name: Check Gates
  run: npx ts-node scripts/check-eval-gates.ts eval-results.json
```

**Tasks**:
- [ ] Create golden dataset (50-100 labeled submissions)
  - [ ] Define schema for evaluation cases
  - [ ] Create synthetic examples
  - [ ] Label with expected outcomes
- [ ] Build evaluation runner
  - [ ] Parallel execution
  - [ ] Result recording
  - [ ] Metric calculation
- [ ] Define scoring rubrics
  - [ ] Outcome accuracy
  - [ ] Finding precision/recall
  - [ ] Citation coverage
- [ ] Create quality gates
  - [ ] Threshold configuration
  - [ ] Gate checking logic
- [ ] Set up GitHub Actions workflow

**Time Estimate**: 16 hours

### 7. Expanded DBWD Coverage

**Current State**: 2 roles hardcoded [src: src/mastra/tools/wcp-tools.ts:35]

**Target State**:
```yaml
# config/dbwd-rates.yaml
rates:
  Electrician: { base: 51.69, fringe: 34.63 }
  Laborer: { base: 26.45, fringe: 12.50 }
  Plumber: { base: 48.20, fringe: 28.10 }
  Carpenter: { base: 45.00, fringe: 25.00 }
  Mason: { base: 42.50, fringe: 22.50 }
  # ... 10+ roles
```

**Tasks**:
- [ ] Research common DBWD roles and rates
- [ ] Create YAML/JSON configuration file
- [ ] Build config loader with validation
- [ ] Add hot-reload capability (optional)
- [ ] Update extraction to use config
- [ ] Add role alias support
- [ ] Write validation tests

**Time Estimate**: 6 hours

### 8. Compliance Layer Implementation ⭐ NEW

**Current State**: Deterministic validation stubbed, no audit trail, no regulatory citations

**Target State**:
```typescript
// Working compliance validation
interface ComplianceValidation {
  // 1. Deterministic wage validation
  validatePrevailingWage(wage: number, dbwdRate: DBWDRate): ValidationResult;
  
  // 2. Overtime calculation (1.5x base, fringe excluded)
  validateOvertime(hours: number, rate: number, dbwdRate: DBWDRate): ValidationResult;
  
  // 3. Audit trail with trace IDs
  traceId: string; // e.g., "wcp-2024-01-15-001"
  replay(): Promise<Decision>; // Identical results guaranteed
  
  // 4. Regulatory citations
  citations: {
    statute: string; // "40 U.S.C. § 3142(a)"
    dbwdId: string; // "ELEC0490-002"
    effectiveDate: string;
  }[];
}
```

**Components**:

#### 8.1 Deterministic Validation Engine

**Regulation**: 40 U.S.C. § 3142(a) - Prevailing wage  
**Implementation**:
- Exact arithmetic comparison (no LLM estimation)
- DBWD rate lookup with version tracking
- Underpayment calculation with cents precision

**Exit Criteria**:
- [ ] Unit tests for all validation paths
- [ ] 100% arithmetic accuracy verified
- [ ] Golden set of 20+ wage validation cases

#### 8.2 Audit Trail Infrastructure

**Regulation**: Copeland Act (40 U.S.C. § 3145) - Record keeping  
**Implementation**:
- Immutable decision records with trace IDs
- PostgreSQL storage with 7-year retention
- Replay capability for any decision

**Exit Criteria**:
- [ ] Every decision has unique trace ID
- [ ] Decision replay produces identical results
- [ ] 100% replay success rate on test set

#### 8.3 Classification Validation

**Regulation**: 29 CFR 5.5(a)(3)(i) - Accurate classification  
**Implementation**:
- Hybrid classification (exact + alias + semantic)
- Confidence thresholds with human escalation
- DBWD classification identifier tracking

**Exit Criteria**:
- [ ] 10+ trade classifications supported
- [ ] 85%+ classification accuracy
- [ ] Low-confidence cases escalate correctly

#### 8.4 Overtime Validation

**Regulation**: 40 U.S.C. § 3702 - Overtime compensation  
**Implementation**:
- 40-hour threshold detection
- 1.5× base rate calculation
- Fringe exclusion from overtime multiplier

**Exit Criteria**:
- [ ] Detects same-rate-for-all-hours errors
- [ ] Calculates correct 1.5× rate
- [ ] Identifies fringe miscalculation errors

#### 8.5 Compliance Testing Framework

**Regulation**: 29 CFR Part 3 - Labor standards enforcement  
**Implementation**:
- Compliance-specific test suite
- Violation detection rate tracking
- False-approve rate monitoring

**Exit Criteria**:
- [ ] >95% violation detection rate
- [ ] <2% false-approve rate
- [ ] All common violation patterns covered

**Time Estimate**: 18 hours (3-4 hours per component)

## Resource Requirements

### Time Allocation

| Week | Focus | Hours | Key Output |
|------|-------|-------|------------|
| 5 | Elasticsearch setup, BM25 search | 18 | Working ES search |
| 6 | pgvector setup, embeddings | 18 | Vector storage operational |
| 7 | PDF parsing | 18 | PDF extraction working |
| 8 | CSV parsing, 11-field extraction | 18 | Full data extraction |
| 9 | Prompt registry schema, Compliance validation engine | 18 | DB schema, basic registry, deterministic validation |
| 10 | Prompt A/B testing, Audit trail infrastructure | 18 | Working prompt infrastructure, trace IDs, replay |
| 11 | Golden dataset, Classification validation | 18 | CI eval framework, hybrid classification |
| 12 | Compliance testing, Buffer, integration | 16 | Compliance framework, end-to-end validation |

**Total**: ~160 hours over 8 weeks (~20 hrs/week average)

### Financial Costs

| Service | Monthly Cost | Notes |
|---------|---------------|-------|
| OpenAI API | $30-50 | Embeddings + completions (heaviest usage) |
| Supabase (pgvector) | $0-25 | Free tier should suffice initially |
| Elasticsearch | $0 | Self-host locally or use trial |
| Hosting (for testing) | $0-20 | Local development primarily |
| **Phase 02 Total** | **$30-95/month** | Most expensive phase |

### Risk Budget

- **API cost overrun**: Set hard limit at $100/month, use caching aggressively
- **Infrastructure complexity**: Use managed services (Supabase), not self-hosted
- **Time overrun**: Prioritize hybrid retrieval + extraction, defer prompt infrastructure if needed

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Vector DB setup failure | Medium | High | Use Supabase managed, fallback to simpler in-memory for MVP |
| Cross-encoder latency | Medium | Medium | Use smaller model, cache results, async processing |
| PDF extraction quality | High | High | Multiple extraction strategies, LLM fallback |
| API cost explosion | Medium | High | Daily spend alerts, mock modes for testing |
| Scope creep | High | Critical | Strict weekly check-ins, defer non-critical features |

## Dependencies from Phase 01

**Required**:
- [ ] ADR-001 (Hybrid Retrieval) - architectural direction
- [ ] ADR-002 (Vector Storage) - pgvector decision
- [ ] ADR-003 (Prompt Infrastructure) - registry design
- [ ] Integration test scaffold - for validating components
- [ ] Updated `todo.md` - prioritized task list

**Nice to have**:
- [ ] ADR-004 (Testing Strategy) - test patterns
- [ ] CONTRIBUTING.md - development workflow

## Weekly Checkpoints

### Week 5
- [ ] Elasticsearch cluster running
- [ ] BM25 search interface built
- [ ] Week 5 retrospective: Infrastructure pain points?

### Week 6
- [ ] pgvector operational
- [ ] Embedding service working
- [ ] Week 6 retrospective: Vector search validated?

### Week 7
- [ ] PDF parsing functional
- [ ] Basic extraction working
- [ ] Week 7 retrospective: PDF quality acceptable?

### Week 8
- [ ] CSV parsing complete
- [ ] 11-field extraction working
- [ ] Week 8 retrospective: Data model solid?

### Week 9
- [ ] Prompt registry schema created
- [ ] Basic registry operations working
- [ ] Week 9 retrospective: DB design scalable?

### Week 10
- [ ] Experiment assignment working
- [ ] Agent integration complete
- [ ] Week 10 retrospective: Prompt infra useful?

### Week 11
- [ ] Golden dataset created
- [ ] Evaluation runner operational
- [ ] Week 11 retrospective: Eval framework valuable?

### Week 12
- [ ] End-to-end testing complete
- [ ] **Exit Gate Review**: All criteria met?
- [ ] Phase 03 planning started

## Interfaces to Phase 03

**What Phase 02 leaves ready**:
1. Working retrieval pipeline (query → evidence → decision)
2. Real document processing (PDF/CSV)
3. Extensible data model (11 fields)
4. Prompt infrastructure (versioned, testable)
5. Evaluation framework (measurable quality)

**What Phase 03 receives**:
- Technical foundation for public demo
- Measurable quality metrics
- Extensible architecture for feedback iteration

## Rollback Plan

If Phase 02 extends beyond 12 weeks:

**Priority cuts (in order)**:
1. **Week 11-12**: Reduce golden dataset to 20 examples (from 50)
2. **Week 9-10**: Simplify prompt infra (no A/B testing, just versioning)
3. **Week 7-8**: Defer CSV parsing (PDF only for MVP)
4. **Minimum viable exit**: Hybrid retrieval working + PDF extraction + 11 fields

## Success Metrics

### Objective
- [ ] Hybrid retrieval pipeline executes without errors
- [ ] Real PDF produces real decision (not mock)
- [ ] 11 fields extracted from test documents
- [ ] Prompt registry stores and retrieves versions
- [ ] CI evaluation runs on PR

### Performance
- [ ] Retrieval latency < 2 seconds
- [ ] PDF extraction < 5 seconds per page
- [ ] Vector search recall > 80% (measured)
- [ ] Cross-encoder precision improvement > 10% over BM25 alone

### Subjective
- [ ] Confident in retrieval quality
- [ ] System feels "real" not "demo"
- [ ] Ready for external users

---

**Previous Phase**: [01-phase-scaffolding.md](./01-phase-scaffolding.md)  
**Next Phase**: [03-phase-showcase.md](./03-phase-showcase.md)  
**Dependencies**: Must complete exit gates before showcase deployment
