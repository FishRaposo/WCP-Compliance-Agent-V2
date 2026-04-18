# Security and Compliance

Status Label: Designed / Target

Security and compliance architecture for the WCP Compliance Agent, covering data handling, access control, audit trails, and regulatory requirements under the Davis-Bacon Act and related statutes.

---

## Purpose

Security ensures:
- **Data protection**: PII handled safely, encrypted in transit and at rest
- **Access control**: Role-based permissions, tenant isolation
- **Audit readiness**: Complete decision trails for regulatory inspection
- **Retention compliance**: 7-year record keeping per Copeland Act

---

## Current State

### Implementation

**Status**: Conceptual security posture, not production-ready

Current practices:
- ✅ Type-safe code (compile-time safety)
- ✅ Input validation (Zod schemas)
- ✅ No hardcoded secrets (env-based config)
- ✅ Error handling (no stack traces to user)
- 🔲 Encryption at rest (not implemented)
- 🔲 Authentication/authorization (not implemented)
- 🔲 Audit logging (partial - decision trails only)

### Current Limitations

```typescript
// Current: Basic error handling
if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured');
}

// Not yet implemented:
// - API key rotation
// - Request signing
// - Audit logging
// - PII masking
```

---

## Target Security Posture

### 1. Data Handling

#### PII Minimization

**Principle**: Collect only necessary PII, minimize model exposure

```typescript
// BEFORE: Full SSN sent to model
const wcpData = {
  ssn: '123-45-6789',  // ❌ Full SSN
  name: 'John Doe',
};

// AFTER: Masked identifiers
const wcpData = {
  ssnLast4: '6789',    // ✅ Last 4 only
  nameHash: 'a1b2c3...', // ✅ Hashed for correlation
  displayName: 'J. Doe', // ✅ Partial name
};
```

#### Encryption

| Data State | Target | Implementation |
|------------|--------|----------------|
| **In transit** | TLS 1.3 | Hono/Node.js TLS |
| **At rest** | AES-256 | PostgreSQL encryption |
| **Backups** | AES-256 | Cloud provider encryption |
| **Secrets** | Vault | HashiCorp Vault or AWS Secrets Manager |

### 2. Access Control

#### Role-Based Access Control (RBAC)

```typescript
interface Permissions {
  admin: ['wcp:submit', 'wcp:read', 'wcp:admin', 'system:config'];
  auditor: ['wcp:read', 'wcp:audit', 'reports:generate'];
  contractor: ['wcp:submit', 'wcp:read:own'];
  readonly: ['wcp:read'];
}
```

#### Tenant Isolation

```typescript
// Multi-tenant query with row-level security
const query = `
  SELECT * FROM wcp_reports
  WHERE tenant_id = current_setting('app.current_tenant')::UUID
  AND submitted_by = current_setting('app.current_user')::UUID
`;
```

#### API Authentication

```typescript
// JWT-based auth with short expiry
interface AuthToken {
  sub: string;        // User ID
  tenant: string;     // Tenant ID
  roles: string[];    // RBAC roles
  iat: number;        // Issued at
  exp: number;        // Expires (15 min)
}

// API key for service-to-service
interface ApiKey {
  keyId: string;
  tenant: string;
  permissions: string[];
  expiresAt: Date;
}
```

### 3. Compliance Operations

#### 7-Year Retention (Copeland Act)

```typescript
// Automated retention policy
interface RetentionPolicy {
  wcpReports: '7_years';
  auditTraces: '7_years';
  decisionLogs: '7_years';
  rawDocuments: '7_years';
  
  // After retention: soft delete → purge
  softDeleteAfter: '7_years';
  hardDeleteAfter: '7_years_90_days';
}
```

#### Audit-Ready Traces

Every decision includes:
```typescript
interface AuditTrail {
  traceId: string;
  timestamp: string;
  actor: {
    userId: string;
    tenantId: string;
    ipAddress: string;
    userAgent: string;
  };
  input: {
    documentHash: string;  // SHA-256
    extractedData: WCPInput;
  };
  processing: {
    corpusVersion: string;
    modelVersion: string;
    checksRun: string[];
    retrievalResults: RetrievalMetadata;
  };
  output: {
    decision: TrustScoredDecision;
    humanReviewRequired: boolean;
  };
}
```

