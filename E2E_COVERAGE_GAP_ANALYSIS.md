# ADSP Monorepo — E2E Coverage Gap Analysis

> Generated: 2026-10-15  
> Status: Work-in-progress implementation  
> Scope: All 45 app directories under `adsp-monorepo/apps/`

---

## 1. Application Inventory and Coverage Classification

### Classification key
| Label | Meaning |
|---|---|
| **Comprehensive** | Dedicated suite; primary user journeys covered; in nightly CI |
| **Partial** | Dedicated suite; significant workflows have no scenarios |
| **Minimal** | Suite exists but < 5% of functionality is tested |
| **Stub** | Suite scaffolded but contains only boilerplate (no real tests) |
| **Indirect** | No dedicated suite; covered through another app's E2E scenarios |
| **Missing** | No coverage at any E2E layer |
| **Not applicable** | Backend service; unit/integration/contract tests are more appropriate |

### Master inventory

| App / Service | Type | Dedicated E2E | Coverage | In Nightly | Notes |
|---|---|---|---|---|---|
| `form-admin-app` | React SPA | `form-admin-app-e2e` | **Partial** → **Improving** | ✅ | 1 @smoke-test only → adding @regression scenarios |
| `form-app` | React SPA | `form-app-e2e` | **Comprehensive** | ✅ | 10 active regression tests |
| `sandbox-app` | React SPA | `sandbox-app-e2e` | **Stub** | ❌ | Default Nx template only |
| `status-app` | React SPA | `status-app-e2e` | **Comprehensive** | ✅ | 4 active tests; public app |
| `subscriber-app` | React SPA | `subscriber-app-e2e` | **Comprehensive** | ✅ | 4 active tests |
| `task-app` | React SPA | `task-app-e2e` | **Stub** → **Improving** | ❌ → ✅ | Converting to Cucumber; adding to nightly |
| `tenant-management-webapp` | React SPA | `tenant-management-webapp-e2e` | **Comprehensive** | ✅ | 114 active tests; covers 18 services |
| `api-docs-app` | Node/Express (server-rendered) | None | **Missing** | ❌ | API-level E2E feasible; see §4 |
| `builder-app` | React SPA | None | **Missing** | ❌ | Depends on live LLM/WebSocket; partially testable |
| `dashboard-metrics` | Node/Express API | None | **Missing** | ❌ | Single read endpoint; API-level E2E feasible |
| `form-management-app` | React SPA | None | **Missing** | ❌ | Rich admin UI; high-value gap |
| `agent-service` | Node/Express + Socket.IO | None | **Not applicable** | ❌ | WebSocket + LLM dependency; unit tests cover logic |
| `audit-service` | Node/Express | None | **Indirect** | ❌ | Audit log entries verified in `tenant-management-webapp-e2e` via event log |
| `cache-service` | Node/Express | None | **Indirect** | ❌ | `cache.feature` in tenant-management-webapp-e2e |
| `calendar-service` | Node/Express | None | **Indirect** | ❌ | `calendar.feature` |
| `comment-service` | Node/Express | None | **Indirect** | ❌ | `comment.feature` |
| `configuration-service` | Node/Express | None | **Indirect** | ❌ | `configuration-service.feature` |
| `directory-service` | Node/Express | None | **Indirect** | ❌ | `directory-service.feature` (inc. API tests) |
| `event-service` | Node/Express | None | **Indirect** | ❌ | `events.feature` |
| `export-service` | Node/Express | None | **Missing** | ❌ | API-level; see §4 |
| `feedback-service` | Node/Express | None | **Indirect** | ❌ | `feedback.feature` |
| `file-service` | Node/Express | None | **Indirect** | ❌ | `file-service.feature` (6 API tests) |
| `form-gateway` | Node/Express proxy | None | **Indirect** | ❌ | Exercised by `form-app-e2e` (anonymous submission) |
| `form-service` | Node/Express | None | **Indirect** | ❌ | `form.feature` in tenant-management-webapp-e2e |
| `notification-service` | Node/Express | None | **Indirect** | ❌ | `notifications.feature` (10 active; 10 @ignore) |
| `pdf-service` | Node/Express | None | **Indirect** | ❌ | `pdf-service.feature` |
| `pii-service` | Python/Flask | None | **Missing** | ❌ | Security-adjacent; API-level E2E warranted |
| `push-service` | Node/Express + Socket.IO | None | **Indirect** | ❌ | WebSocket tested via tenant-management-webapp auth flow |
| `script-service` | Node/Express | None | **Indirect** | ❌ | `script.feature` |
| `sharepoint-service` | Node/Express | None | **Not applicable** | ❌ | Stub returning `{message:'OK'}`; no real implementation |
| `status-service` | Node/Express | None | **Indirect** | ❌ | `service-status.feature` |
| `subscriber-gateway` | Node/Express | None | **Indirect** | ❌ | Exercised by `subscriber-app-e2e` |
| `task-service` | Node/Express | None | **Indirect** | ❌ | `task.feature` + `task-app-e2e` |
| `tenant-management-api` | Node/Express | None | **Indirect** | ❌ | `tenant-management-api.feature` (health check) |
| `tenant-management-gateway` | Node/Express | None | **Indirect** | ❌ | Exercised by `tenant-management-webapp-e2e` auth flows |
| `token-handler` | Node/Express | None | **Missing** | ❌ | Auth backbone; API-level E2E warranted |
| `value-service` | Node/Express | None | **Indirect** | ❌ | `value.feature` (10 scenarios) |
| `verify-service` | Node/Express | None | **Missing** | ❌ | Security-adjacent; API-level E2E warranted |

