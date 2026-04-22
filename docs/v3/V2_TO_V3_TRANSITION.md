# V2 → V3 Transition Guide

**Date:** 2026-04-22
**Status:** V2 in final pass, V3 planning phase

---

## Philosophy: Archive v2, Start v3 Fresh

**v2 repo:** `FishRaposo/WCP-Compliance-Agent` — becomes the archived monolith proof-of-concept. Tag it `v2.0.0` before moving on.

**v3 repo:** New clean repository — only the architecture we actually need, no stubbed features, no legacy debt.

---

## What to Port from v2 → v3

### Core Logic (Must Port)

| Source (v2) | Destination (v3) | What It Is |
|---|---|---|
| `src/pipeline/layer1-deterministic.ts` | `backend/src/extraction/` | Deterministic extraction — regex patterns, field extraction, DBWD rate lookup logic |
| `src/pipeline/layer1-deterministic.ts` (checks) | `backend/src/validation/` | Rule checks — wage, overtime, fringe, classification, signature, totals |
| `src/types/decision-pipeline.ts` | `shared/schemas/wcp.py` + `shared/schemas/wcp.ts` | WH-347 data model — Pydantic (Python) + Zod (TypeScript) |
| `src/utils/mock-responses.ts` | `backend/src/corpus/in_memory.py` | 20-trade in-memory DBWD corpus (fallback until live rates) |
| `tests/eval/golden-set.ts` | `backend/tests/eval/golden_set.json` | 100 labeled examples — the regression guard moves to Python |
| `src/prompts/versions/wcp-verdict-v2.ts` | `agent/src/prompts/` | Layer 2 LLM prompt template |
| `migrations/001_create_audit_tables.sql` | `backend/migrations/` | PostgreSQL schema — audit events, decisions, jobs |

### Regulatory Knowledge (Preserve)

| Source (v2) | Destination (v3) | What It Is |
|---|---|---|
| `docs/compliance/traceability-matrix.md` | `docs/compliance/` | Regulation → check ID mapping |
| `docs/compliance/regulatory-report.md` | `docs/compliance/` | Davis-Bacon Act implementation analysis |
| `docs/compliance/implementation-guide.md` | `docs/compliance/` | Practical compliance implementation |

### Configuration (Evolve)

| Source (v2) | Destination (v3) | What It Is |
|---|---|---|
| `wcp.config.json` | `backend/config.yaml` + `agent/config.yaml` | Split into backend (rules) and agent (orchestration) config |
| `.env.example` | `backend/.env.example` + `agent/.env.example` + `frontend/.env.example` | Service-specific env templates |

---

## What to Leave Behind (Archive in v2)

### Entire Directories — Do Not Port

| v2 Directory | Why Not Port |
|---|---|
| `src/retrieval/` | Stubbed — ES/pgvector never connected. v3 will build retrieval fresh with Python |
| `src/frontend/` | React 18 monolithic — v3 will be React 19 + Vite + Shadcn/ui from scratch |
| `src/services/job-queue.ts` | In-memory only — v3 uses Celery + Redis |
| `src/services/audit-persistence.ts` | v3 will use SQLAlchemy 2.0 async + Alembic |
| `src/ingestion/pdf-ingestion.ts` | `pdf-parse` is buggy — v3 uses Python `PyPDF2`/`pdfplumber` |
| `src/ingestion/csv-ingestion.ts` | `papaparse` works but v3 Python `pandas`/`polars` is better |
| `api/` | Vercel serverless functions — v3 is containerized services |
| `tests/unit/coverage-gaps.test.ts` | Tests stubbed retrieval — irrelevant in v3 |
| `tests/unit/hybrid-retriever.test.ts` | Tests stubbed retrieval — irrelevant in v3 |
| `tests/unit/bm25-search.test.ts` | Tests ES module that never loads — irrelevant in v3 |
| `scripts/lint-pipeline-discipline.ts` | v2-specific architectural lint — v3 needs new lint rules |

### Specific Files — Do Not Port

