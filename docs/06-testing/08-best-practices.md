# Testing Best Practices

Patterns, conventions, and anti-patterns for writing high-quality tests.

---

## Core Principles

### 1. Tests Are Documentation

A test should explain what the code does without reading the code:

```[YOUR_LANGUAGE]
// ❌ Bad: No description of behavior
test('it works', () => {
  const result = applyDiscount(100, 20);
  expect(result).toBe(80);
});

// ✅ Good: Documents expected behavior
test('applies percentage discount to price and returns reduced amount', () => {
  const price = 100;
  const discountPercent = 20;
  const expected = 80;

  const result = applyDiscount(price, discountPercent);

  expect(result).toBe(expected);
});
```

### 2. One Behavior Per Test

Each test verifies exactly one thing. When it fails, you know precisely what broke.

```[YOUR_LANGUAGE]
// ❌ Bad: Multiple behaviors in one test
test('user operations', () => {
  const user = createUser('Alice');
  expect(user.name).toBe('Alice');
  user.setAge(25);
  expect(user.age).toBe(25);
  user.deactivate();
  expect(user.isActive).toBe(false);
});

// ✅ Good: Separate tests for separate behaviors
test('createUser sets name from parameter', () => {
  const user = createUser('Alice');
  expect(user.name).toBe('Alice');
});

test('setAge updates user age', () => {
  const user = createUser('Alice');
  user.setAge(25);
  expect(user.age).toBe(25);
});

test('deactivate sets isActive to false', () => {
  const user = createUser('Alice');
  user.deactivate();
  expect(user.isActive).toBe(false);
});
```

### 3. Arrange-Act-Assert (AAA) Pattern

Every test has three distinct sections:

```[YOUR_LANGUAGE]
test('returns sorted array', () => {
  // Arrange — set up input data and expected output
  const input = [3, 1, 4, 1, 5];
  const expected = [1, 1, 3, 4, 5];

  // Act — call the code being tested
  const result = sortArray(input);

  // Assert — verify the result
  expect(result).toEqual(expected);
});
```

Never skip a section. If there's no Arrange, use a comment. If there's no Act, something is wrong.

---

## Naming Conventions

### Test Names

Format: `[action] when [condition] should [expected result]` or `[subject] [behavior]`

```[YOUR_LANGUAGE]
// ✅ Good names
test('throws InvalidInput when price is negative')
test('returns 0 when cart is empty')
test('sends email after successful registration')
test('sanitizes HTML in user-provided input')

// ❌ Bad names
test('test1')
test('works')
test('should work correctly')
test('handles the edge case')
```

### Describe Blocks

Group related tests under `describe`:

```[YOUR_LANGUAGE]
describe('[ModuleName]', () => {            // Top level: module
  describe('[methodName]', () => {          // Second level: method/function
    test('[behavior when condition]', () => {  // Third level: specific test
      // ...
    });
  });
});
```

---

## Test Isolation

### Reset State in `beforeEach`

```[YOUR_LANGUAGE]
describe('CartModule', () => {
  let cart;

  beforeEach(() => {
    // Always start with a fresh state
    cart = createMockCart();
    document.body.innerHTML = '<div id="cart"></div>';
  });

  afterEach(() => {
    // Clean up anything that persists
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('adds item to cart', () => {
    cart.add({ id: 1, name: 'Item', price: 10 });
    expect(cart.items).toHaveLength(1);
  });
});
```

### Never Share Mutable State Between Tests

```[YOUR_LANGUAGE]
// ❌ Bad: Shared mutable state
const sharedCart = new Cart(); // Modified by all tests

test('test 1', () => {
  sharedCart.add(item1); // Pollutes sharedCart for test 2
  expect(sharedCart.count).toBe(1);
});

test('test 2', () => {
  // Fails! Cart has item1 from test 1
  expect(sharedCart.count).toBe(0);
});

// ✅ Good: Fresh state per test
test('test 1', () => {
  const cart = new Cart(); // Fresh instance
  cart.add(item1);
  expect(cart.count).toBe(1);
});
```

---

## What to Test

### Test Boundaries, Not Internals

```[YOUR_LANGUAGE]
// ❌ Bad: Tests internal implementation
test('uses forEach to iterate items', () => {
  const spy = jest.spyOn(Array.prototype, 'forEach');
  processItems([1, 2, 3]);
  expect(spy).toHaveBeenCalled(); // Who cares HOW it iterates
});

// ✅ Good: Tests observable behavior
test('processes all items in the list', () => {
  const results = processItems([1, 2, 3]);
  expect(results).toEqual([2, 4, 6]); // Doubled values
});
```

### Test Edge Cases

