# Documentation Roadmap

Status Label: Implemented

This document governs how the WCP Compliance Agent documentation is maintained, updated, and expanded.

---

## Documentation as Source of Truth

The documentation system guides implementation in this order:

1. **`foundation/current-state.md`** — What exists now
2. **`foundation/implemented-vs-target.md`** — Gap analysis
3. **`architecture/*`** — How the system works
4. **`evaluation/*`** — How we verify quality
5. **`roadmap/*`** — Where we're going

---

## Status Label Taxonomy

Every document must have a `Status Label:` line near the top:

| Label | Use When | Example |
|-------|----------|---------|
| **Implemented** | Fully working with real data | Three-layer pipeline |
| **Structurally Implemented, Data Stubbed** | Code exists, uses hardcoded/mock data | Human review queue |
| **Designed / Target** | Documented, not yet coded | Hybrid retrieval |
| **Planned / Future** | Aspirational, no design lock | Mobile app |

---

## Documentation Structure

```
docs/
├── INDEX.md                    # Entry point, reading paths
├── quick-start.md              # 5-minute setup
├── FAQ.md                      # Common questions
├── foundation/                 # Source of truth
│   ├── current-state.md        # What's implemented now
│   ├── implemented-vs-target.md  # Current vs target
│   ├── tech-stack-map.md       # Technology choices
│   ├── glossary.md             # Terminology
│   └── wcp-and-dbwd-reference.md   # Domain reference
├── architecture/               # System architecture
│   ├── system-overview.md      # High-level view
│   ├── decision-architecture.md  # Three-layer pipeline
│   ├── trust-scoring.md        # Trust formula
│   ├── human-review-workflow.md  # Queue and workflow
│   └── ...                     # Other architectural topics
├── adrs/                       # Architecture Decision Records
│   ├── README.md               # ADR index
│   ├── ADR-001-*.md            # Framework choice
│   ├── ADR-002-*.md            # Retrieval architecture
│   ├── ADR-003-*.md            # Validation strategy
│   └── ADR-005-*.md            # Three-layer pipeline
├── compliance/                 # Regulatory compliance
│   ├── regulatory-compliance-report.md
│   ├── traceability-matrix.md
│   └── implementation-guide.md
├── evaluation/                 # Testing & quality
│   ├── evaluation-strategy.md
│   ├── quality-bar.md
│   ├── release-gates.md
│   └── adversarial-cases.md
├── implementation/             # Target stack guides
│   ├── INDEX.md
│   ├── 01-warehouse-redshift.md
│   ├── 02-search-elasticsearch.md
│   ├── ...
│   └── 10-entity-data-model.md
├── roadmap/                    # Planning & milestones
│   ├── README.md               # Roadmap index + next actions
│   ├── executive-summary.md    # Strategic overview
│   ├── platform-roadmap.md     # Capability roadmap
│   ├── milestones.md           # 90-day plan
│   ├── documentation-roadmap.md  # This file
│   ├── phase-01-scaffolding.md
│   ├── phase-02-mvp.md
│   ├── phase-03-showcase.md
│   └── phase-05-post-launch.md
├── showcase/                   # Recruiter-facing
│   ├── showcase-overview.md
│   ├── case-study.md
│   ├── founding-ai-infra-fit.md
│   ├── scenario-catalog.md
│   └── demo-walkthrough.md
└── development/                # Contributor guides
    ├── README.md
    ├── contributor-guide.md
    ├── dev-environment.md
    ├── how-to-add-check.md
    └── how-to-add-adr.md
```

---

## Cross-Reference Conventions

### Internal Links

Use relative paths from the current file:

```markdown
# Same directory
[Other doc](./other-doc.md)

# Parent directory
[Parent](../parent-doc.md)

# Sibling directory
[Sibling](../sibling/file.md)

# Root docs
[Root](../../README.md)
```

### Code References

Always use absolute paths with backticks:

```markdown
See `src/pipeline/layer1-deterministic.ts` for implementation.
The orchestrator is in `src/pipeline/orchestrator.ts`.
```

### ADR References

Link to ADRs from architecture docs:

```markdown
See [ADR-005: Three-Layer Decision Architecture](../adrs/ADR-005-decision-architecture.md)
for the architectural decision.
```

---

## Writing Guidelines

### Tone

- **Honest about status**: Don't claim "Implemented" if data is stubbed
- **Technical but accessible**: Assume engineering audience
- **Action-oriented**: Include next steps, not just theory

### Structure

- Start with `Status Label:`
- Use H2 (`##`) for major sections
- Include code examples where relevant
- End with cross-references to related docs

### Terminology

Be consistent:

| Term | Meaning |
|------|---------|
| WCP | Weekly Certified Payroll |
| DBWD | Davis-Bacon Wage Determination |
| Layer 1 | Deterministic scaffold |
| Layer 2 | LLM verdict |
| Layer 3 | Trust score + human review |

### Citations

Use regulation citation format:

- Statutes: `40 U.S.C. § 3142(a)`
- CFR: `29 CFR 5.5(a)(3)(i)`
- Forms: `WH-347`

---

## Maintenance Rules

### Rule 1: Update current-state.md First

When code changes:
1. Update `foundation/current-state.md`
2. Update `foundation/implemented-vs-target.md`
3. Then update other docs

### Rule 2: Status Labels Must Match Reality

- If you implement something, mark it "Implemented"
- If you stub it, mark it "Structurally Implemented, Data Stubbed"
- If it's just a design, mark it "Designed / Target"

### Rule 3: Check Cross-References

When moving/renaming files:
1. Use `grep` to find all references
2. Update all links
3. Verify with `grep` again

### Rule 4: Review Cadence

| Document | Review Frequency |
|----------|------------------|
| `current-state.md` | After every significant change |
| `INDEX.md` | When structure changes |
| Phase docs | At phase boundaries |
| ADRs | Never (immutable history) |

---

## Future Documentation Additions

Potential additions (not yet scheduled):

- [ ] Runbooks for replay and incident handling
- [ ] Corpus maintenance guide
- [ ] Eval dataset guide
- [ ] Deployment environment guide
- [ ] API changelog
- [ ] Migration guides (if we have versions)

---

## Maintenance Rule

When code starts expanding again, `current-state.md` and `implemented-vs-target.md` must be updated first so the public story stays truthful.

---

**Last Updated**: 2026-04-17

