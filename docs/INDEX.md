# Documentation Index

Status Label: Implemented

This is the canonical navigation hub for the expanded WCP Compliance Agent documentation set. Use it based on how much time the reader has and what they need to evaluate.

## Reading paths

### 2-minute recruiter path

Start here if the goal is to understand why this repo matters quickly:

1. [`../README.md`](../README.md)
2. [`showcase/founding-ai-infra-fit.md`](./showcase/founding-ai-infra-fit.md) - Skills mapping to job requirements
3. [`showcase/case-study.md`](./showcase/case-study.md) - Real example with performance data
4. [`FAQ.md`](./FAQ.md) - Quick answers to common questions

### 10-minute technical architecture path

Start here if the reader wants to understand the current system, the target system, and the engineering posture:

1. [`foundation/current-state.md`](./foundation/current-state.md)
2. [`foundation/implemented-vs-target.md`](./foundation/implemented-vs-target.md)
3. [`architecture/system-overview.md`](./architecture/system-overview.md)
4. [`foundation/tech-stack-map.md`](./foundation/tech-stack-map.md)

### 5-minute quick start path

Get it running locally immediately:

1. [`quick-start.md`](./quick-start.md) - Clone, install, test
2. Try the API examples
3. Read the case study for context

### 20-minute implementation and reference path

Use this path if the reader wants the full platform story:

1. Foundation docs
2. Architecture docs
3. [**Implementation docs**](./implementation/INDEX.md) - how to build the target stack
4. Evaluation docs
5. Showcase docs
6. Architecture decisions (ADRs)
7. Roadmap docs

### Decision Architecture Path (for developers)

Understand the three-layer decision pipeline (deterministic → LLM verdict → trust score):

1. [`adrs/ADR-005-decision-architecture.md`](./adrs/ADR-005-decision-architecture.md) - The architectural decision
2. [`architecture/decision-architecture.md`](./architecture/decision-architecture.md) - Full doctrine with examples
3. [`architecture/trust-scoring.md`](./architecture/trust-scoring.md) - Trust formula and calibration
4. [`architecture/human-review-workflow.md`](./architecture/human-review-workflow.md) - Human review queue
5. [`architecture/decision-engine.md`](./architecture/decision-engine.md) - Decision layer overview

### Compliance documentation path

For auditors, regulators, and compliance officers reviewing Davis-Bacon Act enforcement:

1. [`compliance/regulatory-compliance-report.md`](./compliance/regulatory-compliance-report.md) - System compliance overview
2. [`compliance/traceability-matrix.md`](./compliance/traceability-matrix.md) - Regulation-to-code mapping
3. [`compliance/implementation-guide.md`](./compliance/implementation-guide.md) - How regulations become code
4. [`foundation/wcp-and-dbwd-reference.md`](./foundation/wcp-and-dbwd-reference.md) - WCP and DBWD requirements

## Documentation structure

### Foundation

- [`foundation/current-state.md`](./foundation/current-state.md)
- [`foundation/implemented-vs-target.md`](./foundation/implemented-vs-target.md)
- [`foundation/glossary.md`](./foundation/glossary.md)
- [`foundation/tech-stack-map.md`](./foundation/tech-stack-map.md)
- [`foundation/wcp-and-dbwd-reference.md`](./foundation/wcp-and-dbwd-reference.md) - WCP and DBWD compliance reference

### Compliance (Davis-Bacon Act)

Regulatory compliance documentation for auditors and developers:

- [`compliance/regulatory-compliance-report.md`](./compliance/regulatory-compliance-report.md) - Full compliance analysis
- [`compliance/traceability-matrix.md`](./compliance/traceability-matrix.md) - Bidirectional regulation-to-code mapping
- [`compliance/implementation-guide.md`](./compliance/implementation-guide.md) - Technical implementation patterns

### Architecture

- [`architecture/system-overview.md`](./architecture/system-overview.md)
- [`architecture/ingestion-and-normalization.md`](./architecture/ingestion-and-normalization.md)
- [`architecture/deterministic-validation.md`](./architecture/deterministic-validation.md)
- [`architecture/retrieval-and-context.md`](./architecture/retrieval-and-context.md)
- [`architecture/decision-engine.md`](./architecture/decision-engine.md)

### Decision Architecture (Three-Layer Pipeline)

How the system enforces deterministic scaffold → LLM verdict → trust scoring:

- [`adrs/ADR-005-decision-architecture.md`](./adrs/ADR-005-decision-architecture.md) - Architectural decision record
- [`architecture/decision-architecture.md`](./architecture/decision-architecture.md) - Full doctrine and developer guidelines
- [`architecture/trust-scoring.md`](./architecture/trust-scoring.md) - Trust score formula, calibration, thresholds
- [`architecture/human-review-workflow.md`](./architecture/human-review-workflow.md) - Human review queue and workflow
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

### Getting Started

Essential docs for first-time users:

- [`quick-start.md`](./quick-start.md) - 5-minute local setup guide
- [`FAQ.md`](./FAQ.md) - Common questions answered honestly

### Evaluation

Testing strategy and quality assurance:

- [`evaluation/evaluation-strategy.md`](./evaluation/evaluation-strategy.md)
- [`evaluation/adversarial-cases.md`](./evaluation/adversarial-cases.md)
- [`evaluation/quality-bar.md`](./evaluation/quality-bar.md)
- [`evaluation/release-gates.md`](./evaluation/release-gates.md)

### Showcase

Recruiter and hiring manager facing documentation:

- [`showcase/showcase-overview.md`](./showcase/showcase-overview.md) - What this repo is and who it's for
- [`showcase/case-study.md`](./showcase/case-study.md) - Concrete walkthrough with examples
- [`showcase/founding-ai-infra-fit.md`](./showcase/founding-ai-infra-fit.md) - Skills to job requirements mapping
- [`showcase/scenario-catalog.md`](./showcase/scenario-catalog.md) - Test scenarios and edge cases
- [`showcase/demo-walkthrough.md`](./showcase/demo-walkthrough.md) - What the demo experience looks like

### Development (Contributors)

- [`development/README.md`](./development/README.md) - Development guides index
- [`development/contributor-guide.md`](./development/contributor-guide.md) - Workflow and conventions
- [`development/dev-environment.md`](./development/dev-environment.md) - Local setup and debugging
- [`development/how-to-add-check.md`](./development/how-to-add-check.md) - Adding validation checks
- [`development/how-to-add-adr.md`](./development/how-to-add-adr.md) - Documenting decisions

### Getting Started

Essential docs for first-time users:

- [`quick-start.md`](./quick-start.md) - 5-minute local setup guide
- [`FAQ.md`](./FAQ.md) - Common questions answered honestly

### Architecture Decisions (ADRs)

Records of key technical decisions:

- [`adrs/README.md`](./adrs/README.md) - ADR index and how-to guide
- [`adrs/ADR-005-decision-architecture.md`](./adrs/ADR-005-decision-architecture.md) - **Three-layer decision pipeline** ⭐ Current
- [`adrs/ADR-001-mastra-over-langchain.md`](./adrs/ADR-001-mastra-over-langchain.md) - Agent framework selection
- [`adrs/ADR-002-hybrid-retrieval.md`](./adrs/ADR-002-hybrid-retrieval.md) - Search architecture
- [`adrs/ADR-003-deterministic-validation.md`](./adrs/ADR-003-deterministic-validation.md) - Validation strategy

### Roadmap

Strategic planning, phases, and milestones:

- [`roadmap/README.md`](./roadmap/README.md) - Roadmap index with next actions
- [`roadmap/executive-summary.md`](./roadmap/executive-summary.md) - Timeline and strategic goals
- [`roadmap/platform-roadmap.md`](./roadmap/platform-roadmap.md) - Capability roadmap
- [`roadmap/milestones.md`](./roadmap/milestones.md) - Detailed 90-day milestones

### Product Development Phases

Comprehensive 6-9 month phased roadmap:

- [`roadmap/phase-01-scaffolding.md`](./roadmap/phase-01-scaffolding.md) - Technical setup (Weeks 1-4) ✅ Complete
- [`roadmap/phase-02-mvp.md`](./roadmap/phase-02-mvp.md) - **Core functionality + Three-layer validation** (Weeks 5-12) 🔄 Active
- [`roadmap/phase-03-showcase.md`](./roadmap/phase-03-showcase.md) - Public demo with compliance showcase (Weeks 13-18)
- [`roadmap/phase-05-post-launch.md`](./roadmap/phase-05-post-launch.md) - Ongoing iteration

## What is implemented vs designed

This documentation system intentionally separates:

- **Implemented**: backed directly by the current repo.
- **Designed / Target**: the system architecture this repo is aiming toward.
- **Planned / Future**: later stages, gates, and extensions.

The truth anchor for the whole system is [`foundation/current-state.md`](./foundation/current-state.md).
