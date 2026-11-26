# Cypress E2E Test Guidelines

These guidelines describe how to write Cypress end-to-end tests in this monorepo. The reference suite is
[`apps/tenant-management-webapp-e2e`](apps/tenant-management-webapp-e2e). New suites and new scenarios should follow
the same structure and conventions so tests stay consistent, reusable and safe to re-run nightly.

## Table of Contents

- [Tooling](#tooling)
- [Folder Structure](#folder-structure)
- [Configuration and Environment Variables](#configuration-and-environment-variables)
- [Tokens and Service URLs](#tokens-and-service-urls)
- [Feature Files](#feature-files)
- [Tags](#tags)
- [Pre-created Test Data](#pre-created-test-data)
- [Step Definitions (`*.step.ts`)](#step-definitions-stepts)
- [Page Objects (`*.page.ts`)](#page-objects-pagets)
- [Working with GoA Web Components](#working-with-goa-web-components)
- [Making Tests Re-runnable](#making-tests-re-runnable)
- [Running Tests](#running-tests)
- [Checklist for a New Scenario](#checklist-for-a-new-scenario)

---

## Tooling

| Tool                                                                                                   | Purpose                                    |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| [Cypress](https://www.cypress.io/)                                                                     | Browser automation and API requests        |
| [`@badeball/cypress-cucumber-preprocessor`](https://github.com/badeball/cypress-cucumber-preprocessor) | Gherkin `.feature` files and step bindings |
| `@cypress/xpath`                                                                                       | `cy.xpath(...)` selectors                  |
| `cypress-axe` / `axe-html-reporter`                                                                    | Accessibility checks and HTML reports      |
| Nx (`@nx/cypress:cypress`)                                                                             | Runs the suite as the `e2e` target         |

## Folder Structure

```
apps/<app-name>-e2e/
├── .cypress-cucumber-preprocessorrc.js   # Step definition lookup and HTML report output
├── cypress.dev.config.js                 # Committed config per environment (no secrets)
├── cypress.staging.config.js             # "staging" = UAT
├── cypress.prod.config.js
├── cypress.<env>.config.local.js         # Local copy with secrets (git-ignored)
├── project.json
├── tsconfig.json / tsconfig.e2e.json
└── src/
    ├── fixtures/                         # Static test files (uploads, JSON payloads)
    ├── plugins/index.js                  # Node events: cucumber, browserify, custom cy.task()s
    ├── support/
    │   ├── index.ts                      # Loaded before every spec; fetches config and tokens
    │   ├── commands.ts                   # Custom commands: getConfig, postToken, login
    │   ├── app.po.ts                     # Shared helpers (e.g. injectAxe)
    │   └── axe-html-reporter-util.ts
    └── integration/
        ├── <feature-name>.feature        # One feature file per service or area
        ├── <feature-name>/
        │   ├── <feature-name>.step.ts    # Step definitions for that feature only
        │   └── <feature-name>.page.ts    # Page object (selectors) for that feature
        └── common/
            ├── common.steps.ts           # Steps shared by all features
            ├── common.page.ts            # Shared selectors (login, menus, modals, tabs)
            └── common-library.ts         # Shared helper functions (login, menu nav, placeholders)
```

Rules:

- The `.feature` file sits in `src/integration/`. Its step and page files sit in a sibling folder with the **same name**
  (for example `form.feature`, `form/form.step.ts` and `form/form.page.ts`).
- The preprocessor config only loads steps from `src/integration/[filepath]/*.step(s).ts` and
  `src/integration/common/common.steps.ts`. A step defined in `form.step.ts` is **not** visible to `task.feature`. If
  a step is needed by more than one feature, put it in `common.steps.ts`.
- Use kebab-case file and folder names.

## Configuration and Environment Variables

Each environment has a committed config file: `cypress.dev.config.js`, `cypress.staging.config.js` (UAT) and
`cypress.prod.config.js`. These files hold `baseUrl`, the tenant name, realm, test user emails and other
**non-secret** values in the `env` block.

**Never commit secrets.** Secret keys exist in the committed configs but are left empty:

```js
env: {
  'env-name': 'UAT',
  TAGS: '',
  tenantName: 'autotest',
  email: 'auto.test@gov.ab.ca',
  password: '',            // secret: supplied at runtime
  clientSecret: '',        // secret: supplied at runtime
  coreApiClientSecret: '', // secret: supplied at runtime
  'autotest-admin-token': '', // filled by postToken
  formServiceApiUrl: '',      // filled by getConfig
  ...
}
```

Secrets are supplied at runtime:

- **CI (GitHub Actions)**: [`.github/actions/nx-cypress-e2e/action.yml`](.github/actions/nx-cypress-e2e/action.yml)
  passes them as `cypress_<envKey>` environment variables (for example `cypress_password`, `cypress_clientSecret`).
  Cypress maps any `CYPRESS_*` / `cypress_*` variable into `Cypress.env('<envKey>')`.
- **Local runs**: copy the committed config to `cypress.<env>.config.local.js` and fill in the secrets. The pattern
  `**/cypress.*.local.js` is in `.gitignore`. Do not print or paste the contents of local config files.

Guidelines:

- Read values through `Cypress.env('<key>')`. Never hard-code URLs, users, realms or passwords in steps.
- When a new environment value is needed, add the key to **all** committed environment configs (empty if secret),
  and to the CI action if it is a secret.
- Feature files may reference environment values with `{key}` syntax when a step supports it, for example
  `When the user enters "{email2}" and "{password2}", and clicks login button`.
- Keep environment-specific behaviour in config, not in `if (env === ...)` branches in steps.

## Tokens and Service URLs

[`src/support/index.ts`](apps/tenant-management-webapp-e2e/src/support/index.ts) runs two `it()` blocks before the
scenarios in every spec:

1. `cy.getConfig()` reads `config/config.json` from the web app and stores each service URL in `Cypress.env`
   (`formServiceApiUrl`, `configurationServiceApiUrl`, `tenantManagementApi`, and so on).
2. `cy.postToken()` requests tokens from Keycloak and stores them in `Cypress.env`:
   - `autotest-admin-token`: tenant admin token for the test tenant realm.
   - `core-api-token`: token for the core realm (platform level APIs).

Both commands live in [`src/support/commands.ts`](apps/tenant-management-webapp-e2e/src/support/commands.ts).

In steps, use the stored URLs and tokens. Do not request new tokens inside a step:

```ts
cy.request({
  method: 'DELETE',
  url: Cypress.env('configurationServiceApiUrl') + '/configuration/v2/configuration/...',
  auth: { bearer: Cypress.env('autotest-admin-token') },
  failOnStatusCode: false,
});
```

If a new service URL or token type is required, add it to `getConfig` or `postToken` in `commands.ts`, declare the
command type in the `Cypress.Chainable` interface, and add the matching empty key to each config file.

## Feature Files

- One `Feature:` per file, tagged with the feature name (for example `@form`).
- Write scenarios as user stories: `Scenario: As a <role>, I can <action>, so <benefit>`.
- Use `Given` for preconditions (login, navigation, data clean-up), `When` for actions and `Then` for assertions.
- Prefer UI steps for UI stories. Use API steps for API stories and for data setup or clean-up.
- Use `# comments` inside a scenario to label sections, for example `# Add a new tag`.
- Use the `<$ph>` placeholder in names that must be unique per run. The step replaces it through
  `commonlib.stringReplacement(name, replacementString)`, for example `"autotest-aedType<$ph>"`.

### Reuse steps before writing new ones

Before adding a step:

1. Search `common/common.steps.ts` and the feature's own `*.step.ts` for an existing step with the same intent.
2. Reuse parameterised steps (`{string}`) rather than adding a near-duplicate. For example
   `the user views a notification message of {string}` and
   `the user clicks Delete button in delete confirmation modal` already exist in `common.steps.ts`.
3. If a new step is generic (login, menu navigation, confirmation modals, waits), add it to `common.steps.ts`.
4. If a new step is specific to a page, tab or modal, include that context in the step text so it cannot clash with
   other steps, for example `... in Access requests tab` or `... in Add question modal`.

Cucumber fails a scenario when a step text matches more than one definition, so step text must be unique across the
feature's step file and `common.steps.ts`.

Quote all `{string}` arguments in the feature, including single words, for example
`the user views "Access requests" checkbox as "checked" in Access requests tab`.

## Tags

Every scenario is tagged above the `Scenario:` line:

```gherkin
# TEST DATA: a form definition named "autotest-form-tags" is precreated; all tags in the form definition are deleted
@TEST_CS-3927 @REQ_CS-3589 @regression
Scenario: As a tenant admin, I can add, edit and delete tags for a form definition and view them in details view
```

| Tag               | Meaning                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `@TEST_CS-<n>`    | **Required.** Jira test case key. Add one per test case the scenario covers.                  |
| `@REQ_CS-<n>`     | **Required.** Jira story or requirement key the scenario verifies. Add one per story.         |
| `@regression`     | Included in the nightly regression run. Add it to every stable scenario.                      |
| `@prod`           | Safe to run against production (read-only or self-cleaning, no prod-only side effects).       |
| `@smoke-test`     | Small, fast health check set.                                                                 |
| `@accessibility`  | Runs axe accessibility checks.                                                                |
| `@api`            | API-only scenario (no UI).                                                                    |
| `@ignore`         | Temporarily excluded (for example a known product bug). Add a comment with the reason/ticket. |
| `@<feature-name>` | Feature-level tag on the `Feature:` line, for example `@form`.                                |

Rules:

- Use the exact Jira keys, uppercase, with `_` after `TEST` / `REQ` and `-` before the number.
- Don't remove `@regression` to hide a failure. Use `@ignore` with a comment and a ticket reference.

## Pre-created Test Data

Some scenarios depend on data that the test does not create, such as form definitions, task queues or roles. This
data lives in the test tenant (`autotest`) in each environment and must exist before the test runs.

- Document every dependency with a `# TEST DATA:` comment directly above the scenario's tags:

  ```gherkin
  # TEST DATA: a form definition named "autotest-submission-task" is precreated
  # TEST DATA: a task queue named autotest:testSubmissionQueue is precreated
  @TEST_CS-2780 @REQ_CS-2570 @regression
  ```

- Prefix pre-created resource names with `autotest-` and use the description `DO NOT DELETE` where the resource has a
  description field.
- Name the specific state the data must be in (for example "with an open intake period in the past" or "all tags are
  deleted").
- Create the same data in every environment the scenario is tagged for (dev, UAT, and production if `@prod`).
- Don't modify shared pre-created data in a way another scenario depends on. If a scenario changes it, the scenario
  must restore it.

## Step Definitions (`*.step.ts`)

Example: [`form/form.step.ts`](apps/tenant-management-webapp-e2e/src/integration/form/form.step.ts).

```ts
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import commonlib from '../common/common-library';
import common from '../common/common.page';
import FormPage from './form.page';

const commonObj = new common();
const formObj = new FormPage();

Given('a tenant admin user is on form definitions page', function () {
  commonlib.tenantAdminDirectURLLogin(
    Cypress.config().baseUrl,
    Cypress.env('realm'),
    Cypress.env('email'),
    Cypress.env('password')
  );
  commonlib.tenantAdminMenuItem('Form', 2000);
  commonObj.serviceTab('Form', 'Definitions').click();
});
```

Rules:

- Steps hold **behaviour and assertions only**. All selectors live in the page object.
- Use `function () { ... }` (not arrow functions) so the Cucumber world `this` is available.
- Type step parameters (`function (name: string)`).
- Use `commonlib` helpers for login and menu navigation instead of repeating the flow.
- Use the stored tokens and URLs from `Cypress.env` for API calls. Set `failOnStatusCode: false` when the step asserts
  on error status codes or when a clean-up resource may not exist.
- Put lookup tables (label to test ID) in a `const` near the steps that use them.
- Type text with a delay to avoid dropped characters in GoA inputs:

  ```ts
  formObj.someInput().shadow().find('input').clear().type(value, { force: true, delay: 200 });
  ```

- Prefer `.should(...)` assertions, which retry, over fixed `cy.wait(ms)`. Use a short `cy.wait` only for known
  redirects or animations, and add a comment explaining why.

## Page Objects (`*.page.ts`)

Example: [`form/form.page.ts`](apps/tenant-management-webapp-e2e/src/integration/form/form.page.ts).

```ts
class FormPage {
  addDefinitionBtn() {
    return cy.get('goa-button:contains("Add definition")');
  }

  addDefinitionNameTextField() {
    return cy.xpath('//goa-form-item[@label="Name"]/goa-input[@testid="form-definition-name"]');
  }

  accessRequestsQuestionDeleteIcon(name) {
    return cy.get(`[testid="access-request-question-delete-${name}"]`);
  }
}
export default FormPage;
```

Rules:

- One class per feature, default-exported, named `<Feature>Page`.
- Each method returns a Cypress chainable for **one** element (or element list). No clicks or assertions in page
  objects.
- Name methods after the page area and element: `<area><Element><Type>`, for example
  `definitionEditorSaveButton`, `accessRequestsTabField`.
- Selector priority:
  1. `testid` / `data-testid` attributes from the React source.
  2. Stable attributes such as `label`, `name` or `title`.
  3. Visible text, `:contains(...)` or xpath, as a last resort.
- Parameterise selectors (name, row number, label) instead of adding one method per item.
- Shared elements (login fields, menu, tabs, confirmation modals) belong in `common/common.page.ts`.

## Working with GoA Web Components

The UI uses GoA web components (`goa-button`, `goa-input`, `goa-checkbox`, `goa-dropdown`, `goa-icon-button`, ...).
Many render their native element inside a shadow root.

| Action                        | Pattern                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| Click a button or icon button | `el().shadow().find('button').click({ force: true })`                                  |
| Type into an input            | `el().shadow().find('input').clear().type(text, { force: true, delay: 200 })`          |
| Type into a textarea          | `el().shadow().find('textarea').clear().type(text, { force: true, delay: 200 })`       |
| Choose a dropdown option      | Click `shadow().find('input')`, then `shadow().find('li').contains(option).click(...)` |
| Check checkbox state          | `should('have.attr', 'checked')` / `should('not.have.attr', 'checked')`                |
| Check a form item error       | `goa-form-item[error="<exact message>"]`, including trailing punctuation               |

Notes:

- Clicking the `goa-icon-button` host directly can fail with "element is disabled". Click the inner shadow `button`.
- `goa-checkbox` sets `checked="checked"` when checked and removes the attribute when unchecked. Assert on presence,
  not on `"true"`.
- Copy expected messages from the React source so the text matches exactly.

## Making Tests Re-runnable

Regression tests run nightly against the same tenant, so each scenario must leave the environment in a state where it
can run again.

- **Clean up first**: reset state in the `Given` step (for example delete the configuration created by the last run
  through the API), rather than only at the end. A failed run then doesn't block the next one.
- **Clean up after**: delete anything the scenario created in the UI (definitions, tags, questions, subscriptions).
- Use `<$ph>` unique names when the scenario creates new resources, so leftovers don't collide.
- Don't depend on another scenario having run first. Each scenario must stand alone.

## Running Tests

Run the suite against an environment with a local config:

```bash
npx cypress run \
  --project apps/tenant-management-webapp-e2e \
  --config-file cypress.staging.config.local.js \
  --spec "<absolute path to>/apps/tenant-management-webapp-e2e/src/integration/form.feature" \
  --env TAGS="@TEST_CS-3927" \
  --browser chrome
```

- `--config-file` is resolved relative to `--project`. Pass `--spec` as an absolute path.
- `TAGS` accepts a Cucumber tag expression, for example `"@regression and not @ignore"`.
- Open the interactive runner with `npx cypress open --project apps/tenant-management-webapp-e2e --config-file
cypress.staging.config.local.js`.
- Reports, screenshots and the cucumber HTML report are written to `dist/cypress/apps/<app>-e2e/`.
- CI runs through `npx nx e2e <app>-e2e --dev-server-target='' --cypress-config=apps/<app>-e2e/cypress.<env>.config.js`
  with secrets passed as `cypress_*` variables.

Before committing:

```bash
npx prettier --check --trailing-comma es5 <changed .ts files>
npx nx lint <app>-e2e
```

Pass `--trailing-comma es5` to Prettier. The repo `.prettierrc` doesn't set it, and the Prettier 3 default (`all`)
would add trailing commas across existing files.

## Checklist for a New Scenario

- [ ] Scenario is in the right `<feature-name>.feature` file and written as a user story.
- [ ] Tagged with `@TEST_CS-<n>`, `@REQ_CS-<n>` and `@regression` (plus `@prod` only if prod-safe).
- [ ] Every pre-created dependency is listed in a `# TEST DATA:` comment and exists in each target environment.
- [ ] Existing steps were reused where possible. New shared steps are in `common.steps.ts`. New feature steps include
      page, tab or modal context in their text.
- [ ] Every new step has exactly one matching definition.
- [ ] Selectors are in `<feature-name>.page.ts` and use `testid` where available.
- [ ] No secrets or environment-specific values are hard-coded. New config keys were added to every environment config.
- [ ] API calls use `Cypress.env` URLs and the tokens from `postToken`.
- [ ] Typing uses `delay: 200`. GoA buttons are clicked through the shadow `button`.
- [ ] The scenario cleans up its own data and passes when run twice in a row.
- [ ] Prettier (`--trailing-comma es5`) and `nx lint` pass.
