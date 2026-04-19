# Platform Roadmap — Capability Layers

> **Superseded by [RELEASE_PLAN.md](./RELEASE_PLAN.md).**
> The dependency graph and phase status are maintained there.
> This file is kept for its per-capability-layer breakdown.

Status Label: Planned / Future

## Capability roadmap

### 1. Ingestion layer

- PDF and CSV ingestion
- OCR fallback
- raw document hashing and versioning

### 2. Normalization layer

- full WCP report schema
- employee-level evidence extraction
- ambiguity surfacing

### 3. Deterministic validation layer

- arithmetic checks
- signatures and completeness
- overtime and fringe calculations
- contradiction detection

### 4. Retrieval layer

- DBWD corpus ETL
- alias mapping
- hybrid search
- reranking
- citations

### 5. Decision layer

- schema-bound verdicts
- confidence routing
- human-review rules

### 6. Decision Architecture Layer (Three-Layer Pipeline)

The decision architecture enforces a mandatory three-layer pipeline for all compliance decisions:

| Component | Purpose | Status |
|-----------|---------|--------|
| **Layer 1: Deterministic Scaffold** | Extraction, DBWD lookup, rule checks (no AI) | ✅ Implemented |
| **Layer 2: LLM Verdict** | Reasoning over pre-computed findings | ✅ Implemented |
| **Layer 3: Trust + Human Review** | Trust scoring, threshold application, human escalation | ✅ Implemented |
| **Orchestrator** | Composes layers, enforces pipeline flow | ✅ Implemented |
| **Human Review Queue** | Queue management for low-trust decisions | ✅ Stub (Phase 02: Postgres) |
| **CI Enforcement** | Lint rules, test gates | ✅ Implemented |
| **Trust Calibration** | Golden set evaluation | ✅ Implemented |

**Key Files:**
- `src/pipeline/layer1-deterministic.ts` - Deterministic layer
- `src/pipeline/layer2-llm-verdict.ts` - LLM reasoning layer
- `src/pipeline/layer3-trust-score.ts` - Trust computation
- `src/pipeline/orchestrator.ts` - Pipeline composer
- `src/services/human-review-queue.ts` - Queue service

**Trust Score Formula:** `trust = 0.35×deterministic + 0.25×classification + 0.20×llmSelf + 0.20×agreement`

**Thresholds:** ≥0.85 auto-decide | 0.60–0.84 flag | <0.60 require human

**Enforcement:**
- `npm run lint:pipeline` - AST-based architectural linting
- `npm run test:pipeline` - Unit and integration tests
- `npm run test:calibration` - Golden set evaluation

See [Decision Architecture Doctrine](../architecture/decision-architecture.md) for full documentation.

### 7. Persistence and audit layer

- reports
- decisions
- traces
- corpus versions
- replay/debugging

### 7. Evaluation and operations layer

- golden sets
- regression gates
- observability
- cost tracking
- operational dashboards
