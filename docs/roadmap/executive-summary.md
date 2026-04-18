# Executive Summary - WCP Compliance Agent Product Roadmap

Status Label: Implemented / Portfolio Showcase

## Vision

Build a technical showcase demonstrating **regulated-domain AI infrastructure** expertise through a trustworthy compliance agent for Weekly Certified Payroll (WCP) review. This project proves the ability to architect and execute production-grade AI systems—not just experiment with LLM prompts.

---

## Strategic Goals

1. **Demonstrate Infrastructure Thinking**: Show retrieval, evaluation, and observability as architecture concerns, not add-ons
2. **Prove End-to-End Execution**: Documented architecture → working implementation → public demonstration
3. **Establish Technical Credibility**: Portfolio-quality artifact for recruiters, hiring managers, potential co-founders
4. **Validate Solo Development Capability**: Realistic scope for 1 person + AI assistance, part-time
5. **✅ Demonstrate Regulatory Compliance Architecture**: Build AI systems that enforce federal labor standards (Davis-Bacon Act) with **three-layer validation** (deterministic scaffold → LLM verdict → trust score), audit trails, and regulatory traceability

---

## Timeline Overview

| Phase | Duration | Cumulative | Focus |
|-------|----------|------------|-------|
| 01 - Scaffolding | Weeks 1-4 | Month 1 | Documentation, testing, architecture alignment |
| 02 - MVP | Weeks 5-12 | Months 2-3 | Core functionality (retrieval, extraction, decisions) |
| 03 - Showcase | Weeks 13-18 | Months 4-4.5 | Public demo, feedback collection, portfolio |
| 05 - Post-Launch | Weeks 19+ | Month 5+ | Optimization, expansion, ongoing iteration |

**Total Investment**: 6-9 months part-time (10-20 hrs/week)

---

## Key Milestones

### Month 1: Foundation Complete
- All architecture documented and aligned
- Testing framework operational
- Development workflow established
- **Compliance documentation foundation complete (traceability matrix, compliance report, implementation guide)**

### Month 3: MVP Functional
- Working hybrid retrieval (BM25 + vector + cross-encoder)
- Real WCP processing with PDF/CSV ingestion
- **Three-layer validation pipeline operational**:
  - Layer 1: Deterministic scaffold (extraction, DBWD lookup, rule checks)
  - Layer 2: LLM verdict (reasoning over pre-computed findings)
  - Layer 3: Trust score + human review (governance, audit trail)
- **Compliance testing framework: >95% violation detection, <2% false-approve rate**

### Month 4.5: Portfolio Ready
- Public demo deployed and accessible
- External feedback collected (10+ users)
- Showcase narrative complete
- **Three-layer validation demo**: Live demonstration of deterministic → LLM → trust score pipeline
- **Compliance showcase: audit replay demo, regulatory citation display, metrics dashboard**
- **Full regulatory compliance documentation and traceability demonstrated**

### Month 6+: Sustained Capability
- Optimization phase complete
- Expansion features demonstrated
- Technical debt managed
- **Compliance monitoring operational: regulatory update handling, drift detection, audit metrics**

---

## Exit Gates by Phase

| Phase | Success Criteria |
|-------|-----------------|
| 01 - Scaffolding | Architecture documented, tests passing, workflow established **, compliance documentation complete** |
| 02 - MVP | Hybrid retrieval working, real decisions (not mock), 11-field extraction **, deterministic validation, audit trail functional, compliance testing operational** |
| 03 - Showcase | Live URL, user feedback mechanism, portfolio presentation ready **, compliance narrative integrated, audit replay demonstrated** |
| 05 - Post-Launch | Optimization metrics, expansion roadmap, maintenance discipline **, compliance monitoring active, regulatory update handling documented** |

---

## Resource Summary

### Time Investment
- **Average**: 10-20 hours/week
- **Phase 02 peak**: 20 hrs/week (infrastructure heavy)
- **Phase 03 lighter**: 10-15 hrs/week (polish and deployment)

### Financial Costs
| Item | Monthly | One-time | Notes |
|------|---------|----------|-------|
| OpenAI API | $20-50 | - | Usage-based, Phase 02 heaviest |
| Hosting (Vercel/Render) | $20-50 | - | Showcase deployment |
| PostgreSQL + pgvector | $15-30 | - | Can use Supabase free tier initially |
| Elasticsearch | $0 | - | Use Elastic Cloud trial or self-host |
| Domain name | - | $12-15 | Optional for showcase |
| **Total** | **$55-130** | **$12-15** | Manageable for solo showcase |

