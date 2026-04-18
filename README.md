# WCP Compliance Agent

Status Label: Implemented | **[View Role Fit for AI Infrastructure →](./ROLE_FIT.md)**

A regulated-domain AI infrastructure showcase demonstrating how deterministic scaffolding, trust scoring, and CI-based evaluation create reliable LLM systems. Built as a compliance agent for Davis-Bacon Act payroll validation—applicable to revenue intelligence, healthcare, finance, or any high-stakes AI workflow.

> **For hiring managers:** See [ROLE_FIT.md](./ROLE_FIT.md) for explicit mapping to founding AI infrastructure roles (retrieval layers, RAG systems, evaluation pipelines, cost/observability controls).

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
  - [`docs/adrs/ADR-001-mastra-over-langchain.md`](./docs/adrs/ADR-001-mastra-over-langchain.md) - Framework choice
  - [`docs/adrs/ADR-002-hybrid-retrieval.md`](./docs/adrs/ADR-002-hybrid-retrieval.md) - Search architecture
  - [`docs/adrs/ADR-003-deterministic-validation.md`](./docs/adrs/ADR-003-deterministic-validation.md) - Validation strategy

- Decision Architecture:
  - [`docs/architecture/decision-architecture.md`](./docs/architecture/decision-architecture.md) - Full doctrine and code examples
  - [`docs/architecture/trust-scoring.md`](./docs/architecture/trust-scoring.md) - Trust score formula and calibration
  - [`docs/architecture/human-review-workflow.md`](./docs/architecture/human-review-workflow.md) - Human review queue and workflow
- Implementation (Target Stack):
  - [`docs/implementation/INDEX.md`](./docs/implementation/INDEX.md) - Implementation guides overview
  - [`docs/implementation/01-warehouse-redshift.md`](./docs/implementation/01-warehouse-redshift.md) - Analytics warehouse
  - [`docs/implementation/02-search-elasticsearch.md`](./docs/implementation/02-search-elasticsearch.md) - Document search
  - [`docs/implementation/03-cache-redis.md`](./docs/implementation/03-cache-redis.md) - State caching
  - [`docs/implementation/04-vector-pgvector.md`](./docs/implementation/04-vector-pgvector.md) - Vector storage
  - [`docs/implementation/05-retrieval-hybrid-rerank.md`](./docs/implementation/05-retrieval-hybrid-rerank.md) - Hybrid retrieval
  - [`docs/implementation/06-observability-otel-phoenix.md`](./docs/implementation/06-observability-otel-phoenix.md) - Observability
  - [`docs/implementation/07-prompt-infrastructure.md`](./docs/implementation/07-prompt-infrastructure.md) - Prompt infrastructure
  - [`docs/implementation/08-cost-tracking.md`](./docs/implementation/08-cost-tracking.md) - Cost tracking
  - [`docs/implementation/09-evaluation-ci.md`](./docs/implementation/09-evaluation-ci.md) - CI evaluation
  - [`docs/implementation/10-entity-data-model.md`](./docs/implementation/10-entity-data-model.md) - Entity model
- Evaluation:
  - [`docs/evaluation/evaluation-strategy.md`](./docs/evaluation/evaluation-strategy.md)
  - [`docs/evaluation/quality-bar.md`](./docs/evaluation/quality-bar.md)
  - [`docs/evaluation/release-gates.md`](./docs/evaluation/release-gates.md)
  - [`docs/evaluation/adversarial-cases.md`](./docs/evaluation/adversarial-cases.md)
- Showcase:
  - [`docs/showcase/showcase-overview.md`](./docs/showcase/showcase-overview.md)
  - [`docs/showcase/case-study.md`](./docs/showcase/case-study.md)
  - [`docs/showcase/founding-ai-infra-fit.md`](./docs/showcase/founding-ai-infra-fit.md)
  - [`docs/showcase/scenario-catalog.md`](./docs/showcase/scenario-catalog.md)
  - [`docs/showcase/demo-walkthrough.md`](./docs/showcase/demo-walkthrough.md)
- Development:
  - [`docs/development/README.md`](./docs/development/README.md) - Development guides index
  - [`docs/development/contributor-guide.md`](./docs/development/contributor-guide.md) - Workflow and conventions
  - [`docs/development/dev-environment.md`](./docs/development/dev-environment.md) - Local setup and debugging
  - [`docs/development/how-to-add-check.md`](./docs/development/how-to-add-check.md) - Adding validation checks
  - [`docs/development/how-to-add-adr.md`](./docs/development/how-to-add-adr.md) - Documenting decisions
