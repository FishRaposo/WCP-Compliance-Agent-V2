# Vector Storage: Corpus Embeddings (Postgres/pgvector)

Status Label: Designed / Target

Truth anchors:

- [`./INDEX.md`](./INDEX.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)
- [`../architecture/retrieval-and-context.md`](../architecture/retrieval-and-context.md)

## Role in the System

Postgres with pgvector serves as the vector store for semantic search over wage determinations and policy documents. It enables similarity-based retrieval using HNSW indexing, while colocating with relational compliance data for transactional consistency.

## WCP Domain Mapping

| Revenue Intelligence Concept | WCP Compliance Equivalent |
|---|---|
| Customer interaction embeddings | Wage determination section embeddings |
| Call transcript chunks | Document chunks (summary, wage tables, scope) |
| Semantic similarity over conversations | Semantic similarity over trade descriptions and requirements |
| Topic clustering | Trade classification and locality clustering |

## Architecture

```mermaid
flowchart TB
    subgraph Sources["Embedding Sources"]
        DBWD[DBWD Documents]
        Policy[Policy Documents]
        Letters[Determination Letters]
    end

    subgraph Pipeline["Embedding Pipeline"]
        Chunker[Document Chunker]
        Embedder[OpenAI Embedding API]
        Normalizer[Vector Normalization]
    end

    subgraph Storage["pgvector Storage"]
        Chunks[(corpus_chunks)]
        Embeddings[(embeddings<br/>with HNSW index)]
        Corpus[(corpus_versions)]
    end

    subgraph Query["Vector Query"]
        EmbedQuery[Query Embedding]
        HNSW[HNSW Approximate Search]
        Results[Top-K Results]
    end

    subgraph Consumers["Consumers"]
        Hybrid[Hybrid Retriever]
        Decision[Decision Agent]
    end

    Sources --> Chunker --> Embedder --> Normalizer --> Storage
    Consumers --> Query --> Storage
```

## Schema Design

### Corpus Versioning

```sql
-- Corpus versions for reproducible retrieval
CREATE TABLE corpus_versions (
    version_id VARCHAR(64) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_description TEXT,
    document_count INT,
    chunk_count INT,
    embedding_model VARCHAR(100),
    is_active BOOLEAN DEFAULT FALSE,
    superseded_by VARCHAR(64) REFERENCES corpus_versions(version_id)
);

-- Index for active version lookup
CREATE INDEX idx_corpus_versions_active ON corpus_versions(is_active) WHERE is_active = TRUE;
```

### Document Chunks

```sql
-- Document chunks with metadata
CREATE TABLE corpus_chunks (
    chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corpus_version_id VARCHAR(64) REFERENCES corpus_versions(version_id),
    
    -- Source document reference
    source_document_id VARCHAR(255),
    source_document_type VARCHAR(50), -- 'dbwd_determination', 'policy_doc', etc.
    
    -- Chunk metadata
    chunk_index INT,
    section_type VARCHAR(50), -- 'summary', 'wage_rates', 'scope', 'definitions'
    content TEXT NOT NULL,
    content_length INT,
    
    -- Domain metadata
    trade_codes TEXT[], -- Array of trade codes this chunk covers
    locality_code VARCHAR(50),
    jurisdiction VARCHAR(20), -- 'federal', 'state', 'local'
    effective_date DATE,
    expiration_date DATE,
    
    -- Source reference
    page_number INT,
    source_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_chunk_version UNIQUE(corpus_version_id, source_document_id, chunk_index)
);

-- Indexes for metadata filtering
CREATE INDEX idx_chunks_corpus_version ON corpus_chunks(corpus_version_id);
CREATE INDEX idx_chunks_trade_codes ON corpus_chunks USING GIN(trade_codes);
CREATE INDEX idx_chunks_locality ON corpus_chunks(locality_code);
CREATE INDEX idx_chunks_effective_date ON corpus_chunks(effective_date);
```

