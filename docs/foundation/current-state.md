# Current State

Status Label: Implemented

This document is the source of truth for what the repository actually implements today.

## Repository-backed capabilities

### Runtime flow

- `generateWcpDecision(...)` orchestrates the current decision path.
- The path is bounded through `maxSteps`.
- The entrypoint adds health metadata and normalizes API failures.

Primary evidence:

- [`src/entrypoints/wcp-entrypoint.ts`](../../src/entrypoints/wcp-entrypoint.ts)

### Deterministic modules

- `extractWCPTool` extracts `role`, `hours`, and `wage` from text input.
- `validateWCPTool` checks the extracted payload against current hardcoded rate logic.
- Findings are deterministic and used as the factual substrate for the agent.

Primary evidence:

- [`src/mastra/tools/wcp-tools.ts`](../../src/mastra/tools/wcp-tools.ts)

### Decision layer

- `wcpAgent` uses a schema-bound structured response.
- Current response shape includes:
  - `status`
  - `explanation`
  - `findings`
  - `trace`
  - `health`

Primary evidence:

- [`src/mastra/agents/wcp-agent.ts`](../../src/mastra/agents/wcp-agent.ts)
- [`src/types/index.ts`](../../src/types/index.ts)

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

Current proof tests:

- unit tests for deterministic extraction and validation,
- one integration test for orchestration seam correctness.

Primary evidence:

- [`tests/unit/test_wcp_tools.test.ts`](../../tests/unit/test_wcp_tools.test.ts)
- [`tests/integration/test_wcp_integration.test.ts`](../../tests/integration/test_wcp_integration.test.ts)

## What is not implemented yet

The current repo does **not** implement:

- PDF, CSV, or OCR ingestion,
- normalized employee-level WCP reports,
- DBWD retrieval with vector search or reranking,
- persistence of decisions or traces,
- submit/status/decision/trace workflow APIs,
- Redshift, Elasticsearch, Redis, or CRM integrations,
- CI-based eval gates or production observability pipelines.

Those systems are documented as target architecture elsewhere in this documentation set.
