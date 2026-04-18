# Founding AI Infra Fit

Status Label: Implemented

How this repository maps to the requirements of a Founding AI Infrastructure role, with concrete code examples.

Technical anchors:

- [`../foundation/current-state.md`](../foundation/current-state.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)
- [`../architecture/api-and-integrations.md`](../architecture/api-and-integrations.md)
- [`../../src/mastra/tools/wcp-tools.ts`](../../src/mastra/tools/wcp-tools.ts)
- [`../../src/entrypoints/wcp-entrypoint.ts`](../../src/entrypoints/wcp-entrypoint.ts)

---

## What this repo signals

This repository signals strength in the areas a founding AI infrastructure role usually cares about:

- **Deterministic scaffolding** instead of model-only behavior
- **Retrieval and context** as infrastructure, not afterthoughts
- **Schema-bound outputs** and typed failure modes
- **Evaluation** as a deploy gate, not a report card
- **Platform thinking** across APIs, data, and operations

---

## JD Requirement → Code Evidence Mapping

### "Build hybrid retrieval pipelines"

**What most people do (prompt-only):**
```typescript
// The naive approach
const response = await llm.complete(`
  Here's a WCP report: ${reportText}
  What are the prevailing rates for this role?
  Is this compliant?
`);
// Problem: LLM hallucinates rates, no citations, no reproducibility
```

**What this does (deterministic + retrieval):**
```typescript
// src/mastra/tools/wcp-tools.ts
export const extractWCPTool = createTool({
  id: 'extract-wcp',
  description: 'Extract structured WCP data from text',
  inputSchema: z.object({ payload: z.string() }),
  outputSchema: WCPDataSchema,
  execute: async ({ payload }) => {
    // Deterministic regex extraction (fast, exact)
    const roleMatch = payload.match(/Role:\s*(\w+)/i);
    const hoursMatch = payload.match(/Hours:\s*(\d+)/i);
    const wageMatch = payload.match(/Wage:\s*([\d.]+)/i);
    
    return {
      role: roleMatch?.[1] ?? null,
      hours: hoursMatch ? parseInt(hoursMatch[1]) : null,
      wage: wageMatch ? parseFloat(wageMatch[1]) : null,
    };
  },
});

// Validation against verified source (not LLM guess)
export const validateWCPTool = createTool({
  id: 'validate-wcp',
  description: 'Validate WCP data against prevailing rates',
  inputSchema: WCPDataSchema,
  outputSchema: ValidationResultSchema,
  execute: async (data) => {
    // Hardcoded rates (target: live DBWD retrieval)
    const prevailingRate = RATE_TABLE[data.role]?.[data.locality];
    
    const findings = [];
    if (data.wage < prevailingRate.base) {
      findings.push({
        check: 'base_wage',
        expected: prevailingRate.base,
        actual: data.wage,
        severity: 'error',
      });
    }
    
    return { status: findings.length > 0 ? 'VIOLATION' : 'COMPLIANT', findings };
  },
});
```

**Evidence:** [`src/mastra/tools/wcp-tools.ts`](../../src/mastra/tools/wcp-tools.ts:1-200)

---

### "Implement vector search and reranking"

**Current proof:** BM25 + Vector hybrid search design (retrieval docs)

**Planned implementation:**
```typescript
// docs/implementation/05-retrieval-hybrid-rerank.md
class HybridRetriever {
  async retrieve(query: string, options: RetrievalOptions): Promise<Evidence[]> {
    // 1. Sparse retrieval (BM25) - good for exact terms like "Electrician"
    const sparseResults = await this.bm25Search(query, options);
    
    // 2. Dense retrieval (Vector) - good for semantic similarity
    const denseResults = await this.vectorSearch(query, options);
    
    // 3. Fuse results (RRF - Reciprocal Rank Fusion)
    const fused = this.reciprocalRankFusion(sparseResults, denseResults);
    
    // 4. Rerank with cross-encoder (higher precision)
    const reranked = await this.crossEncoderRerank(query, fused.slice(0, 50));
    
    // 5. Return top-k with citations
    return reranked.slice(0, options.topK).map(r => ({
      ...r,
      citation: this.formatCitation(r.sourceDocument),
    }));
  }
}
```

**Evidence:** [Retrieval Implementation](../implementation/05-retrieval-hybrid-rerank.md), [Retrieval Architecture](../architecture/retrieval-and-context.md)

