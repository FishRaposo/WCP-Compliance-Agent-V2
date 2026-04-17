# Recruiter Walkthrough

Status Label: Implemented

Technical anchors:

- [`../foundation/current-state.md`](../foundation/current-state.md)
- [`../architecture/system-overview.md`](../architecture/system-overview.md)
- [`../showcase/founding-ai-infra-fit.md`](./founding-ai-infra-fit.md)

## 2-minute walkthrough

### 1. Start with the root README

The README explains:

- what is implemented today,
- what the target platform is,
- why this repo matters beyond payroll compliance.

### 2. Inspect the proof files

If the reader wants code evidence quickly, point them to:

- [`../../src/entrypoints/wcp-entrypoint.ts`](../../src/entrypoints/wcp-entrypoint.ts)
- [`../../src/mastra/tools/wcp-tools.ts`](../../src/mastra/tools/wcp-tools.ts)
- [`../../tests/unit/test_wcp_tools.test.ts`](../../tests/unit/test_wcp_tools.test.ts)

### 3. Read the role-fit doc

[`founding-ai-infra-fit.md`](./founding-ai-infra-fit.md) translates the repo into the language of the role:

- retrieval,
- context assembly,
- evals,
- observability,
- system design judgment.

## What a recruiter should conclude

- this is not a wrapper demo,
- the repo is intentionally scoped and technically honest,
- the author understands how to grow a small proof artifact into a real AI platform.