---

## 2. Functional-to-E2E Coverage Matrix

### Key: `ADSP Capability → Workflow → Scenario → Test`

#### tenant-management-webapp (Admin UI for all services)

| ADSP Capability | Workflow | Scenario | Test |
|---|---|---|---|
| Auth / Tenant login | Authenticated tenant admin access | Login with email+password | `tenant-admin.feature: Access the Tenant management webapp` |
| Configuration service | View / create / edit config definitions | CRUD config definitions | `configuration-service.feature` (8 scenarios) |
| Directory service | List entries / add tenant entries / API access | Full CRUD + API | `directory-service.feature` (8 scenarios) |
| Event service | View definitions / add / publish streams | Full event lifecycle | `events.feature` (12 scenarios) |
| File service | Upload / download / metadata / retention | 6 @api + UI scenarios | `file-service.feature` (14 scenarios) |
| Form service | Create definitions / intake / disposition | Form definition lifecycle | `form.feature` (12 scenarios) |
| Notification service | Create types / subscribers / channels | Subscription management | `notifications.feature` (21 scenarios, 10 @ignore) |
| PDF service | Create / preview / edit templates | Template lifecycle | `pdf-service.feature` (4 scenarios) |
| Script service | Create / edit / delete scripts | Script lifecycle | `script.feature` (3 scenarios) |
| Status service | Create applications / notices / health checks | Status management | `service-status.feature` (14 scenarios) |
| Task service | Create / view task queue configuration | Queue admin | `task.feature` (3 scenarios) |
| Calendar service | Create calendars / events | Calendar lifecycle | `calendar.feature` (6 scenarios) |
| Cache service | View cache targets | Cache overview | `cache.feature` (2 scenarios) |
| Comment service | Create topic types / topics / comments | Comment lifecycle | `comment.feature` (5 scenarios) |
| Value service | Define / edit value definitions / API query | Value lifecycle | `value.feature` (10 scenarios) |
| Feedback service | Add sites / receive feedback | Feedback lifecycle | `feedback.feature` (5 scenarios) |
| Tenant management API | Health check | GET /health | `tenant-management-api.feature` |

#### form-app (Applicant-facing form submission)

| ADSP Capability | Workflow | Scenario | Test |
|---|---|---|---|
| Anonymous form submission | Submit a form without login | Submit anonymous application | `forms.feature: I can view and submit an anonymous application` |
| Authenticated form submission | Login + submit form | Login and submit | `forms.feature: I can log in to submit an application` |
| Intake period enforcement | Apply during open intake | Intake enforcement | `forms.feature: I can apply during an open intake period` |
| Conditional form fields | Dynamic field visibility based on answers | Conditional fields | `forms.feature: I can submit a form with conditional required fields` |
| Validation | Required field errors | Missing fields | `forms.feature: I can see validation errors on missing required fields` |
| Task list navigation | Multi-step form workflow | Navigate task list | `forms.feature: I can navigate task list pages and submit` (**@ignore**) |

#### form-admin-app (Admin review of form submissions)

