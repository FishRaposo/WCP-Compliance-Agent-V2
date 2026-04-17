# Doc Sync Protocol

This protocol defines how to keep project documentation accurate, navigable, and aligned with code.

## Purpose

Documentation drifts silently. Every code change is a chance for docs to become stale. Use this protocol to detect drift, decide what needs updating, and keep the docs surface trustworthy with minimal overhead.

## Core Rules

1. **Update on change** — A task is not complete until affected docs are updated.
2. **One source of truth** — Each fact lives in one canonical file; other files reference it.
3. **Rebuild, don't patch** — When docs are widely stale, regenerate from authoritative files instead of hand-editing scattered inconsistencies.
4. **Keep the hub alive** — `docs/INDEX.md` must always reflect the current docs surface.

## Documentation Parity

Match every change type to the docs that must be updated before the task is complete.

| Change type | Update these |
|-------------|--------------|
| New feature or module | `README.md`, `docs/INDEX.md`, relevant guide or reference doc, `CHANGELOG.md` |
| API change | `docs/03-api/` or relevant API surface, examples that call the API, `CHANGELOG.md` |
| Architecture change | `docs/02-architecture/`, `docs/INDEX.md` if structure changed, `CHANGELOG.md` |
| New protocol | `docs/protocols/` file, `AGENTS.md` reference, `docs/INDEX.md` |
| New rule or convention | `AGENTS.md`, any tool-specific rule files that should mirror it, `CHANGELOG.md` |
| Dependency change | Setup docs, `CHANGELOG.md` |
| Security change | `CHANGELOG.md` (SECURITY.md optional) |
| Workflow change | `WORKFLOW.md` when present, `docs/INDEX.md`, `CHANGELOG.md` |
| New directory or command | `AGENTS.md` Key directories / Commands sections |
| New pitfall or gotcha | `AGENTS.md` Gotchas section, relevant troubleshooting doc |

## Documentation Drift Detection

Drift happens when docs no longer describe reality. Detect it by checking:

**Stale content**
- A doc's last meaningful update is older than the latest `CHANGELOG.md` event that affects its scope.
- Examples in docs no longer match current behavior.
- Screenshots or outputs describe a UI that has changed.

**Structural drift**
- Internal links point to files that no longer exist.
- `docs/INDEX.md` lists files that were removed or renamed.
- Unfilled placeholders (`[PLACEHOLDER]` or `{{FILL_ME:...}}`) remain in published docs.

**Coverage drift**
- A new feature has no corresponding guide, API doc, or reference entry.
- A removed feature is still documented as current.
- A changed convention is only reflected in code, not in `AGENTS.md` or rule files.

**Navigation drift**
- New docs are not linked from `docs/INDEX.md`.
- Protocol docs are present but not referenced from `AGENTS.md` or rule files.
- No clear entry point exists for a common question.

## Per-File Standards

| File | Standard |
|------|----------|
| `README.md` | Max 150 lines. Concise overview with quick-start. |
| `CHANGELOG.md` | Append-only. Never edit past entries. |
| `AGENTS.md` | Treat as immutable during execution. Self-updates are limited to specific triggers. |
| `docs/03-api/` | Each module/service gets its own file. Public functions documented with signature, params, returns, errors. |
| `docs/04-user-guide/` | Step-by-step flows with examples. Each guide is self-contained. |
| `llms.txt` | Max 50KB. Exactly one H1, blockquote, H2 link lists. |
| AI tool instructions (in `AGENTS.md`) | Keep tool-specific guidance in dedicated AGENTS.md section |

## Documentation Coverage Score

Calculate coverage as a percentage: `required files present / total required files × 100`.

- **100%** — All tier-required files exist.
- **80-99%** — Minor gaps. Identify and fill missing files.
- **Below 80%** — Significant gaps. Prioritize missing files before feature work.

## Audit Heuristics

Check for these signals when auditing documentation:

- No obvious docs entry point for a new contributor or agent
- Stale `README.md` that no longer matches the repo
- Missing `docs/INDEX.md` when docs exist but are hard to navigate
- Protocol docs present but not linked from main surfaces
- `llms.txt` pointing to stale or low-value pages
- Docs footprint too large for the repo to realistically maintain

## Sync vs Validate

Two modes of operation:

