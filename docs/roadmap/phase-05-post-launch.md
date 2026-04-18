# Phase 05: Post-Launch Roadmap

Status Label: Planned / Future

**Duration**: Weeks 19+ (ongoing, part-time)  
**Effort**: 5-10 hrs/week  
**Dependencies**: Phase 03 complete (public demo deployed)  
**Purpose**: Demonstrate sustained product development capability beyond initial launch

---

## Philosophy

This phase is **not about building a business**—it's about demonstrating:

1. **Sustained development discipline**: Can maintain and improve over time
2. **Technical debt management**: Refactoring and optimization
3. **Feature expansion**: Growing the product thoughtfully
4. **Planning rigor**: Structured approach to iteration

**Pace**: Relaxed compared to Phases 02-03. This is ongoing portfolio maintenance, not startup sprint.

---

## Sub-Phase Structure

### 05-A: v1.1 Optimization (Weeks 19-24)

**Theme**: Performance, cost reduction, stability

**Focus Areas**:
- Performance optimization
- Cost reduction
- Bug fixes and edge cases
- Developer experience improvements

---

### 05-B: v1.2 Feature Expansion (Weeks 25-32)

**Theme**: More capabilities, better UX

**Focus Areas**:
- OCR support (scanned PDFs)
- Batch processing (multiple WCPs)
- Advanced analytics dashboard
- Enhanced reporting

---

### 05-C: v2.0 Major Upgrade (Weeks 33+)

**Theme**: Architectural evolution, enterprise readiness

**Focus Areas**:
- Multi-document workflows
- Enterprise features (teams, advanced audit trails)
- Mobile application
- API maturity

---

### 05-D: Compliance Monitoring (Continuous)

**Theme**: Regulatory compliance maintenance and monitoring

**Focus Areas**:
- Automated regulatory update detection
- Compliance metrics monitoring
- Audit trail maintenance
- Regulatory testing automation
- DBWD rate synchronization monitoring

---

## Sub-Phase 05-A: v1.1 Optimization

**Duration**: Weeks 19-24 (6 weeks)  
**Effort**: 5-8 hrs/week

### Objectives
1. Reduce operational costs
2. Improve response times
3. Fix bugs discovered during showcase
4. Refactor for maintainability

### Key Deliverables

#### Performance Optimization
- [ ] Implement response caching (Redis)
  - Cache retrieval results for identical queries
  - Cache embedding lookups
  - TTL management
- [ ] Optimize vector search
  - Index tuning (HNSW parameters)
  - Query optimization
  - Connection pooling
- [ ] Reduce LLM token usage
  - Prompt compression techniques
  - Context pruning strategies
  - Caching common responses

#### Cost Reduction
- [ ] Set up budget alerts
  - Daily spend notifications
  - Monthly caps with auto-throttling
- [ ] Implement tiered LLM usage
  - GPT-3.5 for simple decisions
  - GPT-4 only for complex cases
  - Confidence-based routing
- [ ] Optimize embedding generation
  - Batch processing
  - Cache frequently accessed vectors

#### Bug Fixes
- [ ] Fix edge cases discovered in showcase
- [ ] Improve error handling
- [ ] Add input validation for malformed WCPs

**Time Estimate**: 30 hours

---

## Sub-Phase 05-B: v1.2 Feature Expansion

**Duration**: Weeks 25-32 (8 weeks)  
**Effort**: 8-10 hrs/week

### Objectives
1. Add OCR for scanned PDFs
2. Enable batch WCP processing
3. Build analytics dashboard
4. Create enhanced reporting

### Key Deliverables

#### OCR Support
- [ ] Integrate Tesseract or cloud OCR
- [ ] Handle handwritten WCPs
- [ ] Image preprocessing pipeline

#### Batch Processing
- [ ] Multi-WCP upload interface
- [ ] Parallel processing pipeline
- [ ] Batch results dashboard

#### Analytics Dashboard
- [ ] Trend analysis (violations over time)
- [ ] Contractor performance metrics
- [ ] Project compliance summaries

**Time Estimate**: 40 hours

---

## Sub-Phase 05-C: v2.0 Major Upgrade

