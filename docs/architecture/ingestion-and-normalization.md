# Ingestion and Normalization

Status Label: Structurally Implemented, Data Stubbed

The ingestion layer transforms raw WCP inputs into structured, typed data for downstream processing. It handles multiple input formats and extracts normalized employee records.

---

## Purpose

Ingestion ensures:
- **Format flexibility**: Accept PDF, CSV, text, scanned images
- **Data normalization**: Convert all formats to typed WCP schema
- **Extraction confidence**: Surface uncertainty explicitly
- **Audit trail**: Hash and version raw documents

---

## Current State

### Implementation

**File**: `src/pipeline/layer1-deterministic.ts` (extraction phase)

Current capabilities:

| Format | Status | Fields Extracted |
|--------|--------|------------------|
| Plain text | ✅ | role, hours, wage |
| PDF | 🔲 | Not implemented |
| CSV | 🔲 | Not implemented |
| OCR (scanned) | 🔲 | Not implemented |

### Current Extraction

```typescript
// src/pipeline/layer1-deterministic.ts

export interface WCPInput {
  role: string;      // Job classification (e.g., "Electrician")
  hours: number;     // Total hours worked
  wage: number;      // Hourly wage rate
  // 🔲 hoursByDay: { mon, tue, wed, thu, fri, sat, sun }
  // 🔲 workerName: string
  // 🔲 socialSecurityLast4: string
  // 🔲 tradeCode: string
  // 🔲 localityCode: string
  // 🔲 fringeRate: number
  // 🔲 overtimeHours: number
  // 🔲 signaturePresent: boolean
}

export function extractWCPData(payload: string): WCPInput {
  // Regex-based extraction
  const roleMatch = payload.match(/Role:\s*(\w+)/i);
  const hoursMatch = payload.match(/Hours:\s*(\d+(?:\.\d+)?)/i);
  const wageMatch = payload.match(/Wage:\s*\$?(\d+(?:\.\d+)?)/i);
  
  return {
    role: roleMatch?.[1] ?? 'Unknown',
    hours: parseFloat(hoursMatch?.[1] ?? '0'),
    wage: parseFloat(wageMatch?.[1] ?? '0'),
  };
}
```

### Example Input/Output

**Input** (plain text):
```
Role: Electrician
Hours: 45
Wage: $38.50
```

**Output** (WCPInput):
```typescript
{
  role: 'Electrician',
  hours: 45,
  wage: 38.50
}
```

---

## Target State

### Full 11-Field WCP Schema

Target: Complete employee-level WCP report with all Davis-Bacon Act fields.

```typescript
// src/types/decision-pipeline.ts

export interface WCPReport {
  // Document metadata
  reportId: string;
  weekEndingDate: Date;
  projectId: string;
  subcontractorName: string;
  submittedAt: Date;
  
  // Employee entries
  employees: EmployeeEntry[];
  
  // Parse metadata
  extractionConfidence: number;
  extractionGaps: string[];
  documentHash: string;  // SHA-256 of raw document
}

export interface EmployeeEntry {
  // Identification
  workerName: string;
  socialSecurityLast4: string;  // Privacy: last 4 only
  
  // Classification
  role: string;
  tradeCode: string;      // DBWD trade classification
  localityCode: string;   // County/locality
  
  // Hours (daily breakdown)
  hoursByDay: {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
  };
  totalHours: number;
  overtimeHours: number;  // Hours > 40
  
  // Wage components
  baseRate: number;       // Straight time rate
  overtimeRate: number;   // 1.5x base (or higher)
  fringeRate: number;     // Fringe benefits per hour
  totalRate: number;      // base + fringe
  
  // Pay calculation
  straightTimeHours: number;
  straightTimePay: number;
  overtimePay: number;
  fringePay: number;
  grossPay: number;
  
  // Compliance evidence
  classificationSource: 'exact' | 'alias' | 'semantic' | 'unknown';
  rateSource: string;     // WD-2024-001, etc.
  
  // Extraction confidence
  fieldConfidence: {
    role: number;
    hours: number;
    wage: number;
    // ... per field
  };
}
```

### Target Input Formats

