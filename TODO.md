# TODO.md

Actionable gaps for the WCP Compliance Agent — scoped to the current three-layer pipeline architecture.
Items harvested from a full codebase audit (code, config, docs) on 2026-04-20.

**Last updated:** 2026-04-20  
**Architecture reference:** `AGENTS.md`

---

## 🔥 Blockers / Critical Bugs

### B1 — Layer 2 model hardcoded, ignores `OPENAI_MODEL` env var [S]
- **Source:** `src/pipeline/layer2-llm-verdict.ts:231,254,285`
- **Problem:** `openai("gpt-4o-mini")` is hardcoded three times inside the actual `generateText` call and in the returned verdict object. The `OPENAI_MODEL` env var is read elsewhere (`orchestrator.ts:74`, `app.ts:86`, `agent-config.ts:34`) but **never wired into Layer 2**. Any operator setting `OPENAI_MODEL=gpt-4o` gets no effect on the actual inference.
- **Fix:** Read `process.env.OPENAI_MODEL ?? "gpt-4o-mini"` once at the top of `generateLayer2Verdict`, pass it to `openai(model)` and to the returned `model` field.
- **Risk:** Silent misconfiguration in production.

### B2 — `wcp.config.json` trust weights not read at runtime [S]
- **Source:** `wcp.config.json:57-62`, `src/pipeline/layer3-trust-score.ts:41-46`
- **Problem:** `wcp.config.json` declares weights `{deterministic: 0.25, classification: 0.15, llmSelf: 0.30, agreement: 0.30}`, but `layer3-trust-score.ts` uses hardcoded constants `{0.35, 0.25, 0.20, 0.20}` — a completely different formula. The config file is **not loaded anywhere** in the pipeline.
- **Fix:** Either delete the `trust.weights` block from `wcp.config.json` to avoid confusion, or load the config and wire `TRUST_WEIGHTS` from it (preferred long-term). Document the chosen formula as authoritative.
- **Risk:** Misleading docs; any operator expecting to tune weights via config gets no effect.

### B3 — SQL migrations referenced but directory does not exist [S]
- **Source:** `docs/roadmap/RELEASE_PLAN.md:45`, `wcp.config.json:161`
- **Problem:** `RELEASE_PLAN.md` claims `migrations/001_initial_schema.sql` is complete, and `wcp.config.json` sets `"migrationPath": "./migrations"`. Neither the `migrations/` directory nor the SQL file exists in the repository.
- **Fix:** Either create the migration file (required before any PostgreSQL work) or remove the references to prevent false confidence.

---

## 🏃 Active Sprint (Phase 03 / Showcase Polish)

### S1 — Locality hardcoded to `"Metropolitan Area"` in retriever [S]
- **Source:** `src/retrieval/hybrid-retriever.ts:156,170`
- **Problem:** Both `buildRateInfo` and `hitToDBWDRateInfo` unconditionally set `locality: "Metropolitan Area"`. The `ExtractedWCP.localityCode` field exists but is never passed through to the rate lookup or stored in `DBWDRateInfo.locality`.
- **Fix:** Accept and propagate an optional `locality` parameter from Layer 1 through `lookupDBWDRate()`. Fall back to `"Metropolitan Area"` only when absent.
- **Files:** `src/retrieval/hybrid-retriever.ts`, `src/pipeline/layer1-deterministic.ts`

### S2 — Mock mode `DBWD_RATES` has only 2 trades vs. 20 in main corpus [S]
- **Source:** `src/utils/mock-responses.ts:9-12`
- **Problem:** `generateMockWcpDecision` only recognises `Electrician` and `Laborer`. Every other trade produces an "Invalid Role" rejection in mock mode, making 18 of the 20 golden-set scenarios behave incorrectly during offline testing.
- **Fix:** Either expand `DBWD_RATES` in `mock-responses.ts` to match `IN_MEMORY_CORPUS` in `hybrid-retriever.ts`, or refactor the mock to use the same in-memory corpus (preferred — single source of truth).
- **Files:** `src/utils/mock-responses.ts`

