# WCP Compliance Agent v2 — Full Inventory Report

**Date:** 2026-04-22
**Scope:** Comprehensive review of all issues, gaps, and improvement opportunities
**Goal:** Determine open-source release readiness

---

## Executive Summary

| Category | Status | Score |
|---|---|---|
| **TypeScript Build** | ✅ Clean — 0 errors | 10/10 |
| **Pipeline Lint** | ✅ Passes — no architectural violations | 10/10 |
| **Core Tests** | ✅ 66/66 pass, 215/234 total pass | 9/10 |
| **Security** | ✅ No leaked keys, no profanity | 10/10 |
| **Documentation** | ✅ Excellent — 21 docs, comprehensive | 10/10 |
| **Code Hygiene** | ✅ No TODO/FIXME, clean source | 10/10 |
| **CI/CD** | ✅ 7-stage pipeline, well documented | 9/10 |
| **Frontend Build** | 🔴 **FAILS** — missing @vitejs/plugin-react | 2/10 |
| **Coverage** | 🔴 **MISSING** — @vitest/coverage-v8 not installed | 3/10 |
| **Package.json** | 🟡 Multiple issues (name mismatch, win32 dep, extraneous) | 6/10 |
| **.env.example** | 🟡 Incomplete — missing most config vars | 5/10 |
| **Integration Tests** | 🟡 19 failures (Phase 02 retrieval — missing modules) | 5/10 |

**Overall Release Readiness: 78% (Need to fix 6 issues before release)**

---

## 🔴 Critical Issues (Must Fix Before Release)

### CR-1: Frontend Build Completely Broken
**Status:** 🔴 CRITICAL

`npm run build:frontend` fails with:
```
Cannot find package '@vitejs/plugin-react'
```

**Root cause:** `@vitejs/plugin-react` is listed in `devDependencies` but not present in `node_modules` (was removed during the earlier `node_modules` cleanup, and `npm ci` or `npm install` was not run to restore it).

**Impact:** Frontend showcase page cannot be built. The `/showcase` route is dead.

**Fix:** `npm install -D @vitejs/plugin-react`

---

### CR-2: Coverage Dependency Missing
**Status:** 🔴 CRITICAL

`npm run test:coverage` fails with:
```
MISSING DEPENDENCY: Cannot find dependency '@vitest/coverage-v8'
```

**Root cause:** Package is in `devDependencies` but not installed (same as CR-1).

**Impact:** Cannot generate coverage reports. CI Stage 5 (coverage gate) would fail.

**Fix:** `npm install -D @vitest/coverage-v8`

---

### CR-3: Missing `npm run dev` Script
**Status:** 🔴 CRITICAL

`docs/quick-start.md` instructs users to run `npm run dev`, but `package.json` has no `dev` script. The README also references `npm run dev` in the quick start section.

**Impact:** New users following the README cannot start the server. Bad first impression.

**Fix:** Add to `package.json`:
```json
"dev": "tsx src/server.ts"
```

---

## 🟡 Medium Issues (Should Fix Before Release)

### MED-1: Package Name Mismatch
**Status:** 🟡 MEDIUM

- `package.json` name: `wcp-ai-agent`
- GitHub repo name: `WCP-Compliance-Agent`
- README title: `WCP Compliance Agent`

**Impact:** Confusing for users who install via npm or search for the package.

**Fix:** Align all to `wcp-compliance-agent` or `wcp-agent`.

---

### MED-2: Windows-Only Dependency in `dependencies`
**Status:** 🟡 MEDIUM

`@rollup/rollup-win32-x64-msvc@^4.60.2` is in `dependencies`. This is a Windows-only native binary. It will:
- Break `npm install` on Linux/macOS
- Bloat the install for non-Windows users
- Cause CI failures on Ubuntu runners

**Impact:** Cross-platform install failures.

**Fix:** Remove from `dependencies`. If needed for Windows dev, move to `optionalDependencies` or `devDependencies`.

---

### MED-3: `.env.example` Incomplete
**Status:** 🟡 MEDIUM

Only contains:
```
OPENAI_API_KEY=sk-your-openai-api-key-here
PORT=3000
```

