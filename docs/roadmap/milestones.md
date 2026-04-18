# Milestones

Status Label: Implemented / In Progress

Detailed 90-day milestone plan for the WCP Compliance Agent development. Updated April 2026.

---

## 30 days: Foundation phase

**Theme**: Technical scaffolding and validation surface expansion

### Week 1-2: Technical setup + Decision Architecture

**Objectives:**
- [ ] ADRs finalized and documented
- [ ] Testing framework operational
- [ ] CI/CD pipeline configured
- [ ] Vector store infrastructure prepared
- [ ] **Three-layer decision architecture implemented**

**Deliverables:**
- ✅ [ADR-001: Mastra over LangChain](../adrs/ADR-001-mastra-over-langchain.md)
- ✅ [ADR-002: Hybrid Retrieval](../adrs/ADR-002-hybrid-retrieval.md)
- ✅ [ADR-003: Deterministic Validation](../adrs/ADR-003-deterministic-validation.md)
- ✅ [**ADR-005: Three-Layer Decision Architecture**](../adrs/ADR-005-decision-architecture.md)
- ✅ **Decision pipeline (Layer 1, 2, 3 + Orchestrator)**
- ✅ **Trust scoring with human review queue**
- ✅ **Pipeline discipline lint script**
- 🔄 GitHub Actions workflow for tests
- 🔄 PostgreSQL + pgvector setup guide
- 🔄 Local development environment documentation

**Success criteria:**
- `npm test` passes with >80% coverage
- CI pipeline runs in <5 minutes
- New developers can set up in <15 minutes

### Week 3-4: Validation expansion

**Objectives:**
- [ ] Document-to-schema ingestion path defined
- [ ] Deterministic validation surface expanded
- [ ] Target report schema stabilized
- [ ] Initial corpus ingestion design clarified

**Deliverables:**
- PDF/CSV extraction specification
- Full WCP report data model
- Rate table schema for multiple localities
- DBWD corpus ETL design document

**Expanded validation coverage:**

| Check | Current | Target (30d) |
|-------|---------|--------------|
| Base wage | ✅ Electrician, Laborer | + 10 more trades |
| Overtime hours | ✅ Basic calc | ✅ With fringe |
| Overtime rate | ✅ 1.5x base | ✅ With fringe breakdown |
| Arithmetic totals | 🔲 | ✅ Daily/weekly cross-check |
| Signature presence | 🔲 | ✅ Validation rule |
| Work week alignment | 🔲 | ✅ Date validation |

**Success criteria:**
- 12+ trade classifications supported
- Arithmetic validation covers all wage components
- Schema handles 95% of real WCP report structures

---

## 60 days: Core phase

**Theme**: Retrieval layer and evaluation framework

### Week 5-6: Hybrid retrieval MVP

**Objectives:**
- [ ] BM25 search implemented (Elasticsearch or Meilisearch)
- [ ] Vector search implemented (pgvector)
- [ ] Reciprocal Rank Fusion working
- [ ] Initial DBWD corpus loaded (sample)

**Deliverables:**
- Working hybrid retriever (BM25 + vector)
- 1000 document sample corpus
- Retrieval API endpoints
- Retrieval quality metrics dashboard

**Technical implementation:**

```typescript
// Target API
interface RetrievalResult {
  query: string;
  results: Evidence[];
  timing: {
    bm25Ms: number;
    vectorMs: number;
    fusionMs: number;
  };
  metrics: {
    bm25Hits: number;
    vectorHits: number;
    fusedHits: number;
  };
}
```

**Success criteria:**
- MRR @ 1 > 0.6 on test queries
- Latency P95 < 300ms
- Synonym queries resolve correctly ("Wireman" → "Electrician")

### Week 7-8: Evaluation framework

**Objectives:**
- [ ] Golden set of 100+ labeled examples
- [ ] Automated evaluation pipeline
- [ ] CI quality gates configured
- [ ] Regression detection working

**Deliverables:**
- Golden set dataset (labeled WCP examples)
- Evaluation harness (npm run test:golden)
- GitHub Actions quality gates
- Accuracy/false-approve dashboards

**Golden set structure:**

```typescript
interface GoldenExample {
  id: string;
  input: WCPInput;
  expected: {
    status: 'COMPLIANT' | 'VIOLATION' | 'REVISION_NEEDED';
    findings: ExpectedFinding[];
    citations: string[];
  };
  metadata: {
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
    addedDate: string;
  };
}
```

**Quality gates:**

| Gate | Threshold | Block Release? |
|------|-----------|----------------|
| Verdict accuracy | ≥ 85% | Yes |
| False-approve rate | < 5% | Yes |
| Schema pass rate | ≥ 99% | Yes |
| Latency regression | < 1.5x baseline | No (warning) |

**Success criteria:**
- 100+ golden examples covering all major scenarios
- CI blocks PRs that degrade accuracy > 2%
- Evaluation runs complete in <10 minutes

### Week 9-10: API and persistence

**Objectives:**
- [ ] Submit/status/decision/trace API contracts locked
- [ ] Decision persistence layer
- [ ] Trace storage and replay
- [ ] Document versioning