#### Replay Capability

```typescript
// Re-run exact same decision
async function replayDecision(traceId: string): Promise<Decision> {
  const auditTrail = await loadAuditTrail(traceId);
  
  // Lock to historical corpus version
  const corpus = await loadCorpusVersion(auditTrail.processing.corpusVersion);
  
  // Re-run with exact same inputs
  const newDecision = await analyzeWCP({
    content: auditTrail.input.rawDocument,
    corpusVersion: auditTrail.processing.corpusVersion,
  });
  
  // Verify: newDecision should match auditTrail.output.decision
  return newDecision;
}
```

---

## Regulatory Compliance

### Davis-Bacon Act (40 U.S.C. §§ 3141-3144)

**Requirement**: Prevailing wage enforcement
**Implementation**:
- Deterministic rate validation
- DBWD rate versioning
- Effective date tracking

```typescript
// Rate validation with effective date check
function validatePrevailingWage(
  wage: number,
  role: string,
  locality: string,
  workDate: Date
): CheckResult {
  const rate = getRateForDate(role, locality, workDate);
  
  return {
    passed: wage >= rate.baseRate,
    regulation: '40 U.S.C. § 3142(a)',
    details: {
      applicableWD: rate.wdNumber,
      effectiveDate: rate.effectiveDate,
    },
  };
}
```

### Copeland Act (40 U.S.C. § 3145)

**Requirement**: Anti-kickback, record retention
**Implementation**:
- 7-year record retention
- Immutable audit trails
- Employee-level pay tracking

### 29 CFR 5.5(a)

**Requirement**: Weekly payrolls, certified statements
**Implementation**:
- WH-347 form validation
- Signature verification
- Weekly cadence enforcement

---

## Security Checklist

### Data Protection

- [ ] PII masking (SSN last-4 only)
- [ ] Encryption at rest (PostgreSQL)
- [ ] Encryption in transit (TLS 1.3)
- [ ] Secret management (Vault)
- [ ] Backup encryption

### Access Control

- [ ] JWT authentication
- [ ] RBAC authorization
- [ ] Tenant isolation
- [ ] API rate limiting
- [ ] Session management

### Audit & Compliance

- [ ] 7-year retention policy
- [ ] Immutable audit trails
- [ ] Decision replay capability
- [ ] Regulatory citations
- [ ] Corpus versioning

### Infrastructure

- [ ] Network segmentation
- [ ] Container security
- [ ] Dependency scanning
- [ ] Vulnerability management
- [ ] Incident response plan

---

## Compliance Testing

### Audit Trail Verification

```typescript
describe('Audit Compliance', () => {
  it('should include all required fields', async () => {
    const decision = await analyzeWCP({ content: '...' });
    
    expect(decision.traceId).toBeDefined();
    expect(decision.deterministic.checks[0].regulation).toMatch(/\d+ U\.S\.C\. § \d+/);
    expect(decision.timestamp).toBeValidISO8601();
  });
  
  it('should support 7-year replay', async () => {
    const oldDecision = await loadDecision('wcp-2019-001');
    const replayed = await replayDecision('wcp-2019-001');
    
    expect(replayed.finalStatus).toBe(oldDecision.finalStatus);
    expect(replayed.deterministic.checks).toEqual(oldDecision.deterministic.checks);
  });
});
```

---

## Why This Matters

A compliance agent must be compliant itself:

1. **Legal liability**: Mishandled PII = fines, lawsuits
2. **Regulatory audit**: DOL can demand 7 years of records
3. **Trust**: Customers trust systems that protect their data
4. **Defense**: Audit trails prove compliance in disputes

---

## Related Documentation

- [Traceability Matrix](../compliance/traceability-matrix.md) — Regulation-to-code mapping
- [Regulatory Compliance Report](../compliance/regulatory-compliance-report.md) — Full compliance overview
- [ADR-005: Three-Layer Architecture](../adrs/ADR-005-decision-architecture.md) — Audit trail design
- [Implementation Guide](../compliance/implementation-guide.md) — Compliance implementation

---

**Last Updated**: 2026-04-17