| v2 File | Why Not Port |
|---|---|
| `src/app.ts` | Hono app with v2 routes — v3 has separate backend (`backend/src/main.py`) and agent (`agent/src/app.ts`) |
| `src/server.ts` | v2 entrypoint — v3 has 3 entrypoints (Python, TS agent, Vite dev server) |
| `src/pipeline/orchestrator.ts` | v2 orchestrator — v3 agent uses Mastra.ai |
| `src/pipeline/layer3-trust-score.ts` | Port the formula but rewrite in Python |
| `src/pipeline/layer2-llm-verdict.ts` | Port prompt template but rewrite with Mastra.ai |
| `src/utils/errors.ts` | v2 error types — v3 uses Python exceptions + TS error classes |
| `src/utils/logger.ts` | pino setup — v3 uses Python `structlog` + TS `pino` |
| `src/utils/env-validator.ts` | v2-specific env — v3 uses Pydantic Settings + dotenv |
| `src/utils/mock-responses.ts` (all) | In-memory corpus is the only thing to port — the rest of mock responses are test infrastructure |
| `src/instrumentation.ts` | OTel setup — v3 uses Python OTel + TS OTel separately |
| `vite.config.ts` | v2 Vite config — v3 frontend needs fresh config |
| `tsconfig.backend.json` | v2 TypeScript config — v3 has separate TS configs per service |
| `tsconfig.frontend.json` | v2 TypeScript config — v3 frontend uses new config |
| `.github/workflows/pipeline-discipline.yml` | v2 CI — v3 needs multi-stack CI (Python + TypeScript + React) |
| `docker-compose.yml` | v2 has PostgreSQL only — v3 needs PostgreSQL + Redis + Elasticsearch + Phoenix + all services |
| `vercel.json` | Vercel deployment — v3 is Docker/containerized |

---

## v3 Directory Layout (Proposed)