### Embeddings

```sql
-- Embeddings table (partitioned by corpus version for performance)
CREATE TABLE embeddings (
    embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id UUID REFERENCES corpus_chunks(chunk_id) ON DELETE CASCADE,
    corpus_version_id VARCHAR(64) REFERENCES corpus_versions(version_id),
    
    -- Embedding vector (1536 for text-embedding-3-small, 3072 for large)
    embedding VECTOR(1536),
    
    -- Embedding model info
    model_name VARCHAR(100),
    model_version VARCHAR(50),
    
    -- Normalization status
    is_normalized BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HNSW index for approximate nearest neighbor search
CREATE INDEX idx_embeddings_hnsw ON embeddings 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Index for corpus version filtering (critical for reproducible search)
CREATE INDEX idx_embeddings_corpus ON embeddings(corpus_version_id);
```

## Repository Interface

```typescript
// src/services/vector/pgvector-repository.ts

import { z } from 'zod';

/**
 * Corpus chunk schema
 */
export const CorpusChunkSchema = z.object({
  chunkId: z.string().uuid(),
  corpusVersionId: z.string(),
  sourceDocumentId: z.string(),
  sourceDocumentType: z.enum(['dbwd_determination', 'policy_doc', 'determination_letter', 'regulatory_guidance']),
  chunkIndex: z.number().int(),
  sectionType: z.enum(['summary', 'wage_rates', 'scope', 'definitions', 'notes', 'appendix']),
  content: z.string(),
  contentLength: z.number().int(),
  tradeCodes: z.array(z.string()),
  localityCode: z.string().optional(),
  jurisdiction: z.enum(['federal', 'state', 'local']),
  effectiveDate: z.date(),
  expirationDate: z.date().optional(),
  pageNumber: z.number().int().optional(),
  sourceUrl: z.string().optional(),
});

export type CorpusChunk = z.infer<typeof CorpusChunkSchema>;

/**
 * Search result with distance
 */
export const VectorSearchResultSchema = z.object({
  chunk: CorpusChunkSchema,
  distance: z.number(), // Cosine distance (0 = identical, 2 = opposite)
  similarity: z.number(), // Cosine similarity (-1 to 1, 1 = identical)
});

export type VectorSearchResult = z.infer<typeof VectorSearchResultSchema>;

/**
 * Search filters
 */
export const VectorSearchFiltersSchema = z.object({
  corpusVersionId: z.string().optional()
    .describe('Specific corpus version to search (defaults to active)'),
  tradeCodes: z.array(z.string()).optional()
    .describe('Filter to specific trade codes'),
  localityCode: z.string().optional()
    .describe('Filter to specific locality'),
  jurisdiction: z.enum(['federal', 'state', 'local']).optional()
    .describe('Filter by jurisdiction level'),
  effectiveAfter: z.date().optional()
    .describe('Only chunks effective after this date'),
  sectionTypes: z.array(z.string()).optional()
    .describe('Filter to specific section types (e.g., wage_rates)'),
});

export type VectorSearchFilters = z.infer<typeof VectorSearchFiltersSchema>;

export interface VectorRepository {
  /**
   * Create a new corpus version
   */
  createCorpusVersion(
    versionId: string,
    description: string,
    embeddingModel: string
  ): Promise<void>;
  
  /**
   * Set active corpus version
   */
  setActiveCorpusVersion(versionId: string): Promise<void>;
  
  /**
   * Get active corpus version
   */
  getActiveCorpusVersion(): Promise<string | null>;
  
  /**
   * Store chunk without embedding (for batch processing)
   */
  storeChunk(chunk: Omit<CorpusChunk, 'chunkId'>): Promise<string>; // returns chunkId
  
  /**
   * Store embedding for a chunk
   */
  storeEmbedding(
    chunkId: string,
    corpusVersionId: string,
    embedding: number[],
    modelName: string,
    modelVersion: string
  ): Promise<void>;
  
  /**
   * Search by vector similarity
   */
  search(
    queryEmbedding: number[],
    filters: VectorSearchFilters,
    k: number
  ): Promise<VectorSearchResult[]>;
  
  /**
   * Search with metadata pre-filtering
   */
  searchWithFilter(
    queryEmbedding: number[],
    sqlWhereClause: string,
    k: number
  ): Promise<VectorSearchResult[]>;
  
  /**
   * Get chunks by IDs
   */
  getChunks(chunkIds: string[]): Promise<CorpusChunk[]>;
  
  /**
   * Delete corpus version (for rollback)
   */
  deleteCorpusVersion(versionId: string): Promise<void>;
}

export class PgVectorRepository implements VectorRepository {
  constructor(
    private readonly db: PostgresClient,
    private readonly embeddingDimension: number = 1536
  ) {}

  async createCorpusVersion(
    versionId: string,
    description: string,
    embeddingModel: string
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO corpus_versions (version_id, source_description, embedding_model)
       VALUES ($1, $2, $3)`,
      [versionId, description, embeddingModel]
    );
  }

  async setActiveCorpusVersion(versionId: string): Promise<void> {
    // Transaction to ensure only one active version
    await this.db.transaction(async (trx) => {
      // Deactivate current
      await trx.query(
        `UPDATE corpus_versions SET is_active = FALSE, superseded_by = $1
         WHERE is_active = TRUE`,
        [versionId]
      );
      
      // Activate new
      await trx.query(
        `UPDATE corpus_versions SET is_active = TRUE WHERE version_id = $1`,
        [versionId]
      );
    });
  }

  async getActiveCorpusVersion(): Promise<string | null> {
    const result = await this.db.query(
      `SELECT version_id FROM corpus_versions WHERE is_active = TRUE LIMIT 1`
    );
    return result.rows[0]?.version_id || null;
  }

  async storeChunk(chunk: Omit<CorpusChunk, 'chunkId'>): Promise<string> {
    const result = await this.db.query(
      `INSERT INTO corpus_chunks (
        corpus_version_id, source_document_id, source_document_type,
        chunk_index, section_type, content, content_length,
        trade_codes, locality_code, jurisdiction,
        effective_date, expiration_date, page_number, source_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING chunk_id`,
      [
        chunk.corpusVersionId,
        chunk.sourceDocumentId,
        chunk.sourceDocumentType,
        chunk.chunkIndex,
        chunk.sectionType,
        chunk.content,
        chunk.content.length,
        chunk.tradeCodes,
        chunk.localityCode,
        chunk.jurisdiction,
        chunk.effectiveDate,
        chunk.expirationDate,
        chunk.pageNumber,
        chunk.sourceUrl
      ]
    );
    return result.rows[0].chunk_id;
  }

  async storeEmbedding(
    chunkId: string,
    corpusVersionId: string,
    embedding: number[],
    modelName: string,
    modelVersion: string
  ): Promise<void> {
    // Normalize vector to unit length for cosine similarity
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalized = embedding.map(v => v / magnitude);
    
    await this.db.query(
      `INSERT INTO embeddings (chunk_id, corpus_version_id, embedding, model_name, model_version, is_normalized)
       VALUES ($1, $2, $3, $4, $5, TRUE)`,
      [chunkId, corpusVersionId, JSON.stringify(normalized), modelName, modelVersion]
    );
  }

  async search(
    queryEmbedding: number[],
    filters: VectorSearchFilters,
    k: number
  ): Promise<VectorSearchResult[]> {
    // Normalize query vector
    const magnitude = Math.sqrt(queryEmbedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedQuery = queryEmbedding.map(v => v / magnitude);
    
    // Determine corpus version
    const corpusVersionId = filters.corpusVersionId || await this.getActiveCorpusVersion();
    if (!corpusVersionId) {
      throw new Error('No active corpus version and no version specified');
    }
    
    // Build filter conditions
    const conditions: string[] = ['e.corpus_version_id = $2'];
    const params: unknown[] = [JSON.stringify(normalizedQuery), corpusVersionId];
    let paramIdx = 2;
    
    if (filters.tradeCodes && filters.tradeCodes.length > 0) {
      paramIdx++;
      conditions.push(`c.trade_codes && $${paramIdx}`); // Array overlap
      params.push(filters.tradeCodes);
    }
    
    if (filters.localityCode) {
      paramIdx++;
      conditions.push(`c.locality_code = $${paramIdx}`);
      params.push(filters.localityCode);
    }
    
    if (filters.jurisdiction) {
      paramIdx++;
      conditions.push(`c.jurisdiction = $${paramIdx}`);
      params.push(filters.jurisdiction);
    }
    
    if (filters.effectiveAfter) {
      paramIdx++;
      conditions.push(`c.effective_date >= $${paramIdx}`);
      params.push(filters.effectiveAfter);
    }
    
    if (filters.sectionTypes && filters.sectionTypes.length > 0) {
      paramIdx++;
      conditions.push(`c.section_type = ANY($${paramIdx})`);
      params.push(filters.sectionTypes);
    }
    
    const whereClause = conditions.join(' AND ');
    
    const query = `
      SELECT 
        c.*,
        e.embedding <=> $1 as distance,
        1 - (e.embedding <=> $1) as similarity
      FROM embeddings e
      JOIN corpus_chunks c ON e.chunk_id = c.chunk_id
      WHERE ${whereClause}
      ORDER BY e.embedding <=> $1
      LIMIT $${paramIdx + 1}
    `;
    
    params.push(k);
    
    const result = await this.db.query(query, params);
    
    return result.rows.map(row => ({
      chunk: this.rowToChunk(row),
      distance: row.distance,
      similarity: row.similarity,
    }));
  }

  async getChunks(chunkIds: string[]): Promise<CorpusChunk[]> {
    const result = await this.db.query(
      `SELECT * FROM corpus_chunks WHERE chunk_id = ANY($1)`,
      [chunkIds]
    );
    return result.rows.map(this.rowToChunk);
  }

  async deleteCorpusVersion(versionId: string): Promise<void> {
    // Cascades to chunks and embeddings
    await this.db.query(
      `DELETE FROM corpus_versions WHERE version_id = $1`,
      [versionId]
    );
  }

  private rowToChunk(row: Record<string, unknown>): CorpusChunk {
    return {
      chunkId: row.chunk_id as string,
      corpusVersionId: row.corpus_version_id as string,
      sourceDocumentId: row.source_document_id as string,
      sourceDocumentType: row.source_document_type as CorpusChunk['sourceDocumentType'],
      chunkIndex: row.chunk_index as number,
      sectionType: row.section_type as CorpusChunk['sectionType'],
      content: row.content as string,
      contentLength: row.content_length as number,
      tradeCodes: row.trade_codes as string[],
      localityCode: row.locality_code as string,
      jurisdiction: row.jurisdiction as CorpusChunk['jurisdiction'],
      effectiveDate: new Date(row.effective_date as string),
      expirationDate: row.expiration_date ? new Date(row.expiration_date as string) : undefined,
      pageNumber: row.page_number as number,
      sourceUrl: row.source_url as string,
    };
  }
}
```

## Embedding Service

```typescript
// src/services/vector/embedding-service.ts

