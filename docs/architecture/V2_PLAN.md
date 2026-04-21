# WCP Compliance Agent — v2 Architecture Plan

**Date:** 2026-04-22
**Scope:** Full refactor from TypeScript monolith → Python + TypeScript + React + Everything

**Philosophy:** This is not a production system. This is a portfolio weapon — a vulgar display of architectural power demonstrating that you can design, connect, and orchestrate across every layer of the modern AI stack.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  REACT 19 FRONTEND (TypeScript)                                              │
│  Vite + Tailwind + Shadcn/ui + TanStack Query                                │
│  Modern product UI — multi-employee accordion, real-time pipeline viz        │
│  Directory: frontend/                                                        │
└────────────────────────────┬─────────────────────────────────────────────────┘
                             │ HTTP / REST + SSE (real-time updates)
┌────────────────────────────▼─────────────────────────────────────────────────┐
│  API GATEWAY + AGENT ORCHESTRATION (TypeScript/Node)                        │
│  Hono (lightweight, FastAPI-equivalent for Node)                             │
│  Mastra.ai v0.x — agent framework with tool-use + structured output          │
│  Langfuse integration — prompt versioning, cost tracking, eval traces        │
│  Directory: agent/                                                           │
└──────────────┬────────────────────────────┬───────────────────────────────────┘
               │                            │
               │ REST / gRPC (future)       │ External APIs
               ▼                            ▼
┌──────────────────────────────┐  ┌──────────────────────────────────────┐
│  DETERMINISTIC BACKEND       │  │  EXTERNAL SERVICES                   │
│  (Python)                    │  │  • OpenAI API (GPT-4o / o3-mini)     │
│  FastAPI + Pydantic v2       │  │  • Elasticsearch (BM25)            │
│  Async PostgreSQL (asyncpg)  │  │  • pgvector (dense retrieval)       │
│  Redis (aioredis)            │  │  • SAM.gov Wage Determinations       │
│  Phoenix/Arize (observability)│ │  • DOL Wage Determinations Online    │
│  pytest + golden set eval    │  │  • Salesforce CRM (future)           │
│  Celery (async task queue)   │  │  • Redshift analytics (future)       │
│  Directory: backend/         │  │                                      │
└──────────────┬───────────────┘  └──────────────────────────────────────┘
               │
               ▼
        ┌──────────────────┐
        │  DATA LAYER      │
        │  • PostgreSQL 16 │
        │  • pgvector ext  │
        │  • Redis 7       │
        │  • Elasticsearch 8│
        │  • (Future: Neo4j graph DB)│
        └──────────────────┘
