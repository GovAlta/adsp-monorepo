# E2E Test Coverage Analysis - ADSP Monorepo

**Generated:** 2026-06-25

## Executive Summary

- **Total E2E Test Projects:** 5 projects with BDD/Gherkin tests
- **Total .feature Files:** 22 files
- **Total Test Scenarios:** 157 scenarios
- **E2E App Coverage:** 4 standalone apps tested
- **Service Coverage via Admin Portal:** 15+ services tested
- **Notable Gap:** task-app-e2e has no Gherkin tests (TypeScript-based instead)

---

## 1. E2E Test Projects & Feature File Breakdown

| Project                          | Features | Files  | Scenarios | Main Coverage                               |
| -------------------------------- | -------- | ------ | --------- | ------------------------------------------- |
| **form-admin-app-e2e**           | 1        | 1      | ~2        | Form admin authentication & overview        |
| **form-app-e2e**                 | 1        | 1      | ~17       | Form submission, validation, intake periods |
| **status-app-e2e**               | 1        | 1      | ~6        | Public status page, notices, timezone       |
| **subscriber-app-e2e**           | 1        | 1      | ~8        | Subscription management, contact info       |
| **tenant-management-webapp-e2e** | 18       | 18     | **~124**  | Admin portal for 15+ services               |
| **task-app-e2e**                 | 0        | 0      | N/A       | ⚠️ Uses .spec.ts (Cypress, no Gherkin)      |
| **TOTAL**                        | **22**   | **22** | **~157**  |                                             |

---

## 2. Tenant Management Webapp E2E Feature Files (18 files)

This project provides comprehensive admin portal testing:

| Feature File                  | Service/Module        | Scenarios | Tags Found                                           |
| ----------------------------- | --------------------- | --------- | ---------------------------------------------------- |
| calendar.feature              | Calendar service      | 7         | @regression, @prod, @accessibility                   |
| cache.feature                 | Cache service         | 2         | @regression, @prod                                   |
| comment.feature               | Comment service       | 6         | @regression, @prod, @accessibility                   |
| configuration-service.feature | Configuration service | 7         | @regression, @ignore, @accessibility                 |
| directory-service.feature     | Directory service     | 8         | @regression, @prod, @accessibility                   |
| events.feature                | Event service         | 12        | @regression, @prod, @accessibility                   |
| feedback.feature              | Feedback service      | 6         | @regression, @prod                                   |
| file-service.feature          | File service          | 13        | @regression, @prod, @accessibility, @FileTypes       |
| form.feature                  | Form service          | 16        | @regression, @prod, @accessibility, @ignore          |
| notifications.feature         | Notification service  | 24        | @regression, @prod, @accessibility, @ignore          |
| pdf-service.feature           | PDF service           | 4         | @regression, @prod, @accessibility                   |
| script.feature                | Script service        | 3         | @regression, @accessibility                          |
| service-status.feature        | Status service        | 18        | @regression, @prod, @accessibility, @ignore          |
| task.feature                  | Task service          | 3         | @regression, @accessibility                          |
| tenant-admin.feature          | Tenant admin portal   | 18        | @smoke-test, @regression, @accessibility, @dashboard |
| tenant-management-api.feature | Platform API          | 1         | (health check)                                       |
| value.feature                 | Value service         | 4         | @regression                                          |
| welcome-page.feature          | Welcome/onboarding    | 8         | @smoke-test, @regression, @accessibility, @ignore    |

---

## 3. Test Tag Breakdown (BDD/Gherkin Tests)

### By Test Type:

- **@smoke-test:** ~4 scenarios (entry-point validation)
- **@regression:** ~140 scenarios (main test suite)
- **@accessibility:** ~20+ scenarios (a11y compliance)
- **@prod:** ~30+ scenarios (production-ready)
- **@ignore:** ~15+ scenarios (blocked/pending tests)
- **@api:** ~5 scenarios (direct API testing)
- **@dashboard:** ~2 scenarios (dashboard-specific)
- **@FileTypes:** ~4 scenarios (file handling)

### Tag Usage Pattern:

Most scenarios include:

1. **TEST_CS-XXXX** or **REQ_CS-XXXX** (traceability to Jira)
2. **@regression** (default test type)
3. Optional: **@prod**, **@accessibility**, **@ignore**
4. Optional: **@smoke-test** (critical path)