import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

export interface EmbeddingService {
  /**
   * Embed a single text
   */
  embedText(text: string): Promise<number[]>;
  
  /**
   * Embed multiple texts (batch)
   */
  embedTexts(texts: string[]): Promise<number[][]>;
}

export class OpenAIEmbeddingService implements EmbeddingService {
  constructor(
    private readonly model: string = 'text-embedding-3-small',
    private readonly dimensions?: number
  ) {}

  async embedText(text: string): Promise<number[]> {
    // Truncate if needed (token limit ~8191 for text-embedding-3)
    const truncated = this.truncateToTokenLimit(text, 8000);
    
    const { embedding } = await embed({
      model: openai.embedding(this.model, {
        dimensions: this.dimensions,
      }),
      value: truncated,
    });
    
    return embedding;
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    // Process in batches to respect rate limits
    const batchSize = 100;
    const results: number[][] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map(text => this.embedText(text))
      );
      results.push(...batchEmbeddings);
    }
    
    return results;
  }

  private truncateToTokenLimit(text: string, maxChars: number): string {
    // Rough approximation: 4 chars ~ 1 token for English
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars) + '...';
  }
}
```

## Tool Interface

```typescript
// src/mastra/tools/vector-search-tool.ts

import { z } from 'zod';
import { createTool } from '@mastra/core';

