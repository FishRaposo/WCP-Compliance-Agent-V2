---
name: skill-creator
description: Create, edit, improve, or audit AgentSkills. Use when creating a new skill from scratch or when asked to improve, review, audit, tidy up, or clean up an existing skill or SKILL.md file.
---

# Skill Creator

Guidance for creating effective OpenClaw skills.

## What Skills Provide

1. **Specialized workflows** — Multi-step procedures for specific domains
2. **Tool integrations** — Instructions for working with specific APIs
3. **Domain expertise** — Business logic, schemas, patterns
4. **Bundled resources** — Scripts, references, assets

## Anatomy of a Skill

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/          - Executable code
    ├── references/       - Documentation
    └── assets/           - Templates, files
```

## Core Principles

### Concise is Key
Context window is a public. Only add what Codex doesn't already know.

### Progressive Disclosure
1. **Metadata** (name + description) — Always in context
2. **SKILL.md body** — When skill triggers
3. **References/scripts** — As needed

### Skill Naming
- Lowercase letters, digits, hyphens only
- Under 64 characters
- Verb-led: `gh-address-comments`, `linear-create-issue`

## Creating a Skill

1. **Understand** — Concrete examples of usage
2. **Plan** — Scripts, references, assets needed
3. **Initialize** — Run `init_skill.py`
4. **Edit** — Write SKILL.md, add resources
5. **Package** — Run `package_skill.py`
6. **Iterate** — Test and refine

## SKILL.md Structure

```yaml
---
name: skill-name
description: "What this skill does. Use when..."
---

# Skill Title

## When to Use
Clear triggers for when this skill activates.

## How It Works
Step-by-step instructions.

## Examples
Concrete usage examples.
```

## What NOT to Include

- README.md
- INSTALLATION_GUIDE.md
- CHANGELOG.md

Keep it lean. Only what an AI agent needs to do the job.