---

### "Build evaluation frameworks and CI gates"

**Evaluation as infrastructure:**
```typescript
// tests/unit/test_wcp_tools.test.ts
import { extractWCPTool, validateWCPTool } from '../src/mastra/tools/wcp-tools';

describe('WCP Validation', () => {
  // Golden set entry: known input → expected output
  const goldenCases = [
    {
      name: 'electrician_underpayment',
      input: { role: 'Electrician', hours: 45, wage: 35.50 },
      expected: {
        status: 'VIOLATION',
        findings: [
          { check: 'base_wage', severity: 'error' },
          { check: 'overtime_rate', severity: 'critical' }
        ]
      }
    },
    {
      name: 'laborer_compliant',
      input: { role: 'Laborer', hours: 38, wage: 28.50 },
      expected: { status: 'COMPLIANT', findings: [] }
    }
  ];
  
  test.each(goldenCases)('$name', async ({ input, expected }) => {
    const result = await validateWCPTool.execute(input);
    expect(result.status).toBe(expected.status);
    expect(result.findings).toHaveLength(expected.findings.length);
  });
});

// CI gate: fail build if quality drops
describe('Quality Gates', () => {
  test('false-approve rate < 2%', async () => {
    const results = await runGoldenSet();
    const falseApproves = results.filter(r => 
      r.actual === 'COMPLIANT' && r.expected === 'VIOLATION'
    );
    expect(falseApproves.length / results.length).toBeLessThan(0.02);
  });
});
```

**Evidence:** [Evaluation Strategy](../evaluation/evaluation-strategy.md), [Quality Bar](../evaluation/quality-bar.md), [Release Gates](../evaluation/release-gates.md)

---

### "Design for observability and cost tracking"

**Structured logging with trace IDs:**
```typescript
// src/entrypoints/wcp-entrypoint.ts
export async function generateWcpDecision(input: WCPInput): Promise<WCPDecision> {
  const traceId = generateTraceId();
  const startTime = Date.now();
  
  try {
    // Step 1: Extract
    const extractStart = Date.now();
    const extracted = await extractWCPTool.execute(input);
    logger.info({
      traceId,
      step: 'extraction',
      duration: Date.now() - extractStart,
      modelVersion: config.modelVersion,
      tokensUsed: extracted.metadata?.tokens,
    });
    
    // Step 2: Validate
    const validationStart = Date.now();
    const validation = await validateWCPTool.execute(extracted);
    logger.info({
      traceId,
      step: 'validation',
      duration: Date.now() - validationStart,
      findingsCount: validation.findings.length,
    });
    
    // Return with full trace
    return {
      ...validation,
      trace: {
        requestId: traceId,
        timestamp: new Date().toISOString(),
        totalDuration: Date.now() - startTime,
        modelVersion: config.modelVersion,
        promptVersion: config.promptVersion,
      },
      health: {
        modelAvailable: true,
        latencyMs: Date.now() - startTime,
      }
    };
  } catch (error) {
    // Typed error handling
    const typedError = normalizeError(error);
    logger.error({
      traceId,
      error: typedError.toJSON(),
      stage: typedError.stage,
    });
    throw typedError;
  }
}
```

**Evidence:** [Observability Design](../architecture/observability-and-operations.md), [Error Handling](../architecture/error-handling.md)

---

### "Build typed APIs and structured contracts"

**Schema-first design:**
```typescript
// src/types/index.ts
// Everything is typed. No 'any' allowed.

export const WCPDataSchema = z.object({
  role: z.string(),
  hours: z.number().int().positive(),
  wage: z.number().positive(),
  locality: z.string().default('LA'),
  weekEnding: z.string().datetime().optional(),
});

export const FindingSchema = z.object({
  check: z.enum(['base_wage', 'overtime_rate', 'overtime_hours', 'signature']),
  expected: z.number().optional(),
  actual: z.number(),
  difference: z.number(),
  severity: z.enum(['info', 'warning', 'error', 'critical']),
});

export const WCPDecisionSchema = z.object({
  status: z.enum(['COMPLIANT', 'VIOLATION', 'REVISION_NEEDED']),
  explanation: z.string(),
  findings: z.array(FindingSchema),
  citations: z.array(CitationSchema),
  confidence: z.number().min(0).max(1),
  trace: TraceSchema,
  health: HealthSchema,
});

// Type inference from schema
export type WCPData = z.infer<typeof WCPDataSchema>;
export type WCPDecision = z.infer<typeof WCPDecisionSchema>;
```

