# Test Traceability Report — ADSP Project Planner UI
Generated: 2026-10-10T00:00:00Z
Stage: 5 Phase 6 — Verification

---

## Summary

| Metric | Count |
|---|---|
| Pages | 12 |
| Unit test files | 12 |
| Integration test files | 12 |
| E2E spec files | 8 |
| Shared component files | 4 |
| UC coverage: full | 8 / 10 |
| UC coverage: partial | 2 / 10 (UC-005, UC-009) |
| UI-applicable TCs identified (Phase 1) | 37 |
| UI-applicable TCs covered (unit + integration) | 37 / 37 |
| Additional TCs covered beyond Phase 1 target | 22 |
| E2E-covered TCs | 17 |
| Protected B security rules verified | FAC-S5-024, FAC-S5-025, FAC-S5-026 |

---

## UC Coverage Matrix

| UC | Name | Unit Test File(s) | Integration Test | E2E Spec | Status |
|---|---|---|---|---|---|
| UC-001 | Start Planning Session | NewSessionStart.test.tsx, SessionDashboard.test.tsx | NewSessionStart, SessionDashboard | uc001-start-planning-session.spec.ts | COVERED |
| UC-002 | Describe Business Problem and Build Model | PlanningSession.test.tsx | PlanningSession | uc002-business-discovery.spec.ts | COVERED |
| UC-003 | Review and Correct Business Model | BusinessModelReview.test.tsx | BusinessModelReview | uc003-review-business-model.spec.ts | COVERED |
| UC-004 | Review and Accept Solution Hypothesis | HypothesisReview.test.tsx | HypothesisReview | uc004-hypothesis-review.spec.ts | COVERED |
| UC-005 | Consult ADSP Specialist | PlanningSession.test.tsx | PlanningSession | None — specialist consultation requires live INT-003..006 | PARTIAL |
| UC-006 | Resume Planning Session | SessionDashboard.test.tsx | SessionDashboard | uc006-resume-session.spec.ts | COVERED |
| UC-007 | Export Session Plan | SessionExport.test.tsx | SessionExport | uc007-export-session.spec.ts | COVERED |
| UC-008 | Review Session History (Admin) | SessionHistory.test.tsx | SessionHistory | uc008-session-history.spec.ts | COVERED |
| UC-009 | Authenticate and Authorise Access | SessionDashboard.test.tsx | SessionDashboard | None — Keycloak redirect requires live OIDC | PARTIAL |
| UC-010 | Manage Business Pattern Library | PatternLibrary.test.tsx, PatternEditor.test.tsx | PatternLibrary, PatternEditor | uc010-pattern-management.spec.ts | COVERED |

**Coverage summary:** 8 / 10 fully covered; 2 / 10 partially covered (acceptable — live integration dependencies).

---

## TC Coverage Matrix (UI-Applicable TCs)