```

---

## Full Tech Stack

| Layer | Technology | Job Description Match |
|---|---|---|
| **Frontend** | React 19, Vite, Tailwind, Shadcn/ui, TanStack Query, Zustand | Full-stack capability |
| **Agent Gateway** | Hono, TypeScript, ESM | Production Node.js backend |
| **LLM Orchestration** | Mastra.ai, Vercel AI SDK, OpenAI GPT-4o / o3-mini | AI agent frameworks, LLM APIs |
| **Prompt Infra** | Langfuse (versioning, A/B, cost tracking) | Prompt versioning, per-account config |
| **Observability** | Phoenix/Arize, OpenTelemetry, Pino structured logging | Phoenix observability, OTel |
| **Deterministic Backend** | Python 3.12, FastAPI, Pydantic v2, uvloop | Python backend systems |
| **Data Systems** | PostgreSQL 16, asyncpg, SQLAlchemy 2.0, Alembic | SQL-heavy data systems |
| **Analytics** | TimescaleDB extension (PostgreSQL) | Time-series: decision volume, approval rates, cost trends |
| **Search / RAG** | Elasticsearch 8 (BM25), pgvector (dense), cross-encoder reranking | Hybrid search, ES, vector search |
| **Cache / Queue** | Redis 7, aioredis, Celery, Flower | Redis-cached state, async queue |
| **Live Rate Ingestion** | SAM.gov / DOL Wage Determinations Online (future ETL) | Live DBWD rate ingestion |
| **Graph / Entities** | Neo4j-ready entity model (future), NetworkX in-memory now | Knowledge graphs, entity resolution |
| **Document Parsing** | pdfplumber, pypdf | PDF/CSV text extraction |
| **Testing** | pytest, pytest-benchmark, pytest-asyncio, playwright, vitest | CI evaluation, golden set |
| **Evaluation** | Custom eval framework, golden set, regression detection, LLM-as-judge | Evaluation pipelines, rubrics |
| **Deployment** | Docker, Docker Compose, GitHub Actions, Vercel, Render | Production deployment |

---

## Directory Structure (v2)

```
WCP-Compliance-Agent/
├── README.md                          # Portfolio flex document
├── ARCHITECTURE.md                    # System design with diagrams
├── docker-compose.yml                 # Full stack: Postgres + Redis + ES + Phoenix
├── .github/workflows/
│   ├── ci.yml                         # Python + TS + React tests
│   ├── eval.yml                       # Golden set regression detection
│   └── deploy.yml                     # Multi-service deploy
│
├── shared/                            # Contracts + codegen
│   ├── schemas/
│   │   ├── extracted-wcp.json
│   │   ├── deterministic-report.json
│   │   ├── llm-verdict.json
│   │   ├── trust-scored-decision.json
│   │   └── audit-event.json
│   └── generate.py                    # JSON Schema → Pydantic + Zod + TS types
│
├── backend/                           # PYTHON — Deterministic Brain
│   ├── pyproject.toml                 # Poetry, Python 3.12
│   ├── pytest.ini
│   ├── alembic.ini                    # Database migrations
│   ├── celeryconfig.py                # Celery + Redis broker
│   ├── src/
│   │   └── wcp_backend/
│   │       ├── __init__.py
│   │       ├── main.py                # FastAPI app factory
│   │       ├── config.py              # Pydantic Settings (env validation)
│   │       ├── api/
│   │       │   ├── router.py          # Main router aggregator
│   │       │   ├── extract.py         # POST /extract — Layer 1 entry
│   │       │   │                    #   • Text extraction from WH-347
│   │       │   │                    #   • PDF/CSV parsing via pdfplumber
│   │       │   ├── validate.py        # POST /validate — rule engine
│   │       │   │                    #   • Deterministic checks
│   │       │   │                    #   • DBWD rate validation
│   │       │   │                    #   • Overtime calculations
│   │       │   ├── dbwd.py            # GET /dbwd/{trade}/{locality}/{date}
│   │       │   │                    #   • Live DBWD rate lookup
│   │       │   │                    #   • Cache via Redis
│   │       │   ├── decisions.py       # GET/POST /decisions
│   │       │   │                    #   • Audit persistence
│   │       │   │                    #   • Time-series analytics queries
│   │       │   ├── jobs.py            # POST /jobs, GET /jobs/{id}
│   │       │   │                    #   • Celery-backed async processing
│   │       │   │                    #   • Job status + result polling
│   │       │   ├── search.py          # POST /search — hybrid RAG
│   │       │   │                    #   • BM25 + vector + reranking
│   │       │   │                    #   • Metadata filtering
│   │       │   ├── health.py          # GET /health
│   │       │   └── analytics.py       # GET /analytics
│   │       │                        #   • Decision volume trends (TimescaleDB)
│   │       │                        #   • Approval rate by trade
│   │       │                        #   • Cost per decision
│   │       ├── pipeline/
│   │       │   ├── extraction.py      # WH-347 text → structured JSON
│   │       │   ├── rules.py           # Rule engine: wage, overtime, fringe
│   │       │   ├── dbwd_lookup.py     # DBWD rate retrieval + versioning
│   │       │   └── checks.py          # Individual check implementations
│   │       │       ├── wage_check.py
│   │       │       ├── overtime_check.py
│   │       │       ├── fringe_check.py
│   │       │       ├── signature_check.py
│   │       │       └── total_check.py
│   │       ├── services/
│   │       │   ├── db.py              # asyncpg connection pool
│   │       │   ├── redis_cache.py     # aioredis wrapper
│   │       │   ├── audit.py           # Audit persistence (decisions + events)
│   │       │   ├── job_queue.py       # Celery task definitions
│   │       │   ├── elasticsearch.py   # ES client + BM25 queries
│   │       │   └── phoenix.py         # Arize Phoenix tracer
│   │       ├── retrieval/
│   │       │   ├── hybrid.py          # Orchestrator: BM25 → vector → rerank
│   │       │   ├── bm25.py            # ES BM25 candidate generation
│   │       │   ├── vector.py          # pgvector cosine similarity
│   │       │   ├── cross_encoder.py   # sentence-transformers reranking
│   │       │   └── chunking.py        # Domain-aware chunking (trade×locality)
│   │       ├── models/
│   │       │   ├── schemas.py         # Pydantic models (from JSON Schema)
│   │       │   ├── enums.py           # Status enums, bands
│   │       │   └── graph.py           # Entity relationship model
│   │       │       # WCP → Employee → Check → Verdict → TrustScore
│   │       │       # Graph-ready: maps directly to Neo4j (future) or NetworkX (now)
│   │       ├── workers/
│   │       │   └── celery_worker.py   # Celery worker entrypoint
│   │       └── observability/
│   │           ├── phoenix_setup.py   # Phoenix tracer initialization
│   │           ├── tracing.py         # OpenTelemetry spans
│   │           └── metrics.py         # Custom metrics (latency, tokens)
│   ├── migrations/                      # Alembic migrations
│   │   ├── 001_create_audit_tables.py
│   │   ├── 002_add_pgvector.py
│   │   ├── 003_create_job_queue.py
│   │   └── 004_add_timescale_hypertables.py
│   ├── tests/
│   │   ├── unit/                        # 200+ tests: extraction, rules, checks
│   │   ├── integration/                 # FastAPI TestClient for all endpoints
│   │   ├── eval/                        # 100-example golden set
│   │   │   ├── golden_set.json
│   │   │   ├── run_eval.py              # pytest-benchmark evaluation runner
│   │   │   └── regression_test.py       # CI hard-fail on drift
│   │   └── conftest.py                  # Shared fixtures, test DB, mock ES
│   ├── scripts/
│   │   ├── seed_dbwd.py                 # Seed DBWD rates into Postgres
│   │   ├── seed_elasticsearch.py        # Index DBWD chunks into ES
│   │   ├── seed_vectors.py              # Generate embeddings for pgvector
│   │   └── etl_sam_gov.py               # SAM.gov ETL pipeline (activates live rates)
│   └── Dockerfile
│
├── agent/                             # TYPESCRIPT — Agent Orchestration
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── server.ts                  # Hono app factory
│   │   ├── config.ts                  # Env validation (Zod)
│   │   ├── api/
│   │   │   ├── analyze.ts             # POST /api/analyze — gateway endpoint
│   │   │   ├── analyze-pdf.ts         # POST /api/analyze-pdf — multipart upload
│   │   │   ├── analyze-csv.ts         # POST /api/analyze-csv — bulk upload
│   │   │   ├── health.ts              # GET /health
│   │   │   ├── decisions.ts           # GET /api/decisions
│   │   │   └── jobs.ts                # POST/GET /api/jobs
│   │   ├── mastra/
│   │   │   ├── agents/
│   │   │   │   └── wcp-verdict.ts     # Layer 2: LLM verdict agent
│   │   │   │                        #   • Structured output via Mastra
│   │   │   │                        #   • Tool-use: extract, validate, dbwd_lookup
│   │   │   ├── tools/
│   │   │   │   ├── extract.ts         # Calls Python /extract
│   │   │   │   ├── validate.ts        # Calls Python /validate
│   │   │   │   ├── dbwd_lookup.ts     # Calls Python /dbwd/{trade}/{locality}
│   │   │   │   ├── search.ts          # Calls Python /search (RAG context)
│   │   │   │   ├── persist.ts         # Calls Python /decisions
│   │   │   │   └── job_status.ts      # Calls Python /jobs/{id}
│   │   │   ├── workflows/
│   │   │   │   └── wcp-pipeline.ts    # Three-layer orchestration
│   │   │   │                        #   • Step 1: extract (Python)
│   │   │   │                        #   • Step 2: validate (Python) → checks
│   │   │   │                        #   • Step 3: verdict (Mastra LLM)
│   │   │   │                        #   • Step 4: trust score (TS)
│   │   │   │                        #   • Step 5: persist (Python)
│   │   │   └── memory/
│   │   │       └── conversation.ts    # (Future) Conversation memory for multi-turn
│   │   ├── prompts/
│   │   │   ├── registry.ts            # Versioned prompt registry
│   │   │   ├── versions/
│   │   │   │   ├── wcp-verdict-v1.ts
│   │   │   │   └── wcp-verdict-v2.ts
│   │   │   └── evaluation/
│   │   │       ├── rubric.ts          # Scoring rubric for evals
│   │   │       └── judge.ts           # LLM-as-judge for prompt quality
│   │   ├── langfuse/
│   │   │   ├── client.ts              # Langfuse integration
│   │   │   ├── tracing.ts             # Trace generation, versioning
│   │   │   └── cost_tracking.ts       # Per-decision cost aggregation
│   │   ├── types/
│   │   │   └── index.ts               # Zod schemas (from JSON Schema)
│   │   ├── utils/
│   │   │   ├── logger.ts              # Pino structured logging
│   │   │   ├── errors.ts              # Custom error hierarchy
│   │   │   ├── http-client.ts         # Typed fetch for Python API
│   │   │   └── rate_limiter.ts        # In-memory rate limiting (A6)
│   │   └── tests/
│   │       ├── unit/
│   │       │   ├── tools.test.ts
│   │       │   ├── prompts.test.ts
│   │       │   └── rate_limiter.test.ts
│   │       └── integration/
│   │           ├── pipeline.test.ts
│   │           └── mock-python.ts     # Mock Python API for CI
│   └── Dockerfile
│
├── frontend/                          # REACT — Product UI
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── PipelineVisualizer.tsx
│   │   │   ├── UploadDropzone.tsx     # Drag-drop PDF/CSV with progress
│   │   │   ├── DecisionCard.tsx       # Full decision display
│   │   │   ├── AuditTrail.tsx         # Regulation citations, trace ID
│   │   │   ├── EmployeeAccordion.tsx  # Multi-employee display (I5)
│   │   │   ├── TrustScoreBadge.tsx    # Color-coded trust band
│   │   │   ├── HumanReviewQueue.tsx   # Score < 0.60 queue
│   │   │   ├── CostDashboard.tsx      # Per-decision token cost
│   │   │   └── SettingsPanel.tsx      # Prompt version selector, model picker
│   │   ├── hooks/
│   │   │   ├── useAnalyze.ts        # TanStack Query mutation
│   │   │   ├── useJobPolling.ts     # Polling for async jobs
│   │   │   ├── useDecisions.ts      # Paginated decision history
│   │   │   ├── useDecisionStream.ts # SSE for real-time updates
│   │   │   └── usePromptVersions.ts # Langfuse prompt list
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx        # Decision volume + approval rate
│   │   │   ├── Analyze.tsx          # Upload + analyze flow
│   │   │   ├── Decisions.tsx        # Searchable history
│   │   │   ├── ReviewQueue.tsx      # Human review interface
│   │   │   ├── Analytics.tsx        # Cost trends, token usage
│   │   │   └── Settings.tsx         # Prompt version, model config
│   │   ├── types/
│   │   │   └── api.ts               # Shared TS types
│   │   └── utils/
│   │       └── api-client.ts
│   └── Dockerfile
│
└── docs/
    ├── positioning/
    │   ├── TECH_STACK_ALIGNMENT.md    # Maps to both job descriptions
    │   └── INTERVIEW_TALKING_POINTS.md
    ├── architecture/
    │   ├── V2_PLAN.md                 # This document
    │   ├── system-diagram.png
    │   ├── data-flow.md
    │   └── graph-model.md             # Future Neo4j entity design
    ├── compliance/
    │   ├── regulatory-compliance-report.md
    │   └── traceability-matrix.md
    └── adrs/
        ├── ADR-001-why-three-layers.md
        ├── ADR-002-python-typescript-split.md
        ├── ADR-003-mastra-over-custom-orchestrator.md
        ├── ADR-004-phoenix-observability.md
        ├── ADR-005-langfuse-prompt-infra.md
        └── ADR-006-hybrid-rag-architecture.md