### Tools & Services
- **Development**: VS Code, GitHub, Vitest
- **Infrastructure**: Node.js, TypeScript, Mastra framework
- **Data**: PostgreSQL + pgvector, Elasticsearch, Redis
- **Deployment**: Vercel/Render/Railway
- **Observability**: OpenTelemetry, Phoenix (free tier)

---

## Current State → Target State

### Current (Month 0)
- Basic WCP text extraction (3 fields: role, hours, wage)
- Mock mode for API fallback
- Hardcoded DBWD rates (2 roles)
- Unit tests with Vitest
- Architecture documented but stubbed

### Target (Month 4.5)
- PDF/CSV ingestion pipeline
- Hybrid retrieval with real vector search
- 11-field WCP data extraction
- Configurable DBWD rate coverage (10+ roles)
- Working prompt infrastructure
- Public demo with feedback

---

## Risk Summary

| Risk | Impact | Mitigation | **Compliance Phase** |
|------|--------|------------|---------------------|
| Infrastructure complexity (solo) | High | Phased approach, use managed services | **N/A** |
| API cost overruns | Medium | Budget caps, mock modes, caching | **N/A** |
| Scope creep | High | Strict exit gates, time-boxed phases | **N/A** |
| Vector DB setup difficulty | Medium | Supabase free tier, good documentation | **N/A** |
| Deployment complexity | Low | Use Vercel/Render, not custom infrastructure | **N/A** |

---

## Regulatory Risk Matrix

| Risk | Impact | Mitigation | Phase Addressed |
|------|--------|------------|-----------------|
| Incorrect wage validation | Legal liability, fines | Deterministic arithmetic, golden set testing | 02-MVP |
| Missing audit trail | Regulatory non-compliance | Immutable decision records, trace IDs | 01-Scaffolding |
| Wrong DBWD rates | Underpayment violations | Automated SAM.gov sync, version tracking | 02-MVP |
| Classification errors | Worker misclassification | Hybrid retrieval + human escalation | 02-MVP |
| Replay failure | Audit impossibility | Version-locked decisions, immutable storage | 02-MVP |
| Compliance documentation gaps | Audit readiness failure | Comprehensive docs, traceability matrix | 01-Scaffolding |

---

## Regulatory Context

This project operates within the framework of **Davis-Bacon Act and Related Acts** federal labor standards. The system must demonstrate:

- **Deterministic wage validation** (40 U.S.C. § 3142)
- **Overtime compliance** (40 U.S.C. § 3702)
- **Audit trail capabilities** (Copeland Act, 40 U.S.C. § 3145)
- **Classification accuracy** (29 CFR 5.5(a)(3)(i))

**Compliance is not a feature—it is a core architectural requirement** built into every phase from scaffolding through post-launch monitoring.

---

## Success Metrics

### Technical
- [ ] Working hybrid retrieval (not stubbed)
- [ ] Real (non-mock) WCP decisions
- [ ] PDF/CSV ingestion functional
- [ ] 11-field data extraction complete

### Documentation
- [ ] All architecture decisions recorded
- [ ] Implementation docs reflect actual code
- [ ] Clear progression from current to target

### Demonstration
- [ ] Live demo URL accessible
- [ ] 10+ external users provide feedback
- [ ] Portfolio presentation ready

### Credibility
- [ ] Can discuss trade-offs with hiring managers
- [ ] Code quality matches infrastructure judgment
- [ ] Evaluation and observability treated as first-class

---

## What This Is Not

- **Not a startup**: No revenue, no customers, no fundraising
- **Not production scale**: Showcase quality, not enterprise scale
- **Not maintained forever**: 6-9 month focused effort, then maintained as portfolio
- **Not feature-complete**: Demonstrates key concepts, not every edge case

---

## Reading This Roadmap

- **For recruiters**: Focus on Phase 02 (MVP) - shows technical depth
- **For hiring managers**: Review all phases - shows product thinking
- **For myself**: Phase 01 sets foundation, Phase 02 is the heavy lift, Phase 03 is the payoff
- **For collaborators**: Phase documents include technical interfaces and contracts

---

**Status**: Planning complete, ready for Phase 01 execution  
**Last Updated**: 2026-04-17  
**Next Review**: End of Phase 01
