# Changelog

All notable changes to the WCP Compliance Agent will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

<<<<<<< HEAD
### Fixed
- **Logging consistency**: Replaced all `console.log` / `console.warn` calls with structured pino logger (`src/server.ts`, `src/retrieval/*`, `src/prompts/resolver.ts`, `src/prompts/registry.ts`)
- **Type safety**: Removed unsafe `as` assertions in `src/app.ts` and `src/retrieval/vector-search.ts`
- **Security**: Fixed `api/analyze.ts` to restore `process.env.OPENAI_API_KEY` after each request (try/finally), preventing key leakage between concurrent requests
- **Security**: Added input size limits to CSV endpoint (`MAX_CSV_BYTES`) and Vercel analyze endpoint
- **Security**: Added `instanceof File` validation in multipart upload endpoints (`src/app.ts`)
- **Security**: Replaced wildcard CORS (`*`) in Vercel functions with origin validation matching the Hono app
- **Code quality**: `generateTraceId()` now uses `crypto.randomUUID()` instead of `Math.random()`
- **Code quality**: Fallback decision in orchestrator uses a single `new Date()` timestamp to avoid inconsistencies
- **Code quality**: Fixed deprecated `.substr()` to `.slice()` in `src/utils/mock-responses.ts`
- **Code quality**: Added `Number.isFinite()` guards around `parseFloat()` in `src/retrieval/vector-search.ts`
- **Code quality**: Added error logging to previously silent `catch` blocks in `src/prompts/registry.ts`
- **API robustness**: Added missing try/catch to `/api/decisions` and `/api/jobs/:jobId` endpoints
- **API robustness**: Added `NaN` handling for `limit` query parameter in `/api/decisions`
- **Tests**: Fixed runtime type errors in `tests/data/wcp-examples.ts` (TypeScript union syntax used as values)
- **Tests**: Fixed `process.env` isolation bugs in 3 test files (shallow copy instead of reference)
- **Tests**: Replaced tautology assertions (`expect(true).toBe(true)`) with real assertions
- **Build**: `package.json` `clean` script now uses ESM-compatible `import('fs')`
- **Docs**: Removed broken internal links in `docs/development/`, `docs/adrs/`, `docs/architecture/`

### Security
- Added input length validation to `/analyze` endpoint to prevent potential DoS attacks.
- Added configurable `maxContentLength` (default 10,000 chars) to `ApiConfig`.
=======
### Added
- Unit tests for `generateMockWcpDecision` and `isMockMode` in `src/utils/mock-responses.ts`
- Product roadmap with 5 phases (scaffolding → MVP → showcase → post-launch)
- CHANGELOG.md for tracking changes
>>>>>>> origin/test-mock-responses-16182663778333512201

### Changed
- Removed personal IDE configs (`.claude/`, `.agents/skills/`) from repository
- Updated `.gitignore` to exclude `.claude/`, `.agents/`, `test-results/`, `playwright-report/`
- Updated `docs/roadmap/RELEASE_PLAN.md` to mark Phase 03 as complete

---

## [0.6.0] - 2026-04-19 — Phase 03: Open Source Release

### Added
- **`/showcase` React SPA** — Vite + TailwindCSS three-panel pipeline visualizer
  - Six pre-loaded payroll scenarios (clean, underpayment, OT violation, fringe shortfall, unknown role, extreme OT)
  - BYOK model: `X-OpenAI-Key` header, never stored, mock mode fallback
  - Layer 1 checks table with severity badges and regulation citations
  - Layer 2 LLM rationale, reasoning trace, referenced check IDs, token usage
  - Layer 3 trust score gauge, band badge, score breakdown, human review status
  - Animated sequential panel reveal (150ms stagger)
- **`api/analyze.ts`** — Vercel serverless function with BYOK header support
- **`api/health.ts`** — Vercel health check endpoint
- **`vercel.json`** — Routing config for Vercel deployment
- **`LICENSE`** — MIT license file (was missing from root despite package.json declaration)
- **`@vercel/node`** dev dependency

### Changed
- `README.md` — Full rewrite: open source framing, badges (CI/coverage/license/Node), ASCII architecture diagram, API reference, config table, tech stack, project structure
- `src/app.ts` — CORS origin updated to allow Vercel deployment URLs via function form
- `wcp.config.json` — Fixed overtime statute citation (`40 U.S.C. § 3702` → `29 CFR 5.32 / CWHSSA`)
- `CHANGELOG.md` — Added Phase 02 and Phase 03 entries

### Moved to `_archive/`
- `ROLE_FIT.md`, `DEMO_SCRIPT.md`, `WCP_CORE.md`, `ISSUES_AND_GAPS.md`, `TODO.md` — interview-prep material

---

## [0.5.0] - 2026-04-19 — Phase 02 Complete (MVP)

### Verified
- **Build**: `npm run build` exits 0
- **Tests**: 297 tests, 0 failures (246 unit + 15 new coverage-gap + 2 golden-set OT + existing integration)
- **Pipeline tests**: `npm run test:pipeline` 101/101
- **Lint**: `npm run lint:pipeline` — 0 architectural violations
- **Coverage**: `npm run test:coverage` — exit 0, ≥80% threshold met