export const VectorSearchSchema = z.object({
  query: z.string()
    .describe('Semantic search query text'),
  filters: z.object({
    tradeCodes: z.array(z.string()).optional(),
    localityCode: z.string().optional(),
    jurisdiction: z.enum(['federal', 'state', 'local']).optional(),
    sectionTypes: z.array(z.enum(['summary', 'wage_rates', 'scope', 'definitions'])).optional(),
  }).optional(),
  k: z.number().int().min(1).max(100).default(10)
    .describe('Number of results to return'),
});

export type VectorSearchInput = z.infer<typeof VectorSearchSchema>;

/**
 * Tool: searchByVectorSimilarity
 * 
 * Semantic search over wage determination corpus using embeddings.
 * Results feed into hybrid retriever for reranking.
 */
export const searchByVectorSimilarityTool = createTool({
  id: 'search-by-vector-similarity',
  description: `Semantic search over wage and policy documents.
Use this to find semantically similar content to a query,
even if keywords don't match exactly.`,
  inputSchema: VectorSearchSchema,
  execute: async ({ query, filters, k }): Promise<VectorSearchResult[]> => {
    // Implementation would:
    // 1. Embed query using embedding service
    // 2. Call vector repository search
    // 3. Return results
    throw new Error('Not implemented - pgvector connection required');
  },
});
```

## Config Example

```bash
# .env

