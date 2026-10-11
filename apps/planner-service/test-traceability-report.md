# Test Traceability Report — planner-service

**Service:** planner-service
**Classification:** Protected B — ATIA s.23
**Generated:** 2026-10-10
**Source:** test_specifications.json, use_cases.json, traceability_matrix.json, requirements-to-controller-mapping.json

---

## Section 1: TC Coverage

Status legend:
- **ANCHORED** — test is implemented in the identified test file and `it()` block
- **DEFERRED — Integration test scope (Phase E)** — testLevel=Integration; covered by `tests/integration/` files
- **DEFERRED — Acceptance/Manual** — testType requires manual or acceptance-level execution
- **DEFERRED — Inspection** — verificationMethod=I; not a test (configuration inspection)

| TC-ID | testType | Status | Test File | it() Description |
|---|---|---|---|---|
| TC-001 | Functional | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should create a session and return 201 with sessionId and status active |
| TC-002 | Functional | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should open a paused session and transition status to active |
| TC-003 | Functional | ANCHORED | src/controllers/__tests__/messages.controller.spec.ts | should extract business concepts from natural language and return updated BusinessModel |
| TC-004 | Functional | ANCHORED | src/controllers/__tests__/messages.controller.spec.ts | should return HTTP 503 when LLM stub is in fail-closed mode |
| TC-005 | Functional | ANCHORED | src/controllers/__tests__/business-model.controller.spec.ts | should update a concept type to Actor and return HTTP 200 |
| TC-006 | Functional | ANCHORED | src/controllers/__tests__/hypotheses.controller.spec.ts | should accept a proposed hypothesis and transition status to accepted |
| TC-007 | Functional | ANCHORED | src/controllers/__tests__/specialists.controller.spec.ts | should delegate to form-service specialist and return guidance |
| TC-008 | Functional | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should restore full session context when resuming a paused session |
| TC-009 | Functional | ANCHORED | src/controllers/__tests__/patterns.controller.spec.ts | should create a new business pattern and return 201 with patternId |
| TC-010 | Functional | ANCHORED | src/controllers/__tests__/exports.controller.spec.ts | should return a structured session export document with all required fields |
| TC-011 | Functional | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should return HTTP 200 for a request with a valid Keycloak JWT |
| TC-012 | Authorization | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should return HTTP 401 when Bearer JWT has expired |
| TC-013 | Data Integrity | ANCHORED | src/controllers/__tests__/business-model.controller.spec.ts | should return HTTP 409 when BusinessModel version conflicts during concurrent update |
| TC-014 | Functional | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should return only the authenticated user's own sessions |
| TC-015 | Authorization | ANCHORED | src/controllers/__tests__/audit.controller.spec.ts | should return HTTP 403 when planner-user attempts to access audit log |
| TC-016 | Functional | ANCHORED | src/controllers/__tests__/hypotheses.controller.spec.ts | should generate a revised hypothesis and supersede the prior one |
| TC-017 | Functional | ANCHORED | src/controllers/__tests__/specialists.controller.spec.ts | should return fallback guidance when form-service specialist stub is fail-closed |
| TC-018 | Functional | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should include staleness warning when session has been idle more than 7 days |
| TC-019 | Authorization | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should return HTTP 403 for user with no planner role |
| TC-020 | Functional | ANCHORED | src/controllers/__tests__/patterns.controller.spec.ts | should return HTTP 503 when Config Service stub is unavailable |
| TC-021 | Functional | ANCHORED | src/controllers/__tests__/messages.controller.spec.ts | should not generate a hypothesis when confidenceScore is 69 |
| TC-022 | Functional | ANCHORED | src/controllers/__tests__/messages.controller.spec.ts | should trigger hypothesis generation when confidenceScore reaches exactly 70 |
| TC-023 | Functional | ANCHORED | src/controllers/__tests__/messages.controller.spec.ts | should process the 50th LLM request without rate limit rejection |
| TC-024 | Functional | ANCHORED | src/controllers/__tests__/messages.controller.spec.ts | should return HTTP 429 with Retry-After on the 51st LLM request |
| TC-025 | Functional | ANCHORED | src/controllers/__tests__/patterns.controller.spec.ts | should not surface a pattern when composite score is 59 |
| TC-026 | Functional | ANCHORED | src/controllers/__tests__/patterns.controller.spec.ts | should surface a pattern when composite score reaches exactly 60 |
| TC-027 | API Contract | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should return up to 100 sessions when pageSize=100 |
| TC-028 | API Contract | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should return HTTP 400 when pageSize=101 |
| TC-029 | State Transition | ANCHORED | src/controllers/__tests__/hypotheses.controller.spec.ts | should accept proposed-to-accepted hypothesis status transition |
| TC-030 | State Transition | ANCHORED | src/controllers/__tests__/hypotheses.controller.spec.ts | should reject accepted-to-proposed hypothesis transition with HTTP 422 |
| TC-031 | State Transition | ANCHORED | src/controllers/__tests__/hypotheses.controller.spec.ts | should reject rejected-to-accepted hypothesis transition with HTTP 422 |
| TC-032 | State Transition | ANCHORED | src/controllers/__tests__/hypotheses.controller.spec.ts | should reject superseded-to-proposed hypothesis transition with HTTP 422 |
| TC-033 | State Transition | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should transition session status from active to completed |
| TC-034 | State Transition | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should transition session status from completed to archived |
| TC-035 | Functional | ANCHORED | src/controllers/__tests__/business-model.controller.spec.ts | should accept valid conceptType Actor and return HTTP 200 |
| TC-036 | Functional | ANCHORED | src/controllers/__tests__/business-model.controller.spec.ts | should reject invalid conceptType Person with HTTP 400 |
| TC-037 | Authorization | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should allow session creation for planner-user role |
| TC-038 | Authorization | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should return all tenant sessions for planner-admin |
| TC-039 | Authorization | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should deny all access for user with no planner role |
| TC-040 | Authorization | ANCHORED | src/controllers/__tests__/specialists.controller.spec.ts | should block delegation to disabled specialist |
| TC-041 | Authorization | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should return HTTP 403 for cross-tenant session access |
| TC-042 | Authorization | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should return HTTP 403 for cross-user session access within same tenant |
| TC-043 | Functional | ANCHORED | src/services/__tests__/sessions.service.spec.ts | should publish session-created event with correct tenantId and sessionId |
| TC-044 | Functional | ANCHORED | src/services/__tests__/sessions.service.spec.ts | should drop and log WARN for unregistered domain event type |
| TC-045 | Integration Point | DEFERRED — Integration test scope (Phase E) | tests/integration/messages.integration.spec.ts | INT-001 stub returns canned response for Planning Agent |
| TC-046 | Integration Point | DEFERRED — Integration test scope (Phase E) | tests/integration/messages.integration.spec.ts | INT-001 stub fail-closed on connection-refused returns HTTP 503 |
| TC-047 | Integration Point | DEFERRED — Integration test scope (Phase E) | tests/integration/patterns.integration.spec.ts | INT-002 Config Service stub returns empty pattern list |
| TC-048 | Integration Point | DEFERRED — Integration test scope (Phase E) | tests/integration/specialists.integration.spec.ts | INT-004 PDF specialist stub fails closed and returns fallback guidance |
| TC-049 | Integration Point | DEFERRED — Integration test scope (Phase E) | tests/integration/sessions.integration.spec.ts | INT-007 RabbitMQ stub fails closed without blocking session creation |
| TC-050 | Security | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should return HTTP 401 when JWT signature has been tampered |
| TC-051 | Security | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should sanitize or reject XSS payload in session title |
| TC-052 | Security | DEFERRED — Acceptance/Manual | — | HTTP requests are redirected to HTTPS (infrastructure-level; verified via deployment config) |
| TC-053 | Audit/Logging | ANCHORED | src/services/__tests__/audit.service.spec.ts | should maintain HMAC chain integrity across 10 consecutive audit entries |
| TC-054 | Audit/Logging | ANCHORED | src/controllers/__tests__/patterns.controller.spec.ts | should write audit log entry before returning response on pattern deactivation |
| TC-055 | Accessibility | DEFERRED — Acceptance/Manual | — | All interactive elements are reachable via keyboard navigation (manual acceptance test) |
| TC-056 | Accessibility | DEFERRED — Acceptance/Manual | — | Screen reader announces session list items correctly (manual acceptance test) |
| TC-057 | Accessibility | DEFERRED — Acceptance/Manual | — | Text color contrast ratio meets WCAG 2.1 AA (axe scanner; Stage 5 UI) |
| TC-058 | Performance | DEFERRED — Acceptance/Manual | — | Session create API responds within 2 seconds under normal load (load test) |
| TC-059 | Performance | DEFERRED — Acceptance/Manual | — | LLM streaming response delivers first token within 5 seconds (load test) |
| TC-060 | API Contract | ANCHORED | src/controllers/__tests__/health.controller.spec.ts | should return HTTP 200 with status ok when service is healthy |
| TC-061 | API Contract | ANCHORED | src/controllers/__tests__/health.controller.spec.ts | should return HTTP 503 when MongoDB connection is unavailable |
| TC-062 | API Contract | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should include error message and statusCode in all error responses |
| TC-063 | Data Integrity | ANCHORED | src/services/__tests__/sessions.service.spec.ts | should always include tenantId in persisted PlanningSession documents |
| TC-064 | Security | DEFERRED — Inspection | — | MongoDB at-rest encryption verified by configuration inspection (verificationMethod=I) |
| TC-065 | Audit/Logging | ANCHORED | src/controllers/__tests__/patterns.controller.spec.ts | should return HTTP 503 and rollback when audit_events write fails |
| TC-066 | API Contract | ANCHORED | src/controllers/__tests__/messages.controller.spec.ts | should return HTTP 503 when LLM stub reports deprecated model version |
| TC-067 | Functional | ANCHORED | src/controllers/__tests__/specialists.controller.spec.ts | should accept modelVersion string of exactly 50 characters |
| TC-068 | Functional | ANCHORED | src/controllers/__tests__/specialists.controller.spec.ts | should accept modelVersion string of exactly 5 characters |
| TC-069 | Functional | ANCHORED | src/controllers/__tests__/messages.controller.spec.ts | should return 80% quota warning at the 40th LLM request |
| TC-070 | Functional | ANCHORED | src/controllers/__tests__/messages.controller.spec.ts | should accept LLM request when rate counter is at 0 |
| TC-071 | Functional | ANCHORED | src/controllers/__tests__/messages.controller.spec.ts | should trigger hypothesis generation when confidenceScore reaches 100 |
| TC-072 | Functional | ANCHORED | src/controllers/__tests__/messages.controller.spec.ts | should not trigger hypothesis generation when confidenceScore is 50 |
| TC-073 | Functional | ANCHORED | src/controllers/__tests__/patterns.controller.spec.ts | should surface pattern when composite score is 100 |
| TC-074 | Functional | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should use default pageSize of 20 when no pageSize parameter is provided |
| TC-075 | Functional | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should return exactly 1 session when pageSize=1 |
| TC-076 | State Transition | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should transition session status from active to paused |
| TC-077 | State Transition | ANCHORED | src/controllers/__tests__/hypotheses.controller.spec.ts | should accept draft-to-proposed hypothesis status transition |
| TC-078 | State Transition | ANCHORED | src/controllers/__tests__/hypotheses.controller.spec.ts | should accept proposed-to-rejected hypothesis status transition |
| TC-079 | State Transition | ANCHORED | src/controllers/__tests__/hypotheses.controller.spec.ts | should accept accepted-to-superseded hypothesis status transition |
| TC-080 | Authorization | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should allow planner-user to access their own session |
| TC-081 | Authorization | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should return HTTP 403 for planner-user accessing another user's session |
| TC-082 | Functional | ANCHORED | src/services/__tests__/messages.service.spec.ts | should use the configured modelVersion for all LLM calls |
| TC-083 | Functional | ANCHORED | src/services/__tests__/messages.service.spec.ts | should use default model version claude-sonnet-4-5 when none configured |
| TC-084 | Functional | ANCHORED | src/controllers/__tests__/messages.controller.spec.ts | should accept the 49th LLM request without rate limit |
| TC-085 | Functional | ANCHORED | src/controllers/__tests__/messages.controller.spec.ts | should return HTTP 429 with Retry-After on the 51st LLM request per hour |
| TC-086 | Functional | ANCHORED | src/services/__tests__/messages.service.spec.ts | should trigger hypothesis generation when all BR-004 conditions are met |
| TC-087 | Functional | ANCHORED | src/services/__tests__/messages.service.spec.ts | should return warning when confidenceScore meets threshold but model is incomplete |
| TC-088 | Functional | ANCHORED | src/controllers/__tests__/business-model.controller.spec.ts | should accept valid conceptType Goal and return HTTP 200 |
| TC-089 | Functional | ANCHORED | src/controllers/__tests__/business-model.controller.spec.ts | should reject invalid conceptType InvalidType with HTTP 400 |
| TC-090 | Functional | ANCHORED | src/controllers/__tests__/patterns.controller.spec.ts | should write audit entry atomically when admin creates a pattern |
| TC-091 | Functional | ANCHORED | src/controllers/__tests__/patterns.controller.spec.ts | should return HTTP 503 and rollback when audit write fails during pattern update |
| TC-092 | Authorization | ANCHORED | src/controllers/__tests__/specialists.controller.spec.ts | should return HTTP 403 when specialist isEnabled is false |
| TC-093 | Functional | ANCHORED | src/controllers/__tests__/hypotheses.controller.spec.ts | should accept a valid proposed-to-accepted status transition |
| TC-094 | Functional | ANCHORED | src/controllers/__tests__/hypotheses.controller.spec.ts | should reject forbidden proposed-to-draft status transition with HTTP 422 |
| TC-095 | Functional | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should return up to 50 sessions when pageSize=50 |
| TC-096 | Functional | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should return HTTP 400 when pageSize=101 is submitted |
| TC-097 | Functional | ANCHORED | src/services/__tests__/sessions.service.spec.ts | should publish registered event type session-created successfully |
| TC-098 | Functional | ANCHORED | src/services/__tests__/sessions.service.spec.ts | should block and WARN log for unregistered domain event type custom-event |
| TC-099 | Functional | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should return HTTP 503 when MongoDB write fails during session creation |
| TC-100 | Functional | ANCHORED | src/controllers/__tests__/messages.controller.spec.ts | should store matchedPatternId in BusinessModel when pattern score exceeds threshold |
| TC-101 | Functional | ANCHORED | src/controllers/__tests__/messages.controller.spec.ts | should trigger hypothesis generation in UC-002 alt flow 5a at confidenceScore 70 |
| TC-102 | Functional | ANCHORED | src/controllers/__tests__/business-model.controller.spec.ts | should persist each of multiple concept type corrections sequentially |
| TC-103 | Functional | ANCHORED | src/controllers/__tests__/hypotheses.controller.spec.ts | should notify user and preserve feedback when LLM unavailable during revision |
| TC-104 | Functional | ANCHORED | src/controllers/__tests__/specialists.controller.spec.ts | should auto-delegate to specialist and update specialistProgress |
| TC-105 | Authorization | ANCHORED | src/controllers/__tests__/sessions.controller.spec.ts | should return HTTP 404 for non-existent or unowned session |
| TC-106 | Functional | ANCHORED | src/controllers/__tests__/patterns.controller.spec.ts | should update existing pattern and write audit entry |
| TC-107 | Functional | ANCHORED | src/controllers/__tests__/patterns.controller.spec.ts | should deactivate pattern and invalidate cache |
| TC-108 | Functional | ANCHORED | src/controllers/__tests__/exports.controller.spec.ts | should return HTTP 503 when MongoDB read fails during export |
| TC-109 | Functional | ANCHORED | src/controllers/__tests__/business-model.controller.spec.ts | should accept valid relationshipType 'uses' in ConceptRelationship |
| TC-110 | Functional | ANCHORED | src/controllers/__tests__/business-model.controller.spec.ts | should reject invalid relationshipType 'invalid-type' with HTTP 400 |
| TC-111 | Functional | ANCHORED | src/controllers/__tests__/messages.controller.spec.ts | should accept ConversationMessage with role 'user' |
| TC-112 | Functional | ANCHORED | src/controllers/__tests__/messages.controller.spec.ts | should reject ConversationMessage with role 'moderator' with HTTP 400 |
| TC-113 | Functional | ANCHORED | src/services/__tests__/messages.service.spec.ts | should accept LLMRequest messages with role 'assistant' |
| TC-114 | Functional | ANCHORED | src/services/__tests__/messages.service.spec.ts | should reject LLMRequest message with invalid role 'system-injected' |
| TC-115 | Functional | ANCHORED | src/controllers/__tests__/patterns.controller.spec.ts | should return HTTP 400 with field-level errors array for missing required fields |
| TC-116 | Data Integrity | DEFERRED — Integration test scope (Phase E) | tests/integration/sessions.integration.spec.ts | duplicate sessionId insert rejected by MongoDB unique index |
| TC-117 | Data Integrity | DEFERRED — Integration test scope (Phase E) | tests/integration/sessions.integration.spec.ts | required field tenantId missing on session insert is rejected by MongoDB validator |
| TC-118 | Data Integrity | DEFERRED — Integration test scope (Phase E) | tests/integration/business-model.integration.spec.ts | DDL-derived enum constraint — conceptType enum validator rejects out-of-enum values |
| TC-119 | Data Integrity | DEFERRED — Integration test scope (Phase E) | tests/integration/hypotheses.integration.spec.ts | DDL-derived enum constraint — hypothesis status enum validator enforced at MongoDB layer |
| TC-120 | Data Integrity | DEFERRED — Integration test scope (Phase E) | tests/integration/business-model.integration.spec.ts | DDL-derived enum constraint — role field enum validator enforced at MongoDB layer |
| TC-121 | Data Integrity | DEFERRED — Integration test scope (Phase E) | tests/integration/audit.integration.spec.ts | HMAC chain integrity across consecutive audit events |
| TC-122 | Data Integrity | DEFERRED — Integration test scope (Phase E) | tests/integration/sessions.integration.spec.ts | multi-tenant isolation — tenantId filter enforced at MongoDB query layer |
| TC-123 | Data Integrity | DEFERRED — Integration test scope (Phase E) | tests/integration/audit.integration.spec.ts | HMAC audit chain detectable tampering — chain breaks on entry mutation |
| TC-124 | Data Integrity | DEFERRED — Integration test scope (Phase E) | tests/integration/sessions.integration.spec.ts | compound unique constraint on user_context user+tenant pair |

