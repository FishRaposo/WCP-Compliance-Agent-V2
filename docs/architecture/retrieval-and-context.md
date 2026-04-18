# Retrieval and Context

Status Label: Designed / Target

The retrieval layer finds relevant DBWD (Davis-Bacon Wage Determination) documents to support compliance decisions. It uses hybrid search (BM25 + vector + reranking) for high precision and broad coverage.

---

## Purpose

Retrieval ensures:
- **Precision**: Find the exact wage determination for the role/locality
- **Coverage**: Handle synonyms and terminology variations
- **Speed**: <500ms end-to-end retrieval time
- **Auditability**: Track which documents informed each decision

---

## Current State

### Implementation

**Status**: Stubbed with hardcoded rates

```typescript
// src/mastra/tools/wcp-tools.ts

const HARD_CODED_RATES: Record<string, DBWDRate> = {
  'Electrician': {
    baseRate: 38.50,
    fringeRate: 8.50,
    locality: 'LOS_ANGELES_CA',
    wdNumber: 'WD-2024-001',
  },
  'Laborer': {
    baseRate: 28.00,
    fringeRate: 7.25,
    locality: 'LOS_ANGELES_CA',
    wdNumber: 'WD-2024-001',
  },
};

export function lookupDBWDRate(role: string): DBWDRate {
  const rate = HARD_CODED_RATES[role];
  if (!rate) {
    throw new RateLookupError(`No rate found for role: ${role}`);
  }
  return rate;
}
```

Current limitations:
- Only 2 roles (Electrician, Laborer)
- No search capability
- No synonyms ("Wireman" ≠ "Electrician")
- No versioning

---

## Target State

### Hybrid Retrieval Architecture

```
Query: "Electrician rate Los Angeles"
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│           Parallel Search                                 │
├─────────────────┬───────────────────┬───────────────────┤
│                 │                   │                   │
▼                 ▼                   ▼                   ▼
BM25           Vector            (Future: Graph)    (Future: Cache)
│                 │                   │                   │
Keyword          Semantic          Relationships      Frequent
matching         similarity        Role→Trade        queries
                 │                                     │
                 │                                     │
└─────────────────┴───────────────────┴───────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│      Reciprocal Rank Fusion (RRF)                       │
│      Combine and deduplicate results                    │
└─────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│      Top 50 Candidates                                  │
└─────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│      Cross-Encoder Reranking                            │
│      (High-precision query-document scoring)           │
└─────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│      Top 10 Results + Citations                         │
│      (WD number, effective date, rate tables)          │
└─────────────────────────────────────────────────────────┘
```

### Component Details

#### 1. BM25 (Elasticsearch)

**Purpose**: Exact keyword matching

```typescript
// Elasticsearch query for role matching
{
  "query": {
    "multi_match": {
      "query": "Electrician Los Angeles",
      "fields": ["job_title^3", "locality^2", "content"],
      "type": "best_fields",
      "fuzziness": "AUTO"
    }
  }
}
```

Strengths:
- Fast (inverted index)
- Exact matches ("Electrician")
- Fuzzy matching for typos

#### 2. Vector Search (pgvector)

**Purpose**: Semantic similarity

```typescript
// PostgreSQL with pgvector
const embedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: "Electrical worker wage LA",
});

const query = `
  SELECT wd_id, job_title, wage_rate, locality,
         embedding <=> $1 as distance
  FROM wage_determination_vectors
  ORDER BY embedding <=> $1
  LIMIT 20;
`;
```

Strengths:
- Synonym handling ("Wireman" ≈ "Electrician")
- Paraphrase matching
- Context understanding

#### 3. Reciprocal Rank Fusion

**Purpose**: Combine BM25 and vector scores

```typescript
function reciprocalRankFusion(
  bm25Results: SearchResult[],
  vectorResults: SearchResult[],
  k: number = 60
): FusedResult[] {
  const scores = new Map<string, number>();
  
  // Score from BM25 (rank-based)
  bm25Results.forEach((result, index) => {
    const rrfScore = 1 / (k + index + 1);
    scores.set(result.id, (scores.get(result.id) || 0) + rrfScore);
  });
  
  // Score from vector (rank-based)
  vectorResults.forEach((result, index) => {
    const rrfScore = 1 / (k + index + 1);
    scores.set(result.id, (scores.get(result.id) || 0) + rrfScore);
  });
  
  // Sort by fused score
  return Array.from(scores.entries())
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
}
```

#### 4. Cross-Encoder Reranking

**Purpose**: High-precision final ranking

```typescript
// Cross-encoder scores query-document pairs
const pairs = topCandidates.map(doc => ({
  query: "Electrician rate Los Angeles",
  document: doc.content.slice(0, 512),
}));

const scores = await crossEncoder.scoreBatch(pairs);

// Re-rank by cross-encoder score
const reranked = candidates
  .map((doc, i) => ({ ...doc, relevanceScore: scores[i] }))
  .sort((a, b) => b.relevanceScore - a.relevanceScore);
```

Tradeoff: Slower (full attention) but much more accurate.

---

## Context Assembly

Retrieval results are assembled into a context object for the decision layer:

