# Scenario Catalog

Status Label: Designed / Target

Technical anchors:

- [`../architecture/deterministic-validation.md`](../architecture/deterministic-validation.md)
- [`../architecture/retrieval-and-context.md`](../architecture/retrieval-and-context.md)
- [`../evaluation/adversarial-cases.md`](../evaluation/adversarial-cases.md)

## Current proof scenarios

- valid electrician case
- electrician overtime case
- electrician underpayment case
- valid laborer case
- laborer overtime case
- laborer underpayment case

These prove the current small architecture slice.

## Target showcase scenarios

- missing signature with otherwise valid wages
- arithmetic mismatch across daily vs weekly totals
- ambiguous job title requiring alias resolution
- locality mismatch between report and DBWD reference
- low-confidence retrieval that routes to revision
- conflicting deterministic and model interpretations
- OCR-degraded scanned report
- replayed decision with trace inspection

## Why this matters

A full showcase should not only show happy-path correctness. It should demonstrate the platform's behavior when evidence is incomplete, conflicting, or low confidence.