| ADSP Capability | Workflow | Scenario | Test |
|---|---|---|---|
| Authentication | Admin login | Login to form admin | `form-admin.feature: I can log in` (**@smoke-test @regression** — after this fix) |
| Definitions list | View definitions | List definitions table | `form-admin.feature: Can see form definitions list` (**@regression** — new) |
| Definition detail | Open a definition | View definition heading | `form-admin.feature: Can open a form definition` (**@regression** — new) |
| Responses review | View form submissions | Responses page visible | `form-admin.feature: Can see form responses` (**@regression** — new) |

#### task-app (Task worker queue management)

| ADSP Capability | Workflow | Scenario | Test |
|---|---|---|---|
| Landing page | Public overview | Landing heading | `task-app.feature: Can see landing page` (**@smoke-test @regression** — new) |
| Tenant login | Keycloak redirect | Login form visible | `task-app.feature: Can access login page` (**@regression** — new) |
| Task queues list | View available queues | Queues page renders | `task-app.feature: Can see task queues` (**@regression** — new) |
| Task queue detail | Open queue and see tasks | Tasks list renders | `task-app.feature: Can open task queue` (**@regression** — new) |

#### subscriber-app (Subscription self-service)

| ADSP Capability | Workflow | Scenario | Test |
|---|---|---|---|
| Authenticated subscription management | Login + view subscriptions | Login + view page | `subscription-management.feature` (4 active scenarios) |
| Contact info management | Edit email/phone/channel | Contact info update | `subscription-management.feature` |
| Channel configuration | Set notification channel | Channel selection | `subscription-management.feature` |

#### status-app (Public service status board)

| ADSP Capability | Workflow | Scenario | Test |
|---|---|---|---|
| Public status board | View platform service statuses | Status info visible | `status-notice.feature` (4 active scenarios) |
| Service notices | View maintenance notices | Notices visible | `status-notice.feature` |

---

## 3. Work Completed in This Session

### 3.1 form-admin-app-e2e — Added @regression scenarios

**Before:** 1 scenario (`@smoke-test` only) → 0 tests run nightly  
**After:** 5 scenarios (4 `@regression`) → ~4 tests run nightly

New scenarios added:
1. `@smoke-test @regression` — Login and view Form administration page (existing + added @regression)
2. `@regression` — Can see the form definitions list
3. `@regression` — Can open a form definition to see its details
4. `@regression` — Can see form responses for a definition
5. `@accessibility @regression @ignore` — No accessibility issues (blocked by GoA component issues)

Files modified:
- `apps/form-admin-app-e2e/src/integration/form-admin.feature`
- `apps/form-admin-app-e2e/src/integration/form-admin/form-admin.page.ts`
- `apps/form-admin-app-e2e/src/integration/form-admin/form-admin.step.ts`

### 3.2 task-app-e2e — Converted from stub to real Cucumber/BDD suite

**Before:** Single boilerplate `getGreeting().contains('Welcome task-app')` test in plain Cypress  
**After:** Full Cucumber/BDD suite with 4 @regression scenarios + Cypress environment configs

Files created:
- `apps/task-app-e2e/cypress.staging.config.js`
- `apps/task-app-e2e/cypress.dev.config.js`
- `apps/task-app-e2e/cypress.prod.config.js`
- `apps/task-app-e2e/.cypress-cucumber-preprocessorrc.js`
- `apps/task-app-e2e/src/plugins/index.js`
- `apps/task-app-e2e/src/support/index.ts`
- `apps/task-app-e2e/src/support/commands.ts`
- `apps/task-app-e2e/src/support/app.po.ts`
- `apps/task-app-e2e/src/support/axe-html-reporter-util.ts`
- `apps/task-app-e2e/src/integration/task-app.feature`
- `apps/task-app-e2e/src/integration/task-app/task-app.page.ts`
- `apps/task-app-e2e/src/integration/task-app/task-app.step.ts`

Scenarios (5 total, 4 @regression):
1. `@smoke-test @regression` — Landing page shows "Task management" heading
2. `@regression` — Keycloak login form visible at tenant login URL
3. `@regression` — Authenticated user sees task queues list
4. `@regression` — Authenticated user can open a task queue
5. `@accessibility @regression @ignore` — No accessibility issues on overview page

### 3.3 CI — Added task-app to nightly build matrix

File modified: `.github/workflows/nightly.yml`

```diff
-        app: [tenant-management-webapp, status-app, subscriber-app, form-app, form-admin-app]
+        app: [tenant-management-webapp, status-app, subscriber-app, form-app, form-admin-app, task-app]
```

---

