# Project Planner Service — Architecture (Phase 3)

## Data model
Table `solutions` (migration `20261010000000_create_solution_tables.js`): id uuid PK, tenant, name, description, scenario, status, createdById, createdByName, createdOn, updatedOn, `state` jsonb, revision int. Index `(tenant, createdById)`. `state` = problemStatement, concepts, decisions, questions, patternMatches, hypotheses, specialists, artifacts, nextSteps.

## Surface inventory (API, base `/planner/v1`)
| Route | Roles | Notes |
|---|---|---|
| GET /patterns, /patterns/:patternId | planner-user/admin | built-in + tenant config |
| POST /patterns/match | same | text ≤ 20k |
| GET /specialists | same | |
| GET, POST /solutions | same | list scoped to owner unless admin |
| GET, PATCH, DELETE /solutions/:id | owner or admin | optimistic revision |
| POST /solutions/:id/analyze | owner or admin | extract, match, hypothesize |
| POST /solutions/:id/consult/:service | owner or admin | |
| POST /solutions/:id/handoff/:service | owner or admin | returns context + workspacePath |

## Surface inventory (UI, `/admin/services/project-planner`)
- `/overview` — explains, "Start planning" → solutions
- `/solutions` — table, create modal, open, delete
- `/solution/:id` — detail; back link to solutions; handoff links to other service pages
- `/patterns` — catalog table
No orphan pages: all reachable from sidebar entry (feature flag) → tabs; detail reachable from the solutions table.

## Component placement
Service (not gateway): owns its data and domain rules; no composition of other services' APIs yet. Future agent integration (S6) will call this API from agent-service tools.

## Design System 2.0
Components used: GoabButton, GoabButtonGroup, GoabTable, GoabModal, GoabFormItem, GoabInput, GoabTextArea, GoabBadge, GoabCallout, GoabContainer, GoabDetails, GoabCircularProgress. Page structure follows existing service pages (Tabs). Staff-tool "workspace" guidance from the DS MCP informed the data-view layout.

## Complexity notes
- Matching is deterministic (score = domain terms + 2 × strong signals; high ≥ 8, medium ≥ 4) so results are explainable and testable.
- Whole-solution JSONB keeps the model flexible while concept types are still evolving.
- `crypto.randomUUID` used instead of `uuid` (ESM-only v14 breaks jest).
