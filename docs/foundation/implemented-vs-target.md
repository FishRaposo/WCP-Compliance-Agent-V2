# Implemented vs Target

Status Label: Designed / Target

This table keeps the documentation honest by separating what exists now from the fuller compliance agent platform the repo is designed to become.

| Domain | Implemented now | Designed / target |
| --- | --- | --- |
| Input | Raw text payload with `Role`, `Hours`, `Wage` | PDFs, CSVs, OCR, uploads, URLs, raw document persistence |
| Extraction | Regex-based deterministic extraction | Hybrid deterministic plus LLM-assisted normalization into full WCP schema |
| Validation | Overtime and underpayment checks | Arithmetic, signatures, field completeness, locality/date/rate validation, conflict handling |
| Retrieval | Hardcoded rates inside tool layer | DBWD corpus ETL, BM25 + vector retrieval, reranking, metadata filters, citations |
| Decisioning | Schema-bound agent response with `status`, `explanation`, `findings`, `trace`, `health` | `APPROVE | REVISION | REJECT`, reasons with codes and severities, citations, trace IDs, confidence routing |
| API | `/analyze`, `/api/analyze`, `/health` | `/v1/wcp/submit`, `/status`, `/decision`, `/trace`, admin upload and mapping endpoints |
| Persistence | None beyond local runtime behavior | normalized reports, corpus versions, decisions, audit traces, replay/debugging |
| Evals | proof-oriented unit and integration tests | golden sets, adversarial suites, regression thresholds, CI release gates |
| Observability | local health metadata and runtime warnings | OpenTelemetry, trace viewers, Phoenix-style inspection, cost dashboards, alerts |
| Integrations | none | Redshift, Elasticsearch, Redis-cached CRM state, account configuration, warehouse joins |

## How to use this document

- Read this after [`current-state.md`](./current-state.md).
- Use it as the truth boundary when expanding architecture docs.
- Do not describe target capabilities as shipped unless they move into `current-state.md`.