## 4. Remaining Gaps — Prioritized Implementation Plan

### Priority 1 (High business value, feasible now)

#### 4.1 form-management-app-e2e — NEW project needed

**App purpose:** Admin UI for creating and editing form definitions (JSON Schema + UI Schema editor, file attachments, PDF preview, role configuration).

**Why high priority:** Rich UI application with no E2E coverage. The form-service is a critical ADSP capability. The `tenant-management-webapp-e2e` form.feature covers the *configuration service* side but not the *form management app* itself.

**Proposed spec file:** `apps/form-management-app-e2e/src/integration/form-management.feature`

| Scenario | Priority | Notes |
|---|---|---|
| Authenticated admin can view the form definitions list | P1 | Happy path |
| Admin can filter definitions by name/tag | P1 | Search functionality |
| Admin can create a new form definition (metadata only) | P1 | CRUD |
| Admin can open the schema editor for an existing definition | P1 | Core workflow |
| Admin can save a schema change and verify it persists | P1 | Data persistence |
| Admin can delete a form definition | P2 | With cleanup |
| Unauthenticated user is redirected to login | P1 | Auth gate |
| User without `form-admin` role cannot see definition listing | P2 | RBAC |

**Prerequisites:**
- Staging URL for `form-management-app` (likely `https://form-management.adsp-uat.alberta.ca/` — verify)
- Test form definition with ID in autotest tenant

**Blocker:** Unknown staging URL — needs verification against ADSP deployment config.

#### 4.2 verify-service API scenarios — Add to tenant-management-webapp-e2e

**Service purpose:** Generate and verify short-lived OTP codes. Critical to notification and identity flows.

**Proposed feature file:** `apps/tenant-management-webapp-e2e/src/integration/verify-service.feature`

| Scenario | Priority | Tags | Notes |
|---|---|---|---|
| Admin can generate a verification code for a key | P1 | `@regression @api` | POST /verify/v1/codes/:key (no body) |
| Admin can verify a correct code | P1 | `@regression @api` | POST with matching code |
| Submitting wrong code returns verified: false | P1 | `@regression @api` | Security assertion |
| Expired code returns verified: false | P2 | `@regression @api` | Requires expiry wait; use short TTL |
| Unauthenticated request returns 401 | P1 | `@regression @api` | Auth gate |

**Auth requirements:** `verify-service:generator` and `verify-service:verifier` roles in autotest tenant. `cy.request` with `Authorization: Bearer ${Cypress.env('autotest-admin-token')}`.

**Setup/cleanup:** Keys are namespaced (`/codes/:key`); use unique random keys per test run to avoid collisions. No cleanup needed since codes expire automatically.

#### 4.3 pii-service API scenarios — Add to tenant-management-webapp-e2e

**Service purpose:** Python/Presidio PII detection with Alberta-specific recognizers (CA SIN, passport, postal code, bank account).

**Proposed feature file:** `apps/tenant-management-webapp-e2e/src/integration/pii-service.feature`

| Scenario | Priority | Tags | Notes |
|---|---|---|---|
| Can list supported PII entity types | P1 | `@regression @api` | GET /pii/v1/entities |
| Can detect an email in text | P1 | `@regression @api` | POST /pii/v1/analyze |
| Can detect a Canadian postal code | P1 | `@regression @api` | CA_POSTAL_CODE recognizer |
| Can anonymize text containing a SIN | P1 | `@regression @api` | POST /pii/v1/anonymize; assert SIN replaced |
| Unauthenticated request returns 401/403 | P1 | `@regression @api` | Auth gate |

**Auth requirements:** `pii-service:analyzer` role in autotest tenant or core realm service account.

**Note:** pii-service runs Python/Flask and is at a different base URL than Node services. Verify URL via directory-service (`urn:ads:platform:pii-service`).

#### 4.4 token-handler API scenarios

**Service purpose:** BFF token handler pattern — sessions, OIDC proxy, target proxy for frontend apps.

| Scenario | Priority | Tags | Notes |
|---|---|---|---|
| Admin can list registered token-handler clients | P1 | `@regression @api` | GET /token-handler/v1/clients |
| Initiating auth redirects to Keycloak | P1 | `@regression @api` | GET /clients/:id/auth → 302 to Keycloak domain |
| Unauthenticated target proxy returns 401 | P1 | `@regression @api` | No session cookie → 401 |
| Admin can list active sessions | P2 | `@regression @api` | GET /token-handler/v1/sessions |