**Deliverables:**
- Full REST API specification
- PostgreSQL schema for decisions/traces
- Replay functionality
- Document hash versioning

**API endpoints:**

```
POST /api/submit          - Submit WCP report
GET  /api/status/:id      - Check processing status
GET  /api/decision/:id    - Get decision result
GET  /api/trace/:id       - Get full trace
POST /api/replay/:id      - Replay decision
```

**Success criteria:**
- API contracts stable (no breaking changes)
- Decision replay produces identical results
- Trace storage < 100KB per decision

---

## 90 days: Production readiness

**Theme**: Observability, security, and showcase preparation

### Week 11-12: Observability and operations

**Objectives:**
- [ ] OpenTelemetry tracing implemented
- [ ] Metrics dashboard operational
- [ ] Alerting rules configured
- [ ] Cost tracking per decision

**Deliverables:**
- End-to-end distributed tracing
- Prometheus metrics export
- Grafana dashboards (latency, accuracy, cost)
- PagerDuty/Slack alerting

**Dashboards:**

1. **System Overview**
   - Requests per minute
   - Latency percentiles (p50, p95, p99)
   - Error rate
   - Cost per hour

2. **Decision Quality**
   - Verdict distribution
   - Confidence histogram
   - False-approve rate (rolling window)
   - Citation validity

3. **Retrieval Performance**
   - MRR @ 1, 3, 5
   - BM25 vs vector hit rates
   - Reranking latency
   - Query patterns

**Success criteria:**
- P95 latency visible in real-time
- Alerts fire within 2 minutes of issues
- Cost per decision tracked to $0.001 precision

### Week 13-14: Security and compliance

**Objectives:**
- [ ] Authentication and authorization
- [ ] Input validation hardening
- [ ] PII detection and handling
- [ ] Audit logging

**Deliverables:**
- JWT-based auth
- Rate limiting (per tenant)
- PII redaction in logs
- SOC 2 readiness documentation

**Security model:**

```typescript
interface SecurityContext {
  tenantId: string;
  userId: string;
  permissions: ('read' | 'submit' | 'admin')[];
  rateLimit: {
    requestsPerMinute: number;
    burstAllowance: number;
  };
}
```

**Success criteria:**
- OWASP Top 10 mitigations documented
- Penetration test results (if conducted)
- Data retention policy defined

### Week 15-18: Showcase and launch

**Objectives:**
- [ ] Public demo deployed
- [ ] Landing page complete
- [ ] Documentation polished
- [ ] User feedback collection ready

**Deliverables:**
- Deployed demo (Vercel/Netlify)
- Marketing landing page
- Video walkthrough
- Feedback form + analytics

**Showcase features:**

| Feature | Status | Notes |
|---------|--------|-------|
| Live API demo | 🎯 | Try-it-now interface |
| Example gallery | 🎯 | 6 core scenarios |
| Performance metrics | 🎯 | Real-time display |
| Case study download | 🎯 | PDF whitepaper |
| GitHub link | ✅ | Already public |

**Success criteria:**
- Demo loads in <3 seconds
- 100+ unique visitors in first week
- 5+ pieces of actionable feedback

---

## Phase summary

| Phase | Timeline | Focus | Key Deliverable |
|-------|----------|-------|-----------------|
| **Foundation** | Days 1-30 | Scaffolding | ADRs + testing framework |
| **Core** | Days 31-60 | Functionality | Hybrid retrieval + evaluation |
| **Production** | Days 61-90 | Readiness | Observability + showcase |

---

## Extended roadmap (post-90 days)

### Month 4: Optimization

- Performance tuning (sub-200ms latency)
- Cost optimization (reduce per-decision cost 50%)
- Corpus expansion (all 50 states)

### Month 5-6: Feature expansion

- PDF upload and OCR
- Multi-employee batch processing
- Integration APIs (webhooks, CRM sync)

### Month 7+: Scale

- Multi-region deployment
- Enterprise features (SSO, audit trails)
- Advanced analytics (trending, forecasting)

See [Product Roadmap](../../product-roadmap/00-executive-summary.md) for full 6-9 month plan.

---

## Milestone dependencies

```
Foundation (30d)
├── ADRs completed
├── Testing framework
└── CI/CD pipeline
    ↓
Core (60d)
├── Hybrid retrieval
├── Evaluation framework
└── API contracts
    ↓
Production (90d)
├── Observability
├── Security
└── Showcase launch
```

**Critical path**: Testing framework → Evaluation framework → Showcase

---

## Risk mitigation

| Risk | Mitigation |
|------|------------|
| Retrieval quality poor | Start with BM25 only, add vector in phases |
| Golden set build slow | Prioritize 50 high-quality over 100 mediocre |
| LLM costs too high | Fallback to smaller models, cache aggressively |
| Security audit delays | Start documentation early, use standard patterns |

---

## Tracking progress

Current status tracked in:
- [`todo.md`](../../todo.md) - Detailed task breakdown
- [Roadmap Index](./README.md) - Phased planning docs
- [Executive Summary](executive-summary.md) - Strategic overview
- GitHub issues (future)

---

*Last updated: April 2026*
