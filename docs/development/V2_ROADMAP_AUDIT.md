# V2 Release Audit: Roadmap vs Reality

**Date:** 2026-04-22
**Scope:** Did we actually finish everything planned for V2 before moving to V3?

---

## Executive Summary

| Phase | Planned | Actually Done | Status |
|---|---|---|---|
| **Phase 01 — Scaffolding** | 10 deliverables | 9/10 complete, 1 partially | ✅ Mostly Complete |
| **Phase 02 — MVP** | 15+ deliverables | 10/15 complete, 5 partial/gap | 🟡 Partial — gaps remain |
| **Phase 03 — Showcase** | 10 deliverables | 7/10 complete, 3 deferred | ✅ Mostly Complete |

**Verdict:** V2 is **feature-complete enough** for a portfolio piece, but several Phase 02 deliverables that were marked "Complete" in the release plan are actually **stubbed or incomplete**. Before moving to v3, we should either:
1. Fix the remaining gaps in v2, OR
2. Accept them as documented limitations and move on

---

## Phase 01: Scaffolding — Audit

### Exit Gate: All Passed ✅

| # | Deliverable | Plan Status | Actual Status | Evidence |
|---|---|---|---|---|
| 1 | Three-layer pipeline | ✅ Complete | ✅ Complete | `src/pipeline/` — Layer 1, 2, 3, orchestrator |
| 2 | Pipeline discipline lint | ✅ Complete | ✅ Complete | `scripts/lint-pipeline-discipline.ts` passes |
| 3 | GitHub Actions CI (6 stages) | ✅ Complete | ✅ Complete | `.github/workflows/pipeline-discipline.yml` — 7 stages |
| 4 | Coverage gate (≥80%) | ✅ Complete (80.01%) | 🔴 **BROKEN** | `@vitest/coverage-v8` not installed — cannot verify |
| 5 | ADR-001 through ADR-005 | ✅ Complete | ✅ Complete | `docs/adrs/` — 5 ADRs |
| 6 | Compliance docs | ✅ Complete | ✅ Complete | `docs/compliance/` — 3 documents |
| 7 | PostgreSQL + pgvector setup guide | ✅ Complete | ✅ Complete | `docs/development/postgres-setup.md` |
| 8 | SQL migration schema | ⏳ Pending (M1) | ✅ Complete | `migrations/001_create_audit_tables.sql` |
| 9 | docker-compose.yml | ✅ Complete | ✅ Complete | `docker-compose.yml` |
| 10 | 248 passing tests | ✅ Complete (0 failures) | 🟡 **DEGRADED** | Was 248, now 215/234 pass (19 Phase 02 failures) |

**Phase 01 Assessment:** Coverage gate is broken (CR-2 in inventory). This is a regression from the original 80.01% claim. Otherwise solid.

---

## Phase 02: MVP — Audit

### Exit Gates: NOT All Passed 🟡

| # | Exit Gate | Required | Actual | Status |
|---|---|---|---|---|
| 1 | Hybrid retrieval end-to-end (not stubbed) | BM25 + vector + rerank working | BM25 ✅, vector ✅, rerank ✅, BUT always falls back to in-memory corpus. ES/pgvector never connected in default setup. | 🟡 **STUBBED** |
| 2 | Real WCP processing with PDF and CSV | Non-mock processing | ✅ PDF ingestion works, CSV ingestion works, text endpoint works. All can process real inputs. | ✅ **DONE** |
| 3 | 11-field data extraction | Full WH-347 model | 🟡 **PARTIAL** — `ExtractedWCP` interface has all fields, but `layer1-deterministic.ts` extraction may not populate all 11. Only extracts what's present in input text. | 🟡 **PARTIAL** |
| 4 | Prompt registry with PostgreSQL backend | PostgreSQL-backed resolver | 🔴 **NOT DONE** — Prompt registry is file-backed (`src/prompts/registry.ts`, `src/prompts/versions/`). No PostgreSQL integration. | 🔴 **GAP** |
| 5 | 50+ golden examples with CI gates | 50+ labeled, quality gates | ✅ 100 examples in `tests/eval/golden-set.ts`. CI calibration job exists (M6). | ✅ **DONE** |
| 6 | 12+ DBWD trades (configurable) | Not hardcoded | ✅ 20-trade in-memory corpus in `src/utils/mock-responses.ts`. Configurable via `wcp.config.json` tradeAliases. | ✅ **DONE** |
| 7 | Persistent human review queue (PostgreSQL) | PostgreSQL-backed queue | 🔴 **NOT DONE** — Queue is in-memory with PostgreSQL fallback that fails back to `IN_MEMORY_JOBS`. `data/review-queue.json` is empty. | 🔴 **GAP** |