For every function, cover:

| Case | Example |
|------|---------|
| Happy path | Normal valid input |
| Empty input | `[]`, `''`, `null` |
| Single item | `[1]` |
| Maximum value | `Number.MAX_VALUE` |
| Negative value | `-1`, `-100` |
| Invalid type | `'string'` instead of `number` |
| Boundary value | Exactly at limits |

---

## TDD Approach (Test-Driven Development)

Write the test before the implementation:

```
1. Write a failing test (RED)
2. Write minimal code to pass (GREEN)
3. Refactor with confidence (REFACTOR)
```

```[YOUR_LANGUAGE]
// Step 1: Write failing test
test('formats currency with dollar sign and 2 decimals', () => {
  expect(formatCurrency(1234.5)).toBe('$1,234.50');
});
// → Test fails (function doesn't exist yet) ✅

// Step 2: Write minimal implementation
function formatCurrency(amount) {
  return '$' + amount.toFixed(2);
}
// → Test passes, but imperfect ✅

// Step 3: Refactor
function formatCurrency(amount) {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}
// → Tests still pass, better implementation ✅
```

---

## Anti-Patterns to Avoid

### ❌ Testing Implementation Details

```[YOUR_LANGUAGE]
// ❌ Bad: Test breaks when you rename an internal variable
test('uses tempArray internally', () => {
  const spy = jest.spyOn(module, '_tempArray');
  process();
  expect(spy).toHaveBeenCalled();
});
```

### ❌ Assertions Without Meaning

```[YOUR_LANGUAGE]
// ❌ Bad: This test will always pass
test('function executes', () => {
  doSomething();
  expect(true).toBe(true);
});
```

### ❌ Hardcoded Magic Numbers

```[YOUR_LANGUAGE]
// ❌ Bad: Why 80? What is 1000? No context
test('test', () => {
  expect(calc(1000)).toBe(80);
});

// ✅ Good: Named constants explain the intent
test('calculates 8% tax on price', () => {
  const PRICE = 1000;
  const TAX_RATE = 0.08;
  const EXPECTED_TAX = 80;

  expect(calculateTax(PRICE, TAX_RATE)).toBe(EXPECTED_TAX);
});
```

### ❌ Skipping Tests Without Documentation

```[YOUR_LANGUAGE]
// ❌ Bad: Nobody knows why this is skipped
test.skip('some test', () => { ... });

// ✅ Good: Document why and what to do
test.skip('TODO(#B003): Flaky due to race condition in timer mock — fix after #T001 refactor', () => {
  // ...
});
```

### ❌ `test.only` Left in Code

```[YOUR_LANGUAGE]
// ❌ NEVER commit this — it causes all other tests to be skipped in CI!
test.only('my test', () => { ... });
```

---

## Mocking Best Practices

### Mock at the Boundary

Only mock things your code doesn't control (external APIs, file system, time):

```[YOUR_LANGUAGE]
// ✅ Good: Mock external dependency
jest.spyOn(fetch, 'call').mockResolvedValue(fakeResponse);

// ❌ Bad: Mock your own internal function
jest.spyOn(myModule, 'helperFn').mockReturnValue(42);
// If you need to mock your own code, it suggests a design problem
```

### Verify Mock Calls Only When Behavior Depends On Them

```[YOUR_LANGUAGE]
// ✅ Good: Verifying a side effect that matters
test('logs error when save fails', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  
  saveWithError();

  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Save failed'));
});

// ❌ Bad: Verifying implementation details
test('calls internal helper', () => {
  const spy = jest.spyOn(module, '_internalHelper');
  publicFunction();
  expect(spy).toHaveBeenCalled(); // Doesn't test user-visible behavior
});
```

---

## Quality Checklist

Before submitting a PR with new tests:

### Test Quality
- [ ] Each test has a descriptive name that reads like a specification
- [ ] Each test follows the Arrange/Act/Assert pattern
- [ ] Each test covers one behavior only
- [ ] Tests are independent (no shared mutable state)
- [ ] Tests clean up after themselves in `afterEach`

### Coverage
- [ ] Happy path is covered
- [ ] At least two edge cases are covered
- [ ] Error paths are covered
- [ ] Coverage does not drop below [COVERAGE_THRESHOLD]%

### Maintenance
- [ ] No `test.only` left in code
- [ ] No empty tests or assertions
- [ ] No magic numbers (use named constants)
- [ ] Skipped tests are documented with reason and TODO ID

### Performance
- [ ] Unit tests run in < [UNIT_MAX_MS]ms
- [ ] Integration tests run in < [INT_MAX_MS]ms
- [ ] No unnecessary `await`s or `setTimeout`s
