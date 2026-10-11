# planner-service

ADSP Planning Agent API Service

**Classification:** Protected B — ATIA s.23
**Version:** 1.0.0
**Port:** 7796
**Stack:** Node.js 20 / TypeScript / Express / MongoDB 6 / Keycloak OIDC

---

## Overview

`planner-service` is the backend API for the GoA AI-assisted business planning feature
within the Tenant Management Webapp (TMW). It enables GoA business analysts and developers
to conduct structured planning sessions with an AI Planning Agent that:

- Conducts multi-turn conversations to extract and classify business concepts
- Builds a structured BusinessModel from natural-language input
- Generates solution hypotheses when confidence thresholds are met
- Delegates to specialist agents for service-specific technical guidance
- Maintains a tamper-evident audit log (HMAC-chained) for all administrative actions

All session data is classified **Protected B** under ATIA s.23. Encryption at rest
(MongoDB WiredTiger) and in transit (TLS 1.2+) are required for all deployments.

**LLM integration (INT-001) is currently stubbed.** Live calls to the Anthropic Claude
API are blocked pending OPEN-001 (privacy impact), OPEN-002 (acceptable-use), and
OPEN-006 (data-residency) issue resolution. See `agent-artifacts/skeleton_integrations_manifest.md`.

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 20+ (LTS) | Required for build and runtime |
| MongoDB | 6+ | Encryption-at-rest enabled; replica set recommended |
| Keycloak | Compatible ADSP realm | `planner-user`, `planner-admin`, `tenant-admin` roles |
| ADSP SDK | `@abgov/adsp-service-sdk ^11.0.0` | Platform SDK for JWT, events, config |
| Nx | Workspace version | Already installed in monorepo root |

---

## Environment Variables

Copy `agent-artifacts/integration-config.template.env` to `.env.local` and populate.
**Never commit actual secret values.**

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGO_URI` | Yes | — | MongoDB connection string (from vault; Protected B) |
| `KEYCLOAK_ROOT_URL` | Yes | — | Keycloak/ADSP access service base URL |
| `CLIENT_ID` | Yes | — | ADSP service client ID (`urn:ads:platform:planner-service`) |
| `CLIENT_SECRET` | Yes | — | ADSP service client secret (from vault) |
| `DIRECTORY_URL` | Yes | `https://directory-service.adsp.alberta.ca` | ADSP directory service URL |
| `PORT` | No | `7796` | HTTP listen port |
| `NODE_ENV` | No | `development` | Runtime environment flag |
| `LOG_LEVEL` | No | `info` | Winston log level (`debug`, `info`, `warn`, `error`) |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origin; restrict in production |
| `TRUSTED_PROXY` | No | — | Express `trust proxy` value for deployments behind a load balancer |
| `AUDIT_SIGNING_KEY` | Yes (Protected B) | — | HMAC key for audit chain integrity (min 32 bytes entropy, from vault) |
| `RATE_LIMIT_WINDOW_MS` | No | `3600000` | LLM rate limit window in ms (1 hour) |
| `RATE_LIMIT_MAX` | No | `50` | Max LLM requests per tenant per window |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | — | OpenTelemetry collector endpoint for traces/metrics |

> **INT-001 (LLM) variables** (`ANTHROPIC_API_KEY`, `PLANNER_MODEL_VERSION`) are currently
> blocked — do not configure until OPEN-001/002/006 are resolved.

---

## Local Development

### Install dependencies

From the monorepo root:

```bash
npm install
```

### Serve

```bash
nx serve planner-service
```

The service starts on `http://localhost:7796`. Health check: `GET /health`.

### Build

```bash
nx build planner-service
```

Output: `dist/apps/planner-service/`

---

## Running Tests

### Unit tests

```bash
nx test planner-service
```

Runs Jest unit tests under `src/**/__tests__/`. Uses in-memory mocks; no MongoDB required.

### Integration tests

```bash
nx test planner-service --testPathPattern=tests/integration
```

Uses `@testcontainers/mongodb` to spin up a real MongoDB instance. Docker is required.

### Coverage

```bash
nx test planner-service --coverage
```

Coverage output: `coverage/apps/planner-service/`

---

## API Reference

| Document | Location |
|---|---|
| OpenAPI Specification (YAML) | `apps/planner-service/openapi.yaml` |
| OpenAPI Specification (JSON) | `apps/planner-service/openapi.json` |
| Human-Readable API Spec | `apps/planner-service/api-specification.md` |

Base path: `/api/v1`

### Key endpoints

