# Frequently Asked Questions

Status Label: Implemented

Honest answers to common questions from recruiters, hiring managers, and engineers.

---

## Is this production-ready?

**Not yet.** The current implementation is a proof-of-concept that demonstrates the architecture and engineering judgment, but it is not production-ready.

**What works today:**
- Text-based WCP analysis with deterministic validation
- Schema-bound agent responses
- Basic API endpoints
- Unit and integration tests
- Mock mode for offline testing

**What's needed for production:**
- PDF/CSV ingestion and OCR
- Full DBWD retrieval with hybrid search
- Persistence layer (decisions, traces, corpus)
- Production observability (OpenTelemetry, dashboards)
- CI/CD with evaluation gates
- Security hardening and rate limiting

See [Implemented vs Target](./foundation/implemented-vs-target.md) for the full breakdown.

---

## What can I try right now?

You can:

1. **Run it locally** (5 minutes): Follow the [Quick Start](./quick-start.md)
2. **Try the API**: Send curl requests to analyze WCP data
3. **Run the tests**: `npm test` shows the deterministic validation working
4. **Explore the code**: [`src/mastra/tools/wcp-tools.ts`](../../src/mastra/tools/wcp-tools.ts) shows the validation logic

There is no public demo yet—that's Phase 3 of the roadmap.

---

## How is this different from using ChatGPT?

| ChatGPT Approach | This Approach |
|-----------------|---------------|
| Pure LLM reasoning | Deterministic validation + LLM assistance |
| No citations | Evidence-backed decisions with citations |
| Hallucination risk | Schema-bound outputs, typed error handling |
| No traceability | Full trace IDs for replay and debugging |
| Generic | Purpose-built for WCP compliance |

**The key difference:** This system treats the LLM as one component in a larger deterministic pipeline, not as the sole decision-maker. The deterministic layer handles arithmetic, rate lookups, and validation rules—the things that must be exact. The LLM handles extraction and explanation—the things where nuance helps.

See [Deterministic Validation](./architecture/deterministic-validation.md) for details.

---

## What's the tech stack and why?

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Framework** | Mastra | TypeScript-first, prompt versioning, structured outputs |
| **Validation** | Deterministic TypeScript | Rules must be exact, not probabilistic |
| **Retrieval** | BM25 + Vector + Cross-encoder (planned) | Best of sparse and dense search with reranking |
| **Persistence** | PostgreSQL + pgvector (planned) | Single store for data and vectors |
| **Observability** | OpenTelemetry (planned) | Industry standard, vendor-agnostic |
| **API** | Express.js | Battle-tested, minimal overhead |

See [Tech Stack Map](./foundation/tech-stack-map.md) for the full comparison.

---

## What's the roadmap?

**Phase 1 (Scaffolding):** Technical setup, testing framework, ADRs, vector store prep — Weeks 1-4

**Phase 2 (MVP):** Hybrid retrieval, PDF/CSV ingestion, prompt infrastructure, CI evaluation — Weeks 5-12

**Phase 3 (Showcase):** Public demo, landing page, documentation polish — Weeks 13-18

**Phase 4+ (Optimization):** Performance tuning, feature expansion, integrations

See [Product Roadmap](../product-roadmap/00-executive-summary.md) for the detailed 6-9 month plan.

---

## How does this prove infrastructure judgment?

This repo demonstrates several skills relevant to Founding AI Infrastructure roles:

1. **Hybrid retrieval**: Not just vector search—combines BM25, vector, and cross-encoder reranking
2. **Deterministic scaffolding**: Knows when to use rules vs. models
3. **Evaluation as infrastructure**: Golden sets, regression gates, quality metrics
4. **Observability thinking**: Traces, replay, cost tracking designed in from the start
5. **Typed error handling**: Not just try/catch—structured error taxonomy
6. **Documentation discipline**: Honest current-vs-target documentation

See [Founding AI Infra Fit](./showcase/founding-ai-infra-fit.md) for how this maps to job requirements.

---

## Can I contribute?

Contributions are welcome, though the primary goal is a personal showcase. Best ways to help:

- **Feedback**: Open an issue with suggestions or questions
- **Bug reports**: If something doesn't work as documented
- **Use cases**: Real WCP scenarios to test against

See the [todo list](../../todo.md) for current priorities.

---

## Why WCP compliance as a showcase?

**Regulated domains force good engineering:**

- Decisions must be evidence-backed (no hallucinations)
- Everything must be auditable (traceability required)
- Errors have real consequences (high-stakes accuracy)
- Data is messy (PDFs, handwritten forms, OCR challenges)

If a system works for WCP compliance, the same patterns work for finance, healthcare, contract review, and other high-trust domains.

See [Case Study](./showcase/case-study.md) for why compliance is a strong proving ground.

---

## What are the performance characteristics?

**Current (local development):**
- Latency: ~200-500ms per analysis (mostly API round-trip)
- Throughput: Single-threaded, suitable for demo/testing
- Accuracy: 100% on deterministic rules (by design)
- Cost: ~$0.002 per analysis (OpenAI GPT-4o-mini)

**Target (production):**
- Latency: P95 < 5 seconds for full document processing
- Throughput: 100+ decisions/minute per instance
- Accuracy: 90%+ verdict agreement with human reviewers
- Cost: <$0.10 per document (including retrieval, OCR, storage)

See [Quality Bar](./evaluation/quality-bar.md) for the full production targets.

---

## How do I evaluate the code quality?

**Start here:**

1. [`src/mastra/tools/wcp-tools.ts`](../../src/mastra/tools/wcp-tools.ts) — Deterministic validation logic
2. [`src/entrypoints/wcp-entrypoint.ts`](../../src/entrypoints/wcp-entrypoint.ts) — Orchestration and error handling
3. [`src/types/index.ts`](../../src/types/index.ts) — Type definitions and contracts
4. [`tests/unit/test_wcp_tools.test.ts`](../../tests/unit/test_wcp_tools.test.ts) — Test coverage

**Look for:**
- Typed error handling (not just `any` or `unknown`)
- Schema validation at boundaries
- Clear separation of concerns
- Honest status labeling in documentation

---

## What would production deployment look like?

**Infrastructure:**
- Node.js services on AWS/GCP with auto-scaling
- PostgreSQL with pgvector for document and vector storage
- Redis for caching CRM context and rate limiting
- Elasticsearch for hybrid search
- S3 for document storage

**Pipeline:**
1. Document uploaded → S3
2. OCR/extraction service parses content
3. Deterministic validation runs
4. Hybrid retrieval fetches relevant DBWD sections
5. LLM generates decision with citations
6. Decision persisted with full trace
7. Webhook notification sent

See [API and Integrations](./architecture/api-and-integrations.md) for the full system design.

---

## Where can I learn more?

- [Documentation Index](./INDEX.md) — Navigate all docs
- [Quick Start](./quick-start.md) — Run it locally
- [Case Study](./showcase/case-study.md) — Deep dive into the approach
- [Architecture Overview](./architecture/system-overview.md) — System design
- [Product Roadmap](./roadmap/executive-summary.md) — Future plans

---

*Last updated: April 2026*
