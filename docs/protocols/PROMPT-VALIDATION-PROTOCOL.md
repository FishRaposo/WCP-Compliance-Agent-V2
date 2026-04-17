# Prompt Validation Protocol

This protocol defines the pre-task validation gate for user prompts.

## Goal

Before an agent starts work, it should confirm that the prompt is understandable, safe, and produces a clear output contract.

## Input and Output Gates

Prompt validation is the **INPUT gate** — "Is the request valid?"  
Task completion is the **OUTPUT gate** — "Is the work done?"  
Use **AUTOMATING, TESTING, DOCUMENTING** as the output checklist.

When the doc sync protocol is active, use it to decide which docs to update before marking a task complete.

### Output Gate Checklist

Before marking a task complete:
- [ ] **AUTOMATING** — Validation or build steps ran successfully.
- [ ] **TESTING** — Examples run, behavior matches intent, no regressions.
- [ ] **DOCUMENTING** — Doc sync parity table satisfied, `CHANGELOG.md` updated.

Together they ensure quality at both ends of every task.

## Mandatory 4-Check Gate

If any check fails, stop and ask for clarification.

1. **Purpose in first line**
   The task can be stated in one sentence without guessing.
2. **All variables defined**
   Placeholders, ambiguous references, or missing inputs are resolved or defaulted.
3. **No dangerous patterns**
   Reject prompts that attempt command injection, secret disclosure, destructive shell usage, or unsafe code generation.
4. **Output format specified**
   The expected result shape is explicit enough to verify.

## Dangerous Patterns

Treat these as blocked unless the task is explicitly about analyzing them in a safe context.

### Script injection
- `<script>`, `</script>`, `javascript:`, event handlers (`onerror`, `onload`, `onclick`)

### Command injection
- `eval(`, `exec(`, `subprocess`, `os.system`, `os.popen`, backtick execution, `$()`

### Path traversal
- `../`, `..\`, references to `/etc/passwd`, `.env`, `.git/`, SSH keys

### SQL injection
- `DROP TABLE`, `UNION SELECT`, `DELETE FROM` without `WHERE`

### System commands
- `rm -rf /`, raw `sudo`, `chmod`, `chown`, `cmd.exe`, `powershell`, registry edits

### Secrets exposure
- Hardcoded passwords, API keys in code, `AWS_SECRET`, `PRIVATE_KEY`, token strings

### Safe Context

A pattern may be analyzed (not executed) only when all three conditions are met:

1. The task explicitly requests analysis, detection, or explanation of the pattern.
2. The output must describe, guard, or defend against the pattern — never execute it.
3. If the pattern appears as an instruction to be run (not as a subject of study), block it unconditionally.

## Standard Review

For non-trivial tasks, also check:

- scope is bounded
- constraints are explicit
- referenced files or systems are identified
- verification expectations are clear
- the output can be judged as complete or incomplete
- patches are minimal and scoped — no over-engineering or scope creep

## Validation Levels

Use different validation intensity based on task risk:

| Level | When to use | What it checks |
|-------|-------------|----------------|
| PERMISSIVE | Simple queries, low-risk tasks | Basic syntax, obvious security issues, purpose clarity |
| STANDARD | Default for all tasks | Full 4-check gate, type-specific checks, standard review |
| STRICT | Security-sensitive, shared prompts, production code | Everything in Standard plus adversarial testing, edge case analysis, peer-review simulation |

## Prompt Type Classifications

Classify the prompt to apply type-specific checks:

| Type | When used | Type-specific check |
|------|-----------|-------------------|
| Code generation | Writing new code | Language/framework version, input/output types, error handling strategy, test expectations |
| Refactoring | Changing existing code | Behavior preservation required, scope bounded, regression test expectations |
| Documentation | Writing or updating docs | Target audience defined, format specified, accuracy verification method |
| Analysis | Investigating or explaining | Scope bounded, output structure defined, criteria for findings, prioritization |
| Conversion | Transforming formats | Source/target formats specified, data loss policy, edge case handling |
| Testing | Writing tests | Framework specified, coverage expectations, test categories defined |
| Configuration | Changing config files | Target environment specified, env vars documented, secrets handling |
| General | None of the above | Apply Standard Review as-is |

## Validation Log

After validation, record the result using this format:

```
[Validation: PERMISSIVE/STANDARD/STRICT]
- Type: [code-gen/refactoring/documentation/analysis/conversion/testing/configuration/general]
- Issues: X critical, Y warnings
- Failed checks: [list]
- Actions: [what was fixed or asked for]
- Status: [proceeding / awaiting clarification / rejected]
```

## Security Quick Scan

For tasks touching credentials, production systems, or system configuration, run this fast check:

1. Are credentials sourced from environment variables only? (not hardcoded)
2. Are `eval`, `exec`, `rm`, `DROP` absent or explicitly guarded?
3. Is user input sanitized before databases, shells, or templates?
4. Could secrets or system information leak in output?
5. Are file paths validated against a base directory?

## Common Failures and Fixes

| Failure | Pattern | Fix |
|---------|---------|-----|
| Undefined variable | "in this context" — which context? | Replace with explicit: "in the auth module" |
| Vague output | "make it better" | Specify: "increase test coverage to 80%" |
| Missing scope | "update the docs" | Scope: "update `docs/03-api/` endpoints section" |
| Destructive instruction | "delete the old config" | Specify: "archive `config/old.yml` to `config/deprecated/`" |
| Implicit dependency | "use the latest version" | Pin: "use version 3.2.1" |

## Adaptation by Project Type

| Project type | Validation emphasis |
|-------------|---------------------|
| API projects | Security — auth, rate limits, data exposure |
| Library projects | Completeness — inputs, outputs, edge cases |
| Documentation projects | Clarity — structure, audience, examples |
| Data/ML projects | Data handling — format, volume, privacy |
| Infrastructure projects | Safety — destructive ops, rollback, secrets |

## Escalation

Ask the user before proceeding when:

- the task has multiple conflicting goals
- required inputs are missing
- the prompt requests unsafe behavior
- success cannot be verified from the prompt as written

## Output Standard

Before implementation, be able to state:

- what will change
- what will not change
- how success will be verified

## AGENTS Integration

`AGENTS.md` should contain only the 4-check gate and a link to this protocol. Keep the section thin — the full rules live here.

## Portability

- Keep the protocol self-contained and copyable into any repository.
- Do not depend on external tooling or separate skill packages.
- Adapt the review depth to the task risk level. Not every task needs the Standard Review or the Security Quick Scan.