### S3 — `env-validator.ts` allowlist contains speculative model names [S]
- **Source:** `src/utils/env-validator.ts:49`
- **Problem:** Valid models include `'gpt-5.4'`, `'gpt-5.4-mini'`, `'gpt-5-nano'` — model IDs that do not exist in the OpenAI API as of the audit date. Accepting them silently allows misconfiguration.
- **Fix:** Remove speculative model names. Accept a broader pattern (any non-empty string starting with `gpt-` or `o`) so new models don't require a code change, or gate only on known-working IDs.
- **Files:** `src/utils/env-validator.ts`

### S4 — `wcp.config.json` feature flags stale / misleading [S]
- **Source:** `wcp.config.json:134-139`
- **Problem:** `ragLookup: false` and `observability: false` are set, but the hybrid retriever (BM25 + vector + RRF + cross-encoder) is fully implemented and active. Nothing reads these flags to gate the feature — they give a false impression of capability.
- **Fix:** Either set `ragLookup: true` (accurate) or delete the `features` block and document status in `AGENTS.md` / `CHANGELOG.md`.
- **Files:** `wcp.config.json`

### S5 — `wcp.config.json` model set to `"gpt-5.4"` (non-existent) [S]
- **Source:** `wcp.config.json:44`
- **Problem:** `pipeline.llm.model` is set to `"gpt-5.4"`, but this key is never read in the pipeline. Combined with B1 and B2, the config file is entirely decorative for LLM and trust configuration.
- **Fix:** Set to `"gpt-4o-mini"` (matches actual runtime default) or wire the config load into Layer 2 (part of B1 fix).
- **Files:** `wcp.config.json`

### S6 — `RELEASE_PLAN.md` Phase 02 status inconsistent with codebase [S]
- **Source:** `docs/roadmap/RELEASE_PLAN.md:78-93`
- **Problem:** Plan lists BM25, vector search, RRF, cross-encoder, prompt registry, and 20-trade corpus as "Not started", but all are fully implemented. Phase 02 exit gate checkboxes are unchecked despite being met.
- **Fix:** Update `RELEASE_PLAN.md` to reflect actual Phase 02 completion status (close gate, check exit criteria).
- **Files:** `docs/roadmap/RELEASE_PLAN.md`

---

## 📋 Backlog

### H1 — Expand `ExtractedWCP` to full 11-field WH-347 data model [M]
- **Source:** `src/types/decision-pipeline.ts:59-112`, `src/pipeline/layer1-deterministic.ts`
- **Why:** Only `workerName`, `tradeCode`, `hoursByDay`, `grossPay` (and a few others) are extracted. The WH-347 form requires: `subcontractor`, `projectId`, `weekStart`, `weekEnd`, `hoursByDay` (per-day map, not just total), `reportedBaseRate`, `reportedFringeRate`, `reportedTotalPay`, `signatures[]`, `locality`, `socialSecurityLast4`.
- **Files:** `src/types/decision-pipeline.ts`, `src/pipeline/layer1-deterministic.ts`, `tests/unit/pipeline-contracts.test.ts`
- **Effort:** 1–2 days

### H2 — Make DBWD rates configurable via JSON, not hardcoded [M]
- **Source:** `src/pipeline/layer1-deterministic.ts`, `src/retrieval/hybrid-retriever.ts:29-50`
- **Why:** 20 trades are hardcoded in `hybrid-retriever.ts`. Real deployments need 100+ trades and rates that change quarterly.
- **What:** Move rate table to `data/dbwd-corpus.json` (already partially exists per comments). Support override via `WCP_CONFIG_PATH` env var. Expand to full 20 trades already in the corpus.
- **Files:** `wcp.config.json`, `src/retrieval/hybrid-retriever.ts`, `data/dbwd-corpus.json`
- **Effort:** 1–2 days

### H3 — Add `checkTotals` deterministic rule [S]
- **Source:** `src/pipeline/layer1-deterministic.ts` (absent), `_archive` spec
- **Why:** No arithmetic cross-check: sum of `hoursByDay` values vs. `reportedWeeklyHours`. Spec requires ±0.25h tolerance.
- **What:** New Layer 1 check: `TOTAL_MISMATCH` (ERROR) if delta > 0.25; `MISSING_TOTAL` (WARN) if field absent.
- **Depends on:** H1
- **Files:** `src/pipeline/layer1-deterministic.ts`, `tests/unit/pipeline-contracts.test.ts`
- **Effort:** 2–4 hours