| TC | Key Assertion | Unit Test File(s) | E2E Spec | Status |
|---|---|---|---|---|
| TC-001 | Session list renders with correct columns | SessionDashboard.test.tsx | uc001, uc006 | COVERED |
| TC-002 | New session creation — title required validation | NewSessionStart.test.tsx | uc001 | COVERED |
| TC-003 | New session creation — success navigates to workspace | NewSessionStart.test.tsx | uc001 | COVERED |
| TC-005 | Session title max length 200 chars enforced | NewSessionStart.test.tsx | — | COVERED |
| TC-006 | Resume session restores conversation history | SessionDashboard.test.tsx | uc006 | COVERED |
| TC-007 | Session dashboard empty state renders | SessionDashboard.test.tsx | — | COVERED |
| TC-008 | Session status badge colour mapping | SessionDashboard.test.tsx | uc006 | COVERED |
| TC-009 | Pagination controls render and fire page change | SessionDashboard.test.tsx | — | COVERED |
| TC-011 | Message send button disabled when INT-001 stub | PlanningSession.test.tsx | — | COVERED |
| TC-012 | JWT expiry redirect shown in session dashboard | SessionDashboard.test.tsx | — | COVERED |
| TC-014 | LLM unavailable 503 error callout rendered | PlanningSession.test.tsx | — | COVERED |
| TC-017 | Specialist consultation stub notice displayed | PlanningSession.test.tsx | — | COVERED |
| TC-018 | 7-day stale context warning shown | PlanningSession.test.tsx | uc006 | COVERED |
| TC-019 | Rate limit 429 callout rendered | PlanningSession.test.tsx | — | COVERED |
| TC-021 | Confidence score < 70 locks Accept Hypothesis | HypothesisReview.test.tsx | uc004 | COVERED |
| TC-022 | Business model confidence badge low/med/high tiers | BusinessModelReview.test.tsx | uc003 | COVERED |
| TC-023 | LLM unavailable 503 on hypothesis revision | HypothesisReview.test.tsx | uc004 | COVERED |
| TC-024 | Rate limit 429 on sendMessage | PlanningSession.test.tsx | — | COVERED |
| TC-025 | Empty concepts state shown in business model review | BusinessModelReview.test.tsx | — | COVERED |
| TC-026 | Concept type dropdown values match enum | BusinessModelReview.test.tsx | — | COVERED |
| TC-027 | Pattern list renders with status/match count columns | PatternLibrary.test.tsx | uc010 | COVERED |
| TC-028 | Pattern filter by status — empty state on no match | PatternLibrary.test.tsx | — | COVERED |
| TC-029 | Create pattern POST 201 navigates back to list | PatternEditor.test.tsx | uc010 | COVERED |
| TC-030 | Export page loads with 3 content tabs | SessionExport.test.tsx | uc007 | COVERED |
| TC-031 | DOCX export — future state FS-002 | SessionExport.test.tsx | — | FUTURE-STATE |
| TC-032 | JSON export triggers POST 201 and browser download | SessionExport.test.tsx | — | COVERED |
| TC-033 | Role-based export field exclusion (POPA s.17) | SessionExport.test.tsx | — | COVERED |
| TC-034 | Export gate — hypothesis not accepted blocks export | SessionExport.test.tsx | uc007 | COVERED |
| TC-035 | Admin hub stats badge load failure (503) | AdminHub.test.tsx | — | COVERED |
| TC-036 | 403 planner-user denied on admin pages | AdminHub.test.tsx | — | COVERED |
| TC-038 | Session history filter — date range returns results | SessionHistory.test.tsx | uc008 | COVERED |
| TC-039 | 403 planner-user denied on session-history | SessionHistory.test.tsx | — | COVERED |
| TC-040 | Session history row detail panel expands | SessionHistory.test.tsx | — | COVERED |
| TC-041 | Session history empty state on filter no-match | SessionHistory.test.tsx | uc008 | COVERED |
| TC-043 | CSV export excludes raw userId (POPA s.17) | SessionHistory.test.tsx | uc008 | COVERED |
| TC-044 | JSON export excludes raw userId (POPA s.17) | SessionHistory.test.tsx | — | COVERED |
| TC-045 | HMAC chain verified — success callout shown | AuditLog.test.tsx | — | COVERED |
| TC-046 | HMAC chain broken — emergency callout shown | AuditLog.test.tsx | — | COVERED |
| TC-047 | Audit log is read-only — no edit/delete controls | AuditLog.test.tsx | — | COVERED |
| TC-048 | Audit log PDF export includes HMAC status | AuditLog.test.tsx | — | COVERED |
| TC-049 | Audit log CSV excludes raw actorId | AuditLog.test.tsx | — | COVERED |
| TC-050 | Session dashboard sortable columns fire sort | SessionDashboard.test.tsx | — | COVERED |
| TC-051 | XSS: session title rendered as text not HTML | NewSessionStart.test.tsx | — | COVERED |
| TC-052 | XSS: pattern keywords rendered as text not HTML | PatternEditor.test.tsx | — | COVERED |
| TC-053 | Pattern payload 413 error message displayed | PatternEditor.test.tsx | — | COVERED |
| TC-054 | Pattern schema 422 error on invalid field | PatternEditor.test.tsx | — | COVERED |
| TC-055 | Keyboard navigation — tab order correct on forms | NewSessionStart.test.tsx | — | COVERED |
| TC-056 | Screen reader — aria-labels on icon buttons | SessionDashboard.test.tsx | — | COVERED |
| TC-057 | WCAG AA contrast — GoA DS components | All unit test files | — | COVERED |
| TC-069 | 80% context window warning banner shown | PlanningSession.test.tsx | — | COVERED |
| TC-072 | 403 planner-user denied on pattern-library | PatternLibrary.test.tsx | — | COVERED |
| TC-075 | Admin hub navigation tiles all rendered | AdminHub.test.tsx | — | COVERED |
| TC-080 | Session history annotation save PATCH 200 | SessionHistory.test.tsx | — | COVERED |
| TC-081 | Session history annotation 422 error shown | SessionHistory.test.tsx | — | COVERED |
| TC-082 | Role change triggers audit event (updateUser) | UserManagement.test.tsx | uc010 | COVERED |
| TC-083 | Deactivate user confirm dialog shown | UserManagement.test.tsx | — | COVERED |
| TC-087 | Incomplete model warning at confirm | BusinessModelReview.test.tsx | — | COVERED |
| TC-088 | Superseded hypothesis warning shown | HypothesisReview.test.tsx | — | COVERED |
| TC-099 | Invite user modal — email already exists 400 | UserManagement.test.tsx | — | COVERED |

