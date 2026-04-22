# WCP Compliance Agent — V2

[![CI](https://github.com/FishRaposo/WCP-Compliance-Agent/actions/workflows/pipeline-discipline.yml/badge.svg)](https://github.com/FishRaposo/WCP-Compliance-Agent/actions/workflows/pipeline-discipline.yml)
[![Coverage](https://img.shields.io/badge/coverage-83.25%25-brightgreen)](#running-tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-green)](https://nodejs.org/)

> **V2 — TypeScript reference implementation.**  
> Three-layer AI decision pipeline for regulated-domain compliance. Every finding cites a regulation. Every decision has a replayable audit trail.
>
> *V3 is in planning — see [docs/architecture/V3_PLAN.md](./docs/architecture/V3_PLAN.md).*

**[→ Live Demo](https://wcp-compliance-agent.vercel.app)** · **[→ Quick Start](./docs/quick-start.md)** · **[→ Architecture](./docs/architecture/system-overview.md)**

---

## What This Is

WCP Compliance Agent validates Weekly Certified Payroll (WCP) submissions against Davis-Bacon Act prevailing wage requirements. It's a **reference implementation of a trustworthy AI decision system**: one where every output is explainable, traceable, and defensible.

The core pattern — deterministic scaffolding → constrained LLM reasoning → trust-scored routing — transfers directly to any domain where AI errors have consequences: healthcare, finance, legal, revenue intelligence.

---

## Version History

### V1 — Prototype (Mastra.ai)

The first iteration was built on the **Mastra.ai 0.24.x** agent framework (April 2024). It was a monolithic agent with two tools — `extractWCPTool` and `validateWCPTool` — living in `src/mastra/tools/wcp-tools.ts`.

**What it did:**
- 3-field extraction (role, hours, wage) via regex
- DBWD rate validation against 2 hard-coded rates (Electrician, Laborer)
- LibSQL for storage
- 197 tests (169 passing, 28 server-dependent skipped)

**What it lacked:**
- No three-layer pipeline — everything ran through Mastra's agent abstraction
- No structured audit trail (`auditTrail` did not exist)
- No trust scoring or human-review routing
- No prompt versioning (hard-coded system prompt)
- No document ingestion beyond raw text
- No CI pipeline or architectural linting
- No mock mode for offline development

The hybrid deterministic + LLM concept was present in the design (see [ADR-003](docs/adrs/ADR-003-deterministic-validation.md)), but the implementation was a monolithic tool-call graph, not a clean layered pipeline. V1 validated the *idea* but not the *engineering*. The codebase was archived and rewritten from scratch for V2.

### V2 — Reference Implementation (Current)

V2 is a ground-up rewrite as a **self-contained TypeScript/Node.js application**. It fixes every V1 limitation and adds production-grade discipline:

| Capability | V1 | V2 |
|---|---|---|
| Architecture | Mastra monolith | Clean three-layer pipeline with AST-enforced boundaries |
| Testability | Integration-only | 310 tests: unit, integration, calibration, e2e |
| Audit trail | None | Full timestamped `auditTrail` on every decision |
| Trust scoring | None | Four-component trust score with auto/flag/human bands |
| Human review | None | In-memory queue with priority routing |
| Prompt versioning | Hard-coded | Registry with v2 template + org overrides |
| Document ingestion | Text only | PDF + CSV multipart upload |
| DBWD rates | Hard-coded | Configurable in-memory corpus (20 trades) |
| Rate limiting | None | 60 req/min per IP |
| Mock mode | None | Full offline development without OpenAI |
| Coverage | N/A | 83%+ with 80% gate in CI |

V2 works out of the box with **zero external dependencies** beyond Node.js. PostgreSQL, Elasticsearch, and Redis are optional for Phase 02 features.

### V3 — Production Platform (Planned)

V3 will restructure into a **polyglot architecture** separating deterministic logic from agent reasoning:

- **Python backend** (FastAPI): deterministic Layer 1, hybrid retrieval (BM25 + vector), DBWD ETL pipelines from SAM.gov/DOL, persistent audit store
- **TypeScript agent** (Mastra.ai): Layer 2 LLM reasoning, prompt versioning via Langfuse, orchestration
- **React 19 frontend**: multi-employee accordion, cost tracking dashboard, review queue UI
- **Infrastructure**: Docker Compose with PostgreSQL + pgvector + Redis + Elasticsearch
- **Observability**: Phoenix LLM tracing + OpenTelemetry

See [docs/architecture/V3_PLAN.md](./docs/architecture/V3_PLAN.md) for the full technical plan.

---

## Architecture

```
Input (payroll text / PDF / CSV)
       │
       ▼
┌─────────────────────────────────┐
│  Layer 1: Deterministic         │  Extraction + DBWD rate lookup + rule checks
│  src/pipeline/layer1-*.ts       │  No LLM. Pure arithmetic and policy rules.
└──────────────┬──────────────────┘
               │ CheckResult[]
               ▼
┌─────────────────────────────────┐
│  Layer 2: LLM Verdict           │  Constrained reasoning over Layer 1 findings
│  src/pipeline/layer2-*.ts       │  FORBIDDEN from recomputing arithmetic.
└──────────────┬──────────────────┘  Must cite Layer 1 check IDs.
               │ LLMVerdict
               ▼
┌─────────────────────────────────┐
│  Layer 3: Trust Score           │  Weighted confidence → routing decision
│  src/pipeline/layer3-*.ts       │  score < 0.60 → human review queue
└──────────────┬──────────────────┘
               │ TrustScoredDecision
               ▼
         Final output + audit trail
```

The architecture is enforced at CI time via AST-based lint (`npm run lint:pipeline`). Bypassing any layer is a build failure.

---

## Quick Start

```bash
git clone https://github.com/FishRaposo/WCP-Compliance-Agent.git
cd WCP-Compliance-Agent
npm install
npm run build

# Start server (mock mode — no API key needed)
OPENAI_API_KEY=mock npm run serve

# Or with a real OpenAI key
OPENAI_API_KEY=sk-... npm run serve
```

Server runs at `http://localhost:3000`. See [`docs/quick-start.md`](./docs/quick-start.md) for full setup.

---

## API Reference

### `POST /api/analyze`

Analyze a payroll submission through the three-layer pipeline.

**Request**
```json
{ "content": "Role: Electrician, Hours: 40, Wage: 51.69, Fringe: 34.63" }
```

**Response** (abbreviated)
```json
{
  "finalStatus": "Approved",
  "deterministic": {
    "role": "Electrician",
    "hours": 40,
    "wage": 51.69,
    "checks": [
      { "id": "wage_check_001", "type": "base_wage", "status": "pass",
        "regulation": "40 U.S.C. § 3142", "message": "Wage meets DBWD rate" }
    ],
    "score": 1.0
  },
  "verdict": {
    "status": "Approved",
    "rationale": "All checks pass. Wage meets prevailing rate.",
    "referencedCheckIds": ["wage_check_001"],
    "citations": ["40 U.S.C. § 3142", "29 CFR 5.5(a)(1)"]
  },
  "trust": {
    "score": 0.92,
    "band": "auto"
  },
  "humanReview": { "required": false },
  "auditTrail": [...],
  "traceId": "abc-123"
}
```

### `POST /api/analyze-pdf`

Upload a PDF payroll document (multipart/form-data, max 64KB).

### `POST /api/analyze-csv`

Upload a CSV bulk payroll file (multipart/form-data, max 64KB).

### `GET /api/decisions`

List persisted decisions (optional PostgreSQL backend; in-memory fallback when unavailable).

### `POST /api/jobs`

Submit an async analysis job. Returns a job ID for polling.

### `GET /api/jobs/:id`

Check async job status and retrieve results.

### `GET /health`

Returns server status, mock mode flag, and OpenAI model config.

**Rate limiting:** All endpoints are rate-limited to 60 requests per minute per IP.

---

## Running Tests

```bash
npm test                  # Full suite: build + 310 tests (excludes e2e/live)
npm run test:unit         # 297 unit + integration tests
npm run test:pipeline     # Pipeline-specific tests (unit + integration)
npm run test:coverage     # Coverage report (≥80% gate)
npm run test:calibration  # 102-example golden set trust calibration
npm run test:retrieval    # Hybrid retriever tests (mock mode)
npm run lint:pipeline     # AST architectural lint
npm run build             # TypeScript + Vite compilation
```

**Mock mode** (no API key required): set `OPENAI_API_KEY=mock` or `OPENAI_API_KEY=test-api-key` — all tests pass without calling OpenAI.

---

## Configuration

Copy `.env.example` to `.env` and configure:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes* | — | Set to `mock` for offline mode |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | Model for Layer 2 reasoning |
| `PORT` | No | `3000` | Server port |
| `AGENT_MAX_STEPS` | No | `3` | Max reasoning steps (validated, not passed to LLM API) |
| `API_TIMEOUT` | No | `30000` | Request timeout (ms) |
| `ALLOWED_ORIGINS` | No | `*` | CORS origins (comma-separated) |
| `LOG_LEVEL` | No | `info` | Pino log level |
| `POSTGRES_URL` | No | — | PostgreSQL for audit persistence / job queue |
| `ELASTICSEARCH_URL` | No | — | Phase 02 BM25 retrieval |
| `ELASTICSEARCH_INDEX` | No | `dbwd_corpus` | ES index name |
| `EMBEDDING_MODEL` | No | `text-embedding-3-small` | OpenAI embedding model |
| `PGVECTOR_DIMENSIONS` | No | `1536` | Vector dimensions |
| `WCP_CONFIG_PATH` | No | `./wcp.config.json` | Custom DBWD corpus config |

*Required for live decisions. Use `mock` or `test-api-key` for development and testing.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22+, TypeScript (ESM) |
| API server | [Hono](https://hono.dev/) |
| LLM | OpenAI via [Vercel AI SDK](https://sdk.vercel.ai/) v4 |
| Schema validation | [Zod](https://zod.dev/) |
| Logging | [Pino](https://getpino.io/) |
| Retrieval (Phase 02) | Elasticsearch (BM25) + pgvector (dense) + cross-encoder reranking |
| Testing | [Vitest](https://vitest.dev/) + AST lint via [ts-morph](https://ts-morph.com/) |
| Frontend | React 19, Vite, TailwindCSS |
| Deployment | Vercel (serverless functions + SPA) |

---

## Project Structure

```
src/pipeline/          # Three-layer decision pipeline (core)
src/entrypoints/       # Public API entry point
src/retrieval/         # Phase 02: hybrid BM25 + vector retrieval
src/ingestion/         # PDF and CSV ingestion
src/prompts/           # Versioned prompt registry
src/services/          # Audit persistence, human review queue, job queue
src/types/             # Typed decision contracts
src/utils/             # Logger, env validation, errors, mock responses
src/frontend/          # React demo UI (Vite + Tailwind) → builds to dist/showcase/
src/app.ts             # Hono app factory (routes, CORS, rate limiting)
tests/unit/            # Unit tests
tests/integration/     # Decision pipeline integration tests
tests/eval/            # 102-example golden set (trust calibration)
tests/e2e/             # Playwright end-to-end tests
api/                   # Vercel serverless functions
docs/                  # Architecture, compliance, ADRs, v3 plan
data/                  # In-memory DBWD corpus, review queue
docs/architecture/V3_PLAN.md  # V3 architecture roadmap
```

---

---

## Documentation

- [`docs/quick-start.md`](./docs/quick-start.md) — Run locally in 5 minutes
- [`docs/architecture/system-overview.md`](./docs/architecture/system-overview.md) — System design
- [`docs/compliance/regulatory-compliance-report.md`](./docs/compliance/regulatory-compliance-report.md) — Davis-Bacon Act implementation
- [`docs/compliance/traceability-matrix.md`](./docs/compliance/traceability-matrix.md) — Regulation-to-code mapping
- [`docs/adrs/`](./docs/adrs/) — Architecture Decision Records
- [`CHANGELOG.md`](./CHANGELOG.md) — Release history
- [`AGENTS.md`](./AGENTS.md) — Developer conventions and architecture constraints

---

## License

[MIT](./LICENSE) © 2026 Vinícius Raposo