### H4 — Add `ensureSignatures` deterministic rule [S]
- **Source:** `src/pipeline/layer1-deterministic.ts` (absent)
- **Why:** Unsigned WH-347s are non-compliant. No signature check exists.
- **What:** New Layer 1 check: if `signatures[]` is empty or absent → `MISSING_SIGNATURE` (ERROR).
- **Depends on:** H1 (needs `signatures[]` in `ExtractedWCP`)
- **Files:** `src/pipeline/layer1-deterministic.ts`, `tests/unit/pipeline-contracts.test.ts`
- **Effort:** 1–2 hours

### H5 — Per-employee per-day overtime granularity [S]
- **Source:** `src/pipeline/layer1-deterministic.ts` (`checkOvertime` uses total hours only)
- **Why:** Overtime must be checked per-employee across their week independently, and daily overtime (>8h/day) must be flagged separately.
- **What:** Iterate over `employees[]`, sum each worker's `hoursByDay`, flag any > 40h with `OVERTIME_WEEKLY` and > 8h/day with `OVERTIME_DAILY`.
- **Depends on:** H1
- **Files:** `src/pipeline/layer1-deterministic.ts`
- **Effort:** 2–4 hours

### H6 — Fringe benefit validation check [S]
- **Source:** `src/pipeline/layer1-deterministic.ts` (fringe extracted but not validated vs. DBWD)
- **Why:** `fringe` is extracted from WCP but `checkFringeBenefits` only validates that fringes were reported, not that they meet the DBWD required rate.
- **What:** New check: if `extractedFringe < dbwdFringeRate` → `FRINGE_UNDERPAYMENT` (ERROR) with delta.
- **Depends on:** H1 (needs `reportedFringeRate` explicitly in model)
- **Files:** `src/pipeline/layer1-deterministic.ts`, `tests/unit/pipeline-contracts.test.ts`
- **Effort:** 2–4 hours

### M1 — Audit persistence (PostgreSQL) [L]
- **Source:** `src/services/human-review-queue.ts:1-5,121-123`, `src/services/db-client.ts`
- **Why:** `auditTrail` lives in memory only. Federal contracts require 7-year retention of payroll audit records. `HumanReviewQueueService` is explicitly a stub.
- **What:** Persist `TrustScoredDecision` to a `decisions` table + `audit_traces` table (append-only). Create `migrations/001_initial_schema.sql`. Use `src/services/db-client.ts`.
- **Schema (decisions):** `id`, `trace_id`, `verdict`, `trust_score`, `final_status`, `created_at`, `payload_json`
- **Schema (audit_traces):** `id`, `decision_id`, `stage`, `event`, `details_json`, `timestamp`
- **Files:** `src/services/db-client.ts`, new `src/services/audit-repository.ts`, `src/pipeline/orchestrator.ts`, `migrations/001_initial_schema.sql`
- **Effort:** 2–3 days

### M2 — PDF ingestion pipeline [L]
- **Source:** `wcp.config.json:135 (pdfParsing: false)`, roadmap
- **Why:** All input is free-text only. Real WH-347 forms are PDFs.
- **What:** Accept multipart PDF upload at `/api/analyze`. Use `pdf-parse` to extract text → pass through existing pipeline → normalize output to `ExtractedWCP`. Handle corrupted/unreadable PDFs.
- **Depends on:** H1
- **Files:** `api/analyze.ts`, new `src/ingestion/pdf-parser.ts`
- **Effort:** 3–5 days

### M3 — CSV ingestion (bulk payroll) [M]
- **Source:** roadmap, `wcp.config.json`
- **Why:** Payroll systems export CSV. Enables batch compliance checks.
- **What:** Accept CSV upload → parse rows into `ExtractedWCP[]` → run pipeline per row → return `TrustScoredDecision[]`. Use `papaparse` or native CSV parsing.
- **Files:** `api/analyze.ts`, new `src/ingestion/csv-parser.ts`
- **Effort:** 1–2 days

