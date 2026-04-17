# Test Strategy

The philosophy and approach behind the [PROJECT_NAME] test suite.

---

## Core Principle

> **"Tests are executable documentation."**

Tests guarantee that:
- ✅ Functionality keeps working after changes
- ✅ New contributors understand the code
- ✅ Bugs are caught before production
- ✅ Refactoring is safe

---

## The Testing Pyramid

```
         /\
        /  \     E2E ([YOUR_E2E_FRAMEWORK]) — 10%
       / 10 \    Full user flows
      /______\
     /        \  Integration ([YOUR_TEST_FRAMEWORK]) — 30%
    /    30    \ Combined modules
   /____________\
  /              \ Unit ([YOUR_TEST_FRAMEWORK]) — 60%
 /       60       \ Isolated functions
/__________________\
```

### Why This Ratio?

| Type | Quantity | Justification |
|------|----------|---------------|
| **Unit** | 60% | Cheap, fast, immediate feedback |
| **Integration** | 30% | Verify module compatibility |
| **E2E** | 10% | Expensive, slow, but test real experience |

---

## Test Types

### Unit Tests

**What**: Individual functions or methods in isolation  
**Where**: `[TESTS_DIR]/unit/`  
**Tools**: [YOUR_TEST_FRAMEWORK]  
**Run time**: Milliseconds per test

**Test when**:
- Pure logic functions (calculations, transformations, validations)
- State transitions
- Edge cases (empty inputs, boundary values, error conditions)

**Don't test**:
- Implementation details (internal variable names, private methods)
- Third-party libraries
- I/O operations (file system, network, database)

**Example structure**:
```
[TESTS_DIR]/unit/
├── [module-1].test.[ext]    # Tests for [module 1]
├── [module-2].test.[ext]    # Tests for [module 2]
└── __mocks__/               # Manual mocks for external dependencies
```

### Integration Tests

**What**: Multiple modules working together  
**Where**: `[TESTS_DIR]/integration/`  
**Tools**: [YOUR_TEST_FRAMEWORK] + [TEST_ENVIRONMENT]  
**Run time**: Seconds per test

**Test when**:
- How two or more modules interact
- DOM/UI behavior driven by state changes
- Data flows between layers

**Don't test**:
- Full user journeys (use E2E)
- Individual function logic (use Unit)

### E2E Tests

**What**: Complete user flows from a real browser  
**Where**: `[TESTS_DIR]/e2e/`  
**Tools**: [YOUR_E2E_FRAMEWORK]  
**Run time**: Seconds to minutes per test

**Test when**:
- Critical user journeys (registration, login, core feature flow)
- Cross-browser behavior
- Visual regressions

**Keep minimal**: E2E tests are expensive. Cover the happy path + 1-2 critical error paths per flow.

---

## Coverage Targets

| Scope | Target |
|-------|--------|
| Global (all files) | [COVERAGE_THRESHOLD]% |
| Critical modules | [STRICT_THRESHOLD]% |
| New code (PR requirement) | No regression from baseline |

Coverage is enforced in CI — PRs that drop below the threshold will fail.

---

## What We Don't Test

| Category | Reason |
|----------|--------|
| Third-party libraries | Their authors test them |
| [YOUR_TEST_FRAMEWORK] itself | Framework responsibility |
| Generated/compiled code | Test the source, not the output |
| Trivial getters/setters | Low value, high noise |

---

## Test Naming Convention

Tests should read like specifications:

```
describe('[Module or Feature]', () => {
  describe('[method or behavior]', () => {
    test('[action] when [condition] should [expected result]', () => {
      // ...
    });
  });
});
```

Examples:
- ✅ `"calculates total price when discount is applied"`
- ✅ `"throws error when user is not authenticated"`
- ❌ `"test 1"` — meaningless
- ❌ `"works correctly"` — vague

---

## Test Independence

Every test must be:

1. **Independent**: No test relies on another test's state
2. **Repeatable**: Same result every run
3. **Self-cleaning**: Resets any state it changes (in `afterEach`)
4. **Fast**: Unit tests < 50ms, integration < 500ms

---

## Related Docs

- [Writing Tests](./02-writing-tests.md) — How to write tests for this project
- [Running Tests](./03-running-tests.md) — Commands and flags
- [Best Practices](./08-best-practices.md) — Patterns and anti-patterns