| Format | Priority | Approach |
|--------|----------|----------|
| **PDF (digital)** | P0 | Direct text extraction (pdf-parse)
| **PDF (scanned)** | P1 | OCR fallback (Tesseract)
| **CSV exports** | P1 | Structured parsing (csv-parse)
| **Plain text** | P0 | Regex extraction (current) |
| **WH-347 forms** | P2 | Template-based extraction |

### Ingestion Pipeline

```
Raw Input (PDF/CSV/Text)
    ↓
Format Detection
    ↓
Format-Specific Extraction
    ├── PDF → pdf-parse → raw text
    ├── CSV → csv-parse → structured rows
    └── Text → regex → key-value pairs
    ↓
Field Extraction
    ├── Direct: Explicit fields (name, SSN, role)
    ├── Computed: Calculated fields (totalHours = sum(daily))
    └── Inferred: Ambiguous fields (classification mapping)
    ↓
Normalization
    ├── Role aliases → Canonical DBWD classifications
    ├── Locality strings → Standard locality codes
    ├── Date formats → ISO 8601
    └── Currency → Decimal (no $, no commas)
    ↓
Validation
    ├── Required fields present?
    ├── Arithmetic checks (sum(daily) == total)
    ├── Range checks (hours < 168/week)
    └── Confidence thresholds
    ↓
WCPReport Output
    ├── Structured data
    ├── Extraction confidence scores
    ├── Gaps list (missing/ambiguous fields)
    └── Document hash (for versioning)
```

---

## Design Principles

### 1. Document Hashing and Versioning

Every raw document is hashed for audit:

```typescript
import { createHash } from 'crypto';

function hashDocument(content: Buffer): string {
  return createHash('sha256')
    .update(content)
    .digest('hex');
}

// Store in WCPReport
documentHash: 'a3f5c2...',  // First 8 chars shown: a3f5c2b7
```

This enables:
- Replay: Re-process exact same document
- Deduplication: Skip if hash matches
- Audit: Prove which document produced which decision

### 2. OCR as Fallback

**Primary path**: Direct text extraction (fast, accurate)
**Fallback path**: OCR (slower, handles scans)

```typescript
async function extractFromPDF(buffer: Buffer): Promise<string> {
  // Try direct extraction first
  let text = await pdfParse(buffer);
  
  // If low confidence, try OCR
  if (confidenceScore(text) < 0.8) {
    text = await tesseractOCR(buffer);
  }
  
  return text;
}
```

### 3. Explicit Gaps

Missing or ambiguous fields are surfaced, not defaulted:

```typescript
{
  extractionGaps: [
    'workerName: not found in document',
    'fringeRate: ambiguous ("$8.50" or "$9.00"?)',
    'signaturePresent: unscanned image, cannot verify'
  ]
}
```

Gaps trigger:
- Lower extraction confidence
- Potential human review flag
- LLM clarification request

### 4. Facts vs Inferences

Separate what was extracted from what was inferred:

```typescript
{
  extracted: {
    role: 'Wireman',  // Exact text from document
  },
  inferred: {
    classification: 'Electrician',  // Mapped via alias
    classificationSource: 'alias',  // How we got here
  }
}
```

---

## Extraction Confidence

### Scoring

Each field gets a confidence score (0-1):

| Confidence | Meaning | Action |
|------------|---------|--------|
| 0.95-1.0 | High confidence | Use directly |
| 0.80-0.94 | Medium confidence | Flag for review if critical field |
| 0.60-0.79 | Low confidence | Likely human review |
| < 0.60 | Very low | Require human, don't auto-process |

### Factors Affecting Confidence

```typescript
interface ConfidenceFactors {
  // OCR quality (if applicable)
  ocrConfidence?: number;  // Tesseract confidence
  
  // Text clarity
  fontLegibility?: number;
  scanQuality?: number;
  
  // Field-specific
  valueRecognized: boolean;  // Known role? Known locality?
  formatValid: boolean;      // Date parseable? Number valid?
  
  // Context
  surroundingContextClear: boolean;
  ambiguousAlternatives: string[];  // Other possible values
}
```

---

## Integration with Three-Layer Pipeline

Ingestion is the **entry point** to Layer 1:

```
Raw WCP Input
    ↓
┌─────────────────────────┐
│ INGESTION             │
│ - Parse format        │
│ - Extract fields      │
│ - Normalize           │
│ - Calculate gaps      │
└───────────┬───────────┘
            ↓
┌─────────────────────────┐
│ LAYER 1: Deterministic│
│ - Validate extracted    │
│ - Run compliance checks │
│ - Build DeterministicReport
└─────────────────────────┘
```

**Key Point**: Ingestion produces structured data; validation (Layer 1) checks compliance.

---

## Error Handling

### Extraction Errors

```typescript
try {
  const report = await ingestWCP(pdfBuffer);
} catch (error) {
  if (error instanceof FormatNotRecognizedError) {
    // Unknown file format
    return { status: 'REJECT', reason: 'Unsupported format' };
  }
  
  if (error instanceof ExtractionFailedError) {
    // OCR failed, parsing failed, etc.
    return { 
      status: 'PENDING_HUMAN', 
      reason: 'Could not extract data',
      rawDocument: hash  // For manual review
    };
  }
}
```

### Partial Extraction

When some fields extract, others don't:

```typescript
{
  employees: [
    {
      workerName: 'John Doe',  // ✅ Extracted
      role: 'Electrician',     // ✅ Extracted
      fringeRate: undefined,   // ❌ Not found
    }
  ],
  extractionGaps: [
    'Employee 1: fringeRate not found'
  ],
  extractionConfidence: 0.75,  // Lowered due to gaps
}
```

---

## Target Implementation Plan

### Phase 1: PDF Text Extraction (MVP)
- Library: `pdf-parse` (fast, accurate)
- Handle: Digital PDFs (most common)
- Skip: OCR for now (add as P1)

### Phase 2: CSV Ingestion
- Library: `csv-parse`
- Handle: Standardized CSV exports from payroll systems
- Map: Column names → WCPReport fields

### Phase 3: OCR (P1)
- Library: Tesseract.js (local) or cloud OCR
- Handle: Scanned PDFs, images
- Trigger: Low confidence from direct extraction

### Phase 4: Advanced Extraction (P2)
- Template matching for WH-347 forms
- Multi-page document handling
- Table extraction (employees as rows)

---

## Testing Strategy

### Unit Tests

Test each extraction function:

```typescript
describe('extractWCPData', () => {
  it('should extract from standard format', () => {
    const text = 'Role: Electrician, Hours: 40, Wage: 38.50';
    const result = extractWCPData(text);
    
    expect(result.role).toBe('Electrician');
    expect(result.hours).toBe(40);
    expect(result.wage).toBe(38.50);
  });
  
  it('should handle missing fields', () => {
    const text = 'Role: Electrician';  // Missing hours, wage
    const result = extractWCPData(text);
    
    expect(result.hours).toBe(0);  // Default
    expect(result.extractionGaps).toContain('hours: not found');
  });
});
```

### Integration Tests

Test end-to-end ingestion:

```typescript
describe('PDF ingestion', () => {
  it('should extract from sample WCP PDF', async () => {
    const pdfBuffer = await fs.readFile('test-wcp.pdf');
    const report = await ingestWCP(pdfBuffer);
    
    expect(report.employees).toHaveLength(3);
    expect(report.extractionConfidence).toBeGreaterThan(0.8);
  });
});
```

---

## Why This Matters

Quality ingestion determines downstream quality:

1. **Garbage in, garbage out**: Bad extraction → Bad decisions
2. **Compliance depends on data**: Missing SSN = Invalid submission
3. **Confidence calibration**: Extraction confidence feeds trust score
4. **Audit requirements**: Raw document hash proves what was reviewed

---

## Related Documentation

- [How to Add a Check](../development/how-to-add-check.md) — Adding validation after extraction
- [Layer 1 Implementation](../../src/pipeline/layer1-deterministic.ts) — Extraction code
- [Entity Data Model](../implementation/10-entity-data-model.md) — Full schema design
- [Retrieval and Context](./retrieval-and-context.md) — What happens after extraction
- [ADR-002: Hybrid Retrieval](../adrs/ADR-002-hybrid-retrieval.md) — Classification after extraction

---

**Last Updated**: 2026-04-17