### M4 — Store `promptVersion` in audit trail [S]
- **Source:** `src/prompts/resolver.ts`, `src/pipeline/layer2-llm-verdict.ts`, `src/types/decision-pipeline.ts`
- **Why:** There is no way to audit which prompt version produced a given decision. The registry and versioning infrastructure exists (`src/prompts/`) but `promptVersion` is never written to the `auditTrail`.
- **What:** After resolving the prompt, add an audit event with `{ promptKey, promptVersion, orgId }` to the Layer 2 step. Add `promptVersion` to `AuditEvent.details` schema.
- **Files:** `src/pipeline/layer2-llm-verdict.ts`, `src/types/decision-pipeline.ts`
- **Effort:** 2–4 hours

### M5 — OpenTelemetry spans per pipeline stage [M]
- **Source:** `src/instrumentation.ts` (stub file, currently empty), `wcp.config.json:147 (tracing.enabled: false)`
- **Why:** No distributed tracing. Can't diagnose latency spikes or cost anomalies.
- **What:** Implement `src/instrumentation.ts`. Wrap Layer 1, Layer 2, Layer 3, and orchestrator in OTel spans. Export to console (dev) or OTLP endpoint (`OTEL_EXPORTER_OTLP_ENDPOINT` env).
- **Files:** `src/instrumentation.ts`, `src/pipeline/orchestrator.ts`, each layer file
- **Effort:** 2–3 days

### M6 — CI evaluation aggregate quality gates [M]
- **Source:** `tests/eval/trust-calibration.test.ts:67-108`
- **Why:** The 100-example golden-set test reports per-sample pass/fail but the aggregate accuracy (>90%), false-approve rate (<2%), and P95 latency (<20s) assertions already exist in the test file — they just aren't wired into the CI job `test:calibration`.
- **What:** Verify `npm run test:calibration` is run on `ENABLE_CALIBRATION=true` branches. Confirm the three aggregate assertions block the CI run on failure.
- **Files:** `.github/workflows/pipeline-discipline.yml`, `tests/eval/trust-calibration.test.ts`
- **Effort:** 2–4 hours

### M7 — Trade synonym / alias table [S]
- **Source:** `src/retrieval/hybrid-retriever.ts:52-89` (`IN_MEMORY_ALIASES` exists but is not wired from config)
- **Why:** Aliases like "Pipe Fitter" → "Plumber" exist in `IN_MEMORY_ALIASES` but are never exposed via `wcp.config.json`, so operators can't extend them without changing code.
- **What:** Add `tradeAliases` map to `wcp.config.json` (schema already in `wcp.config.schema.json`). Merge config aliases with `IN_MEMORY_ALIASES` at startup.
- **Files:** `wcp.config.json`, `wcp.config.schema.json`, `src/retrieval/hybrid-retriever.ts`
- **Effort:** 4–8 hours

### M8 — API v1 async job endpoints [L]
- **Source:** `src/app.ts` (synchronous only), roadmap Phase 05-B
- **Why:** `/api/analyze` blocks on the full pipeline (LLM call + retrieval). Async pattern enables PDF/CSV batch use cases and better UX.
- **What:** `POST /v1/wcp/submit` → `{ reportId, status: "QUEUED" }`, `GET /v1/wcp/:id/status`, `GET /v1/wcp/:id/decision`, `GET /v1/wcp/:id/trace`.
- **Depends on:** M1 (persistent storage)
- **Files:** `src/app.ts`, new `api/v1/` route handlers
- **Effort:** 2–3 days

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

### I6 — Playwright E2E tests for web UI [M]
Deferred from Phase 03 (per `RELEASE_PLAN.md:183`). Add E2E coverage for the six core scenarios in `ScenarioSelector.tsx`, verifying pipeline visualizer renders all three layers correctly. [src: `src/frontend/components/ScenarioSelector.tsx`]

