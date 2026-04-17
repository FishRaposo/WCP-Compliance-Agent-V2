# Test API Reference

Complete reference for test helpers, mocks, and fixtures available in [PROJECT_NAME] tests.

> All helpers below are available globally in every test file — no import needed.  
> They are defined in `[SETUP_FILE]` and loaded via `setupFilesAfterFramework` in `[TEST_CONFIG_FILE]`.

---

## Global Helpers

### `[createMockState](overrides?)`

Creates a complete, valid mock of the application state object.

**Signature**: `[createMockState](overrides?: Partial<[StateType]>): [StateType]`

**Parameters**:
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `overrides` | `object` | `{}` | Fields to override in the default state |

**Returns**: A complete state object with sensible defaults for all fields.

**Example**:
```[YOUR_LANGUAGE]
// Default state
const state = [createMockState]();

// Override specific fields
const customState = [createMockState]({
  [field1]: [custom value],
  [field2]: [custom value],
});
```

**Default values**:
```[YOUR_LANGUAGE]
{
  [field1]: [default],
  [field2]: [default],
  [field3]: [default],
  // ... (fill in from your actual state shape)
}
```

---

### `[createMockEntity](overrides?)`

Creates a complete mock of a [Entity] object (e.g., user, employee, item).

**Signature**: `[createMockEntity](overrides?: Partial<[EntityType]>): [EntityType]`

**Example**:
```[YOUR_LANGUAGE]
const entity = [createMockEntity]({
  [field]: [override value],
});
```

**Default values**:
```[YOUR_LANGUAGE]
{
  id: 1,
  name: '[Mock Entity]',
  [field1]: [default],
  // ...
}
```

---

### `[mockRandomSequence](values)`

Stubs `Math.random` with a fixed sequence of values for deterministic tests.

**Signature**: `[mockRandomSequence](values: number[]): void`

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `values` | `number[]` | Sequence of values (0-1) returned by `Math.random()` in order |

**Example**:
```[YOUR_LANGUAGE]
[mockRandomSequence]([0.1, 0.5, 0.9]);

Math.random(); // → 0.1
Math.random(); // → 0.5
Math.random(); // → 0.9
Math.random(); // → 0.1 (wraps around)
```

---

### `[simulateEvent](element, type, data?)`

Dispatches a DOM event on an element.

**Signature**: `[simulateEvent](element: Element, type: string, data?: EventInit): void`

**Parameters**:
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `element` | `Element` | required | The DOM element to dispatch the event on |
| `type` | `string` | required | Event type (`'click'`, `'input'`, `'keydown'`, etc.) |
| `data` | `object` | `{}` | Additional event properties |

**Example**:
```[YOUR_LANGUAGE]
const button = document.getElementById('save-btn');
[simulateEvent](button, 'click');

// With keyboard data
[simulateEvent](input, 'keydown', { key: 'Enter', code: 'Enter' });

// With mouse position
[simulateEvent](canvas, 'mousemove', { clientX: 100, clientY: 200 });
```

---

## Global Mocks

These are automatically set up in every test (no setup code needed).

### `localStorage` / `sessionStorage`

In-memory implementation that clears between tests.

```[YOUR_LANGUAGE]
// Use normally in tests
localStorage.setItem('key', 'value');
const value = localStorage.getItem('key'); // → 'value'

// Verify calls
expect(localStorage.setItem).toHaveBeenCalledWith('key', 'value');

// Override for a test
localStorage.setItem.mockImplementationOnce(() => {
  throw new Error('QuotaExceededError');
});
```

### `window.alert`

Mocked with `jest.fn()`. Does not show browser dialogs.

```[YOUR_LANGUAGE]
// Verify alert was called
expect(window.alert).toHaveBeenCalledWith('Expected message');

// Get the message that was alerted
const message = window.alert.mock.calls[0][0];
```

### `window.confirm`

Mocked with `jest.fn(() => true)` — returns `true` by default.

```[YOUR_LANGUAGE]
// Default: user confirms
confirm('Are you sure?'); // → true

// Override for a test where user cancels
window.confirm.mockReturnValueOnce(false);
functionThatUsesConfirm(); // confirm will return false once

// Verify confirm was called
expect(window.confirm).toHaveBeenCalledWith('Expected prompt');
```

