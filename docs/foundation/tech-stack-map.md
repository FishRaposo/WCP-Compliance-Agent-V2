# Tech Stack Map

Status Label: Designed / Target

This document separates the current implemented stack from the target production-aligned stack requested by the role described in `job.md`.

## Current implemented stack

### Implemented in repo

- **TypeScript**: core language for orchestration and API surface.
- **Mastra**: current agent orchestration framework.
- **OpenAI**: current model provider integration.
- **Hono**: current API surface.
- **Zod**: current schema and response validation layer.
- **LibSQL**: configured storage dependency in the current Mastra setup.
- **Pino / Mastra logging**: present in the current orchestration setup.
- **Vitest**: current test framework.

## Target production stack aligned to the role

### Production-aligned extension

- **Warehouse / analytics layer**
  - Redshift or equivalent analytical warehouse
  - Why it matters: the role expects systems that bridge LLM workflows with SQL-heavy business truth

- **Search and transcript retrieval**
  - Elasticsearch for transcript and keyword retrieval
  - Why it matters: retrieval over conversational and behavioral signals is central to revenue intelligence-style use cases

- **CRM state grounding**
  - Redis-cached CRM state or equivalent fast context cache
  - Why it matters: model context should stay tied to stable source-of-truth IDs

- **Corpus and vector retrieval**
  - Postgres + pgvector or equivalent
  - Why it matters: supports retrieval, citation, and corpus versioning in a more production-ready shape

- **Retrieval strategy**
  - BM25 + vector hybrid search
  - Cross-encoder reranking
  - Metadata filtering by locality/date and, in a generalized system, account/opportunity/rep/deal stage
  - Why it matters: the role is explicitly about retrieval and context assembly quality

- **LLM runtime**
  - Tool-calling orchestration
  - Prompt and configuration versioning
  - Cost tracking
  - Account-level configuration
  - Why it matters: these are required for reliable production AI features, not just a demo loop

- **Evaluation and observability**
  - CI-based eval runs
  - Regression detection
  - OpenTelemetry
  - Phoenix-style inspection and trace analysis
  - Why it matters: the role calls for eval infrastructure and workflow observability

- **Parsing and ingestion**
  - PDF parsing
  - OCR fallback
  - document hashing and versioning
  - Why it matters: a real compliance agent must reason over actual business documents, not only toy text payloads

## How to talk about the stack honestly

- The current repo is strongest as a **TypeScript-first proof of infrastructure judgment**.
- The target architecture is intentionally documented in the language of the role's requested stack.
- The story should be: "the repo proves the architecture instincts now, and the docs show the production-aligned extension path clearly."
