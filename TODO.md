# TODO.md

Actionable gaps for the WCP Compliance Agent.

**Last updated:** 2026-04-22 — Full codebase inventory + roadmap audit complete.
**Architecture reference:** `AGENTS.md`
**Full inventory:** `docs/development/V2_INVENTORY_REPORT.md`
**Roadmap audit:** `docs/development/V2_ROADMAP_AUDIT.md`

---

## ✅ Resolved (Verified Complete)

### Sprint 2 (2026-04-20)

| Item | What was done | Key files |
|---|---|---|
| **A1** | Fixed critical regex bug: per-day hour patterns matched `(\.\d+...)` requiring a leading decimal point, meaning `Mon: 8` would never match. Corrected to `(\d+(?:\.\d+)?)`. | `src/pipeline/layer1-deterministic.ts:68-74` |
| **A2** | Fixed broken ESLint frontend config: `reactHooks.configs['recommended-latest']` uses the legacy `plugins: [string]` format, rejected by ESLint 9. Changed to `reactHooks.configs.flat['recommended-latest']`. | `eslint.config.frontend.js` |
| **A3** | Fixed React lint error: `setVisiblePanels(0)` was called synchronously inside `useEffect`, triggering cascading renders. Moved reset into the cleanup function instead. | `src/frontend/components/PipelineVisualizer.tsx:95-101` |
| **A4** | Fixed `persistDecision().catch(() => {})` in orchestrator silently swallowing unexpected errors. Now logs the error before suppressing. | `src/pipeline/orchestrator.ts:156` |

### Sprint 1

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

### Previously Marked Open — Now Verified Resolved (2026-04-22 Audit)

| Item | What was done | Why it was flagged |
|---|---|---|
| **A7** | Input size limit already present in `src/app.ts` | Audit initially missed the `MAX_CONTENT_BYTES` guard (64KB limit) |
| **A11** | `env-validator.ts` already uses `startupLog` (pino logger) | Audit initially missed the logger — it was there, just named differently |
| **A12** | CORS entry removed from `wcp.config.json` | Already superseded by dynamic CORS in `src/app.ts:68-83` |

---

## 🔴 Critical — Fix Before Any Release (20 minutes total)

These block the project from being usable by anyone who clones the repo.

| Item | Problem | Fix | Effort |
|---|---|---|---|
| **CR-1** | Frontend build fails — `Cannot find package '@vitejs/plugin-react'` | `npm install -D @vitejs/plugin-react` | 1 min |
| **CR-2** | Coverage broken — `Cannot find dependency '@vitest/coverage-v8'` | `npm install -D @vitest/coverage-v8` | 1 min |
| **CR-3** | `npm run dev` doesn't exist — README quick-start is broken | Add `"dev": "tsx src/server.ts"` to `package.json` scripts | 1 min |
| **CR-4** | Windows-only dep `@rollup/rollup-win32-x64-msvc` in `dependencies` | Remove from `dependencies` (or move to `optionalDependencies`) | 1 min |
| **CR-5** | Package name mismatch: `wcp-ai-agent` vs repo `WCP-Compliance-Agent` | Align to `wcp-compliance-agent` everywhere | 2 min |
| **CR-6** | `.env.example` missing most config vars | Add all vars from README config table with defaults | 10 min |

**Total: ~16 minutes**

---

## 🟡 Medium — Should Fix in v2 (1-2 hours)

| Item | Problem | Fix | Effort |
|---|---|---|---|
| **A5** | `@vercel/node` devDependency vulnerabilities (9 total) | Document in README/CONTRIBUTING as accepted risk; zero production impact | 10 min |
| **A6** | No rate limiting on API endpoints | Add `hono/rate-limiter` or sliding window on traceId/IP | 1-2 hrs |
| **A8** | In-memory job fallback is process-local (undocumented) | Add comment warning in `job-queue.ts` header | 5 min |
| **A9** | `audit_events` table missing `trace_id` index | Add `CREATE INDEX` to migration SQL | 5 min |
| **A10** | `Layer2InputSchema` diverges from `DeterministicReport` type | Derive from `DeterministicReportSchema` via `.pick()` / `.omit()` | 30 min |
| **MED-1** | 19 Phase 02 retrieval tests fail (missing `pg` + `@elastic/elasticsearch`) | Add mocks OR exclude Phase 02 tests from default `npm test` | 30 min |
| **MED-2** | `@ai-sdk/openai` pinned to `^2.0.65` with `as any` workaround | Monitor for v4 type stability; remove `as any` when safe | Ongoing |
| **MED-3** | Extraneous packages bloating `node_modules` (415MB) | `npm prune && npm dedupe` or `rm -rf node_modules && npm ci` | 10 min |

---

## 🟢 Minor — Nice to Have

