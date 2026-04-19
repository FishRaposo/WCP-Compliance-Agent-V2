# AGENTS.md

Agent ramp-up notes for the WCP Compliance Agent repository.

## OpenClaw Skills

This repo includes a `.agents/skills/` directory with OpenClaw skills for the project. Any AI agent working on this codebase should reference these skills.

### Active Skills (Immediate Use)

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| **jobs-ive** | Jobs/Ive presentation coaching | Demo prep, copy simplification, keynote structure |
| **mmx-cli** | MiniMax sub-agent | Parallel coding, second opinions, media generation |
| **md-to-pdf** | PDF export | Interview materials, report generation |
| **process-doc** | SOP documentation | Compliance docs, runbooks, process flows |

### Available Skills (Post-Interview/Productizing)

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| **skill-creator** | Build custom skills | Creating WCP-specific automation |
| **pricing-strategy** | SaaS pricing design | Productizing WCP as a service |
| **seo-audit** | SEO optimization | Marketing website optimization |
| **ad-creative** | Ad copy generation | Paid acquisition campaigns |
| **content-research-writer** | Content writing | Technical blog posts, documentation |

### Using Skills

1. Read the skill's SKILL.md in `.agents/skills/<skill-name>/`
2. Follow the protocols and guidelines defined there
3. Use any bundled scripts or references as needed

### MiniMax Quick Reference

```bash
# Chat with M2.7 for coding help
mmx text chat --message "Review this TypeScript" --file src/pipeline/layer2-llm-verdict.ts --output json

# Generate music (unlimited free tier)
mmx music generate --prompt "Upbeat background" --instrumental --out bgm.mp3

# Check quota
mmx quota show
```

---

## Architecture: Three-Layer Decision Pipeline

Every compliance decision flows through exactly three layers. Bypassing any layer is a CI failure.

```
Layer 1 (Deterministic) → Layer 2 (LLM Verdict) → Layer 3 (Trust Score)
```

- **Layer 1** (`src/pipeline/layer1-deterministic.ts`): Extraction, DBWD rate lookup, rule checks. Pure deterministic code, no LLM.
- **Layer 2** (`src/pipeline/layer2-llm-verdict.ts`): LLM reasons over Layer 1 findings. FORBIDDEN from recomputing arithmetic or re-looking up rates. Must cite check IDs.
- **Layer 3** (`src/pipeline/layer3-trust-score.ts`): Computes trust score, flags for human review if score < 0.60.
- **Orchestrator** (`src/pipeline/orchestrator.ts`): The ONLY valid path through all three layers. Called by `src/entrypoints/wcp-entrypoint.ts`.

The pipeline discipline lint (`npm run lint:pipeline`) uses ts-morph AST analysis to enforce:
1. `Agent.generate()` can only be called in `src/pipeline/layer2-llm-verdict.ts` (and legacy `src/mastra/agents/wcp-agent.ts`)
2. `generateWcpDecision` must return `TrustScoredDecision`
3. Orchestrator must use `executeDecisionPipeline`
4. Layer 2 must call `validateReferencedCheckIds`

## Commands

```bash
npm install              # Install dependencies
npm run build            # Clean + tsc compile
npm run dev              # Start with mastra dev
npm run serve            # Start built server (dist/server.js)

npm test                 # Build first, then vitest run (slow: includes build)
npm run test:unit        # Unit tests only (vitest run tests/unit)
npm run test:integration # Integration tests only
npm run test:pipeline    # Pipeline-specific tests (unit + integration for pipeline)
npm run test:calibration # Trust calibration golden set (verbose output)
npm run test:coverage    # Coverage report

npm run lint:pipeline    # AST-based architectural lint (runs in CI)
```

**Key quirk**: `npm test` runs `npm run build` before vitest. If you only changed tests (not src), you can run `vitest run` directly to skip the build.

**Single test file**: `npx vitest run tests/unit/trust-score.test.ts`

**Single test by name**: `npx vitest run -t "test name pattern"`

## Environment

