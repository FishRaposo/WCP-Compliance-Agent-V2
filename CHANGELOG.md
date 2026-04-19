# Changelog

All notable changes to the WCP Compliance Agent will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Product roadmap with 5 phases (scaffolding → MVP → showcase → post-launch)
- CHANGELOG.md for tracking changes

### Changed
- Documentation structure cleaned up (removed template scaffolds)

### Performance
- Optimized `HumanReviewQueueService` sort comparator by replacing expensive `new Date().getTime()` calls with direct string comparison for ISO 8601 timestamps (~60x faster).

---

## [0.3.0-dev] - 2026-04-17

### Added
- **Three-layer decision pipeline** (deterministic scaffold → LLM verdict → trust score)
  - Layer 1: Deterministic scaffold (`src/pipeline/layer1-deterministic.ts`)
  - Layer 2: LLM verdict (`src/pipeline/layer2-llm-verdict.ts`)
  - Layer 3: Trust score + human review (`src/pipeline/layer3-trust-score.ts`)
  - Orchestrator: Pipeline composer (`src/pipeline/orchestrator.ts`)
- **Trust scoring system** with hybrid formula (0.35 det + 0.25 class + 0.20 llm + 0.20 agree)
- **Human review queue** stub (`src/services/human-review-queue.ts`)
- **CI pipeline discipline** lint script (`scripts/lint-pipeline-discipline.ts`)
- **Trust calibration tests** with golden set (`tests/eval/trust-calibration.test.ts`)
- **Compliance documentation suite**
  - Regulatory compliance report
  - Traceability matrix (regulation-to-code mapping)
  - Implementation guide
- **ADR-005**: Three-Layer Decision Architecture
- **Roadmap consolidation**: Merged `product-roadmap/` into `docs/roadmap/`
  - Added `docs/roadmap/README.md` with next actions
  - Added `docs/roadmap/executive-summary.md`
  - Added `docs/roadmap/phase-01-scaffolding.md` through `phase-05-post-launch.md`
- **ADR consolidation**: All ADRs now in `docs/adrs/`
  - Added `docs/adrs/README.md` as index
  - Moved ADR-001/002/003 from `docs/decisions/`
- **Health metrics preserved** in `TrustScoredDecision` (backward compatible)
  - `cycleTime`, `tokenUsage`, `validationScore`, `confidence`

### Changed
- Updated `docs/foundation/current-state.md` for three-layer architecture
- Updated `docs/quick-start.md` API response examples
- Updated `docs/INDEX.md` with new structure
- Updated `README.md` doc map

---

## [0.2.0] - 2026-04-17

### Added
- Comprehensive implementation documentation (11 tech stack guides)
  - Warehouse (Redshift/BigQuery)
  - Search (Elasticsearch)
  - Cache (Redis)
  - Vector storage (pgvector)
  - Hybrid retrieval with reranking
  - Observability (OpenTelemetry + Phoenix)
  - Prompt infrastructure (versioning, A/B testing)
  - Cost tracking
  - CI evaluation framework
  - Entity data model
- `todo.md` with 40 prioritized items across Blockers/Active/Backlog/Icebox/Tech Debt
- `job.md` recruiter handbook covering 12 JD responsibilities
- Product roadmap (5 phases, 6-9 month timeline, solo founder scope)
- `.gitignore` updated for `_project-standards/` and `_archive/`

### Changed
- Expanded docs/ with implementation guides and evaluation strategy
- Documentation structure now supports 2-min, 10-min, and 20-min reading paths

---

## [0.1.0] - 2026-04-10

### Added
- Initial WCP Compliance Agent implementation
  - `generateWcpDecision()` entrypoint with mock mode support
  - `extractWCPTool` for role/hours/wage extraction (3-field model)
  - `validateWCPTool` for DBWD rate validation
  - Basic WCP agent with structured output (WCPDecisionSchema)
  - Deterministic validation findings (overtime, underpay)
- API layer (Hono)
  - `/analyze` and `/api/analyze` endpoints
  - `/health` endpoint with dependency status
- Testing framework (Vitest)
  - 197 tests (169 passing, 28 server-dependent skipped)
  - Unit and integration test structure
- Configuration system
  - `src/config/` with agent, app, and db configs
  - Environment validation
- Infrastructure utilities
  - Structured logging (Pino)
  - Error handling with custom error classes
  - Retry utilities
  - Mock response generators
- Documentation foundation
  - `README.md` with current vs target overview
  - `docs/foundation/current-state.md`
  - `docs/foundation/implemented-vs-target.md`
  - `docs/foundation/tech-stack-map.md`
  - `docs/foundation/glossary.md`
  - Architecture docs (9 files covering system, retrieval, validation, etc.)
  - Evaluation strategy and quality bars
  - Roadmap and milestone docs
- Mastra framework integration
  - Agent setup with OpenAI models
  - Tool registration
  - LibSQL storage

### Technical Stack
- TypeScript 5.x
- Mastra 0.24.x
- Hono 4.11.x
- Vitest 1.x
- Zod for validation
- LibSQL for storage

---

## How to Read This Changelog

- **[Unreleased]**: Work in progress, not yet "complete"
- **Versioned sections**: Milestones with specific scope
- **Added**: New features, docs, capabilities
- **Changed**: Modifications to existing functionality
- **Fixed**: Bug fixes
- **Deprecated**: Features planned for removal
- **Removed**: Deleted features
- **Security**: Security-related changes

---

## Future Versions (Planned)

### 0.3.0 (Phase 02: MVP - Target)
- Hybrid retrieval pipeline (BM25 + vector + cross-encoder)
- pgvector integration with embeddings
- PDF/CSV document ingestion
- 11-field WCP data extraction
- Prompt registry and versioning
- CI evaluation framework
- Expanded DBWD rate coverage (10+ roles)

### 0.4.0 (Phase 03: Showcase - Target)
- Public demo deployment
- Landing page with interactive widget
- User feedback collection
- Portfolio presentation materials
- Demo video/walkthrough

### 1.0.0 (Long-term)
- Production-ready showcase
- Complete feature set documented
- Optimized for recruiter/hiring manager review
