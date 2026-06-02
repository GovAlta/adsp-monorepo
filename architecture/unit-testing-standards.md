# Unit Testing Standards

This is the **single source of truth** for unit testing conventions used across:
- The `@unit-testing` Copilot agent
- The `@adsp-code` orchestrator (delegates here after implementation)
- The unit-test-agent.js script

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

| Source file | Test file |
|---|---|
| `auth.service.ts` | `auth.service.spec.ts` |
| `Button.tsx` | `Button.spec.tsx` |
| `router.js` | `router.spec.js` |
| `adsp-id.ts` | `adsp-id.spec.ts` |

`.spec.ts` is the standard convention for this workspace. Do not use `.test.ts` for new files.

---

## Framework — Jest via Nx

All unit tests run through **Jest**, orchestrated by **Nx**.

### Running tests

```bash
nx test <project-name>              # Run tests for a specific project
nx test <project-name> --coverage   # Run with coverage report
nx test <project-name> --watch      # Watch mode (local development)
nx affected -t test                 # Test only changed projects
nx test <project-name> --configuration=ci  # CI configuration
```

### Jest config

Each project has a `jest.config.ts` at its root. Global presets live in `jest.preset.js` and `jest-cover.preset.js` at the repo root. Do not duplicate configuration; extend the preset instead.

---

## Mock Patterns

### 1. Mock entire Node modules with `jest.mock`

```js
jest.mock('fs');
jest.mock('@octokit/rest', () => ({ Octokit: jest.fn() }));
```

Place `jest.mock` calls **before** any `require` / `import` statements that depend on the mocked module.

### 2. Set required environment variables before module import

```js
process.env.GITHUB_TOKEN = 'test-token';
process.env.PR_NUMBER = '1';
const { myFunction } = require('./my-module');
```

### 3. Mock module functions with `jest.fn()`

```js
const reviewFile = jest.fn();
const checkRepoFile = jest.fn().mockResolvedValue(false);
```

### 4. Reset mocks between tests

```js
afterEach(() => {
  jest.resetAllMocks();
});
```

### 5. Use `mockReturnValue` / `mockResolvedValue` for predictable outputs

```js
fs.existsSync.mockReturnValue(true);
fs.readFileSync.mockReturnValue('function_length_limit: 30\n');
```

### 6. Inject dependencies rather than importing them globally

```js
const { reviewComments } = await processFilesForReview(changedFiles, systemPrompt, {
  reviewFile: jest.fn().mockResolvedValue([]),
});
```

---

## Test Structure Rules

### Arrange / Act / Assert (AAA)

Every test body must follow three sections with blank lines between them:

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

Each `test()` block must assert exactly one behaviour. Split compound assertions into separate tests.

```ts
// ✗ Two concepts in one test
test('loads config', () => {
  expect(loadConfig().function_length_limit).toBe(50);
  expect(loadConfig().languages).toEqual(['ts', 'tsx', 'js', 'jsx']);
});

// ✓ One concept each
test('returns the default function_length_limit when .cleancode.yml does not exist', () => {
  expect(loadConfig().function_length_limit).toBe(50);
});

test('returns the default languages array when .cleancode.yml does not exist', () => {
  expect(loadConfig().languages).toEqual(['ts', 'tsx', 'js', 'jsx']);
});
```

### No logic in tests

Tests must not contain `if`, `for`, loops, or ternary expressions. Use `test.each` for parameterised cases:

```ts
const EXPECTED_RULES = ['2.1', '2.2', '2.3'];
test.each(EXPECTED_RULES)('includes rule %s in the prompt', (rule) => {
  expect(buildSystemPrompt(config, null)).toContain(`${rule} `);
});
```

### Meaningful test data

Use values that reflect the real domain, not `foo`, `bar`, or `123`.

```ts
// ✗ Meaningless
const result = processFile('abc', 'xyz');

// ✓ Domain-representative
const result = processFile('@@ -0,0 +1 @@\n+const x = 1;', 'src/auth.service.ts');
```

### Descriptive test names

Test names must read as plain-English describing the expected behaviour:

```ts
// ✗ Describes implementation
test('calls buildLineToPositionMap', ...);

// ✓ Describes behaviour
test('maps an added line to its correct diff position', ...);
```

---

## Coverage Threshold

The workspace enforces a minimum of **80% line coverage** per project. Coverage thresholds are enforced in each project's `jest.config.ts` via the `coverageThreshold` option. If coverage falls below 80% the Jest run exits non-zero and CI fails.

```bash
nx test <project-name> --coverage
# Report at: coverage/<project-name>/lcov-report/index.html
```

---

## Jira Ticket Context

When a Jira ticket ID is available, the unit test agent can fetch acceptance criteria to generate behaviour-driven tests:

```bash
node .github/scripts/unit-test-agent.js --mode generate --file <path> --ticket CS-1234
```

**Required environment variables:**
- `JIRA_BASE_URL` — e.g. `https://goa-dio.atlassian.net`
- `JIRA_EMAIL` — Atlassian account email
- `JIRA_API_TOKEN` — Atlassian API token

When ticket context is available:
- Tests should validate acceptance criteria, not just code paths
- Name tests to reference the behaviour they validate
- Flag any acceptance criteria that require E2E testing rather than unit tests

---

## Scope Boundaries

- **No E2E tests** — Only Jest unit tests. Cypress E2E tests live in `*-e2e/` projects.
- **No source file changes** — Test agent only creates/edits `*.spec.ts` files.
- **No integration tests** — Mock all external dependencies (databases, message brokers, HTTP services).
- **No modifications to `jest.config.ts`** — Project-level Jest configuration is maintained by developers.

---

## Known Limitations

- **Import list may be incomplete** — Check that every type, enum, and function referenced in test bodies has a corresponding import.
- **Mocked SDK exports may need type casting** — Use `(myFunction as jest.Mock).mockReturnValue(...)` when TypeScript complains.
- **Stub objects should be created before wiring up mocks** — Create stub return values as plain objects first, then pass to `mockReturnValue`.
- **Private functions cannot be tested directly** — Only exported functions are tested. Private helpers are covered indirectly through the public API.