```

---

## Full Data Flow

```
User uploads WH-347 PDF (or types text)
        │
        ▼
┌───────────────────────────────┐
│  React Frontend               │
│  • UploadDropzone shows progress
│  • Routes to /api/analyze-pdf  │
└───────────┬───────────────────┘
            │ multipart/form-data
            ▼
┌───────────────────────────────┐
│  Agent (Hono)                 │
│  • Receives file + metadata
│  • Rate limiting check          │
│  • Content-Length validation    │
└───────────┬───────────────────┘
            │
            ├──► POST backend/extract (Python)
            │    pdfplumber → ExtractedWCP JSON
            │    Returns structured data
            │
            ▼
┌───────────────────────────────┐
│  Mastra Agent (Layer 2)       │
│  • Receives ExtractedWCP
│  • Tool-use: validate (Python)
│    └── POST backend/validate
│        Rules engine → DeterministicReport
│  • LLM reasoning over findings
│  • Tool-use: dbwd_lookup (Python)
│    └── GET backend/dbwd/{trade}
│  • Tool-use: search (Python RAG)
│    └── POST backend/search
│        Hybrid retrieval → context
│  • Structured output: LLMVerdict
│  • Langfuse trace captured
│  • Cost tracked per decision
└───────────┬───────────────────┘
            │
            ▼
