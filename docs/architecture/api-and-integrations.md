# API and Integrations

Status Label: Designed / Target

Truth anchors:

- [`../foundation/current-state.md`](../foundation/current-state.md)
- [`../foundation/implemented-vs-target.md`](../foundation/implemented-vs-target.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)

## Current API surface

Implemented now:

- `POST /analyze`
- `POST /api/analyze`
- `GET /health`
- `GET /api/health`

The current API proves:

- typed request handling,
- bounded decision orchestration,
- consistent response serialization,
- local service viability.

## Target API surface

Target public endpoints:

- `POST /v1/wcp/submit`
- `GET /v1/wcp/:reportId/status`
- `GET /v1/wcp/:reportId/decision`
- `GET /v1/wcp/:reportId/trace`
- `POST /v1/admin/dbwd/upload`
- `POST /v1/admin/trade-map`

## Integration targets aligned to the role

- **Redshift or equivalent**
  - analytical joins and derived context
- **Elasticsearch**
  - transcript and keyword retrieval
- **Redis-cached CRM state**
  - stable, low-latency access to entity-linked context
- **Postgres / pgvector**
  - normalized reports, retrieval corpus, embeddings, decisions, traces

## Why integrations matter

The role described in `job.md` is not about calling an LLM in isolation. It is about building the connective tissue between operational data systems, retrieval infrastructure, evaluation layers, and model-driven features.
