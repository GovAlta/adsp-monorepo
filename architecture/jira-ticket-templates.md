# Jira Ticket Templates

These templates are optimized for AI agent consumption. When tickets follow these structures, the `@adsp-code` orchestrator can parse acceptance criteria, locate relevant code, and validate implementations effectively.

---

## Story (New Feature / Enhancement)

```markdown
## Context
[1-2 sentences: WHY this is needed. What problem does the user face today?]

## Requirements
[Prose description of WHAT to build. Include UI placement, visibility rules,
and interaction model. Reference specific ADSP services or apps involved.]

## Technical Context
- **App/Service**: [e.g., tenant-management-webapp, notification-service]
- **APIs/Endpoints involved**: [e.g., GET /api/notification/v1/types, POST /api/notification/v1/templates]
- **Related services**: [e.g., notification-service for templates, push-service for real-time events]
- **UI component library**: [e.g., @abgov/react-components — GoA Design System]
- **Existing patterns to follow**: [e.g., "See how form-editor uses side panels for layout reference"]

## Acceptance Criteria
- When [trigger], [expected behaviour].
- The [component] must [constraint].
- The [feature] does NOT [negative case].

## Design / UX Notes
[Optional: mockups, component suggestions, layout guidance]

## Out of Scope
[Explicitly state what this ticket does NOT include]
```

### Tips for Stories
- Each AC must be a **testable statement** — the unit-testing agent uses these to generate behaviour-driven tests.
- The **Technical Context** section is intentionally high-level: name the service and any relevant API endpoints. You do not need to know the exact file paths — the agent will locate them.
- **Out of Scope** prevents agents from over-engineering or refactoring neighbouring code.

---

## Bug Fix

```markdown
## Bug Description
[1-2 sentences: What is broken? What does the user experience?]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behaviour
[What SHOULD happen]

## Actual Behaviour
[What ACTUALLY happens. Include error messages, screenshots, logs if available.]

## Technical Context
- **App/Service**: [which service or app is affected, e.g., form-service, tenant-management-webapp]
- **API/Endpoint involved**: [e.g., POST /api/form/v1/forms — if the bug is in a specific endpoint]
- **Related ticket**: [if this is a regression from another ticket]
- **Environment**: [dev/uat/prod]

## Acceptance Criteria
- The [specific behaviour] works correctly when [condition].
- No regression in [related feature].
- [Edge case] is handled gracefully.

## Root Cause (if known)
[Optional: developer's hypothesis about what's wrong]
```

### Tips for Bugs
- **Steps to Reproduce** help the agent understand the flow and write regression tests.
- **Technical Context** should name the service and endpoint if known — file paths are optional and the agent will find them.
- If you know the root cause, include it — the agent will validate and fix rather than re-investigate.

---

## Spike (Technical Investigation)

```markdown
## Spike Goal
[1 sentence: What question are we trying to answer?]

## Background
[Why do we need this investigation? What decision depends on the outcome?]

## Questions to Answer
1. [Specific technical question]
2. [Specific technical question]
3. [Feasibility/performance/compatibility question]

## Technical Context
- **Area of investigation**: [service(s) or app(s) involved, e.g., push-service, adsp-service-sdk]
- **APIs/Interfaces of interest**: [e.g., existing WebSocket endpoints, SDK initialization contract]
- **Constraints**: [time box, tech stack limitations, compatibility needs]
- **Prior art**: [existing patterns to evaluate, external docs to review]

## Expected Deliverables
- [ ] Decision document or ADR (in `architecture/` or ticket comment)
- [ ] Proof of concept (if applicable — branch name: `spike/CS-XXXX`)
- [ ] Recommendation for implementation ticket(s)

## Out of Scope
- No production code changes
- No test coverage requirements
- [Other explicit boundaries]
```

### Tips for Spikes
- Spikes should NOT trigger the full orchestrator workflow (no implementation, no tests).
- Use `@adsp-plan` alone for spike analysis — it will produce a decision without writing code.
- Deliverables should inform follow-up Story tickets that DO go through the full workflow.

---

## Why These Templates Work for AI Agents

| Section | Agent that uses it | Purpose |
|---------|-------------------|---------|
| Context / Background | `@adsp-plan` | Understands the domain problem |
| Requirements | `@adsp-plan`, `@adsp-impl` | Guides placement decision and implementation |
| Technical Context | `@adsp-plan`, `@adsp-impl` | Narrows the search space to the right service/endpoint; agent locates exact files |
| Acceptance Criteria | `@unit-testing`, `@adsp-code` (validation step) | Drives test generation and final validation |
| Out of Scope | All agents (scope boundary) | Prevents over-engineering and unrelated changes |
| Steps to Reproduce | `@unit-testing` | Guides regression test creation |
