# Phase 01: Scaffolding

> ⚠️ **DEPRECATED** — See [`docs/roadmap/RELEASE_PLAN.md`](../docs/roadmap/RELEASE_PLAN.md) for the current unified release plan.

**Duration**: Weeks 1-4  
**Effort**: 10-15 hrs/week  
**Dependencies**: Current codebase state (todo.md baseline)  
**Exit Gate**: Architecture aligned, testing operational, workflow established

---

## Objectives

1. **Align documentation with reality**: Ensure docs reflect actual codebase state
2. **Establish testing foundation**: Unit → Integration → E2E testing hierarchy
3. **Document architecture decisions**: Create ADRs for key technical choices
4. **Standardize development workflow**: Consistent patterns for solo development
5. **✅ Establish compliance documentation foundation**: Create regulatory traceability and compliance framework

## Exit Gate Criteria

All must be true to proceed to Phase 02:

- [ ] `todo.md` updated with current state (all 40 items categorized)
- [ ] Architecture Decision Records (ADRs) created for:
  - [ ] Hybrid retrieval approach (BM25 + vector + cross-encoder)
  - [ ] Vector storage choice (pgvector vs Pinecone/Weaviate)
  - [ ] Prompt infrastructure architecture
  - [ ] Testing strategy (Vitest + Playwright)
- [ ] **Compliance documentation foundation complete**:
  - [ ] Traceability matrix created (regulation ↔ code mapping)
  - [ ] Regulatory compliance report complete
  - [ ] Implementation guide for developers
  - [ ] JSDoc standards for regulatory citations established
- [ ] Testing framework operational:
  - [ ] Unit tests passing (Vitest)
  - [ ] Integration test scaffold ready
  - [ ] E2E test plan documented
- [ ] Development workflow documented:
  - [ ] Git branching strategy
  - [ ] Commit message conventions
  - [ ] Code review checklist (self-review)
  - [ ] Documentation update triggers

## Key Deliverables

### 1. Documentation Audit & Alignment

**Deliverable**: Updated `todo.md` with honest state assessment

**Tasks**:
- [ ] Review all 40 items in current `todo.md`
- [ ] Mark completed items (check off)
- [ ] Re-categorize items that have shifted (Blocker → Active → Backlog)
- [ ] Add new items discovered during audit
- [ ] Remove or mark "Won't Fix" with reasoning

**Time Estimate**: 4 hours

### 2. Architecture Decision Records

**Deliverable**: `docs/adrs/` folder with 4 ADRs

**Format**:
```markdown
# ADR-001: Hybrid Retrieval Architecture

## Status
Accepted

## Context
Need to combine keyword and semantic search for policy documents...

## Decision
Use BM25 (Elasticsearch) + vector (pgvector) with cross-encoder reranking...

## Consequences
- Positive: Best of both search paradigms
- Negative: More infrastructure to maintain
- Mitigation: Use managed services
```

**ADRs to Create**:
1. ADR-001: Hybrid Retrieval (BM25 + vector + cross-encoder)
2. ADR-002: Vector Storage (pgvector over Pinecone/Weaviate)
3. ADR-003: Prompt Infrastructure (DB-backed vs file-based)
4. ADR-004: Testing Strategy (Vitest + Playwright hierarchy)

**Time Estimate**: 6 hours (1.5 hrs each)

### 3. Testing Framework

**Deliverable**: Operational test hierarchy

**Current State**: Unit tests with Vitest (197 tests, 169 passing)

**Target State**:
```
tests/
├── unit/              # Existing - individual functions
│   └── test_wcp_tools.test.ts
├── integration/       # New - component interactions
│   └── test_retrieval_pipeline.test.ts (stub)
└── e2e/              # New - full workflows
    └── test_decision_flow.test.ts (planned)
```

**Tasks**:
- [ ] Create integration test scaffold
  - [ ] Test database setup/teardown
  - [ ] API endpoint testing with Hono
  - [ ] Tool integration tests