### `window.prompt`

Mocked with `jest.fn(() => null)`.

```[YOUR_LANGUAGE]
// Default: user cancels
prompt('Enter value'); // → null

// Simulate user entering a value
window.prompt.mockReturnValueOnce('user input');
```

---

## Timer Mocks

Fake timers are **on by default** (`jest.useFakeTimers()` in `[SETUP_FILE]`).

```[YOUR_LANGUAGE]
// Advance time by 1 second
jest.advanceTimersByTime(1000);

// Run all pending timers
jest.runAllTimers();

// Run only immediately-pending timers (not nested)
jest.runOnlyPendingTimers();

// Get current fake time
Date.now(); // Returns controlled time

// Switch to real timers for a specific test
test('real async test', async () => {
  jest.useRealTimers();
  // ... real async operations ...
});
```

---

## Test Doubles (Mocks, Spies, Stubs)

### Create a mock function

```[YOUR_LANGUAGE]
const mockFn = jest.fn();
mockFn(); // Call it
expect(mockFn).toHaveBeenCalled();
```

### Mock a return value

```[YOUR_LANGUAGE]
const mockFn = jest.fn();
mockFn.mockReturnValue(42);       // Always returns 42
mockFn.mockReturnValueOnce(100);  // Returns 100 once, then default
mockFn.mockResolvedValue(data);   // Returns Promise.resolve(data)
mockFn.mockRejectedValue(error);  // Returns Promise.reject(error)
```

### Spy on existing function

```[YOUR_LANGUAGE]
// Watch a method without replacing it
const spy = jest.spyOn(object, 'methodName');
// Original method still runs

// Replace implementation
const spy = jest.spyOn(object, 'methodName').mockImplementation(() => 'mocked');

// Restore original
spy.mockRestore();
```

### Mock entire module

```[YOUR_LANGUAGE]
jest.mock('@/module-name', () => ({
  functionA: jest.fn(() => 'mocked A'),
  functionB: jest.fn(),
}));
```

---

## Playwright Fixtures (E2E)

Available in `[TESTS_DIR]/e2e/` via `@playwright/test`:

```[YOUR_LANGUAGE]
const { test, expect } = require('@playwright/test');

test('example', async ({ page, context, browser }) => {
  // page — a single browser tab
  // context — a browser context (multiple pages)
  // browser — the browser instance
});
```

### Custom Fixtures

If your project defines custom fixtures in `[TESTS_DIR]/e2e/fixtures.[ext]`:

```[YOUR_LANGUAGE]
// [TESTS_DIR]/e2e/fixtures.[ext]
const base = require('@playwright/test');

const test = base.test.extend({
  loggedInPage: async ({ page }, use) => {
    // Setup: log in
    await page.goto('/login');
    await page.fill('[name="username"]', '[TEST_USER]');
    await page.click('[type="submit"]');

    await use(page); // Provide to test

    // Teardown: log out
    await page.click('[data-testid="logout"]');
  },
});

module.exports = { test, expect: base.expect };
```

Usage:
```[YOUR_LANGUAGE]
const { test } = require('./fixtures');

test('protected page', async ({ loggedInPage }) => {
  await loggedInPage.goto('/dashboard');
  // Already logged in
});
```

---

## Custom Matchers

If the project defines custom [YOUR_TEST_FRAMEWORK] matchers in `[SETUP_FILE]`:

```[YOUR_LANGUAGE]
// Example custom matcher
expect([value]).toBeWithinRange(min, max);
expect([element]).toBeVisible();
expect([state]).toBeValidState();
```

---

## Setup File Reference

Location: `[SETUP_FILE]` (e.g., `jest.setup.js`)

This file runs before every test file. It sets up:

```[YOUR_LANGUAGE]
// 1. Fake timers
jest.useFakeTimers();

// 2. Storage mocks
// localStorage, sessionStorage

// 3. Window method mocks  
// alert, confirm, prompt

// 4. Global helpers
// createMockState, createMockEntity, etc.

// 5. Custom matchers
// expect.extend({ ... })
```

To add a new global helper, add it to this file:
```[YOUR_LANGUAGE]
global.[helperName] = function(overrides = {}) {
  return {
    [defaultField]: [defaultValue],
    ...overrides,
  };
};
```
