# OpenClaw Skills for WCP Compliance Agent

This directory contains the OpenClaw skills used for this project.

## Skill Structure

Each skill is in its own directory with a `SKILL.md` file:

```
.agents/skills/
├── jobs-ive/
│   └── SKILL.md
├── mmx-cli/
│   └── SKILL.md
├── md-to-pdf/
│   └── SKILL.md
├── process-doc/
│   └── SKILL.md
├── skill-creator/
│   └── SKILL.md
├── pricing-strategy/
│   └── SKILL.md
├── seo-audit/
│   └── SKILL.md
├── ad-creative/
│   └── SKILL.md
└── content-research-writer/
    └── SKILL.md
```

## Immediate Use (Interview Prep)

### jobs-ive
**Purpose:** Steve Jobs/Jony Ive presentation coaching for demo storytelling  
**When to use:** Demo preparation, copy simplification, product positioning, keynote structure  
**Status:** Active use

**Usage:**
- Crafting demo narratives (problem → hero → demo → close)
- Simplifying messaging (remove half, then half again)
- Making technical concepts human-readable
- Jobs-style keynote structure

---

### mmx-cli (MiniMax)
**Purpose:** Sub-agent for parallel coding, second opinions, media generation  
**When to use:** Code implementation, second opinions on architecture, test generation, media assets  
**Status:** Active use

**Usage:**
```bash
# Chat with MiniMax M2.7
mmx text chat --message "Review this TypeScript code" --file src/pipeline/layer2-llm-verdict.ts --output json

# Generate music (unlimited free tier)
mmx music generate --prompt "Upbeat background" --instrumental --out bgm.mp3

# Check quota
mmx quota show
```

**Models:**
- `MiniMax-M2.7` — General chat/coding (default)
- `MiniMax-M2.7-highspeed` — Faster responses
- `music-2.6-free` — Unlimited music generation
- `MiniMax-Hailuo-2.3` — Video generation

**Quota:** 1.5M tokens/month for text generation; music is unlimited

---

### md-to-pdf
**Purpose:** Export ROLE_FIT.md, architecture docs to PDF handouts  
**When to use:** Creating printable interview materials, report generation  
**Status:** Available

**Usage:**
```bash
# Simple conversion
pandoc input.md -o output.pdf

# With custom styling
pandoc input.md -o output.pdf --css=style.css
```

---

### process-doc
**Purpose:** Document three-layer pipeline as formal SOPs with flowcharts  
**When to use:** Creating runbooks, onboarding docs, compliance documentation  
**Status:** Available

**Usage:**
- Generate process documentation from descriptions
- Create RACI matrices for team handoffs
- Document SOPs for compliance audits

---

## Post-Interview (If Productizing)

### skill-creator
**Purpose:** Build custom WCP-specific skills (DBWD lookup, compliance checking)  
**When to use:** Creating reusable compliance skills, automation workflows

---

### pricing-strategy
**Purpose:** Design SaaS pricing tiers if launching as product  
**When to use:** Productizing WCP as SaaS, pricing page design

---

### seo-audit
**Purpose:** Optimize landing page for "AI compliance infrastructure"  
**When to use:** Marketing website optimization, content strategy

---

### ad-creative
**Purpose:** Generate ad copy for construction/payroll marketing  
**When to use:** Paid acquisition campaigns, ad variations at scale

---

### content-research-writer
**Purpose:** Technical blog posts about Trust-Score architecture  
**When to use:** Content marketing, thought leadership, documentation

---

## Using These Skills

These skills are copied from the local OpenClaw installation for reference and portability. Any AI agent working on this repo can use these skills by loading the SKILL.md files.

**To use a skill:**
1. Read the SKILL.md file for the skill you need
2. Follow the instructions and protocols defined there
3. Use any bundled scripts or references as needed
