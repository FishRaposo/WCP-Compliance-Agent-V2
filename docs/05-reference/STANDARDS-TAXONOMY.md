# Standards Taxonomy

The 7-standard system in `extended/` — a complete taxonomy for agent guidance.

---

## Overview

| Standard | Purpose | Location | Use When |
|----------|---------|----------|----------|
| **Rules** | Global constraints and constitution | `extended/rules/` | "What must always be true?" |
| **Modes** | Agent configuration and context switching | `extended/modes/` | "How should I approach this?" |
| **Protocols** | Enforced procedures and quality gates | `extended/protocols/` | "How do I validate?" |
| **Skills** | Packaged knowledge and capabilities | `extended/skills/` | "How do I implement X?" |
| **Tasks** | Atomic units of work | `extended/tasks/` | "What needs doing?" |
| **Playbooks** | Strategic scenario orchestration | `extended/playbooks/` | "How do we coordinate?" |
| **Blueprints** | Reusable product templates | `extended/blueprints/` | "What are we building?" |

---

## Rules

**Purpose:** Define boundaries that must never be crossed.

**Examples:**
- Global constraints (e.g., "No generated file references `_project-standards/`")
- Architecture principles
- Security boundaries

**Location:** `extended/rules/`

**Usage:** Read at start of every session. Rules are always active.

---

## Modes

**Purpose:** Configure agent behavior for different contexts.

**Examples:**
- `setup` — Setting up a new project
- `curation` — Organizing archives or standards
- `documentation` — Writing docs
- `default` — General development

**Location:** `extended/modes/`

**Usage:** Switch modes based on current task. Modes define:
- Read order
- Constraints
- Documentation requirements

---

## Protocols

**Purpose:** Enforced procedures for quality gates.

**Current Protocols:**

| Protocol | Purpose | Status |
|----------|---------|--------|
| Memory Protocol | Event-sourced memory system | Active |
| Prompt Validation Protocol | Pre-task validation | Active |
| Doc Sync Protocol | Documentation alignment | Active |

**Location:** `extended/protocols/`

**Structure:**
```
protocols/<protocol-name>/
  SETUP.md               # Setup instructions
  <PROTOCOL>.md          # Protocol template
  snippet-AGENTS-*.md    # AGENTS.md integration
```

**Usage:** Follow SETUP.md to install in target projects.

---

## Skills

**Purpose:** Packaged capabilities for reuse.

**Current Skills:**

| Skill | Purpose |
|-------|---------|
| Archive Diving | Search archives for useful material |
| (more in extended/skills/) | |

**Location:** `extended/skills/`

**Structure:**
```
skills/<skill-name>/
  SKILL.md     # Canonical contract
  config.json  # Machine metadata
  README.md    # Quick-start
  _examples/   # Usage examples
  reference/   # Deep docs
```

**Usage:**
1. Read SKILL.md
2. Install to `.agents/skills/`
3. Follow execution steps

---

## Tasks

**Purpose:** Atomic units of work with clear completion criteria.

**Examples:**
- "Fix typo in README"
- "Add validation to form"
- "Update dependency version"

**Location:** `extended/tasks/`

**Structure:**
```
tasks/<task-name>/
  TASK.md      # Task definition
```

**Usage:**
1. Read TASK.md
2. Follow steps
3. Mark complete

---

## Playbooks

**Purpose:** Strategic orchestration of multiple tasks/skills.

**Examples:**
- "Migrate from v1 to v2"
- "Set up new microservice"
- "Major refactor"

**Location:** `extended/playbooks/`

**Structure:**
```
playbooks/<playbook-name>/
  PLAYBOOK.md  # Strategic orchestration
```

**Usage:**
1. Read PLAYBOOK.md
2. Follow phases
3. Coordinate multiple agents if needed

---

## Blueprints

**Purpose:** Reusable product templates.

**Examples:**
- API service blueprint
- Web app blueprint
- CLI tool blueprint

**Location:** `extended/blueprints/`

**Structure:**
```
blueprints/<blueprint-name>/
  BLUEPRINT.md  # Product specification
```

**Usage:**
1. Read BLUEPRINT.md
2. Generate product structure
3. Customize for specific needs

---

## Selection Guide

| Situation | Standard |
|-----------|----------|
| "What must always be true?" | **Rules** |
| "How should I approach this?" | **Modes** |
| "How do I validate?" | **Protocols** |
| "How do I implement X?" | **Skills** |
| "What needs doing?" | **Tasks** |
| "How do we coordinate?" | **Playbooks** |
| "What are we building?" | **Blueprints** |

---

## Integration

All 7 standards work together:

1. **Rules** define boundaries (always active)
2. **Modes** configure context (task-specific)
3. **Protocols** enforce quality (validation gates)
4. **Skills** provide capabilities (implementation)
5. **Tasks** define work (atomic units)
6. **Playbooks** orchestrate strategy (multi-task)
7. **Blueprints** specify products (output templates)

---

## For Other Projects

To use the 7-standard system in your project:

1. Copy relevant standards from `extended/`
2. Adapt to your project's needs
3. Document in your project's `AGENTS.md`

Not all projects need all 7 standards. Start with what you need, expand gradually.
