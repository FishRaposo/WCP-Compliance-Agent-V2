# How to Add an Architecture Decision Record (ADR)

Status Label: Implemented

Step-by-step guide for documenting architectural decisions.

---

## When to Write an ADR

Write an ADR when you:
- Change a significant technology or framework
- Modify the three-layer pipeline structure
- Change the trust scoring formula
- Alter database or infrastructure choices
- Make any decision that affects >2 files

**Don't write an ADR for**:
- Bug fixes
- Minor refactors
- Adding a new validation check (document in code)
- Documentation updates

---

## ADR Lifecycle

```
Proposed → Review → Accepted → Implemented
   ↓          ↓         ↓           ↓
  Write     Discuss   Merge      Code merged
  Draft     in PR     to main    to main
```

---

## Step-by-Step

### Step 1: Create the ADR File

**File naming**: `docs/adrs/ADR-XXX-short-description.md`

- Use sequential numbers (ADR-006, ADR-007, etc.)
- Use kebab-case for description
- Example: `ADR-006-rate-sync-strategy.md`

**Template**:

```markdown
# ADR-XXX: [Title]

Status: **Proposed**

Date: [Month Year]

## Context

[What is the problem? What are the forces at play?]

## Decision

[What did we decide? Be specific.]

## Consequences

### Positive
- [...]

### Negative
- [...]

### Risks
- [...]

## Alternatives Considered

### [Option A]
[Description]

**Verdict**: [Accepted/Rejected] — [Reason]

### [Option B]
[Description]

**Verdict**: [Accepted/Rejected] — [Reason]

## Implementation

[Code examples, file references]

## Status

- **Proposed**: [Date]
- **Accepted**: [Date]
- **Last reviewed**: [Date]
```

---

### Step 2: Write the Content

#### Context Section

Explain:
- The problem you're solving
- Current limitations
- Business/technical drivers
- Constraints (time, cost, complexity)

**Example**:
```markdown
## Context

We need to automate DBWD rate synchronization. Currently:
- Rates are hardcoded for 2 roles (Electrician, Laborer)
- Manual updates are error-prone
- SAM.gov publishes new rates quarterly

Drivers:
- Need 10+ roles for realistic demos
- Must comply with current wage determinations
- Should not require manual intervention

Constraints:
- SAM.gov API is free but rate-limited
- Must maintain audit trail of rate changes
- Should work offline (cached rates)
```

#### Decision Section

Be specific:
- What technology/approach
- Key configuration choices
- Integration points

**Example**:
```markdown
## Decision

We will implement automated rate synchronization:

1. **Source**: SAM.gov Wage Determination API
2. **Frequency**: Daily check for updates
3. **Storage**: PostgreSQL with version history
4. **Caching**: Redis for offline operation
5. **Trigger**: Background job + manual refresh endpoint

Configuration:
```typescript
{
  source: 'sam-gov-api',
  syncInterval: '24h',
  cacheTtl: '7d',
  retention: '2y' // Keep 2 years of rate history
}
```
```

#### Consequences Section

Be honest about tradeoffs:

**Example**:
```markdown
## Consequences

### Positive
- Always current wage rates
- Audit trail for rate changes
- Works offline with cached rates
- No manual updates needed

### Negative
- Adds infrastructure (Redis, background jobs)
- SAM.gov API dependency
- Complexity in rate conflict resolution
- More database storage for history

### Risks
- SAM.gov API changes or downtime
- Rate calculation errors in automation
- Cache staleness if sync fails
```

#### Alternatives Section

Show you considered options:

**Example**:
```markdown
## Alternatives Considered

### Manual rate updates
- Admin manually enters rates via UI
- Simple, no infrastructure
- Error-prone, doesn't scale

**Verdict**: Rejected — doesn't solve the problem

### Static rate files
- Check JSON/CSV files into repo
- Version controlled, simple
- Requires code deploys for updates

**Verdict**: Rejected — too slow for quarterly updates

### Third-party wage service
- Paid API for wage data
- High accuracy
- Costs $500+/month

**Verdict**: Rejected — cost prohibitive for showcase
```

---

### Step 3: Update the ADR Index

**File**: `docs/adrs/README.md`

Add your ADR to the table:

```markdown
| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](ADR-001-mastra-over-langchain.md) | ... | ✅ Accepted | Jan 2024 |
| [ADR-002](ADR-002-hybrid-retrieval.md) | ... | ✅ Accepted | Jan 2024 |
| ... | ... | ... | ... |
| [ADR-006](ADR-006-rate-sync-strategy.md) | Rate Sync Strategy | 🔄 Proposed | Apr 2026 |
```

---

### Step 4: Update Cross-References

Link from relevant docs:

**In architecture docs**:
```markdown
See [ADR-006: Rate Sync Strategy](../adrs/ADR-006-rate-sync-strategy.md)
for synchronization approach.
```

**In implementation docs**:
```markdown
As decided in [ADR-006](../adrs/ADR-006-rate-sync-strategy.md),
we use SAM.gov API with Redis caching.
```

**In code comments**:
```typescript
// See ADR-006: Rate sync strategy
// https://github.com/.../ADR-006-rate-sync-strategy.md
```

---

### Step 5: Update INDEX.md

