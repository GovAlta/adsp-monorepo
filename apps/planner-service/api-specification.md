# ADSP Planner Service — API Specification

**Version:** 1.0.0
**Classification:** Protected B (GoA deliberative process content per ATIA s.23)
**Base URL:** `/api/v1`
**Auth:** Keycloak JWT (Bearer token) required on all endpoints except `/health/*` and `/metrics`

---

## Classification Notice

This service stores and processes **Protected B** content under the Government of Alberta
Information Security Classification framework:

- Conversation content (`ConversationMessage.content`) — ATIA s.23 deliberative process records
- Business models and concepts (`BusinessModel`, `BusinessConcept`) — GoA program design analysis
- Solution hypotheses (`SolutionHypothesis.summary`, `.reasoning`) — AI-generated government solution analysis
- Session exports (`SessionExport.exportData`) — full serialized dump of Protected B planning content
- Specialist request/response payloads — inherits classification from source session content

**Protected A** data:
- GoA employee identifiers (`userId`, `actorId`) — POPA s.17 employee identity data
- Audit log entries (`AuditEvent`) — administrative records for a GoA system

**Key controls:**
- All Protected B fields are redacted in structured logs (Winston log redaction)
- INT-001 (Anthropic Claude API) is STUB/fail-closed — Protected B content must NOT be transmitted
  to Anthropic until OPEN-001 (API contract), OPEN-002 (key provisioning), and OPEN-006
  (IM policy approval for out-of-jurisdiction transfer) are resolved
- TLS 1.2 minimum enforced at ADSP ingress; HSTS via `helmet()` middleware
- All endpoints require bearerAuth (Keycloak JWT) except `/health/*` and `/metrics`

---

## Authentication

**Mechanism:** Keycloak JWT (RS256), validated by `passport-jwt` middleware via ADSP SDK.
The JWT is passed as a `Bearer` token in the `Authorization` header.

**Roles:**
| Role | Description | Permissions |
|---|---|---|
| `planner-user` | GoA business analyst or developer | Create/read/update own sessions; read patterns; consult specialists |
| `planner-admin` | GoA platform administrator | Full access to all tenant sessions; manage patterns; view audit log |
| `tenant-admin` | Tenant-level administrator | Same as planner-admin for their tenant |

**JWT claims used:**
- `sub` → `userId` (GoA employee identifier, Protected A per POPA s.17)
- `tenantId` → tenant isolation for all queries (BR-001)
- `roles[]` → RBAC enforcement (SYSREQ-013)

**Error responses:** 401 (missing/expired/invalid JWT), 403 (insufficient role)

---

## Rate Limiting

Rate limiting is applied via `express-rate-limit` to the following endpoints (SYSREQ-018):
- `POST /api/v1/sessions/{sessionId}/messages` — LLM inference trigger
- `POST /api/v1/sessions/{sessionId}/specialists` — Specialist delegation

Exceeded limits return **HTTP 429** with `Retry-After` header (seconds until reset).

---

## Error Format

All errors use **RFC 7807 Problem Details** (`application/problem+json`):

```json
{
  "type": "https://adsp.alberta.ca/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Field 'content' exceeds maximum length of 10000 characters",
  "instance": "/api/v1/sessions/abc123/messages"
}
```

Standard error codes:
- **400** — Validation failure (Zod schema violation, field-level errors)
- **401** — Missing or invalid Keycloak JWT
- **403** — Insufficient role (BR-007)
- **404** — Resource not found or access denied (ownership scoping)
- **409** — Concurrent modification (optimistic locking; return `version` mismatch detail)
- **422** — Invalid state transition (BR-010 hypothesis status machine)
- **429** — Rate limit exceeded (with `Retry-After` header)
- **503** — Dependent service unavailable (MongoDB, INT-001 stub always returns 503)

---

## Pagination

All list endpoints support query parameters:
- `page` (integer, default 1, minimum 1) — page number (1-based)
- `pageSize` (integer, default 20, minimum 1, maximum 100)

Response envelope (PaginatedResult):
```json
{
  "items": [...],
  "total": 42,
  "page": 1,
  "pageSize": 20
}
```

