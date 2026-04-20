# TODO.md

Actionable gaps for the WCP Compliance Agent — scoped to the current three-layer pipeline architecture.
Items harvested from a full codebase audit (code, config, docs) on 2026-04-20.

**Last updated:** 2026-04-19 — B1–B3, S1–S6, T1–T5, T7–T8 resolved.  
**Architecture reference:** `AGENTS.md`

---

## 🧊 Active Tech Debt

### T6 — `console.log` in Layer 3 and orchestrator should use structured logging [S]
- **Source:** `src/pipeline/orchestrator.ts`, `src/pipeline/layer3-trust-score.ts:356`
- Every pipeline stage uses `console.log` / `console.warn` / `console.error` directly. When M5 (OTel) is implemented, these should route through a structured logger with level filtering.
- Fix: introduce a minimal `src/utils/logger.ts` wrapper (pino or similar) and replace raw console calls.
- **Do together with M5 to avoid doing this twice.**

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
- **What:** Move rate table to `data/dbwd-corpus.json` (already exists — use it as the load target). Support override via `WCP_CONFIG_PATH` env var.
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
- **Source:** `src/instrumentation.ts` (deleted — implement fresh), `wcp.config.json:147 (tracing.enabled: false)`
- **Why:** No distributed tracing. Can't diagnose latency spikes or cost anomalies.
- **What:** Create `src/instrumentation.ts`. Wrap Layer 1, Layer 2, Layer 3, and orchestrator in OTel spans. Export to console (dev) or OTLP endpoint (`OTEL_EXPORTER_OTLP_ENDPOINT` env). Wire T6 (structured logger) in the same pass.
- **Files:** new `src/instrumentation.ts`, `src/pipeline/orchestrator.ts`, each layer file
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

## Won't Fix (Rationale)

The following were present in archived specs or previous `TODO.md` versions but are explicitly excluded:

| Item | Reason |
|---|---|
| Multi-tenant isolation / RBAC / JWT auth | Out of scope for open-source showcase |
| Batch processing queue (Redis/BullMQ) | M8 covers async via simpler in-memory queue first |
| Prometheus / Grafana dashboards | M5 OTel covers observability; dashboards are deployment-specific |
| Old Mastra-era utilities (`PinoLogger`, `LibSQLStore`, `retry.ts`) | Not in current architecture; superseded by `src/utils/errors.ts` retry helpers |
| `CORS` allowed origins hardcoded to `localhost:3001` in `wcp.config.json:121` | Already superseded by dynamic CORS logic in `src/app.ts:60-73`; config entry is dead |