| Method | Path | Description | Min Role |
|---|---|---|---|
| POST | `/api/v1/sessions` | Create planning session | planner-user |
| GET | `/api/v1/sessions` | List own sessions (paginated) | planner-user |
| GET | `/api/v1/sessions/:id` | Get session with context | planner-user |
| PATCH | `/api/v1/sessions/:id` | Update session status | planner-user |
| POST | `/api/v1/sessions/:id/messages` | Send message (triggers LLM stub) | planner-user |
| GET | `/api/v1/sessions/:id/messages` | List conversation history | planner-user |
| GET | `/api/v1/sessions/:id/model` | Get BusinessModel | planner-user |
| PATCH | `/api/v1/sessions/:id/model/concepts/:conceptId` | Correct concept type | planner-user |
| GET | `/api/v1/sessions/:id/hypotheses` | List hypotheses | planner-user |
| PATCH | `/api/v1/sessions/:id/hypotheses/:hypothesisId` | Update hypothesis status | planner-user |
| POST | `/api/v1/sessions/:id/specialists` | Invoke specialist agent | planner-user |
| GET | `/api/v1/sessions/:id/export` | Export session as JSON | planner-user |
| GET | `/api/v1/patterns` | List business patterns | planner-user |
| POST | `/api/v1/patterns` | Create business pattern | planner-admin |
| PUT | `/api/v1/patterns/:id` | Update business pattern | planner-admin |
| GET | `/api/v1/audit` | View audit log | planner-admin |
| GET | `/health` | Platform health check | none |
| GET | `/health/live` | Liveness probe | none |
| GET | `/health/ready` | Readiness probe (checks MongoDB) | none |

---

## Integration Status

All external integrations are stubbed. Live integration is blocked by open issues.

| INT-ID | Integration | Status | Blocking Issue |
|---|---|---|---|
| INT-001 | Anthropic Claude API (LLM) | Stub / Fail-closed | OPEN-001, OPEN-002, OPEN-006 |
| INT-002 | ADSP Configuration Service | Stub | OPEN-004 |
| INT-003 | Form Service Specialist Agent | Stub | — |
| INT-004 | PDF Service Specialist Agent | Stub | — |
| INT-005 | Comment Service Specialist Agent | Stub | — |
| INT-006 | Notification Service Specialist Agent | Stub | — |
| INT-007 | ADSP Event Service (RabbitMQ) | Stub | — |
| INT-008 | Keycloak JWT (inbound auth) | Live (inbound middleware) | — |

See `agent-artifacts/skeleton_integrations_manifest.md` for stub behavior details
and `agent-artifacts/integration-config-status.json` for current status.

---

## Security Notes (Protected B)

- **Classification:** All session data, business models, and conversation content are
  Protected B under ATIA s.23.
- **Authentication:** All `/api/v1/*` routes require a valid Keycloak JWT in the
  `Authorization: Bearer <token>` header. Unauthenticated requests receive HTTP 401.
- **Authorization:** RBAC enforced per business rule BR-007. planner-user role is the
  minimum for all session operations. planner-admin or tenant-admin is required for
  audit log access and pattern management.
- **Tenant isolation:** Every MongoDB query is scoped to the `tenantId` extracted from
  the JWT. Cross-tenant data access returns HTTP 403.
- **Audit log:** Administrative actions (pattern create/edit/deactivate) write
  HMAC-chained entries to the `audit_events` collection before the HTTP response is
  returned. Audit write failures roll back the action and return HTTP 503 (BR-008).
- **Audit retention:** Audit log entries must be retained for a minimum of 2 years
  per GoA information management policy.
- **At-rest encryption:** MongoDB must be configured with WiredTiger encryption at rest
  before handling Protected B data.
- **In-transit encryption:** TLS 1.2+ is required. The service emits HSTS headers
  (max-age 1 year) but relies on the upstream load balancer for TLS termination.
- **LLM data handling:** No user conversation data may be sent to any LLM vendor API
  until OPEN-001 (Privacy Impact Assessment) and OPEN-002 (Acceptable Use Agreement)
  are completed and OPEN-006 (Data Residency) is resolved with the vendor.
- **Secret management:** All credentials (`MONGO_URI`, `CLIENT_SECRET`, `AUDIT_SIGNING_KEY`,
  future `ANTHROPIC_API_KEY`) must be sourced from a secrets vault, never from source
  control or environment variables baked into container images.

---

## Container

A multi-stage `Dockerfile` is provided at the project root for building a minimal
production image (`FROM node:20-alpine`). The runtime image runs as the non-root
`node` user and exposes port 7796.

Build:

```bash
docker build -t planner-service:latest apps/planner-service/
```

Run:

```bash
docker run -p 7796:7796 \
  -e MONGO_URI="..." \
  -e KEYCLOAK_ROOT_URL="..." \
  -e CLIENT_ID="urn:ads:platform:planner-service" \
  -e CLIENT_SECRET="..." \
  -e DIRECTORY_URL="https://directory-service.adsp.alberta.ca" \
  -e AUDIT_SIGNING_KEY="..." \
  planner-service:latest
```