- [ ] Document E2E test plan
  - [ ] Playwright configuration
  - [ ] Critical user flows to test
  - [ ] Mock external services strategy

**Time Estimate**: 8 hours

### 4. Development Workflow

**Deliverable**: `.github/CONTRIBUTING.md` (for self)

**Sections**:
- **Branching**: `main`, `feature/phase-02-retrieval`, `fix/bug-name`
- **Commits**: Conventional commits (`feat:`, `fix:`, `docs:`, `test:`)
- **Self-Review Checklist**:
  - [ ] Tests pass (`npm test`)
  - [ ] TypeScript compiles (`npm run build`)
  - [ ] Documentation updated
  - [ ] `todo.md` updated if tasks completed
  - [ ] ADR created if architectural decision made
- **Documentation Triggers**: Update docs when...
  - New architecture pattern introduced
  - Public API changes
  - Evaluation strategy changes

**Time Estimate**: 2 hours

### 5. Compliance Documentation Foundation ⭐ NEW

**Deliverable**: Complete compliance documentation suite

**Regulatory Basis**: 
- 29 CFR Part 3 (Copeland Act record keeping)
- 29 CFR 5.5 (compliance procedures)
- 40 U.S.C. §§ 3141-3145 (Davis-Bacon Act requirements)

**Why This Matters**: 
The WCP Compliance Agent operates in a **regulated domain**—federal construction contracts subject to Davis-Bacon Act. Compliance cannot be an afterthought; it must be architected from Day 1. This documentation establishes the regulatory framework that all subsequent development must adhere to.

**Documents to Create**:

| Document | Purpose | Regulation Coverage |
|----------|---------|---------------------|
| `docs/compliance/traceability-matrix.md` | Bidirectional mapping: regulation ↔ code ↔ test | All Davis-Bacon regulations |
| `docs/compliance/regulatory-compliance-report.md` | System compliance narrative | 40 U.S.C. §§ 3141-3145 |
| `docs/compliance/implementation-guide.md` | Developer patterns for "regulations → code" | 29 CFR 5.22, 5.23 |
| `docs/foundation/wcp-and-dbwd-reference.md` | Domain requirements reference | WH-347, SAM.gov |

**Key Components**:

1. **Traceability Matrix**
   - Forward: Regulation → Implementation location
   - Reverse: Code function → Regulations enforced
   - Test coverage mapping per regulation
   - Quick reference for auditors and developers

2. **Regulatory Compliance Report**
   - 8 major compliance sections (Applicability through Statement of Compliance)
   - Real validation examples with JSON outputs
   - Compliance metrics (detection rates, false-approve rates)
   - Audit trail requirements

3. **Implementation Guide**
   - 4 core patterns: Deterministic Validation, Hybrid Classification, Overtime Calculation, Audit Trail
   - "How Regulations Become Code" walkthroughs
   - Code examples with regulatory citations
   - Common pitfalls and solutions

4. **JSDoc Standards**
   - Module-level regulatory basis documentation
   - Function-level statute citations
   - Cross-references to compliance documentation
   - Deterministic validation rationale

**Inline Documentation Requirements**:

Every validation function must include:
```typescript
/**
 * Regulatory Basis:
 * - 40 U.S.C. § 3142(a): Prevailing wage requirements
 * - 29 CFR 5.22: Fringe benefits
 * 
 * Why Deterministic:
 * LLMs can hallucinate wage rates. Deterministic code guarantees:
 * - 100% arithmetic accuracy
 * - Reproducible results for audit
 * 
 * @see docs/compliance/traceability-matrix.md
 */
```

**Time Estimate**: 8 hours (2 hrs per document)

**Exit Criteria**:
- [ ] All 4 compliance documents created and reviewed
- [ ] At least 20 regulations mapped to planned implementation
- [ ] Source files (wcp-tools.ts, wcp-entrypoint.ts) have regulatory JSDoc
- [ ] Cross-document references functional
- [ ] Navigation (INDEX.md, README.md) updated with compliance section

