# AGENTS.md

Agent ramp-up notes for the WCP Compliance Agent repository.

## OpenClaw Skills

This repo includes a `.agents/skills/` directory with OpenClaw skills for the project. Any AI agent working on this codebase should reference these skills.

### Active Skills (Immediate Use)

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| **jobs-ive** | Jobs/Ive presentation coaching | Demo prep, copy simplification, keynote structure |
| **mmx-cli** | MiniMax sub-agent | Parallel coding, second opinions, media generation |
| **md-to-pdf** | PDF export | Interview materials, report generation |
| **process-doc** | SOP documentation | Compliance docs, runbooks, process flows |

### Available Skills (Post-Interview/Productizing)

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| **skill-creator** | Build custom skills | Creating WCP-specific automation |
| **pricing-strategy** | SaaS pricing design | Productizing WCP as a service |
| **seo-audit** | SEO optimization | Marketing website optimization |
| **ad-creative** | Ad copy generation | Paid acquisition campaigns |
| **content-research-writer** | Content writing | Technical blog posts, documentation |

### Using Skills

1. Read the skill's SKILL.md in `.agents/skills/<skill-name>/`
2. Follow the protocols and guidelines defined there
3. Use any bundled scripts or references as needed

### MiniMax Quick Reference

```bash
# Chat with M2.7 for coding help
mmx text chat --message "Review this TypeScript" --file src/pipeline/layer2-llm-verdict.ts --output json

# Generate music (unlimited free tier)
mmx music generate --prompt "Upbeat background" --instrumental --out bgm.mp3

# Check quota
mmx quota show
```

---

## Architecture: Three-Layer Decision Pipeline

Every compliance decision flows through exactly three layers. Bypassing any layer is a CI failure.

```
Layer 1 (Deterministic) → Layer 2 (LLM Verdict) → Layer 3 (Trust Score)
```

- **Layer 1** (`src/pipeline/layer1-deterministic.ts`): Extraction (11 fields), DBWD rate lookup via hybrid retriever, rule checks. Pure deterministic code, no LLM.
- **Layer 2** (`src/pipeline/layer2-llm-verdict.ts`): LLM reasons over Layer 1 findings. FORBIDDEN from recomputing arithmetic or re-looking up rates. Must cite check IDs.
- **Layer 3** (`src/pipeline/layer3-trust-score.ts`): Computes trust score, flags for human review if score < 0.60.
- **Orchestrator** (`src/pipeline/orchestrator.ts`): The ONLY valid path through all three layers. Called by `src/entrypoints/wcp-entrypoint.ts`.

The pipeline discipline lint (`npm run lint:pipeline`) uses ts-morph AST analysis to enforce:
1. `Agent.generate()` can only be called in `src/pipeline/layer2-llm-verdict.ts` (and legacy `src/mastra/agents/wcp-agent.ts`)
2. `generateWcpDecision` must return `TrustScoredDecision`
3. Orchestrator must use `executeDecisionPipeline`
4. Layer 2 must call `validateReferencedCheckIds`

## Commands

```bash
npm install              # Install dependencies
npm run build            # Clean + tsc compile
npm run dev              # Start with mastra dev
npm run serve            # Start built server (dist/server.js)

npm test                 # Build first, then vitest run (slow: includes build)
npm run test:unit        # Unit tests only (vitest run tests/unit)
npm run test:integration # Integration tests only
npm run test:pipeline    # Pipeline-specific tests (unit + integration for pipeline)
npm run test:calibration # Trust calibration golden set — 100 examples (verbose output)
npm run test:coverage    # Coverage report
npm run test:retrieval   # Phase 02: retrieval module tests (no infra required)
npm run test:ingestion   # Phase 02: PDF/CSV ingestion tests

npm run lint:pipeline    # AST-based architectural lint (runs in CI)
npm run seed:corpus      # Seed ES + pgvector with DBWD corpus + prompts
```

**Key quirk**: `npm test` runs `npm run build` before vitest. If you only changed tests (not src), you can run `vitest run` directly to skip the build.

**Single test file**: `npx vitest run tests/unit/trust-score.test.ts`

**Single test by name**: `npx vitest run -t "test name pattern"`

## Environment

- `OPENAI_API_KEY` is required. Set to `"mock"`, `"mock-key"`, `"test-api-key"`, or empty for offline development/testing (triggers mock mode via `isMockMode()`).
- Optional: `OPENAI_MODEL` (default: `gpt-4o-mini`), `AGENT_MAX_STEPS` (default: `3`).
- Phase 02: `ELASTICSEARCH_URL` (default: `http://localhost:9200`), `ELASTICSEARCH_INDEX` (default: `dbwd_corpus`), `POSTGRES_URL`, `EMBEDDING_MODEL` (default: `text-embedding-3-small`), `PGVECTOR_DIMENSIONS` (default: `1536`).
- Mock mode is detected via `isMockMode()` in `src/utils/mock-responses.ts` — no separate MOCK_MODE env var.
- `src/utils/env-validator.ts` loads `.env` via dotenv and fails fast if `OPENAI_API_KEY` is missing.
- `tests/setup.ts` sets `OPENAI_API_KEY=test-api-key` and `NODE_ENV=test` for all tests.
- All Phase 02 infrastructure is optional: retrieval/ingestion modules fall back gracefully when ES/DB are unavailable.