### Phase 02 Deliverables Deep Dive

| # | Deliverable | Plan Status | Actual Status | Notes |
|---|---|---|---|---|
| 1 | PostgreSQL + pgvector running | "Not started" | ✅ **DONE** — Docker Compose has it, schema exists | Plan was stale; marked complete in TODO M1 |
| 2 | DBWD corpus ETL (SAM.gov → embeddings) | "Not started" | 🔴 **NOT DONE** — No ETL exists. Static in-memory corpus only. | Listed as Icebox I3/I4. Architecture supports it but not implemented. |
| 3 | BM25 search | ✅ Implemented | ✅ **DONE** — `src/retrieval/bm25-search.ts` | Works when `ELASTICSEARCH_URL` set. Tests fail without ES module. |
| 4 | Vector search (pgvector HNSW) | ✅ Implemented | ✅ **DONE** — `src/retrieval/vector-search.ts` | Works when `POSTGRES_URL` set. Tests fail without pg module. |
| 5 | RRF | ✅ Implemented | ✅ **DONE** — `src/retrieval/rrf-fusion.ts` | Implemented but not connected in default path (no ES/pgvector). |
| 6 | Cross-encoder reranking | ✅ Implemented | ✅ **DONE** — `src/retrieval/cross-encoder.ts` | Implemented but not connected in default path. |
| 7 | Full hybrid retrieval | ✅ Implemented | 🟡 **STUBBED** — Code exists but default path falls back to in-memory. Hybrid path requires external services. | `src/retrieval/hybrid-retriever.ts` has both paths. |
| 8 | 11-field WCP schema | "Not started" | ✅ **DONE** — `ExtractedWCP` + `ExtractedEmployee` have full WH-347 model (H1) | Plan was stale. Extracts all present fields from input. |
| 9 | PDF ingestion | "Not started" | ✅ **DONE** — `src/ingestion/pdf-ingestion.ts` (M2) | Plan was stale. Multipart upload works. |
| 10 | CSV ingestion | "Not started" | ✅ **DONE** — `src/ingestion/csv-ingestion.ts` (M3) | Plan was stale. Bulk upload works. |
| 11 | Prompt registry (PostgreSQL-backed) | ✅ Implemented | 🔴 **NOT DONE** — File-backed only. No PostgreSQL integration. | Plan claims "PostgreSQL-backed" but it's file-backed. |
| 12 | Prompt version resolution | ✅ Implemented | ✅ **DONE** — `src/prompts/resolver.ts` | Works correctly. |
| 13 | Golden dataset (50+ labeled) | ✅ Implemented | ✅ **DONE** — 100 examples (H2) | Exceeds target. |
| 14 | CI evaluation pipeline | ✅ Implemented | ✅ **DONE** — `tests/eval/trust-calibration.test.ts` (M6) | Aggregate gates are wired into CI. |
| 15 | Regression detection | "Not started" | 🟡 **PARTIAL** — Calibration job hard-fails on drift, but no dedicated regression detection beyond calibration. | The CI calibration job catches drift. Is that sufficient? |
| 16 | Persistent human review queue | "Not started" | 🔴 **NOT DONE** — In-memory only. PostgreSQL fallback is process-local. | M8 (job queue) exists but review queue persistence is separate. |
| 17 | 20-trade in-memory corpus | ✅ Implemented | ✅ **DONE** — `src/utils/mock-responses.ts` | Exceeds the 12+ target. |