---

### Priority 2 (Valuable, implement after Priority 1)

#### 4.5 api-docs-app — API-level health + content checks

| Scenario | Priority | Tags | Notes |
|---|---|---|---|
| Root URL returns swagger-ui HTML | P2 | `@regression @api` | GET / → 200 with swagger content |
| Platform docs list includes known services | P2 | `@regression @api` | GET /swagger-ui-init.js |
| Tenant-scoped init.js includes tenant namespace | P2 | `@regression @api` | GET /:tenantName/swagger-ui-init.js |
| Service spec endpoint returns valid OpenAPI JSON | P2 | `@regression @api` | GET /docs/platform/:service |

**Note:** api-docs-app is a backend server; all tests via `cy.request()`.

#### 4.6 dashboard-metrics — API health check

| Scenario | Priority | Tags | Notes |
|---|---|---|---|
| Metrics endpoint returns valid JSON structure | P2 | `@regression @api` | GET /metrics/v1/metrics/:interval |

#### 4.7 export-service — API happy path

| Scenario | Priority | Tags | Notes |
|---|---|---|---|
| Can create and poll an export job | P2 | `@regression @api` | POST /export/v1/jobs + GET poll |
| Completed job has a result file URN | P2 | `@regression @api` | Status: completed with result.urn |

---

### Priority 3 (Lower value — adequate coverage elsewhere or complexity too high)

#### 4.8 builder-app — Minimal smoke tests only

The builder-app depends on a live LLM (Claude) via agent-service, file-service, and token-handler. Deep interaction tests are not feasible in automated E2E. Recommend:
- 1 smoke test: landing page renders (no auth)
- 1 smoke test: auth redirect initiates correctly

**Coverage rationale:** The builder-app's core value (AI code generation) is better validated by integration tests with LLM mock.

#### 4.9 sandbox-app-e2e — Remove from inventory or populate

The sandbox-app is a playground/experimentation environment. If it has real functionality, populate `sandbox-app-e2e`. If it remains a boilerplate, document it as intentionally not tested.

Current status: The stub test `getGreeting().contains(/Welcome/)` references a `Welcome` element that exists in the Nx-generated template. This app likely has no real production workflows.

**Recommendation:** Keep as-is; document the intentional exclusion.

---

## 5. Services Adequately Covered — No Dedicated E2E Project Needed

These services are exercised via `tenant-management-webapp-e2e` and/or dedicated app-level suites. Creating dedicated API-level E2E projects would duplicate coverage already at the unit/integration layer.

| Service | Covered by | Active scenarios |
|---|---|---|
| `cache-service` | `cache.feature` | 1 |
| `calendar-service` | `calendar.feature` | 5 |
| `comment-service` | `comment.feature` | 4 |
| `configuration-service` | `configuration-service.feature` | 4 |
| `directory-service` | `directory-service.feature` | 7 (inc. 3 @api) |
| `event-service` | `events.feature` | 11 |
| `feedback-service` | `feedback.feature` | 5 |
| `file-service` | `file-service.feature` | 12 (inc. 6 @api) |
| `form-gateway` | `form-app-e2e` (anonymous submission) | Indirect |
| `form-service` | `form.feature` + `form-app-e2e` | 8 + 10 |
| `notification-service` | `notifications.feature` | 10 (10 @ignore pending fix) |
| `pdf-service` | `pdf-service.feature` | 3 |
| `script-service` | `script.feature` | 2 |
| `status-service` | `service-status.feature` + `status-app-e2e` | 10 + 4 |
| `task-service` | `task.feature` + `task-app-e2e` | 2 + 4 |
| `tenant-management-api` | `tenant-management-api.feature` | 1 |
| `value-service` | `value.feature` | 10 |
| `sharepoint-service` | N/A | Stub only; awaiting implementation |

---

## 6. Services Where E2E Is Not Appropriate

| Service | Reason |
|---|---|
| `agent-service` | Requires live LLM (Claude/OpenAI); real-time Socket.IO streaming; behavior is non-deterministic. Unit tests cover logic; integration tests with mocked LLM cover service contract. |
| `push-service` | WebSocket/Socket.IO delivery is not Cypress-testable. `GET /streams` (list available streams) is the only practical E2E target; worth a single `@api @regression` scenario. |
| `sharepoint-service` | Stub — all endpoints return `{message:'OK'}` with no real implementation. |
| `subscriber-gateway` | Thin proxy layer. Exercised fully by `subscriber-app-e2e`. |
| `tenant-management-gateway` | Thin API gateway. Exercised by `tenant-management-webapp-e2e`. |