---

## Endpoints

### Sessions Resource

#### POST /api/v1/sessions — `createSession`
**Summary:** Create a new planning session
**Roles:** planner-user, planner-admin, tenant-admin
**UC:** UC-001 (Start Planning Session)

Creates a new `PlanningSession` (status=`active`) and a linked empty `BusinessModel` in MongoDB.
Publishes `session-created` domain event via INT-007 stub (fire-and-forget, logged but not transmitted).
Sets `tenantId` and `userId` from JWT claims (BR-001).

**Request body:**
```json
{ "title": "Citizen Portal Redesign Initiative" }
```
- `title`: required, 1–200 characters (SYSREQ-024)

**Response 201:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "tenantId": "goa-digital",
  "userId": "user@gov.ab.ca",
  "status": "active",
  "title": "Citizen Portal Redesign Initiative",
  "businessModelId": "660e8400-e29b-41d4-a716-446655440001",
  "createdAt": "2026-10-10T12:00:00Z",
  "updatedAt": "2026-10-10T12:00:00Z"
}
```

---

#### GET /api/v1/sessions — `listSessions` / `listAllSessions`
**Summary:** List planning sessions (role-filtered)
**Roles:** All authenticated
**UC:** UC-006 (Resume), UC-010 (Admin view)

- `planner-user`: returns own sessions only (tenantId + userId filter)
- `planner-admin` / `tenant-admin`: returns all sessions for the tenant

**Query params:** `page`, `pageSize`, `status` (enum: active|paused|completed|archived)

**Response 200:** `PaginatedResult` with `items: PlanningSession[]`

---

#### GET /api/v1/sessions/{sessionId} — `getSession`
**Summary:** Get a planning session by ID
**Roles:** All authenticated (ownership enforced)
**UC:** UC-006

Returns full session state. planner-user ownership enforced (404 if not owner).

**Path param:** `sessionId` (UUID)

**Response 200:** `PlanningSession`

---

#### PATCH /api/v1/sessions/{sessionId} — `updateSession`
**Summary:** Update session status or title
**Roles:** All authenticated (ownership enforced)
**UC:** UC-006, SYSREQ-011

Allowed status transitions: any → `active` (resume), any → `paused`, any → `completed`.
Sets `lastResumedAt` when transitioning to `active`. Publishes `session-updated` domain event via INT-007 stub.

**Request body:**
```json
{ "status": "paused", "title": "Updated Title" }
```

**Responses:** 200 (updated PlanningSession), 422 (invalid transition)

---

#### DELETE /api/v1/sessions/{sessionId} — `archiveSession`
**Summary:** Soft-archive a planning session
**Roles:** planner-user (own), planner-admin (any tenant session)
**UC:** SYSREQ-022 (Data retention)

Sets `status='archived'` and `archivedAt` timestamp. Hard deletion is handled by the scheduled
retention job (configurable per tenant via INT-002 Config Service stub). Publishes
`session-archived` domain event via INT-007 stub.

**Response 204:** No content

---

### Messages Resource

#### POST /api/v1/sessions/{sessionId}/messages — `sendMessage`
**Summary:** Send a message to the Planning Agent
**Roles:** All authenticated (ownership enforced)
**UC:** UC-002 (Build Model), SYSREQ-017 (LLM resilience)
**Rate-limited:** Yes (express-rate-limit)
**INT-001 STATUS: STUB/FAIL-CLOSED** — returns HTTP 503 pending OPEN-001/002/006

Flow:
1. Validates message content (max 10000 chars, SYSREQ-024)
2. Persists `ConversationMessage` (role=`user`)
3. Assembles LLM context from session history and current BusinessModel
4. Calls INT-001 stub → always returns 503 (fail-closed per OPEN-001/002/006)
5. (Live only) Parses agent response, updates BusinessModel, runs PatternMatchingService (BR-005)
6. (Live only) If `confidenceScore >= 70`, triggers HypothesisGenerationService (BR-004)

**Request body:**
```json
{ "content": "We need to build a form for citizens to submit permit applications" }
```

**Response 201:** `ConversationMessage` (user message persisted)
**Response header:** `X-Integration-Stubbed: INT-001` (when stub is active)
**Response 503:** INT-001 stub is active (expected in current deployment)

---

#### GET /api/v1/sessions/{sessionId}/messages — `listMessages`
**Summary:** List conversation messages for a session
**Roles:** All authenticated (ownership enforced)
**UC:** UC-002

Returns paginated conversation history. Messages are append-only (BR-008).

**Query params:** `page`, `pageSize`

**Response 200:** `PaginatedResult` with `items: ConversationMessage[]`

---

### Business Model Resource

#### GET /api/v1/sessions/{sessionId}/model — `getBusinessModel`
**Summary:** Get the business model for a session
**Roles:** All authenticated (ownership enforced)
**UC:** UC-003 (Review and Correct)

Returns `BusinessModel` with embedded `BusinessConcept` list and `ConceptRelationship` graphs
(MongoDB embedded sub-documents). Classification: Protected B.

**Response 200:** `BusinessModelWithConcepts`
```json
{
  "modelId": "660e8400-...",
  "sessionId": "550e8400-...",
  "confidenceScore": 75,
  "version": 3,
  "matchedPatternId": "permit-application-pattern",
  "concepts": [
    {
      "conceptId": "770e8400-...",
      "conceptType": "Actor",
      "name": "Citizen Applicant",
      "relationships": [{ "relationshipId": "880e8400-...", "sourceConceptId": "770e8400-...", "targetConceptId": "990e8400-...", "relationshipType": "uses" }]
    }
  ]
}
```

---

#### PATCH /api/v1/sessions/{sessionId}/model — `updateBusinessModel`
**Summary:** Correct concept type classifications in the business model
**Roles:** All authenticated (ownership enforced)
**UC:** UC-003

Allows users to correct `conceptType` on individual `BusinessConcept` entries.
Validates against `BusinessConceptType` enum (BR-006). Increments `model.version`.
**Returns HTTP 409** on concurrent version conflict (optimistic locking).

**Request body:**
```json
{
  "version": 3,
  "conceptUpdates": [
    { "conceptId": "770e8400-...", "conceptType": "Goal" }
  ]
}
```

**Responses:** 200 (updated `BusinessModelWithConcepts`), 409 (version conflict — reload and retry)

---

### Hypotheses Resource

#### GET /api/v1/sessions/{sessionId}/hypotheses — `listHypotheses`
**Summary:** List solution hypotheses for a session
**Roles:** All authenticated (ownership enforced)
**UC:** UC-004 (Review and Accept)

Hypotheses are generated automatically when `BusinessModel.confidenceScore >= 70` (BR-004).
Filter by status: `draft`, `proposed`, `accepted`, `rejected`, `superseded`.

**Response 200:** `PaginatedResult` with `items: SolutionHypothesis[]`

---

#### GET /api/v1/sessions/{sessionId}/hypotheses/{hypothesisId} — `getHypothesis`
**Summary:** Get a specific solution hypothesis
**Roles:** All authenticated (ownership enforced)
**UC:** UC-004

**Response 200:** `SolutionHypothesis`

---

#### PATCH /api/v1/sessions/{sessionId}/hypotheses/{hypothesisId} — `updateHypothesisStatus`
**Summary:** Accept, reject, or supersede a solution hypothesis
**Roles:** All authenticated (ownership enforced)
**UC:** UC-004

BR-010 state machine transitions:
- `draft` → `proposed` (system-generated; usually auto-transitioned)
- `proposed` → `accepted` | `rejected`
- `accepted` | `rejected` → `superseded` (when a newer hypothesis replaces it)

Invalid transitions return **HTTP 422**. On `accepted`, publishes `hypothesis-generated`
domain event via INT-007 stub.

**Request body:** `{ "status": "accepted" }`

**Responses:** 200 (`SolutionHypothesis`), 422 (invalid transition per BR-010)

---

### Specialists Resource

#### POST /api/v1/sessions/{sessionId}/specialists — `consultSpecialist`
**Summary:** Consult a specialist agent
**Roles:** All authenticated (ownership enforced)
**UC:** UC-005 (Consult Specialist)
**Rate-limited:** Yes
**ALL SPECIALIST INTEGRATIONS: STUB/FAIL-CLOSED** (INT-003..006)

Delegates to one of four specialist agents (all currently Stub/fail-closed):
- `form-service` — [IMPL-DEFERRED: INT-003]
- `pdf-service` — [IMPL-DEFERRED: INT-004]
- `comment-service` — [IMPL-DEFERRED: INT-005]
- `notification-service` — [IMPL-DEFERRED: INT-006]

Creates `SpecialistRequest`, enforces availability gate (BR-009). Stub returns 503.
Timeout: 60 seconds (SWREQ-007). Planning Agent falls back to general guidance on failure.

**Request body:**
```json
{
  "specialistType": "form-service",
  "requestPayload": { "context": "citizen permit application form requirements" }
}
```

**Response 202:** `SpecialistRequest` (accepted for async processing)
**Response header:** `X-Integration-Stubbed: INT-003` (or INT-004/005/006)

---

#### GET /api/v1/sessions/{sessionId}/specialists/{requestId} — `getSpecialistRequest`
**Summary:** Get a specialist request and its response
**Roles:** All authenticated (ownership enforced)
**UC:** UC-005

**Response 200:** `SpecialistRequestWithResponse` (includes `response` field when completed)

---

### Patterns Resource

#### GET /api/v1/patterns — `listPatterns`
**Summary:** List business patterns
**Roles:** All authenticated
**UC:** UC-007 (Manage Pattern Library)
**INT-002 STATUS: STUB/LOOKUP-EMPTY** — returns empty list pending OPEN-004

**Response 200:** `PaginatedResult` with `items: BusinessPattern[]` (empty while stub)
**Response header:** `X-Integration-Stubbed: INT-002`

---

#### POST /api/v1/patterns — `createPattern`
**Roles:** planner-admin, tenant-admin (BR-007)
**INT-002 STATUS: STUB** — returns 503

---

#### GET /api/v1/patterns/{patternId} — `getPattern`
**Roles:** All authenticated
**INT-002 STATUS: STUB** — returns 503 (404 if pattern not found)

---

#### PUT /api/v1/patterns/{patternId} — `updatePattern`
**Roles:** planner-admin, tenant-admin (BR-007)
**INT-002 STATUS: STUB** — returns 503

---

#### PUT /api/v1/patterns/{patternId}/deactivate — `deactivatePattern`
**Roles:** planner-admin, tenant-admin (BR-007)
**INT-002 STATUS: STUB** — returns 503

#### DELETE /api/v1/patterns/{patternId} — `deletePattern`
**Summary:** Permanently delete a business pattern
**Roles:** planner-admin, tenant-admin (BR-007)
**INT-002 STATUS: STUB** — returns 503

---

### Exports Resource

#### POST /api/v1/sessions/{sessionId}/exports — `initiateExport`
**Summary:** Initiate export of a planning session to portable JSON
**Roles:** planner-user (own sessions), planner-admin (any tenant session)
**UC:** UC-008 (Export Session Plan)

Assembles `SessionExport` from `PlanningSession`, `BusinessModel` (with concepts),
`SolutionHypotheses`, and `ConversationMessages`. `exportData` contains the full Protected B
snapshot — redacted in logs.

**Request body:** `{ "format": "json" }`

**Response 201:** `SessionExport`

---

#### GET /api/v1/sessions/{sessionId}/exports — `listExports`
**Summary:** List exports for a planning session
**Roles:** planner-user (own sessions), planner-admin (any tenant session)
**UC:** UC-008 (Export Session Plan)

Returns paginated list of `SessionExport` records for the session.

**Query params:** `page` (default 1), `pageSize` (default 20, max 100)

**Response 200:** `PaginatedResult` with `items: SessionExport[]`

---

#### GET /api/v1/sessions/{sessionId}/exports/{exportId} — `getExport`
**Roles:** planner-user (own), planner-admin (any)
**Response 200:** `SessionExport`

---

### Audit Resource

#### GET /api/v1/audit — `listAuditEvents`
**Summary:** List HMAC-chained audit log events
**Roles:** planner-admin, tenant-admin ONLY (BR-007)
**UC:** UC-010, SYSREQ-020
**Classification:** Protected A (actor_id = GoA employee identifier per POPA s.17)

Returns paginated `AuditEvent` records with HMAC-SHA256 chain (BR-008, SYSREQ-020).
Accessing this endpoint itself generates an audit entry per BR-008.

**Query params:** `page`, `pageSize`, `actorId`, `resourceType`, `since` (ISO-8601 timestamp)

**Response 200:** `PaginatedResult` with `items: AuditEvent[]`

AuditEvent fields:
- `hmac`: HMAC-SHA256 using `AUDIT_SIGNING_KEY` env var — verifiable chain integrity
- `previousEventId`: links to previous event for chain verification

---

#### GET /api/v1/audit/verify — `verifyAuditChain`
**Summary:** Verify HMAC integrity of the audit chain for a range of events
**Roles:** planner-admin, tenant-admin ONLY (BR-007, BR-009)
**UC:** UC-010 (View Session History and Audit Log), SYSREQ-020

Re-computes HMAC for each event in the specified index range and verifies it
matches the stored `hmac` field. Implements BR-009 tamper-evidence check.

**Query params:** `startIndex` (0-based, default 0), `endIndex` (0-based, default 99)

**Response 200:** `AuditChainVerificationResult`
- `verified: true` — all events passed HMAC check
- `verified: false` — chain broken; `failedAtIndex` and `failedEventId` identify the failure

---

#### GET /api/v1/audit/{eventId} — `getAuditEvent`
**Summary:** Retrieve a single audit event including its HMAC field
**Roles:** planner-admin, tenant-admin ONLY (BR-007)
**UC:** UC-010, SYSREQ-020

Returns the full `AuditEvent` including the `hmac` field for spot-check verification.

**Path params:** `eventId` — UUID of the audit event

**Response 200:** `AuditEvent`
**Response 404:** Event not found in tenant scope

---

### User Management Resource

#### GET /api/v1/users/me — `getCurrentUserContext`
**Summary:** Get current user's profile and planner-service role context
**Auth:** Bearer JWT required
**Roles:** All authenticated (own profile only — no cross-user access)
**UC:** SYSREQ-013 (role-based access)
**URL Note:** Base path `/api/v1/users/me`

Returns the authenticated user's identity and role information sourced from the validated Keycloak JWT (BR-007).

**Response 200:**
```json
{
  "userId": "user@gov.ab.ca",
  "tenantId": "goa-digital",
  "roles": ["planner-user"],
  "email": "user@gov.ab.ca",
  "displayName": "Alice Smith"
}
```

**Response 401:** Missing or expired JWT

#### GET /api/v1/users — `listUsers`
**Summary:** List users in tenant (paginated)
**Roles:** planner-admin, tenant-admin
**STATUS:** STUB — deferred to Stage 5

**Response 200:** `{ items: UserContext[], total, page, pageSize }`

#### POST /api/v1/users — `createUser`
**Summary:** Create (invite) a user in tenant
**Roles:** planner-admin, tenant-admin
**STATUS:** STUB — deferred to Stage 5

**Response 201:** `UserContext`

#### GET /api/v1/users/{userId} — `getUserById`
**Summary:** Get a specific user's context
**Roles:** planner-admin, tenant-admin
**STATUS:** STUB — deferred to Stage 5

**Response 200:** `UserContext`

#### PATCH /api/v1/users/{userId} — `updateUser`
**Summary:** Update user role or status
**Roles:** planner-admin, tenant-admin
**STATUS:** STUB — deferred to Stage 5

**Response 200:** `UserContext`

#### DELETE /api/v1/users/{userId} — `deactivateUser`
**Summary:** Deactivate (soft-delete) a user
**Roles:** planner-admin, tenant-admin
**STATUS:** STUB — deferred to Stage 5

**Response 204:** No content

---

### Health Resource

#### GET /health — `getHealth`
**Summary:** Aggregate service health status
**Auth:** None required
**URL Note:** Relative to `/` (not `/api/v1`) — direct path `/health`

Returns summary health including MongoDB and RabbitMQ stub status.

**Response 200:** `HealthStatus` — service is healthy
**Response 503:** `HealthStatus` — service is unhealthy (MongoDB unreachable)

---

#### GET /health/liveness — `getLivenessAlias`
**Summary:** Liveness probe (alias)
**Auth:** None required
**URL Note:** Alias for `/health/live` — direct path `/health/liveness`

Returns 200 if the service process is alive.

**Response 200:** `{ "status": "ok" }`

---

#### GET /health/readiness — `getReadinessAlias`
**Summary:** Readiness probe (alias)
**Auth:** None required
**URL Note:** Alias for `/health/ready` — direct path `/health/readiness`

Returns 200 when MongoDB is ready; 503 otherwise.

**Response 200:** `{ "db": true }`
**Response 503:** `{ "db": false }`

---

#### GET /health/live — `getLiveness`
**Summary:** Liveness probe
**Auth:** None required
**URL Note:** Relative to `/` (not `/api/v1`) — direct path `/health/live`

Returns 200 if the service process is alive.

**Response 200:** `{ "status": "ok" }`

---

#### GET /health/ready — `getReadiness`
**Summary:** Readiness probe
**Auth:** None required
**URL Note:** Relative to `/` — direct path `/health/ready`

Checks MongoDB, RabbitMQ stub, and Anthropic stub connectivity (5s timeout each).
Returns 503 if any check fails.

**Response 200:**
```json
{
  "status": "ready",
  "checks": {
    "mongodb": "ok",
    "rabbitmq": "stub",
    "anthropic": "stub"
  }
}
```

---

### Metrics Resource

#### GET /metrics — `getMetrics`
**Summary:** Prometheus metrics
**Auth:** None required
**URL Note:** Relative to `/` — direct path `/metrics`

Returns Prometheus-format text metrics. Serves SYSREQ-023 (observability).

---

## Integration Notes

### INT-001 — Anthropic Claude API (STUB/FAIL-CLOSED)

| Status | Stub/fail-closed |
|---|---|
| Affected endpoint | `POST /api/v1/sessions/{sessionId}/messages` |
| Open items | OPEN-001 (API contract), OPEN-002 (key provisioning), OPEN-006 (IM policy) |
| Stub behavior | Returns HTTP 503 — LLM call rejected; user message persisted |
| Live behavior | Streams response, updates BusinessModel, triggers hypothesis generation |
| Source tag | `[IMPL-DEFERRED: INT-001]` in `LLMCallWrapper` |
| Data boundary risk | Protected B conversation content would be sent to Anthropic PBC (US entity) — blocked until OPEN items resolved |

### INT-002 — ADSP Configuration Service (STUB/LOOKUP-EMPTY)

| Status | Stub/lookup-empty |
|---|---|
| Affected endpoints | All `/api/v1/patterns` endpoints |
| Open items | OPEN-004 (Config Service provisioning in target environments) |
| Stub behavior | GET returns empty list; POST/PUT/PATCH returns HTTP 503 |
| Source tag | `[IMPL-DEFERRED: INT-002]` in `ConfigurationServiceAdapter` |

### INT-003..006 — Specialist Agents (STUB/FAIL-CLOSED)

All four specialist integrations (Form Service, PDF Service, Comment Service, Notification Service)
are Stub/fail-closed pending OPEN-005 (interface contract definition).

| INT | Specialist Type | Stub Behavior |
|---|---|---|
| INT-003 | form-service | HTTP 503; Planning Agent falls back to general guidance |
| INT-004 | pdf-service | HTTP 503; Planning Agent falls back to general guidance |
| INT-005 | comment-service | HTTP 503; Planning Agent falls back to general guidance |
| INT-006 | notification-service | HTTP 503; Planning Agent falls back to general guidance |

### INT-007 — ADSP Event Service / RabbitMQ (STUB/FIRE-AND-FORGET)

Domain events are logged but not transmitted to RabbitMQ until live platform provisioning.
Six event types: `session-created`, `session-updated`, `session-completed`, `session-archived`,
`hypothesis-generated`, `specialist-delegated` (BR-012).

### INT-008 — Keycloak JWT Authorization Server (ACTIVE)

Keycloak JWT validation is handled by `passport-jwt` middleware (ADSP SDK). No per-request
remote call — RS256 token validated locally using the Keycloak realm public key.

---

## Security Notes (Protected B Controls)

### FAC-S4-026 — No Protected B data in URL path/query
- All resource identifiers in URL paths are **UUIDs** — no session content, user names, or
  sensitive data in path segments or query parameters (BR-001)

### FAC-S4-027 — Log redaction
- Protected B fields redacted via Winston log processor:
  `content`, `summary`, `reasoning`, `requestPayload`, `responsePayload`, `exportData`, `sourceText`
- Implemented in source: `src/middleware/log-redaction.middleware.ts`

### FAC-S4-028 — No credentials in spec
- All credentials referenced by environment variable names only:
  `AUDIT_SIGNING_KEY`, `MONGODB_URI`, `KEYCLOAK_REALM_URL`, `RABBITMQ_URL`
- No secrets embedded in this specification or any source file

### FAC-S4-029 — HSTS enforcement
- `helmet()` middleware sets `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- TLS termination at ADSP ingress; service requires HTTPS-only (SYSREQ-019)