┌───────────────────────────────┐
│  Agent (Layer 3)                │
│  • Trust score calculation      │
│  • Score < 0.60 → human review  │
│  • Persist via Python           │
│    └── POST backend/decisions   │
│  • Phoenix span: full trace     │
└───────────┬───────────────────┘
            │ SSE or polling
            ▼
┌───────────────────────────────┐
│  React Frontend                 │
│  • DecisionCard with accordion
│  • Regulation citations (clickable)
│  • TrustScoreBadge (color band)
│  • AuditTrail with trace ID
│  • Cost per decision displayed  │
└───────────────────────────────┘
```

---

## Observability Stack

| Tool | Purpose | Job Description Match |
|---|---|---|
| **Phoenix / Arize** | LLM tracing, prompt evaluation, drift detection | "Integrate observability into AI workflows (e.g., Phoenix)" |
| **Langfuse** | Prompt versioning, A/B testing, cost tracking, per-account config | "Prompt infrastructure including versioning, A/B testing, per-account configuration, and cost tracking" |
| **OpenTelemetry** | Distributed tracing across Python + TS services | OTel standard |
| **Pino (TS) + structlog (Python)** | Structured logging, JSON output | Production logging |
| **Prometheus + Grafana** | Metrics dashboard (future, Phase 2) | Metrics + monitoring |
| **Celery + Flower** | Task queue monitoring | Async job observability |

### Phoenix Integration

- **Python backend:** `arize-phoenix` tracer around FastAPI endpoints
- **TypeScript agent:** `phoenix-client` for LLM call tracing
- **Frontend:** Trace ID display, link to Phoenix UI
- **What it shows:** Latency per layer, token usage per call, prompt version effectiveness

### Langfuse Integration

- **Prompt versioning:** Every prompt change gets a version hash
- **A/B testing:** Route 50% traffic to v1, 50% to v2, compare trust scores
- **Cost tracking:** Aggregate per model, per prompt version, per day
- **Per-account config:** (Future) Different prompts for different contractor tiers

---

## Evaluation & CI

### Golden Set (100 Examples)

```python
# backend/tests/eval/golden_set.json
[
  {
    "id": "eval_001",
    "input": "Role: Electrician, Hours: 40, Wage: 51.69, Fringe: 34.63",
    "expected_status": "Approved",
    "expected_checks": ["wage_check_001", "fringe_check_001"],
    "minimum_trust_score": 0.85,
    "regulations": ["40 U.S.C. § 3142"]
  },
  ...
]
```

### CI Pipeline

```yaml
# .github/workflows/eval.yml
jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - name: Start services
        run: docker-compose up -d postgres redis elasticsearch
      
      - name: Run golden set
        run: cd backend && pytest tests/eval/ --benchmark-only
      
      - name: Regression check
        run: cd backend && python tests/eval/regression_test.py
        # Compares current scores against baseline
        # Fails if trust score drops > 0.05 on any example
      
      - name: Upload eval artifact
        uses: actions/upload-artifact@v4
        with:
          name: eval-results
          path: backend/eval_report.json
