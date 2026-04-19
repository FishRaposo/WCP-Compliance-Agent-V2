# Documentation Index

**Find what you need based on how much time you have.**

This is the navigation hub for WCP Compliance Agent — a three-layer AI decision system that proves every compliance call with evidence.

---

## I have 2 minutes (Recruiter / Hiring Manager)

What this is and why it matters:

1. **[../README.md](../README.md)** — The problem and solution
2. **[ROLE_FIT.md](../ROLE_FIT.md)** — Skills mapping for AI infrastructure roles
3. **[../DEMO_SCRIPT.md](../DEMO_SCRIPT.md)** — 5-minute presentation script
4. **[FAQ.md](./FAQ.md)** — Quick answers

---

## I have 5 minutes (Want to run it)

Get it working locally:

1. **[quick-start.md](./quick-start.md)** — Clone, install, test
2. Try the API examples in the quick-start
3. **[showcase/case-study.md](./showcase/case-study.md)** — See real examples

---

## I have 10 minutes (Technical overview)

Understand the system:

1. **[foundation/current-state.md](./foundation/current-state.md)** — What's actually implemented
2. **[foundation/implemented-vs-target.md](./foundation/implemented-vs-target.md)** — Current vs. future architecture
3. **[roadmap/RELEASE_PLAN.md](./roadmap/RELEASE_PLAN.md)** — Unified release plan (all phases, next actions)
4. **[foundation/tech-stack-map.md](./foundation/tech-stack-map.md)** — Technology choices

---

## I want to understand the decision architecture

How the three-layer pipeline works:

| Document | What You'll Learn |
|----------|-------------------|
| [adrs/ADR-005-decision-architecture.md](./adrs/ADR-005-decision-architecture.md) | Why three layers? |
| [architecture/decision-architecture.md](./architecture/decision-architecture.md) | How the layers enforce separation |
| [architecture/trust-scoring.md](./architecture/trust-scoring.md) | How trust scores work |
| [architecture/human-review-workflow.md](./architecture/human-review-workflow.md) | When humans get involved |

**The core idea:** Hard rules first (Layer 1). LLM reviews findings only (Layer 2). Trust score decides if it's sure enough (Layer 3). No black boxes. Every decision has evidence.

---

## I'm a compliance officer / auditor

Regulatory documentation:

1. [compliance/regulatory-compliance-report.md](./compliance/regulatory-compliance-report.md) — System compliance overview
2. [compliance/traceability-matrix.md](./compliance/traceability-matrix.md) — Regulation-to-code mapping
3. [compliance/implementation-guide.md](./compliance/implementation-guide.md) — How regulations become code
4. [foundation/wcp-and-dbwd-reference.md](./foundation/wcp-and-dbwd-reference.md) — Davis-Bacon Act requirements

---

## I want to evaluate the architecture

Testing and quality:

- [evaluation/evaluation-strategy.md](./evaluation/evaluation-strategy.md)
- [evaluation/adversarial-cases.md](./evaluation/adversarial-cases.md)
- [evaluation/quality-bar.md](./evaluation/quality-bar.md)
- [evaluation/release-gates.md](./evaluation/release-gates.md)

---

## I want to understand design decisions

Architecture Decision Records (ADRs):

| ADR | Decision |
|-----|----------|
| [ADR-005-decision-architecture.md](./adrs/ADR-005-decision-architecture.md) | Three-layer pipeline |
| [ADR-001-mastra-over-langchain.md](./adrs/ADR-001-mastra-over-langchain.md) | Agent framework |
| [ADR-002-hybrid-retrieval.md](./adrs/ADR-002-hybrid-retrieval.md) | Search architecture |
| [ADR-003-deterministic-validation.md](./adrs/ADR-003-deterministic-validation.md) | Validation strategy |
| [ADR-004-testing-strategy.md](./adrs/ADR-004-testing-strategy.md) | Testing strategy (Vitest + Playwright) |

---

## Full Documentation Map

### Foundation
- [current-state.md](./foundation/current-state.md) — What's implemented now
- [implemented-vs-target.md](./foundation/implemented-vs-target.md) — Current vs. target
- [glossary.md](./foundation/glossary.md) — Terms defined
- [tech-stack-map.md](./foundation/tech-stack-map.md) — Technology choices
- [wcp-and-dbwd-reference.md](./foundation/wcp-and-dbwd-reference.md) — Compliance reference

### Compliance
- [regulatory-compliance-report.md](./compliance/regulatory-compliance-report.md)
- [traceability-matrix.md](./compliance/traceability-matrix.md)
- [implementation-guide.md](./compliance/implementation-guide.md)

### Architecture
- [system-overview.md](./architecture/system-overview.md)
- [decision-engine.md](./architecture/decision-engine.md)
- [retrieval-and-context.md](./architecture/retrieval-and-context.md)

### Decision Pipeline (Three-Layer)
- [adrs/ADR-005-decision-architecture.md](./adrs/ADR-005-decision-architecture.md)
- [architecture/decision-architecture.md](./architecture/decision-architecture.md)
- [architecture/trust-scoring.md](./architecture/trust-scoring.md)
- [architecture/human-review-workflow.md](./architecture/human-review-workflow.md)

### Roadmap
- [roadmap/RELEASE_PLAN.md](./roadmap/RELEASE_PLAN.md) — **Unified release plan (authoritative)**
- [roadmap/README.md](./roadmap/README.md) — Roadmap directory index

### Phase Sign-Off Documents
- [phase-1-sign-off.md](./phase-1-sign-off.md) — Phase 01 verified completion record

### Showcase (For Hiring)
- [showcase/case-study.md](./showcase/case-study.md)
- [showcase/founding-ai-infra-fit.md](./showcase/founding-ai-infra-fit.md)

---

## Key Principle

**This documentation separates:**

- **Implemented** — Actually in the repo, backed by code
- **Designed** — Architecture spec, not yet built
- **Planned** — Future phases

The truth anchor is [foundation/current-state.md](./foundation/current-state.md).