# PostgreSQL with pgvector
DATABASE_URL=postgresql://user:password@localhost:5432/wcp_compliance

# pgvector specific
PGVECTOR_HNSW_M=16
PGVECTOR_HNSW_EF_CONSTRUCTION=64
PGVECTOR_HNSW_EF_SEARCH=40

# Embedding model
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
# Or for higher quality: text-embedding-3-large with 3072 dimensions

# OpenAI API
OPENAI_API_KEY=sk-...

# Corpus management
DEFAULT_CORPUS_VERSION=v2024-01
CORPUS_AUTO_ACTIVATE=false
```

## Integration Points

| Existing File | Integration |
|---|---|
| `src/services/vector/` | New directory with pgvector repository |
| `src/mastra/tools/` | Add `vector-search-tool.ts` |
| `src/ingestion/` | Embedding pipeline for document ingestion |
| `src/config/database.ts` | Add pgvector extension setup |

## Trade-offs

| Decision | Rationale |
|---|---|
| **pgvector vs dedicated vector DB (Pinecone, Weaviate)** | pgvector offers operational simplicity (same DB), transactional consistency with compliance data, and cost savings at moderate scale (<10M vectors). Dedicated vector DBs may be needed at higher scale. |
| **HNSW vs IVFFlat** | HNSW has higher build cost but better recall/speed tradeoff for approximate search. Worth it for compliance where precision matters. |
| **Normalized vs raw vectors** | Normalizing to unit length ensures cosine similarity equals dot product, enabling faster distance calculations. Slight precision loss acceptable. |
| **Corpus versioning in same DB vs separate** | Same DB with version tags allows atomic corpus switches and rollback. Separate DBs per version would be operationally heavy. |

## Implementation Phasing

### Phase 1: Schema & Extension
- Enable pgvector extension
- Create corpus_versions, corpus_chunks, embeddings tables
- Set up HNSW indexes

### Phase 2: Ingestion Pipeline
- Document chunking service
- Batch embedding pipeline
- Corpus version management

### Phase 3: Query Integration
- Vector search tool
- Hybrid retriever integration
- Metadata filtering

### Phase 4: Optimization
- Index tuning (ef_construction, ef_search)
- Query performance monitoring
- Warmup strategies

## Chunking Strategy

For DBWD wage determinations:

```typescript
// src/services/vector/chunker.ts