| Item | Problem | Fix | Effort |
|---|---|---|---|
| **MIN-1** | `as any` in `layer2-llm-verdict.ts:240` | Documented in ADR-001; revisit when ai-sdk types stabilize | 0 min (documented) |
| **MIN-2** | `review-queue.json` empty — should be `.gitignore`d | Add to `.gitignore` | 1 min |
| **MIN-3** | No `CODE_OF_CONDUCT.md` | Add standard GitHub template | 5 min |
| **MIN-4** | `console.log` only in `src/utils/logger.ts` (intentional — logger definition) | Acceptable — no action needed | 0 min |

---

## 🔥 Stubbed in v2 — Will Be Rewritten in v3 (Do Not Fix in v2)

These are documented limitations. The code exists but the default path doesn't use it. v3 will implement these properly.

| Item | v2 Status | v3 Plan |
|---|---|---|
| **Hybrid retrieval wiring** | Code exists (BM25, vector, RRF, rerank) but defaults to in-memory corpus. ES/pgvector never connected in default setup. | Python backend will own retrieval layer with real PostgreSQL + Elasticsearch |
| **Prompt registry PostgreSQL backend** | File-backed only (`src/prompts/registry.ts`). No PostgreSQL integration. | v3 will use Langfuse for prompt versioning + PostgreSQL persistence |
| **Persistent human review queue** | In-memory only (`data/review-queue.json`). PostgreSQL fallback is process-local. | v3 will use Redis + Celery for real queue persistence |
| **DBWD live rates (SAM.gov/DOL)** | Static 20-trade in-memory corpus only | v3 Python backend will have SAM.gov ETL pipeline |
| **OCR for scanned PDFs** | Not implemented | v3 can add tesseract.js or cloud OCR |
| **Multi-employee frontend display** | Shows one worker only | v3 React 19 frontend will handle multi-employee accordion |
| **Cost tracking dashboard** | Token usage captured but not persisted | v3 will track per-decision cost with model pricing metadata |
| **Regression detection system** | Calibration CI job catches drift, but no dedicated regression detection | v3 golden set CI will be the canonical regression guard |

---

## 🧊 Icebox — Future Work (Beyond v3)

| Item | Size | What | When |
|---|---|---|---|
| **I1** | Large | OCR for scanned WH-347s (tesseract.js or cloud) | After v3 PDF pipeline stable |
| **I2** | Medium | Cost tracking dashboard with model pricing metadata | v3 cost_log table + API |
| **I3** | Large | Full Elasticsearch BM25 for live DBWD corpus ETL | v3 Python ETL pipeline |
| **I4** | Large | SAM.gov / DOL API integration for live DBWD rates | v3 scheduled pull |
| **I5** | Medium | Frontend multi-employee accordion display | v3 React frontend |

---

## 🚫 Won't Fix (Rationale)

| Item | Reason |
|---|---|
| Multi-tenant isolation / RBAC / JWT auth | Out of scope for open-source showcase |
| Batch processing queue (Redis/BullMQ) | v3 Celery covers this |
| Prometheus / Grafana dashboards | M5 OTel covers observability; dashboards are deployment-specific |
| Old Mastra-era utilities (`PinoLogger`, `LibSQLStore`, `retry.ts`) | Not in current architecture; superseded by `src/utils/errors.ts` retry helpers |

---

## v3 Planning — Next Phase

**Architecture:** Python backend (FastAPI) + TypeScript agent (Mastra.ai) + React 19 frontend
**Reference:** `docs/architecture/V3_PLAN.md`

### v3 Backlog (To Be Created)

| # | Item | Phase | Est. Effort |
|---|---|---|---|
| 1 | Create `v3` branch from `main` | Phase 0 | 5 min |
| 2 | Sketch directory layout (`backend/`, `agent/`, `frontend/`, `shared/`) | Phase 0 | 30 min |
| 3 | Bootstrap Python backend (Poetry, FastAPI, app factory) | Phase 1 | 2 hrs |
| 4 | Port deterministic Layer 1 logic to Python | Phase 1 | 4 hrs |
| 5 | Design REST contract (Pydantic ↔ Zod shared schemas) | Phase 1 | 2 hrs |
| 6 | Bootstrap React 19 frontend (Vite, Tailwind, Shadcn/ui) | Phase 2 | 2 hrs |
| 7 | Wire TypeScript Mastra agent to Python backend | Phase 3 | 3 hrs |
| 8 | Implement PostgreSQL + pgvector + Redis in Docker Compose | Phase 3 | 1 hr |
| 9 | Add Phoenix (LLM tracing) + Langfuse (prompt versioning) | Phase 4 | 2 hrs |
| 10 | Golden set CI hard-fail + cross-encoder reranking | Phase 4 | 2 hrs |
| 11 | Full-stack Docker Compose one-command startup | Phase 5 | 1 hr |

**Total v3 estimate:** ~8–10 days focused work

---

## Audit Artifacts

- **Full inventory report:** `docs/development/V2_INVENTORY_REPORT.md` — 78% release readiness, 4 blockers, 6 medium, 4 minor
- **Roadmap vs reality audit:** `docs/development/V2_ROADMAP_AUDIT.md` — Phase 02 "creative accounting" documented, honest status of all deliverables

---

*Generated: 2026-04-22*
