# Unit Testing Skills

This document provides AI agents with comprehensive guidance for writing, reviewing, and improving unit tests in the ADSP monorepo. It is loaded at runtime by Copilot and by `unit-test-agent.js`.

---

## Invoking the Unit Test Agent

The agent is invoked via Node.js and accepts a `--mode` flag.

### generate — create a new test file for a source file

```bash
# Generate tests for a single file
node .github/scripts/unit-test-agent.js --mode generate --file apps/form-service/src/form/router.ts

# Generate tests for every untested file in a project
node .github/scripts/unit-test-agent.js --mode generate --project form-service
```

### review — audit existing tests and report issues

```bash
# Review the test file paired with a specific source file
node .github/scripts/unit-test-agent.js --mode review --file apps/status-service/src/status/router.ts

# Review all test files in a project
node .github/scripts/unit-test-agent.js --mode review --project status-service
```

### improve — rewrite or augment an existing test file

```bash
# Improve coverage and quality of an existing test file
node .github/scripts/unit-test-agent.js --mode improve --file libs/adsp-service-sdk/src/utils/adsp-id.ts
```

---

## Where Test Files Live

Tests are **colocated**: the test file lives in the **same folder** as the source file it covers.

```
apps/form-service/src/form/
├── router.ts
├── router.spec.ts       ← test file for router.ts
├── model.ts
└── model.spec.ts        ← test file for model.ts
```

Never create a `__tests__/` directory or place tests in a separate top-level `tests/` folder. The existing `tests/` directory at the repo root is reserved for integration and load tests.

---

## Naming Convention

The test file name is the source file name with `.spec` inserted before the extension.

| Source file       | Test file              |
| ----------------- | ---------------------- |
| `auth.service.ts` | `auth.service.spec.ts` |
| `Button.tsx`      | `Button.spec.tsx`      |
| `router.js`       | `router.spec.js`       |
| `adsp-id.ts`      | `adsp-id.spec.ts`      |

`.spec.ts` is the standard convention for this workspace. All existing test files in the repo use `.spec.ts`. The `.test.ts` suffix is also recognised by Jest and Nx but must not be used for new files.

---

## Framework — Jest via Nx

All unit tests in this workspace run through **Jest**, orchestrated by **Nx**.

### Running tests

```bash
# Run tests for a specific project
nx test <project-name>

# Run with coverage report
nx test <project-name> --coverage

# Run in watch mode (local development)
nx test <project-name> --watch

# Run tests for all projects affected by your branch
nx affected -t test

# Run with CI configuration (no cache, full output)
nx test <project-name> --configuration=ci
```

### Jest config

Each project has a `jest.config.ts` at its root. Global presets live in `jest.preset.js` and `jest-cover.preset.js` at the repo root. Do not duplicate configuration; extend the preset instead.

---

## Mock Patterns Used in This Repo

The following patterns are drawn from the existing test suite and must be followed for consistency.

### 1. Mock entire Node modules with `jest.mock`

```js
jest.mock('fs');
jest.mock('@octokit/rest', () => ({ Octokit: jest.fn() }));
```

Place `jest.mock` calls **before** any `require` / `import` statements that depend on the mocked module.

### 2. Set required environment variables before module import

Modules that read `process.env` constants at load time must have those variables set before the module is required.

```js
process.env.GITHUB_TOKEN = 'test-token';
process.env.PR_NUMBER = '1';

// Only now require the module
const { myFunction } = require('./my-module');
```

### 3. Mock module functions with `jest.fn()`

```js
const reviewFile = jest.fn();
const checkRepoFile = jest.fn().mockResolvedValue(false);
```

### 4. Reset mocks between tests

Use `afterEach` to prevent state leaking between tests when a module mock is shared across multiple `describe` blocks.

```js
afterEach(() => {
  jest.resetAllMocks();
});
```

### 5. Use `mockReturnValue` / `mockResolvedValue` for predictable outputs

```js
fs.existsSync.mockReturnValue(true);
fs.readFileSync.mockReturnValue('function_length_limit: 30\n');

const checkRepoFile = jest.fn().mockResolvedValue(true);
```

### 6. Inject dependencies rather than importing them globally

When a function accepts a dependency object (e.g. `{ reviewFile, checkRepoFile }`), pass a `jest.fn()` directly in the test. This avoids module-level mocking for simple cases.

```js
const { reviewComments } = await processFilesForReview(changedFiles, systemPrompt, {
  reviewFile: jest.fn().mockResolvedValue([]),
});
```

---

## Clean Code Rules That Apply to Tests

### Arrange / Act / Assert (AAA)

Every test body must follow the three-section structure. Add a blank line between sections to make them visually distinct.