---

## 4. Services WITH E2E Test Coverage

### Direct App Tests (via standalone e2e projects):

- ✅ **form-app** (form-app-e2e) — Form submission, intake periods, validation
- ✅ **form-admin-app** (form-admin-app-e2e) — Admin authentication & dashboard
- ✅ **status-app** (status-app-e2e) — Public status pages, notices
- ✅ **subscriber-app** (subscriber-app-e2e) — Subscription management

### Admin Portal Coverage (via tenant-management-webapp-e2e):

- ✅ calendar-service — Calendar management, events, core calendars
- ✅ cache-service — Cache target management
- ✅ comment-service — Topic types, comments, core topics
- ✅ configuration-service — Configuration definitions, revisions, imports/exports
- ✅ directory-service — Service discovery, directory entries, resource types
- ✅ event-service — Event definitions, event streams, subscriptions
- ✅ feedback-service — Site feedback, feedback management, admin views
- ✅ file-service — File type management, uploads, core file types
- ✅ form-service — Form definitions, tags, lifecycle, submission records
- ✅ notification-service — Notification types, templates, subscriptions
- ✅ pdf-service — PDF template management, rendering
- ✅ script-service — Script management
- ✅ status-service — Application management, notices, health checks
- ✅ task-service — Task queue management
- ✅ value-service — Value definitions

### Integration Tests (in tests/ directory):

- ✅ configuration-service (load test)
- ✅ events-service (integration)
- ✅ feedback-service (load test)
- ✅ file-service (integration)
- ✅ form-app (integration)
- ✅ form-service (load test)
- ✅ pdf-service (load test)
- ✅ status-service (integration)

---

## 5. Services WITHOUT E2E Test Coverage (Coverage Gaps)

### Backend Services Missing E2E Tests:

- ❌ agent-service
- ❌ api-docs-app
- ❌ builder-app
- ❌ export-service
- ❌ notification-service _(only admin tests, no user-facing tests)_
- ❌ pii-service
- ❌ push-service (WebSocket gateway)
- ❌ secret-service
- ❌ sharepoint-service
- ❌ token-handler
- ❌ verify-service

### Apps/Gateways Missing E2E Tests:

- ❌ dashboard-metrics
- ❌ form-gateway
- ❌ form-management-app
- ❌ tenant-management-api _(only health check test)_
- ❌ tenant-management-gateway
- ❌ **task-app-e2e** ⚠️ _(has no .feature files; uses TypeScript .spec.ts only)_

---

## 6. Integration Tests Summary

### Load/Performance Tests (Artillery):

Located in `tests/` directory, these are not BDD-format but test APIs at scale:

- `tests/pdf-service/load.yml` — PDF job creation performance
- `tests/form-service/load.yml` — Form lifecycle (create → update → submit → delete)
- `tests/feedback-service/load.yml` — Feedback submission performance

### Integration Tests:

- `tests/configuration-service/` — Configuration API integration
- `tests/events-service/` — Event routing integration
- `tests/file-service/` — File API integration
- `tests/form-app/` — Form app integration
- `tests/status-service/` — Status service integration

**Note:** These tests are **not BDD/Gherkin format** but focus on API performance, data flows, and backend integration.

---

## 7. Overall Test Coverage Assessment

### Coverage Summary:

| Category                   | Count | Percentage               |
| -------------------------- | ----- | ------------------------ |
| **Total Backend Services** | ~30   | ~15 covered by E2E       |
| **Total Frontend Apps**    | ~7    | ~5 covered by E2E        |
| **Core Services Covered**  | 15+   | 100% (tenant-mgmt tests) |
| **E2E Test Files**         | 22    | 100% are Gherkin/BDD     |
| **E2E Scenarios**          | 157   | ~12 per service avg      |

### Strengths:

✅ **Comprehensive admin portal testing** — All core services have test scenarios in tenant-management-webapp-e2e
✅ **Multi-tag strategy** — Tests use @smoke-test, @regression, @accessibility, @prod, @ignore for categorization
✅ **Traceability** — All scenarios linked to Jira TEST_CS / REQ_CS tickets
✅ **Accessibility testing** — ~20+ dedicated a11y tests across services
✅ **Production-readiness** — @prod tag identifies tests for prod environments
✅ **User-centric testing** — Form app, status app, subscriber app test real user journeys