- Getting Started:
  - [`docs/quick-start.md`](./docs/quick-start.md) - 5-minute setup
  - [`docs/FAQ.md`](./docs/FAQ.md) - Common questions answered
- Architecture Decisions:
  - [`docs/adrs/README.md`](./docs/adrs/README.md) - ADR index
  - [`docs/adrs/ADR-001-mastra-over-langchain.md`](./docs/adrs/ADR-001-mastra-over-langchain.md) - Framework choice
  - [`docs/adrs/ADR-002-hybrid-retrieval.md`](./docs/adrs/ADR-002-hybrid-retrieval.md) - Search architecture
  - [`docs/adrs/ADR-003-deterministic-validation.md`](./docs/adrs/ADR-003-deterministic-validation.md) - Validation strategy
  - [`docs/adrs/ADR-005-decision-architecture.md`](./docs/adrs/ADR-005-decision-architecture.md) - Three-layer pipeline
- Roadmap:
  - [`docs/roadmap/README.md`](./docs/roadmap/README.md) - Roadmap index with next actions
  - [`docs/roadmap/executive-summary.md`](./docs/roadmap/executive-summary.md) - Strategic overview
  - [`docs/roadmap/platform-roadmap.md`](./docs/roadmap/platform-roadmap.md) - Capability roadmap
  - [`docs/roadmap/milestones.md`](./docs/roadmap/milestones.md) - 90-day milestones
  - [`docs/roadmap/phase-01-scaffolding.md`](./docs/roadmap/phase-01-scaffolding.md) - Phase 01
  - [`docs/roadmap/phase-02-mvp.md`](./docs/roadmap/phase-02-mvp.md) - Phase 02
  - [`docs/roadmap/phase-03-showcase.md`](./docs/roadmap/phase-03-showcase.md) - Phase 03
  - [`docs/roadmap/phase-05-post-launch.md`](./docs/roadmap/phase-05-post-launch.md) - Phase 05
- Project Tracking:
  - [`CHANGELOG.md`](./CHANGELOG.md) - Change history
  - [`todo.md`](./todo.md) - Prioritized task list

## Current repo-backed evidence

| Capability | Evidence |
| --- | --- |
| Bounded orchestration entrypoint | [`src/entrypoints/wcp-entrypoint.ts`](./src/entrypoints/wcp-entrypoint.ts) |
| Deterministic extraction and validation | [`src/mastra/tools/wcp-tools.ts`](./src/mastra/tools/wcp-tools.ts) |
| Structured decision contract | [`src/mastra/agents/wcp-agent.ts`](./src/mastra/agents/wcp-agent.ts), [`src/types/index.ts`](./src/types/index.ts) |
| API analysis and health surface | [`src/app.ts`](./src/app.ts), [`src/server.ts`](./src/server.ts) |
| Typed error taxonomy | [`src/utils/errors.ts`](./src/utils/errors.ts) |
| Deterministic local mode | [`src/utils/mock-responses.ts`](./src/utils/mock-responses.ts) |
| Proof tests | [`tests/unit/test_wcp_tools.test.ts`](./tests/unit/test_wcp_tools.test.ts), [`tests/integration/test_wcp_integration.test.ts`](./tests/integration/test_wcp_integration.test.ts) |

## Role-fit angle

This documentation explicitly translates the repo into the language of founding AI infrastructure:

- retrieval and context assembly as infrastructure,
- deterministic vs probabilistic boundaries,
- evaluation as a deployment gate,
- observability and cost tracking as operational concerns,
- data-system grounding as a design requirement.

See [`docs/showcase/founding-ai-infra-fit.md`](./docs/showcase/founding-ai-infra-fit.md) and [`docs/foundation/tech-stack-map.md`](./docs/foundation/tech-stack-map.md).

## Quick demo

```bash
# Setup (one time)
git clone https://github.com/FishRaposo/WCP-Compliance-Agent.git
cd WCP-Compliance-Agent
npm install

# Test the validation
npm test

# Start the API
npm run dev

# In another terminal, try an analysis
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"payload": "Role: Electrician, Hours: 45, Wage: 35.50"}'
```

**Expected response:**
```json
{
  "status": "VIOLATION",
  "explanation": "Wage below prevailing rate for Electrician...",
  "findings": [
    {"check": "base_wage", "expected": 38.50, "actual": 35.50}
  ],
  "confidence": 0.98
}
```

See [`docs/quick-start.md`](./docs/quick-start.md) for full setup instructions.

## Local verification

```bash
npm install
npm run test
```

Then start the API surface if needed:

```bash
npm run build
npm run serve
```