**Phase 02 Assessment:**
- ✅ **Truly done (10):** Pipeline, lint, CI, docs, migrations, docker-compose, ingestion (PDF/CSV), golden set, trade corpus, prompt version resolution
- 🟡 **Stubbed/partial (3):** Hybrid retrieval (code exists but defaults to in-memory), 11-field extraction (types have all fields but extraction is best-effort), regression detection (calibration catches it but no dedicated system)
- 🔴 **Not done (4):** SAM.gov/DOL ETL, PostgreSQL-backed prompt registry, persistent human review queue, DBWD corpus embeddings

---

## Phase 03: Showcase — Audit

### Exit Gates: Mostly Passed ✅

| # | Exit Gate | Plan Status | Actual Status | Evidence |
|---|---|---|---|---|
| 1 | Live URL accessible (Vercel) | ✅ Complete | ✅ Complete | `vercel.json` present, deployment configured |
| 2 | Demo loads in <3 seconds | ✅ Complete | 🟡 **UNVERIFIED** — Mock mode is instant, but frontend build is broken (CR-1) | Can't verify while build is broken |
| 3 | Three-layer pipeline demo walkable | ✅ Complete | ✅ Complete | `src/frontend/components/PipelineVisualizer.tsx` |
| 4 | README reflects current state | ✅ Complete | ✅ Complete | Full rewrite with badges, API reference, architecture |
| 5 | Architecture diagrams reflect actual | ✅ Complete | ✅ Complete | ASCII diagram in README matches implementation |
| 6 | MIT LICENSE present | ✅ Complete | ✅ Complete | `LICENSE` file at root |
| 7 | Stale docs moved to `_archive/` | ✅ Complete | ✅ Complete | `_archive/` directory exists |
| 8 | CHANGELOG up to date | ✅ Complete | ✅ Complete | Entries through 2026-04-19 |
| 9 | 10+ external users | 🔲 Deferred | 🔲 Deferred | Not required for release |
| 10 | Technical write-up | 🔲 Deferred | 🔲 Deferred | Not required for release |

**Phase 03 Assessment:** All required gates are done. The 3 deferred items (users, write-up, E2E) are documented as post-release follow-up.

---

## Gap Analysis: What We Said vs What We Built

### Honest Status of "Complete" Items

| Item | Claimed Status | Honest Status | Why the Disconnect |
|---|---|---|---|
| Phase 02 overall | "✅ Complete (2026-04-19)" | 🟡 **Partial** — 4 gaps remain | Release plan was signed off before all deliverables were verified |
| Hybrid retrieval | "✅ Implemented" | 🟡 **Stubbed** — falls back to in-memory | Code exists but default path doesn't use it |
| Prompt registry | "✅ Implemented (PostgreSQL-backed)" | 🔴 **File-backed only** | Plan overstated PostgreSQL integration |
| Human review queue | "✅ Implemented" | 🔴 **In-memory only** | Queue logic exists but no PostgreSQL persistence |
| Coverage gate | "✅ 80.01% verified" | 🔴 **Broken** — dependency missing | Regression from earlier state |
| 248 passing tests | "✅ 0 failures" | 🟡 **19 failures** (215/234) | Phase 02 retrieval tests fail without external modules |

### What's Actually Solid

These are genuinely done and working:

| Area | Evidence |
|---|---|
| **Three-layer pipeline** | `src/pipeline/` — extraction, LLM verdict, trust scoring all functional |
| **Deterministic checks** | Wage, overtime, fringe, signature, total — all implemented and tested |
| **PDF/CSV ingestion** | Multipart upload endpoints, parsers working |
| **Audit persistence** | PostgreSQL schema, `persistDecision()`, `GET /api/decisions` |
| **Job queue** | `POST /api/jobs`, `GET /api/jobs/:id`, async processing |
| **Prompt versioning** | `promptVersion` field, `wcp-verdict-v2.ts`, registry/resolver |
| **Golden set** | 100 labeled examples, calibration CI job |
| **Trust scoring** | Formula implemented, 3 bands (auto/flag/review), weights sum to 1.0 |
| **Observability** | OTel SDK, structured pino logging, trace IDs everywhere |
| **Compliance docs** | Traceability matrix, regulatory report, implementation guide |
| **CI/CD** | 7-stage pipeline with lint, test, coverage, build, calibration |

### What's Stubbed or Incomplete