**TC-031 (DOCX export):** Marked future-state per OpenAPI spec — `CreateExportRequest.format` supports `json` only; DOCX is FS-002. Unit test asserts the format dropdown offers only `json` in current implementation.

---

## Test File Inventory

### Unit Tests (`__tests__/*.test.tsx`)

| File | Pages Covered | TC Count |
|---|---|---|
| SessionDashboard.test.tsx | session-dashboard | TC-001, TC-006..009, TC-012, TC-050, TC-056..057 |
| NewSessionStart.test.tsx | new-session-start | TC-002, TC-003, TC-005, TC-051, TC-055, TC-057 |
| PlanningSession.test.tsx | planning-session | TC-011, TC-014, TC-017..019, TC-024, TC-069 |
| BusinessModelReview.test.tsx | business-model-review | TC-021..022, TC-025..026, TC-087 |
| HypothesisReview.test.tsx | hypothesis-review | TC-021, TC-023, TC-088 |
| SessionExport.test.tsx | session-export | TC-030, TC-032..034 |
| AdminHub.test.tsx | admin-hub | TC-035..036, TC-075 |
| PatternLibrary.test.tsx | pattern-library | TC-027..028, TC-072 |
| PatternEditor.test.tsx | pattern-editor | TC-029, TC-052..054 |
| SessionHistory.test.tsx | session-history | TC-038..041, TC-043..044, TC-080..081 |
| AuditLog.test.tsx | audit-log | TC-045..049 |
| UserManagement.test.tsx | user-management | TC-082..083, TC-099 |

### Integration Tests (`__tests__/integration/*.test.tsx`)

| File | Integration Points Mocked | Key Assertions |
|---|---|---|
| SessionDashboard.integration.test.tsx | MSW: GET /sessions | Auth header present; listSessions shape; pagination |
| NewSessionStart.integration.test.tsx | MSW: POST /sessions | createSession request body; navigation on 201 |
| PlanningSession.integration.test.tsx | MSW: GET /sessions/:id, POST /messages | sendMessage disabled (INT-001 stub) |
| BusinessModelReview.integration.test.tsx | MSW: GET/PATCH /sessions/:id/model | getBusinessModel shape; 409 conflict handling |
| HypothesisReview.integration.test.tsx | MSW: GET/PATCH /sessions/:id/hypotheses | listHypotheses shape; updateHypothesisStatus |
| SessionExport.integration.test.tsx | MSW: GET /sessions/:id, POST /exports | initiateExport body; no Protected B in URL |
| AdminHub.integration.test.tsx | MSW: GET /patterns, /sessions, /audit | Stats badge counts; 403 on missing role |
| PatternLibrary.integration.test.tsx | MSW: GET /patterns | listPatterns shape; filter params |
| PatternEditor.integration.test.tsx | MSW: POST/PUT /patterns | createPattern body; duplicate 400 |
| SessionHistory.integration.test.tsx | MSW: GET/PATCH /sessions | listSessions filters; updateSession annotation |
| AuditLog.integration.test.tsx | MSW: GET /audit, GET /audit/verify | verifyAuditChain shape; listAuditEvents shape |
| UserManagement.integration.test.tsx | MSW: GET/POST/PATCH/DELETE /users | listUsers shape; createUser body; email masking |

### E2E Specs (`e2e/*.spec.ts`)

| File | UC Flow | Key TCs |
|---|---|---|
| uc001-start-planning-session.spec.ts | UC-001 | TC-001..003 |
| uc002-business-discovery.spec.ts | UC-002 | TC-008, TC-018 |
| uc003-review-business-model.spec.ts | UC-003 | TC-021..023 |
| uc004-hypothesis-review.spec.ts | UC-004 | TC-021..023 |
| uc006-resume-session.spec.ts | UC-006 | TC-002, TC-008, TC-018 |
| uc007-export-session.spec.ts | UC-007 | TC-030, TC-034, FAC-S5-026 |
| uc008-session-history.spec.ts | UC-008 | TC-038, TC-041, TC-043, FAC-S5-025 |
| uc010-pattern-management.spec.ts | UC-010 | TC-027, TC-029, TC-082 |

---

## Protected B Security Test Coverage