---

## Section 2: Use Cases Covered

All UC-001..UC-010 traced through traceability_matrix.json UC→TC→test chains.

| UC-ID | Use Case Title | Anchoring TCs | Primary Test File |
|---|---|---|---|
| UC-001 | Start Planning Session | TC-001, TC-002, TC-099 | src/controllers/__tests__/sessions.controller.spec.ts |
| UC-002 | Describe Business Problem and Build Model | TC-003, TC-004, TC-021, TC-022, TC-100, TC-101 | src/controllers/__tests__/messages.controller.spec.ts |
| UC-003 | Review and Correct Business Model | TC-005, TC-013, TC-035, TC-036, TC-088, TC-089, TC-102 | src/controllers/__tests__/business-model.controller.spec.ts |
| UC-004 | Review and Accept Solution Hypothesis | TC-006, TC-016, TC-029, TC-030, TC-031, TC-032, TC-093, TC-094, TC-103 | src/controllers/__tests__/hypotheses.controller.spec.ts |
| UC-005 | Consult Specialist Agent | TC-007, TC-017, TC-040, TC-092, TC-104 | src/controllers/__tests__/specialists.controller.spec.ts |
| UC-006 | Resume Interrupted Planning Session | TC-008, TC-018, TC-076, TC-105 | src/controllers/__tests__/sessions.controller.spec.ts |
| UC-007 | Manage Business Pattern Library | TC-009, TC-020, TC-054, TC-065, TC-090, TC-091, TC-106, TC-107, TC-115 | src/controllers/__tests__/patterns.controller.spec.ts |
| UC-008 | Export Session Plan | TC-010, TC-108 | src/controllers/__tests__/exports.controller.spec.ts |
| UC-009 | Authenticate and Access Planner | TC-011, TC-012, TC-019, TC-037, TC-038, TC-039, TC-041, TC-042, TC-050 | src/controllers/__tests__/sessions.controller.spec.ts |
| UC-010 | View Session History and Audit Log | TC-014, TC-015, TC-053 | src/controllers/__tests__/audit.controller.spec.ts, src/controllers/__tests__/sessions.controller.spec.ts |

---

## Traceability Summary

| Category | Count |
|---|---|
| Total TCs in test_specifications.json | 124 |
| ANCHORED (unit test coverage) | 103 |
| DEFERRED — Integration test scope (Phase E) | 14 |
| DEFERRED — Acceptance/Manual | 6 |
| DEFERRED — Inspection (verificationMethod=I) | 1 |
| Use Cases covered (UC-001..UC-010) | 10 of 10 |
| **Coverage: 100%** | All 10 use cases (UC-001..UC-010) have anchored test coverage |

All 10 use cases have at least one ANCHORED TC providing unit-level coverage.
Integration-level TCs (TC-045..TC-049, TC-116..TC-124) are deferred to the integration
test suite (`tests/integration/`) per Phase E scope.
