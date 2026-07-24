# Clean Code Rules

This is the **single source of truth** for clean code rules used across:

- The `@clean-code` Copilot agent (interactive review)
- The GitHub PR automated review (`github-pr-clean-code-review.js`)
- The `@adsp-code` orchestrator (delegates here)

---

## Naming Stability Principle

Naming comments are SUGGESTION severity only — never ERROR or WARNING.
Do not flag a name merely because another name is also reasonable.
Do not reverse a previous naming suggestion unless it was clearly wrong.
If both names are acceptable, prefer the existing name to avoid churn.
Prefer stable, readable code over theoretically perfect names.

---

## Positive Review Guidance

Before corrective findings, reviewers may identify up to three meaningful things the author did well. Positive feedback must be specific and tied to actual evidence in the code, tests, design, or implementation.

Reinforce values such as readability, simplicity, maintainability, testability, clear API design, good error handling, appropriate naming, separation of concerns, removal of unnecessary complexity, and consistency with project patterns.

Do not provide generic praise, invent positive feedback, or praise work that conflicts with the Jira ticket, project standards, security requirements, or maintainability goals. If there is nothing meaningful to praise, omit positive feedback. Positive feedback must never suppress required corrections.

---

## Rules

### 2.1 Function Names

Only flag a function name when it is clearly misleading, ambiguous in its local scope, or likely to cause a real maintenance problem. Do not suggest a rename merely because another name is also reasonable. Before flagging, compare the name against its local context, nearby function names, and existing project naming conventions. If the current name is acceptable in context, do not comment. Every naming suggestion must include: (1) why the existing name is harmful or confusing, (2) why the proposed name is better, (3) whether the change is required or optional polish. If the reason is preference only, do not leave the comment. Never reverse a previous naming suggestion unless the original was clearly wrong. If both names are acceptable, prefer the existing name to avoid churn.

### 2.2 File Names

Flag if the file name does not clearly reflect its purpose (comment at line 1).

### 2.3 Function Length

No function should exceed 50 lines (configurable via `.cleancode.yml` `function_length_limit`). For React/TSX, suggest extracting loops or conditional blocks into separate components. Do not count JSX return blocks toward function length when rendering is the component's primary purpose.

### 2.4 Long Conditionals

Complex conditions must be wrapped in a named function that describes what is being tested.

### 2.5 Reusability

Extract duplicate or near-duplicate logic into shared reusable functions.

### 2.6 Encapsulation

If multiple functions operate on the same data, create a class or interface to encapsulate them.

### 2.7 Minimize Coupling

Each file should have one clear purpose. Do not mix concerns.

### 2.8 Maximize Cohesion

If a single task is spread across multiple functions unnecessarily, consolidate.

### 2.9 Meaningful Names

Variables, classes, and constants must have intention-revealing names. No magic numbers. No single-letter variables except loop counters. Only rename when the current name is clearly misleading or ambiguous in its local scope. Check the surrounding context before flagging: if the scope already makes the meaning clear, the name is acceptable. Every naming suggestion must justify why the existing name causes confusion and why the new name is concretely better. If both names are acceptable, prefer the existing name. Apply the stability principle: prefer stable readable code over theoretically perfect names. Avoid suggestions that would cause churn without improving correctness, clarity, or maintainability.

### 2.10 Functions Do One Thing

A function must do one thing only (Single Responsibility Principle). Do not flag React components merely for combining state, effects, and rendering — this is correct React design. Only flag for non-React functions doing clearly unrelated things, or for React components where concerns are so mixed that splitting would genuinely improve clarity without increasing coupling.

### 2.11 Comments

Do not write redundant comments that restate what the code does. Do not leave outdated or misleading comments. Do not comment bad code — rewrite it. Comments explaining design decisions are encouraged.

### 2.13 Error Handling

Use exceptions instead of returning error codes. Never suppress or silently ignore errors.

### 2.14 DRY Principle

Never duplicate logic. If the same logic appears more than once, extract it.

### 2.15 Classes Single Responsibility

Classes should have one reason to change.

### 2.16 Unit Tests

Every exported function or class should have a corresponding test.

### 2.17 Testable Code

Write functions that are small and loosely coupled enough to be independently testable.

### 2.18 No Hidden Side Effects

Functions must not modify external state unexpectedly or produce outputs not indicated by their name.

---

## Severity Levels

| Severity   | Rules                                           |
| ---------- | ----------------------------------------------- |
| ERROR      | 2.13, 2.14, 2.18                                |
| WARNING    | 2.3, 2.4, 2.7, 2.8, 2.10                        |
| SUGGESTION | 2.1, 2.2, 2.5, 2.6, 2.9, 2.11, 2.15, 2.16, 2.17 |

---

## React Patterns — Review Guidance

React hooks (`useEffect`, `useMemo`, `useCallback`, `useState`, `useRef`, `useContext`) must never be moved to a regular helper file or non-hook function. Hook calls must always remain inside a React component or a custom hook.

For `useEffect`, `useMemo`, `useCallback` bodies — review the code INSIDE the hook separately:

- If the logic inside is pure and does not depend heavily on component state, props, refs, or dispatch functions → suggest extracting to a helper function.
- If the effect represents a reusable behaviour with clear inputs and outputs → suggest extracting to a custom hook.
- If the effect is tightly coupled to many local variables → do not suggest extraction unless you can show a clean function signature.
- If extraction would require passing many variables just to recreate the component's local scope → prefer suggesting smaller internal helper functions or simplifying the effect in place.
- Avoid vague comments like "move this useEffect elsewhere."

### Dependency Burden Rule

Apply before suggesting any extraction: If the extracted function would require many parameters, many setters, refs, dispatch functions, or locally scoped callbacks — do not recommend moving it to another file.

Instead suggest one of:

- Split the effect into multiple effects by responsibility
- Create small named helper functions inside the component
- Reduce the number of responsibilities in the effect
- Derive values before the effect runs
- Move pure transformation logic out, while leaving side-effect orchestration in place

Do not suggest extraction unless the extracted code has a clean boundary.

### General React Rules

- JSX return blocks — rendering is the component's primary responsibility, do not flag for length unless the component has clearly unrelated concerns.
- Components combining state + effects + rendering — this is correct React design, not an SRP violation.
- Backend service functions making one axios call, logging, and returning data — intentionally simple, do not flag for complexity or length unless they genuinely exceed the `function_length_limit`.

---

## Suppression

To suppress a rule on a specific line, add a comment:

```
// clean-code-ignore: RULE_ID
```

For example: `// clean-code-ignore: 2.3`
