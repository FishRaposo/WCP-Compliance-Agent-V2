# Contributor Guide

Status Label: Implemented

How to contribute to the WCP Compliance Agent. This guide covers workflow, conventions, and the self-review checklist.

---

## Development Workflow

### 1. Before You Start

- Read [current-state.md](../foundation/current-state.md) — know what's implemented
- Read [decision-architecture.md](../architecture/decision-architecture.md) — understand constraints
- Check [todo.md](../../todo.md) — see what's prioritized

### 2. Branch Strategy (Solo + AI)

Even as a solo developer with AI assistance, use branches:

```bash
# Main branch is always deployable
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/three-layer-pipeline

# Work, commit, push
git add .
git commit -m "feat: add trust score computation"
git push origin feature/three-layer-pipeline

# Merge when done
git checkout main
git merge feature/three-layer-pipeline
git push origin main
```

**Branch naming**:
- `feature/*` — New functionality
- `fix/*` — Bug fixes
- `docs/*` — Documentation updates
- `refactor/*` — Code restructuring

### 3. Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation only
- `refactor` — Code change that neither fixes nor adds
- `test` — Adding or updating tests
- `chore` — Maintenance, dependencies, etc.

**Scopes** (examples):
- `pipeline` — Three-layer pipeline
- `trust` — Trust scoring
- `layer1` — Deterministic layer
- `layer2` — LLM verdict
- `layer3` — Trust score
- `docs` — Documentation

**Examples**:
```bash
feat(pipeline): add human review queue stub

fix(layer1): correct overtime calculation for fringe benefits

docs(adr): add ADR-005 for three-layer architecture

refactor(trust): extract trust component types

test(calibration): add golden set for underpayment cases
```

---

## Self-Review Checklist

Before considering work complete, verify:

### Code Quality

- [ ] **TypeScript compiles**: `npm run build` passes
- [ ] **Pipeline lint passes**: `npm run lint:pipeline` passes
- [ ] **Tests pass**: `npm test` passes
- [ ] **No secrets**: No API keys, passwords in code
- [ ] **Error handling**: Errors caught and handled gracefully

### Architecture Compliance

- [ ] **ADR-005 followed**: Three-layer pipeline structure maintained
- [ ] **No layer bypassing**: All decisions flow through L1 → L2 → L3
- [ ] **Health metrics**: `TrustScoredDecision.health` populated
- [ ] **Regulatory citations**: Every check cites regulation
- [ ] **Check IDs**: Unique IDs for each deterministic check

### Testing

- [ ] **Unit tests**: New code has unit tests
- [ ] **Integration tests**: End-to-end scenarios covered
- [ ] **Edge cases**: Boundary conditions tested
- [ ] **Mock mode**: Works without API calls when OPENAI_API_KEY is set to 'mock', 'mock-key', or empty

### Documentation

- [ ] **current-state.md**: Updated if implementation changed
- [ ] **implemented-vs-target.md**: Updated if target changed
- [ ] **JSDoc**: Functions have JSDoc with regulation citations
- [ ] **Cross-references**: No broken links

---

## Code Review Checklist

Use this when reviewing your own work (or AI-generated code):

### Function Level

- [ ] Does it do one thing well?
- [ ] Is the name clear?
- [ ] Are parameters documented?
- [ ] Are return values documented?
- [ ] Does it handle errors?

### Module Level

- [ ] Is the file focused?
- [ ] Are exports clear?
- [ ] Are types exported?
- [ ] Are side-effects minimal?

### Architecture Level

- [ ] Does it respect layer boundaries?
- [ ] Does it use the right abstraction?
- [ ] Does it maintain audit trail?
- [ ] Does it preserve backward compatibility?

---

## CI Gates

These checks run automatically (or should, once GitHub Actions is set up):

| Gate | Command | Block? |
|------|---------|--------|
| TypeScript | `npm run build` | Yes |
| Pipeline lint | `npm run lint:pipeline` | Yes |
| Unit tests | `npm run test:unit` | Yes |
| Integration tests | `npm run test:integration` | Yes |
| Pipeline tests | `npm run test:pipeline` | Yes |
| Calibration | `npm run test:calibration` | Yes |

---

## Documentation Update Triggers

Update docs when you change:

| Code Change | Docs to Update |
|-------------|----------------|
| Add/remove check | `current-state.md`, `traceability-matrix.md` |
| Change pipeline structure | `decision-architecture.md` |
| Add ADR | `adrs/README.md`, `INDEX.md` |
| Change API | `quick-start.md`, `api-and-integrations.md` |
| Change trust formula | `trust-scoring.md`, ADR if structural |
| Add npm script | `quick-start.md` |

---

## Getting Help

- **Architecture questions**: Read [decision-architecture.md](../architecture/decision-architecture.md)
- **Setup issues**: Check [dev-environment.md](./dev-environment.md)
- **Domain questions**: See [wcp-and-dbwd-reference.md](../foundation/wcp-and-dbwd-reference.md)
- **General questions**: [FAQ.md](../FAQ.md)

---

## Contributing to Documentation

Documentation is code. Treat it with the same rigor:

- Use the [documentation roadmap](../roadmap/documentation-roadmap.md) for structure
- Follow the status label taxonomy
- Keep cross-references working
- Update the INDEX when adding new docs

---

**Last Updated**: 2026-04-17
