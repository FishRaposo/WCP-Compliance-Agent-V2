# Using _project-standards

This guide explains how to use the `_project-standards` guidance pack to set up other projects with consistent agent guidance.

---

## Quick Start

### 1. Drop _project-standards into Your Repo

```bash
# Copy the entire _project-standards folder to your project root
cp -r /path/to/_project-standards ./
```

### 2. Read Order

**For any project:**
1. Read `_project-standards/default/` first — baseline guidance
2. Read `_project-standards/extended/` only if it's a private project needing advanced guidance

### 3. Generate Project Files

**Default layer only:**
- Copy templates from `default/templates/` to project root
- Replace all `[PLACEHOLDER]` tokens
- Create `docs/` structure from `default/docs-skeleton/`

**Default + Extended layers:**
- Do the above, plus:
- Copy tool-specific templates from `extended/templates/`
- Install protocols from `extended/protocols/` to `docs/protocols/`
- Set up memory system using `extended/protocols/memory-protocol/SETUP.md`

### 4. Remove _project-standards

After setup is complete:
```bash
rm -rf _project-standards/
```

All generated files are standalone — no references to `_project-standards/` remain.

---

## Layer Selection

### Use `default/` Only When:
- Open source project
- Standard guidance is sufficient
- No private/internal methodology needed

### Use `default/` + `extended/` When:
- Private project
- You want stricter workflows
- You need memory/continuity systems
- You want stronger prompt validation
- You have internal conventions to enforce

---

## Tier Selection (Memory System)

| Tier | When to Use |
|------|-------------|
| `nano` | All projects start here — single NOTES.md with embedded context |
| `core` | Need separated concerns — extract to .memory/ files |
| `full` | Long-lived or multi-agent repos — add lessons, tags |
| `auto` | Production-grade — add automation, monitoring, scripts |

See `docs/protocols/MEMORY-PROTOCOL.md` for full details.

---

## Template Customization

### Placeholder Replacement

All templates use `[PLACEHOLDER]` syntax. Replace with actual values:

- `[PROJECT_NAME]` → Your project name
- `[PROJECT_DESCRIPTION]` → Brief description
- `[TECH_STACK]` → Technologies used
- `[SRC_DIR]` → Source directory (e.g., `src`, `app`)
- `[TESTS_DIR]` → Test directory (e.g., `tests`, `spec`)

### Example: AGENTS.md

Copy `default/templates/AGENTS.md` and replace:
```markdown
[PROJECT_NAME] → MyProject
[PROJECT_DESCRIPTION] → A web application for task management
[TECH_STACK] → React, Node.js, PostgreSQL
```

---

## Protocol Installation

### Memory Protocol

See `extended/protocols/memory-protocol/SETUP.md`:

```bash
# 1. Copy protocol document
cp extended/protocols/memory-protocol/MEMORY-PROTOCOL.md docs/protocols/

# 2. Choose tier and follow SETUP.md instructions
# 3. Create .memory/ directory structure
# 4. Initialize CHANGELOG.md with first event
```

### Prompt Validation Protocol

See `extended/protocols/prompt-validation/SETUP.md`:

```bash
cp extended/protocols/prompt-validation/PROMPT-VALIDATION-PROTOCOL.md docs/protocols/
# Follow SETUP.md instructions
```

### Doc Sync Protocol

See `extended/protocols/doc-sync/SETUP.md`:

```bash
cp extended/protocols/doc-sync/DOC-SYNC-PROTOCOL.md docs/protocols/
# Follow SETUP.md instructions
```

---

## Skills Installation

### Using a Skill

1. Read the skill in `extended/skills/[skill-name]/`
2. Follow the SKILL.md instructions
3. Install to `.agents/skills/` in your project

### Example: Dumpster Diving

```bash
# Install the archive search skill
cp -r extended/skills/archive-diving .agents/skills/
```

See `extended/skills/archive-diving/SKILL.md` for usage.

---

## Checklist for New Projects

- [ ] Copied `_project-standards/` to project root
- [ ] Read `default/` (mandatory)
- [ ] Read `extended/` (if private project)
- [ ] Generated root files from templates
- [ ] Replaced all `[PLACEHOLDER]` tokens
- [ ] Created `docs/` structure
- [ ] Installed desired protocols
- [ ] Set up memory system (if using)
- [ ] Installed desired skills
- [ ] Removed `_project-standards/` folder
- [ ] Verified no references to `_project-standards/` remain

---

## Troubleshooting

### Unfilled Placeholders

Check with:
```bash
grep -r '\[PLACEHOLDER' . --include='*.md'
```

### References to _project-standards/

Check with:
```bash
grep -r '_project-standards/' . --include='*.md'
```

### Memory Protocol Not Working

- Verify `docs/protocols/MEMORY-PROTOCOL.md` exists
- Check `.memory/` directory structure
- Ensure `CHANGELOG.md` has `## Event Log` section
- Compare horizon markers across files

---

## Examples

See `extended/skills/*/examples/` and `_archive/` for usage examples.
