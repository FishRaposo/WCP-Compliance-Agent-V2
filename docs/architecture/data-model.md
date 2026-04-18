# Data Model

Status Label: Designed / Target

Type definitions, database schemas, and persistence concepts for the WCP Compliance Agent.

Truth anchors:

- [`../foundation/current-state.md`](../foundation/current-state.md)
- [`../foundation/implemented-vs-target.md`](../foundation/implemented-vs-target.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)
- [`../../src/types/index.ts`](../../src/types/index.ts)

---

## Current repo-backed types

Current core types include:

- `WCPDecision` — The analysis result
- `Finding` — Individual compliance issues
- `WCPData` — Extracted input data
- Request and response interfaces around the analysis flow

These reflect the proof artifact's intentionally small scope.

### Current TypeScript definitions

```typescript
// src/types/index.ts (current implementation)

/**
 * Input data extracted from WCP reports
 */
export interface WCPData {
  /** Job role (e.g., "Electrician", "Laborer") */
  role: string;
  
  /** Hours worked in the week */
  hours: number;
  
  /** Hourly wage rate */
  wage: number;
  
  /** Geographic locality for rate lookup */
  locality?: string;
  
  /** Week ending date */
  weekEnding?: string;
}

/**
 * Individual compliance finding
 */
export interface Finding {
  /** Type of check performed */
  check: 'base_wage' | 'overtime_rate' | 'overtime_hours' | 'signature' | 'parse_error';
  
  /** Expected value (if applicable) */
  expected?: number;
  
  /** Actual value found */
  actual: number;
  
  /** Difference between expected and actual */
  difference?: number;
  
  /** Severity level */
  severity: 'info' | 'warning' | 'error' | 'critical';
  
  /** Human-readable message */
  message?: string;
}

/**
 * Citation to source document
 */
export interface Citation {
  /** Source document ID (e.g., "DBWD_ELECTRICIAN_LA_2024") */
  source: string;
  
  /** Section within document */
  section?: string;
  
  /** URL to source (if available) */
  url?: string;
}

/**
 * Trace metadata for auditability
 */
export interface Trace {
  /** Unique request identifier */
  requestId: string;
  
  /** ISO timestamp */
  timestamp: string;
  
  /** Model version used */
  modelVersion: string;
  
  /** Prompt version used */
  promptVersion?: string;
  
  /** Corpus version used */
  corpusVersion?: string;
  
  /** Total processing time in ms */
  totalDuration?: number;
}

/**
 * System health metadata
 */
export interface Health {
  /** Whether the LLM was available */
  modelAvailable: boolean;
  
  /** Request latency in milliseconds */
  latencyMs: number;
  
  /** Any warnings encountered */
  warnings?: string[];
}

/**
 * Final decision output
 */
export interface WCPDecision {
  /** Compliance verdict */
  status: 'COMPLIANT' | 'VIOLATION' | 'REVISION_NEEDED';
  
  /** Human-readable explanation */
  explanation: string;
  
  /** List of specific findings */
  findings: Finding[];
  
  /** Source citations */
  citations: Citation[];
  
  /** Confidence score (0-1) */
  confidence: number;
  
  /** Audit trace */
  trace: Trace;
  
  /** System health */
  health: Health;
}
```

### Current Zod schemas

```typescript
// src/types/index.ts

import { z } from 'zod';

export const WCPDataSchema = z.object({
  role: z.string().min(1),
  hours: z.number().int().positive(),
  wage: z.number().positive(),
  locality: z.string().default('LA'),
  weekEnding: z.string().datetime().optional(),
});

export const FindingSchema = z.object({
  check: z.enum([
    'base_wage',
    'overtime_rate', 
    'overtime_hours',
    'signature',
    'arithmetic',
    'locality',
    'ocr_quality',
    'parse_error'
  ]),
  expected: z.number().optional(),
  actual: z.number(),
  difference: z.number().optional(),
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  message: z.string().optional(),
});

export const CitationSchema = z.object({
  source: z.string(),
  section: z.string().optional(),
  url: z.string().url().optional(),
});

export const TraceSchema = z.object({
  requestId: z.string(),
  timestamp: z.string().datetime(),
  modelVersion: z.string(),
  promptVersion: z.string().optional(),
  corpusVersion: z.string().optional(),
  totalDuration: z.number().int().positive().optional(),
});

export const HealthSchema = z.object({
  modelAvailable: z.boolean(),
  latencyMs: z.number().int().positive(),
  warnings: z.array(z.string()).optional(),
});

export const WCPDecisionSchema = z.object({
  status: z.enum(['COMPLIANT', 'VIOLATION', 'REVISION_NEEDED']),
  explanation: z.string().min(1),
  findings: z.array(FindingSchema),
  citations: z.array(CitationSchema),
  confidence: z.number().min(0).max(1),
  trace: TraceSchema,
  health: HealthSchema,
});

// Type inference from schemas
export type WCPData = z.infer<typeof WCPDataSchema>;
export type WCPDecision = z.infer<typeof WCPDecisionSchema>;
```

