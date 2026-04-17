# Retrieval and Context

Status Label: Designed / Target

Truth anchors:

- [`../foundation/current-state.md`](../foundation/current-state.md)
- [`../foundation/implemented-vs-target.md`](../foundation/implemented-vs-target.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)

## Current state

The current repo uses hardcoded rates inside the deterministic validation tool. This is deliberately small, but it already expresses the right pattern:

- authoritative facts should be explicit,
- context should be narrow,
- decisioning should operate over validated inputs.

## Target retrieval system

### Corpus

- DBWD documents and derived records
- structured trade and locality mappings
- versioned source references

### Retrieval pipeline

1. Normalize role and locality from the report.
2. Map aliases to canonical trade keys.
3. Filter corpus by locality and effective date.
4. Retrieve candidates through hybrid BM25 + vector search.
5. Rerank with a cross-encoder.
6. Return top evidence with source references and confidence signals.

### Context assembly

The model should receive only:

- normalized report summary,
- deterministic findings,
- top retrieval results with citations,
- any unresolved ambiguities requiring synthesis.

Raw document dumping should be avoided.

## Generalized role alignment

This same pattern maps well to the job's requested stack:

- Redshift-backed business truth,
- Elasticsearch transcript retrieval,
- Redis-cached CRM state,
- metadata filters by account, opportunity, rep, and deal stage.

The core problem is the same: choosing the right evidence for a given decision path.
