# Phase 01: Scaffolding

Status Label: Structurally Implemented, Data Stubbed

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

---

## Exit Gate Criteria

All must be true to proceed to Phase 02:

- [x] `todo.md` updated with current state (all 40 items categorized)
- [x] Architecture Decision Records (ADRs) created for key decisions
- [x] **Compliance documentation foundation complete**:
  - [x] Traceability matrix created (regulation ↔ code mapping)
  - [x] Regulatory compliance report complete
  - [x] Implementation guide for developers
  - [x] JSDoc standards for regulatory citations established
- [x] Testing framework operational:
  - [x] Unit tests passing (Vitest)
  - [x] Integration test scaffold ready
  - [x] Pipeline discipline tests operational
- [x] Development workflow documented:
  - [x] Git branching strategy
  - [x] Commit message conventions
  - [x] Code review checklist (self-review)
  - [x] Documentation update triggers

---

## Key Deliverables

### 1. Documentation Audit & Alignment

**Deliverable**: Updated `todo.md` with honest state assessment

**Tasks**:
- [x] Review all 40 items in current `todo.md`
- [x] Categorize into Blockers / Active Sprint / Backlog / Icebox / Tech Debt
- [x] Mark items as ✅ Complete / 🔄 In Progress / 🔲 Not Started
- [x] Ensure every item has [L/M/S] effort estimate
- [x] Ensure every item has clear acceptance criteria

**Acceptance**:
- `todo.md` is the single source of truth for what to work on next
- No contradictions between `todo.md` and individual doc files

**Time Estimate**: 4 hours

---

### 2. Architecture Decision Records (ADRs)

**Deliverable**: ADR documents for major technical decisions

**Required ADRs**:
- [x] **ADR-001**: Mastra over LangChain (already exists)
- [x] **ADR-002**: Hybrid retrieval architecture (BM25 + vector + cross-encoder)
- [x] **ADR-003**: Deterministic validation strategy (already exists)
- [x] **ADR-005**: Three-layer decision architecture (deterministic → LLM → trust score)

**ADR Template** (per decision):
```markdown
# ADR-XXX: [Decision Title]

## Status
Accepted / Proposed / Deprecated

## Context
[What is the problem we're solving?]

## Decision
[What did we decide?]

## Consequences
- Positive: [...]
- Negative: [...]
- Risks: [...]

## Alternatives Considered
- [Option A]: [Why rejected]
- [Option B]: [Why rejected]

## References
- [Link to implementation]
- [Link to related docs]
```

**Time Estimate**: 8 hours

---

### 3. Three-Layer Decision Architecture

**Deliverable**: Complete three-layer pipeline implementation

**Status**: Structurally implemented, data stubbed

**What Exists**:
- ✅ Layer 1: Deterministic scaffold (`src/pipeline/layer1-deterministic.ts`)
- ✅ Layer 2: LLM verdict (`src/pipeline/layer2-llm-verdict.ts`)
- ✅ Layer 3: Trust score (`src/pipeline/layer3-trust-score.ts`)
- ✅ Orchestrator (`src/pipeline/orchestrator.ts`)
- ✅ CI enforcement (`scripts/lint-pipeline-discipline.ts`)
- ✅ Trust calibration tests (`tests/eval/trust-calibration.test.ts`)

**What Uses Hardcoded Data**:
- 🔲 DBWD rates (2 roles hardcoded, needs SAM.gov integration)
- 🔲 Human review queue (in-memory stub, needs PostgreSQL)

**Documentation**:
- [x] Decision architecture doctrine (`docs/architecture/decision-architecture.md`)
- [x] Trust scoring guide (`docs/architecture/trust-scoring.md`)
- [x] Human review workflow (`docs/architecture/human-review-workflow.md`)

**Time Estimate**: 16 hours (partially complete)

---

### 4. Testing Framework

**Deliverable**: Operational test suite with CI integration

**Current State**:
- ✅ Unit tests (Vitest) - 400+ tests for pipeline, trust scoring, contracts
- ✅ Integration tests - End-to-end pipeline scenarios
- ✅ Calibration tests - Golden set evaluation
- ✅ Pipeline lint - AST-based architecture enforcement
- 🔲 GitHub Actions workflow (planned)

**Test Commands**:
```bash
npm test                    # All tests
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:pipeline      # Pipeline-specific tests
npm run test:calibration   # Trust calibration
npm run lint:pipeline      # Architecture linting
```

**Coverage Targets**:
- Line coverage: >80%
- Branch coverage: >75%
- Critical paths: 100% (deterministic validation, trust scoring)

**Time Estimate**: 12 hours (framework operational)

---

### 5. Development Workflow

**Deliverable**: Documented workflow for solo development

**Git Strategy** (for solo founder + AI assistance):
- Main branch: Always deployable
- Feature branches: Short-lived (1-3 days max)
- Commit convention: Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`)

**Self-Review Checklist**:
- [ ] Code follows ADR-005 constraints (three-layer pipeline)
- [ ] Tests added for new functionality
- [ ] Documentation updated (current-state.md, architecture docs)
- [ ] Pipeline discipline lint passes (`npm run lint:pipeline`)
- [ ] No secrets in commits
- [ ] Commit messages explain *why*, not just *what*

**Time Estimate**: 4 hours

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Documentation accuracy | 100% | `current-state.md` matches `src/` |
| Test coverage | >80% | Vitest coverage report |
| ADR completeness | 5 ADRs | All major decisions documented |
| Compliance docs | 100% | Traceability matrix complete |

---

## Next Actions

1. **Review `todo.md`** for any stale items
2. **Verify ADR-005** links are correct after consolidation
3. **Run full test suite**: `npm test` should pass
4. **Check pipeline lint**: `npm run lint:pipeline` should pass
5. **Update `CHANGELOG.md`** with Phase 01 completions

---

**Last Updated**: 2026-04-17  
**Next Review**: End of Phase 02 planning
