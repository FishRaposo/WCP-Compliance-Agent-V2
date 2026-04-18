# Current State

Status Label: Implemented

This document is the source of truth for what the repository actually implements today.

## Repository-backed capabilities

### Runtime flow (Three-Layer Decision Pipeline)

- `generateWcpDecision(...)` orchestrates the compliance decision via three-layer pipeline.
- **Layer 1** (Deterministic): Extracts WCP data, looks up DBWD rates, runs rule checks.
- **Layer 2** (LLM Verdict): Generates reasoning over pre-computed findings.
- **Layer 3** (Trust Score): Computes trust, applies thresholds, routes to human review if needed.
- Returns `TrustScoredDecision` with full audit trail and health metrics.

Primary evidence:

- [`src/entrypoints/wcp-entrypoint.ts`](../../src/entrypoints/wcp-entrypoint.ts)
- [`src/pipeline/orchestrator.ts`](../../src/pipeline/orchestrator.ts)

### Layer 1: Deterministic Scaffold

- `extractWCPDataTool` extracts `role`, `hours`, `wage` from text input.
- `resolveClassification` maps roles to DBWD classifications (exact/alias/semantic).
- `lookupDBWDRate` retrieves prevailing wage rates from hardcoded local data.
- `checkPrevailingWage`, `checkOvertime`, `checkFringeBenefits` run compliance rules.
- Produces `DeterministicReport` with citations for every check.

Primary evidence:

- [`src/pipeline/layer1-deterministic.ts`](../../src/pipeline/layer1-deterministic.ts)
- [`src/mastra/tools/wcp-tools.ts`](../../src/mastra/tools/wcp-tools.ts)

### Layer 2: LLM Verdict

- `wcpAgent` generates structured verdicts over Layer 1 findings.
- Must reference check IDs from DeterministicReport (forbidden from recomputing).
- Output: `LLMVerdict` with `status`, `rationale`, `referencedCheckIds[]`, `citations`.
- Captures reasoning trace for audit.

Primary evidence:

- [`src/pipeline/layer2-llm-verdict.ts`](../../src/pipeline/layer2-llm-verdict.ts)
- [`src/mastra/agents/wcp-agent.ts`](../../src/mastra/agents/wcp-agent.ts)

### Layer 3: Trust Score + Human Review

- `computeTrustScore` calculates weighted trust (0.35 det + 0.25 class + 0.20 llm + 0.20 agree).
- Thresholds: ≥0.85 auto-decide, 0.60-0.84 flag, <0.60 require human.
- `humanReviewQueue` manages low-trust cases for manual review.
- Output: `TrustScoredDecision` with full audit trail.

Primary evidence:

- [`src/pipeline/layer3-trust-score.ts`](../../src/pipeline/layer3-trust-score.ts)
- [`src/services/human-review-queue.ts`](../../src/services/human-review-queue.ts)
- [`src/types/decision-pipeline.ts`](../../src/types/decision-pipeline.ts)

### API surface

Current public endpoints:

- `POST /analyze`
- `POST /api/analyze`
- `GET /health`
- `GET /api/health`

Primary evidence:

- [`src/app.ts`](../../src/app.ts)
- [`src/server.ts`](../../src/server.ts)

### Error handling and mock mode

- Typed error taxonomy exists for validation, config, rate limiting, and external API errors.
- Mock mode exists for deterministic local verification without a live model dependency.

Primary evidence:

- [`src/utils/errors.ts`](../../src/utils/errors.ts)
- [`src/utils/mock-responses.ts`](../../src/utils/mock-responses.ts)

### Tests

Current test coverage:

- **Unit tests**: Pipeline contract validation, trust score computation.
- **Integration tests**: End-to-end three-layer pipeline scenarios.
- **Calibration tests**: Golden set evaluation for trust score accuracy.
- **Lint rules**: AST-based architecture enforcement.

Primary evidence:

- [`tests/unit/pipeline-contracts.test.ts`](../../tests/unit/pipeline-contracts.test.ts)
- [`tests/unit/trust-score.test.ts`](../../tests/unit/trust-score.test.ts)
- [`tests/integration/decision-pipeline.test.ts`](../../tests/integration/decision-pipeline.test.ts)
- [`tests/eval/trust-calibration.test.ts`](../../tests/eval/trust-calibration.test.ts)
- [`scripts/lint-pipeline-discipline.ts`](../../scripts/lint-pipeline-discipline.ts)

## What is not implemented yet

The current repo does **not** implement:

- PDF, CSV, or OCR ingestion,
- normalized employee-level WCP reports,
- DBWD retrieval with vector search or reranking (uses hardcoded rates),
- persistence of decisions or traces (human review queue is in-memory stub),
- submit/status/decision/trace workflow APIs (only `/analyze` endpoint),
- Redshift, Elasticsearch, Redis, or CRM integrations,
- production observability pipelines (basic health checks only).

Those systems are documented as target architecture elsewhere in this documentation set.

## Three-Layer Pipeline Status

| Layer | Status | Key Files |
|-------|--------|-----------|
| Layer 1 (Deterministic) | ✅ Implemented | `layer1-deterministic.ts` |
| Layer 2 (LLM Verdict) | ✅ Implemented | `layer2-llm-verdict.ts` |
| Layer 3 (Trust Score) | ✅ Implemented | `layer3-trust-score.ts` |
| Orchestrator | ✅ Implemented | `orchestrator.ts` |
| Human Review Queue | ✅ Stub | `human-review-queue.ts` |
| CI Enforcement | ✅ Implemented | `lint-pipeline-discipline.ts` |
