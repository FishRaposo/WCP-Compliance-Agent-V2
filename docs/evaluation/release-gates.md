# Release Gates

Status Label: Planned / Future

Truth anchors:

- [`../foundation/current-state.md`](../foundation/current-state.md)
- [`../foundation/implemented-vs-target.md`](../foundation/implemented-vs-target.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)

## Prompt or model change gates

- schema output pass rate remains acceptable,
- no increase in false-approve rate,
- no unacceptable latency or cost regression,
- no new citation validity failures.

## Retrieval change gates

- retrieval quality on golden set holds or improves,
- no degradation on synonym-heavy or ambiguous cases,
- corpus versioning and trace references remain intact.

## Rule change gates

- deterministic tests pass,
- no unintended severity or verdict drift,
- replay samples validate expected behavior.

## Operational gates

- dashboards and trace instrumentation are working,
- cost and latency alerts remain within thresholds,
- rollback path is documented and tested.