| Rule | Assertion | Test Files |
|---|---|---|
| FAC-S5-024 — No Protected B in URL query params | No field values (userId, email, summary, hypothesis content) appear as URL query parameters; all writes use request body | SessionExport.test.tsx, PlanningSession.test.tsx, BusinessModelReview.test.tsx, HypothesisReview.test.tsx, SessionHistory.test.tsx, AuditLog.test.tsx, UserManagement.test.tsx |
| FAC-S5-025 — MaskedField for Protected B fields | Rendered DOM contains masked form; raw userId / actorId / email never in text content | BusinessModelReview.test.tsx, HypothesisReview.test.tsx, SessionExport.test.tsx, SessionHistory.test.tsx, AuditLog.test.tsx, UserManagement.test.tsx |
| FAC-S5-026 — No localStorage / sessionStorage writes | Storage.prototype.setItem spy confirms zero writes during component lifecycle | All 12 unit test files; E2E FAC-S5-026 assertions in uc001, uc003, uc004, uc006, uc007 |
| ASVS:V-8.3.1 | ownerDisplayName (SessionHistory), actorDisplayName (AuditLog), email via MaskedField (UserManagement) — raw identifiers never rendered | SessionHistory.test.tsx, AuditLog.test.tsx, UserManagement.test.tsx |
| CAS:RULE-017 | Email masking canUnmask={isTenantAdmin} — planner-admin sees masked value | UserManagement.test.tsx |
| ASVS:V-10.4.1 | verifyAuditChain called on AuditLog mount; HmacStatusBanner renders success/emergency per result | AuditLog.test.tsx |
| POPA s.17 | CSV/JSON export excludes raw userId; only ownerDisplayName | SessionHistory.test.tsx (TC-043, TC-044) |

---

## API Service Layer Coverage

| Metric | Value |
|---|---|
| Total authenticated operationIds in OpenAPI | 38 |
| Covered by api.ts | 32 |
| Health/metrics endpoints excluded (no JWT) | 6 |
| Coverage | 32 / 32 authenticated endpoints |
| API_BASE_URL | Sourced from `import.meta.env.VITE_API_BASE_URL` — never hardcoded |
| Auth mechanism | `authHeader()` reads `window.__keycloak.token`; injected via axios interceptor |
| Security annotations | ASVS:V-9.1.1 on BASE_URL line and authHeader(); CAS:RULE-017 on interceptor |

---

## Coverage Gaps and Deferrals

| Item | Reason | Resolution |
|---|---|---|
| UC-005: Specialist consultation — no E2E | Requires live INT-003..006 (specialist services not stubbed in Playwright) | Unit + integration tests via MSW provide single-page coverage |
| UC-009: Auth / Keycloak redirect — no E2E | Keycloak OIDC redirect requires live OIDC provider; Playwright mock cannot simulate real JWT expiry flow | SessionDashboard unit test covers 401/403 component states |
| TC-012: JWT expiry redirect | Redirect to Keycloak cannot be asserted in mock environment | Component state test asserts expiry callout is rendered |
| TC-031: DOCX export | FS-002 future-state item; OpenAPI `CreateExportRequest.format` supports `json` only | Unit test asserts format dropdown offers only `json`; DOCX path noted in content spec as future-state |
| TC-033: Admin-only export field exclusion | Requires role-based API response variation across two role contexts | Unit test mocks two response shapes and asserts conditional rendering per role |

---

## Validation Report Cross-Reference

All Phase 2–5 checks recorded in `validation-report.json`. Summary per phase:

| Phase | Pages | Checks | Passed | Failed | Status |
|---|---|---|---|---|---|
| Phase 2 Batch 1 | 3 | 45 | 45 | 0 | PASS |
| Phase 2 Batch 2 | 3 | 51 | 51 | 0 | PASS |
| Phase 2 Batch 3 | 3 | 54 | 54 | 0 | PASS |
| Phase 2 Batch 4 | 3 | 57 | 57 | 0 | PASS |
| Phase 3 (Design System) | 12 | 32 | 30 + 2 N/A | 0 | PASS |
| Phase 4 Batch 1 | 3 | 18 | 18 | 0 | PASS |
| Phase 4 Batch 2 | 3 | — | — | — | PASS |
| Phase 4 Batch 3 | 3 | 15 | 15 | 0 | PASS |
| Phase 4 Batch 4 | 3 | — | — | — | PASS |
| Phase 4C (API Service) | — | — | — | — | PASS |
| Phase 5 Unit | 12 | — | — | — | PASS |
| Phase 5 Integration | 12 | — | — | — | PASS |
| Phase 5 E2E | 8 flows | — | — | — | PASS |
| Phase 6 Verification | 12 | 6 | 6 | 0 | PASS |

`codeGenerationComplete: true`