export interface ChunkingStrategy {
  /**
   * Chunk a document into semantic units
   */
  chunk(document: PolicyDocument): DocumentChunk[];
}

export class WageDeterminationChunker implements ChunkingStrategy {
  chunk(document: PolicyDocument): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    
    // Header chunk (summary)
    chunks.push({
      index: 0,
      sectionType: 'summary',
      content: this.extractHeader(document),
      tradeCodes: document.tradeCodes,
      localityCode: document.localityCode,
    });
    
    // Wage rates table (critical for retrieval)
    if (document.wageTable) {
      chunks.push({
        index: 1,
        sectionType: 'wage_rates',
        content: this.formatWageTable(document.wageTable),
        tradeCodes: document.tradeCodes,
        localityCode: document.localityCode,
      });
    }
    
    // Scope description
    if (document.scopeDescription) {
      chunks.push({
        index: 2,
        sectionType: 'scope',
        content: document.scopeDescription,
        tradeCodes: document.tradeCodes,
        localityCode: document.localityCode,
      });
    }
    
    // Definitions (if present)
    if (document.definitions && document.definitions.length > 0) {
      for (let i = 0; i < document.definitions.length; i++) {
        chunks.push({
          index: 3 + i,
          sectionType: 'definitions',
          content: document.definitions[i],
          tradeCodes: document.tradeCodes,
          localityCode: document.localityCode,
        });
      }
    }
    
    return chunks;
  }
}
```

## Corpus Version Management

```typescript
// Example corpus migration workflow
export async function deployNewCorpus(
  repository: VectorRepository,
  embeddingService: EmbeddingService,
  documents: PolicyDocument[]
): Promise<void> {
  const versionId = `v${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;
  
  // Create new version
  await repository.createCorpusVersion(
    versionId,
    'DBWD determinations + policy updates',
    'text-embedding-3-small'
  );
  
  // Process documents
  for (const doc of documents) {
    const chunker = new WageDeterminationChunker();
    const chunks = chunker.chunk(doc);
    
    for (const chunk of chunks) {
      // Store chunk
      const chunkId = await repository.storeChunk({
        corpusVersionId: versionId,
        sourceDocumentId: doc.documentId,
        sourceDocumentType: doc.documentType,
        chunkIndex: chunk.index,
        sectionType: chunk.sectionType,
        content: chunk.content,
        tradeCodes: chunk.tradeCodes,
        localityCode: chunk.localityCode,
        jurisdiction: doc.jurisdiction,
        effectiveDate: doc.effectiveDate,
      });
      
      // Embed and store
      const embedding = await embeddingService.embedText(chunk.content);
      await repository.storeEmbedding(
        chunkId,
        versionId,
        embedding,
        'text-embedding-3-small',
        '1.0'
      );
    }
  }
  
  // Validate new corpus before activating
  const validation = await validateCorpus(repository, versionId);
  if (validation.passed) {
    await repository.setActiveCorpusVersion(versionId);
    console.log(`Activated corpus version: ${versionId}`);
  } else {
    console.error('Corpus validation failed:', validation.errors);
    await repository.deleteCorpusVersion(versionId);
  }
}
```
