# Observability and Operations

Status Label: Designed / Target

Truth anchors:

- [`../foundation/current-state.md`](../foundation/current-state.md)
- [`../foundation/implemented-vs-target.md`](../foundation/implemented-vs-target.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)

## Current state

The current repo exposes a small operational posture through:

- health endpoint data,
- typed errors,
- runtime health metadata on responses,
- logging-related dependencies in the current stack.

## Target observability model

### Tracing

- end-to-end spans for ingest, parse, validate, retrieve, decide, persist
- per-request trace IDs and replayability
- Phoenix-style or equivalent inspection workflow for AI traces

### Metrics

- latency by stage and end-to-end
- verdict distribution
- false-approve risk metrics
- retrieval hit quality
- JSON repair rate
- token and cost usage

### Logs

- structured JSON logs
- model version, prompt version, corpus version
- tenant-safe identifiers
- redaction-aware operational fields

## Operational workflows

- replay a decision from trace ID
- compare results before and after prompt/retrieval changes
- monitor latency and cost drift
- detect corpus or mapping regressions after DBWD updates
