# TODO.md

Actionable gaps for the WCP Compliance Agent — scoped to the current three-layer pipeline architecture.
Items harvested from a full codebase audit (code, config, docs) on 2026-04-20.

**Last updated:** 2026-04-20 — Sprint 2 audit complete. A1–A4 fixed. New backlog items A5–A12 added.  
**Architecture reference:** `AGENTS.md`

---

## ✅ Resolved (sprint 2 audit — 2026-04-20)

| Item | What was done | Key files |
|---|---|---|
| **A1** | Fixed critical regex bug: per-day hour patterns matched `(\.\d+...)` requiring a leading decimal point, meaning `Mon: 8` would never match. Corrected to `(\d+(?:\.\d+)?)`. | `src/pipeline/layer1-deterministic.ts:68-74` |
| **A2** | Fixed broken ESLint frontend config: `reactHooks.configs['recommended-latest']` uses the legacy `plugins: [string]` format, rejected by ESLint 9. Changed to `reactHooks.configs.flat['recommended-latest']`. | `eslint.config.frontend.js` |
| **A3** | Fixed React lint error: `setVisiblePanels(0)` was called synchronously inside `useEffect`, triggering cascading renders. Moved reset into the cleanup function instead. | `src/frontend/components/PipelineVisualizer.tsx:95-101` |
| **A4** | Fixed `persistDecision().catch(() => {})` in orchestrator silently swallowing unexpected errors. Now logs the error before suppressing. | `src/pipeline/orchestrator.ts:156` |

---

## ✅ Resolved (sprint 1)

| Item | What was done | Key files |
|---|---|---|
| **T6** | Replaced all `console.*` with pino structured logger via `childLogger()` | `src/utils/logger.ts`, all pipeline files |
| **H1** | Expanded `ExtractedWCP` + `ExtractedEmployee` to full WH-347 model | `src/types/decision-pipeline.ts`, `src/pipeline/layer1-deterministic.ts` |
| **H2** | Configurable DBWD corpus via `WCP_CONFIG_PATH`; `wcp.config.json` updated | `src/retrieval/hybrid-retriever.ts`, `wcp.config.json` |
| **H3** | `checkTotals` rule — `TOTAL_MISMATCH` / `MISSING_TOTAL` checks | `src/pipeline/layer1-deterministic.ts` |
| **H4** | `ensureSignatures` rule — `MISSING_SIGNATURE` check | `src/pipeline/layer1-deterministic.ts` |
| **H5** | Per-employee per-day overtime (`OVERTIME_WEEKLY`, `OVERTIME_DAILY`) | `src/pipeline/layer1-deterministic.ts` |
| **H6** | `FRINGE_UNDERPAYMENT` check vs. DBWD required fringe rate | `src/pipeline/layer1-deterministic.ts` |
| **M1** | `persistDecision()` to PostgreSQL; `GET /api/decisions`; migration SQL | `src/services/audit-persistence.ts`, `migrations/001_create_audit_tables.sql` |
| **M2** | PDF ingestion via `pdf-parse`; `POST /api/analyze-pdf` multipart | `src/ingestion/pdf-ingestion.ts`, `src/app.ts` |
| **M3** | CSV bulk ingestion via `papaparse`; `POST /api/analyze-csv` | `src/ingestion/csv-ingestion.ts`, `src/app.ts` |
| **M4** | `promptVersion`/`promptKey` in `LLMVerdict` + Layer 2 audit event | `src/pipeline/layer2-llm-verdict.ts`, `src/prompts/resolver.ts` |
| **M5** | OTel SDK in `src/instrumentation.ts`; OTLP or console exporter | `src/instrumentation.ts` |
| **M6** | Calibration CI job hard-fails on `main`; artifact upload added | `.github/workflows/pipeline-discipline.yml` |
| **M7** | `tradeAliases` from `wcp.config.json` merged into `IN_MEMORY_ALIASES` | `src/retrieval/hybrid-retriever.ts`, `wcp.config.json` |
| **M8** | Postgres-backed async job queue; `POST /api/jobs`, `GET /api/jobs/:id` | `src/services/job-queue.ts`, `src/app.ts` |
| **I6** | Playwright E2E tests for 6 API scenarios + health + async job; CI Stage 7 | `tests/e2e/api-scenarios.test.ts`, `playwright.config.ts` |
| **I7** | `.min(0)` Zod constraints on all numeric fields in `ExtractedWCPSchema` | `src/types/decision-pipeline.ts` |
| **I8** | `superRefine` cross-field `traceId` consistency in `TrustScoredDecisionSchema` | `src/types/decision-pipeline.ts` |

