# CI/CD — Automated Testing

How tests run automatically on GitHub Actions for [PROJECT_NAME].

---

## Overview

Every push and pull request triggers the CI/CD pipeline, which:

1. ✅ Runs unit and integration tests
2. ✅ Checks coverage thresholds
3. ✅ Runs E2E tests (after unit/integration pass)
4. ✅ Runs linter and formatter check
5. ✅ Uploads test artifacts (reports, coverage)

**PRs cannot be merged** if any of these steps fail.

---

## Workflow File

Location: `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

---

## Jobs

### Job 1: `unit-integration`

Runs all unit and integration tests and checks coverage.

**Steps:**
1. Checkout code
2. Set up [YOUR_LANGUAGE] runtime
3. Install dependencies
4. Run unit tests
5. Run integration tests
6. Run coverage check
7. Upload coverage report artifact

**Fail conditions:**
- Any test fails
- Coverage drops below [COVERAGE_THRESHOLD]%

### Job 2: `e2e`

Runs end-to-end tests in real browsers. Only runs after `unit-integration` passes.

**Steps:**
1. Checkout code
2. Install dependencies
3. Install browser binaries
4. Run E2E tests
5. Upload Playwright report artifact
6. Upload test results artifact

**Fail conditions:**
- Any E2E test fails

### Job 3: `lint`

Checks code style and formatting.

**Steps:**
1. Run `[YOUR_LINT_TOOL]`
2. Run `[YOUR_FORMAT_TOOL] --check`

**Fail conditions:**
- Lint errors found
- Code not formatted correctly

---

## Branch Protection

To enforce quality gates, configure branch protection on `main`:

Go to **GitHub → Settings → Branches → Add branch protection rule**:

- ✅ Require status checks to pass before merging
  - `unit-integration`
  - `e2e`
  - `lint`
- ✅ Require branches to be up to date
- ✅ Dismiss stale reviews when new commits are pushed

---

## Viewing CI Results

### In a PR
- The **Checks** section shows all job statuses
- Click on a failed job to see the logs
- Download artifacts (coverage report, Playwright report) from the **Summary** page

### Playwright Report
When E2E tests fail, download `playwright-report` artifact to see:
- Failed test steps with screenshots
- Videos of test runs
- Full trace viewer

```bash
# View locally after downloading
cd playwright-report
npx serve .
# Open http://localhost:3000
```

---

## Running the CI Workflow Locally

To simulate what CI does on your machine:

```bash
# Unit + integration (with coverage)
[YOUR_TEST_COMMAND] && [YOUR_PACKAGE_MANAGER] run test:coverage

# E2E (CI mode)
CI=true [YOUR_PACKAGE_MANAGER] run test:e2e

# Lint check
[YOUR_LINT_COMMAND]
[FORMAT_CHECK_COMMAND]
```

---

## Adding a Coverage Badge

After setting up Codecov or Coveralls, add a badge to the root `README.md`:

```markdown
<!-- Codecov -->
[![Coverage](https://codecov.io/gh/[GITHUB_REPO]/branch/main/graph/badge.svg)](https://codecov.io/gh/[GITHUB_REPO])

<!-- Coveralls -->
[![Coverage Status](https://coveralls.io/repos/github/[GITHUB_REPO]/badge.svg?branch=main)](https://coveralls.io/github/[GITHUB_REPO])
```

---

## Debugging CI Failures

### Step 1: Read the error message

Click the failing job in the PR Checks section. Expand the failing step.

### Step 2: Reproduce locally

```bash
# For unit/integration failures
[YOUR_TEST_COMMAND] --verbose

# For coverage failures
[YOUR_PACKAGE_MANAGER] run test:coverage

# For E2E failures
[YOUR_PACKAGE_MANAGER] run test:e2e --headed  # Visual mode
```

### Step 3: Check for environment differences

Common CI vs local differences:

| Issue | Local | CI | Fix |
|-------|-------|----|-----|
| Different [LANGUAGE] version | [LOCAL_VERSION] | [CI_VERSION] | Match versions in `.nvmrc` / `.tool-versions` |
| Missing env var | Set in `.env` | Not set | Add to GitHub Actions `env:` |
| OS differences | macOS/Windows | Ubuntu | Test on Linux locally with Docker |
| Port conflicts | Available | Available | N/A |

### Step 4: Re-run CI

If you suspect a flaky test or transient failure:
- Click **"Re-run failed jobs"** in the GitHub Actions UI

---

## Environment Variables in CI

If your tests need environment variables:

```yaml
# In .github/workflows/test.yml
env:
  [VAR_NAME]: ${{ secrets.SECRET_NAME }}  # From GitHub Secrets
  [PUBLIC_VAR]: '[value]'                  # Non-sensitive values
```

Add secrets at: **GitHub → Settings → Secrets and variables → Actions**

Never commit secrets or `.env` files. Use GitHub Secrets.

---

## Skipping CI (Use Sparingly)

To skip CI for a commit (e.g., docs-only changes):

```bash
git commit -m "docs: update README [skip ci]"
```

Only use for true non-code changes (docs, comments). Never skip for code changes.
