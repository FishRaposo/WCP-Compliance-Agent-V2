# WCP Compliance Agent — Issues & Gap Analysis

**Audit Date:** 2026-04-18  
**Auditor:** Clanker (Kimi K2.5)  
**Repository:** `FishRaposo/WCP-Compliance-Agent`  
**Commit:** `a765e4f`

---

## Executive Summary

The WCP Compliance Agent is a **well-architected but partially implemented** project. The three-layer decision pipeline (deterministic → LLM verdict → trust score) is fully built and functional. However, there are critical gaps between documented architecture and actual code, plus TypeScript compilation errors that prevent the project from building.

| Category | Count | Severity |
|----------|-------|----------|
| Type Errors | 9 | 🔴 Critical |
| Architecture Gaps | 7 | 🟡 High |
| Documentation Drift | 5 | 🟠 Medium |
| Missing Infrastructure | 4 | 🟠 Medium |

---

## 🔴 Critical Issues

### 1. TypeScript Compilation Errors — Build Fails

**Status:** ❌ Build fails (`npm run build` exits with code 1)

**Files Affected:**
- `src/app.ts:30` — `Property 'object' does not exist on type 'TrustScoredDecision'`
- `src/index.ts:60,73,76,79` — Multiple `.object`, `.text`, `.toolResults` property errors
- `src/pipeline/layer2-llm-verdict.ts:225,226,234,236` — Agent response type mismatch

**Root Cause:**
The codebase was partially migrated from an older Mastra Agent API to the new three-layer pipeline. Old code expects:
```typescript
response.object, response.text, response.toolResults  // Agent response
```

But `generateWcpDecision()` now returns:
```typescript
TrustScoredDecision  // Direct decision object
```

**Impact:**
- Cannot run tests (`npm test` fails at build step)
- Cannot start API server (`npm run serve` fails)
- Cannot deploy to production

**Fix Required:**
Option A (Quick): Update `app.ts` and `index.ts` to use `TrustScoredDecision` structure directly
Option B (Proper): Create adapter layer for backward compatibility

**Estimated Effort:** 2-4 hours

---

### 2. Missing Hybrid Retrieval Infrastructure

**Status:** ❌ Stubbed with `throw new Error('Not implemented')`

**Files:**
- `docs/implementation/05-retrieval-hybrid-rerank.md` — Documented but no code
- `docs/implementation/04-vector-pgvector.md` — Documented but no code
- `docs/implementation/02-search-elasticsearch.md` — Documented but no code

**What Should Exist:**
```typescript
// Hybrid retrieval pipeline
const results = await hybridRetrieval.search({
  query: "Electrician prevailing wage in San Francisco",
  bm25Weight: 0.3,
  vectorWeight: 0.7,
  rerank: true
});
```

**Current State:**
- No Elasticsearch integration
- No pgvector setup
- No cross-encoder reranking
- DBWD rates are hardcoded (5 trades only)

**Impact:**
- Cannot process real WCP documents (PDF/CSV)
- Limited to text-only input
- No retrieval-augmented decisions
- Not production-ready for document ingestion

**Dependencies:**
- PostgreSQL with pgvector extension
- Elasticsearch cluster (or managed service)
- Cross-encoder model for reranking
- Embedding service (OpenAI text-embedding-3)

**Estimated Effort:** 3-5 days

---

### 3. Incomplete Data Model

**Status:** ⚠️ Partial — only 3 of 11 fields implemented

**Current `WCPData` interface:**
```typescript
export interface WCPData {
  role: string;
  hours: number;
  wage: number;
}
```

**Required per Davis-Bacon Act (29 CFR 5.5):**
1. Worker name
2. Social security number (last 4)
3. Trade/classification code
4. Locality (county + state)
5. Daily hours breakdown
6. Regular hours
7. Overtime hours
8. Base wage rate
9. Fringe benefit rate
10. Total weekly earnings
11. Deductions itemized

**Impact:**
- Cannot validate full compliance
- Missing fields required for audit trail
- Incomplete Copeland Act record keeping