**Duration**: Weeks 33+ (ongoing)  
**Effort**: 5-10 hrs/week

### Objectives
1. Multi-document workflows
2. Enterprise team features
3. Mobile application
4. API versioning and maturity

### Key Deliverables

#### Multi-Document Workflows
- [ ] Process WCPs alongside supporting docs
- [ ] Cross-document validation
- [ ] Evidence correlation

#### Enterprise Features
- [ ] Team workspaces
- [ ] Role-based access control
- [ ] Advanced audit trails
- [ ] Compliance reporting for auditors

#### Mobile Application
- [ ] iOS/Android app
- [ ] Photo capture for WCPs
- [ ] Push notifications for violations

#### API Maturity
- [ ] Versioned API (v2)
- [ ] Rate limiting
- [ ] Webhook support
- [ ] SDK for common languages

**Time Estimate**: 60+ hours (ongoing)

---

## Sub-Phase 05-D: Compliance Monitoring

**Status**: Planned / Future

**Theme**: Regulatory compliance maintenance and monitoring

### Compliance Monitoring System

**Purpose**: Ensure ongoing regulatory compliance as the system evolves

**Components**:

#### 1. Regulatory Update Detection
- [ ] Automated SAM.gov monitoring
- [ ] DBWD rate change alerts
- [ ] Regulation amendment tracking
- [ ] Copeland Act update notifications

#### 2. Compliance Metrics Dashboard
- [ ] Violation detection accuracy (rolling 30-day)
- [ ] False-approve rate monitoring
- [ ] Classification resolution accuracy
- [ ] Human review queue depth
- [ ] Trust score calibration drift

#### 3. Audit Trail Maintenance
- [ ] 7-year retention verification
- [ ] Decision replay validation
- [ ] Trace completeness checks
- [ ] Version-locked replay testing

#### 4. Regulatory Testing Automation
- [ ] Golden set regression tests
- [ ] Compliance gate enforcement
- [ ] Check coverage validation
- [ ] Citation accuracy verification

#### 5. DBWD Rate Synchronization
- [ ] Automated SAM.gov ETL
- [ ] Rate change notifications
- [ ] Historical rate versioning
- [ ] Effective date management

**Compliance Monitoring Metrics**:

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Violation detection rate | >95% | <90% |
| False-approve rate | <2% | >5% |
| Classification accuracy | >90% | <85% |
| Regulatory citation precision | 100% | <95% |
| Audit trail completeness | 100% | <99% |
| Decision replay success | 100% | <99% |

**Time Estimate**: 16 hours initial setup, then 2 hrs/week maintenance

---

## Success Metrics

| Phase | Metric | Target |
|-------|--------|--------|
| 05-A | Cost reduction | 30% lower per-decision cost |
| 05-A | Latency | P95 < 200ms |
| 05-B | OCR accuracy | >90% on scanned PDFs |
| 05-B | Batch throughput | 100 WCPs/minute |
| 05-C | API stability | 99.9% uptime |
| 05-D | Compliance drift | Zero undetected drift |

---

## Resource Planning

| Phase | Weekly Hours | Duration | Total Hours |
|-------|--------------|----------|-------------|
| 05-A Optimization | 5-8 | 6 weeks | 30-48 |
| 05-B Expansion | 8-10 | 8 weeks | 40-80 |
| 05-C Major Upgrade | 5-10 | Ongoing | Flexible |
| 05-D Compliance | 2 | Ongoing | Continuous |

**Monthly Costs** (estimated):
- OpenAI API: $30-50 (optimized)
- Hosting: $20-40
- Database: $15-25
- **Total**: $65-115/month

---

## Maintenance Rule

When code starts expanding again, `current-state.md` and `implemented-vs-target.md` must be updated first so the public story stays truthful.

---

## Next Actions

1. **Collect Phase 03 feedback** and triage into 05-A/05-B/05-C
2. **Set up monitoring** for costs and performance
3. **Prioritize quick wins** for 05-A
4. **Research OCR options** (Tesseract vs cloud)
5. **Plan batch processing architecture**

---

**Last Updated**: 2026-04-17  
**Status**: Planning phase, not yet started