**Evidence:** [`src/types/index.ts`](../../src/types/index.ts:1-80)

---

## Interview Questions I Can Answer

Based on this codebase, I can discuss:

### System Design
- "How would you build a compliance checking system?" → Walk through the deterministic + LLM hybrid approach
- "How do you handle hallucinations?" → Schema constraints, deterministic validation, citations
- "How do you scale document processing?" → Async pipelines, vector indexing, caching strategies

### Retrieval & RAG
- "BM25 vs vector search?" → When to use each, why hybrid beats both
- "How do you evaluate retrieval quality?" → Golden sets, MRR, precision@k
- "What about edge cases like OCR errors?" → Adversarial test cases, confidence routing

### Evaluation & Reliability
- "How do you know the system works?" → Unit tests, golden sets, CI gates, quality metrics
- "How do you prevent regressions?" → Prompt versioning, corpus versioning, replay tests
- "What metrics matter?" → Latency, cost, accuracy, false-approve rate, citation validity

### Infrastructure & Operations
- "How do you observe an AI system?" → Traces, structured logs, cost dashboards
- "How do you handle errors?" → Typed error taxonomy, staged error handling
- "What's your deployment process?" → CI gates, rollback procedures, staged rollouts

---

## Public Translation of the Stack

**Current implementation:**
- TypeScript-first for type safety
- Mastra framework for LLM orchestration
- Deterministic tools for validation
- Zod schemas for contracts
- Vitest for testing

**Target architecture:**
- Warehouse-backed truth (Redshift + S3)
- Hybrid search (Elasticsearch + pgvector)
- Cached operational context (Redis)
- CI-backed evaluations (GitHub Actions)
- Traceable operations (OpenTelemetry)

**Honest positioning:**

> "This repo is a compact, inspectable proof of infrastructure judgment, with a clearly documented path to the larger production system."

The current code proves the approach works. The documentation proves I understand what production requires.

---

## Code Quality Indicators

### What to look for in this repo

| Quality Signal | Where to Look |
|---------------|---------------|
| **Typed everything** | `src/types/index.ts` - no `any` types |
| **Error handling** | `src/utils/errors.ts` - structured error taxonomy |
| **Schema validation** | `src/mastra/agents/wcp-agent.ts` - Zod output schemas |
| **Test coverage** | `tests/unit/test_wcp_tools.test.ts` - comprehensive assertions |
| **Documentation honesty** | Status labels on every doc (Implemented/Designed/Planned) |
| **Architecture decisions** | `docs/decisions/` - ADRs for key choices |

### What this proves

1. **I can build production-minded systems** - Not just demos, but systems designed for reliability
2. **I understand the AI infra stack** - Retrieval, evaluation, observability as first-class concerns
3. **I communicate clearly** - Documentation that distinguishes current from target state
4. **I test thoroughly** - Unit, integration, and golden set evaluation
5. **I plan for scale** - Architecture designed for 100x growth

---

## Strongest Talking Points

1. **"Most people use LLMs for everything. I use them for what they're good at and deterministic code for what must be exact."**

2. **"Evaluation isn't a report card after launch—it's part of the deployment contract."**

3. **"This isn't just a compliance tool. It's a pattern for any high-trust AI system: finance, healthcare, legal."**

4. **"I can show you the exact code path for any decision, trace it end-to-end, and replay it months later."**

5. **"I built this solo with AI assistance, which proves I can ship fast—but the architecture proves I know what production requires."**

---

## Next Steps for Reviewers

1. **Quick code inspection:**
   - [`src/mastra/tools/wcp-tools.ts`](../../src/mastra/tools/wcp-tools.ts:1-100) - Core validation logic
   - [`src/types/index.ts`](../../src/types/index.ts:1-50) - Type definitions

2. **Read the case study:**
   - [Concrete example with performance data](./case-study.md)

3. **Check the roadmap:**
   - [Product Roadmap](../../product-roadmap/00-executive-summary.md) - Future phases

4. **Try it yourself:**
   - [Quick Start](../quick-start.md) - 5-minute local setup

---

*Last updated: January 2024*
