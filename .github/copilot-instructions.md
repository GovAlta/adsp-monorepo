# Copilot / AI Agent Instructions for ADSP Monorepo

This file captures the repository-specific guidance an AI coding agent needs to be productive quickly.

1. Big picture

- Monorepo using Nx: projects are under `apps/` (services and webapps) and `libs/` (shared packages).
- Services are typically Express/Node microservices (name pattern `*-service`), web frontends use `*-webapp`, and e2e projects end with `-e2e`.
- Inter-service communication: AMQP (RabbitMQ) is used extensively (`amqplib`, `amqp-connection-manager`); also REST endpoints and Socket.IO for realtime.
- Shared platform concerns are in `libs/` (e.g., `adsp-service-sdk`, `core-common`, `notification-shared`).

2. Important files and locations

- Root scripts and orchestrator: `package.json` (use `npm run <script>` or `nx <command>`). Key scripts: `start`, `build`, `test`, `lint`, `format`, `dep-graph`.
- Nx config: `nx.json` controls targets, caching and defaults. Default project is `file-service`.
- Docker compose: see `.compose/` and instructions in `README.md` for local deployments and Keycloak realm files under `.compose/realms`.
- Test presets: `jest.preset.js` and `jest.config.ts` live at root and are used by most projects.

3. Common developer workflows (explicit commands)

- Run full workspace tests (parallel): `npm test` (runs `nx run-many --all --target=test --parallel`).
- Run a single service locally: `npm run start:<project>` (many project-specific scripts exist), or `nx run <project>:serve`.
  - Example: `npm run start:tenant-management-webapp` or `nx run tenant-management-api:serve`.
- Build all: `npm run build` (runs `nx build`). Build affected: `npm run build:affected`.
- Run lint: `npm run lint`. Format: `npm run format`.
- Run a single project's tests with coverage: `npx nx test tenant-management-api --code-coverage`.
- E2E (tenant webapp): `npm run tmw-e2e` (various env and baseUrl variants exist; see `package.json`).

4. Project conventions and patterns

- Naming: `apps/<name>-service` for services, `apps/<name>-webapp` for frontends, `apps/*-e2e` for Cypress e2e projects.
- Code style: TypeScript + ESLint + Prettier. Generators configured under `nx.json` default to ESLint and `scss` for React apps.
- Shared UI components come from `libs/` (e.g., `libs/jsonforms-components`). Prefer reusing libs rather than copying code.
- Testing: Jest for unit tests (root `jest.preset.js`), Cypress for e2e with cucumber support for some suites.

5. Integration points and external dependencies to be mindful of

- Keycloak: Many apps integrate with Keycloak; `KEYCLOAK_FRONTEND_URL` affects issuer URLs — see README notes.
- RabbitMQ (AMQP): services expect message broker readiness; local docker-compose may require service restarts due to startup-order races.
- Databases: PostgreSQL (`pg`) and Mongo (`mongoose`) appear in dependencies; check each service's `README.md` for DB setup.
- Redis, Azure Blob, and Notifications client are present in `package.json` — don't assume a service can run fully without external infra.

6. Where to look for examples

- Service scaffold and patterns: open any `apps/*-service` folder (for example `apps/tenant-management-api/README.md`).
- Webapp patterns: `apps/tenant-management-webapp/README.md` and `apps/form-management-app/README.md`.
- Shared libs: `libs/adsp-service-sdk`, `libs/core-common`, `libs/jsonforms-components`.

7. How the CI and caching behave

- Nx is used with caching enabled in `nx.json` target defaults. When editing build/test behavior, respect target defaults.
- CI workflows live under `.github/workflows` (use `dep-graph` and `affected` targets to diagnose CI failures).

8. Instruction style for AI agents (do this project-specific)

- Prefer small, focused changes that follow existing patterns (e.g., add library functions to `libs/` rather than duplicating across apps).
- When adding/altering services, update the matching `apps/<project>/README.md` with run and env examples.
- For debugging startup issues mention typical causes: missing env vars, Keycloak issuer mismatches, RabbitMQ readiness. Suggest restarting the service after infra is up.
- Include exact commands in PR descriptions and link relevant `README.md` or `package.json` scripts.

9. Example quick tasks for agents (templates)

- Running a single service locally:
  - `nx run <project>:serve` or `npm run start:<project>` if a script exists.
- Running unit tests for a project:
  - `npx nx test <project>` or `npm test` to run all.
- Adding a new library:
  - Use Nx generator configured in `nx.json`, prefer `@nx/node` or `@nx/react` depending on target.

If anything is missing or you'd like a different emphasis (more infra details, security notes, or PR checklist additions), tell me which sections to expand.
