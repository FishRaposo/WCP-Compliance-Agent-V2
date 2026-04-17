# Memory Protocol

This protocol defines a portable event-sourced memory system for software projects.

## Purpose

Use the memory system to keep shared project context in files instead of agent-local state. Agents read the same files at boot, append changes to the event log, and regenerate derived views when needed.

## Quick Reference

**Boot in 4 steps:** Read AGENTS.md → Read vision.md → Read context.md → Check horizon.

**Shutdown in 4 steps:** Append event → Materialize graph → Regenerate context → Commit atomically.

**Ground truth hierarchy:** `AGENTS.md` > `CHANGELOG.md` > `graph.md` > `context.md`.

**If stale:** Rebuild derived files from the event log; never patch by hand.

**If >50 events:** Archive to `CHANGELOG-archive.md`, keeping the last 20 events plus active refs.

**Event types:** See the Event Types table for required detail fields per type.

## Core Rules

1. **Append-only** — If it is not in the event log, it did not happen.
2. **One-way flow** — Event Log → Graph → Narrative; never backward.
3. **Stateless agents** — Boot from files, execute, write, terminate.
4. **Rebuild, don't repair** — Regenerate derived layers from upstream when inconsistent.

## Architecture

| Layer | File | Role | Rule |
|-------|------|------|------|
| L0 | `AGENTS.md` | Behavioral core | Read at boot. Treat as immutable during execution. |
| L1 | `CHANGELOG.md` | Event log | Append-only source of truth. |
| — | `TODO.md` | Optional task tracker | Complements CHANGELOG with upcoming work. Not a derived layer. |
| — | `.memory/vision.md` | Stable big picture | Update when goals or major decisions change. Not a derived layer. |
| L2 | `.memory/graph.md` | Dependency and state graph | Materialize from the event log only. |
| L3 | `.memory/context.md` | Current trajectory | Regenerate when its event horizon is stale. |
| L4 | `.memory/lessons/` | Curated lessons | Add topic files as patterns emerge. |
| L5 | `.memory/automation/`, `.memory/monitoring/`, `.memory/scripts/` | Optional helpers | Health checks and convenience tools only. |

`vision.md` is maintained directly. `TODO.md` is maintained directly. Neither is a derived layer.

## Tiers

| Tier | When to use | Files |
|------|-------------|-------|
| `nano` | Default baseline — single file with embedded context | `NOTES.md` with embedded horizon, context, vision, entities, event log |
| `core` | Projects needing separated concerns | `nano` plus `.memory/vision.md`, `.memory/context.md`, `.memory/graph.md` |
| `full` | Long-lived or multi-agent repos | `core` plus `.memory/tags.md`, `.memory/lessons/README.md`, `.memory/CURRENT.md`, `TODO.md` |
| `auto` | Production-grade repos with automation | `full` plus `.memory/automation/README.md`, `.memory/monitoring/README.md`, `.memory/scripts/memory-check.sh`, `.memory/scripts/auto-regenerate.sh` |

Choose `nano` for all projects as the baseline (single NOTES.md). Choose `core` when you need durable shared context with separated files. Choose `full` for lessons and coordination. Choose `auto` for automation and monitoring.

### nano tier — NOTES.md structure (Baseline)

The `nano` tier uses a single `NOTES.md` file with embedded horizon and event log. This is the **baseline for all projects** — always start here.

```markdown
# [Project Name] Notes
**Event horizon:** evt-NNN

## Context (L3)
**Working on:** [Current task]
**Blocked by:** [Blockers or "None"]
**Next:** [Next action]

## Vision (L1)
**Purpose:** [One-line project purpose]
**Priorities:** [Current priorities]

## Entities (L2)
| Name | Type | Status | Notes |
|------|------|--------|-------|

## Event Log (L0)
### evt-NNN | YYYY-MM-DD HH:MM | agent | type
**Scope**: [area]
**Summary**: [description]
```

**Boot process for nano+:**
1. Read `AGENTS.md`
2. Read `NOTES.md`
3. Extract `Event horizon:` from NOTES.md
4. Find latest event in embedded Event Log
5. If horizons differ, regenerate Context/Vision/Entities sections
6. During work, append new events to embedded Event Log

