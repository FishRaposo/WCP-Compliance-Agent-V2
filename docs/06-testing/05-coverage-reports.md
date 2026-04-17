# Coverage Reports

How to generate, read, and improve test coverage in [PROJECT_NAME].

---

## Generating Reports

```bash
# Run tests with coverage
[YOUR_PACKAGE_MANAGER] run test:coverage

# Open HTML report
# macOS:   open coverage/lcov-report/index.html
# Windows: start coverage/lcov-report/index.html
# Linux:   xdg-open coverage/lcov-report/index.html
```

---

## Understanding Coverage Metrics

Four metrics are tracked:

| Metric | What it Measures | Example |
|--------|-----------------|---------|
| **Statements** | Each executable statement | `x = 1;`, `return value;` |
| **Branches** | Each branch of conditionals | `if/else`, `switch`, `? :` |
| **Functions** | Each function defined | `function foo()`, `() => {}` |
| **Lines** | Each line of code | (similar to statements) |

### Reading the Console Output

```
File         | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------|---------|----------|---------|---------|-------------------
All files    |   82.50 |    78.30 |   85.00 |   81.00 |
 [SRC_DIR]/ |         |          |         |         |
  [file1]   |   95.00 |    88.00 |  100.00 |   94.00 |
  [file2]   |   70.00 |    65.00 |   75.00 |   68.00 | 45-52, 78, 103
```

- **Green** (≥ [COVERAGE_THRESHOLD]%) — Threshold met ✅
- **Yellow** (≥ 50%, < threshold) — Below target ⚠️
- **Red** (< 50%) — Critically undertested 🔴

The `Uncovered Line #s` column shows exactly which lines have no test coverage.

---

## Coverage Thresholds

Coverage thresholds are enforced in `[TEST_CONFIG_FILE]`:

```[YOUR_LANGUAGE]
// [TEST_CONFIG_FILE]
coverageThreshold: {
  global: {
    branches: [COVERAGE_THRESHOLD],
    functions: [COVERAGE_THRESHOLD],
    lines: [COVERAGE_THRESHOLD],
    statements: [COVERAGE_THRESHOLD],
  },
  // Stricter thresholds for critical files:
  // './[SRC_DIR]/critical-module.[ext]': {
  //   branches: [STRICT_THRESHOLD],
  //   functions: [STRICT_THRESHOLD],
  // }
}
```

If any threshold is not met, the test command exits with a non-zero code (fails CI).

---

## Reading the HTML Report

Open `coverage/lcov-report/index.html` for a detailed view:

### File List View
- Shows all source files with their coverage percentages
- Click on any file to see line-by-line coverage

### Line View (per file)
- 🟢 **Green background** — Line was executed by at least one test
- 🔴 **Red background** — Line was never executed (write a test!)
- 🟡 **Yellow background** — Branch partially covered (missing an `else` path, etc.)
- Numbers on the left — How many times the line was executed

### Branch Coverage
Pay special attention to branch coverage — a function might be 100% line-covered but miss the `else` path:

```[YOUR_LANGUAGE]
function clamp(value, min, max) {
  if (value < min) return min;    // ← tested?
  if (value > max) return max;    // ← tested?
  return value;                   // ← tested?
}
```

You need tests for all three return paths.

---

## Improving Coverage

### Step 1: Find uncovered code

```bash
[YOUR_PACKAGE_MANAGER] run test:coverage
```

Look at the `Uncovered Line #s` column or the HTML report.

### Step 2: Analyze why it's uncovered

Common reasons:
1. **Edge case not tested** — function called but not with boundary inputs
2. **Error path not tested** — `catch` block never triggered
3. **Conditional branch not tested** — one side of `if/else` missing
4. **Dead code** — code that can never be reached

### Step 3: Write the missing test

```[YOUR_LANGUAGE]
// Example: testing the error path
test('throws when [condition]', () => {
  expect(() => {
    [functionName]([invalid input]);
  }).toThrow('[expected error]');
});

// Example: testing the else branch
test('returns [value] when [condition is false]', () => {
  const result = [functionName]([input that triggers else]);
  expect(result).toBe([expected]);
});
```

---

## When NOT to Chase Coverage

Coverage is a tool, not a goal. Don't do this:

```[YOUR_LANGUAGE]
// ❌ Empty test just to add coverage
test('covers the function', () => {
  [functionName](); // No assertion!
});
```

Some code is legitimately hard to test:
- Error handlers for truly impossible states
- Platform-specific workarounds
- Third-party integration glue code

For these, use `/* istanbul ignore next */` sparingly:

```[YOUR_LANGUAGE]
/* istanbul ignore next */
function platformSpecificWorkaround() {
  // This only runs on [PLATFORM] which we can't test in CI
}
```

---

## Coverage in CI

Coverage is automatically checked in the GitHub Actions pipeline (see [CI/CD](./06-ci-cd.md)).

PRs that drop coverage below the threshold will **fail CI**. The workflow:

1. Runs tests with coverage
2. Checks thresholds — fails if not met
3. Uploads coverage report as artifact
4. (Optional) Posts coverage comment to PR via Codecov/Coveralls

---

## Coverage Report Files

After running coverage, these files are generated:

```
coverage/
├── lcov-report/
│   ├── index.html          # ← Open this in a browser
│   └── [SRC_DIR]/
│       └── [file].html     # Per-file coverage
├── lcov.info               # For Codecov/Coveralls integration
└── coverage-summary.json   # Machine-readable summary
```

These are gitignored — do not commit the `coverage/` directory.
