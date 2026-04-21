# System Overview

Status Label: Designed / Target

Truth anchors:

- See `README.md` for current implementation status
- See `docs/roadmap/RELEASE_PLAN.md` for project phases
- See `src/` directory for the current codebase

## Architecture thesis

The compliance agent should be built as a layered decision platform:

1. ingest documents and normalize evidence,
2. run deterministic validations over extracted facts,
3. retrieve authoritative wage evidence,
4. synthesize a decision through a bounded, schema-bound model layer,
5. persist the decision and trace for replay, audit, and evaluation.

The core principle is to keep correctness-critical logic deterministic and let the model operate on validated context instead of raw truth discovery.

## Current implemented slice

The current repository implements a narrow but useful slice of that design:

- text payload ingestion,
- deterministic extraction and validation,
- bounded decision orchestration,
- structured response shape,
- proof tests around the deterministic and orchestration seams.

## Target system components

- **Ingestion service**
  - WCP PDF, CSV, OCR fallback, daily report capture
- **Normalization service**
  - converts raw input into typed WCP report objects
- **Deterministic validator**
  - arithmetic, overtime, signatures, completeness, impossible-value checks
- **Retrieval service**
  - DBWD corpus ETL, hybrid search, reranking, citations
- **Decision engine**
  - schema-bound verdict synthesis over deterministic findings and retrieved evidence
- **Persistence layer**
  - reports, corpus versions, decisions, traces, mappings
- **API layer**
  - submit, status, decision, trace, admin endpoints
- **Observability layer**
  - tracing, metrics, logs, replay, evaluation outputs

## End-to-end target flow

1. Client submits payroll package.
2. Documents are parsed and normalized.
3. Deterministic validators emit errors, warnings, and required evidence gaps.
4. Retrieval resolves authoritative wage references and source citations.
5. Decision engine returns structured verdict plus reasons and trace metadata.
6. Decision, inputs, and evidence references are persisted.
7. Evaluation and monitoring systems consume traces and outcomes for regression control.
