# Test Troubleshooting

Solutions for the most common test failures in [PROJECT_NAME].

---

## Quick Diagnostic Checklist

Before diving into specific errors, try these first:

```bash
# 1. Clear Jest cache
[YOUR_TEST_COMMAND] --clearCache

# 2. Re-run the specific failing test in isolation
[SINGLE_TEST_COMMAND] -t "[test name]" --runInBand

# 3. Add verbose output to see full error
[YOUR_TEST_COMMAND] --verbose

# 4. Check if tests pass individually but fail together (state leak)
[YOUR_TEST_COMMAND] --runInBand --verbose
```

---

## Common Errors and Fixes

### `Cannot find module '[module]'`

**Cause**: Module alias not configured, or wrong import path.

```
FAIL tests/unit/module.test.[ext]
● Test suite failed to run
  Cannot find module '@/module' from 'tests/unit/module.test.[ext]'
```

**Fix**: Check module aliases in `[YOUR_TEST_FRAMEWORK].config.[ext]`:
```[YOUR_LANGUAGE]
// jest.config.js
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/[SRC_DIR]/$1',
}
```

Verify the file exists at the mapped path.

---

### `ReferenceError: [globalVar] is not defined`

**Cause**: Test tries to use a global variable that doesn't exist in the test environment.

**Fix A**: Define the global in `[SETUP_FILE]`:
```[YOUR_LANGUAGE]
// jest.setup.js
global.[varName] = [defaultValue];
```

**Fix B**: Mock the global in the specific test:
```[YOUR_LANGUAGE]
beforeEach(() => {
  global.[varName] = [testValue];
});

afterEach(() => {
  delete global.[varName];
});
```

---

### `TypeError: [fn] is not a function`

**Cause**: Trying to call something that isn't properly exported, or import is wrong.

**Fix**: Verify the function is exported from the source file and imported correctly in the test.

---

### Tests pass individually but fail together

**Cause**: State leak — one test is modifying shared state that another test depends on.

**Diagnosis**:
```bash
# Run in serial to see which test causes it
[YOUR_TEST_COMMAND] --runInBand

# Try randomizing test order
[YOUR_TEST_COMMAND] --randomize
```

**Fix**: Add proper cleanup in `afterEach`:
```[YOUR_LANGUAGE]
afterEach(() => {
  // Reset all state changed during the test
  [RESET_STATE_STATEMENT];
  document.body.innerHTML = '';
  localStorage.clear();
  jest.clearAllMocks();
});
```

---

### `Timeout: exceeded [N]ms`

**Cause**: Test relies on a real async operation when fake timers are active (or vice versa).

**Fix A**: Advance fake timers:
```[YOUR_LANGUAGE]
test('resolves after timeout', () => {
  const promise = someAsyncFunction();
  jest.advanceTimersByTime(1000); // Fast-forward
  return expect(promise).resolves.toBe([value]);
});
```

**Fix B**: Switch to real timers for this test:
```[YOUR_LANGUAGE]
test('real async operation', async () => {
  jest.useRealTimers();
  
  const result = await realAsyncOperation();
  expect(result).toBe([value]);
});
```

**Fix C**: Increase timeout for slow tests:
```[YOUR_LANGUAGE]
test('slow operation', async () => {
  // ...
}, 30000); // 30 second timeout for this test only
```

---

### `localStorage is not defined`

**Cause**: Test environment doesn't include localStorage mock (check setup file).

**Fix**: Verify `[SETUP_FILE]` sets up localStorage mock:
```[YOUR_LANGUAGE]
// jest.setup.js
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

---

### `window.[method] is not a function` (alert, confirm, prompt)

**Cause**: These are not available in jsdom without mocking.

**Fix**: Mock in `[SETUP_FILE]`:
```[YOUR_LANGUAGE]
// jest.setup.js
global.alert = jest.fn();
global.confirm = jest.fn(() => true); // Returns true by default
global.prompt = jest.fn(() => null);
```

Override in specific tests when needed:
```[YOUR_LANGUAGE]
test('user cancels confirm dialog', () => {
  global.confirm.mockReturnValueOnce(false);
  // ...
});
```

---

### E2E: `page.goto` times out

**Cause**: Dev server isn't running or is on wrong port.

**Fix A**: Check `playwright.config.js` webServer section:
```[YOUR_LANGUAGE]
webServer: {
  command: '[DEV_SERVER_COMMAND]',
  url: 'http://localhost:[PORT]',
  reuseExistingServer: !process.env.CI,
}
```

**Fix B**: Start server manually before running E2E:
```bash
# Terminal 1
[YOUR_DEV_COMMAND]

# Terminal 2
[YOUR_PACKAGE_MANAGER] run test:e2e
```

---

### E2E: `Locator not found` / element not visible

**Cause**: Page hasn't loaded, element is hidden, or selector is wrong.

**Fix A**: Wait for element:
```[YOUR_LANGUAGE]
// Wait for element to appear
await page.waitForSelector('[data-testid="[element]"]');
// Then interact
await page.click('[data-testid="[element]"]');
```

**Fix B**: Use `toBeVisible()` which auto-waits:
```[YOUR_LANGUAGE]
await expect(page.locator('[data-testid="[element]"]')).toBeVisible();
```

**Fix C**: Debug visually:
```bash
# Open browser in headed mode to see what's happening
[E2E_TEST_COMMAND] --headed --debug
```

---

### Coverage drops below threshold

**Cause**: New code added without corresponding tests.

```
Jest: "global" coverage threshold for [type] ([X]%) not met: [Y]%
```

**Fix**: 
1. Generate the HTML coverage report: `[YOUR_PACKAGE_MANAGER] run test:coverage`
2. Open `coverage/lcov-report/index.html`
3. Find uncovered lines (red highlighting)
4. Add tests for those lines
5. If code is truly untestable (e.g., error handler for impossible state), use:

```[YOUR_LANGUAGE]
/* istanbul ignore next */
function impossibleEdgeCase() { ... }
```

Use sparingly — don't use this to avoid writing tests.

---

### Flaky Tests (Passes Sometimes, Fails Sometimes)

**Common causes**:
1. **Race conditions** in async code — use `await` properly
2. **Date/time dependencies** — mock `Date.now()` or `new Date()`
3. **Random values** — mock `Math.random()`
4. **Order-dependent** — tests sharing state

**Fix for time-dependent tests**:
```[YOUR_LANGUAGE]
beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(1000000000000); // Fixed timestamp
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

**Fix for random-dependent tests**:
```[YOUR_LANGUAGE]
beforeEach(() => {
  jest.spyOn(Math, 'random').mockReturnValue(0.5); // Fixed value
});
```

---

## Getting More Help

1. Check [Best Practices](./08-best-practices.md) for patterns that prevent these issues
2. Add `console.log` inside the test to inspect state
3. Use `test.only()` to isolate a test (remember to remove before committing)
4. Check the [Test API Reference](./07-test-api.md) for available helpers

```[YOUR_LANGUAGE]
// Temporarily isolate a test
test.only('my test', () => { ... }); // Only this test runs

// Skip a test temporarily
test.skip('broken test', () => { ... }); // This test is skipped
```
