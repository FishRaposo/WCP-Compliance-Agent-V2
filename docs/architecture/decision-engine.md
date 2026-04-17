# Decision Engine

Status Label: Designed / Target

Truth anchors:

- [`../foundation/current-state.md`](../foundation/current-state.md)
- [`../foundation/implemented-vs-target.md`](../foundation/implemented-vs-target.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)

## Current implemented behavior

The current decision engine is a bounded orchestration path around:

- deterministic tools,
- a schema-bound agent response,
- typed error handling,
- health metadata.

The main current interface is `generateWcpDecision(...)`.

## Target decision contract

The target system should return a structured decision with:

- `verdict`: `APPROVE | REVISION | REJECT`
- `reasons`: coded and severity-scoped findings
- `citations`: supporting DBWD references
- `confidence`
- `traceId`

## Confidence routing

Target routing rules should include:

- approve only when evidence is complete and high-confidence,
- revise when evidence is incomplete or fixable,
- reject when critical violations are deterministic or strongly supported,
- escalate when evidence conflicts or confidence falls below threshold.

## Design principle

The model is a synthesis layer, not the system of record.

The goal is not just "good answers." The goal is decisions that can be explained, audited, replayed, and defended.
