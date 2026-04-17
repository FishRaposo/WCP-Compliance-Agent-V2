# Running Tests

Commands and workflows for running the [PROJECT_NAME] test suite.

---

## Quick Reference

```bash
# All tests (unit + integration)
[YOUR_TEST_COMMAND]

# Unit tests only (fastest)
[YOUR_PACKAGE_MANAGER] run test:unit

# Integration tests only
[YOUR_PACKAGE_MANAGER] run test:integration

# E2E tests
[YOUR_PACKAGE_MANAGER] run test:e2e

# All tests sequentially (unit → integration → E2E)
[YOUR_PACKAGE_MANAGER] run test:all

# With coverage report
[YOUR_PACKAGE_MANAGER] run test:coverage

# Watch mode (re-runs on file changes)
[YOUR_PACKAGE_MANAGER] run test:watch
```

---

## Running Specific Tests

### Single test file

```bash
# Run a specific test file
[SINGLE_TEST_COMMAND] [TESTS_DIR]/unit/[module].test.[ext]

# Run matching a pattern
[SINGLE_TEST_COMMAND] --testPathPattern=[module]
```

### Single test by name

```bash
# Run tests whose name matches a string
[SINGLE_TEST_COMMAND] -t "calculates total price"

# Combine: specific file + name filter
[SINGLE_TEST_COMMAND] [TESTS_DIR]/unit/[module].test.[ext] -t "edge case"
```

### Single E2E spec

```bash
# Run specific Playwright spec file
[E2E_SINGLE_COMMAND] [TESTS_DIR]/e2e/[flow].spec.[ext]

# Run by test name
[E2E_SINGLE_COMMAND] --grep "[user flow name]"

# Run specific browser only
[E2E_SINGLE_COMMAND] --project=chromium
```

---

## Watch Mode

Watch mode re-runs tests automatically when you save files. Best for active development.

```bash
[YOUR_PACKAGE_MANAGER] run test:watch
```

**Interactive controls:**
```
Press a → run all tests
Press f → run only failed tests
Press p → filter by filename
Press t → filter by test name
Press u → update snapshots
Press q → quit watch mode
```

---

## Output and Verbosity

```bash
# Verbose output (see each test name)
[YOUR_TEST_COMMAND] --verbose

# Silent (errors only)
[YOUR_TEST_COMMAND] --silent

# Show only failing tests
[YOUR_TEST_COMMAND] --onlyFailures

# Don't show test names, just summary
[YOUR_TEST_COMMAND] --no-verbose
```

---

## Coverage

```bash
# Run with coverage report (output to console + coverage/ folder)
[YOUR_PACKAGE_MANAGER] run test:coverage

# Coverage for specific file only
[SINGLE_TEST_COMMAND] --coverage --collectCoverageFrom="[SRC_DIR]/[module].[ext]" [TESTS_DIR]/unit/[module].test.[ext]
```

After running, open the HTML report:
```bash
# macOS
open coverage/lcov-report/index.html

# Windows
start coverage/lcov-report/index.html

# Linux
xdg-open coverage/lcov-report/index.html
```

---

## Debugging Failing Tests

### Inspect test output

```bash
# Show console.log from inside tests
[YOUR_TEST_COMMAND] --verbose 2>&1 | head -100

# Show full error stack traces
[YOUR_TEST_COMMAND] --verbose --no-coverage
```

### Run in debug mode

```bash
# Node debugger (attach VS Code)
node --inspect-brk node_modules/[TEST_BIN]/bin/[TEST_CMD] --runInBand [file]

# VS Code: use the "Debug Tests" launch config from .vscode/launch.json
```

### Isolate a failing test

```bash
# Run only failed tests from last run
[YOUR_TEST_COMMAND] --onlyFailures

# Run a single test in isolation
[SINGLE_TEST_COMMAND] -t "[exact test name]" --runInBand
```

---

## Flags Reference

| Flag | Description |
|------|-------------|
| `--runInBand` | Run tests serially (not in parallel) — useful for debugging |
| `--verbose` | Show each test name in results |
| `--coverage` | Generate coverage report |
| `--watch` | Watch mode |
| `--watchAll` | Watch all files, not just changed |
| `--silent` | Suppress all output except errors |
| `--bail [n]` | Stop after n failures |
| `--forceExit` | Force exit after tests complete |
| `--clearCache` | Clear the test cache |

---

## CI vs Local

| Scenario | Command |
|----------|---------|
| Local development | `[YOUR_PACKAGE_MANAGER] run test:watch` |
| Before committing | `[YOUR_TEST_COMMAND]` |
| Before opening PR | `[YOUR_PACKAGE_MANAGER] run test:coverage` |
| CI pipeline | `[YOUR_PACKAGE_MANAGER] run test:all` |

---

## Performance Tips

- **Unit tests first**: Run `test:unit` during development (fastest feedback)
- **Skip E2E locally**: E2E is slow — run it before PR, not during active coding
- **Use `--bail 1`** when you know what's broken — stop after first failure
- **`--runInBand`** for debugging: parallel execution can obscure timing issues
- **Watch mode** for TDD: immediate feedback loop

---

## Troubleshooting

See [Troubleshooting Guide](./04-troubleshooting.md) for specific error solutions.

Quick fixes for common issues:

```bash
# Clear Jest cache (fixes mysterious failures)
[YOUR_TEST_COMMAND] --clearCache

# Re-install dependencies (fixes module resolution errors)
rm -rf node_modules && [YOUR_PACKAGE_MANAGER] install

# Re-install Playwright browsers (fixes E2E browser errors)
[E2E_INSTALL_COMMAND]
```
