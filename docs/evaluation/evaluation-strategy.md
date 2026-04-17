# Evaluation Strategy

Status Label: Designed / Target

Truth anchors:

- [`../foundation/current-state.md`](../foundation/current-state.md)
- [`../foundation/implemented-vs-target.md`](../foundation/implemented-vs-target.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)

## Current state

The current repo has proof-oriented tests that validate:

- deterministic extraction behavior,
- deterministic validation behavior,
- orchestration seam correctness.

This is a strong starting point for an infra-focused proof artifact, but it is not yet a full evaluation platform.

## Target evaluation strategy

### Golden set

- at least 100 labeled WCP examples
- expected verdicts
- expected reason codes
- supporting wage references

### Evaluation dimensions

- verdict accuracy
- false-approve rate
- citation validity
- latency
- schema integrity
- retrieval quality

### Evaluation surfaces

- deterministic rule tests
- retrieval evaluation
- decision output evaluation
- adversarial cases
- regression runs on prompt, model, or retrieval changes

## Design principle

Evals are not a report card after launch. They are part of the deployment contract.