### Gaps & Risks:

⚠️ **Limited direct service testing** — Most service tests go through admin portal, not direct APIs
⚠️ **Push service untested** — WebSocket gateway (push-service) has no E2E tests
⚠️ **Backend-only services** — export-service, pii-service, secret-service, sharepoint-service, verify-service have no E2E tests
⚠️ **task-app-e2e uses TypeScript** — Not following BDD convention; can't run with feature-based CI/CD pipelines
⚠️ **15+ ignored tests** — @ignore tag indicates tests blocked by known issues (CS-2949, CS-4519, etc.)
⚠️ **Limited API-level testing** — Most tests are UI-level; backend API contracts not fully tested
⚠️ **Token/Auth handling** — No dedicated E2E tests for Keycloak/OIDC edge cases

---

## 8. Key Observations

### 1. Monorepo-wide E2E Strategy:

- Heavy reliance on tenant-management-webapp-e2e for service testing
- Admin portal acts as integration point for nearly all services
- Individual app e2e projects focus on user workflows (forms, status, subscriptions)

### 2. Test Maintenance Burden:

- 157 scenarios across 22 files requires significant maintenance
- @ignore tag shows known failures preventing test execution
- Strongly recommend resolving blocked issues to enable full test suite

### 3. Integration vs E2E:

- Integration tests (tests/ folder) focus on load/performance, not functionality
- E2E tests (e2e projects) focus on UI workflows, not API contracts
- Gap: No dedicated service-to-service integration tests

### 4. Accessibility Testing:

- Dedicated @accessibility tests exist across multiple services
- Some marked as @ignore due to component-level issues (not test issues)
- Suggests proactive accessibility compliance efforts

---

## 9. Recommendations for Improvement

| Priority   | Item                                    | Current            | Target                                           |
| ---------- | --------------------------------------- | ------------------ | ------------------------------------------------ |
| **High**   | Enable all @ignore tests                | 15+ blocked        | 0 blocked                                        |
| **High**   | Add push-service E2E tests              | 0                  | 3-5 tests                                        |
| **Medium** | Convert task-app-e2e to Gherkin         | TypeScript only    | 5-10 .feature files                              |
| **Medium** | Add direct API E2E tests                | ~5 tests           | 20+ tests                                        |
| **Low**    | Add integration tests for edge services | Minimal            | Expand to cover export-service, pii-service, etc |
| **Low**    | Document test data requirements         | Scattered comments | Centralized README                               |

---

## 10. Test Execution Commands

### Run all e2e tests:

```bash
npx nx e2e --all
```

### Run specific project e2e tests:

```bash
npx nx e2e tenant-management-webapp-e2e
npx nx e2e form-app-e2e
npx nx e2e status-app-e2e
npx nx e2e subscriber-app-e2e
npx nx e2e form-admin-app-e2e
npx nx e2e task-app-e2e
```

### Run with tags (Gherkin projects):

```bash
npx nx e2e tenant-management-webapp-e2e --env.'TAGS'='@smoke-test'
npx nx e2e tenant-management-webapp-e2e --env.'TAGS'='@regression'
npx nx e2e tenant-management-webapp-e2e --env.'TAGS'='@accessibility'
npx nx e2e tenant-management-webapp-e2e --env.'TAGS'='@prod'
```

### Cypress interactive mode:

```bash
npx nx e2e tenant-management-webapp-e2e --watch
```

---

## Conclusion

The ADSP monorepo demonstrates a **well-organized E2E testing infrastructure** with strong coverage of core services through the admin portal. The BDD/Gherkin approach enables good maintainability and traceability.

**Key Strengths:**

- 157 comprehensive scenarios across 22 feature files
- All core services covered via tenant-management-webapp-e2e
- Strong accessibility and production-readiness testing
- Good Jira traceability for all test scenarios

**Priority Actions:**

1. Resolve @ignore tagged tests to enable full CI/CD coverage
2. Add E2E tests for push-service (WebSocket functionality)
3. Convert task-app-e2e to BDD/Gherkin format for consistency
4. Expand direct API-level E2E tests beyond UI workflows

---

_For detailed analysis or updates to this report, please contact the QA or DevOps team._