```ts
test('returns an empty map when patch is null', () => {
  // Arrange
  const patch = null;

  // Act
  const result = buildLineToPositionMap(patch);

  // Assert
  expect(result).toEqual({});
});
```

### One concept per test

Each `test()` block must assert exactly one behaviour. Split compound assertions into separate tests so failure messages identify the broken behaviour precisely.

```ts
// ✗ Two concepts in one test
test('loads config', () => {
  expect(loadConfig().function_length_limit).toBe(50);
  expect(loadConfig().languages).toEqual(['ts', 'tsx', 'js', 'jsx']);
});

// ✓ One concept each
test('returns the default function_length_limit of 50 when .cleancode.yml does not exist', () => {
  expect(loadConfig().function_length_limit).toBe(50);
});

test('returns the default languages array when .cleancode.yml does not exist', () => {
  expect(loadConfig().languages).toEqual(['ts', 'tsx', 'js', 'jsx']);
});
```

### No logic in tests

Tests must not contain `if`, `for`, loops, or ternary expressions. If you need to test multiple values, use `test.each`.

```ts
// ✓ Use test.each for parameterised cases
const EXPECTED_RULES = ['2.1', '2.2', '2.3'];

test.each(EXPECTED_RULES)('includes rule %s in the prompt', (rule) => {
  expect(buildSystemPrompt(config, null)).toContain(`${rule} `);
});
```

### Meaningful test data

Use values that reflect the real domain, not `foo`, `bar`, or `123`. Test data should make the intent of the test immediately obvious.

```ts
// ✗ Meaningless
const result = processFile('abc', 'xyz');

// ✓ Domain-representative
const result = processFile('@@ -0,0 +1 @@\n+const x = 1;', 'src/auth.service.ts');
```

### Descriptive test names

Test names must read as a plain-English sentence describing the expected behaviour, not the implementation.

```ts
// ✗ Describes implementation
test('calls buildLineToPositionMap', ...);

// ✓ Describes behaviour
test('maps an added line to its correct diff position', ...);
```

---

## Coverage Threshold

The workspace enforces a minimum of **80% line coverage** per project. The agent will flag files that cannot reach this threshold with the tests it generates.

### Checking coverage

```bash
# Check coverage for a single project
nx test <project-name> --coverage

# Coverage report is written to coverage/<project-name>/
# Open the HTML report:
start coverage/<project-name>/lcov-report/index.html   # Windows
open  coverage/<project-name>/lcov-report/index.html   # macOS/Linux
```

Coverage thresholds are enforced in each project's `jest.config.ts` via the `coverageThreshold` option. If coverage falls below 80% the Jest run exits non-zero and the CI pipeline fails.

---

## What the Agent Will NOT Do

- **No E2E tests** — The agent only generates Jest unit tests. Cypress E2E tests live in `*-e2e/` projects and are managed separately.
- **No source file changes** — The agent never modifies the file under test. It only creates or edits `*.spec.ts` / `*.spec.tsx` / `*.spec.js` files.
- **No automatic commits** — The agent writes files to disk but does not stage, commit, or push changes. Review the generated tests before committing.
- **No integration tests** — Tests that require a live database, message broker, or HTTP service are out of scope. Mock all external dependencies.
- **No modifications to `jest.config.ts`** — Project-level Jest configuration is maintained by developers, not the agent.

---

## Known Limitations

- **Output may be incorrect for truncated source files** — When a source file exceeds the agent's context window it is truncated. The agent will note this in its coverage comment. Always verify that generated function names and signatures match the actual source before committing.
- **Private functions cannot be tested directly** — Only exported functions are tested. Private or unexported helpers are covered indirectly through the public API that calls them; the agent will not attempt to access them directly.
- **Coverage estimates are approximate** — The agent's coverage note (e.g. "~85%") is an estimate based on the code it can see. Treat it as a guide, not a guarantee. Run `nx test <project> --coverage` to get the real number.
- **Import list may be incomplete** — The agent sometimes omits imports for types used inside test bodies — for example using `FormStatus` in an assertion without importing it. Before committing any generated test file, check that every type, enum, and function referenced in the test body has a corresponding import at the top of the file.
- **Mocked SDK exports may need type casting** — When the agent mocks a named export from an SDK package, TypeScript still knows the original function signature and will complain when you call mock methods on it. If you see a TypeScript error on a mock setup line, add a cast: `(myFunction as jest.Mock).mockReturnValue(...)`.
- **Stub objects should be created before wiring up mocks** — Create any stub return values as plain objects first, then pass them to `mockReturnValue`. If the agent generates code that calls a mocked function to produce a value it then passes back into the same mock, the test will fail because the mock returns `undefined` until `mockReturnValue` is configured.