**Upgrade path:** When `nano` becomes insufficient, migrate to `core` tier by extracting sections into separate `.memory/` files and promoting the event log to standalone `CHANGELOG.md`.

### Tier Decision Matrix

| Question | If yes | Tier |
|----------|--------|------|
| Baseline (all projects)? | `nano` | `nano` |
| Need separated concern files? | `core` | `core` |
| Multiple agents or long-lived repo? | `full` | `full` |
| Production system with automation? | `auto` | `auto` |

## Event Log Contract

All events live under `## Event Log` in `CHANGELOG.md`.

```markdown
### evt-NNN | YYYY-MM-DD HH:MM | agent-name | type

**Scope**: area affected
**Summary**: one-line description

**Details**:
- key: value

**Refs**: evt-XXX, evt-YYY
**Tags**: tag1, tag2
```

### Event Types

| Type | When used | Required details |
|------|-----------|-----------------|
| `decision` | Architectural or design choice made | `entity`, `attribute`, `from`, `to`, `rationale` |
| `create` | New file or component created | `entity`, `path`, `purpose` |
| `modify` | Existing file or component changed | `entity`, `path`, `changes[]` |
| `delete` | File or component removed | `entity`, `path`, `reason` |
| `test` | Test executed or result recorded | `target`, `result` (pass/fail/skip), `coverage` |
| `fix` | Bug fixed | `entity`, `symptom`, `root_cause`, `resolution` |
| `dependency` | External dependency added or changed | `entity`, `version`, `reason` |
| `blocker` | Something is blocking progress | `blocked_entity`, `blocking_entity`, `resolution_path` |
| `milestone` | Significant threshold reached | `name`, `criteria_met[]` |
| `handoff` | Agent pipeline handoff | `from_agent`, `to_agent`, `payload_summary` |

Rules:

1. Append only. Do not rewrite or reorder past events.
2. Use sequential IDs.
3. Record enough detail to explain the change without opening the diff.
4. When correcting history, append a new event instead of editing the old one.

## Boot Sequence

Every agent should follow the same sequence:

1. Read `AGENTS.md`.
2. Read `.memory/vision.md` when present.
3. Read `.memory/context.md` when present.
4. In `core` and above, read `.memory/graph.md` when present.
5. Compare the `Event horizon:` marker in `.memory/context.md` with the latest event in `CHANGELOG.md`.
6. If the horizons differ, regenerate `.memory/context.md`.
7. If `.memory/graph.md` exists and its horizon is stale, regenerate it before trusting downstream memory files.
8. In `full` and `auto` tiers, consult `.memory/CURRENT.md`, `.memory/lessons/`, `.memory/tags.md`, and `TODO.md` as supporting context only after the changelog-backed files are in sync.
9. In `auto` tier, use automation helpers as checks and convenience tools, never as a replacement for reading the source files.

## Automatic Regeneration

Agents may automatically regenerate derived files when they detect stale horizons.

### Auto-regeneration trigger

When reading `.memory/context.md` or `.memory/graph.md`:
1. Extract the `Event horizon:` marker (e.g., `evt-042`)
2. Read `CHANGELOG.md` and find the latest event ID
3. If horizons differ, the file is stale

### Auto-regeneration action

If stale:
1. Regenerate the file using standard algorithms
2. Update the `Event horizon:` marker to match latest event
3. Append to `CHANGELOG.md`:
   ```markdown
   ### evt-NNN | YYYY-MM-DD HH:MM | agent-name | regenerate

   **Scope**: [context|graph]
   **Summary**: Auto-regenerated [context.md|graph.md] from event log

   **Details**:
   - Previous horizon: evt-XXX
   - New horizon: evt-YYY
   ```
4. Continue with boot process

### Deduplication rule

If both `context.md` and `graph.md` are stale, prefer regenerating `graph.md` first (L2), then `context.md` (L3). Use a single regeneration event if both were stale.

## Regeneration Rules

