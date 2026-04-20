# WCP Compliance Agent

[![CI](https://github.com/FishRaposo/WCP-Compliance-Agent/actions/workflows/pipeline-discipline.yml/badge.svg)](https://github.com/FishRaposo/WCP-Compliance-Agent/actions/workflows/pipeline-discipline.yml)
[![Coverage](https://img.shields.io/badge/coverage-%E2%89%A580%25-brightgreen)](#running-tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org/)

> **Three-layer AI decision pipeline for regulated-domain compliance.**  
> Every finding cites a regulation. Every decision has a replayable audit trail.

**[→ Live Demo](https://wcp-compliance-agent.vercel.app)** · **[→ Quick Start](./docs/quick-start.md)** · **[→ Architecture](./docs/architecture/system-overview.md)**

---

## What This Is

WCP Compliance Agent validates Weekly Certified Payroll (WCP) submissions against Davis-Bacon Act prevailing wage requirements. It's built as a reference implementation of a **trustworthy AI decision system**: one where every output is explainable, traceable, and defensible.

The core pattern — deterministic scaffolding → constrained LLM reasoning → trust-scored routing — transfers directly to any domain where AI errors have consequences: healthcare, finance, legal, revenue intelligence.

---

## Architecture

```
Input (payroll text)
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

### `GET /health`

Returns server status, mock mode flag, and OpenAI model config.

---

## Running Tests

```bash
npm run test:pipeline    # 101 pipeline tests — must always pass
npm run test:unit        # all unit tests (262 tests)
npm run test:coverage    # coverage report (≥80% gate)
npm run lint:pipeline    # AST architectural lint
npm run build            # TypeScript compilation
```

**Mock mode** (no API key required): set `OPENAI_API_KEY=mock` — all tests pass without calling OpenAI.

---

## Configuration

Copy `.env.example` to `.env` and set:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes* | — | Set to `mock` for offline mode |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | Model for Layer 2 |
| `PORT` | No | `3000` | Server port |
| `ELASTICSEARCH_URL` | No | — | Phase 02 hybrid retrieval |
| `POSTGRES_URL` | No | — | Phase 02 vector search |

*Required for live decisions. Use `mock` or `test-api-key` for development.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+, TypeScript (ESM) |
| API server | [Hono](https://hono.dev/) |
| LLM | OpenAI via [Vercel AI SDK](https://sdk.vercel.ai/) |
| Schema validation | [Zod](https://zod.dev/) |
| Agent framework | [Mastra](https://mastra.ai/) (legacy layer) |
| Retrieval (Phase 02) | Elasticsearch (BM25) + pgvector (dense) + cross-encoder reranking |
| Testing | [Vitest](https://vitest.dev/) + AST lint via [ts-morph](https://ts-morph.com/) |
| Deployment | Vercel (serverless functions + SPA) |

---

## Project Structure

```
src/pipeline/          # Three-layer decision pipeline (core)
src/entrypoints/       # Public API entry point
src/retrieval/         # Phase 02: hybrid BM25 + vector retrieval
src/prompts/           # Versioned prompt registry
src/types/             # Typed decision contracts
tests/unit/            # 260+ unit tests
tests/integration/     # Decision pipeline integration tests
tests/eval/            # 100-example golden set (trust calibration)
src/frontend/          # React demo UI (Vite + Tailwind) → builds to dist/showcase/
api/                   # Vercel serverless functions
docs/                  # Architecture, compliance, ADRs
```

---

## Documentation

- [`docs/quick-start.md`](./docs/quick-start.md) — Run locally in 5 minutes
- [`docs/architecture/system-overview.md`](./docs/architecture/system-overview.md) — System design
- [`docs/compliance/regulatory-compliance-report.md`](./docs/compliance/regulatory-compliance-report.md) — Davis-Bacon Act implementation
- [`docs/compliance/traceability-matrix.md`](./docs/compliance/traceability-matrix.md) — Regulation-to-code mapping
- [`docs/adrs/`](./docs/adrs/) — Architecture Decision Records
- [`CHANGELOG.md`](./CHANGELOG.md) — Release history

---

## License

[MIT](./LICENSE) © 2026 Vinícius Raposo