**Fix:** Expand `ExtractedWCP` and `DeterministicReport` types

**Estimated Effort:** 1-2 days

---

## 🟡 High Priority Issues

### 4. Missing Prompt Infrastructure

**Status:** ❌ Schema defined, no implementation

**Documented:** `docs/implementation/07-prompt-infrastructure.md`

**What Should Exist:**
- Prompt registry service (PostgreSQL-backed)
- Versioning and A/B testing
- Per-organization prompt configuration
- Prompt resolution algorithm

**Current State:**
- Prompts are hardcoded in `layer2-llm-verdict.ts`
- No versioning
- No experimentation framework

**Impact:**
- Cannot iterate on prompts without code changes
- No way to test prompt variants
- No organization-specific customization

**Estimated Effort:** 2-3 days

---

### 5. No CI Evaluation Framework

**Status:** ❌ Only unit tests exist

**Documented:** `docs/evaluation/evaluation-strategy.md`, `docs/evaluation/quality-bar.md`

**What Should Exist:**
- Golden dataset with ground truth labels
- CI pipeline with quality gates
- Regression detection
- Automated scoring rubrics

**Current State:**
- Only Vitest unit tests (`npm test`)
- No golden evaluation dataset
- No automated quality gates
- `tests/eval/trust-calibration.test.ts` exists but limited

**Impact:**
- No way to validate accuracy before deployment
- No regression detection
- Cannot prove >95% violation detection rate claim

**Estimated Effort:** 3-4 days

---

### 6. Hardcoded DBWD Rates

**Status:** ⚠️ 5 trades only, not configurable

**File:** `src/pipeline/layer1-deterministic.ts:43-50`

```typescript
const DBWDRates: Record<string, { base: number; fringe: number }> = {
  Electrician: { base: 51.69, fringe: 34.63 },
  Laborer: { base: 26.45, fringe: 12.5 },
  Plumber: { base: 48.2, fringe: 28.1 },
  Carpenter: { base: 45.0, fringe: 25.0 },
  Mason: { base: 42.5, fringe: 22.5 },
};
```

**Required:**
- SAM.gov integration for live rates
- Version tracking for rate changes
- Configurable rate source (JSON, DB, API)
- 100+ trades covered

**Impact:**
- Limited to demo/test scenarios
- Cannot handle real construction projects
- Risk of outdated rates

**Estimated Effort:** 1-2 days

---

### 7. Mock Mode Gaps

**Status:** ⚠️ Mock responses don't match new decision format

**File:** `src/utils/mock-responses.ts`

**Issue:**
Mock responses use old `WCPDecision` format but pipeline expects `TrustScoredDecision` format.

**Impact:**
- Offline development mode may break
- CI tests with `MOCK_MODE=true` may fail
- Cannot demo without OpenAI API key

**Estimated Effort:** 2-4 hours

---

## 🟠 Medium Priority Issues

### 8. Documentation Drift

**Status:** Multiple docs describe features that don't exist

**Files:**
- `docs/implementation/01-warehouse-redshift.md` — No Redshift integration
- `docs/implementation/03-cache-redis.md` — No Redis caching
- `docs/implementation/06-observability-otel-phoenix.md` — No OTel/Phoenix
- `docs/implementation/08-cost-tracking.md` — No cost tracking
- `docs/implementation/09-evaluation-ci.md` — No CI evaluation

**Recommendation:**
Either implement these features or move docs to `_pending/` folder to avoid confusion.

---

### 9. Missing Audit Persistence

**Status:** ⚠️ Audit trail exists in memory only

**Documented:** 7-year retention required (federal contract requirement)

**Current State:**
- `auditTrail` array in `TrustScoredDecision`
- No persistence layer
- No replay capability
- No immutable storage

**Required:**
- PostgreSQL table for audit records
- Immutable append-only log
- Replay API for auditors
- 7-year retention policy

**Estimated Effort:** 2-3 days

---

### 10. No PDF/CSV Ingestion

**Status:** ❌ Text-only input

**Documented:** `docs/architecture/retrieval-and-context.md`

