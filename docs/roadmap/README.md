# Roadmap

Status Label: Implemented

This directory contains the comprehensive product roadmap for the WCP Compliance Agent. It provides strategic direction, phase planning, milestones, and next actions.

---

## Roadmap Structure

### Strategic Overview
- **[Executive Summary](executive-summary.md)** — Vision, strategic goals, timeline, resource summary
- **[Platform Roadmap](platform-roadmap.md)** — Capability roadmap (infrastructure layers)
- **[Milestones](milestones.md)** — 90-day detailed milestone plan

### Phased Planning
- **[Phase 01: Scaffolding](phase-01-scaffolding.md)** — Foundation, documentation, testing, ADRs
- **[Phase 02: MVP](phase-02-mvp.md)** — Core functionality, hybrid retrieval, three-layer pipeline
- **[Phase 03: Showcase](phase-03-showcase.md)** — Public demo, feedback collection, portfolio
- **[Phase 05: Post-Launch](phase-05-post-launch.md)** — Optimization, expansion, ongoing iteration

### Documentation Governance
- **[Documentation Roadmap](documentation-roadmap.md)** — How to maintain and update docs

---

## Quick Navigation

### By Audience

**For Recruiters (2-minute read)**
1. [Executive Summary](executive-summary.md) — Strategic goals and timeline
2. [Phase 02: MVP](phase-02-mvp.md) — Technical depth (three-layer pipeline)

**For Hiring Managers (10-minute read)**
1. [Executive Summary](executive-summary.md) — Full overview
2. [Phase 01 → 02 → 03](phase-01-scaffolding.md) — Phased progression
3. [Platform Roadmap](platform-roadmap.md) — Capability maturity

**For Engineers (20-minute read)**
1. [Phase 02: MVP](phase-02-mvp.md) — Current architecture
2. [Platform Roadmap](platform-roadmap.md) — Target architecture
3. [Milestones](milestones.md) — Detailed deliverables

---

## Current Status (as of 2026-04-17)

| Phase | Status | Key Deliverables |
|-------|--------|------------------|
| **01 - Scaffolding** | ✅ Complete | Three-layer pipeline, compliance docs, CI lint |
| **02 - MVP** | 🔄 In Progress | Hybrid retrieval stubbed, 3-layer pipeline complete |
| **03 - Showcase** | 🔲 Not Started | Public demo, landing page |
| **05 - Post-Launch** | 🔲 Planned | Optimization, expansion |

---

## Next Actions

Top 10 prioritized tasks to move the project forward:

### Immediate (This Week)
1. **Set up PostgreSQL + pgvector** — Infrastructure for vector storage
   - Why: Required for hybrid retrieval and DBWD corpus
   - Acceptance: Local Postgres with pgvector extension running
   - Effort: Medium (4 hours)
   - Dependencies: None

2. **Create DBWD corpus ETL pipeline** — SAM.gov → embeddings
   - Why: Need actual rate data for realistic demos
   - Acceptance: 10+ trades with embeddings in vector store
   - Effort: Large (12 hours)
   - Dependencies: PostgreSQL setup

### Short-term (Next 2 Weeks)
3. **Implement BM25 search** — Elasticsearch or Meilisearch
   - Why: Keyword search component of hybrid retrieval
   - Acceptance: Text queries return relevant DBWD entries
   - Effort: Medium (8 hours)
   - Dependencies: PostgreSQL

4. **Build hybrid retriever** — Combine BM25 + vector + rerank
   - Why: Core innovation for accuracy
   - Acceptance: MRR @ 1 > 0.6, P95 latency < 300ms
   - Effort: Large (16 hours)
   - Dependencies: BM25, vector search

5. **Expand WCP schema** — 3 fields → 11 fields
   - Why: Full WCP report coverage
   - Acceptance: All 11 fields extracted and validated
   - Effort: Large (12 hours)
   - Dependencies: None

### Medium-term (Next Month)
6. **Implement PDF ingestion** — OCR fallback
   - Why: Real-world WCP input format
   - Acceptance: Scanned WCPs parsed with >80% accuracy
   - Effort: Large (16 hours)
   - Dependencies: 11-field schema

7. **Create GitHub Actions workflow** — CI evaluation
   - Why: Automated testing on PRs
   - Acceptance: Tests run on every PR, block on failure
   - Effort: Medium (6 hours)
   - Dependencies: Golden dataset

8. **Build golden dataset** — 50+ labeled examples
   - Why: Trust calibration, regression detection
   - Acceptance: 50 labeled WCPs with ground truth
   - Effort: Large (20 hours)
   - Dependencies: 11-field schema

9. **Deploy public demo** — Vercel/Render
   - Why: Portfolio showcase, user feedback
   - Acceptance: Live URL, demo UI, analytics
   - Effort: Medium (12 hours)
   - Dependencies: Hybrid retrieval, PDF ingestion

10. **Write technical blog post** — LinkedIn/HN
    - Why: Drive traffic to demo, establish credibility
    - Acceptance: Published post with 10+ engagements
    - Effort: Small (4 hours)
    - Dependencies: Live demo

---

## Status Labels Explained

Every roadmap document uses a status label:

| Label | Meaning | Example |
|-------|---------|---------|
| **Implemented** | Fully working with real data | Three-layer pipeline structure |
| **Structurally Implemented, Data Stubbed** | Code exists, uses hardcoded/mock data | Human review queue (in-memory) |
| **Designed / Target** | Documented architecture, not coded | Hybrid retrieval pipeline |
| **Planned / Future** | Aspirational, no design lock yet | Mobile application |

---

## Maintenance

### How to Update This Roadmap

1. **After completing work**: Update phase status (🔲 → 🔄 → ✅)
2. **After major decisions**: Add ADR to `docs/adrs/`
3. **When scope changes**: Update all affected phase docs
4. **Monthly**: Review and update "Next Actions" section

### Cross-References to Update

When moving between phases:
- Update `executive-summary.md` key milestones
- Update `platform-roadmap.md` component status
- Update `milestones.md` timeline
- Update `../INDEX.md` reading paths
- Update `../../README.md` doc map

---

## Dependencies

```
Foundation (Phase 01)
├── Documentation complete ✓
├── Testing framework ✓
└── Three-layer pipeline ✓
    ↓
Core (Phase 02)
├── Hybrid retrieval (in progress)
├── Evaluation framework (partial)
└── API contracts (stable)
    ↓
Production (Phase 03)
├── Observability
├── Showcase demo
└── Portfolio presentation
    ↓
Post-Launch (Phase 05)
├── Optimization
├── Expansion
└── Maintenance
```

**Critical Path**: Vector storage → Hybrid retrieval → PDF ingestion → Showcase demo

---

## Questions?

- **What's implemented now?** → See `../foundation/current-state.md`
- **What's the target state?** → See `../foundation/implemented-vs-target.md`
- **How do I contribute?** → See `../development/contributor-guide.md`
- **What should I build next?** → See "Next Actions" above

---

**Last Updated**: 2026-04-17  
**Next Review**: End of each phase