---

## 🔧 Backlog (from 2026-04-20 audit)

### A5 — `@vercel/node` devDependency vulnerabilities — no fix available without breaking changes [S]

`npm audit` reports 9 vulnerabilities (3 moderate, 6 high) in `@vercel/node`'s transitive deps:
- `ajv` ReDoS (moderate) — `@vercel/static-config`
- `minimatch` ReDoS ×3 (high) — `@vercel/python-analysis`
- `path-to-regexp` backtracking ReDoS (high) — `@vercel/node`
- `smol-toml` DoS (moderate) — `@vercel/python-analysis`
- `undici` ×6 (high) — `@vercel/node`

**All are in devDependencies only** and have zero attack surface: `@vercel/node` is only imported as a TypeScript type source (`VercelRequest`, `VercelResponse`) in `api/analyze.ts` and `api/health.ts`. The production Hono server does not import or run any of these packages. No user data passes through them.

The only npm-provided fix (`npm audit fix --force`) downgrades `@vercel/node` to `3.0.1` or upgrades to `5.7.12` in a way that still leaves 5 vulnerabilities. Transitive dep pinning via `overrides` would risk breaking Vercel's internal build toolchain. Accepted as-is; will revisit if a clean upstream fix becomes available.
[src: `npm audit`, `package.json`]

### A6 — Add rate limiting to API endpoints [M]

`POST /api/analyze`, `POST /api/analyze-pdf`, and `POST /api/analyze-csv` have no rate limiting. Each request can trigger an OpenAI API call. Consider adding a simple in-memory rate limiter (e.g., `hono/rate-limiter` or a sliding window on traceId/IP) to protect against cost spikes and API quota exhaustion. Layer 2 already throws `RateLimitError` on 429s from OpenAI — this item adds a *server-side* guard upstream of that.
[src: `src/app.ts:101-148`]

### A7 — Input size limit on `/api/analyze` text endpoint [S]

`POST /api/analyze` accepts arbitrary-length JSON bodies. Only the PDF endpoint (`MAX_PDF_BYTES`, default 10 MB) and the CSV endpoint (no explicit limit) have any size guard. The text endpoint has no `Content-Length` check, enabling trivial DoS via large payloads that are passed to the full pipeline. Add a `MAX_CONTENT_BYTES` limit (suggested: 64 KB) and return 413 if exceeded.
[src: `src/app.ts:23-63`]

### A8 — In-memory job fallback is process-local (undocumented) [S]

`claimNextJob()` in `job-queue.ts` falls back to `IN_MEMORY_JOBS` when PostgreSQL is unavailable. If a worker process starts after jobs were queued in a different process, in-memory jobs are invisible to it. Document this limitation clearly in the service header and add a comment warning that the in-memory fallback is process-local and suitable for single-process development only.
[src: `src/services/job-queue.ts:186-228`]

### A9 — `audit_events` table missing `trace_id` index [S]

`persistAuditEvents()` inserts rows per audit event, but `audit_events` has no index on `trace_id`. Any query joining or filtering on `trace_id` will do a full scan as the table grows (7-year retention creates large row counts). The `decisions` table has a PRIMARY KEY on `trace_id`; `audit_events` only has a `BIGSERIAL` primary key.

Add to migration:
```sql
CREATE INDEX IF NOT EXISTS audit_events_trace_id_idx ON audit_events (trace_id);
```
[src: `src/services/audit-persistence.ts:42-49`, `migrations/001_create_audit_tables.sql`]

