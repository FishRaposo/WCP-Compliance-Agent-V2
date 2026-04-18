# Human Review Workflow

Status Label: Implemented

How low-trust compliance decisions are escalated to human reviewers, tracked, and resolved.

---

## Overview

The WCP Compliance Agent's three-layer decision pipeline produces decisions with **trust scores**. When trust is low (< 0.60) or when there's disagreement between layers, the decision is **blocked from auto-approval** and queued for **human review**.

This document describes:
1. When human review is triggered
2. The review queue mechanics
3. Reviewer UX and decision options
4. Audit trail for human overrides
5. Implementation (stub → production)

---

## When Human Review is Required

### Automatic Triggers

| Condition | Trust Band | Action |
|-----------|-----------|--------|
| `trust < 0.60` | require_human | **Blocking**: Auto-approval prevented, must await human review |
| `agreementScore === 0` | require_human | **Blocking**: LLM verdict contradicts deterministic findings |
| `trust 0.60–0.84` | flag_for_review | **Advisory**: Auto-decide but queue for optional review |
| Manual flag | require_human | User/operator explicitly requests human review |

### Examples

**Example 1: Low Trust (Blocking)**
```typescript
{
  trust: { score: 0.45, band: "require_human" },
  humanReview: { required: true, status: "pending" },
  finalStatus: "Pending Human Review"  // Decision NOT issued yet
}
```

**Example 2: Flagged (Advisory)**
```typescript
{
  trust: { score: 0.72, band: "flag_for_review" },
  humanReview: { required: true, status: "pending" },
  finalStatus: "Revise"  // Decision issued, but flagged for later review
}
```

**Example 3: Agreement Override**
```typescript
{
  trust: { score: 0.78, band: "require_human", reasons: ["LLM approved but critical check failed"] },
  humanReview: { required: true, status: "pending" },
  finalStatus: "Pending Human Review"  // Blocked despite moderate trust
}
```

---

## Review Queue Lifecycle

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Enqueued      │────▶│   Pending       │────▶│   Reviewed      │
│  (auto or flag) │     │  (awaiting      │     │  (approved/     │
│                 │     │   reviewer)     │     │   rejected)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Escalated     │
                       │  (complex case   │
                       │   needs expert) │
                       └─────────────────┘
```

### States

| State | Description | Transitions |
|-------|-------------|-------------|
| `not_required` | Trust high enough, no review needed | → `pending` (if manually flagged) |
| `pending` | In queue awaiting reviewer | → `approved`, `rejected`, `escalated` |
| `approved` | Human reviewer approved the decision | Terminal |
| `rejected` | Human reviewer rejected/overrode the decision | Terminal |
| `escalated` | Needs specialist (legal/compliance expert) | → `approved` or `rejected` by expert |

---

## Review Queue Interface

### Data Model

```typescript
interface ReviewQueueItem {
  // Identity
  traceId: string;                    // Links to TrustScoredDecision
  queuedAt: string;                     // ISO timestamp
  priority: "low" | "normal" | "high" | "critical";
  
  // Source decision (snapshot)
  decision: TrustScoredDecision;      // Full decision at time of enqueue
  
  // Review state
  status: "pending" | "approved" | "rejected" | "escalated";
  assignedTo?: string;                // Reviewer ID
  startedAt?: string;                 // When reviewer opened it
  completedAt?: string;               // When reviewer submitted
  
  // Review outcome
  reviewerDecision: "Approved" | "Revise" | "Reject" | "override_to_approved" | "override_to_reject";
  reviewerNotes?: string;             // Free-form explanation
  overrideReason?: string;            // Required if overriding system
  
  // Audit
  auditTrail: ReviewAuditEvent[];
}

interface ReviewAuditEvent {
  timestamp: string;
  actor: string;                      // "system" or reviewer ID
  action: "enqueued" | "assigned" | "viewed" | "decided" | "escalated";
  details: Record<string, unknown>;
}
```

### Service Interface

```typescript
interface HumanReviewQueue {
  // Enqueue a decision for review
  enqueue(decision: TrustScoredDecision): Promise<ReviewQueueItem>;
  
