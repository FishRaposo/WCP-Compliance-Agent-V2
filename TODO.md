# Unified TODO - WCP Compliance Agent

**Last Audit**: 2026-04-19 (Phase 0 sign-off)  
**Status**: Phase 0 complete — build, tests, lint, mock mode, docs all verified  
**Scope**: Source code, implementation docs, architecture plans, archive TODO

---

## Index

- [🔴 Blockers](#-blockers) - Critical issues preventing production use
- [🏃 Active Sprint](#-active-sprint) - Current phase (Phase 2) in progress
- [📦 Backlog](#-backlog) - Validated features ready for scheduling
- [🧊 Icebox](#-icebox) - Ideas and future features not yet prioritized
- [🔧 Tech Debt](#-tech-debt) - Refactoring, optimization, cleanup

---

## 🔴 Blockers

Critical gaps between documented architecture and actual implementation. These prevent production deployment.

### Hybrid Retrieval Infrastructure

- [ ] Implement hybrid retrieval pipeline [src: docs/implementation/05-retrieval-hybrid-rerank.md:560] [L]
  - Context: Documented as core architecture but completely stubbed
  - Current state: `throw new Error('Not implemented - retrieval pipeline required')`
  - Acceptance: Working BM25 + vector search with cross-encoder reranking
  - Dependencies: pgvector, Elasticsearch, cross-encoder model, embedding service

- [ ] Build vector search repository [src: docs/implementation/04-vector-pgvector.md:589] [L]
  - Context: Vector storage for wage determination corpus documented but not implemented
  - Current state: `throw new Error('Not implemented - pgvector connection required')`
  - Acceptance: pgvector table with HNSW index, embedding service, similarity search
  - Dependencies: Postgres with pgvector extension, embedding model (OpenAI/text-embedding-3)

- [ ] Implement Elasticsearch policy search [src: docs/implementation/02-search-elasticsearch.md:388] [M]
  - Context: Policy/regulatory document search documented but stubbed
  - Current state: `throw new Error('Not implemented - Elasticsearch connection required')`
  - Acceptance: Working ES index, query interface, document ingestion pipeline
  - Dependencies: Elasticsearch cluster, index mappings, DBWD document corpus

### Prompt Infrastructure

- [ ] Build prompt registry service [src: docs/implementation/07-prompt-infrastructure.md:486] [L]
  - Context: Versioning, A/B testing, per-org config documented but no implementation
  - Current state: Schema defined, interface stubbed, no actual registry
  - Acceptance: Postgres-backed registry, version resolution, experiment assignment
  - Dependencies: PostgreSQL schema, resolution algorithm, integration with agent

- [ ] Implement prompt A/B testing [src: docs/implementation/07-prompt-infrastructure.md:400] [M]
  - Context: Experiment management documented but no code exists
  - Acceptance: Create experiment, traffic split, variant assignment, results tracking
  - Dependencies: Prompt registry, deterministic hash assignment, usage logging

### CI Evaluation Framework

- [ ] Build CI-based evaluation pipeline [src: docs/evaluation/evaluation-strategy.md] [L]
  - Context: Evaluation strategy defined, only Vitest unit tests exist
  - Current state: No golden dataset, no regression detection, no quality gates
  - Acceptance: GitHub Actions workflow, dataset loader, scoring rubrics, gate checks
  - Dependencies: Golden submission dataset, baseline results, metric thresholds

- [ ] Create golden evaluation dataset [src: docs/evaluation/] [M]
  - Context: No test cases with ground truth labels exist
  - Acceptance: 50-100 labeled submissions with expected outcomes and findings
  - Dependencies: Expert labeling, schema definition, dataset loader

### Entity Model Gap

- [ ] Implement full WCP data model [src: src/types/index.ts:25] [M]
  - Context: WCPData has only 3 fields (role, hours, wage), needs 11 per spec
  - Current state: Basic types, missing worker names, trade codes, locality, daily hours
  - Acceptance: Full TWCPReport with 11 fields as defined in Phase 2 specs
  - Dependencies: TypeScript interfaces, validation schemas, extraction logic
  - Related: `_archive/TODO.md:138` Expanded Data Extraction

### Data Hardcoding

- [ ] Replace hardcoded DBWD rates with configurable source [src: src/mastra/tools/wcp-tools.ts:35] [M]
  - Context: Only 2 roles hardcoded (Electrician: $51.69, Laborer: $26.45)
  - Comment in code: "Add more from PDF: e.g., Plumber"
  - Acceptance: External config file (JSON/YAML) with 10+ common DBWD roles
  - Dependencies: Config loader, rate validation, hot-reload capability

---

## 🏃 Active Sprint

Phase 2 features currently in progress or next to implement.

### Document Processing

- [ ] Integrate PDF parsing [src: _archive/TODO.md:98] [M]
  - Context: Phase 2 requirement, real WCP documents are PDFs
  - Acceptance: `pdf-parse` package integrated, `extractWCPTool` handles PDF inputs
  - Dependencies: npm install pdf-parse, text extraction, preprocessing, validation

- [ ] Add CSV parsing support [src: _archive/TODO.md:115] [S]
  - Context: Structured data import for WCP systems with CSV export
  - Acceptance: CSV parser (csv-parser or papaparse), column mapping, encoding handling
  - Dependencies: npm install csv-parser, format detection, header mapping

- [ ] Extract full 11-field WCP data [src: _archive/TODO.md:138] [M]
  - Context: Current extraction only gets role/hours/wage
  - Requirements: employee names, job titles, locality, hours by day, base/fringe rates, signatures, project info, subcontractor, multiple employees
  - Acceptance: All 11 fields extracted and validated
  - Dependencies: Expanded regex patterns or LLM-based extraction

### Retrieval Proof of Concept

- [ ] Create toy RAG demonstration [src: _archive/TODO.md:155] [M]
  - Context: Educational RAG with synthetic data (NOT for production decisions)
  - Acceptance: Vector DB setup, synthetic DBWD corpus, stubbed RAG tool, clear warnings
  - Dependencies: Simple vector store (LibSQL vector or in-memory), toy embeddings
  - Warning: Must include "DO NOT USE FOR REAL DECISIONS" markers

### Input Parsing Improvements

- [ ] Enhance regex patterns for better matching [src: _archive/TODO.md:192] [S]
  - Context: Current patterns are brittle, need more flexible matching
  - Acceptance: Case-insensitive matching, role aliases, varied formats
  - Dependencies: Pattern library, test cases for edge formats

- [ ] Add LLM-based parsing fallback [src: _archive/TODO.md:198] [M]
  - Context: Regex fails on unstructured or complex inputs
  - Acceptance: GPT-based extraction when regex fails, validation of output
  - Dependencies: Cost controls, timeout handling, confidence thresholds

---

## 📦 Backlog

Validated features ready for scheduling after Phase 2 completion.

### Observability Infrastructure

- [ ] Implement OpenTelemetry tracing [src: docs/implementation/06-observability-otel-phoenix.md:45] [M]
  - Context: Documented architecture, currently only Pino logging exists
  - Acceptance: Span creation, context propagation, trace export
  - Dependencies: @opentelemetry/sdk-node, auto-instrumentation, collector

- [ ] Integrate Phoenix trace inspection [src: docs/implementation/06-observability-otel-phoenix.md:300] [M]
  - Context: LLM-specific observability for debugging decisions
  - Acceptance: Phoenix client, LLM span logging, retriever span logging
  - Dependencies: Arize Phoenix instance, trace correlation, UI access

- [ ] Add custom compliance metrics [src: docs/implementation/06-observability-otel-phoenix.md:430] [S]
  - Context: Business metrics for monitoring (decision rate, confidence distribution, cost)
  - Acceptance: Meters for wcp.decisions.total, wcp.decision.confidence, wcp.cost.per_decision
  - Dependencies: OpenTelemetry metrics API, Prometheus export

### Cost Tracking

- [ ] Build cost tracking service [src: docs/implementation/08-cost-tracking.md:125] [M]
  - Context: Per-submission and per-org cost accounting documented
  - Acceptance: Cost event recording, price catalog, budget checking
  - Dependencies: PostgreSQL schema, price lookups (OpenAI, etc.), integration with agent

- [ ] Implement per-org budget enforcement [src: docs/implementation/08-cost-tracking.md:155] [M]
  - Context: Monthly budgets, per-submission limits, enforcement modes
  - Acceptance: Budget configuration, spend tracking, threshold alerts, circuit breaker
  - Dependencies: Cost tracker, alert system, enforcement middleware

### Redis Caching

- [ ] Implement contractor state cache [src: docs/implementation/03-cache-redis.md:448] [M]
  - Context: Documented but stubbed with "Redis connection required" error
  - Acceptance: Redis client, state serialization, TTL management, invalidation
  - Dependencies: Redis instance, connection pooling, data model

- [ ] Build wage determination cache [src: docs/implementation/03-cache-redis.md:465] [S]
  - Context: Fast lookup for frequently accessed wage rates
  - Acceptance: Cache-aside pattern, Redis storage, fallback to DB
  - Dependencies: Redis, wage repository, cache invalidation strategy

### Analytics Warehouse

- [ ] Implement Redshift warehouse queries [src: docs/implementation/01-warehouse-redshift.md:232] [M]
  - Context: Payroll analytics warehouse documented, no implementation
  - Acceptance: Read-only connection, SQL execution, result formatting
  - Dependencies: Redshift/BigQuery instance, connection pool, credentials

- [ ] Create warehouse LLM tool interface [src: docs/implementation/01-warehouse-redshift.md:180] [S]
  - Context: Agent needs to query historical submissions for context
  - Acceptance: Tool definition, query validation, result formatting
  - Dependencies: Warehouse service, query builder, safety controls

### Additional DBWD Roles

- [ ] Add common DBWD roles to config [src: _archive/TODO.md:209] [S]
  - Context: Phase 2 quick win - expand beyond Electrician/Laborer
  - Acceptance: Plumber, Carpenter, Mason, Equipment Operator, etc. (10+ roles)
  - Dependencies: Rate research, config file format, validation tests

---

## 🧊 Icebox

Ideas and planned features not yet prioritized. Phase 3+ (Enterprise) features.

### Enterprise OCR

- [ ] OCR support for scanned PDFs [src: _archive/TODO.md:127] [L]
  - Context: Phase 3 Enterprise feature for paper document digitization
  - Acceptance: tesseract.js integration, image preprocessing, confidence scoring
  - Dependencies: tesseract.js, image processing, OCR confidence thresholds
  - Priority: Low - most WCPs are digital now

### Enterprise Workflows

- [ ] Multi-document workflow orchestration [src: _archive/TODO.md:173] [L]
  - Context: Phase 3 Enterprise - batch processing, approval chains
  - Requirements: Workflow engine, state machines, human-in-the-loop
  - Priority: Icebox - single-document processing is current focus

- [ ] Batch processing system [src: _archive/TODO.md:287] [L]
  - Context: Enterprise large-scale operations
  - Acceptance: Queue-based processing, parallel workers, progress tracking
  - Dependencies: Job queue (Bull/BullMQ), worker processes, monitoring

### Production Deployment

- [ ] Production deployment suite [src: _archive/TODO.md:180] [L]
  - Context: Phase 4 Enterprise - full operational capabilities
  - Requirements: Containerization, orchestration, monitoring, scaling
  - Priority: Icebox - infrastructure platform decision needed first

### Advanced Validation

- [ ] Signature detection and validation [src: _archive/TODO.md:295] [M]
  - Context: WCP compliance requires valid signatures
  - Acceptance: Signature extraction, validation against known signatories
  - Dependencies: Image processing, signature database, fraud detection

- [ ] Advanced arithmetic validation [src: _archive/TODO.md:295] [S]
  - Context: Verify hours × rate = total wages calculations
  - Acceptance: Math expression extraction, calculation verification, discrepancy detection
  - Dependencies: Expression parser, tolerance thresholds, error reporting

### Database Persistence

- [ ] Full persistence layer with audit trails [src: _archive/TODO.md:281] [L]
  - Context: Enterprise audit requirements
  - Acceptance: Submission storage, decision history, audit log, replay capability
  - Dependencies: Database schema, migration system, audit framework

- [ ] Document tracking system [src: _archive/TODO.md:299] [M]
  - Context: Enterprise document lifecycle management
  - Acceptance: Document ingestion, version tracking, retention policies
  - Dependencies: Document store, metadata indexing, lifecycle rules

---

## 🔧 Tech Debt

Refactoring, optimization, and cleanup tasks.

### Configuration & Metadata

- [ ] Fill in package.json author field [src: package.json:26] [XS]
  - Current: `"author": ""`
  - Acceptance: Proper author attribution

- [ ] Add repository URL to package.json [src: package.json] [XS]
  - Context: Improves npm discovery and attribution
  - Acceptance: Repository field populated

### Type System

- [ ] Remove duplicate type definitions [src: _archive/TODO.md:315] [S]
  - Context: Potential duplication between backend and frontend (if frontend added)
  - Acceptance: Single source of truth for types
  - Dependencies: Audit type files, extract shared types

- [ ] Align WCPData with full WCPReport types [src: src/types/index.ts:25] [M]
  - Context: Type system has basic 3-field version, needs 11-field alignment
  - Acceptance: Consistent type naming, field coverage, validation schemas
  - Dependencies: Expanded data extraction implementation

### Code Quality

- [ ] Remove unused exports from types/index.ts [src: _archive/TODO.md:316] [XS]
  - Context: Cleanup for better maintainability
  - Acceptance: All exports have at least one usage

- [ ] Update documentation references to archived files [src: _archive/TODO.md:317] [S]
  - Context: Some docs may reference moved/archived content
  - Acceptance: All internal links valid, no broken references

### Testing

- [ ] Improve code documentation consistency [src: _archive/TODO.md:319] [M]
  - Context: Ensure all functions have JSDoc comments
  - Acceptance: Documentation coverage audit, missing docs added

- [ ] Add performance optimizations [src: _archive/TODO.md:318] [M]
  - Context: No performance benchmarks exist
  - Acceptance: Benchmark suite, bottleneck identification, optimization plan

### Mock Mode

- [x] ~~Add production-safe mock detection~~ **✅ Done (Phase 0)** [src: src/pipeline/orchestrator.ts] [S]
  - Context: Mock mode fallback exists for development
  - Resolution: `[WCP] Mode: MOCK` logged on every pipeline call; production warning added when `NODE_ENV=production`; `/health` endpoint exposes `mockMode: true` field

---

## Statistics

| Category | Count | Effort |
|----------|-------|--------|
| 🔴 Blockers | 8 | 5L, 2M, 1S |
| 🏃 Active Sprint | 6 | 2L, 3M, 1S |
| 📦 Backlog | 10 | 8M, 2S |
| 🧊 Icebox | 7 | 5L, 2M |
| 🔧 Tech Debt | 8 (1 done) | 2M, 2S, 4XS |
| **Total** | **40** | **13L, 15M, 7S, 4XS** |

---

## Sources

- Archive TODO: `_archive/TODO.md` (historical Phase 2/3/4 planning)
- Implementation Docs: `docs/implementation/*.md` (11 files with stubs)
- Source Code: `src/` (hardcoded values, limited implementations)
- Architecture Docs: `docs/architecture/` (defined but unimplemented)
- Evaluation Docs: `docs/evaluation/` (strategy without implementation)

---

**Audit Completed By**: AI Agent  
**Audit Date**: 2026-04-17  
**Phase 0 Sign-off**: 2026-04-19  
**Next Review**: When Phase 1 completes or major features land
