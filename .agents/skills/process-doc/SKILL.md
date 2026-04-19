---
name: process-doc
description: Document a business process — flowcharts, RACI, and SOPs. Use when formalizing a process that lives in someone's head, building a RACI to clarify who owns what, writing an SOP for a handoff or audit, or capturing the exceptions and edge cases of how work actually gets done.
argument-hint: "<process name or description>"
license: Apache-2.0
---

<!-- Changes: added license field to frontmatter, removed broken ../../CONNECTORS.md reference, removed ~~knowledge base and ~~project tracker OpenClaw placeholder section. Original source: https://github.com/anthropics/skills/tree/main/process-doc (Apache-2.0) -->

# Process Documentation

This skill helps you create comprehensive documentation for business processes—workflows, procedures, and operational guides that capture how work actually gets done.

## Overview

Creating process documentation involves these key activities:

1. **Information gathering** — Interview stakeholders and observe the process
2. **Process mapping** — Visualize the flow of work
3. **RACI definition** — Clarify roles and responsibilities
4. **SOP writing** — Document step-by-step instructions
5. **Review and validation** — Ensure accuracy with stakeholders

## Process Mapping

### Types of Process Maps

**Flowchart**
- Best for: Linear processes with clear decision points
- Use when: The process has a defined start and end with branching paths
- Format: Visual diagram with standard flowchart symbols

**Swimlane Diagram**
- Best for: Cross-functional processes
- Use when: Multiple departments/roles are involved
- Format: Horizontal or vertical lanes showing who does what

**State Diagram**
- Best for: Processes with complex status transitions
- Use when: Entities move through multiple states
- Format: Circles (states) connected by arrows (transitions)

**Gantt Chart**
- Best for: Time-based processes with dependencies
- Use when: Timing and sequencing are critical
- Format: Timeline with task bars and dependencies

### Information to Capture

For each process step, document:
- **Trigger**: What starts this step?
- **Input**: What information/materials are needed?
- **Action**: What actually happens?
- **Output**: What is produced?
- **Owner**: Who is responsible?
- **Tools**: What systems/resources are used?
- **Exceptions**: What can go wrong? How is it handled?
- **Timing**: How long should this take?

## RACI Matrix

A RACI defines who is:

- **R**esponsible: Does the actual work
- **A**ccountable: Ultimately answerable (only one per task)
- **C**onsulted: Provides input before decisions
- **I**nformed: Kept updated after decisions

### Creating a RACI

1. List all major activities/decisions in the process
2. List all roles/people involved
3. For each activity, assign R, A, C, or I to each role
4. Validate: Every activity needs one (and only one) A
5. Review with stakeholders

### RACI Best Practices

- Keep it simple—limit to 6-8 roles and 10-15 activities
- One A per activity (clear ownership)
- Not every role needs to be involved in every activity
- The person Responsible can also be Accountable

## SOP Writing

### SOP Structure

1. **Purpose**: Why this process exists
2. **Scope**: What is covered (and what isn't)
3. **Definitions**: Key terms and acronyms
4. **Roles**: Who does what (link to RACI)
5. **Procedure**: Step-by-step instructions
6. **Exceptions**: Edge cases and how to handle them
7. **Related documents**: Links to forms, templates, other SOPs

### Writing Effective Procedures

- Start each step with an action verb
- One action per step (break complex actions into substeps)
- Include decision points with clear criteria
- Specify "who" for each step
- Include expected outcomes
- Add screenshots/diagrams where helpful
- Note systems and tools used

### Exception Handling

For each major decision point, ask:
- What could go wrong?
- How do we detect it?
- What's the recovery path?
- Who needs to be notified?

## Common Process Patterns

### Approval Workflow

```
Request submitted → Auto-validation → Review → Decision → Notification → Archive
```

Key considerations:
- Escalation rules when approver unavailable
- Delegation procedures
- Rejection handling and resubmission

### Escalation Chain

```
Level 1 (frontline) → Level 2 (specialist) → Level 3 (manager) → Level 4 (executive)
```

Document at each level:
- Criteria for escalation
- Time limits before auto-escalation
- Information to include when escalating

### Onboarding/Offboarding

Complex cross-functional processes involving:
- HR (paperwork, access, equipment)
- IT (accounts, devices, permissions)
- Manager (training, goal-setting)
- Team (introductions, buddy assignment)

### Incident Response

Time-critical process with:
- Detection and triage
- Severity classification
- Response procedures by severity
- Communication protocols
- Post-incident review

## Validation and Maintenance

### Review Checklist

- [ ] Tested by someone who didn't write it
- [ ] Reviewed by all roles in the RACI
- [ ] Edge cases documented
- [ ] Screenshots/diagrams current
- [ ] Links and references work
- [ ] Version and date noted
- [ ] Approved by process owner

### Maintenance Schedule

- Review quarterly for active processes
- Update immediately when changes occur
- Archive when process is retired
- Keep version history

## Output Formats

**Standard deliverables:**
- Process flowchart (PNG/PDF or source file)
- RACI matrix (spreadsheet or table)
- SOP document (markdown/DOCX)
- Quick reference card (1-page summary)

Choose formats based on how the documentation will be used:
- **Wiki/Intranet**: Markdown with embedded diagrams
- **Training**: Visual flowcharts with detailed SOP
- **Compliance**: Formal documents with signatures
- **Daily reference**: Quick reference cards