  // List pending items (for reviewer dashboard)
  listPending(options?: {
    priority?: "low" | "normal" | "high" | "critical";
    assignedTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<ReviewQueueItem[]>;
  
  // Get specific item details
  get(traceId: string): Promise<ReviewQueueItem | null>;
  
  // Assign item to reviewer
  assign(traceId: string, reviewer: string): Promise<ReviewQueueItem>;
  
  // Submit reviewer decision
  submitReview(
    traceId: string,
    decision: "Approved" | "Revise" | "Reject" | "override_to_approved" | "override_to_reject",
    reviewer: string,
    notes?: string
  ): Promise<ReviewQueueItem>;
  
  // Escalate to specialist
  escalate(traceId: string, reason: string, escalatedBy: string): Promise<ReviewQueueItem>;
  
  // Stats/metrics
  getStats(): Promise<{
    pendingCount: number;
    avgTimeToReview: number;
    byPriority: Record<string, number>;
  }>;
}
```

---

## Reviewer UX

### Review Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│ Human Review Queue                              [Filter ▼] [Sort ▼] │
├─────────────────────────────────────────────────────────────────────┤
│ Priority │ Trace ID         │ Worker    │ Issue         │ Age    │
│──────────┼──────────────────┼───────────┼───────────────┼────────│
│ 🔴 HIGH  │ wcp-2024-001-045 │ Electrician│ Underpayment  │ 2h     │
│ 🟡 NORM  │ wcp-2024-001-044 │ Laborer   │ Overtime err  │ 4h     │
│ 🟡 NORM  │ wcp-2024-001-043 │ Plumber   │ Low trust     │ 6h     │
└─────────────────────────────────────────────────────────────────────┘
```

### Review Detail View

```
┌─────────────────────────────────────────────────────────────────────┐
│ Review: wcp-2024-001-045                                   [Escalate]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ TRUST ANALYSIS                                                       │
│ Score: 0.45 (Low) │ Band: require_human                            │
│ Reasons:                                                             │
│ • Classification confidence low (0.30 - unknown role "Wire Tech")   │
│ • Deterministic check error (DBWD lookup failed)                    │
│ • LLM self-confidence low (0.50)                                    │
│                                                                      │
│ DETERMINISTIC FINDINGS                                               │
│ ❌ Base Wage: $35.50 (expected $38.50) - UNDERPAYMENT $120         │
│ ✅ Overtime: Correctly calculated at 1.5× base                     │
│ ⚠️  Classification: "Wire Tech" → unknown (no match found)         │
│                                                                      │
│ LLM VERDICT                                                          │
│ Status: Revise                                                       │
│ Rationale: Worker appears underpaid based on pre-computed check...  │
│ Referenced checks: ["base_wage_check_001"]                          │
│                                                                      │
│ REVIEWER DECISION                                                    │
│ [○] Approve system decision (Revise)                               │
│ [○] Override → Approved                                              │
│ [○] Override → Rejected                                              │
│                                                                      │
│ Notes: ____________________________________________________________ │
│                                                                      │
│              [Cancel]                                    [Submit]    │
└─────────────────────────────────────────────────────────────────────┘
```

### Reviewer Decision Options

| Option | When to Use | Effect |
|--------|-------------|--------|
| **Approve system decision** | Agree with system's verdict | Final status = system's verdict |
| **Override → Approved** | System said Reject/Revise but actually OK | Final status = Approved, logged as override |
| **Override → Rejected** | System said Approved but actually violation | Final status = Rejected, logged as override |
| **Escalate** | Uncertain, needs legal/compliance expert | Moves to escalation queue |

### Override Requirements

Any **override** (disagreeing with system verdict) requires:
1. **Override reason** (selected from list):
   - "Classification was actually correct"
   - "Wage rate exception applies (apprentice/trainee)"
   - "Hours calculation different in context"
   - "Other (explain in notes)"
2. **Free-form notes** explaining rationale
3. **Reviewer identity** (authenticated user)

**Audit impact**: Overrides are flagged in compliance reports for auditor review.

---

## Priority Assignment

Items are auto-prioritized on enqueue:

| Condition | Priority | Target Time to Review |
|-----------|----------|----------------------|
| Critical check failure + LLM approved (severe disagreement) | `critical` | < 1 hour |
| Underpayment > $500 | `high` | < 4 hours |
| Trust < 0.40 | `high` | < 4 hours |
| Standard low trust | `normal` | < 24 hours |
| Advisory flag (trust 0.60–0.84) | `low` | < 72 hours |

---

## Audit Trail

Every review action is logged:

```typescript
// Example audit trail
[
  {
    timestamp: "2026-04-17T09:23:45Z",
    actor: "system",
    action: "enqueued",
    details: { trustScore: 0.45, band: "require_human" }
  },
  {
    timestamp: "2026-04-17T10:15:22Z",
    actor: "reviewer_001",
    action: "assigned",
    details: { fromQueue: "pending" }
  },
  {
    timestamp: "2026-04-17T10:22:07Z",
    actor: "reviewer_001",
    action: "decided",
    details: {
      reviewerDecision: "Approved",
      overrideReason: "Wage rate exception applies - approved apprentice program",
      notes: "Worker is enrolled in DOL-approved apprentice program per 29 CFR 5.2"
    }
  }
]
```

**Regulatory compliance**: Full record satisfies Copeland Act (40 U.S.C. § 3145) record-keeping requirements.

---

## Implementation Phases

### Phase 01 (Current): Stub Implementation

**Purpose**: Validate interface design, support testing

**Storage**: In-memory queue + JSON file persistence

**Scope**:
- `enqueue()`, `listPending()`, `get()`
- `submitReview()` with basic validation
- No authentication (single "reviewer" mode)
- JSON file audit log

**Limitations**:
- Data lost on restart (unless JSON persisted)
- No concurrent access safety
- No reviewer dashboard UI

**Code**: `src/services/human-review-queue.ts` (stub class)

### Phase 02 (MVP): PostgreSQL Backend

**Purpose**: Production persistence, 7-year retention

**Schema**:
```sql
CREATE TABLE review_queue (
  trace_id VARCHAR(50) PRIMARY KEY,
  queued_at TIMESTAMP NOT NULL,
  priority VARCHAR(10) NOT NULL,
  decision_snapshot JSONB NOT NULL,
  status VARCHAR(20) NOT NULL,
  assigned_to VARCHAR(50),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  reviewer_decision VARCHAR(20),
  reviewer_notes TEXT,
  override_reason VARCHAR(100),
  audit_trail JSONB NOT NULL
);

CREATE INDEX idx_review_status ON review_queue(status);
CREATE INDEX idx_review_priority ON review_queue(priority, queued_at);
```

**Features**:
- Multi-reviewer support
- Concurrent access safe
- 7-year retention with archival
- Admin dashboard API

### Phase 03 (Showcase): Reviewer Dashboard UI

**Purpose**: Demonstrate human oversight capability

**Features**:
- Web UI for review queue
- Real-time notifications
- Mobile-responsive
- Demo reviewer login (showcase mode)

---

## Integration with Decision Pipeline

### Enqueue Point

```typescript
// src/pipeline/orchestrator.ts
export async function generateWcpDecision(input: WCPInput): Promise<TrustScoredDecision> {
  // ... layers 1, 2, 3 ...
  
  const decision = await layer3TrustScore(report, verdict);
  
  // Enqueue if human review required
  if (decision.trust.band === "require_human" || decision.trust.band === "flag_for_review") {
    await humanReviewQueue.enqueue(decision);
  }
  
  return decision;
}
```

### Final Status Resolution

```typescript
// When reviewer submits decision
const reviewed = await humanReviewQueue.submitReview(traceId, decision, reviewer, notes);

// Final status depends on review outcome
const finalStatus = reviewed.status === "approved" 
  ? reviewed.reviewerDecision  // Override applied
  : decision.verdict.status;     // Original verdict stands
```

---

## Metrics & SLAs

### Operational Metrics

| Metric | Target | Alert If |
|--------|--------|----------|
| Pending queue depth | < 50 | > 100 |
| Time to review (critical) | < 1 hour | > 2 hours |
| Time to review (high) | < 4 hours | > 8 hours |
| Override rate | < 10% | > 20% (calibration issue) |
| Escalation rate | < 5% | > 10% (training issue) |

### Quality Metrics

| Metric | Target | Meaning |
|--------|--------|---------|
| Overturn rate | < 5% | % of system decisions overturned by reviewers |
| False negative catch rate | > 95% | % of actual violations caught by system or review |
| Reviewer agreement | > 80% | Inter-reviewer agreement on edge cases |

---

## Error Handling

### Queue Unavailable

If review queue service is down:
1. **Log decision** to local audit trail
2. **Alert operations** (queue unhealthy)
3. **Fail-safe**: Treat all decisions as `require_human`, pause auto-approval

### Review Timeout

If reviewer doesn't respond within SLA:
1. **Escalate** to supervisor queue
2. **Alert** secondary reviewer
3. **Auto-escalate** to "escalated" state after 2× SLA

### Concurrent Review Collision

If two reviewers claim same item:
1. **First wins**, second gets "already assigned" error
2. **Or**: Implement locking at `assign()` time

---

## Regulatory Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Copeland Act (40 U.S.C. § 3145)** | Full audit trail of every review decision |
| **29 CFR 5.5(a)(3)** | Suspect cases escalated, not auto-approved |
| **Due diligence** | Human review demonstrates reasonable care |
| **Non-discrimination** | Priority system treats all cases consistently |
| **Record retention** | 7-year retention in Phase 02+ |

---

## Source Code

- `src/types/decision-pipeline.ts` — `HumanReview` type definition
- `src/services/human-review-queue.ts` — Queue service (stub → impl)
- `src/pipeline/orchestrator.ts` — Integration point
- `tests/unit/human-review-queue.test.ts` — Service tests

---

## Related Documents

- `docs/architecture/decision-architecture.md` — Three-layer doctrine
- `docs/architecture/trust-scoring.md` — Trust score formula and thresholds
- `docs/adrs/ADR-005-decision-architecture.md` — Original decision record
- `docs/compliance/traceability-matrix.md` — Audit trail requirements mapping