- **Sync:** Update docs from the source of truth. Modify files, update links, regenerate content.
- **Validate:** Check docs without changing anything. Report issues for the agent or human to fix.

Use `validate` mode in CI or as a pre-commit check. Use `sync` mode during active development.

## Rebuild Algorithm

When docs are widely stale, rebuild them from authoritative files instead of patching by hand:

1. **Identify the source of truth** — the code, tests, or `CHANGELOG.md` event that describes the current reality.
2. **List affected docs** — use the Documentation Parity table to find every doc that references the changed scope.
3. **Regenerate or update each doc** — derive content from the source of truth.
4. **Update the hub** — add or remove links in `docs/INDEX.md` to match the current surface.
5. **Log the sync** — append a doc-sync event to `CHANGELOG.md` if the memory protocol is active.

## Maintenance Schedule

| Project velocity | Recommended check cadence | Key tasks |
|------------------|---------------------------|-----------|
| Multiple changes per day | Weekly | Review `TODO.md` for doc tasks; run examples in recently changed docs; check `docs/INDEX.md` for missing links. |
| Multiple changes per week | Monthly | Scan for broken internal links; review `README.md` for stale claims; audit `docs/` for orphaned or empty files. |
| Stable or maintenance mode | Quarterly | Restructure docs only when the project has outgrown the layout; review `llms.txt` for stale or missing links. |

## Documentation Health Check

Run these checks before considering documentation work complete:

1. **Files** — Every doc required by the project's tier exists and has meaningful content (>200 chars of non-boilerplate text).
2. **Links** — All internal Markdown links (`[text](path)`) resolve to existing files (with `.md` suffix fallback).
3. **Placeholders** — No unfilled `[PLACEHOLDER]` or `{{FILL_ME:...}}` markers remain in any published doc.
4. **Examples** — Run each code example or command snippet in a clean context; if any fails, fix or remove it before commit.
5. **Hub** — Every file in `docs/` with >200 chars is linked from `docs/INDEX.md`; no dead or renamed file links remain.
6. **llms.txt** — If present, it has exactly one H1, a blockquote summary, at least one H2 section, at least one link list item (`- [text](url)`), and is under 50KB.
7. **Parity** — The docs affected by the most recent change have been updated and reference the correct `CHANGELOG.md` event or version.

## Docs Hub Convention

Treat `docs/INDEX.md` as the canonical entry point for documentation.

- Keep it a concise table of contents, not a narrative.
- Update it whenever docs are added, removed, or restructured.
- For numbered docs structures, follow the `01-contributing/` through `06-testing/` convention.
- For flat docs structures, group files by audience: contributor, developer, end-user.

## llms.txt Standard

If the project uses `llms.txt` for AI discoverability, maintain it with:

- Exactly one H1 heading.
- A blockquote summary of the project.
- At least one H2 section with link list items (`- [text](url)`).
- Optional: an `## Optional` section for secondary links.
- Keep the file under 50KB.

## Cross-Protocol Workflow

When prompt validation and memory protocols are also active, follow this task lifecycle:

1. **Prompt Validation** — Run the 4-check gate before starting.
2. **Memory Boot** — Read `.memory/` files and check event horizons against `CHANGELOG.md`.
3. **Execute** — Do the work.
4. **Doc Sync** — Update docs per the parity table and run the health check.
5. **Memory Shutdown** — Append event to `CHANGELOG.md`, regenerate `.memory/context.md`, update `graph.md`.
6. **Done** — All three pillars satisfied: AUTOMATING, TESTING, DOCUMENTING.

## AGENTS Integration

`AGENTS.md` should contain a short doc-sync section with the parity table summary and a link to this protocol. Keep the section thin — the full rules live here.

## Quick Reference

**After every task:** Update CHANGELOG → Update affected docs → Regenerate hub.

**If stale:** Rebuild from authoritative files; do not patch by hand.

**If links break:** Fix or remove them before commit.

**If placeholders remain:** Fill or delete them before commit.

**If docs are missing:** Create the minimum viable doc, link it from `docs/INDEX.md`.

## Portability

- Keep the protocol file-based and copyable into any repository.
- Do not depend on external documentation tools or CI pipelines.
- Adapt the schedule to project velocity. A fast-moving repo may need weekly checks; a stable repo may need only monthly checks.