- Treat `CHANGELOG.md` as the only source of truth.
- `vision.md` and `TODO.md` are maintained directly.
- `context.md` is derived from the latest event log state plus `graph.md`.
- `graph.md` is derived from the event log and should never be edited directly.
- `.memory/CURRENT.md`, `.memory/tags.md`, and `.memory/lessons/` are curated extensions. They may be maintained directly, but they must never contradict the event log.
- If derived files drift, rebuild them from the event log instead of patching by hand.

## Context Generation Algorithm

To regenerate `.memory/context.md`, derive each section from `CHANGELOG.md` and `.memory/graph.md`:

| Section | Source | Format |
|---------|--------|--------|
| Active Mission | Most recent milestone or decision events | One paragraph |
| Current Sprint | Graph nodes where Type=task and Status=active | Table: Task, Priority, Blockers, Notes |
| Active Constraints | Recent decision events defining boundaries | Bullet list: constraint — evt-NNN |
| Blockers | Graph edges where Relation=blocks and target is active | Bullet list: X blocks Y — evt-NNN |
| Recent Changes | Last 5 events from `CHANGELOG.md`, newest first | Bullet list: YYYY-MM-DD — summary — evt-NNN |
| Key Dependencies | Graph edges where Relation=depends_on for active components | Bullet list: X depends on Y — evt-NNN |
| Next Actions | Active tasks minus blockers, respecting `precedes` edges | Numbered list in priority order |

### Staleness rules

- **Fresh:** `Event horizon:` in context.md matches the latest event in `CHANGELOG.md`.
- **Stale:** Horizon is behind the latest event. Regenerate context.md before trusting it.
- **Missing:** No `Event horizon:` marker. Regenerate entirely from CHANGELOG + graph.

## Graph Materialization Rules

When appending a new event, update `.memory/graph.md` accordingly:

| Event type | Graph update |
|-----------|-------------|
| `create` | Add node (type, status=active, created=event ID) |
| `modify` | Update node's Last Event |
| `delete` | Set node Status=deprecated (do not remove the row) |
| `decision` | Add decision node + implements edge |
| `dependency` | Add dependency node + depends_on edge |
| `blocker` | Add blocks edge |
| `test` | Update node attributes |
| `fix` | Remove blocks edges if the fix resolves them |
| `milestone` | Add/update milestone node |
| `handoff` | Update task node: change assignee or phase |

### Graph Naming Convention

When adding or updating nodes and edges, use these normative values:

- **Type** — `component`, `task`, `decision`, `dependency`, `milestone`
- **Status** — `active`, `blocked`, `completed`, `deprecated`, `planned`
- **Relation** — `depends_on`, `blocks`, `implements`, `tests`, `documents`, `contains`, `precedes`, `related_to`

## Query Patterns

| Query | How to execute |
|-------|---------------|
| "What is blocking X?" | Find edges where To=X and Relation=blocks |
| "What depends on X?" | Find edges where To=X and Relation=depends_on |
| "What is the status of X?" | Find node X and read Status |
| "What changed recently?" | Nodes with highest Last Event numbers |
| "What tasks are in progress?" | Nodes where Type=task and Status=active |
| "What is untested?" | Find Nodes rows where Type=component with no tests edge |

## Anti-Drift Table

| Threat | Detection | Defense |
|--------|-----------|---------|
| Agent hallucinates a past decision | `CHANGELOG.md` has no such event | Ground truth wins — trust the event log |
| Graph edited directly | Event horizon mismatch | Rematerialize from event log |
| Context is stale | Horizon differs from latest event | Regenerate from CHANGELOG + graph |
| Two agents record conflicting decisions | Git merge conflict on CHANGELOG | Commit order resolves |
| AGENTS.md modified during execution | Uncommitted changes to AGENTS.md | Halt and escalate |

## Self-Healing

When validation fails:

1. **Identify the authoritative layer** (`AGENTS.md` > `CHANGELOG.md` > `graph.md` > `context.md`).
2. **Rebuild downstream** — regenerate derived layers from the authoritative layer.
3. **Append a corrective event** — log the inconsistency and the repair.
4. **Never edit upstream** — do not modify `AGENTS.md` or `CHANGELOG.md` to fix downstream issues.

## Archival Protocol