---

## Target report model

The target normalized report model captures the full WCP report structure:

```typescript
// Target schema (not yet implemented)

interface WCPReport {
  /** Unique report identifier */
  id: string;
  
  /** Project information */
  project: {
    id: string;
    name: string;
    contractNumber?: string;
    locality: string;
    primeContractor: string;
  };
  
  /** Subcontractor information */
  subcontractor: {
    name: string;
    address: string;
    ein?: string;
  };
  
  /** Week covered by this report */
  week: {
    startDate: string;
    endDate: string;
  };
  
  /** Individual employee entries */
  employees: EmployeeEntry[];
  
  /** Report metadata */
  metadata: {
    submittedAt: string;
    submittedBy: string;
    signaturePresent: boolean;
    documentHash: string;
  };
}

interface EmployeeEntry {
  /** Employee identifier */
  employeeId: string;
  
  /** Name */
  name: string;
  
  /** Job classification */
  jobTitle: string;
  
  /** Work location */
  locality: string;
  
  /** Daily hours (Mon-Sun) */
  hoursByDay: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  
  /** Total hours */
  totalHours: number;
  
  /** Regular hours (≤40) */
  regularHours: number;
  
  /** Overtime hours (>40) */
  overtimeHours: number;
  
  /** Pay rates */
  rates: {
    baseRate: number;
    fringeRate: number;
    totalRate: number;
    overtimeRate: number;
  };
  
  /** Gross pay */
  grossPay: number;
}
```

### Target database schema (PostgreSQL)

```sql
-- Target database schema (planned)

-- WCP Reports table
CREATE TABLE wcp_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR(255) NOT NULL,
    subcontractor_name VARCHAR(255) NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    document_hash VARCHAR(64) UNIQUE NOT NULL,
    raw_document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee entries per report
CREATE TABLE wcp_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES wcp_reports(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    locality VARCHAR(255) NOT NULL,
    hours_monday DECIMAL(4,2) DEFAULT 0,
    hours_tuesday DECIMAL(4,2) DEFAULT 0,
    hours_wednesday DECIMAL(4,2) DEFAULT 0,
    hours_thursday DECIMAL(4,2) DEFAULT 0,
    hours_friday DECIMAL(4,2) DEFAULT 0,
    hours_saturday DECIMAL(4,2) DEFAULT 0,
    hours_sunday DECIMAL(4,2) DEFAULT 0,
    total_hours DECIMAL(5,2) NOT NULL,
    base_rate DECIMAL(8,2) NOT NULL,
    fringe_rate DECIMAL(8,2) DEFAULT 0,
    gross_pay DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DBWD determinations corpus
CREATE TABLE dbwd_determinations (
    id VARCHAR(255) PRIMARY KEY,
    job_title VARCHAR(255) NOT NULL,
    locality VARCHAR(255) NOT NULL,
    base_rate DECIMAL(8,2) NOT NULL,
    fringe_rate DECIMAL(8,2) NOT NULL,
    effective_date DATE NOT NULL,
    document_url TEXT,
    content_vector vector(1536), -- pgvector extension
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vector index for similarity search
CREATE INDEX ON dbwd_determinations 
USING ivfflat (content_vector vector_cosine_ops)
WITH (lists = 100);
```

---

## Target decision model

Decision records capture the full audit trail:

