# WCP Compliance Agent

Status Label: Implemented | **[View Role Fit for AI Infrastructure →](./ROLE_FIT.md)**

> **For hiring managers:** See [ROLE_FIT.md](./ROLE_FIT.md) for explicit mapping to founding AI infrastructure roles.

---

## The Problem

Current AI compliance tools are **black boxes**. You feed in a payroll document. You get back "violation detected." And if a federal auditor asks *"how did you reach this decision?"* — you can't answer.

No traceability. No audit trail. No evidence chain.

That's not compliance. That's gambling with federal contracts.

## The Solution

**WCP Compliance Agent** treats every decision like a court case:

- **Three layers of evidence** — every finding cites specific regulation
- **Traceable by design** — every decision has a replayable audit trail  
- **Human when it matters** — low confidence automatically routes to expert review

This isn't just payroll validation. This is how you build AI systems that *provably* make correct decisions—applicable to revenue intelligence, healthcare, finance, or any domain where errors have consequences.

---

## What this repository proves today

- **Three-layer decision architecture**: deterministic scaffold → LLM verdict → trust score + human review, enforced by typed contracts and CI gates.
- Deterministic scaffolding can constrain LLM behavior in a regulated workflow.
- Structured response contracts can make decisions traceable and integration-ready.
- A small codebase can still show strong infrastructure judgment when boundaries are explicit.
- Evaluation, observability, and retrieval are treated as architecture concerns, not add-ons.

## What the full platform is designed to become

- A document-driven compliance agent for Weekly Certified Payroll review.
- A retrieval-grounded decision system using DBWD corpora, metadata filters, and citations.
- A production AI platform with audit trails, replayable traces, regression gates, and role-aware integrations.
- A reusable reference architecture for other regulated or high-trust LLM systems.

## Why this domain matters

Payroll compliance is a strong proving ground for AI infrastructure because it forces the right engineering instincts:

- arithmetic and policy checks must be deterministic,
- evidence must be attributable,
- failure modes must be explicit,
- context selection matters as much as model quality,
- false approvals are more dangerous than graceful deferrals.

That makes this repository a useful showcase for founding AI infrastructure work far beyond payroll.

## Infrastructure patterns demonstrated

The architecture patterns here transfer directly to revenue intelligence, healthcare, finance, or any domain requiring reliable, auditable AI:

| Pattern | Implementation | Transferable To |
|---------|---------------|-----------------|
| **Three-layer decision** | `src/pipeline/` — deterministic → LLM → trust score | Deal coaching, medical diagnosis, risk assessment |
| **Retrieval grounding** | Hybrid search spec + vector store design | CRM context assembly, knowledge bases |
| **CI-based evaluation** | `npm run lint:pipeline` — AST architectural enforcement | Regression gates for prompt/RAG changes |
| **Entity abstractions** | Typed `CheckResult`, `LLMVerdict`, `TrustScoredDecision` | Rep, Call, Opportunity, Moment models |
| **Cost/observability** | Token tracking, cycle time, health metrics per decision | Production cost controls, Phoenix tracing |

**[See full role fit analysis →](./ROLE_FIT.md)**

## Current vs target at a glance

**Implemented now**

- bounded decision orchestration via `generateWcpDecision(...)`,
- deterministic extraction and validation tools,
- structured decision payloads with findings, trace, and health metadata,
- public analysis and health endpoints,
- proof-oriented unit and integration tests.

**Designed / target**

- PDF, CSV, and OCR ingestion,
- normalized WCP report schema with employee-level evidence,
- DBWD retrieval with hybrid search, reranking, and citations,
- full audit persistence, replay, and confidence routing,
- CI-backed eval gates and production observability.

See [`docs/foundation/implemented-vs-target.md`](./docs/foundation/implemented-vs-target.md) for the detailed split.

## Read this repository in four paths

- **1 minute**: [`ROLE_FIT.md`](./ROLE_FIT.md) — Quick mapping to AI infrastructure roles
- **2 minutes**: [`docs/showcase/founding-ai-infra-fit.md`](./docs/showcase/founding-ai-infra-fit.md) — Skills mapping
- **10 minutes**: [`docs/INDEX.md`](./docs/INDEX.md) -> system overview -> implemented vs target
- **20 minutes**: architecture + evaluation + tech stack + case study + FAQ
- **Quick start**: [`docs/quick-start.md`](./docs/quick-start.md) - Run locally in 5 minutes

## Documentation map

- Foundation:
  - [`docs/foundation/current-state.md`](./docs/foundation/current-state.md)
  - [`docs/foundation/implemented-vs-target.md`](./docs/foundation/implemented-vs-target.md)
  - [`docs/foundation/glossary.md`](./docs/foundation/glossary.md)
  - [`docs/foundation/tech-stack-map.md`](./docs/foundation/tech-stack-map.md)
  - [`docs/foundation/wcp-and-dbwd-reference.md`](./docs/foundation/wcp-and-dbwd-reference.md) - WCP and DBWD compliance reference
- Compliance (Davis-Bacon Act):
  - [`docs/compliance/regulatory-compliance-report.md`](./docs/compliance/regulatory-compliance-report.md) - System compliance overview
  - [`docs/compliance/traceability-matrix.md`](./docs/compliance/traceability-matrix.md) - Regulation-to-code mapping
  - [`docs/compliance/implementation-guide.md`](./docs/compliance/implementation-guide.md) - How regulations become code
- Architecture:
  - [`docs/architecture/system-overview.md`](./docs/architecture/system-overview.md)
  - [`docs/architecture/retrieval-and-context.md`](./docs/architecture/retrieval-and-context.md)
  - [`docs/architecture/decision-engine.md`](./docs/architecture/decision-engine.md)
  - [`docs/architecture/api-and-integrations.md`](./docs/architecture/api-and-integrations.md)
- Architecture Decisions (ADRs):
  - [`docs/adrs/README.md`](./docs/adrs/README.md) - ADR index
  - [`docs/adrs/ADR-005-decision-architecture.md`](./docs/adrs/ADR-005-decision-architecture.md) - Three-layer pipeline

## Getting Started

```bash
# Clone and install
git clone https://github.com/FishRaposo/WCP-Compliance-Agent.git
cd WCP-Compliance-Agent
npm install

# Build (must pass)
npm run build

# Run with your OpenAI API key
export OPENAI_API_KEY=sk-your-key
npm run dev
```

See [`WCP_CORE.md`](./WCP_CORE.md) for complete demo instructions and interview prep.

---

*Built as an architecture showcase for high-stakes AI systems. The patterns demonstrated—deterministic scaffolding, trust scoring, audit trails—transfer to revenue intelligence, healthcare, finance, and any domain requiring provably correct AI decisions.*