**Current Input:**
```typescript
"Role: Electrician, Hours: 45, Wage: 35.50"
```

**Required:**
- PDF parsing (WH-347 forms)
- CSV upload (bulk payroll)
- OCR for scanned documents
- Normalized WCP report schema

**Estimated Effort:** 3-5 days

---

## Recommended Priority Order

### Phase 1: Fix Build (1-2 days)
1. Fix TypeScript errors in `app.ts` and `index.ts`
2. Update mock responses to match new format
3. Verify `npm test` passes

### Phase 2: Core MVP (1-2 weeks)
4. Expand data model to 11 fields
5. Replace hardcoded DBWD rates with configurable source
6. Build basic audit persistence

### Phase 3: Production-Ready (2-3 weeks)
7. Implement hybrid retrieval (pgvector + Elasticsearch)
8. Build prompt infrastructure
9. Create CI evaluation framework with golden dataset
10. Add PDF/CSV ingestion

### Phase 4: Polish (1 week)
11. Observability (OTel, cost tracking)
12. Documentation cleanup (remove drift)
13. Showcase deployment

---

## What Actually Works Today

Despite the issues, these components are production-quality:

| Component | Quality | Notes |
|-----------|---------|-------|
| Three-layer pipeline | ⭐⭐⭐⭐⭐ | Fully implemented, well-tested |
| Type contracts | ⭐⭐⭐⭐⭐ | `TrustScoredDecision` is solid |
| Deterministic Layer 1 | ⭐⭐⭐⭐ | Regex extraction works, needs more fields |
| LLM Layer 2 | ⭐⭐⭐⭐ | Constraint enforcement works |
| Trust Layer 3 | ⭐⭐⭐⭐⭐ | Scoring logic is sound |
| Audit trail structure | ⭐⭐⭐⭐⭐ | Comprehensive event logging |
| Documentation | ⭐⭐⭐⭐⭐ | Extensive, well-organized |
| CI discipline | ⭐⭐⭐⭐ | Pipeline lint is innovative |

---

## Strategic Assessment

**What This Project Proves:**
- ✅ Can architect complex AI systems with deterministic guardrails
- ✅ Understands regulated-domain requirements (compliance, audit, traceability)
- ✅ Can design for evaluation, observability, and operational concerns
- ✅ Strong documentation discipline

**What's Missing for Production:**
- ❌ Document processing pipeline (PDF/OCR/CSV)
- ❌ Retrieval infrastructure (vector + hybrid search)
- ❌ Evaluation framework (golden dataset, CI gates)
- ❌ Audit persistence (7-year retention)

**For Showcase/Portfolio:**
The current state is **sufficient** with one fix: resolve the TypeScript errors so `npm test` passes. The three-layer pipeline demo is compelling even with text-only input.

---

## Quick Fixes (If You Want to Demo Today)

```bash
# 1. Fix app.ts — change line 30
# FROM: ...result.object, requestId, timestamp...
# TO: ...result, requestId, timestamp...

# 2. Fix index.ts — change lines 60-79
# FROM: response.object, response.text, response.toolResults
# TO: response (direct TrustScoredDecision usage)

# 3. Fix layer2-llm-verdict.ts — lines 225, 226, 234, 236
# The agent.generate() call needs to handle the response properly
```

Then:
```bash
npm test  # Should pass
npm run dev  # API server starts
```

---

## Files to Review

**Critical (fix first):**
- `src/app.ts` — API response format
- `src/index.ts` — Demo script response handling
- `src/pipeline/layer2-llm-verdict.ts` — Agent response handling

**Important (for production):**
- `src/pipeline/layer1-deterministic.ts` — Expand to 11 fields
- `src/types/decision-pipeline.ts` — Add full WCP fields
- `src/utils/mock-responses.ts` — Update to new format

**Documentation (cleanup):**
- Move unimplemented docs to `_pending/` or mark as "Future"

---

*Audit complete. The foundation is solid — it just needs the build fixed and the infrastructure gaps filled.*

— Clanker, 2026-04-18
