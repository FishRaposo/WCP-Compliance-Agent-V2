# API and Integrations

Status Label: Structurally Implemented, Data Stubbed

API surface and external integrations for the WCP Compliance Agent, covering current endpoints, target architecture, and integration patterns.

---

## Purpose

The API provides:
- **WCP submission**: Submit payroll reports for analysis
- **Decision retrieval**: Get compliance decisions with full audit trails
- **Status tracking**: Check processing status
- **Administrative functions**: Upload DBWD rates, manage mappings
- **Health monitoring**: Service health checks

---

## Current State

### Implementation

**Framework**: Hono (lightweight, TypeScript-first)
**File**: `src/app.ts`

Current endpoints:

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `POST` | `/analyze` | Submit WCP for analysis | ✅ Implemented |
| `POST` | `/api/analyze` | API version (same functionality) | ✅ Implemented |
| `GET` | `/health` | Health check | ✅ Implemented |
| `GET` | `/api/health` | API health check | ✅ Implemented |

### Current API Contract

**Request**:
```typescript
POST /analyze
Content-Type: application/json

{
  "content": "Role: Electrician, Hours: 45, Wage: 35.50",
  "traceId": "wcp-20240115-ABC123" // Optional
}
```

**Response**:
```typescript
200 OK
Content-Type: application/json

{
  "traceId": "wcp-20240115-ABC123",
  "finalStatus": "Reject",
  "deterministic": {
    "extracted": { "role": "Electrician", "hours": 45, "wage": 35.50 },
    "checks": [...],
    "deterministicScore": 0.5
  },
  "verdict": {
    "status": "Reject",
    "rationale": "Worker underpaid by $3.00/hr",
    "referencedCheckIds": ["base_wage_001"]
  },
  "trust": {
    "score": 0.45,
    "band": "require_human",
    "components": { "deterministic": 0.5, "classification": 1.0, "llmSelf": 0.95, "agreement": 1.0 }
  },
  "humanReview": {
    "required": true,
    "status": "pending"
  },
  "health": {
    "cycleTime": 245,
    "tokenUsage": 150,
    "validationScore": 0.5,
    "confidence": 0.45
  },
  "requestId": "req-abc123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Code Example

```typescript
// src/app.ts
import { Hono } from 'hono';
import { generateWcpDecision } from './entrypoints/wcp-entrypoint.js';

const app = new Hono();

// Health check
app.get('/health', (c) => c.json({ status: 'healthy', timestamp: new Date().toISOString() }));

// Analyze WCP
app.post('/analyze', async (c) => {
  const body = await c.req.json();
  
  const decision = await generateWcpDecision({
    content: body.content,
    traceId: body.traceId,
  });
  
  return c.json(decision);
});

export default app;
```

---

## Target State

### RESTful API v1

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| **Submission** | | | |
| `POST` | `/v1/wcp/submit` | Submit new WCP report | API Key |
| `POST` | `/v1/wcp/submit/batch` | Submit multiple WCPs | API Key |
| **Status** | | | |
| `GET` | `/v1/wcp/:reportId/status` | Check processing status | API Key |
| `GET` | `/v1/wcp/:reportId` | Get full decision | API Key |
| `GET` | `/v1/wcp/:reportId/trace` | Get audit trail | API Key |
| `GET` | `/v1/wcp/:reportId/replay` | Replay decision | API Key |
| **Review** | | | |
| `POST` | `/v1/review/:queueId/approve` | Approve pending review | Admin |
| `POST` | `/v1/review/:queueId/reject` | Reject pending review | Admin |
| `GET` | `/v1/review/queue` | List human review queue | Admin |
| **Admin** | | | |
| `POST` | `/v1/admin/dbwd/upload` | Upload new DBWD | Admin |
| `POST` | `/v1/admin/rates/sync` | Trigger SAM.gov sync | Admin |
| `GET` | `/v1/admin/metrics` | System metrics | Admin |
| **Health** | | | |
| `GET` | `/v1/health` | Health check | None |
| `GET` | `/v1/health/detailed` | Detailed health | Admin |

### API Contract (Target)

**Submit WCP**:
```typescript
POST /v1/wcp/submit
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "projectId": "proj-123",
  "weekEndingDate": "2024-01-15",
  "document": {
    "format": "pdf",
    "content": "base64_encoded_pdf_content"
  },
  "metadata": {
    "subcontractor": "ABC Construction",
    "contractNumber": "DC-2024-001"
  }
}

// Response: 202 Accepted
{
  "reportId": "wcp-20240115-ABC123",
  "status": "processing",
  "estimatedCompletion": "2024-01-15T10:30:05Z",
  "statusUrl": "/v1/wcp/wcp-20240115-ABC123/status"
}
```

**Get Decision**:
```typescript
GET /v1/wcp/wcp-20240115-ABC123
Authorization: Bearer {api_key}

// Response: 200 OK (or 202 if still processing)
{
  "reportId": "wcp-20240115-ABC123",
  "status": "complete",
  "decision": {
    "finalStatus": "Approved",
    "trustScore": 0.92,
    // ... full decision object
  }
}
```

---

## Integration Architecture

### Data Warehouse (Redshift/BigQuery)

**Purpose**: Analytical queries, historical trends, compliance reporting

```typescript
// Sync decisions to warehouse for analysis
interface WarehouseSync {
  reportId: string;
  projectId: string;
  decisionStatus: string;
  trustScore: number;
  violationTypes: string[];
  processingTimeMs: number;
  timestamp: Date;
}