Missing everything from the README config table:
- `OPENAI_MODEL` (default: gpt-4o-mini)
- `ELASTICSEARCH_URL` (default: http://localhost:9200)
- `ELASTICSEARCH_INDEX` (default: dbwd_corpus)
- `POSTGRES_URL`
- `EMBEDDING_MODEL` (default: text-embedding-3-small)
- `PGVECTOR_DIMENSIONS` (default: 1536)
- `WCP_CONFIG_PATH` (default: ./wcp.config.json)

**Impact:** Users can't configure Phase 02 features or customize models.

**Fix:** Add all config vars with defaults and comments.

---

### MED-4: 19 Test Failures in Phase 02 Retrieval
**Status:** 🟡 MEDIUM

Tests failing: `coverage-gaps.test.ts`, `hybrid-retriever.test.ts`, `bm25-search.test.ts`

All failures have the same root cause:
```
Failed to load url pg (resolved id: pg)
Failed to load url @elastic/elasticsearch
```

**Impact:** 19/234 tests fail. `npm test` output shows red. Looks broken to new contributors.

**Options:**
1. **Add mocks** for `pg` and `@elastic/elasticsearch` in test setup
2. **Document** that Phase 02 tests require running services
3. **Exclude** Phase 02 tests from default `npm test` run
4. **Fix module resolution** — ensure these packages are resolvable in test environment

**Recommended fix:** Option 1 (add mocks) + Option 3 (exclude from default). Phase 02 tests should run with `npm run test:retrieval` only.

---

### MED-5: `@ai-sdk/openai` Version Pin
**Status:** 🟡 MEDIUM

Currently pinned to `^2.0.65` due to v4 type incompatibility. The fix in `layer2-llm-verdict.ts:240` uses `as any`:
```typescript
model: openai(model) as any,
```

**Impact:** Type safety compromised. Future upgrades risky.

**Fix:** Monitor `@ai-sdk/openai` releases. When v4 types stabilize, remove the `as any` assertion and upgrade.

---

### MED-6: A11 Still Listed as Open — But Already Fixed
**Status:** 🟡 MEDIUM

`TODO.md` lists A11 as open:
> `validateEnvironmentOrExit` uses `console.*` instead of pino

But `env-validator.ts` already uses `startupLog` (pino logger). The TODO is stale.

**Impact:** Confusion — is this done or not?

**Fix:** Mark A11 as resolved in TODO.md (or remove it if fully fixed).

---

## 🟢 Minor Issues (Nice to Have)

### MIN-1: `as any` in `layer2-llm-verdict.ts`
**Status:** 🟢 MINOR

Line 240: `model: openai(model) as any`

Documented in ADR-001. Acceptable workaround for now, but should be revisited when `@ai-sdk/openai` v4 types stabilize.

---

### MIN-2: Dead CORS Entry in `wcp.config.json`
**Status:** 🟢 MINOR

`wcp.config.json:94` has `allowedOrigins` including `http://localhost:3001` — never read. CORS is controlled by `src/app.ts:68-80` via `process.env.ALLOWED_ORIGINS`.

Already documented in TODO A12 as open. Should be cleaned up.

**Fix:** Remove the dead CORS block from `wcp.config.json`.

---

### MIN-3: `review-queue.json` Empty
**Status:** 🟢 MINOR

`data/review-queue.json` is an empty JSON object `{}`. Should be `.gitignore`d or seeded with sample data.

**Fix:** Add `data/review-queue.json` to `.gitignore` (it's runtime state).

---

### MIN-4: `@vercel/node` Vulnerabilities (A5)
**Status:** 🟢 MINOR — Documented, Won't Fix

9 npm audit vulnerabilities in `@vercel/node` transitive deps. All are in `devDependencies`. The package is only used as a TypeScript type source (`VercelRequest`, `VercelResponse`). Zero production attack surface.

Already documented in TODO A5 with full rationale. No action needed, but should add a `npm audit` note to the README or CONTRIBUTING.md.

---

### MIN-5: No `CODE_OF_CONDUCT.md`
**Status:** 🟢 MINOR

Not critical for a solo project, but adding one signals this is a real open source project.

**Fix:** Add standard `CODE_OF_CONDUCT.md` (GitHub template).

---

### MIN-6: Extraneous Packages
**Status:** 🟢 MINOR

`npm ls` shows many `extraneous` packages (e.g., `@a2a-js/sdk`, `@ai-sdk/anthropic-v5`, `@libsql/client`, etc.). These were likely installed as transitive deps of earlier versions and not cleaned up.

**Impact:** Bloat. `node_modules` is 415MB partly due to these.

**Fix:** Run `npm dedupe && npm prune` or `rm -rf node_modules && npm ci`.

---

## 📋 Backlog Status (TODO.md)

### Already Resolved (Should Mark as Done)

| Item | Status | Evidence |
|---|---|---|
| **A7** | ✅ DONE | Input size limit already in `app.ts` (64KB) |
| **A11** | ✅ DONE | `env-validator.ts` already uses `startupLog` (pino) |
| **A12** | ✅ DONE | CORS entry already removed from `wcp.config.json` |

### Still Open (Valid Backlog)

| Item | Priority | What It Is |
|---|---|---|
| **A6** | Medium | Rate limiting on API endpoints |
| **A8** | Small | Document in-memory job fallback limitation |
| **A9** | Small | Add `trace_id` index on `audit_events` |
| **A10** | Medium | Derive `Layer2InputSchema` from `DeterministicReportSchema` |

### Icebox (Future v3 Work)

| Item | Priority | What It Is |
|---|---|---|
| **I1** | Large | OCR for scanned WH-347s |
| **I2** | Medium | Cost tracking per decision |
| **I3** | Large | Elasticsearch BM25 for live DBWD corpus |
| **I4** | Large | SAM.gov / DOL API integration |
| **I5** | Medium | Frontend: multi-employee display |

---

## 📊 Test Coverage Analysis

### Current State
- **Total test files:** 17
- **Passing:** 11 files (215 tests)
- **Failing:** 6 files (19 tests)
- **Coverage dependency:** Not installed (cannot generate report)

### Failing Tests Breakdown
| Test File | Failures | Root Cause |
|---|---|---|
| `coverage-gaps.test.ts` | 6 | `pg` module not loadable |
| `hybrid-retriever.test.ts` | 7 | `@elastic/elasticsearch` module not loadable |
| `bm25-search.test.ts` | 2 | `@elastic/elasticsearch` module not loadable |
| `decision-pipeline.test.ts` | 4 | `pg` module not loadable |

All 19 failures are **Phase 02 retrieval tests** that depend on external packages (`pg`, `@elastic/elasticsearch`) that are either:
- Not installed in `node_modules`
- Not resolvable by the Vitest test runner
- Require running external services (PostgreSQL, Elasticsearch)

**Core pipeline tests (66 tests):** All pass ✅

---

## 🔒 Security Audit

| Check | Status | Details |
|---|---|---|
| **Real API keys in source** | ✅ Clean | All keys use `sk-your-key-here` pattern |
| **Keys in git history** | ✅ Clean | `git log --all -p` — no real keys found |
| **Profanity in source/docs** | ✅ Clean | No profanity found |
| **Sensitive data in tests** | ✅ Clean | Mock data only |
| **`.env` files tracked** | ✅ Clean | `.env` is in `.gitignore` |
| **dist/ tracked in git** | ✅ Clean | `dist/` is in `.gitignore` |
| **npm audit vulnerabilities** | 🟡 Documented | 9 in devDeps only (A5); 0 production impact |

---

## 📝 Documentation Completeness

| Document | Status | Notes |
|---|---|---|
| `README.md` | ✅ Excellent | Full overview, API reference, architecture diagram |
| `CHANGELOG.md` | ✅ Good | Semver format, detailed entries |
| `LICENSE` | ✅ Good | MIT license with your name |
| `AGENTS.md` | ✅ Good | Architecture reference for contributors |
| `TODO.md` | 🟡 Stale | A11 marked open but already fixed |
| `docs/quick-start.md` | ✅ Good | Clear 5-minute setup guide |
| `docs/CONTRIBUTING.md` | ✅ Good | Self-review checklist |
| `docs/adrs/` | ✅ Good | 5 ADRs covering key decisions |
| `docs/compliance/` | ✅ Good | Regulatory compliance report, traceability matrix |
| `docs/architecture/` | ✅ Good | System overview, retrieval upgrade path, V3 plan |
| `docs/positioning/` | ✅ Good | Tech stack alignment, relevance audit |
| `docs/foundation/` | ✅ Good | Glossary, WCP/DBWD reference |
| `docs/development/` | ✅ Good | Contributor guide |
| `docs/roadmap/` | ✅ Good | Release plan |
| `.env.example` | 🟡 Incomplete | Missing most config vars |

**Total docs:** 21 markdown files — comprehensive coverage.

---

## 🎯 Recommended Fix Order

### Phase 1: Critical (30 minutes)
1. `npm install -D @vitejs/plugin-react` (fixes frontend build)
2. `npm install -D @vitest/coverage-v8` (fixes coverage)
3. Add `"dev": "tsx src/server.ts"` to `package.json`
4. Remove `@rollup/rollup-win32-x64-msvc` from `dependencies`
5. Fix `package.json` name to match repo

### Phase 2: Medium (1-2 hours)
6. Complete `.env.example` with all config vars
7. Mark A11 as resolved in `TODO.md`
8. Remove dead CORS entry from `wcp.config.json`
9. Add mocks for `pg` and `@elastic/elasticsearch` in test setup
10. Exclude Phase 02 retrieval tests from default `npm test`

### Phase 3: Polish (30 minutes)
11. Add `CODE_OF_CONDUCT.md`
12. Add `data/review-queue.json` to `.gitignore`
13. Run `npm prune` to clean extraneous packages
14. Add `npm audit` note to README/CONTRIBUTING

---

## 🏁 Release Readiness Checklist

| # | Item | Status | Blocker? |
|---|---|---|---|
| 1 | TypeScript compiles (0 errors) | ✅ | No |
| 2 | Pipeline lint passes | ✅ | No |
| 3 | Core tests pass (66/66) | ✅ | No |
| 4 | Security clean (no keys, no profanity) | ✅ | No |
| 5 | README complete | ✅ | No |
| 6 | Frontend builds | 🔴 **NO** | **YES** |
| 7 | Coverage report generates | 🔴 **NO** | **YES** |
| 8 | `npm run dev` works | 🔴 **NO** | **YES** |
| 9 | Cross-platform install (no win32 dep) | 🔴 **NO** | **YES** |
| 10 | `.env.example` complete | 🟡 Partial | No |
| 11 | All backlog items accurate | 🟡 Stale | No |
| 12 | Package name aligned | 🟡 Mismatch | No |
| 13 | CI workflow passes | 🟡 Would fail (frontend + coverage) | **YES** |

**Blockers:** 4 critical issues prevent release. After fixing them, the project is 95% ready.

---

*Report generated: 2026-04-22*
