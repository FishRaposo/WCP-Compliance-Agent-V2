# Deterministic Validation

Status Label: Designed / Target

Truth anchors:

- [`../foundation/current-state.md`](../foundation/current-state.md)
- [`../foundation/implemented-vs-target.md`](../foundation/implemented-vs-target.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)

## Current state

Current deterministic checks are intentionally narrow:

- overtime detection,
- underpayment detection against current tool-layer rates,
- malformed input rejection.

These checks are enough to demonstrate the core principle: arithmetic and policy correctness should not be delegated to the model.

## Target validation domains

- arithmetic consistency across daily and weekly totals,
- overtime and fringe benefit correctness,
- signature and required-field presence,
- locality and effective-date consistency,
- impossible or contradictory values,
- project-window and entity consistency.

## Output shape

Deterministic validation should emit structured findings with:

- code,
- severity,
- details,
- related entity or employee,
- optionally the source field or document reference.

## Design rule

If a fact can be validated deterministically, it should be.

The model should consume validation outputs, not rediscover them from scratch.

## Why this matters for the role

This directly maps to production AI infra judgment: move correctness-critical logic into deterministic systems and use the model only where synthesis or ambiguity handling is actually needed.