| Area | What's Missing | User Impact |
|---|---|---|
| **Hybrid retrieval** | ES/pgvector never connected in default setup | Always uses 20-trade in-memory corpus |
| **Prompt registry** | File-backed, no PostgreSQL | Prompts are versioned but not dynamically configurable per-account |
| **Human review queue** | In-memory only, no PostgreSQL | Queue resets on restart; multi-process deployments can't share queue |
| **DBWD live rates** | No SAM.gov/DOL API integration | Static rates, may be stale |
| **OCR** | No tesseract.js | Can't process scanned/image PDFs |
| **Multi-employee display** | Frontend shows one worker | Doesn't handle multi-employee WH-347s well in UI |
| **Cost tracking** | Token usage captured but not persisted | No dashboard, no historical cost analysis |
| **Rate limiting** | No server-side rate limiter | Open to cost spikes from abuse |

---

## Should We Fix V2 Gaps or Move to V3?

### Arguments for Fixing V2 First

1. **The 4 critical blockers** (CR-1 through CR-4) are 5-minute fixes. No reason to leave them broken.
2. **Coverage dependency** was working before — it's a regression, not a new feature.
3. **Frontend build** being broken means the showcase page is dead.
4. **19 test failures** make `npm test` look broken to new contributors.

### Arguments for Moving to V3

1. **V2 is a portfolio piece, not production.** The architecture and core pipeline are the story. The stubbed parts are documented limitations.
2. **V3 addresses many gaps naturally.** Python backend will have real PostgreSQL connection, Celery queue, etc.
3. **Time is better spent on v3** than polishing v2 stubs that will be rewritten anyway.
4. **The honest narrative works:** "v2 is a TypeScript monolith proof-of-concept. v3 is the production architecture with Python backend, real services, and React frontend."

### Recommended Path

**Fix the 4 critical blockers + 2 medium items in v2 (30 minutes), then move to v3.**

Don't fix the deep Phase 02 gaps (SAM.gov ETL, persistent queue, etc.) — those are v3 features now. The v2 codebase stays as "proof-of-concept monolith" and v3 becomes "production architecture."

---

## v2 Honest README Framing

> "WCP Compliance Agent v2 is a TypeScript monolith proof-of-concept demonstrating a three-layer AI decision pipeline for federal payroll compliance. It features deterministic extraction, LLM reasoning with regulation citation, and trust-scored routing to human review. The architecture is sound but several components are stubbed for demonstration (retrieval falls back to in-memory corpus, review queue is in-memory only, prompt registry is file-backed). v3 restructures this into a production-grade multi-service architecture with Python backend, TypeScript agent orchestration, and React frontend."

---

## Action Items

### Must Fix in v2 (Before Any Release)

| # | Item | Effort | Why |
|---|---|---|---|
| 1 | Fix frontend build (`@vitejs/plugin-react`) | 1 min | Showcase page is dead |
| 2 | Fix coverage (`@vitest/coverage-v8`) | 1 min | CI Stage 5 fails |
| 3 | Add `npm run dev` script | 1 min | Quick-start is broken |
| 4 | Remove win32 rollup dep | 1 min | Cross-platform install broken |
| 5 | Fix `.env.example` | 10 min | Configuration incomplete |
| 6 | Mark A7, A11, A12 as resolved in TODO.md | 5 min | Stale backlog |

**Total: ~20 minutes**

### Don't Fix (Move to v3)

| Item | Why |
|---|---|
| SAM.gov ETL | v3 Python backend will handle this |
| Persistent review queue | v3 will use Redis + PostgreSQL |
| PostgreSQL-backed prompt registry | v3 will have proper prompt infra with Langfuse |
| Hybrid retrieval wiring | v3 Python backend will own retrieval |
| OCR | v3 can add tesseract later |
| Multi-employee display | v3 React frontend will handle this |
| Cost tracking dashboard | v3 will have cost tracking per decision |
| Rate limiting | v3 agent layer will have proper rate limiting |

---

*Report generated: 2026-04-22*
*Conclusion: Fix 6 small issues in v2 (20 min), then proceed to v3. Don't chase Phase 02 gaps that v3 will rewrite anyway.*