### FAC-S4-030 — JWT required on all non-health endpoints
- Global `security: [{ bearerAuth: [] }]` applied in OpenAPI spec
- Health (`/health/live`, `/health/ready`) and metrics (`/metrics`) override with `security: []`
- `passport-jwt` middleware enforces this at the Express route level

### ASVS L2 Compliance (SYSREQ-018)
- **V1 — Input Validation:** Zod schema on all write endpoints (SWREQ-014)
- **V2 — Authentication:** RS256 JWT validation via ADSP SDK passport-jwt
- **V3 — Session Management:** JWT TTL enforced by Keycloak; inactivity timeout per SYSREQ-021
- **V4 — Access Control:** Three-tier RBAC via `requireRole` / `requireAdmin` middleware (BR-007)
- **V5 — Output Encoding:** `helmet()` CSP, XSS protection headers
- **V7 — Error Handling:** RFC 7807 Problem Details; no stack traces in production responses
- **V9 — Communications:** TLS 1.2+ at ingress; HSTS via `helmet()`
- **V10 — Malicious Code:** Zod validation prevents injection; parameterised Mongoose queries

---

## TC Coverage (FAC-S4-016)

Mapping of test cases to endpoints (from `test_specifications.json`):

| Endpoint | operationId | Test Cases |
|---|---|---|
| POST /sessions | createSession | TC-001, TC-002 (session creation happy/error) |
| GET /sessions | listSessions | TC-003 (own sessions), TC-010 (admin all-sessions) |
| GET /sessions/{id} | getSession | TC-004 (retrieve), TC-005 (not found) |
| PATCH /sessions/{id} | updateSession | TC-006 (resume), TC-007 (invalid transition) |
| DELETE /sessions/{id} | archiveSession | TC-008 (archive), TC-009 (retention) |
| POST /sessions/{id}/messages | sendMessage | TC-020 (user message), TC-021 (INT-001 stub 503), TC-022 (rate limit) |
| GET /sessions/{id}/messages | listMessages | TC-023 (history), TC-024 (pagination) |
| GET /sessions/{id}/model | getBusinessModel | TC-030 (retrieve model), TC-031 (embedded concepts) |
| PATCH /sessions/{id}/model | updateBusinessModel | TC-032 (concept correction), TC-033 (409 conflict) |
| GET /sessions/{id}/hypotheses | listHypotheses | TC-040 (list), TC-041 (status filter) |
| GET /sessions/{id}/hypotheses/{id} | getHypothesis | TC-042 (retrieve) |
| PATCH /sessions/{id}/hypotheses/{id} | updateHypothesisStatus | TC-043 (accept), TC-044 (reject), TC-045 (invalid BR-010) |
| POST /sessions/{id}/specialists | consultSpecialist | TC-050 (stub 503), TC-051 (rate limit) |
| GET /sessions/{id}/specialists/{id} | getSpecialistRequest | TC-052 (retrieve) |
| GET /patterns | listPatterns | TC-060 (empty stub list) |
| POST /patterns | createPattern | TC-061 (admin only), TC-062 (non-admin 403) |
| GET /patterns/{id} | getPattern | TC-063 (retrieve) |
| PUT /patterns/{id} | updatePattern | TC-064 (update) |
| PUT /patterns/{id}/deactivate | deactivatePattern | TC-065 (deactivate) |
| POST /sessions/{id}/exports | initiateExport | TC-070 (export), TC-071 (ownership check) |
| GET /sessions/{id}/exports | listExports | TC-072 (list exports paginated) |
| GET /sessions/{id}/exports/{id} | getExport | TC-073 (retrieve single export) |
| GET /audit | listAuditEvents | TC-080 (admin access), TC-081 (non-admin 403), TC-082 (HMAC chain) |
| GET /audit/verify | verifyAuditChain | TC-083 (chain valid), TC-084 (chain tampered) |
| GET /audit/{eventId} | getAuditEvent | TC-085 (retrieve with hmac field) |
| GET /health | getHealth | TC-089 (aggregate health status) |
| GET /health/live | getLiveness | TC-090 (alive) |
| GET /health/ready | getReadiness | TC-091 (ready), TC-092 (db fail 503) |
| GET /metrics | getMetrics | TC-093 (prometheus format) |