```
wcp-compliance-agent-v3/           # New repo
├── README.md
├── LICENSE
├── docker-compose.yml               # Full stack: PG, Redis, ES, Phoenix, backend, agent, frontend
├── Makefile                         # Common tasks: dev, test, lint, migrate
├── .github/
│   └── workflows/
│       ├── ci.yml                   # Unified CI: Python tests, TS tests, frontend build
│       └── eval.yml                 # Golden set regression — hard-fail on drift
│
├── backend/                         # Python deterministic brain
│   ├── pyproject.toml               # Poetry dependencies
│   ├── README.md
│   ├── .env.example
│   ├── src/
│   │   ├── main.py                  # FastAPI app factory
│   │   ├── config.py                # Pydantic Settings (env + yaml)
│   │   ├── extraction/              # Layer 1: field extraction (ported from v2)
│   │   │   ├── __init__.py
│   │   │   ├── patterns.py          # Regex patterns from v2
│   │   │   └── wh347.py             # WH-347 parser
│   │   ├── validation/              # Layer 1: rule checks (ported from v2)
│   │   │   ├── __init__.py
│   │   │   ├── wage.py              # Wage checks
│   │   │   ├── overtime.py          # Overtime checks
│   │   │   ├── fringe.py            # Fringe checks
│   │   │   ├── classification.py    # Classification checks
│   │   │   └── signature.py         # Signature checks
│   │   ├── corpus/                  # DBWD rate data
│   │   │   ├── __init__.py
│   │   │   ├── in_memory.py         # 20-trade fallback (ported from v2)
│   │   │   └── hybrid_retrieval.py  # BM25 + vector + rerank (new)
│   │   ├── models/                  # SQLAlchemy 2.0 models
│   │   │   ├── __init__.py
│   │   │   ├── decision.py          # Decision, AuditEvent tables
│   │   │   └── job.py               # Job queue tables
│   │   ├── api/                     # FastAPI routers
│   │   │   ├── __init__.py
│   │   │   ├── decisions.py         # POST /decisions, GET /decisions/:id
│   │   │   ├── extract.py           # POST /extract
│   │   │   ├── validate.py          # POST /validate
│   │   │   ├── dbwd.py              # GET /dbwd-rate/:trade/:locality
│   │   │   └── health.py            # GET /health
│   │   ├── services/                # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── decision_service.py  # Orchestrate extraction → validation → persist
│   │   │   └── retrieval_service.py # Hybrid DBWD lookup
│   │   ├── tasks/                   # Celery background tasks
│   │   │   ├── __init__.py
│   │   │   └── process_decision.py  # Async decision processing
│   │   └── instrumentation.py       # OpenTelemetry setup
│   ├── migrations/                  # Alembic SQL migrations
│   │   ├── env.py
│   │   ├── versions/
│   │   └── 001_initial.py           # Port from v2 migration
│   ├── tests/
│   │   ├── conftest.py              # pytest fixtures
│   │   ├── unit/
│   │   │   ├── test_extraction.py   # Port from v2 extraction tests
│   │   │   ├── test_validation.py   # Port from v2 validation tests
│   │   │   └── test_models.py       # SQLAlchemy model tests
│   │   ├── integration/
│   │   │   └── test_api.py          # FastAPI endpoint tests
│   │   └── eval/
│   │       ├── golden_set.json      # Port 100 examples from v2
│   │       └── test_golden_set.py   # CI hard-fail regression
│   └── Dockerfile                   # Python 3.12 slim
│
├── agent/                           # TypeScript LLM orchestration
│   ├── package.json
│   ├── tsconfig.json
│   ├── README.md
│   ├── .env.example
│   ├── src/
│   │   ├── app.ts                   # Hono app
│   │   ├── config.ts                # Zod env validation
│   │   ├── mastra/
│   │   │   ├── index.ts             # Mastra instance setup
│   │   │   ├── agents/
│   │   │   │   └── wcp-agent.ts     # Layer 2: LLM verdict agent
│   │   │   └── tools/
│   │   │       ├── extract.ts       # Call Python /extract endpoint
│   │   │       ├── validate.ts      # Call Python /validate endpoint
│   │   │       └── dbwd_lookup.ts   # Call Python /dbwd-rate endpoint
│   │   ├── prompts/
│   │   │   ├── wcp-verdict.ts       # Prompt template (ported from v2)
│   │   │   └── versions/
│   │   │       └── v2.ts            # wcp-verdict-v2
│   │   ├── types/
│   │   │   └── index.ts             # Shared TS types (Zod schemas)
│   │   └── instrumentation.ts       # OpenTelemetry + Langfuse
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   └── Dockerfile                   # Node 20 slim
│
├── frontend/                        # React 19 product UI
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── README.md
│   ├── .env.example
│   ├── src/
│   │   ├── main.tsx                 # Entry point
│   │   ├── App.tsx                  # Router + layout
│   │   ├── components/
│   │   │   ├── DecisionForm.tsx     # Submit WCP for analysis
│   │   │   ├── DecisionDetail.tsx   # Show full 3-layer breakdown
│   │   │   ├── DecisionList.tsx     # List all decisions
│   │   │   ├── Layer1Panel.tsx      # Deterministic findings
│   │   │   ├── Layer2Panel.tsx      # LLM verdict
│   │   │   ├── Layer3Panel.tsx      # Trust score + audit trail
│   │   │   └── UploadForm.tsx       # PDF/CSV upload
│   │   ├── hooks/
│   │   │   └── useDecisions.ts      # TanStack Query hooks
│   │   ├── lib/
│   │   │   └── api.ts               # API client (agent endpoints)
│   │   └── types/
│   │       └── index.ts             # Frontend types
│   ├── tests/
│   │   └── e2e/
│   │       └── decision-flow.spec.ts  # Playwright E2E
│   └── Dockerfile                   # nginx static serve
│
├── shared/                          # Cross-service contracts
│   ├── schemas/
│   │   ├── wcp.ts                   # Zod schemas (source of truth)
│   │   ├── wcp.py                   # Pydantic models (generated from Zod)
│   │   └── generate.py              # codegen: Zod → Pydantic
│   └── types/
│       └── index.d.ts               # Shared TypeScript types
│
└── docs/
    ├── architecture/
    │   ├── system-overview.md
    │   ├── decision-pipeline.md
    │   ├── api-contract.md          # REST contract between services
    │   └── v3-plan.md               # This document
    ├── compliance/
    │   ├── traceability-matrix.md   # Port from v2
    │   └── regulatory-report.md     # Port from v2
    ├── development/
    │   ├── setup.md
    │   ├── testing.md
    │   └── contributing.md
    └── adr/                         # Architecture Decision Records
        ├── 001-python-backend.md
        ├── 002-mastra-agent.md
        ├── 003-react-frontend.md
        └── 004-monorepo-structure.md
```

---