## Resource Requirements

### Time Allocation

| Week | Focus | Hours | Key Output |
|------|-------|-------|------------|
| 1 | Documentation audit, ADR-001, Compliance docs start | 12 hrs | Updated todo.md, Hybrid Retrieval ADR, Traceability matrix draft |
| 2 | ADR-002, ADR-003, Testing scaffold, Compliance docs | 15 hrs | Vector storage ADR, Prompt ADR, Integration test setup, Compliance report |
| 3 | ADR-004, Testing implementation, Compliance docs | 12 hrs | Testing ADR, Integration tests operational, Implementation guide complete |
| 4 | Compliance docs completion, Workflow docs, Review | 8 hrs | All compliance docs finalized, CONTRIBUTING.md, Phase 02 planning |

### Tools & Costs

| Item | Cost | Notes |
|------|------|-------|
| Existing codebase | $0 | Starting point |
| GitHub | $0 | Public repo |
| Vitest | $0 | Already in devDependencies |
| Playwright | $0 | Will add to devDependencies |
| Time investment | ~47 hrs | Over 4 weeks |

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Over-engineering documentation | High | Medium | Time-box each ADR to 2 hrs max |
| Scope creep in testing | Medium | Low | Focus on scaffold, not full suite |
| Perfectionism blocking progress | High | High | Exit gates are clear, stick to them |
| Undiscovered technical debt | Medium | Medium | Buffer week 4 for surprises |

## Dependencies from Current State

From `todo.md` (current baseline):
- 8 Blockers identified (infrastructure gaps)
- 6 Active Sprint items (next features)
- 10 Backlog items (future)
- 9 Tech Debt items (cleanup)

**Phase 01 does NOT implement these** - it documents and prepares for Phase 02 implementation.

## Interfaces to Phase 02

**What Phase 01 leaves ready**:
1. Clear list of what to build (prioritized `todo.md`)
2. Architectural decisions recorded (ADRs)
3. Testing patterns established (integration test examples)
4. Development workflow defined (CONTRIBUTING.md)

**What Phase 02 receives**:
- Stable foundation for heavy infrastructure work
- Testing scaffold for validating retrieval implementation
- Documentation standards for new code

## Rollback Plan

If Phase 01 extends beyond 4 weeks:
1. **Cut ADR scope**: Focus on 2 most critical (Hybrid Retrieval, Vector Storage)
2. **Defer E2E testing**: Keep only integration test scaffold
3. **Simplify workflow**: Use basic conventions, skip formal CONTRIBUTING.md
4. **Minimum viable exit**: Updated todo.md + 2 ADRs + unit tests passing

## Weekly Checkpoints

### Week 1
- [ ] todo.md reviewed and updated
- [ ] ADR-001 complete
- [ ] Week 1 retrospective: What took longer than expected?

### Week 2
- [ ] ADR-002 and ADR-003 complete
- [ ] Integration test scaffold created
- [ ] Week 2 retrospective: Any blockers for Phase 02?

### Week 3
- [ ] ADR-004 complete
- [ ] Integration tests operational
- [ ] Week 3 retrospective: Testing approach validated?

### Week 4
- [ ] CONTRIBUTING.md complete
- [ ] Phase 02 planning started
- [ ] **Exit Gate Review**: All criteria met?

## Success Metrics

### Objective
- [ ] 4 ADRs created and committed
- [ ] `todo.md` reflects honest current state
- [ ] Integration test scaffold operational
- [ ] Development workflow documented

### Subjective
- [ ] Feel confident about architectural direction
- [ ] Understand what Phase 02 requires
- [ ] Have clear testing strategy

---

**Next Phase**: [02-phase-mvp.md](./02-phase-mvp.md)  
**Dependencies**: This phase must be complete before starting MVP