---

## 7. Execution Status — THIS SESSION

> **IMPORTANT:** Tests have NOT been executed in this session. The staging environment (`adsp-uat.alberta.ca`) requires GitHub Actions secrets (`CY_CLIENT_SECRET`, `CY_PASSWORD`, etc.) that are not available in the local development environment. All test code was implemented but execution validation requires a CI run or a developer with the staging credentials.

### Validation blockers
1. **No staging credentials locally** — `CY_PASSWORD`, `CY_CLIENT_SECRET`, `CY_CORE_API_CLIENT_SECRET` are GitHub Actions secrets
2. **No running ADSP staging instance** — tests require a live staging environment
3. **Test data dependency** — some scenarios assume pre-existing data in the autotest tenant (form definitions, task queues)

### What was verified
- [x] All new files parse correctly (TypeScript/JavaScript syntax)
- [x] Selector patterns follow established conventions from reference suites
- [x] Feature file Gherkin steps are correctly matched to step definitions
- [x] Config files follow exact structure of existing environment configs
- [x] nightly.yml updated to include `task-app` in matrix

### What requires CI execution to verify
- [ ] form-admin-app-e2e new @regression scenarios pass in staging
- [ ] task-app-e2e new scenarios pass in staging
- [ ] No selector drift from React component changes since last inspection

---

## 8. Files Changed This Session

| File | Change type | Notes |
|---|---|---|
| `apps/form-admin-app-e2e/src/integration/form-admin.feature` | Modified | Added `@regression` to existing scenario + 4 new scenarios |
| `apps/form-admin-app-e2e/src/integration/form-admin/form-admin.page.ts` | Modified | Added selectors for definitions table, definition heading, responses |
| `apps/form-admin-app-e2e/src/integration/form-admin/form-admin.step.ts` | Modified | Added step implementations for new scenarios |
| `apps/task-app-e2e/cypress.staging.config.js` | Created | Full staging config with Cucumber setup |
| `apps/task-app-e2e/cypress.dev.config.js` | Created | Dev config |
| `apps/task-app-e2e/cypress.prod.config.js` | Created | Prod config |
| `apps/task-app-e2e/.cypress-cucumber-preprocessorrc.js` | Created | Cucumber preprocessor config |
| `apps/task-app-e2e/src/plugins/index.js` | Modified | Added Cucumber preprocessor (replaced stub) |
| `apps/task-app-e2e/src/support/index.ts` | Modified | Added @cypress/xpath, cypress-axe imports |
| `apps/task-app-e2e/src/support/commands.ts` | Modified | Cleaned up stub |
| `apps/task-app-e2e/src/support/app.po.ts` | Modified | Added injectAxe helper |
| `apps/task-app-e2e/src/support/axe-html-reporter-util.ts` | Created | Axe HTML report helper |
| `apps/task-app-e2e/src/integration/task-app.feature` | Created | 5 scenarios |
| `apps/task-app-e2e/src/integration/task-app/task-app.page.ts` | Created | Page object |
| `apps/task-app-e2e/src/integration/task-app/task-app.step.ts` | Created | Step definitions |
| `.github/workflows/nightly.yml` | Modified | Added `task-app` to matrix |
| `E2E_REGRESSION_ANALYSIS.md` | Created | Full analysis (previous session) |
| `E2E_COVERAGE_GAP_ANALYSIS.md` | Created | This document |

---

## 9. Updated Nightly Build Statistics (After This Session)

| Suite | Before | After |
|---|---|---|
| `form-admin-app-e2e` | 0 active | **~3 active** (1 @smoke+regression, 2 @regression, 1 @ignore) |
| `form-app-e2e` | 10 active | 10 active (unchanged) |
| `status-app-e2e` | 4 active | 4 active (unchanged) |
| `subscriber-app-e2e` | 4 active | 4 active (unchanged) |
| `task-app-e2e` | 0 (not in nightly) | **~4 active** (added to nightly) |
| `tenant-management-webapp-e2e` | 114 active | 114 active (unchanged) |
| `sandbox-app-e2e` | 0 | 0 |
| **TOTAL** | **132** | **~139** |

Note: Actual counts subject to CI execution confirming tests pass. The `@ignore` scenarios do not run.