---

## Use Cases Covered (FAC-S4-017)

| Use Case | Priority | Endpoints |
|---|---|---|
| UC-001 Start Planning Session | Must | POST /sessions |
| UC-002 Describe Business Problem | Must | POST + GET /sessions/{id}/messages |
| UC-003 Review and Correct Business Model | Must | GET + PATCH /sessions/{id}/model |
| UC-004 Review and Accept Solution Hypothesis | Must | GET + PATCH /sessions/{id}/hypotheses, GET /sessions/{id}/hypotheses/{id} |
| UC-005 Consult Specialist Agent | Must | POST + GET /sessions/{id}/specialists, GET /sessions/{id}/specialists/{id} |
| UC-006 Resume Interrupted Session | Must | GET /sessions, GET + PATCH /sessions/{id} |
| UC-007 Manage Business Pattern Library | Should | All /patterns endpoints |
| UC-008 Export Session Plan | Should | POST + GET /sessions/{id}/exports |
| UC-009 Authenticate and Access Planner | Must | Not Required — implemented as passport-jwt middleware |
| UC-010 View Session History and Audit Log | Should | GET /audit, GET /sessions (admin) |

**SYSREQ coverage:**
| SYSREQ | Mapping |
|---|---|
| SYSREQ-009 Keycloak JWT | Not Required — passport-jwt middleware |
| SYSREQ-010 MongoDB tenant isolation | Not Required — service layer pattern |
| SYSREQ-011 RabbitMQ events | Deferred to INT-007 stub |
| SYSREQ-012 ADSP initializePlatform | Not Required — main.ts startup |
| SYSREQ-013 Three-level RBAC | Not Required — route middleware |
| SYSREQ-017 LLM resilience | Deferred to INT-001 stub |
| SYSREQ-018 ASVS L2 | Not Required — cross-cutting middleware |
| SYSREQ-019 TLS/HSTS | Not Required — ingress + helmet() |
| SYSREQ-020 HMAC audit logging | Mapped → GET /audit |
| SYSREQ-021 Session inactivity timeout | Not Required — Keycloak JWT TTL |
| SYSREQ-022 Data retention | Mapped → DELETE /sessions/{id} |
| SYSREQ-023 Health/observability | Mapped → /health/live, /health/ready, /metrics |
| SYSREQ-024 Input validation | Not Required — Zod validation middleware |

---

*Generated by GoA Software Factory Stage 4 — api-builder*
*Build date: 2026-10-10*