When `CHANGELOG.md` exceeds 50 events under `## Event Log`:

1. Identify the boundary — keep at least the last 20 events plus any events referenced by active graph nodes.
2. Move older events to `CHANGELOG-archive.md`.
3. Prefix the archived batch with: `## Archive: evt-001 through evt-NNN | Archived YYYY-MM-DD`.
4. Append an `archive` event to `CHANGELOG.md` recording the action.
5. Never delete — archiving means moving, not removing. Archived events remain valid refs.

## Forbidden Memory

Agents may NOT carry these between tasks:

- Personal preferences from prior tasks
- Lingering architectural opinions not recorded in the event log
- Accidental interpretations of past decisions
- Partial code or draft implementations from previous tasks
- Undocumented assumptions not captured in `.memory/`
- Cross-role knowledge (a builder should not carry architect opinions)
- Implementation biases unrelated to the current task

If contaminated memory is detected, halt the agent, reset to clean state, regenerate handoff from approved sources, and append a corrective event.

## Multi-Agent Coordination

When multiple agents work in the same repo:

**Shared substrate:** All agents read from the same files. No message passing. Coordination happens through state changes in the graph.

**Write serialization:** Concurrent writes are serialized by git. The append-only event log prevents semantic conflicts because two agents appending different events never edit the same section.

**Communication through state:** Agents communicate through the graph — not direct communication:
- Agent A records a `blocker` event → graph gains a `blocks` edge
- Agent B boots, queries graph, sees blocker, adjusts plan
- Agent C resolves blocker → appends `fix` event → graph edge removed
- Agent B boots again, sees blocker resolved, proceeds

**Race condition handling:**

| Scenario | Resolution |
|----------|-----------|
| Two agents modify same component | Both events appear; later event wins for current state |
| Agent reads stale graph, acts on old state | Agent's changes valid per its context; materialization reveals conflict |
| Agent pipeline phase executes out of order | Graph tracks `pipeline_phase` per task; validator detects phase skip |

## Memory Audit

After completing significant work, agents can run a quick memory audit:

- `AGENTS.md` is read-only during execution (not modified)
- `CHANGELOG.md` event count is sequential and within archival threshold
- `graph.md` has no orphan edges and all node types/statuses are valid
- `context.md` horizon matches the latest event
- All `Refs` in the event log point to existing event IDs

## Validation Rules

- `CHANGELOG.md` must contain `## Event Log`.
- Event headings must match `### evt-NNN | YYYY-MM-DD HH:MM | agent | type`.
- Event IDs are sequential and timestamps are monotonically non-decreasing.
- `Refs` must point to existing event IDs.
- `context.md` and `graph.md` must expose an `Event horizon:` marker when they exist.
- Derived file horizons must match the latest event in `CHANGELOG.md`.
- `graph.md` must have Nodes/Edges/Meta sections with no orphan edges.
- `context.md` must have all 7 sections when regenerated.
- `full` tier requires `.memory/lessons/README.md`, `.memory/tags.md`, `.memory/CURRENT.md`, and `TODO.md`.
- `auto` tier requires the `full` tier files plus `.memory/automation/README.md`, `.memory/monitoring/README.md`, and `.memory/scripts/memory-check.sh`.
- `AGENTS.md` should contain a memory section that points to this protocol.

## AGENTS Integration

`AGENTS.md` should contain a short memory section that links to this protocol. The section should list the core files and the before/after task workflow. Keep the section thin — the full rules live here.

### What the AGENTS.md section should include

1. **Core files**: List the memory files for the project's tier
2. **Boot process**: Read order with horizon checks
3. **Auto-regeneration**: When reading memory files, check horizons. If stale, regenerate automatically and append a regeneration event to `CHANGELOG.md`.
4. **Before/after task workflow**: What to do at start and end of each task

## Portability

- Keep the system file-based and copyable into any repository.
- Do not depend on hidden local tooling or external packages.
- Adapt the tier to the project size. Not every repo needs `full` or `auto`.
- `CHANGELOG.md` and `TODO.md` may exist without the full memory system, but when the memory protocol is present they should be treated as part of the project's memory.