### A10 — `Layer2InputSchema` diverges from `DeterministicReport` type [M]

`layer2-llm-verdict.ts` defines its own `Layer2InputSchema` (a Zod object) with only a subset of `DeterministicReport`'s fields. If `DeterministicReport` grows new required fields, `Layer2InputSchema` will be stale and validators may silently strip new fields from the prompt context. Consider deriving it from the canonical `DeterministicReportSchema` in `src/types/decision-pipeline.ts` via `.pick()` / `.omit()`, so type evolution is tracked in one place.
[src: `src/pipeline/layer2-llm-verdict.ts:56-96`]

### A11 — `validateEnvironmentOrExit` uses `console.*` instead of pino [S]

`src/utils/env-validator.ts` still uses `console.warn` / `console.error` / `console.log` directly (lines 117–135). All other modules use `childLogger()`. Since `validateEnvironmentOrExit()` runs at startup before the full app is initialised, this is partially intentional, but produces inconsistent log format. Consider instantiating a local pino logger inline in `env-validator.ts` so log format matches the rest of the system.
[src: `src/utils/env-validator.ts:112-136`]

### A12 — `wcp.config.json` has dead CORS entry [XS]

`wcp.config.json:94` contains a CORS `allowedOrigins` list (including `http://localhost:3001`) that is never read — CORS is entirely controlled by `src/app.ts:68-80` via `process.env.ALLOWED_ORIGINS`. The dead config entry could mislead contributors into thinking origins are configurable via `wcp.config.json`. Remove the stale CORS block or add a comment clarifying it is unused.
[src: `wcp.config.json:90-96`, `src/app.ts:68-83`]

---

## 🧊 Icebox

### I1 — OCR for scanned WH-347s [L]
Use `tesseract.js` for image preprocessing + text extraction on scanned PDFs. Only worth pursuing after M2 (text-layer PDF parsing) is stable and its limits are understood. [src: roadmap Phase 05-B]

### I2 — Cost tracking per decision [M]
`health.tokenUsage` already captures token count per decision. Persist it to a `cost_log` table with model pricing metadata. Surface in a dashboard or API endpoint. [src: `src/types/decision-pipeline.ts:376-388`] Depends on M1.

### I3 — Elasticsearch BM25 for live DBWD corpus [L]
Build an ETL pipeline: ingest DBWD PDFs → chunk by trade×locality×section → index in Elasticsearch. `ELASTICSEARCH_URL` is already wired in `bm25-search.ts`. Currently the hybrid retriever always falls back to in-memory corpus (both ES and pgvector are unreachable in default setup). [src: `src/retrieval/bm25-search.ts`, `src/retrieval/vector-search.ts`]

### I4 — SAM.gov / DOL API integration for live DBWD rates [L]
Replace static in-memory corpus with a scheduled pull from SAM.gov or DOL Wage Determinations Online API. Add rate version tracking for audit trail. Requires external DOL credentials. [src: roadmap Phase 05-D]

### I5 — Frontend: multi-employee display [M]
`PipelineVisualizer` currently shows one worker's data. Once H1 lands and `employees[]` is in the data model, update the UI to show per-employee accordion panels in `Layer1Panel.tsx`. [src: `src/frontend/components/Layer1Panel.tsx`]

---

## Won't Fix (Rationale)

The following were present in archived specs or previous `TODO.md` versions but are explicitly excluded:

| Item | Reason |
|---|---|
| Multi-tenant isolation / RBAC / JWT auth | Out of scope for open-source showcase |
| Batch processing queue (Redis/BullMQ) | M8 covers async via simpler in-memory queue first |
| Prometheus / Grafana dashboards | M5 OTel covers observability; dashboards are deployment-specific |
| Old Mastra-era utilities (`PinoLogger`, `LibSQLStore`, `retry.ts`) | Not in current architecture; superseded by `src/utils/errors.ts` retry helpers |
| `CORS` allowed origins hardcoded to `localhost:3001` in `wcp.config.json:121` | Already superseded by dynamic CORS logic in `src/app.ts:60-73`; config entry is dead |
