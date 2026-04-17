# Testing Documentation

Complete guide to the test suite for [PROJECT_NAME]. 🧪

> **Goal**: [COVERAGE_THRESHOLD]%+ coverage with unit, integration, and E2E tests.

---

## 🎯 New to Testing This Project?

Follow this order:

1. **[Test Strategy](./01-test-strategy.md)** — Understand the philosophy (15 min)
2. **[Writing Tests](./02-writing-tests.md)** — Write your first test (30 min)
3. **[Running Tests](./03-running-tests.md)** — Run on your machine (10 min)

---

## 📚 Complete Index

| # | Document | Description | Time |
|---|----------|-------------|------|
| 01 | [Test Strategy](./01-test-strategy.md) | Pyramid, philosophy, when to use each type | 15 min |
| 02 | [Writing Tests](./02-writing-tests.md) | Step-by-step tutorial with examples | 30 min |
| 03 | [Running Tests](./03-running-tests.md) | Commands, flags, watch mode | 10 min |
| 04 | [Troubleshooting](./04-troubleshooting.md) | Common problems and solutions | 15 min |
| 05 | [Coverage Reports](./05-coverage-reports.md) | Reading coverage, thresholds | 10 min |
| 06 | [CI/CD](./06-ci-cd.md) | GitHub Actions workflow | 15 min |
| 07 | [Test API Reference](./07-test-api.md) | Helpers, mocks, fixtures | 20 min |
| 08 | [Best Practices](./08-best-practices.md) | TDD, patterns, anti-patterns | 20 min |

---

## 🚀 Quick Reference

```bash
# Run all tests
[YOUR_TEST_COMMAND]

# Unit tests only (fast)
[YOUR_PACKAGE_MANAGER] run test:unit

# With coverage report
[YOUR_PACKAGE_MANAGER] run test:coverage

# Watch mode (development)
[YOUR_PACKAGE_MANAGER] run test:watch

# E2E tests
[YOUR_PACKAGE_MANAGER] run test:e2e
```

---

## 🎓 Skill Levels

### 🟢 Beginner
Start with:
- [Test Strategy](./01-test-strategy.md) — What kinds of tests we write and why
- [Writing Tests](./02-writing-tests.md) — Your first test step by step
- [Running Tests](./03-running-tests.md) — How to run tests locally

### 🟡 Intermediate
Move to:
- [Coverage Reports](./05-coverage-reports.md) — What the coverage numbers mean
- [Troubleshooting](./04-troubleshooting.md) — When tests fail unexpectedly
- [Best Practices](./08-best-practices.md) — Write better tests

### 🔴 Advanced
Study:
- [Test API Reference](./07-test-api.md) — All available helpers and mocks
- [CI/CD](./06-ci-cd.md) — How tests run in automation
- [Best Practices](./08-best-practices.md) — TDD, complex patterns

---

## 📊 Current State

| Metric | Value |
|--------|-------|
| Coverage (global) | [CURRENT]% → target [COVERAGE_THRESHOLD]% |
| Unit tests | [COUNT] tests |
| Integration tests | [COUNT] tests |
| E2E tests | [COUNT] tests |
| Last run | [DATE] |

---

## 📁 Test File Location

```
[TESTS_DIR]/
├── unit/               # ← For pure logic, no DOM, no I/O
├── integration/        # ← For multiple modules together
└── e2e/                # ← For full user flows (Playwright)
```