### Added
- **Hybrid retrieval pipeline** (`src/retrieval/`) — BM25 (Elasticsearch) + vector (pgvector) + RRF fusion + cross-encoder reranking
- **11-field extraction** — `ExtractedWCP` expanded to include workerName, socialSecurityLast4, tradeCode, localityCode, hoursByDay, grossPay per WH-347
- **Prompt registry** (`src/prompts/`) — PostgreSQL-backed, versioned, per-org override; v2 prompt active
- **100-example golden set** (`tests/eval/golden-set.ts`) — expanded from 30 to 100 labeled examples
- **`tests/unit/coverage-gaps.test.ts`** — 15 new tests covering cross-encoder, vector-search mock mode, Layer 2 mock verdict, orchestrator health metrics, RRF edge cases
- **`data/dbwd-corpus.json`** — 20-trade DBWD synthetic corpus fixture
- **`scripts/seed-corpus.ts`** — Elasticsearch + pgvector seeder

### Fixed
- Extraction bug: `grossPay` was auto-derived (masking overtime violations) — now only populated from explicit input
- Wrong statute citation throughout: `40 U.S.C. § 3702` (Walsh-Healey) → `29 CFR 5.32 / CWHSSA` in prompts, entrypoint JSDoc, RELEASE_PLAN.md
- Layer 2 `check.type` enum missing `minimum_wage`, `hours`, `data_integrity` types

### Changed
- `vitest.config.ts` — Excluded live-infra adapters (`vector-search.ts`, `db-client.ts`, `wcp-agent.ts`) from coverage gate
- `RELEASE_PLAN.md` — Phase 02 status → ✅ Complete, Phase 03 → 🔄 In Progress

---

## [0.4.0] - 2026-04-19 — Phase 01 Complete (Scaffolding)

### Verified
- **Build**: `npm run build` exits 0
- **Tests**: 172 unit + 36 integration = 208 tests, all passing
- **Pipeline tests**: `npm run test:pipeline` 101/101 pass
- **Lint**: `npm run lint:pipeline` passes — no architectural violations
- **Coverage**: `npm run test:coverage` — **80.01% lines** (threshold met)

### Added
- **ADR-004**: Testing Strategy (Vitest + future Playwright) — `docs/adrs/ADR-004-testing-strategy.md`
- **GitHub Actions CI**: 6-stage pipeline-discipline workflow — `.github/workflows/pipeline-discipline.yml`
- **PostgreSQL setup guide**: Docker Compose + pgvector instructions — `docs/development/postgres-setup.md`
- **docker-compose.yml**: Local dev infrastructure (PostgreSQL + pgvector)
- **SQL migrations**: Initial schema for Phase 02 — `migrations/001_initial_schema.sql`
- **Migrations README**: Convention docs — `migrations/README.md`
- **New unit tests** (127 tests across 6 new files):
  - `tests/unit/env-validator.test.ts` — 17 tests
  - `tests/unit/agent-config.test.ts` — 11 tests
  - `tests/unit/app-config.test.ts` — 20 tests
  - `tests/unit/db-config.test.ts` — 9 tests
  - `tests/unit/errors.test.ts` — 46 tests
  - `tests/unit/human-review-queue.test.ts` — 24 tests
- **Phase 01 sign-off document**: `docs/phase-1-sign-off.md`
- **Coverage thresholds**: Added to `vitest.config.ts` (80% lines/functions/statements, 70% branches)
- **`@vitest/coverage-v8`** dev dependency pinned to `1.6.1`

### Changed
- `package.json`: `test:coverage` now excludes `tests/eval` (calibration requires real API key)
- `docs/roadmap/phase-01-scaffolding.md`: Status updated to `✅ Complete — 2026-04-19`, all exit gates checked
- `docs/roadmap/README.md`: Phase 01 marked `✅ Complete (verified 2026-04-19)`
- `docs/adrs/README.md`: ADR-004 added to index

---

## [0.3.1] - 2026-04-19 — Phase 0 Complete

### Verified
- **Build**: `npm run build` exits 0, zero TypeScript errors
- **Tests**: `npm run test:pipeline` 101/101 pass (75 unit + 36 integration, including pipeline-discipline suite)
- **Lint**: `npm run lint:pipeline` passes — no architectural violations
- **Mock mode**: `OPENAI_API_KEY=mock node dist/index.js` produces valid `TrustScoredDecision` end-to-end

### Added
- `mockMode` field in `/health` API response for visibility into mock vs. live state
- Production warning in orchestrator when `NODE_ENV=production` and `isMockMode()` is true
- `repository` and `author` fields in `package.json`

### Fixed
- `src/utils/env-validator.ts`: Added `test-api-key` as valid mock key (aligned with `isMockMode()`); updated `OPENAI_MODEL` default to `gpt-4o-mini`; expanded valid model list to include `gpt-5.4`
- `src/config/agent-config.ts`: Aligned default model from `gpt-5-nano` to `gpt-4o-mini`
- `src/pipeline/orchestrator.ts`: Aligned logged default model to `gpt-4o-mini`
- `src/app.ts`: Aligned health endpoint default model; imported `isMockMode` for health field
- `.env.example`: Updated `OPENAI_MODEL` default comment from `gpt-5.4` to `gpt-4o-mini`
- `AGENTS.md`: Updated `OPENAI_MODEL` default from `GPT 5.4` to `gpt-4o-mini`
- `WCP_CORE.md`: Updated `OPENAI_MODEL` example from `gpt-5.4` to `gpt-4o-mini`
- `docs/architecture/decision-architecture.md`: Fixed stale type name `WCPDecision` → `TrustScoredDecision`
- `docs/development/dev-environment.md`: Replaced `npm run lint` and `npm run typecheck` with actual scripts
- `docs/development/contributor-guide.md`: Same stale command fixes; removed duplicate CI gate row
- `docs/development/how-to-add-check.md`: Same stale command fixes
- `docs/evaluation/release-gates.md`: Same stale command fixes in CI workflow example

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
