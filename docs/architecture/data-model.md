# Data Model

Status Label: Designed / Target

Truth anchors:

- [`../foundation/current-state.md`](../foundation/current-state.md)
- [`../foundation/implemented-vs-target.md`](../foundation/implemented-vs-target.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)

## Current repo-backed types

Current core types include:

- `WCPDecision`
- `Finding`
- `WCPData`
- request and response interfaces around the analysis flow

These reflect the proof artifact's intentionally small scope.

## Target report model

Target normalized report model should capture:

- subcontractor
- project ID
- week start and end
- employee entries
- job titles
- locality
- dates worked
- hours by day
- reported base and fringe rates
- total pay
- signatures
- attachment references

## Target decision model

Decision records should capture:

- verdict
- reasons with code and severity
- citations
- confidence
- trace ID
- model version
- prompt/config version
- corpus version

## Persistence concepts

Target persistence entities should include:

- documents
- normalized reports
- DBWD records
- trade alias mappings
- decisions
- audit traces

This gives the platform enough structure for replay, debugging, evaluation, and corpus version tracking.