**File**: `docs/INDEX.md`

Add to Architecture Decisions section:

```markdown
- [`adrs/ADR-006-rate-sync-strategy.md`](./adrs/ADR-006-rate-sync-strategy.md) - Rate synchronization
```

---

### Step 6: Review Process

1. **Self-review**: Check against checklist below
2. **Submit PR**: With "adr" label
3. **Address feedback**: Update based on review
4. **Change status**: Update to "Accepted" when merged

---

## ADR Checklist

Before submitting:

- [ ] File named correctly (`ADR-XXX-description.md`)
- [ ] Status is "Proposed"
- [ ] Context explains the problem clearly
- [ ] Decision is specific and actionable
- [ ] Consequences include positives AND negatives
- [ ] At least 2 alternatives considered
- [ ] Verdicts explain why rejected/accepted
- [ ] Implementation section has code examples
- [ ] Added to `adrs/README.md` index
- [ ] Cross-referenced from relevant docs
- [ ] Added to `INDEX.md`
- [ ] No typos or broken links

---

## Example: Complete ADR

Here's a full example: **ADR-006: Rate Synchronization Strategy**

```markdown
# ADR-006: Rate Synchronization Strategy

Status: **Proposed**

Date: April 2026

## Context

We need to automate DBWD rate synchronization. Currently:
- Rates are hardcoded for 2 roles (Electrician, Laborer)
- Manual updates are error-prone
- SAM.gov publishes new rates quarterly
- We need 10+ roles for realistic demos

Constraints:
- SAM.gov API is free but rate-limited (1000 requests/day)
- Must maintain audit trail of rate changes
- Should work offline (cached rates)
- Showcase budget limits paid services

## Decision

We will implement automated rate synchronization:

1. **Source**: SAM.gov Wage Determination API
2. **Frequency**: Daily check for updates at 6 AM UTC
3. **Storage**: PostgreSQL with rate_history table
4. **Caching**: Redis for offline operation (7-day TTL)
5. **Trigger**: Background cron job + manual refresh endpoint

Architecture:
```
SAM.gov API
    ↓ (daily sync)
Rate Sync Service
    ↓
PostgreSQL (rates + history)
    ↓ (on demand)
Redis Cache
    ↓
Validation Layer
```

Implementation:
```typescript
interface RateSyncConfig {
  source: 'sam-gov-api';
  apiKey: string; // From env
  syncInterval: '24h';
  cacheTtl: '7d';
  retention: '2y';
}

interface RateHistoryEntry {
  wdId: string; // SAM.gov WD number
  role: string;
  baseRate: number;
  fringeRate: number;
  effectiveDate: Date;
  importedAt: Date;
  sourceUrl: string;
}
```

## Consequences

### Positive
- Always current wage rates (no manual updates)
- Complete audit trail for compliance
- Works offline with cached rates
- Scales to all 50 states

### Negative
- Adds infrastructure complexity (Redis, background jobs)
- SAM.gov API dependency (single point of failure)
- Rate conflict resolution logic needed
- More database storage for 2-year history

### Risks
| Risk | Mitigation |
|------|------------|
| SAM.gov API changes | Versioned API client, alerts on failures |
| Rate calculation errors | Validation layer, golden set testing |
| Cache staleness | Health checks, fallback to DB |
| Sync job failures | Dead letter queue, manual retry |

## Alternatives Considered

### Manual rate updates
Admin manually enters rates via admin UI.

**Pros**: Simple, no infrastructure needed.
**Cons**: Error-prone, doesn't scale, requires ongoing effort.

**Verdict**: Rejected — doesn't solve the core problem.

### Static rate files
Check JSON/CSV wage files into the repo.

**Pros**: Version controlled, simple, no external dependencies.
**Cons**: Requires code deploys for updates, stale rates between deploys.

**Verdict**: Rejected — too slow for quarterly rate updates.

### Third-party wage service
Subscribe to a commercial wage data service.

**Pros**: High accuracy, well-maintained, support.
**Cons**: Costs $500+/month, vendor lock-in, overkill for showcase.

**Verdict**: Rejected — cost prohibitive for portfolio project.

## Implementation

Files to create/modify:
- `src/services/rate-sync.ts` — Sync service
- `src/services/sam-gov-client.ts` — API client
- `src/jobs/rate-sync-job.ts` — Background job
- `src/api/rate-admin.ts` — Manual refresh endpoint

Testing:
- Unit tests for sync logic
- Mock SAM.gov client for offline tests
- Integration tests for end-to-end flow

## Status

- **Proposed**: April 2026
- **Accepted**: [Pending PR review]
- **Implemented**: [Not yet]
- **Last reviewed**: April 2026
```

---

## After Acceptance

Once merged:
1. Update status to "Accepted"
2. Update date of acceptance
3. Create implementation issue/PR
4. Link ADR in code comments

**ADR is immutable history** — don't edit after acceptance. If the decision changes, write a new ADR that supersedes this one.

---

## Questions?

- **What needs an ADR?** — Changes affecting >2 files or core architecture
- **How detailed?** — Enough for someone to implement without asking questions
- **Can I change it later?** — No, write a new ADR that supersedes

---

**Last Updated**: 2026-04-17