```typescript
// Target decision model (planned)

interface DecisionRecord {
  /** Unique decision ID */
  id: string;
  
  /** Reference to source report */
  reportId: string;
  
  /** Analysis timestamp */
  analyzedAt: string;
  
  /** Verdict */
  verdict: 'APPROVE' | 'REVISION' | 'REJECT';
  
  /** Detailed reasons */
  reasons: {
    code: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    description: string;
    affectedEmployees?: string[];
  }[];
  
  /** Citations to DBWD */
  citations: {
    determinationId: string;
    section: string;
    relevantText: string;
  }[];
  
  /** Confidence score */
  confidence: number;
  
  /** Routing decision */
  routing: {
    autoApproved: boolean;
    sentToHuman: boolean;
    humanReviewerId?: string;
  };
  
  /** Full trace for replay */
  trace: {
    traceId: string;
    requestId: string;
    timestamp: string;
    modelVersion: string;
    promptVersion: string;
    corpusVersion: string;
    processingStages: ProcessingStage[];
  };
}

interface ProcessingStage {
  name: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  input: unknown;
  output: unknown;
  errors?: string[];
}
```

### Decision records table

```sql
-- Decision persistence
CREATE TABLE decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES wcp_reports(id),
    verdict VARCHAR(20) NOT NULL CHECK (verdict IN ('APPROVE', 'REVISION', 'REJECT')),
    confidence DECIMAL(3,2) NOT NULL,
    auto_approved BOOLEAN DEFAULT FALSE,
    human_reviewed BOOLEAN DEFAULT FALSE,
    human_reviewer_id UUID REFERENCES users(id),
    trace_id VARCHAR(255) UNIQUE NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    prompt_version VARCHAR(50),
    corpus_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual findings per decision
CREATE TABLE decision_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID REFERENCES decisions(id) ON DELETE CASCADE,
    check_code VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    affected_employee_ids TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Citations per decision
CREATE TABLE decision_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID REFERENCES decisions(id) ON DELETE CASCADE,
    determination_id VARCHAR(255) REFERENCES dbwd_determinations(id),
    section VARCHAR(255),
    relevant_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Persistence concepts

Target persistence entities should include:

### Document storage

```typescript
interface StoredDocument {
  id: string;
  hash: string;  // SHA-256 for deduplication
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  s3Url: string;
  uploadedAt: string;
  uploadedBy: string;
}
```

### Normalized reports

Parsed and structured WCP data ready for analysis.

### DBWD records

Versioned corpus of prevailing wage determinations with:
- Full text content
- Vector embeddings
- Metadata (effective dates, localities, job titles)

### Trade alias mappings

```sql
CREATE TABLE trade_aliases (
    alias VARCHAR(255) PRIMARY KEY,
    canonical_job_title VARCHAR(255) NOT NULL,
    confidence DECIMAL(3,2) NOT NULL,
    source VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Example: "Wireman" → "Electrician"
INSERT INTO trade_aliases (alias, canonical_job_title, confidence, source)
VALUES ('Wireman', 'Electrician', 0.95, 'industry_standard');
```

### Audit traces

Full replayable execution logs for:
- Debugging
- Compliance audits
- Regression testing
- Cost analysis

```sql
-- Audit trace storage
CREATE TABLE audit_traces (
    trace_id VARCHAR(255) PRIMARY KEY,
    request_payload JSONB NOT NULL,
    processing_stages JSONB NOT NULL,
    final_output JSONB NOT NULL,
    tokens_used INTEGER,
    cost_usd DECIMAL(8,6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Data flow diagram

```
┌─────────────────┐
│  Raw Document   │ (PDF, CSV, image)
│    Upload       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Document      │
│   Storage       │ (S3)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  OCR/Extraction │
│    Service      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Normalized WCP  │
│    Report       │ (structured data)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Validation    │ (deterministic checks)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Retrieval     │ (hybrid search)
│   (DBWD lookup) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Decision     │
│   Generation    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Decision     │
│   Persistence   │ (auditable record)
└─────────────────┘
```

---

## What this gives the platform

This data model provides:

- **Structure** for the full WCP report schema
- **Replay** capability via trace storage
- **Debugging** via processing stage logs
- **Evaluation** via corpus version tracking
- **Audit** compliance via immutable decision records
- **Cost tracking** via token and latency metrics

---

## Related documentation

- [System Overview](./system-overview.md) - Architecture context
- [Retrieval and Context](./retrieval-and-context.md) - Search data model
- [Observability](./observability-and-operations.md) - Monitoring data
- [`src/types/index.ts`](../../src/types/index.ts) - Current type definitions

---

*Last updated: January 2024*
