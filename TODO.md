# TODO.md

Actionable gaps for the WCP Compliance Agent — scoped to the current three-layer pipeline architecture.
Items harvested from a full codebase audit (code, config, docs) on 2026-04-20.

**Last updated:** 2026-04-19 — **All backlog items resolved.** H1–H6, M1–M8, T6, I6–I8 complete.  
**Architecture reference:** `AGENTS.md`

---

## ✅ Resolved (this sprint)

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
