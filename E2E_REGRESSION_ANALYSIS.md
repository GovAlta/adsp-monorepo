# ADSP Monorepo — E2E Regression Test Suite Analysis

> Generated: 2026-10-15  
> Scope: `adsp-monorepo/apps/*-e2e`  
> Project root: `C:\code\harness_govalta_emu\adsp-monorepo`

---

## Table of Contents

1. [E2E Suite Inventory](#1-e2e-suite-inventory)
2. [Nightly Build Configuration](#2-nightly-build-configuration)
3. [Tests Actually Run in Nightly Builds](#3-tests-actually-run-in-nightly-builds)
4. [tenant-management-webapp-e2e Detailed Breakdown](#4-tenant-management-webapp-e2e-detailed-breakdown)
5. [Services Without E2E Coverage](#5-services-without-e2e-coverage)
6. [Tag Analytics](#6-tag-analytics)
7. [Key Observations and Risks](#7-key-observations-and-risks)

---

## 1. E2E Suite Inventory

There are **7 e2e projects** under `apps/*-e2e`:

| Suite | Framework | Feature Files | Total Scenarios* | Status |
|---|---|---|---|---|
| `form-admin-app-e2e` | Cypress + Cucumber/BDD | 1 | 1 | Active (minimal) |
| `form-app-e2e` | Cypress + Cucumber/BDD | 1 | 17 | Active |
| `sandbox-app-e2e` | Cypress (plain) | — | 1 | Stub / placeholder |
| `status-app-e2e` | Cypress + Cucumber/BDD | 1 | 5 | Active |
| `subscriber-app-e2e` | Cypress + Cucumber/BDD | 1 | 7 | Active |
| `task-app-e2e` | Cypress (plain) | — | 1 | Stub / placeholder |
| `tenant-management-webapp-e2e` | Cypress + Cucumber/BDD | 18 | 153† | Active (dominant) |

\* Scenario Outlines expanded by their example row count (each row = one test execution).  
† 153 expanded test executions across 143 scenario blocks in 18 feature files.

### Framework differences

- **Cucumber/BDD suites** use `.feature` files with Gherkin (Given/When/Then), page objects (`*.page.ts`) and step definitions (`*.step.ts`). They support tag-based filtering (`@regression`, `@ignore`, etc.).
- **Plain Cypress suites** (`sandbox-app-e2e`, `task-app-e2e`) use standard `*.cy.ts` / `*.spec.ts` files with no Cucumber layer. Both contain only a single boilerplate `getGreeting()` placeholder test — they were scaffolded from the default Nx Cypress template and never populated with real tests.

---

## 2. Nightly Build Configuration

### CI system

- **Platform:** GitHub Actions
- **Nightly workflow:** `.github/workflows/nightly.yml`
- **Schedule:** Daily at **08:15 UTC**
- **On-demand workflow:** `.github/workflows/e2e.yml` — `workflow_dispatch` trigger accepting `APP`, `ENVIRONMENT`, and `TAGS` inputs for manual runs

### Nightly matrix — 5 of 7 suites

```
tenant-management-webapp   ✅  in nightly
form-app                   ✅  in nightly
status-app                 ✅  in nightly
subscriber-app             ✅  in nightly
form-admin-app             ✅  in nightly  ⚠️  but 0 regression tests (see §7)
sandbox-app                ❌  excluded
task-app                   ❌  excluded
```

`sandbox-app-e2e` and `task-app-e2e` have no environment-specific config files and were excluded from CI intentionally — they are not production-ready.

### Environment and tag filter

| Setting | Value |
|---|---|
| Environment | `Staging-e2e` → `adsp-uat.alberta.ca` |
| Tag filter | `@regression AND NOT @ignore` |
| Config override | `--cypress-config=apps/$app-e2e/cypress.staging.config.js` |
| Retries | `form-admin-app-e2e`: 2 · `tenant-management-webapp-e2e`: 1 |

### Multi-environment config files

Every active Cucumber suite ships three environment-specific Cypress config files:

| Suite | dev | staging | prod | test |
|---|---|---|---|---|
| `form-admin-app-e2e` | ✅ | ✅ | ✅ | — |
| `form-app-e2e` | ✅ | ✅ | ✅ | — |
| `status-app-e2e` | ✅ | ✅ | ✅ | ✅ |
| `subscriber-app-e2e` | ✅ | ✅ | ✅ | — |
| `tenant-management-webapp-e2e` | ✅ | ✅ | ✅ | — |
| `sandbox-app-e2e` | — | — | — | — |
| `task-app-e2e` | — | — | — | — |

`status-app-e2e` is the only suite with a fourth `cypress.test.config.js` environment.

---

## 3. Tests Actually Run in Nightly Builds

Applying the `@regression AND NOT @ignore` filter across all 5 nightly suites:

| Suite | Total scenarios | @regression | @ignore | **Run in nightly** |
|---|---|---|---|---|
| `form-admin-app-e2e` | 1 | **0** (only @smoke-test) | 0 | **0** ⚠️ |
| `form-app-e2e` | 17 | 16 | 6 | **10** |
| `status-app-e2e` | 5 | 5 | 1 | **4** |
| `subscriber-app-e2e` | 7 | 6 | 2 | **4** |
| `tenant-management-webapp-e2e` | 153 | 152 | 38 | **114** |
| `sandbox-app-e2e` | 1 | 0 | 0 | 0 (not in nightly) |
| `task-app-e2e` | 1 | 0 | 0 | 0 (not in nightly) |
| **TOTAL** | **185** | **181** | **47** | **132** |

### Per-suite nightly test detail

#### form-admin-app-e2e — 0 tests run

| Scenario | Tags | Runs? |
|---|---|---|
| As a form admin user, I can log in to form admin app and view the form admin page | `@smoke-test` | ❌ (no @regression) |

#### form-app-e2e — 10 tests run

| Scenario | Tags | Runs? |
|---|---|---|
| I can submit an application (overview) | `@smoke-test` | ❌ |
| Form app overview page has no accessibility issues | `@accessibility @regression` | ✅ |
| I can log in to submit an application | `@regression @prod` | ✅ |
| I can view and submit an anonymous application | `@regression` | ✅ |
| I can see validation errors on missing required fields | `@regression @prod` | ✅ |
| I can apply during an open intake period | `@regression` | ✅ |
| I cannot apply outside open intake period(s) | `@regression` | ✅ |
| I cannot apply outside an open intake period (submitted) | `@regression` | ✅ |
| I can access forms not yet opened (form-tester role) | `@regression` | ✅ |
| I can navigate task list pages and submit | `@regression @ignore` | ❌ |
| Relevant field is focused when I select change from review page | `@regression` | ✅ |
| I can see validation errors on different rules | `@regression @ignore` | ❌ |
| I can use basic controls in a form | `@regression @ignore` | ❌ |
| I can use basic controls (standard controls) | `@regression @ignore` | ❌ |
| I can use a rule to dynamically change the form | `@regression @ignore` | ❌ |
| I can use object lists in a form | `@regression @ignore` | ❌ |
| I can submit a form with conditional required fields | `@regression` | ✅ |

#### status-app-e2e — 4 tests run

| Scenario | Tags | Runs? |
|---|---|---|
| I can see service status information for "Platform" | `@smoke-test @regression` | ✅ |
| I can see Platform service status information (header/version) | `@regression` | ✅ |
| Public service status page has no accessibility issues | `@accessibility @regression @ignore` | ❌ |
| I can see the time zone information on status app | `@regression` | ✅ |
| I can see application notices | `@regression` | ✅ |

#### subscriber-app-e2e — 4 tests run

| Scenario | Tags | Runs? |
|---|---|---|
| I can see an overview page for subscription management | `@smoke-test` | ❌ |
| Subscription management page has no accessibility issues | `@accessibility @regression @ignore` | ❌ |
| Authenticated subscription management page has no accessibility issues | `@accessibility @regression @ignore` | ❌ |
| I can login to see non-self-serve subscriptions | `@regression` | ✅ |
| I can configure what channels are supported by a notification type | `@regression` | ✅ |
| I can see the supported channels of a notification type | `@regression` | ✅ |
| I can login to the subscription app using the tenant name | `@regression` | ✅ |

---

## 4. tenant-management-webapp-e2e Detailed Breakdown

This single suite covers **18 backend services** through the tenant admin UI and accounts for **86% of all nightly test executions**.

### Summary table (18 feature files)

| Feature file | Scenario blocks | Expanded instances | @regression | @ignore | **Nightly** | @prod |
|---|---|---|---|---|---|---|
| `cache.feature` | 2 | 2 | 1* | 0 | **1** | 1* |
| `calendar.feature` | 6 | 6 | 6 | 1 | **5** | 2 |
| `comment.feature` | 5 | 5 | 5 | 1 | **4** | 1 |
| `configuration-service.feature` | 8 | 8 | 8 | 4 | **4** | 0 |
| `directory-service.feature` | 8 | 8 | 8 | 1 | **7** | 3 |
| `events.feature` | 11 | 12† | 12 | 1 | **11** | 3 |
| `feedback.feature` | 5 | 5 | 5 | 0 | **5** | 3 |
| `file-service.feature` | 14 | 14 | 14 | 2 | **12** | 2 |
| `form.feature` | 12 | 12 | 12 | 4 | **8** | 0 |
| `notifications.feature` | 21 | 21 | 21 | 10 | **10** | 3 |
| `pdf-service.feature` | 4 | 4 | 4 | 1 | **3** | 2 |
| `script.feature` | 3 | 3 | 3 | 1 | **2** | 0 |
| `service-status.feature` | 14 | 14 | 14 | 4 | **10** | 4 |
| `task.feature` | 3 | 3 | 3 | 1 | **2** | 0 |
| `tenant-admin.feature` | 14 | 17‡ | 17 | 4 | **13** | 1 |
| `tenant-management-api.feature` | 1 | 1 | 1 | 0 | **1** | 0 |
| `value.feature` | 4 | 10§ | 10 | 0 | **10** | 1 |
| `welcome-page.feature` | 8 | 9¶ | 9 | 3 | **6** | 0 |
| **TOTAL** | **143** | **153** | **152** | **38** | **114** | **26** |

\* `cache.feature` scenario 2 has `@prod` but **not** `@regression` — it only runs in prod, not nightly.  
† `events.feature` has a Scenario Outline with 2 example rows.  
‡ `tenant-admin.feature` has outlines: one with 3 rows + one with 2 rows (@ignore).  
§ `value.feature` has a Scenario Outline with 7 example rows.  
¶ `welcome-page.feature` has a Scenario Outline with 2 example rows.

### Feature-by-feature scenario listing

<details>
<summary><strong>cache.feature</strong> (2 scenarios, 1 nightly)</summary>

| Scenario | Tags | Nightly |
|---|---|---|
| See the cache service overview in tenant admin view | `@regression @prod` | ✅ |
| Add, edit and delete a cache target | `@prod` | ❌ (no @regression) |

</details>

<details>
<summary><strong>calendar.feature</strong> (6 scenarios, 5 nightly)</summary>

| Scenario | Tags | Nightly |
|---|---|---|
| See the calendar service overview | `@regression` | ✅ |
| Use calendar pages without accessibility issues | `@accessibility @regression` | ✅ |
| Add, edit and delete calendars | `@regression @prod` | ✅ |
| Add, edit and delete calendar-events | `@regression @prod` | ✅ |
| See core calendars | `@regression` | ✅ |
| Select a core calendar and add/edit/delete events | `@regression @ignore @obsolete` | ❌ |

</details>

<details>
<summary><strong>comment.feature</strong> (5 scenarios, 4 nightly)</summary>

| Scenario | Tags | Nightly |
|---|---|---|
| See an overview of the comment service | `@regression` | ✅ |
| Add, edit and delete a comment topic type | `@regression @prod` | ✅ |
| Use comment pages without accessibility issues | `@accessibility @regression @ignore` | ❌ |
| Add, view and delete topics and comments | `@regression` | ✅ |
| See core topic types | `@regression` | ✅ |

</details>

<details>
<summary><strong>configuration-service.feature</strong> (8 scenarios, 4 nightly)</summary>

| Scenario | Tags | Nightly |
|---|---|---|
| See Configuration service overview | `@regression` | ✅ |
| See core configuration definitions | `@regression` | ✅ |
| Add/edit/delete configuration definitions | `@regression @ignore` | ❌ |
| See descriptions of configuration in the export | `@regression` | ✅ |
| Set an 'active' alias for a configuration key | `@regression @ignore` | ❌ |
| Use configuration pages without accessibility issues | `@accessibility @regression @ignore` | ❌ |
| Create, edit, view and set configuration revision | `@regression @ignore` | ❌ |
| Validate configuration schema for form service | `@regression` | ✅ |

</details>

<details>
<summary><strong>directory-service.feature</strong> (8 scenarios, 7 nightly)</summary>

| Scenario | Tags | Nightly |
|---|---|---|
| See Directory service overview and service entries *(Outline, 1 row)* | `@regression` | ✅ |
| Add/edit/delete directory entries in a tenant namespace | `@regression @prod` | ✅ |
| Add/delete service API entries | `@regression @prod` | ✅ |
| Add directory entries from APIs via service metadata | `@regression` | ✅ |
| See event definitions for directory service | `@regression @ignore` | ❌ |
| Access the directory via its API | `@regression @api` | ✅ |
| Use directory pages without accessibility issues | `@accessibility @regression` | ✅ |
| Add/edit/delete/view configured resource types | `@regression @prod` | ✅ |

</details>

<details>
<summary><strong>events.feature</strong> (12 expanded instances, 11 nightly)</summary>

| Scenario | Tags | Nightly |
|---|---|---|
| See events overview | `@regression` | ✅ |
| See details of event definitions | `@regression` | ✅ |
| See event service API docs | `@regression` | ✅ |
| Add, edit and delete an event definition | `@regression @prod` | ✅ |
| Use event pages without accessibility issues | `@accessibility @regression` | ✅ |
| Cannot add event definitions with ":" in name/namespace *(Outline, 2 rows)* | `@regression` | ✅ × 2 |
| Cannot add/modify/delete event definitions in platform namespaces | `@regression` | ✅ |
| See health check event definitions for status service | `@regression @prod` | ✅ |
| View stream configuration for events | `@regression` | ✅ |
| Add, edit and delete an event stream | `@regression @prod @ignore` | ❌ |
| Select client roles for event stream subscriber roles | `@regression` | ✅ |

</details>

<details>
<summary><strong>feedback.feature</strong> (5 scenarios, 5 nightly)</summary>

| Scenario | Tags | Nightly |
|---|---|---|
| See feedback overview and guidance | `@regression` | ✅ |
| Add, edit and delete sites | `@regression @prod` | ✅ |
| Access and complete a feedback form | `@regression @prod` | ✅ |
| See feedback sent regarding my sites | `@regression` | ✅ |
| See all feedback in maximum expanded view | `@regression @prod` | ✅ |

</details>

<details>
<summary><strong>file-service.feature</strong> (14 scenarios, 12 nightly)</summary>

| Scenario | Tags | Nightly |
|---|---|---|
| Upload files via API *(Outline, 1 row)* | `@regression @api` | ✅ |
| Download files via API *(Outline, 1 row)* | `@regression @api` | ✅ |
| Get file metadata via API *(Outline, 1 row)* | `@regression @api` | ✅ |
| Set and disable file retention via API *(Outline, 1 row)* | `@regression @api` | ✅ |
| Test default PDF file type configuration via API *(Outline, 1 row)* | `@regression @api` | ✅ |
| Query files by last accessed time *(Outline, 1 row)* | `@regression @api` | ✅ |
| Enable and disable the file service | `@regression @ignore @obsolete` | ❌ |
| See API documentation for file service | `@regression` | ✅ |
| Add, update and remove file types | `@regression @prod` | ✅ |
| Cannot add a file type with a duplicate name | `@regression` | ✅ |
| Use file pages without accessibility issues | `@accessibility @regression @ignore` | ❌ |
| Cannot remove an in-use file type | `@regression` | ✅ |
| See core file types | `@regression @prod` | ✅ |
| Filter test files by file type | `@regression` | ✅ |

</details>

<details>
<summary><strong>form.feature</strong> (12 scenarios, 8 nightly)</summary>

| Scenario | Tags | Nightly |
|---|---|---|
| See an overview of the form service | `@regression` | ✅ |
| Find form definitions by tag | `@regression` | ✅ |
| Form creation returns bad request outside intake | `@regression` | ✅ |
| Add, edit and delete tags for a form definition | `@regression` | ✅ |
| Configure task created for form submission | `@regression @ignore` | ❌ |
| Add, edit and delete a form definition | `@regression` | ✅ |
| Use form pages without accessibility issues | `@accessibility @regression @ignore` | ❌ |
| Configure if a form type creates submission records | `@regression` | ✅ |
| Add, order, edit and delete disposition states | `@regression` | ✅ |
| Set classification on a form definition + event log | `@regression @prod @ignore` | ❌ |
| See form-applicant as default applicant role | `@regression` | ✅ |
| See the form output data in the form preview | `@regression @ignore` | ❌ |

</details>

<details>
<summary><strong>notifications.feature</strong> (21 scenarios, 10 nightly)</summary>

| Scenario | Tags | Nightly |
|---|---|---|
| Add/edit/delete Notification Types | `@regression @prod` | ✅ |
| Add and delete events of a notification type | `@regression` | ✅ |
| Registration of notification type in status service | `@regression @prod @ignore` | ❌ |
| Delete a subscription | `@regression @prod` | ✅ |
| See notification type for application status change | `@regression @ignore` | ❌ |
| Find subscriptions for a particular subscriber | `@regression` | ✅ |
| Delete a subscriber | `@regression` | ✅ |
| Configure subscription management contact info *(Outline, 1 row)* | `@regression` | ✅ |
| Modify a subscriber name and email | `@regression` | ✅ |
| Search, add, edit and delete SMS number of subscriber | `@regression` | ✅ |
| Configure what channels are supported by a notification type | `@regression @ignore` | ❌ |
| Preview the rendered notification message | `@regression @ignore` | ❌ |
| Access subscription management from email preview | `@regression @ignore` | ❌ |
| Override email template for a platform notification type | `@regression @ignore` | ❌ |
| See criteria details for a subscription | `@regression` | ✅ |
| Preview an email template as I edit | `@regression @ignore` | ❌ |
| Configure an SMS message template | `@regression @ignore` | ❌ |
| Configure a Bot message template | `@regression @ignore` | ❌ |
| Configure notification email for GoA standard format | `@regression @ignore` | ❌ |
| Use notification pages without accessibility issues | `@accessibility @regression @ignore` | ❌ |
| Configure the from email of notifications | `@regression` | ✅ |

</details>

<details>
<summary><strong>pdf-service.feature</strong> (4 scenarios, 3 nightly)</summary>

| Scenario | Tags | Nightly |
|---|---|---|
| See a PDF service overview | `@regression` | ✅ |
| Add, edit, preview and delete a PDF template | `@regression @prod` | ✅ |
| Use PDF pages without accessibility issues | `@accessibility @regression @ignore` | ❌ |
| Edit templates in header/body/CSS and generate PDF | `@regression @prod` | ✅ |

</details>

<details>
<summary><strong>script.feature</strong> (3 scenarios, 2 nightly)</summary>

| Scenario | Tags | Nightly |
|---|---|---|
| Add, edit and delete a script | `@regression` | ✅ |
| See the overview for a script service | `@regression` | ✅ |
| Use scripts page without accessibility issues | `@accessibility @regression @ignore` | ❌ |

</details>

<details>
<summary><strong>service-status.feature</strong> (14 scenarios, 10 nightly)</summary>

| Scenario | Tags | Nightly |
|---|---|---|
| Access recommendations about health check | `@regression` | ✅ |
| Add, edit and delete a notice *(Outline, 1 row)* | `@regression` | ✅ |
| Publish and un-publish a notice + event log | `@regression @ignore` | ❌ |
| Add, publish and archive a notice | `@regression` | ✅ |
| Filter notices by status | `@regression` | ✅ |
| Subscribe to health check notification type | `@regression` | ✅ |
| Add, edit, publish, unpublish, delete a tenant level notice *(Outline, 1 row)* | `@regression @prod` | ✅ |
| Add/edit/delete an application | `@regression @prod` | ✅ |
| Trigger application status change event + event log | `@regression @ignore` | ❌ |
| Verify status notifications for a tenant | `@regression @ignore` | ❌ |
| Modify tenant support email for status page | `@regression` | ✅ |
| Update the status of my service/app | `@regression @prod` | ✅ |
| Use status pages without accessibility issues | `@accessibility @regression @ignore` | ❌ |
| Set a status application to be monitoring only | `@regression @prod` | ✅ |

</details>

<details>
<summary><strong>task.feature</strong> (3 scenarios, 2 nightly)</summary>

| Scenario | Tags | Nightly |
|---|---|---|
| Add and delete a task queue | `@regression` | ✅ |
| See the overview for a task service | `@regression` | ✅ |
| Use task pages without accessibility issues | `@accessibility @regression @ignore` | ❌ |

</details>

<details>
<summary><strong>tenant-admin.feature</strong> (17 expanded instances, 13 nightly)</summary>

| Scenario | Tags | Nightly |
|---|---|---|
| Access the Tenant management webapp | `@smoke-test @regression` | ✅ |
| Access various pages *(Outline, 3 rows: File / Status / Event log)* | `@regression` | ✅ × 3 |
| Get a list of options *(Outline, 2 rows — ignored)* | `@smoke-test @api @regression @ignore` | ❌ × 2 |
| Access realm administration from Access section | `@regression` | ✅ |
| See number of existing users and roles | `@regression` | ✅ |
| See number of users in roles | `@regression` | ✅ |
| Use tenant admin pages without accessibility issues | `@accessibility @regression @ignore` | ❌ |
| See useful information on the landing page | `@dashboard @regression @prod` | ✅ |
| Non-tenant admin cannot access tenant admin | `@regression` | ✅ |
| Search the event log | `@regression @prod @ignore` | ❌ |
| See service roles registered by services | `@regression` | ✅ |
| See support and helpful info about Access service | `@regression` | ✅ |
| Tenant admin app does not support mobile view | `@regression` | ✅ |
| Access my tenant login by tenant name | `@regression` | ✅ |

</details>

<details>
<summary><strong>tenant-management-api.feature</strong> (1 scenario, 1 nightly)</summary>

| Scenario | Tags | Nightly |
|---|---|---|
| Tenant Management App Health Check | `@smoke-test @regression @api` | ✅ |

</details>

<details>
<summary><strong>value.feature</strong> (10 expanded instances, 10 nightly)</summary>

| Scenario | Tags | Nightly |
|---|---|---|
| See value overview | `@regression` | ✅ |
| Add, edit and delete value definitions | `@regression` | ✅ |
| See core value definitions | `@regression @prod` | ✅ |
| Get events with different intervals *(Outline, 7 rows)* | `@regression` | ✅ × 7 |

</details>

<details>
<summary><strong>welcome-page.feature</strong> (9 expanded instances, 6 nightly)</summary>

| Scenario | Tags | Nightly |
|---|---|---|
| See the welcome page | `@smoke-test @regression` | ✅ |
| Log in to tenant management web app *(Outline, 2 rows)* | `@regression` | ✅ × 2 |
| User with existing tenant cannot create another | `@regression @tenant-signup` | ✅ |
| Cannot create tenant with special chars or duplicate name | `@regression` | ✅ |
| User without tenant can create a new tenant | `@regression @tenant-signup @ignore` | ❌ |
| Welcome page has no accessibility issues | `@accessibility @regression @ignore` | ❌ |
| Non-beta-tester user cannot create a new tenant | `@regression` | ✅ |
| See examples on the tenant admin landing page | `@regression @ignore` | ❌ |

</details>

---

## 5. Services Without E2E Coverage

### Completely uncovered — no dedicated project AND no coverage via any suite (14 services)

| Service / App | Notes |
|---|---|
| `agent-service` | AI agent orchestration — zero coverage |
| `api-docs-app` | API documentation frontend — zero coverage |
| `audit-service` | No tests |
| `builder-app` | UI builder application — no tests |
| `dashboard-metrics` | No tests |
| `export-service` | No tests |
| `form-management-app` | A frontend app with no e2e project |
| `pii-service` | PII handling service — **no tests ⚠️** |
| `push-service` | WebSocket gateway for real-time events — **no tests ⚠️** |
| `sharepoint-service` | Only mentioned in a dashboard nav link test |
| `subscriber-gateway` | Gateway layer — no tests |
| `tenant-management-gateway` | Gateway layer — no tests |
| `token-handler` | No tests |
| `verify-service` | Identity verification — **no tests ⚠️** |

### Stub-only e2e projects (exist but not production-ready)

| Suite | Issue |
|---|---|
| `sandbox-app-e2e` | Contains only the default Nx Cypress template placeholder: `getGreeting().contains(/Welcome/)`. No real tests written. |
| `task-app-e2e` | Same boilerplate: `getGreeting().contains('Welcome task-app')`. task-app has a full React UI with zero automated coverage. |

### Covered only via `tenant-management-webapp-e2e` (no dedicated project)

These services have no dedicated e2e project but are exercised through the tenant admin web app:

`cache-service` · `calendar-service` · `comment-service` · `configuration-service` · `directory-service` · `event-service` · `feedback-service` · `file-service` · `form-service` · `notification-service` · `pdf-service` · `script-service` · `status-service` · `task-service` · `tenant-management-api` · `value-service`

---

## 6. Tag Analytics

### Across all 7 e2e suites (185 total scenario instances)

| Tag | Count | % of total |
|---|---|---|
| `@regression` | 181 | 98% |
| `@ignore` | 47 | 25% |
| **Active in nightly** (`@regression AND NOT @ignore`) | **132** | **71%** |
| `@smoke-test` | ~10 | 5% |
| `@accessibility` | ~18 | 10% |
| `@prod` | ~50 | 27% |
| `@api` | ~15 | 8% |

### @ignore breakdown by root cause

47 scenarios (25% of the suite) are disabled. All have inline comments explaining the skip reason:

| Root cause | Approx. count |
|---|---|
| Pending Jira bug blocking the test (e.g. `CS-5482`, `CS-5313`, `CS-4849`) | ~15 |
| UI redesign — test steps need rewriting (`"recent UI change to notification types page"`) | ~12 |
| GoA web component accessibility regression (copy-link icon, dropdown, callout icon) | ~8 |
| Monaco editor instability in Cypress | ~3 |
| New filter UI change on event log page (`CS-5496`) | ~4 |
| Feature removed / test obsolete (`@obsolete`) | ~3 |
| Test stability / timing issues | ~2 |

### Multi-environment tag usage

- `@regression`: runs against **Staging** in nightly
- `@prod`: available for production verification runs via `e2e.yml` dispatch (~50 scenarios)
- `@api`: API-level tests that bypass the browser UI (file service, directory, value)
- `@smoke-test`: used in 5 suites but **not part of nightly filter** — only triggered by manual dispatch or separate smoke pipeline
- `@accessibility`: 18 scenarios checking WCAG compliance — 10 are currently `@ignore` due to unresolved GoA component issues

---

## 7. Key Observations and Risks

### 1. `form-admin-app-e2e` — in the nightly matrix but runs 0 tests

The suite is configured in the nightly CI matrix, Cypress runs and initialises, but the **single scenario carries only `@smoke-test`** — not `@regression`. The `@regression AND NOT @ignore` filter excludes it entirely. Every nightly run for this suite is a no-op.

**Options:**
- Add `@regression` to the existing scenario
- Write real regression scenarios for the form admin UI
- Remove it from the nightly matrix until tests are written

### 2. 25% of all scenarios are `@ignore`

47 of 185 scenarios never execute in any automated pipeline. Most are disabled because of bugs in the product or the GoA web component library. This is a significant dark area of the regression suite that should be tracked as a backlog.

### 3. `sandbox-app-e2e` and `task-app-e2e` are unfilled stubs

Both contain the exact boilerplate generated by `nx generate @nx/cypress:configuration`. `task-app` has a full task management UI (queue management, task assignment, filtering) with zero automated coverage.

### 4. `push-service`, `verify-service`, and `pii-service` have zero coverage

Three security/identity-adjacent services — the WebSocket push gateway, the identity verification service, and the PII handling service — have no tests at any level in this suite.

### 5. `tenant-management-webapp-e2e` is the regression backbone

At 114 nightly test executions (86% of total), one suite carries almost the entire regression load. This creates concentration risk: if this suite's Cypress runner or the tenant-management-webapp itself has an issue, most of the nightly run fails. It also means that backend service regressions are only surfaced indirectly through a UI that may absorb or mask the failure.

### 6. Notifications feature has the highest @ignore rate

20 of the notifications feature's 21 scenarios carry `@regression`, but **10 of them are `@ignore`** — a 48% ignore rate. All 10 have the same root cause: a UI redesign of the notification types page that made the step definitions stale. These represent high-value subscription/template functionality that is effectively untested until the steps are updated.

### 7. `cache.feature` scenario 2 silently bypasses nightly

The second scenario in `cache.feature` has `@prod` but **no `@regression`** tag. It only runs in production environment dispatches and is invisible to nightly staging runs. This is inconsistent with every other service in the tenant-management-webapp-e2e suite.

---

*Analysis performed using the Keystone harness. Test files read directly from `adsp-monorepo/apps/*-e2e/src/`.*
