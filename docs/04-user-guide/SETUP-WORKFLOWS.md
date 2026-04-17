# Setup Workflows

Complete workflows for setting up projects with _project-standards.

---

## Workflow 1: Default-Only Setup

For open source or simple projects.

### Step 1: Copy Templates

```bash
# Copy baseline templates
cp _project-standards/default/templates/AGENTS.md .
cp _project-standards/default/templates/README.md .
cp _project-standards/default/templates/CHANGELOG.md .
cp _project-standards/default/templates/TODO.md .

# Optional: Human-facing documentation
cp _project-standards/default/templates/CONTRIBUTING.md .  # Optional
cp _project-standards/default/templates/SECURITY.md .     # Optional
cp _project-standards/default/templates/CODE_OF_CONDUCT.md . # Optional

# Copy test configs if your project needs them
cp _project-standards/default/templates/jest.config.js .      # Optional
cp _project-standards/default/templates/playwright.config.js . # Optional
```

### Step 2: Replace Placeholders

Edit each file and replace:
- `[PROJECT_NAME]`
- `[PROJECT_DESCRIPTION]`
- `[TECH_STACK]`
- All other `[PLACEHOLDER]` tokens

### Step 3: Create Docs Structure

```bash
cp -r _project-standards/default/docs-skeleton docs/
```

### Step 4: Initialize

```bash
# Add initial CHANGELOG event
echo "## [Unreleased]" >> CHANGELOG.md

# Create TODO.md tasks
cat >> TODO.md << 'EOF'
- [ ] Set up project structure
- [ ] Add core features
- [ ] Write tests
EOF
```

### Step 5: Clean Up

```bash
rm -rf _project-standards/
```

---

## Workflow 2: Default + Extended Setup

For private projects with advanced guidance.

### Step 1: Read Both Layers

Read `default/` first, then `extended/`.

### Step 2: Copy All Templates

```bash
# Default templates
cp _project-standards/default/templates/* .

# Extended templates (merge AGENTS.md content)
cat _project-standards/extended/templates/AGENTS.md >> AGENTS.md

# LLM context file (optional but recommended)
cp _project-standards/extended/templates/llms.txt .

# Optional: Security and community standards
cp _project-standards/extended/templates/SECURITY.md .        # Optional
cp _project-standards/extended/templates/CODE_OF_CONDUCT.md . # Optional
```

### Step 3: Install Protocols

```bash
mkdir -p docs/protocols

cp _project-standards/extended/protocols/memory-protocol/MEMORY-PROTOCOL.md docs/protocols/
cp _project-standards/extended/protocols/prompt-validation/PROMPT-VALIDATION-PROTOCOL.md docs/protocols/
cp _project-standards/extended/protocols/doc-sync/DOC-SYNC-PROTOCOL.md docs/protocols/

cp _project-standards/extended/protocols/README.md docs/protocols/
```

### Step 4: Set Up Memory System

Follow `extended/protocols/memory-protocol/SETUP.md`:

```bash
# Choose tier (nano, core, full, auto)
# Run setup steps from SETUP.md
```

### Step 5: Install Skills (Optional)

```bash
mkdir -p .agents/skills
cp -r _project-standards/extended/skills/archive-diving .agents/skills/
# Install other skills as needed
```

### Step 6: Replace Placeholders

```bash
# Replace all [PLACEHOLDER] tokens in generated files
grep -r '\[PLACEHOLDER' . --include='*.md'
# Edit and replace each one
```

### Step 7: Clean Up

```bash
rm -rf _project-standards/

# Verify no references remain
grep -r '_project-standards/' . --include='*.md' || echo "Clean!"
```

---

## Tier Decision Matrix

| Question | If Yes | Tier |
|----------|--------|------|
| Baseline (all projects)? | nano | nano |
| Need separated concern files? | core | core |
| Multiple agents or long-lived repo? | full | full |
| Production system with automation? | auto | auto |

### Nano Tier

- Single `NOTES.md` with embedded context
- Event log embedded in NOTES.md
- Minimal file overhead

### Core Tier

- `CHANGELOG.md` as standalone source of truth
- `.memory/vision.md` — big picture
- `.memory/context.md` — current trajectory
- `.memory/graph.md` — entity graph

### Full Tier

- All of core plus:
- `.memory/tags.md` — tag index
- `.memory/CURRENT.md` — session scratchpad
- `.memory/lessons/` — curated lessons
- `TODO.md` — task tracking

### Auto Tier

- All of full plus:
- `.memory/automation/` — automation helpers
- `.memory/monitoring/` — monitoring config
- `.memory/scripts/memory-check.sh` — health check
- `.memory/scripts/auto-regenerate.sh` — auto-regeneration

---

## Validation Checklist

After setup, verify:

- [ ] All `[PLACEHOLDER]` tokens replaced
- [ ] No references to `_project-standards/` in generated files
- [ ] `AGENTS.md` exists and is readable
- [ ] `CHANGELOG.md` has `## Event Log` section
- [ ] `docs/` structure created
- [ ] Protocols installed (if using extended)
- [ ] Memory files created (if using memory protocol)
- [ ] `_project-standards/` folder removed
- [ ] Git initial commit ready

---

## Common Issues

### Issue: Placeholders Not Replaced

**Symptom:** Files contain `[PROJECT_NAME]` or other placeholders.

**Fix:**
```bash
# Find all placeholders
grep -r '\[PLACEHOLDER\|PROJECT_NAME\|PROJECT_DESCRIPTION' . --include='*.md'

# Replace manually or with sed
sed -i 's/\[PROJECT_NAME\]/MyProject/g' *.md
```

### Issue: References to _project-standards/

**Symptom:** Generated files mention `_project-standards/` paths.

**Fix:**
```bash
# Find references
grep -r '_project-standards/' . --include='*.md'

# Edit each file to remove or rephrase
```

### Issue: Memory Protocol Won't Boot

**Symptom:** Horizon markers don't match.

**Fix:**
```bash
# Check latest event in CHANGELOG.md
grep 'evt-' CHANGELOG.md | tail -1

# Update horizon in memory files
# Or run: .memory/scripts/auto-regenerate.sh
```
