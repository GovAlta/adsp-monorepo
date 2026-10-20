# Project Planner Service — Architecture (Phase 3)

## Data model
Migration `20261010000000_create_planner_tables.js` creates three tables:
- `solutions`: id uuid PK, tenant, name, description, scenario, status, createdById, createdByName, createdOn, updatedOn, `state` jsonb. Index `(tenant, createdById)`. `state` = problemStatement, concepts, decisions, questions, patternMatches, hypotheses, specialists, artifacts, nextSteps, plus discovery/blueprint results.
- `patterns`: PK `(tenant, id)`, `pattern` jsonb, createdById, createdByName, createdOn, updatedOn. Tenant-authored patterns layered over built-ins and configuration.
- `specialist_chats`: id uuid PK, tenant, service, solutionId (nullable), title, createdById, createdByName, createdOn, updatedOn, `messages` jsonb. Index `(tenant, createdById)`.

Each environment (dev, UAT/staging, prod) has its own Azure Database for PostgreSQL, connected through the `project-planner-service-postgres` secret. Migrations run on startup. The local runner uses a local Postgres.

## Surface inventory (API, base `/planner/v1`)
| Route | Roles | Notes |
|---|---|---|
| GET /analysis/options | planner-user/admin | available modes, default mode, model |
| GET /patterns, /patterns/:patternId | planner-user/admin | built-in + tenant config + stored patterns |
| POST /patterns, PUT, DELETE /patterns/:patternId | planner-admin | stored patterns; DELETE reverts an override |
| POST /patterns/match | planner-user/admin | text ≤ 20k |
| GET /specialists | same | |
| GET, POST /solutions | same | list scoped to owner unless admin |
| GET, PATCH, DELETE /solutions/:id | owner or admin | |
| GET /solutions/:id/export | owner or admin | JSON download |
| POST /solutions/:id/analyze | owner or admin | extract, match, hypothesize (ai or rules) |
| POST /solutions/:id/discovery, /chat | owner or admin | guided discovery and refine conversation |
| PUT /solutions/:id/questions/:questionId | owner or admin | answer an open question |
| POST /solutions/:id/consult/:service | owner or admin | recorded as a specialist chat |
| POST /solutions/:id/blueprint | owner or admin | requires hypotheses |
| POST /specialists/:service/chat | planner-user/admin | new or continued chat (≤ 200 messages) |
| GET /specialists/chats, /specialists/chats/export | same | own chats only |
| GET, DELETE /specialists/chats/:chatId, GET .../export | creator only | admins get 404 for other users' chats |

## Surface inventory (UI, `/admin/services/project-planner`)
- `/overview` — explains, "Start planning" → solutions
- `/solutions` — table, create modal, open, delete
- `/solutions/:id` — detail: problem statement and analysis, discovery, refine chat, blueprint, specialist chat; back link to solutions
- `/patterns` — catalog with create, edit, delete/revert for planner-admin
No orphan pages: all reachable from sidebar entry (feature flag) → tabs; detail reachable from the solutions table.

## Component placement
Service (not gateway): owns its data and domain rules; no composition of other services' APIs yet. AI mode calls an OpenAI-compatible endpoint (GoA MaaS) directly; agent-service integration (S6) is still deferred.

## Design System 2.0
Components used: GoabButton, GoabButtonGroup, GoabTable, GoabModal, GoabFormItem, GoabInput, GoabTextArea, GoabBadge, GoabCallout, GoabContainer, GoabDetails, GoabCircularProgress. Page structure follows existing service pages (Tabs). Staff-tool "workspace" guidance from the DS MCP informed the data-view layout.

## Complexity notes
- Matching is deterministic (score = domain terms + 2 × strong signals; high ≥ 8, medium ≥ 4) so results are explainable and testable.
- Whole-solution JSONB keeps the model flexible while concept types are still evolving.
- AI mode is optional (`MAAS_API_KEY`); every AI route falls back to rule-based output with a warning when the model fails or is unconfigured.
- `crypto.randomUUID` used instead of `uuid` (ESM-only v14 breaks jest).
