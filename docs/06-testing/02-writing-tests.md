# Writing Tests

Step-by-step guide to writing tests for [PROJECT_NAME].

---

## Your First Unit Test

### 1. Find the function to test

```[YOUR_LANGUAGE]
// [SRC_DIR]/[module].[ext]

/**
 * [Function description]
 * @param {[type]} [param] - [description]
 * @returns {[type]} [description]
 */
function [functionName]([param]) {
  return [logic];
}
```

### 2. Create the test file

```
[TESTS_DIR]/unit/[module].test.[ext]
```

Convention: Test file name mirrors the source file name.

### 3. Write the test

```[YOUR_LANGUAGE]
// [TESTS_DIR]/unit/[module].test.[ext]

// [YOUR_TEST_FRAMEWORK] — globals are available without imports
// const { functionName } = require('@/[module]'); // [IMPORT_PATTERN]

describe('[ModuleName]', () => {
  
  // Setup shared across tests in this describe block
  beforeEach(() => {
    // Reset state before each test
    [RESET_STATEMENT];
  });

  describe('[functionName]', () => {
    
    test('returns [expected] when [condition]', () => {
      // Arrange
      const input = [VALUE];
      const expected = [EXPECTED_RESULT];

      // Act
      const result = [functionName](input);

      // Assert
      expect(result).toBe(expected);
    });

    test('returns [expected] when [edge case]', () => {
      // Arrange
      const input = [EDGE_CASE_VALUE];

      // Act
      const result = [functionName](input);

      // Assert
      expect(result).toBe([EXPECTED_EDGE_RESULT]);
    });

    test('throws [ErrorType] when [invalid condition]', () => {
      expect(() => {
        [functionName]([INVALID_INPUT]);
      }).toThrow([ErrorType]);
    });
  });
});
```

### 4. Run your test

```bash
[YOUR_PACKAGE_MANAGER] run test:unit
# or run just this file:
[SINGLE_TEST_COMMAND] [TESTS_DIR]/unit/[module].test.[ext]
```

---

## Integration Test Example

Integration tests verify that modules work together.

```[YOUR_LANGUAGE]
// [TESTS_DIR]/integration/[feature].test.[ext]

describe('[Feature] integration', () => {
  
  let [stateOrDependency];

  beforeEach(() => {
    // Set up realistic state
    [stateOrDependency] = [createMockState]({
      [field]: [value],
    });
    
    // Set up DOM if needed
    document.body.innerHTML = `
      <div id="[container]">
        <!-- minimal HTML needed for the test -->
      </div>
    `;
  });

  afterEach(() => {
    // Cleanup
    document.body.innerHTML = '';
    [RESET_STATE];
  });

  test('[feature] updates [output] when [action] occurs', () => {
    // Arrange
    const trigger = document.getElementById('[element-id]');

    // Act
    trigger.click();
    [MODULE_FUNCTION]([stateOrDependency]);

    // Assert
    const result = document.getElementById('[result-element]');
    expect(result.textContent).toBe('[expected text]');
  });
});
```

---

## E2E Test Example

E2E tests simulate real user behavior in a browser.

```[YOUR_LANGUAGE]
// [TESTS_DIR]/e2e/[flow].spec.[ext]

const { test, expect } = require('@playwright/test');

test.describe('[User Flow Name]', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');  // baseURL from playwright.config.js
  });

  test('user can [complete action]', async ({ page }) => {
    // Navigate
    await page.click('[data-testid="[button]"]');
    
    // Interact
    await page.fill('[data-testid="[input]"]', '[value]');
    await page.click('[data-testid="[submit]"]');

    // Assert
    await expect(page.locator('[data-testid="[result]"]')).toBeVisible();
    await expect(page.locator('[data-testid="[result]"]')).toHaveText('[expected]');
  });

  test('[action] persists after page reload', async ({ page }) => {
    // Do action
    await page.click('[data-testid="[button]"]');
    
    // Reload
    await page.reload();

    // Assert persistence
    await expect(page.locator('[data-testid="[indicator]"]')).toBeVisible();
  });
});
```

