# Phase 0: Out of Scope Items

This document tracks features and improvements that were **intentionally deferred** during Phase 0 (Foundation & Cleanup) and will be addressed in future phases.

## Phase 0 Completed

- ✅ Clean state verification (npm install, build, test, lint)
- ✅ Mock mode detection unification across codebase
- ✅ Dead code cleanup (removed unused uuid dependencies)
- ✅ API endpoint smoke test
- ✅ Environment configuration template (.env.example)

## Deferred to Phase 1: Core Pipeline Hardening

### DBWD Rate Expansion
- **Current**: Hardcoded 5 trades (Electrician, Laborer, Plumber, Carpenter, Mason)
- **Deferred**: Full DBWD database integration with PostgreSQL + pgvector
- **Rationale**: Phase 1 focuses on hardening existing deterministic logic before adding external dependencies
- **Planned**: Phase 2 - Document Ingestion & Persistence

### Deterministic Rule Expansion
- **Current**: 4 basic checks (prevailing wage, overtime, fringe, classification)
- **Deferred**: Additional compliance rules (e.g., apprenticeship ratios, fringe benefit calculations, certified payroll reporting format)
- **Rationale**: Phase 1 focuses on ensuring existing checks are robust before adding complexity
- **Planned**: Phase 1+ as regulatory requirements are identified

### Error Handling Granularity
- **Current**: Generic fallback decision on pipeline errors
- **Deferred**: Layer-specific error handling with recovery strategies
- **Rationale**: Phase 1 will add more granular error classification and retry logic
- **Planned**: Phase 1 - Error taxonomy refinement

## Deferred to Phase 2: Document Ingestion & Persistence

### PDF/CSV Parsing
- **Current**: Text-only input via API
- **Deferred**: PDF and CSV file upload and parsing
- **Rationale**: Requires document ingestion infrastructure
- **Planned**: Phase 2 - Document ingestion module

### PostgreSQL + pgvector Integration
- **Current**: In-memory human review queue, hardcoded DBWD rates
- **Deferred**: Persistent storage for decisions, human review queue, and DBWD rates
- **Rationale**: Requires database schema design and migration strategy
- **Planned**: Phase 2 - Persistence layer

### Audit Trail Persistence
- **Current**: Audit trail in memory, included in response
- **Deferred**: 7-year audit retention in database (Copeland Act requirement)
- **Rationale**: Requires database schema and retention policies
- **Planned**: Phase 2 - Audit persistence

## Deferred to Phase 3: Hybrid Retrieval (RAG)

### RAG-Based DBWD Rate Lookup
- **Current**: Hardcoded DBWD rate lookup
- **Deferred**: Vector search over DBWD determinations for rate resolution
- **Rationale**: Requires Elasticsearch/pgvector infrastructure and document embeddings
- **Planned**: Phase 3 - Hybrid retrieval system

### Regulation Citation Retrieval
- **Current**: Hardcoded regulation citations in checks
- **Deferred**: Dynamic regulation retrieval from compliance documents
- **Rationale**: Requires document corpus and semantic search
- **Planned**: Phase 3 - RAG integration

## Deferred to Phase 4: Evaluation Framework

### Trust Calibration Golden Set
- **Current**: Basic trust score computation
- **Deferred**: Golden set of labeled decisions for trust calibration
- **Rationale**: Requires evaluation infrastructure and labeled dataset
- **Planned**: Phase 4 - Evaluation framework

### A/B Testing Infrastructure
- **Current**: Single pipeline path
- **Deferred**: A/B testing for prompt variations, model versions, and threshold tuning
- **Rationale**: Requires evaluation metrics and experiment tracking
- **Planned**: Phase 4 - Evaluation framework

## Deferred to Future Phases

### Observability & Monitoring
- **Current**: Basic console logging
- **Deferred**: Structured logging, metrics, distributed tracing (Langfuse)
- **Rationale**: Infrastructure optimization, not critical for Phase 0-1
- **Planned**: Phase 2+ - Observability layer

### Batch Processing
- **Current**: Single-request processing
- **Deferred**: Bulk WCP submission processing
- **Rationale**: Requires queue infrastructure and error handling
- **Planned**: Phase 2+ - Batch processing module

### API Authentication
- **Current**: No authentication
- **Deferred**: API key authentication, rate limiting
- **Rationale**: Security hardening, not critical for local development
- **Planned**: Phase 2+ - Security layer

### Multi-User Support
- **Current**: Single-user (no user context)
- **Deferred**: User authentication, per-user decision history
- **Rationale**: Requires user management infrastructure
- **Planned**: Phase 2+ - User management

### Real-Time Notifications
- **Current**: No notifications
- **Deferred**: Webhooks for human review queue updates, decision notifications
- **Rationale**: Requires notification infrastructure
- **Planned**: Phase 2+ - Notification system

## Technical Debt Deferred

### Mastra Agent Cleanup
- **Current**: Legacy Mastra agent in `src/mastra/agents/wcp-agent.ts`
- **Deferred**: Remove or fully migrate to pipeline architecture
- **Rationale**: Legacy code still referenced in tests; removal requires test updates
- **Planned**: Phase 1 - Mastra deprecation

### Deprecated Parameter Removal
- **Current**: `mastraInstance`, `maxSteps`, `onStepFinish` parameters kept for backward compatibility
- **Deferred**: Remove deprecated parameters after confirming no external usage
- **Rationale**: Backward compatibility for existing integrations
- **Planned**: Phase 1 - API contract cleanup

### Type Safety Improvements
- **Current**: Some `any` types in error handling
- **Deferred**: Replace `any` with proper error type unions
- **Rationale**: Non-critical for Phase 0; improves type safety
- **Planned**: Phase 1 - Type hardening

## Documentation Deferred

### API Reference Documentation
- **Current**: JSDoc comments in code
- **Deferred**: OpenAPI/Swagger specification, API reference docs
- **Rationale**: Documentation polish, not critical for Phase 0
- **Planned**: Phase 1+ - API documentation

### Architecture Diagrams
- **Current**: Text-based architecture documentation
- **Deferred**: Visual architecture diagrams (Mermaid, C4 model)
- **Rationale**: Communication aid, not critical for Phase 0
- **Planned**: Phase 1+ - Architecture diagrams

### Deployment Guides
- **Current**: Local development instructions
- **Deferred**: Production deployment guide, Docker setup
- **Rationale**: Infrastructure setup, not critical for Phase 0
- **Planned**: Phase 2+ - Deployment documentation

## Rationale Summary

Phase 0 focused on establishing a **clean foundation**:
- Verify build/test/lint pipeline works
- Unify mock mode detection for consistent testing
- Remove dead code and dependencies
- Smoke-test API endpoint
- Document environment configuration

Future phases will layer in infrastructure capabilities:
- **Phase 1**: Harden core pipeline (error handling, rule expansion)
- **Phase 2**: Document ingestion & persistence (PDF/CSV, PostgreSQL)
- **Phase 3**: Hybrid retrieval (RAG for DBWD rates)
- **Phase 4**: Evaluation framework (trust calibration, A/B testing)

This phased approach ensures **interview signal** is maximized early (clean, working pipeline) while building toward production-ready infrastructure.