### I7 — `ExtractedWCP` Zod min-value constraints [S]
`ExtractedWCPSchema` does not enforce `.min(0)` on `hours` or `wage`. A test comment (`pipeline-contracts.test.ts:132-134`) explicitly documents this as a known gap. Negative values would flow into compliance checks without validation rejection. [src: `src/types/decision-pipeline.ts:407-431`, `tests/unit/pipeline-contracts.test.ts:123-135`]

### I8 — Cross-field `traceId` consistency validated at schema level [S]
`TrustScoredDecisionSchema` does not enforce that `deterministic.traceId`, `verdict.traceId`, and the root `traceId` are equal. A test comment explicitly notes this gap. [src: `tests/unit/pipeline-contracts.test.ts:367-379`] Add a Zod `.superRefine()` check.

---

## 🔧 Tech Debt

### T1 — `src/utils/mock-responses.ts` DBWD_RATES diverged from main corpus [S]
- **Source:** `src/utils/mock-responses.ts:9-12` vs. `src/retrieval/hybrid-retriever.ts:29-50`
- `DBWD_RATES` (mock) has 2 entries; `IN_MEMORY_CORPUS` (retriever) has 20. These should share a single source, or mock should delegate to the retriever's in-memory corpus.
- (Also tracked as S2 in Active Sprint)

### T2 — `wcp.config.json` is entirely decorative for LLM and trust config [S]
- **Source:** `wcp.config.json:43-70`, `src/pipeline/layer2-llm-verdict.ts`, `src/pipeline/layer3-trust-score.ts`
- The config file defines `pipeline.llm.model`, `pipeline.llm.temperature`, and `pipeline.trust.weights` but none of these keys are read by any code. The pipeline uses hardcoded values exclusively.
- Fix: wire the config loader or remove the stale blocks to prevent operator confusion. (Related to B1, B2)

### T3 — `handleAnalyzeRequest` uses `any` type for Hono context [S]
- **Source:** `src/app.ts:8`
- `async function handleAnalyzeRequest(c: any)` — defeats TypeScript's strict mode for the entire HTTP handler.
- Fix: use `Context` from `hono` with proper generics.
- **Files:** `src/app.ts`

### T4 — `mastra/` directory is unused dead code [M]
- **Source:** `src/mastra/` (agents/, tools/, index.ts)
- The Mastra agent framework was replaced by the current three-layer pipeline. The `src/mastra/` directory remains but is not imported by any active code path (confirmed by zero imports in `src/pipeline/` or `src/entrypoints/`).
- Fix: remove `src/mastra/` and all associated `@mastra` deps from `package.json`.
- **Files:** `src/mastra/`, `package.json`

### T5 — `agentConfig` in `src/config/agent-config.ts` is unused [S]
- **Source:** `src/config/agent-config.ts`
- `getAgentConfig()` and `DEFAULT_AGENT_CONFIG` are defined but never imported by any pipeline code. Configuration leaks from the Mastra era.
- Fix: remove the file or repurpose if T4 is resolved.

### T6 — `console.log` in Layer 3 and orchestrator should use structured logging [S]
- **Source:** `src/pipeline/orchestrator.ts`, `src/pipeline/layer3-trust-score.ts:356`
- Every pipeline stage uses `console.log` / `console.warn` / `console.error` directly. When M5 (OTel) is implemented, these should route through a structured logger with level filtering.
- Fix: introduce a minimal `src/utils/logger.ts` wrapper (pino or similar) and replace raw console calls.

### T7 — `src/instrumentation.ts` is a 3-line empty stub [S]
- **Source:** `src/instrumentation.ts`
- Created as a placeholder for OTel initialization but has no implementation. Currently imported nowhere.
- Fix: implement as part of M5, or delete until M5 is scheduled.

### T8 — `data/dbwd-corpus.json` referenced but status unclear [S]
- **Source:** `src/retrieval/hybrid-retriever.ts:26` (comment: "Matches all 20 entries in data/dbwd-corpus.json")
- The comment implies a JSON file exists, but the `data/` directory content was not confirmed during this audit. If missing, the in-memory corpus is the sole fallback and should be documented as such.
- Fix: verify `data/dbwd-corpus.json` exists and matches `IN_MEMORY_CORPUS`; add to `.gitignore` policy if auto-generated.

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
