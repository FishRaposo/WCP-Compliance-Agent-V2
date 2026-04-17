# Documentation Index

Status Label: Implemented

This is the canonical navigation hub for the expanded WCP Compliance Agent documentation set. Use it based on how much time the reader has and what they need to evaluate.

## Reading paths

### 2-minute recruiter path

Start here if the goal is to understand why this repo matters quickly:

1. [`../README.md`](../README.md)
2. [`showcase/recruiter-walkthrough.md`](./showcase/recruiter-walkthrough.md)
3. [`showcase/founding-ai-infra-fit.md`](./showcase/founding-ai-infra-fit.md)

### 10-minute technical architecture path

Start here if the reader wants to understand the current system, the target system, and the engineering posture:

1. [`foundation/current-state.md`](./foundation/current-state.md)
2. [`foundation/implemented-vs-target.md`](./foundation/implemented-vs-target.md)
3. [`architecture/system-overview.md`](./architecture/system-overview.md)
4. [`foundation/tech-stack-map.md`](./foundation/tech-stack-map.md)

### 20-minute implementation and reference path

Use this path if the reader wants the full platform story:

1. Foundation docs
2. Architecture docs
3. [**Implementation docs**](./implementation/INDEX.md) - how to build the target stack
4. Evaluation docs
5. Showcase docs
6. Roadmap docs

## Documentation structure

### Foundation

- [`foundation/current-state.md`](./foundation/current-state.md)
- [`foundation/implemented-vs-target.md`](./foundation/implemented-vs-target.md)
- [`foundation/glossary.md`](./foundation/glossary.md)
- [`foundation/tech-stack-map.md`](./foundation/tech-stack-map.md)

### Architecture

- [`architecture/system-overview.md`](./architecture/system-overview.md)
- [`architecture/ingestion-and-normalization.md`](./architecture/ingestion-and-normalization.md)
- [`architecture/deterministic-validation.md`](./architecture/deterministic-validation.md)
- [`architecture/retrieval-and-context.md`](./architecture/retrieval-and-context.md)
- [`architecture/decision-engine.md`](./architecture/decision-engine.md)
- [`architecture/data-model.md`](./architecture/data-model.md)
- [`architecture/api-and-integrations.md`](./architecture/api-and-integrations.md)
- [`architecture/observability-and-operations.md`](./architecture/observability-and-operations.md)
- [`architecture/security-and-compliance.md`](./architecture/security-and-compliance.md)

### Implementation (Target Stack)

Comprehensive implementation guides for each technology in the target production stack:

- [`implementation/INDEX.md`](./implementation/INDEX.md) - Start here for implementation overview
- [`implementation/01-warehouse-redshift.md`](./implementation/01-warehouse-redshift.md) - Payroll analytics warehouse
- [`implementation/02-search-elasticsearch.md`](./implementation/02-search-elasticsearch.md) - Policy document search
- [`implementation/03-cache-redis.md`](./implementation/03-cache-redis.md) - Contractor state caching
- [`implementation/04-vector-pgvector.md`](./implementation/04-vector-pgvector.md) - Vector corpus storage
- [`implementation/05-retrieval-hybrid-rerank.md`](./implementation/05-retrieval-hybrid-rerank.md) - Hybrid search + reranking
- [`implementation/06-observability-otel-phoenix.md`](./implementation/06-observability-otel-phoenix.md) - Tracing and inspection
- [`implementation/07-prompt-infrastructure.md`](./implementation/07-prompt-infrastructure.md) - Versioning and A/B testing
- [`implementation/08-cost-tracking.md`](./implementation/08-cost-tracking.md) - Per-submission cost accounting
- [`implementation/09-evaluation-ci.md`](./implementation/09-evaluation-ci.md) - CI-based evaluation framework
- [`implementation/10-entity-data-model.md`](./implementation/10-entity-data-model.md) - Core entity abstractions

### Evaluation

- [`evaluation/evaluation-strategy.md`](./evaluation/evaluation-strategy.md)
- [`evaluation/adversarial-cases.md`](./evaluation/adversarial-cases.md)
- [`evaluation/quality-bar.md`](./evaluation/quality-bar.md)
- [`evaluation/release-gates.md`](./evaluation/release-gates.md)

### Showcase

- [`showcase/showcase-overview.md`](./showcase/showcase-overview.md)
- [`showcase/recruiter-walkthrough.md`](./showcase/recruiter-walkthrough.md)
- [`showcase/scenario-catalog.md`](./showcase/scenario-catalog.md)
- [`showcase/case-study.md`](./showcase/case-study.md)
- [`showcase/founding-ai-infra-fit.md`](./showcase/founding-ai-infra-fit.md)

### Roadmap

- [`roadmap/platform-roadmap.md`](./roadmap/platform-roadmap.md)
- [`roadmap/documentation-roadmap.md`](./roadmap/documentation-roadmap.md)
- [`roadmap/milestones.md`](./roadmap/milestones.md)

## What is implemented vs designed

This documentation system intentionally separates:

- **Implemented**: backed directly by the current repo.
- **Designed / Target**: the system architecture this repo is aiming toward.
- **Planned / Future**: later stages, gates, and extensions.

The truth anchor for the whole system is [`foundation/current-state.md`](./foundation/current-state.md).