## Key Directories

| Path | Purpose |
|------|---------||
| `src/pipeline/` | Three-layer decision pipeline (layer1, layer2, layer3, orchestrator) |
| `src/entrypoints/` | `wcp-entrypoint.ts` — public entry point calling the orchestrator |
| `src/retrieval/` | **Phase 02**: Hybrid retrieval pipeline (BM25, vector, RRF, cross-encoder, orchestrator) |
| `src/ingestion/` | **Phase 02**: PDF/CSV ingestion parsers + routing |
| `src/prompts/` | **Phase 02**: Prompt registry (PostgreSQL-backed, versioned) + v1/v2 prompt templates |
| `src/services/` | `db-client.ts` (PostgreSQL pool), `human-review-queue.ts` |
| `src/mastra/` | Mastra agent definitions and tools (legacy, being superseded by pipeline) |
| `src/types/` | Typed contracts: `TrustScoredDecision`, `LLMVerdict`, `DeterministicReport` |
| `src/utils/` | Error taxonomy, mock responses, env validation |
| `src/config/` | Agent, app, and DB configuration |
| `data/` | `dbwd-corpus.json` — 20-trade DBWD synthetic corpus fixture |
| `tests/unit/` | Unit tests for pipeline contracts, trust scoring, retrieval, ingestion, prompts |
| `tests/integration/` | Integration tests for decision pipeline |
| `tests/eval/` | `golden-set.ts` (100 labeled examples) + `trust-calibration.test.ts` |
| `tests/data/` | Test fixtures (`wcp-examples.ts`) |
| `scripts/` | `lint-pipeline-discipline.ts` (AST lint), `seed-corpus.ts` (ES + pgvector seeder) |
| `docs/` | Extensive documentation (architecture, ADRs, compliance, evaluation, roadmap) |

## Testing Quirks

- Tests require `OPENAI_API_KEY` to be set (tests/setup.ts handles this).
- Layer 2 tests use mock mode automatically when key is `"test-api-key"` or `"mock"`.
- Pipeline tests (`npm run test:pipeline`) are the critical subset that must always pass before merge.
- Trust calibration tests (`tests/eval/trust-calibration.test.ts`) run against a golden set and may need real API keys in CI (set `OPENAI_API_KEY` to a real key, not a mock value).

## CI (GitHub Actions)

Workflow: `.github/workflows/pipeline-discipline.yml`

Sequential stages on push/PR to main/develop:
1. **Build** — `npm run build` (TypeScript compilation)
2. **Pipeline lint** — `npm run lint:pipeline` (AST architectural checks) — parallel with unit/retrieval/ingestion tests
3. **Unit tests** — `npm run test:unit` (246 tests, mock mode, no infra)
4. **Retrieval tests** — `npm run test:retrieval` (hybrid-retriever, RRF, BM25 in mock mode)
5. **Ingestion tests** — `npm run test:ingestion` (CSV parser, PDF ingestion)
6. **Pipeline tests** — `npm run test:pipeline` (101 tests — must pass before coverage/calibration)
7. **Coverage** — `npm run test:coverage` (≥80% gate)
8. **Trust calibration** — `npm run test:calibration` (100-example golden set, needs real `OPENAI_API_KEY`)

## Conventions

- ES modules (`"type": "module"` in package.json). Use `.js` extensions in imports.
- Strict TypeScript (`"strict": true`). No `any` without justification.
- Path alias `@` maps to `./src` in vitest config.
- Commit messages: `<type>: <subject>` (feat, fix, docs, test, refactor, ci).
- Branches: `feature/*`, `fix/*`, `docs/*` — see `.github/CONTRIBUTING.md` for full checklist.
- `require.main === module` in `scripts/lint-pipeline-discipline.ts` will not work with ESM — this is a known issue, the script works via `npx tsx` invocation.
- **Phase 02**: DBWD rates are no longer hardcoded in Layer 1. Layer 1 delegates lookups to `src/retrieval/hybrid-retriever.ts` (BM25 + pgvector + RRF + cross-encoder). Falls back to 20-trade in-memory corpus when ES/DB unavailable.
- **Phase 02**: `ExtractedWCP` expanded to 11 fields (workerName, socialSecurityLast4, tradeCode, localityCode, hoursByDay, grossPay — per WH-347 form).
- **Phase 02**: Prompt registry in `src/prompts/` — v2 is active. Override per org via `orgId`. Seed with `npm run seed:corpus`.
- **Phase 02**: Golden set expanded to 100 labeled examples in `tests/eval/golden-set.ts`.

## Decision Contracts (src/types/)

The central type is `TrustScoredDecision` in `src/types/decision-pipeline.ts`. Key fields:
- `deterministic`: Layer 1 report (extracted data, checks, DBWD rate, score)
- `verdict`: Layer 2 output (status, rationale, referencedCheckIds, reasoning trace)
- `trust`: Layer 3 score (components: deterministic, classification, llmSelf, agreement; band: auto/require_human)
- `humanReview`: required flag, status, queuedAt
- `auditTrail`: array of timestamped events from each layer
- `finalStatus`: "Approved" | "Revise" | "Reject" | "Pending Human Review"

`validateReferencedCheckIds()` ensures every check ID cited by the LLM actually exists in the Layer 1 report.