- `OPENAI_API_KEY` is required. Set to `"mock"` or `"mock-key"` for offline development/testing.
- Optional: `OPENAI_MODEL` (default: `GPT 5.4`), `AGENT_MAX_STEPS` (default: `3`), `MOCK_MODE`.
- The `MOCK_MODE` env var is used by trust calibration tests in CI.
- `src/utils/env-validator.ts` loads `.env` via dotenv and fails fast if `OPENAI_API_KEY` is missing.
- `tests/setup.ts` sets `OPENAI_API_KEY=test-api-key` and `NODE_ENV=test` for all tests.

## Key Directories

| Path | Purpose |
|------|---------|
| `src/pipeline/` | Three-layer decision pipeline (layer1, layer2, layer3, orchestrator) |
| `src/entrypoints/` | `wcp-entrypoint.ts` — public entry point calling the orchestrator |
| `src/mastra/` | Mastra agent definitions and tools (legacy, being superseded by pipeline) |
| `src/types/` | Typed contracts: `TrustScoredDecision`, `LLMVerdict`, `DeterministicReport` |
| `src/utils/` | Error taxonomy, mock responses, env validation |
| `src/services/` | Services like `human-review-queue.ts` |
| `src/config/` | Agent, app, and DB configuration |
| `tests/unit/` | Unit tests for pipeline contracts, trust scoring, wcp tools |
| `tests/integration/` | Integration tests for decision pipeline |
| `tests/eval/` | Trust calibration golden set tests |
| `tests/data/` | Test fixtures (`wcp-examples.ts`) |
| `scripts/` | `lint-pipeline-discipline.ts` — AST-based architectural enforcement |
| `docs/` | Extensive documentation (architecture, ADRs, compliance, evaluation, roadmap) |

## Testing Quirks

- Tests require `OPENAI_API_KEY` to be set (tests/setup.ts handles this).
- Layer 2 tests use mock mode automatically when key is `"test-api-key"` or `"mock"`.
- Pipeline tests (`npm run test:pipeline`) are the critical subset that must always pass before merge.
- Trust calibration tests (`tests/eval/trust-calibration.test.ts`) run against a golden set and may need real API keys in CI (`MOCK_MODE=false`).

## CI (GitHub Actions)

Workflow: `.github/workflows/pipeline-discipline.yml`

Sequential stages on push/PR to main/develop:
1. **Pipeline lint** — `npm run lint:pipeline` (AST architectural checks)
2. **Pipeline tests** — `npm run test:pipeline` (must pass before next stage)
3. **Trust calibration** — `npm run test:calibration` (needs `OPENAI_API_KEY` secret)
4. **Coverage** (PR only) — `npm run test:coverage`

## Conventions

- ES modules (`"type": "module"` in package.json). Use `.js` extensions in imports.
- Strict TypeScript (`"strict": true`). No `any` without justification.
- Path alias `@` maps to `./src` in vitest config.
- Commit messages: `<type>: <subject>` (feat, fix, docs, test, refactor, ci).
- Branches: `feature/*`, `fix/*`, `docs/*` — see `.github/CONTRIBUTING.md` for full checklist.
- `require.main === module` in `scripts/lint-pipeline-discipline.ts` will not work with ESM — this is a known issue, the script works via `npx tsx` invocation.
- DBWD rates are hardcoded in Layer 1 (5 trades: Electrician, Laborer, Plumber, Carpenter, Mason). Production would use PostgreSQL + pgvector.

## Decision Contracts (src/types/)

The central type is `TrustScoredDecision` in `src/types/decision-pipeline.ts`. Key fields:
- `deterministic`: Layer 1 report (extracted data, checks, DBWD rate, score)
- `verdict`: Layer 2 output (status, rationale, referencedCheckIds, reasoning trace)
- `trust`: Layer 3 score (components: deterministic, classification, llmSelf, agreement; band: auto/require_human)
- `humanReview`: required flag, status, queuedAt
- `auditTrail`: array of timestamped events from each layer
- `finalStatus`: "Approved" | "Revise" | "Reject" | "Pending Human Review"

`validateReferencedCheckIds()` ensures every check ID cited by the LLM actually exists in the Layer 1 report.