```

### LLM-as-Judge

```typescript
// agent/src/prompts/evaluation/judge.ts
// Secondary LLM evaluates verdict quality
// Scores: accuracy (0-10), citation_completeness (0-10), reasoning_clarity (0-10)
// Used for prompt A/B testing via Langfuse
```

---

## Docker Compose (Full Stack)

```yaml
services:
  # ─── Data Layer ─────────────────────────────────────
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: wcp
      POSTGRES_USER: wcp
      POSTGRES_PASSWORD: wcp
    ports: ["5432:5432"]
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  elasticsearch:
    image: elasticsearch:8.15.0
    environment:
      discovery.type: single-node
      xpack.security.enabled: "false"
    ports: ["9200:9200"]
    volumes:
      - es_data:/usr/share/elasticsearch/data

  # ─── Observability ──────────────────────────────────
  phoenix:
    image: arizephoenix/phoenix:latest
    ports: ["6006:6006"]
    environment:
      PHOENIX_PORT: 6006
    volumes:
      - phoenix_data:/mnt/data

  # ─── Backend (Python) ───────────────────────────────
  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      DATABASE_URL: postgresql+asyncpg://wcp:wcp@postgres:5432/wcp
      REDIS_URL: redis://redis:6379
      ELASTICSEARCH_URL: http://elasticsearch:9200
      PHOENIX_COLLECTOR_ENDPOINT: http://phoenix:6006
      CELERY_BROKER_URL: redis://redis:6379/0
    depends_on: [postgres, redis, elasticsearch, phoenix]

  celery_worker:
    build: ./backend
    command: celery -A wcp_backend.workers worker --loglevel=info
    environment:
      DATABASE_URL: postgresql+asyncpg://wcp:wcp@postgres:5432/wcp
      REDIS_URL: redis://redis:6379
      CELERY_BROKER_URL: redis://redis:6379/0
    depends_on: [postgres, redis]

  celery_beat:
    build: ./backend
    command: celery -A wcp_backend.workers beat --loglevel=info
    environment:
      CELERY_BROKER_URL: redis://redis:6379/0
    depends_on: [redis]

  flower:
    build: ./backend
    command: celery -A wcp_backend.workers flower --port=5555
    ports: ["5555:5555"]
    depends_on: [redis]

  # ─── Agent (TypeScript) ─────────────────────────────
  agent:
    build: ./agent
    ports: ["3000:3000"]
    environment:
      BACKEND_URL: http://backend:8000
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      OPENAI_MODEL: ${OPENAI_MODEL:-gpt-4o-mini}
      LANGFUSE_PUBLIC_KEY: ${LANGFUSE_PUBLIC_KEY}
      LANGFUSE_SECRET_KEY: ${LANGFUSE_SECRET_KEY}
      LANGFUSE_HOST: ${LANGFUSE_HOST:-https://cloud.langfuse.com}
      PHOENIX_COLLECTOR_ENDPOINT: http://phoenix:6006
    depends_on: [backend]

  # ─── Frontend (React) ───────────────────────────────
  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    environment:
      VITE_API_URL: http://agent:3000
      VITE_PHOENIX_URL: http://localhost:6006
    depends_on: [agent]

volumes:
  postgres_data:
  es_data:
  phoenix_data:
```

---

## Migration Phases (Updated)

### Phase 1: Python Backend + Data Layer (Days 1-3)
1. Create `backend/` directory with Poetry setup
2. Port deterministic extraction from `layer1-deterministic.ts`
3. Port rule engine (wage, overtime, fringe, signature, total checks)
4. Add asyncpg + SQLAlchemy 2.0 + Alembic
5. Add Redis caching via aioredis
6. Add Elasticsearch BM25 wrapper
7. Add pgvector dense retrieval
8. Add Phoenix tracing
9. Add Celery + Redis job queue
10. **pytest suite: 200+ tests**

### Phase 2: Observability + Prompt Infra (Days 3-4)
1. Phoenix UI running on :6006
2. Langfuse integration for prompt versioning
3. Cost tracking per decision
4. A/B testing scaffold (50/50 routing)
5. Evaluation pipeline: golden set + regression detection

### Phase 3: Agent Refactor (Days 4-6)
1. Restructure `src/` → `agent/src/`
2. Integrate Mastra.ai v0.x
3. Layer 2 as Mastra agent with structured output
4. Python services as Mastra tools
5. Langfuse prompt registry
6. HTTP client for Python API
7. Rate limiting (A6)

### Phase 4: React Frontend (Days 6-8)
1. Create `frontend/` with Vite + React 19 + Tailwind + Shadcn
2. Upload → analyze → display flow
3. Multi-employee accordion (I5)
4. Cost dashboard
5. Human review queue UI
6. Real-time SSE updates
7. Prompt version selector in settings

### Phase 5: Integration + The Demo (Days 8-10)
1. Docker Compose full stack running
2. E2E: upload PDF → full decision → Phoenix trace → audit trail
3. CI: Python tests + TS build + React build + eval regression
4. README rewrite as portfolio flex document
5. Architecture ADRs (why three layers, why Python/TS split, etc.)
6. Deploy: Vercel (frontend) + Render (backend + agent)

---

## ADR Checklist

| ADR | Topic | Purpose |
|---|---|---|
| **ADR-001** | Why Three Layers | Decision architecture: deterministic → LLM → trust |
| **ADR-002** | Python + TypeScript Split | Why separate deterministic brain from agent orchestration |
| **ADR-003** | Mastra Over Custom Orchestrator | Why Mastra.ai instead of hand-rolled agent framework |
| **ADR-004** | Phoenix Observability | Why Phoenix/Arize for LLM tracing |
| **ADR-005** | Langfuse Prompt Infra | Why Langfuse for versioning, A/B, cost tracking |
| **ADR-006** | Hybrid RAG Architecture | Why BM25 + vector + cross-encoder |
| **ADR-007** | PostgreSQL + pgvector | Why one DB for relational + vector |
| **ADR-008** | Celery + Redis Queue | Why not in-memory jobs for production |
| **ADR-009** | React Over SvelteKit | Why React 19 for the frontend |

---

## Interview Talking Points

> **"I built a compliance decision engine, but the architecture maps directly to revenue intelligence. Three services: Python handles deterministic extraction and validation — the same pattern as analytics pipelines processing structured data at scale. TypeScript with Mastra orchestrates LLM reasoning — the same as tool-use functions integrating search and CRM state. React provides the product face."
>
> **"For observability, I integrated Phoenix for LLM tracing and Langfuse for prompt versioning with A/B testing. The evaluation pipeline runs a 100-example golden set in CI — regression detection hard-fails the build if trust scores drift."
>
> **"The RAG layer uses Elasticsearch BM25 for candidate generation, pgvector for dense similarity, and a cross-encoder for reranking. The entity model — WCP, Employee, Check, Verdict, TrustScore — is structured for graph expansion."
>
> **"Everything spins up with docker-compose: Postgres, Redis, Elasticsearch, Phoenix, Python backend, Celery workers, TypeScript agent, and React frontend. One command, full stack."

---

*Plan version: 2026-04-22 v2.1*
*Estimated effort: 8-10 days of focused work*
*Philosophy: Vulgar display of architectural power*