```typescript
interface RetrievalContext {
  // Primary wage determination
  primaryWD: {
    wdNumber: string;
    jobTitle: string;
    baseRate: number;
    fringeRate: number;
    locality: string;
    effectiveDate: string;
    confidence: number;  // Retrieval confidence
  };
  
  // Alternative classifications (for disambiguation)
  alternatives: Array<{
    jobTitle: string;
    similarity: number;
    distinguishingFeatures: string[];
  }>;
  
  // Historical context (if available)
  historicalRates?: Array<{
    effectiveDate: string;
    baseRate: number;
    fringeRate: number;
  }>;
  
  // Retrieval metadata (for audit)
  retrievalMetadata: {
    query: string;
    bm25Hits: number;
    vectorHits: number;
    fusionMethod: 'RRF';
    rerankerModel: string;
    topK: number;
    latencyMs: number;
  };
}
```

---

## Integration with Three-Layer Pipeline

Retrieval feeds **Layer 1** (Deterministic Scaffold):

```
User Input: "Role: Wireman, Hours: 45, Wage: 35.50"
    ↓
┌─────────────────────────────────────────┐
│ RETRIEVAL                             │
│ - Query: "Wireman rate Los Angeles"   │
│ - BM25: Limited results (unknown term)│
│ - Vector: "Wireman" ≈ "Electrician"   │
│ - Rerank: Top result = Electrician WD │
└─────────────────────────────────────────┘
    ↓
RetrievalContext { primaryWD: Electrician }
    ↓
┌─────────────────────────────────────────┐
│ LAYER 1: Deterministic Scaffold       │
│ - Use Electrician rate ($38.50)       │
│ - Check: $35.50 < $38.50 → FAIL       │
│ - Report: Underpayment violation      │
└─────────────────────────────────────────┘
```

**Key Point**: Retrieval resolves ambiguous classifications before validation runs.

---

## Data Model

### Vector Storage (pgvector)

```sql
CREATE TABLE wage_determination_vectors (
    id UUID PRIMARY DEFAULT gen_random_uuid(),
    wd_id VARCHAR(50) NOT NULL,
    job_title VARCHAR(200) NOT NULL,
    job_description TEXT,
    locality VARCHAR(100),
    wage_rate DECIMAL(10,2),
    fringe_rate DECIMAL(10,2),
    effective_date DATE,
    -- Vector embedding (1536 dims for text-embedding-3-small)
    embedding VECTOR(1536),
    -- Metadata for filtering
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- HNSW index for fast similarity search
CREATE INDEX ON wage_determination_vectors 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### BM25 Storage (Elasticsearch)

```json
{
  "mappings": {
    "properties": {
      "wd_id": { "type": "keyword" },
      "job_title": { 
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "locality": { "type": "keyword" },
      "wage_rate": { "type": "float" },
      "content": { "type": "text" }
    }
  }
}
```

---

## Performance Characteristics

| Component | Latency | Accuracy | Cost |
|-----------|---------|----------|------|
| BM25 | ~50ms | High (exact) | Low |
| Vector | ~100ms | Medium (semantic) | Low |
| Fusion | ~5ms | N/A | Negligible |
| Reranking | ~200ms | Very High | Medium |
| **Total** | **~375ms** | **Very High** | **Low** |

---

## Evaluation

Retrieval quality is measured with:

### MRR (Mean Reciprocal Rank)

```typescript
// For test queries, is the correct WD in top-3?
const testQueries = [
  { query: 'Electrician Los Angeles', expectedWD: 'WD-2024-001' },
  { query: 'Wireman LA', expectedWD: 'WD-2024-001' },  // Synonym
  { query: 'Laborer Chicago', expectedWD: 'WD-2024-045' },
];

// Target: MRR@1 > 0.7, MRR@3 > 0.9
```

### Recall@K

Percentage of relevant documents in top-K results.

Target: Recall@5 > 0.9

### Latency

Target: P95 < 500ms

---

## Fallback Strategies

When retrieval fails:

```typescript
async function retrieveWithFallback(
  query: string
): Promise<RetrievalContext> {
  try {
    // 1. Try hybrid retrieval
    return await hybridRetrieve(query);
  } catch (error) {
    logger.warn('Hybrid retrieval failed', error);
    
    // 2. Fallback: BM25 only
    try {
      return await bm25OnlyRetrieve(query);
    } catch (error) {
      logger.warn('BM25 retrieval failed', error);
      
      // 3. Fallback: Vector only
      try {
        return await vectorOnlyRetrieve(query);
      } catch (error) {
        // 4. Last resort: Hardcoded lookup
        return await hardcodedLookup(query);
      }
    }
  }
}
```

---

## Why This Matters

Retrieval quality is the ceiling on decision quality:

1. **Wrong rate = Wrong decision**: If retrieval finds wrong WD, validation fails
2. **Unknown classification blocks**: No retrieval result → Unknown role → Human review
3. **Speed matters**: Slow retrieval = poor UX, timeouts
4. **Synonyms are real**: "Wireman" must find "Electrician" rates
5. **Audit requires citations**: Every decision cites the WD that informed it

---

## Related Documentation

- [ADR-002: Hybrid Retrieval](../adrs/ADR-002-hybrid-retrieval.md) — Architectural decision
- [Implementation: Vector Storage](../implementation/04-vector-pgvector.md) — pgvector setup
- [Implementation: Search](../implementation/02-search-elasticsearch.md) — Elasticsearch setup
- [Implementation: Hybrid Retrieval](../implementation/05-retrieval-hybrid-rerank.md) — Full implementation guide
- [Deterministic Validation](./deterministic-validation.md) — What uses retrieved rates

---

**Last Updated**: 2026-04-17
