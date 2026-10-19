# Project Planner Service — Requirements (Phase 1)

Source: `docs/requirements/Project_Planner_Requirements.md`. Stack: ADSP-native (Nx Node/Express service + React in the Tenant Management Webapp, Design System 2.0).

## Users and scenarios
- **Developer/product owner new to ADSP** — describes a problem, receives recommended ADSP services (scenario: new application / prototype).
- **Developer with an existing app** — reconfigures or extends (scenario: existing-app / reconfigure).
- **Tenant admin (`planner-admin`)** — sees every solution in the tenant and extends the pattern catalog.

## Functional requirements
- **FR-1** A user creates a *solution* with a name and optional problem statement. _Accept:_ POST /solutions returns 201 with an empty structured state.
- **FR-2** The business model holds the 15 concept types (actor, goal, activity, decision, evidence, business-rule, constraint, evaluation-criterion, workflow, outcome, document, event, external-system, assumption, unknown). _Accept:_ PATCH accepts concepts of those types only; others return 400.
- **FR-3** Solution state persists across sessions as JSON, including decisions **with the reason**. _Accept:_ a decision saved with a reason is returned unchanged by GET.
- **FR-4** The planner extracts candidate concepts from free text, marked `source: extracted` for the user to refine. _Accept:_ analyzing "Staff and applicants complete a form" yields actor and document concepts.
- **FR-5** The planner matches text against business patterns and explains each match. _Accept:_ each match returns score, level, matched domain terms/signals and an explanation.
- **FR-6** The catalog includes all 19 appendix application types; Case Management is fully specified with domain language, strong/weak signals, service mappings, clarifying questions, assumptions and known unknowns. _Accept:_ GET /patterns returns 19 built-ins.
- **FR-7** Weak signals alone never classify a project. _Accept:_ a text with only weak-signal words returns no match.
- **FR-8** Low-confidence matches surface the pattern's clarifying questions as open questions. _Accept:_ analyze adds them to `state.questions` without duplicates.
- **FR-9** The planner produces up to 3 solution hypotheses, each with rationale, ordered service recommendations, assumptions and unknowns.
- **FR-10** Each ADSP service has a specialist; consulting returns fit, questions, dependencies (satisfied or not) and risks, and records progress.
- **FR-11** Each specialist links to its service workspace (`workspacePath` on GET /specialists). _The recorded hand-off route was removed; re-add it if a workspace needs the context package._
- **FR-12** The planner proposes next steps (answer questions, consult unstarted services).
- **FR-13** Tenants can add or override patterns through service configuration. _Accept:_ configuration schema validates pattern shape; merged catalog is used by match/analyze.
- **FR-14** The Tenant Management Webapp exposes a Project Planner page: overview, solutions list/create/delete, solution detail (problem, recommendations, questions, model, decisions, next steps), patterns. Built with Design System 2.0 components only.
- **FR-15** Domain events `solution-created`, `solution-updated`, `solution-deleted` are signalled.
- **FR-16** (should-have) Planner agent and specialist agents backed by an LLM. _Partially met:_ analysis, discovery, blueprint, consult and specialist chat have an optional AI mode (GoA MaaS, `MAAS_API_KEY`) that falls back to rule-based output with a warning. Agent-service integration stays deferred (S6).
- **FR-17** Specialist chats persist per user (≤ 200 messages each), can be listed, exported and deleted by their creator only; consultations are recorded as chats.

## Non-functional requirements
- **NFR-1 Security:** all endpoints require tenant context and role `planner-user` or `planner-admin`; non-admins see only solutions they created (403 otherwise). Tenant isolation by `tenant` column on every query.
- **NFR-2 Export format:** `/solutions/:id/export` and the Markdown report carry a `formatVersion` that only changes when the export schema's shape changes.
- **NFR-3 Performance:** pattern match plus analyze for a 20,000-character statement completes in under 500 ms (deterministic, in-process, no network).
- **NFR-4 Input limits:** problem text ≤ 20,000 chars, names ≤ 200 chars, request body ≤ 1 MB.
- **NFR-5 Operability:** health endpoint reports DB connectivity; swagger at `/swagger/docs/v1`; OpenShift manifests, tracing and metrics per platform standard.
- **NFR-6 Accessibility/UX:** UI uses Design System 2.0 (`@abgov/react-components` 7.x) with no custom styling for primitives.
- **NFR-7 Quality:** unit tests cover matcher, extractor, hypotheses, specialists, authorization handlers and events; service compiles with `tsc`.

## Assumptions (resolving `[NEEDS CLARIFICATION]`)
- **A1** Rule-based planning is the baseline and always available. AI mode is optional, needs `MAAS_API_KEY`, and never blocks a request; agent-service agents may drive the same API later.
- **A2** Persistence is Postgres JSONB (like task-service): one row per solution, stored pattern and specialist chat. Deployed environments use in-memory storage (`PLANNER_STORAGE=memory`) until the database is provisioned.
- **A3** Roles: `planner-user` for authors, `planner-admin` for tenant-wide access.
- **A4** The UI lives in the Tenant Management Webapp as a beta service page, hidden behind a feature flag (default off).
- **A5** Only 'Case Management' is fully specified; the other 18 patterns are seeded starting hypotheses to be refined with domain owners.
- **A6** Usage scenarios 3 and 4 (existing app configuration awareness) are stored as the solution `scenario` only; reading an app's existing configuration is deferred.
- **A7** Specialist definitions are code-defined, not tenant-configurable.

## Out of scope (prototype)
Agent-service integration, reading existing tenant configuration, specialist definitions in configuration, solution sharing between users, e2e tests, a provisioned database in deployed environments.
