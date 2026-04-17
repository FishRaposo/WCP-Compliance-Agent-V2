# Security and Compliance

Status Label: Designed / Target

Truth anchors:

- [`../foundation/current-state.md`](../foundation/current-state.md)
- [`../foundation/implemented-vs-target.md`](../foundation/implemented-vs-target.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)

## Current state

The current repository demonstrates a regulated-domain posture conceptually, but it does not yet implement full production security controls.

## Target security posture

### Data handling

- minimize PII sent to the model,
- encrypt data at rest and in transit,
- hash or tokenize sensitive identifiers where possible,
- define retention and deletion policies for reports and traces.

### Access control

- tenant-aware storage boundaries,
- role-based access for admin, auditor, and read-only use,
- authenticated submit and read paths.

### Compliance operations

- audit-ready traces,
- explicit evidence references,
- corpus versioning,
- replay support for disputed decisions.

## Why this matters

A compliance agent is only credible if the platform itself behaves like a trustworthy system. Security, retention, access control, and auditability are part of the product, not extra operational polish.