---

## Using Test Helpers

See [Test API Reference](./07-test-api.md) for all available helpers.

### [Helper 1] — [createMockState or equivalent]

```[YOUR_LANGUAGE]
// Available globally (no import needed) — defined in [SETUP_FILE]
const state = [createMockState]({
  [field1]: [value1],
  [field2]: [value2],
});
```

### [Helper 2] — [createMockEntity or equivalent]

```[YOUR_LANGUAGE]
const entity = [createMockEntity]({
  [field]: [override value],
});
```

### Mocking Random Values

```[YOUR_LANGUAGE]
// Control Math.random for predictable tests
[mockRandomSequence]([0.1, 0.5, 0.9]);

const result = functionThatUsesRandom();
// Math.random() will return 0.1, then 0.5, then 0.9
```

---

## Asserting DOM State

```[YOUR_LANGUAGE]
// Check element text
expect(document.getElementById('[id]').textContent).toBe('[value]');

// Check element visibility
expect(document.getElementById('[id]').style.display).toBe('none');

// Check element class
expect(document.getElementById('[id]').classList.contains('[class]')).toBe(true);

// Check element attribute
expect(document.getElementById('[id]').getAttribute('[attr]')).toBe('[value]');
```

---

## Asserting with [YOUR_TEST_FRAMEWORK] Matchers

```[YOUR_LANGUAGE]
// Equality
expect(value).toBe(42);           // Strict equality (===)
expect(value).toEqual({ a: 1 }); // Deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();

// Numbers
expect(value).toBeGreaterThan(10);
expect(value).toBeLessThanOrEqual(100);
expect(value).toBeCloseTo(0.1, 2); // Floating point

// Strings
expect(str).toContain('substring');
expect(str).toMatch(/regex/);

// Arrays
expect(arr).toContain(item);
expect(arr).toHaveLength(3);
expect(arr).toEqual([1, 2, 3]);

// Objects
expect(obj).toHaveProperty('key', value);
expect(obj).toMatchObject({ key: 'value' }); // Partial match

// Errors
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('error message');
expect(() => fn()).toThrow(ErrorClass);

// Functions/mocks
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenCalledTimes(2);
```

---

## Testing with Timers

```[YOUR_LANGUAGE]
// Fake timers are on by default in this project ([SETUP_FILE])

test('function executes after delay', () => {
  jest.useFakeTimers(); // Ensure fake timers are on

  const callback = jest.fn();
  setTimeout(callback, 1000);

  // Fast-forward time
  jest.advanceTimersByTime(1000);

  expect(callback).toHaveBeenCalled();
});

test('function that needs real timers', async () => {
  jest.useRealTimers(); // Switch to real timers for this test

  // ... test with actual async delays ...
});
```

---

## Common Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|---------|
| Testing implementation details | Brittle tests that break on refactor | Test behavior, not internals |
| Missing `afterEach` cleanup | State leaks between tests | Always clean up DOM and state |
| Magic numbers | Unclear test intent | Use named constants |
| Giant test functions | Hard to pinpoint failures | One assertion per test (or logical group) |
| Testing multiple things | Unclear failure reason | One behavior per `test()` |

---

## Checklist: Is Your Test Good?

- [ ] Test name describes behavior, not implementation
- [ ] Test has exactly three sections: Arrange, Act, Assert
- [ ] Test is independent (no shared mutable state)
- [ ] Test cleans up after itself
- [ ] Test covers the happy path
- [ ] Test covers at least one edge case
- [ ] Test runs in under [MAX_TIME]ms (unit) / [MAX_INT_TIME]ms (integration)

---

## Next Steps

- [Running Tests](./03-running-tests.md) — Run your new tests
- [Test API Reference](./07-test-api.md) — All available helpers
- [Best Practices](./08-best-practices.md) — Patterns for better tests
