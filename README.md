# WCP Compliance Agent

Status Label: Implemented

WCP Compliance Agent is a recruiter-facing documentation showcase for a trustworthy compliance agent platform. The current repository is intentionally a compact proof artifact, but the documentation now expands it into the full system it is meant to become: a regulated-domain AI infrastructure platform for document ingestion, deterministic validation, retrieval-grounded decisions, audit traces, evaluation gates, and production observability.

## What this repository proves today

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

## Read this repository in three paths

- **2 minutes**: [`docs/showcase/recruiter-walkthrough.md`](./docs/showcase/recruiter-walkthrough.md)
- **10 minutes**: [`docs/INDEX.md`](./docs/INDEX.md) -> system overview -> implemented vs target
- **20 minutes**: architecture + evaluation + tech stack + public role-fit documentation

## Documentation map

- Foundation:
  - [`docs/foundation/current-state.md`](./docs/foundation/current-state.md)
  - [`docs/foundation/implemented-vs-target.md`](./docs/foundation/implemented-vs-target.md)
  - [`docs/foundation/glossary.md`](./docs/foundation/glossary.md)
  - [`docs/foundation/tech-stack-map.md`](./docs/foundation/tech-stack-map.md)
- Architecture:
  - [`docs/architecture/system-overview.md`](./docs/architecture/system-overview.md)
  - [`docs/architecture/retrieval-and-context.md`](./docs/architecture/retrieval-and-context.md)
  - [`docs/architecture/decision-engine.md`](./docs/architecture/decision-engine.md)
  - [`docs/architecture/api-and-integrations.md`](./docs/architecture/api-and-integrations.md)
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
- Showcase:
  - [`docs/showcase/showcase-overview.md`](./docs/showcase/showcase-overview.md)
  - [`docs/showcase/case-study.md`](./docs/showcase/case-study.md)
  - [`docs/showcase/founding-ai-infra-fit.md`](./docs/showcase/founding-ai-infra-fit.md)
- Roadmap:
  - [`docs/roadmap/platform-roadmap.md`](./docs/roadmap/platform-roadmap.md)
  - [`docs/roadmap/milestones.md`](./docs/roadmap/milestones.md)

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
