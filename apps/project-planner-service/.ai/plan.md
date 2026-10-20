# Project Planner Service — Plan (Phase 2)

## Vision
Help someone new to ADSP go from "here is my problem" to "here is which ADSP services to use, in what order, and where to go next" with a persistent, explainable model of the problem.

## Architecture pattern
Standard ADSP Express service (modelled on task-service): `initializePlatform`, passport core/tenant strategies, Postgres via knex, domain events, swagger, OpenShift manifests. UI is a service page in the Tenant Management Webapp.

Simplicity: deterministic matching and in-code specialist catalog; three tables (`solutions`, `patterns`, `specialist_chats`) with JSONB payloads, no per-concept tables; no new redux slice (server owns state, components hold view state).

## Slices (risk-ordered)
1. **S1 Service skeleton** — Nx project, config, environment, migration, health, platform registration. Risk: platform wiring.
2. **S2 Planner engine** — types, 19 patterns, matcher, extractor, hypotheses, specialists, next steps. Risk: core value; unit tested.
3. **S3 Solution API** — Postgres repository, router, auth, events, swagger.
4. **S4 Platform integration** — nx.json, OpenShift manifests, service docs.
5. **S5 Web UI** — TMW feature flag, config url, router, pages (DS 2.0).
6. **S6 Deferred** — agent-service planner/specialist agents, existing-config awareness, e2e. (Optional AI mode via GoA MaaS shipped ahead of this, with rule-based fallback.)

## Verification
`tsc` and eslint for the service and TMW; jest for the service (21 suites) and the TMW planner pages (23 suites), coverage threshold 80%. Each environment runs on its own Postgres; locally the runner uses a local Postgres.