## Transition Checklist

### Phase 0: Prep (1 day)

- [ ] Tag v2 repo: `git tag -a v2.0.0 -m "TypeScript monolith proof-of-concept" && git push origin v2.0.0`
- [ ] Create new v3 repository on GitHub (or keep same org, new name)
- [ ] Initialize v3 repo with README, LICENSE, .gitignore
- [ ] Set up branch protection rules for `main`
- [ ] Copy regulatory docs (`docs/compliance/`) from v2
- [ ] Copy golden set (`tests/eval/golden-set.ts` → `backend/tests/eval/golden_set.json`)

### Phase 1: Backend Skeleton (2–3 days)

- [ ] `cd backend && poetry init` — FastAPI, asyncpg, SQLAlchemy 2.0, Pydantic, pytest
- [ ] FastAPI app factory (`backend/src/main.py`)
- [ ] Pydantic Settings config (`backend/src/config.py`)
- [ ] Port deterministic extraction patterns from v2 (`backend/src/extraction/patterns.py`)
- [ ] Port validation checks from v2 (`backend/src/validation/*.py`)
- [ ] Port in-memory DBWD corpus from v2 (`backend/src/corpus/in_memory.py`)
- [ ] SQLAlchemy models (`backend/src/models/decision.py`)
- [ ] Alembic migrations (port from v2 SQL)
- [ ] API routers: `/extract`, `/validate`, `/dbwd-rate`, `/decisions`
- [ ] pytest suite with golden set regression
- [ ] Dockerfile for backend

### Phase 2: Agent Skeleton (2 days)

- [ ] `cd agent && npm init` — Hono, Mastra.ai, Vercel AI SDK, Zod, pino
- [ ] Hono app with health endpoint
- [ ] Mastra agent setup with tools calling Python backend
- [ ] Port prompt template from v2 (`agent/src/prompts/wcp-verdict.ts`)
- [ ] Zod schemas for agent types
- [ ] Langfuse integration (prompt versioning, tracing)
- [ ] Dockerfile for agent

### Phase 3: Frontend Skeleton (2 days)

- [ ] `cd frontend && npm create vite@latest` — React 19, TypeScript
- [ ] Install Tailwind CSS + Shadcn/ui
- [ ] TanStack Query setup
- [ ] Decision form, detail, list components
- [ ] Upload form (PDF/CSV)
- [ ] Dockerfile for frontend (nginx)

### Phase 4: Integration (2 days)

- [ ] Docker Compose: PostgreSQL + Redis + backend + agent + frontend
- [ ] REST API contract documentation
- [ ] End-to-end test: submit WCP → get 3-layer decision
- [ ] Golden set regression in CI (Python tests)
- [ ] OpenTelemetry tracing across all 3 services
- [ ] CI/CD: GitHub Actions for Python + TypeScript + React

### Phase 5: Polish (1–2 days)

- [ ] README with architecture diagram
- [ ] Quick start guide
- [ ] CONTRIBUTING.md
- [ ] ADRs for v3 decisions
- [ ] Performance baseline (latency, throughput)
- [ ] Tag v3.0.0-alpha

---

## Risk: What If v3 Takes Longer?

**Fallback:** v2 repo remains perfectly usable as a portfolio piece. If v3 stretches beyond the job application timeline, you can:

1. Point recruiters to v2 for "working proof-of-concept"
2. Point them to v3 docs for "architectural vision and planning"
3. The V3_PLAN.md (in docs/v3/) alone demonstrates systems thinking at the level they want

**v2 is not broken — it's just a different scope.** Having both shows range: "I can ship a working monolith in 2 weeks, and I can design a multi-service architecture for scale."

---

## Decision: Same Repo or New Repo?

| Approach | Pros | Cons |
|---|---|---|
| **New repo** (recommended) | Clean slate, no legacy debt, clear separation of concerns, v2 stays archived and tagged | Two repos to maintain, link between them |
| **Same repo, `v3` branch** | Single repo history, easy to compare branches, PR-based migration | Branch will diverge massively, messy git history, v2 main becomes stale |

**Recommendation:** New repo. Call it `wcp-compliance-agent` (drop the "-v3" suffix — this is the real one). Archive v2 with a final tag and README note.

---

*Generated: 2026-04-22*