// Example query in warehouse
SELECT 
  project_id,
  COUNT(*) as total_reports,
  AVG(trust_score) as avg_confidence,
  COUNT(CASE WHEN decision_status = 'Reject' THEN 1 END) as violations
FROM wcp_decisions
WHERE timestamp > DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY project_id;
```

### Search (Elasticsearch)

**Purpose**: BM25 keyword retrieval for DBWD documents

```typescript
// Index DBWD documents
interface DBWDDocument {
  wdNumber: string;
  jobTitle: string;
  locality: string;
  content: string;  // Full wage determination text
  effectiveDate: Date;
  baseRate: number;
  fringeRate: number;
}

// Search query
{
  "query": {
    "bool": {
      "must": [
        { "match": { "jobTitle": "Electrician" } },
        { "term": { "locality": "LOS_ANGELES_CA" } }
      ],
      "filter": [
        { "range": { "effectiveDate": { "lte": "2024-01-15" } } }
      ]
    }
  }
}
```

### Vector Storage (PostgreSQL + pgvector)

**Purpose**: Semantic search for role classification

```typescript
// Store embeddings alongside documents
interface VectorDocument {
  id: string;
  wdNumber: string;
  jobTitle: string;
  embedding: number[];  // 1536-dimensional vector
  metadata: object;
}

// Semantic similarity search
const similarDocs = await db.query(`
  SELECT wd_number, job_title, embedding <=> $1 as distance
  FROM wage_determination_vectors
  ORDER BY embedding <=> $1
  LIMIT 10
`, [queryEmbedding]);
```

### Cache (Redis)

**Purpose**: Fast access to frequently used data

```typescript
// Cache DBWD rates (rarely change)
await redis.setex(
  `rate:Electrician:LOS_ANGELES_CA`,
  3600, // 1 hour TTL
  JSON.stringify({ baseRate: 38.50, fringeRate: 8.50 })
);

// Cache retrieval results
await redis.setex(
  `retrieval:${hash(query)}`,
  300, // 5 min TTL
  JSON.stringify(retrievalResults)
);
```

---

## Authentication & Authorization

### API Key Authentication

```typescript
// Middleware
app.use('/v1/*', async (c, next) => {
  const apiKey = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!apiKey) {
    return c.json({ error: 'API key required' }, 401);
  }
  
  const tenant = await validateApiKey(apiKey);
  if (!tenant) {
    return c.json({ error: 'Invalid API key' }, 401);
  }
  
  c.set('tenant', tenant);
  await next();
});
```

### Rate Limiting

```typescript
// Redis-backed rate limiting
async function rateLimit(
  apiKey: string,
  maxRequests: number = 100,
  windowSeconds: number = 60
): Promise<boolean> {
  const key = `ratelimit:${apiKey}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }
  
  return current <= maxRequests;
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/POST |
| 202 | Accepted | Async processing started |
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Missing/invalid API key |
| 403 | Forbidden | Valid key, insufficient permissions |
| 404 | Not Found | Report ID doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Unexpected server error |

### Error Response Format

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid WCP format: missing required field 'role'",
    "details": {
      "field": "role",
      "constraint": "required"
    },
    "traceId": "err-20240115-001",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

## Deployment

### Target Architecture

```
┌─────────────────────────────────────────┐
│           CDN (CloudFlare)              │
│         - DDoS protection               │
│         - Edge caching                  │
└─────────────────────────────────────────┘
                   │
┌─────────────────────────────────────────┐
│           Load Balancer                 │
│         - SSL termination               │
│         - Health checks               │
└─────────────────────────────────────────┘
                   │
┌─────────────────────────────────────────┐
│           API Servers (3+)              │
│         - Hono/Node.js                  │
│         - Stateless                     │
│         - Horizontal scaling            │
└─────────────────────────────────────────┘
                   │
┌─────────────────────────────────────────┐
│           Data Layer                    │
│         - PostgreSQL (primary)          │
│         - Redis (cache)                 │
│         - Elasticsearch (search)        │
└─────────────────────────────────────────┘
```

### Environment Configuration

```typescript
// config/environments.ts
interface Environment {
  name: 'development' | 'staging' | 'production';
  api: {
    baseUrl: string;
    rateLimit: number;
  };
  database: {
    url: string;
    poolSize: number;
  };
  redis: {
    url: string;
    ttl: number;
  };
  openai: {
    model: string;
    maxTokens: number;
  };
}

const production: Environment = {
  name: 'production',
  api: {
    baseUrl: 'https://api.wcp-compliance.io',
    rateLimit: 1000, // requests per minute
  },
  database: {
    url: process.env.DATABASE_URL!,
    poolSize: 20,
  },
  redis: {
    url: process.env.REDIS_URL!,
    ttl: 3600,
  },
  openai: {
    model: 'gpt-4o-mini',
    maxTokens: 4000,
  },
};
```

---

## Why This Matters

The API is the product interface:

1. **Reliability**: Consistent contracts, versioned changes
2. **Security**: Authentication, authorization, rate limiting
3. **Scalability**: Stateless design, horizontal scaling
4. **Observability**: Health checks, metrics, tracing
5. **Integration**: Connects to data warehouse, retrieval, cache

---

## Related Documentation

- [Implementation: API](../implementation/INDEX.md) — API implementation guides
- [ADR-001: Mastra over LangChain](../adrs/ADR-001-mastra-over-langchain.md) — Framework decision
- [ADR-002: Hybrid Retrieval](../adrs/ADR-002-hybrid-retrieval.md) — Search integration
- [Security and Compliance](./security-and-compliance.md) — Auth, rate limiting
- [Decision Engine](./decision-engine.md) — What the API invokes

---

**Last Updated**: 2026-04-17
